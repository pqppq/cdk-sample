#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { EcsServiceWithLoggingStack } from "../lib/ecs-service-with-logging-stack";

const app = new cdk.App();
new EcsServiceWithLoggingStack(app, "EcsServiceWithLoggingStack");
