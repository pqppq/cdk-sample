import * as cdk from "aws-cdk-lib";
import { Stack, StackProps, CfnOutput, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  aws_iam as iam,
  aws_certificatemanager as acm,
  aws_s3 as s3,
  aws_s3_deployment as s3deploy,
  aws_route53 as route53,
  aws_route53_targets as targets,
  aws_cloudfront as cloudfront,
  aws_cloudwatch as cloudwatch,
} from "aws-cdk-lib";

export interface StaticSiteProps {
  domain: string;
  subdomain: string;
}

/**
 * Static site infrastructure, which deploys site contents to an S3 bucket
 *
 * The site redirects from HTTP to HTTPS, using CloudFront distribution,
 * Route53 alias record, and ACM certificate.
 *
 */

export class StaticSiteStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    new StaticSite(this, "StaticSite", {
      domain: this.node.tryGetContext("domain"),
      subdomain: this.node.tryGetContext("subdomain"),
    });
  }
}

class StaticSite extends Construct {
  constructor(scope: Stack, id: string, props: StaticSiteProps) {
    super(scope, id);

    const siteDomain = `${props.subdomain}.${props.domain}`;
    const zone = new route53.PublicHostedZone(this, "HostedZone", {
      zoneName: props.domain,
    });

    // new acm.Certificate(this, "Certificate", {
    //   domainName: siteDomain,
    //   validation: acm.CertificateValidation.fromDns(zone),
    // });

    // const zone = route53.HostedZone.fromLookup(scope, "Zone", {
    //   domainName: props.domain,
    // });
    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(
      this,
      "cloudfront-OAI",
      {
        comment: `OAI for ${id}`,
      }
    );

    new CfnOutput(this, "Site", { value: `https://${siteDomain}` });

    // contents s3 bucket
    const siteBucket = new s3.Bucket(this, "StaticSiteBucket", {
      bucketName: "contents-bucket",
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "error.html",
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

      /**
       * The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
       * the new bucket, and it will remain in your account until manually deleted. By setting the policy to
       * DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
       */
      removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code

      /**
       * For sample purposes only, if you create an S3 bucket then populate it, stack destruction fails.  This
       * setting will enable full cleanup of the demo.
       */
      autoDeleteObjects: true, // NOT recommended for production code
    });

    // grant access to cloudfront
    siteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [siteBucket.arnForObjects("*")],
        principals: [
          new iam.CanonicalUserPrincipal(
            cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );
    new CfnOutput(this, "Bucket", { value: siteBucket.bucketName });
    new CfnOutput(this, "BucketArn", { value: siteBucket.bucketArn });

    // TLS certificate
    const certificate = new acm.DnsValidatedCertificate(
      this,
      "SiteCertificate",
      {
        domainName: siteDomain,
        hostedZone: zone,
        region: cdk.Aws.REGION,
      }
    );


    certificate.metricDaysToExpiry = () =>
      new cloudwatch.Metric({
        namespace: "TLS Viewer Certificate Validity",
        metricName: "TLS Viewer Certificate Expired",
        region: cdk.Aws.REGION,
        account: cdk.Aws.ACCOUNT_ID,
      });

    // specifies viewers to use HTTPS & TLS v1.2 to request your objects
    const viewerCertificate = cloudfront.ViewerCertificate.fromAcmCertificate(
      certificate,
      {
        sslMethod: cloudfront.SSLMethod.SNI,
        securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        aliases: [siteDomain],
      }
    );

    // cloudformation distribution
    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "SiteDistribution",
      {
        viewerCertificate: viewerCertificate,
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: siteBucket,
              originAccessIdentity: cloudfrontOAI,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
                compress: true,
                allowedMethods:
                  cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
              },
            ],
          },
        ],
      }
    );
    new CfnOutput(this, "DistributionId", {
      value: distribution.distributionId,
    });

    // route53 alias record for the cloudfront distribution
    new route53.ARecord(this, "SiteAliasRecord", {
      recordName: siteDomain,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
      zone,
    });

    // deploy site contents to s3 bucket
    new s3deploy.BucketDeployment(this, "DeployWithInvalidation", {
      sources: [s3deploy.Source.asset("./site-contents")],
      destinationBucket: siteBucket,
      distribution: distribution,
      distributionPaths: ["/*"],
    });
  }
}
