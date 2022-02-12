import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Stack,
  StackProps,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_s3 as s3,
  aws_s3objectlambda as s3ObjectLambda,
} from "aws-cdk-lib";

// configure access point name
const S3_ACCESS_POINT_NAME = "s3-object-lambda-ap";
const OBJECT_LAMBDA_ACCESS_POINT_NAME = "s3-object-lambda-ap";

export class S3ObjectLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // s3 access point
    const accessPoint = `arn:aws:s3:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:accesspoint/${S3_ACCESS_POINT_NAME}`;

    // setup a bucket
    const bucket = new s3.Bucket(this, "example-bucket", {
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["*"],
        principals: [new iam.AnyPrincipal()],
        resources: [bucket.bucketArn, bucket.arnForObjects("*")],
        conditions: {
          StringEquals: {
            "s3:DataAccessPointAccount": `${cdk.Aws.ACCOUNT_ID}`,
          },
        },
      })
    );

    // lambda to process our objects during retrieval
    const retrieveTransformedObjectLambda = new lambda.Function(
      this,
      "retrieveTransformedObjectLambda",
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset(
          "resources/retrieve-transformed-object-lambda"
        ),
      }
    );

    // object lambda s3 access
    retrieveTransformedObjectLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ["*"],
        actions: ["s3-object-lambda:WriteGetObjectResponse"],
      })
    );

    // associate bucket's access to be invoked from own account
    retrieveTransformedObjectLambda.addPermission("invocationRestriction", {
      action: "lambda:InvokeFunction",
      principal: new iam.AccountRootPrincipal(),
      sourceAccount: cdk.Aws.ACCOUNT_ID,
    });

    // associate bucket's access point with lambda get access
    const policyDoc = new iam.PolicyDocument();
    const policyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["s3:GetObject"],
      principals: [
        new iam.ArnPrincipal(
          retrieveTransformedObjectLambda.role?.roleArn as string
        ),
      ],
      resources: [`${accessPoint}/object/*`],
    });
    policyStatement.sid = "AllowLambdaToUseAccessPoint";
    policyDoc.addStatements(policyStatement);

    // create s3 access point
    const s3BucketAccessPoint = new s3.CfnAccessPoint(this, "s3AccessPoint", {
      bucket: bucket.bucketName,
      name: S3_ACCESS_POINT_NAME,
      policy: policyDoc,
    });

    // create access point to receive GET request and use lambda to process objects
    const objectLambdaAccessPoint = new s3ObjectLambda.CfnAccessPoint(
      this,
      "s3ObjectLambdaAccessPoint",
      {
        name: OBJECT_LAMBDA_ACCESS_POINT_NAME,
        objectLambdaConfiguration: {
          supportingAccessPoint: accessPoint,
          transformationConfigurations: [
            {
              actions: ["GetObject"],
              contentTransformation: {
                AwsLambda: {
                  FunctionArn: `${retrieveTransformedObjectLambda.functionArn}`,
                },
              },
            },
          ],
        },
      }
    );

    new cdk.CfnOutput(this, "exampleBucketArn", { value: bucket.bucketArn });
    new cdk.CfnOutput(this, "objectLambdaArn", {
      value: retrieveTransformedObjectLambda.functionArn,
    });
    new cdk.CfnOutput(this, "objectLambdaAccessPointArn", {
      value: objectLambdaAccessPoint.attrArn,
    });
    new cdk.CfnOutput(this, "objectLambdaAccessPointUrl", {
      value: `https://console.aws.amazon.com/s3/olap/${cdk.Aws.ACCOUNT_ID}/${OBJECT_LAMBDA_ACCESS_POINT_NAME}?region=${cdk.Aws.REGION}`,
    });
  }
}
