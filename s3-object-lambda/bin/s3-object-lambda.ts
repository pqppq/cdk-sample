#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { S3ObjectLambdaStack } from "../lib/s3-object-lambda-stack";

const app = new cdk.App();
new S3ObjectLambdaStack(app, "S3ObjectLambdaStack", {
  env: {
    account: app.node.tryGetContext("accountId"),
    /**
     * Stack must be in us-east-1, because the ACM certificate for a
     * global CloudFront distribution must be requested in us-east-1.
     */
    region: "us-east-1",
  },
});
