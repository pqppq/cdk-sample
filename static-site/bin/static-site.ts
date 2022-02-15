#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { StaticSiteStack } from "../lib/static-site-stack";

/**
 * This stack relies on getting the domain name from CDK context.
 * Use 'cdk synth -c domain=mystaticsite.com -c subdomain=www'
 * Or add the following to cdk.json:
 * {
 *   "context": {
 *     "domain": "mystaticsite.com",
 *     "subdomain": "www",
 *     "accountId": 1234567890,
 *   }
 * }
 **/

const app = new cdk.App();
new StaticSiteStack(app, "StaticSiteStack", {
  env: {
    // account: '935838525253',
    //region: "us-east-1",
		account: process.env.CDK_DEFAULT_ACCOUNT,
		region:  process.env.CDK_DEFAULT_REGION
  },
});
