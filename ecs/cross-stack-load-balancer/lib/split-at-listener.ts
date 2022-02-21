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
export interface SplitAtListener_LoadBalancerStackProps extends StackProps {
  vpc: ec2.Vpc;
}

export class SplitAtListener_LoadBalancerStack extends Stack {
  public readonly alb: elbv2.ApplicationLoadBalancer;

  constructor(
    scope: Construct,
    id: string,
    props: SplitAtListener_LoadBalancerStackProps
  ) {
    super(scope, id, props);

    this.alb = new elbv2.ApplicationLoadBalancer(
      this,
      "ApplicationLoadBalancer",
      {
        vpc: props.vpc,
        internetFacing: true,
      }
    );

    new CfnOutput(this, "LoadBalancerDNS", {
      value: this.alb.loadBalancerDnsName,
    });
  }
}

/*
 * Service stack
 */
export interface SplitAtListener_ServiceStackProps extends StackProps {
  cluster: ecs.Cluster;
  loadBalancer: elbv2.ApplicationLoadBalancer;
}

export class SplitAtListener_ServiceStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: SplitAtListener_ServiceStackProps
  ) {
    super(scope, id, props);

    // standard ECS service setup
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "TaskDifinition"
    );

    // add container defenition
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

    // create a new listener in the current scope
    // and add target to it
    const listener = new elbv2.ApplicationListener(this, "ALB Listener", {
      loadBalancer: props.loadBalancer,
      port: 80,
    });

    listener.addTargets("ECS", {
      port: 80,
      targets: [service],
    });
  }
}
