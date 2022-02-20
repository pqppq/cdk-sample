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
  aws_cloudfront_origins as origins,
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
    // DNS host zone
    const zone = route53.HostedZone.fromLookup(this, "Zone", {
      domainName: props.domain,
    });
    // cloud front origin access identity
    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(
      this,
      "cloudfront-OAI",
      {
        comment: `OAI for ${id}`,
      }
    );

    // contents s3 bucket
    const siteBucket = new s3.Bucket(this, "StaticSiteBucket", {
      bucketName: siteDomain,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "error.html",
      // publicReadAccess: true,
      // blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

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
        effect: iam.Effect.ALLOW,
        principals: [
					cloudfrontOAI.grantPrincipal
          // new iam.CanonicalUserPrincipal(
          //   cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
          // ),
        ],
        resources: [`${siteBucket.bucketArn}/*`],
      })
    );

    const certificate = new acm.DnsValidatedCertificate(
      this,
      "SiteCertificate",
      {
        hostedZone: zone,
        domainName: siteDomain,

        /**
         * This is needed especially for certificates used for CloudFront distributions,
         * which require the region to be us-east-1.
         */
        region: "us-east-1",
      }
    );
    certificate.metricDaysToExpiry = () =>
      new cloudwatch.Metric({
        namespace: "Certificate Validity",
        metricName: "Certificate Expired",
        account: cdk.Aws.ACCOUNT_ID,
        // period: ___
      });

    // cloudformation distribution
    const distribution = new cloudfront.Distribution(this, "SiteDistribution", {
      defaultBehavior: {
				origin: new origins.S3Origin(siteBucket, {
					originAccessIdentity: cloudfrontOAI
				}),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        compress: true,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      domainNames: [siteDomain],
      certificate: certificate,
			
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

    new CfnOutput(this, "BucketArn", { value: siteBucket.bucketArn });
    new CfnOutput(this, "DistributionId", {
      value: distribution.distributionId,
    });
    new CfnOutput(this, "Site URL", { value: `https://${siteDomain}` });
  }
}
