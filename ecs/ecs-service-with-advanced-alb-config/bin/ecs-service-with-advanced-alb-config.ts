#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { EcsServiceWithAdvancedAlbConfigStack } from "../lib/ecs-service-with-advanced-alb-config-stack";

const app = new cdk.App();
new EcsServiceWithAdvancedAlbConfigStack(
  app,
  "EcsServiceWithAdvancedAlbConfigStack",
  {}
);
