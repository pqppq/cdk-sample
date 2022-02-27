#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { FargateApplicationLoadBalancedServiceStack } from "../lib/fargate-application-load-balanced-service-stack";

const app = new cdk.App();
new FargateApplicationLoadBalancedServiceStack(
  app,
  "FargateApplicationLoadBalancedServiceStack",
  {}
);
