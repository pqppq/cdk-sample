import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_ecs_patterns as patterns,
  aws_autoscaling as asg,
} from "aws-cdk-lib";

/**
 * - Cluster
 * - Capacity Provider
 * - Auto Scaling Group
 * - Service
 */

// The port range to open up for dynamic port mapping
const EPHEMERAL_PORT_RANGE = ec2.Port.tcpRange(32768, 65535);

export class EcsNetworkLoadBalancerServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // For better iteration speed, it might make sense to put this VPC into
    // a separate stack and import it here. We then have two stacks to
    // deploy, but VPC creation is slow so we'll only have to do that once
    // and can iterate quickly on consuming stacks. Not doing that for now.
    const vpc = new ec2.Vpc(this, "MyVpc", {
      maxAzs: 2,
    });
    const cluster = new ecs.Cluster(this, "EC2Cluster", {
      vpc,
    });
    const capacityProvider = new ecs.AsgCapacityProvider(
      this,
      "AutoScalingCapacityProvider",
      {
        capacityProviderName: "DefaultCapacityProvider",
        autoScalingGroup: new asg.AutoScalingGroup(this, "ASG", {
          vpc,
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.BURSTABLE2,
            ec2.InstanceSize.MICRO
          ),
          machineImage: new ec2.AmazonLinuxImage(), // get the latest Amazon Linux image
        }),
        enableManagedTerminationProtection: false,
      }
    );
    cluster.addAsgCapacityProvider(capacityProvider);

    // Instantiate ECS service with just cluster and image
    const ecsService = new patterns.NetworkLoadBalancedEc2Service(
      this,
      "EC2Service",
      {
        cluster,
        memoryLimitMiB: 512,
        taskImageOptions: {
          image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
        },
      }
    );

    ecsService.service.connections.allowFromAnyIpv4(EPHEMERAL_PORT_RANGE);
  }
}
