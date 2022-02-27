import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_ecs_patterns as patterns,
} from "aws-cdk-lib";

export class FargateApplicationLoadBalancedServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
    });

    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc,
    });

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "FargateTaskDefinition",
      {
        cpu: 256,
        memoryLimitMiB: 512,
      }
    );
    const container = taskDefinition.addContainer("WebContainer", {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
    });

    const service = new ecs.FargateService(this, "FargateService", {
      cluster,
      taskDefinition,
    });
  }
}
