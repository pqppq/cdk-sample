#!/usr/bin/env node
import { Stack, StackProps, CfnOutput, App } from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_ec2 as ec2, aws_ecs as ecs } from "aws-cdk-lib";
import {
  SplitAtListener_LoadBalancerStack,
  SplitAtListener_ServiceStack,
} from "../lib/split-at-listener";
import {
  SplitAtTargetGroup_LoadBalancerStack,
  SplitAtTargetGroup_ServiceStack,
} from "../lib/split-at-targetgroup";

/*
 * shared infrastructure(VPC, Cluster)
 */
class SharedInfraStructure extends Stack {
  public readonly vpc: ec2.Vpc;
  public readonly cluster: ecs.Cluster;

  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
    });
    this.cluster = new ecs.Cluster(this, "Cluster", {
      vpc: this.vpc,
    });
  }
}

const app = new App();
const infra = new SharedInfraStructure(
  app,
  "CrossStackLordBalancerInfraStructure"
);

const splitAtListenerLoadBalancerStack = new SplitAtListener_LoadBalancerStack(
  app,
  "SplitAtListenerLoadBalancerStack",
  {
    vpc: infra.vpc,
  }
);

new SplitAtListener_ServiceStack(app, "SplitAtListenerServiceStack", {
  cluster: infra.cluster,
  loadBalancer: splitAtListenerLoadBalancerStack.alb,
});

const splitAtTargetGroupLoadBalancerStack = new SplitAtTargetGroup_LoadBalancerStack(
  app,
  "SplitAtTargetGroupLoadBalancerStack",
  {
    vpc: infra.vpc,
  }
);

new SplitAtTargetGroup_ServiceStack(app, "SplitAtTargetGroupServiceStack", {
  cluster: infra.cluster,
  targetGroup: splitAtTargetGroupLoadBalancerStack.targetGroup,
});
