import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_elasticloadbalancingv2 as elbv2,
} from "aws-cdk-lib";

/*
 * Load balancer stack
 */
export interface SplitAtTargetGroup_LoadBalancerStackProps extends StackProps {
  vpc: ec2.Vpc;
}

export class SplitAtTargetGroup_LoadBalancerStack extends Stack {
  public readonly targetGroup: elbv2.ApplicationTargetGroup;
  constructor(
    scope: Construct,
    id: string,
    props: SplitAtTargetGroup_LoadBalancerStackProps
  ) {
    super(scope, id, props);

    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      "ApplicationLoadBalancer",
      {
        vpc: props.vpc,
        internetFacing: true,
      }
    );

    this.targetGroup = new elbv2.ApplicationTargetGroup(this, "TargetGroup", {
      vpc: props.vpc,
      port: 80,
    });

    alb.addListener("ALB Listener", {
      port: 80,
      defaultTargetGroups: [this.targetGroup],
    });

    new CfnOutput(this, "LoadbalancerDNS", {
      value: alb.loadBalancerDnsName,
    });
  }
}

/*
 * Service stack
 */
export interface SplitAtTargetGroup_ServiceStackProps extends StackProps {
  cluster: ecs.Cluster;
  targetGroup: elbv2.ApplicationTargetGroup;
}

export class SplitAtTargetGroup_ServiceStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: SplitAtTargetGroup_ServiceStackProps
  ) {
    super(scope, id, props);

    // standart ECS service setup
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "TaskDefinition"
    );
    const container = taskDefinition.addContainer("Container", {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      memoryLimitMiB: 256,
    });

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    const service = new ecs.FargateService(this, "FargateService", {
      cluster: props.cluster,
      taskDefinition,
    });

    // add service to targetGrop which defined in the other stack
    props.targetGroup.addTarget(service);
  }
}
