import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import {
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_elasticloadbalancingv2 as elbv2,
  aws_autoscaling as asg,
  aws_ecs_patterns as patterns,
} from "aws-cdk-lib";

/*
 * - Cluster
 * - Task Definition
 * - Service
 * - Application Load Balancer
 */
export class EcsServiceWithAdvancedAlbConfigStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "VPC", {
      maxAzs: 2,
    });

    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc,
    });
    cluster.addCapacity("DefaultAutoScalingGroup", {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
    });

    // const capacityProvider = new ecs.AsgCapacityProvider(
    //   this,
    //   "AutoScalingCapacityProvider",
    //   {
    //     capacityProviderName: "CapacityProvider",
    //     autoScalingGroup: new asg.AutoScalingGroup(this, "ASG", {
    //       vpc,
    //       instanceType: new ec2.InstanceType("t2.micro"),
    //       machineImage: ecs.EcsOptimizedImage.amazonLinux2(), // get the latest Amazon Linux image
    //     }),
    //     enableManagedTerminationProtection: false,
    //     machineImageType: ecs.MachineImageType.AMAZON_LINUX_2,
    //   }
    // );
    // cluster.addAsgCapacityProvider(capacityProvider);

    const taskDefinition = new ecs.Ec2TaskDefinition(this, "TaskDefinition");
    const container = taskDefinition.addContainer("Web", {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      memoryLimitMiB: 256,
      portMappings: [
        {
          containerPort: 80,
          hostPort: 8080,
          protocol: ecs.Protocol.TCP,
        },
      ],
    });

    const service = new patterns.ApplicationLoadBalancedEc2Service(
      this,
      "ApplicationLoadBalancedEC2Service",
      {
        cluster,
        taskDefinition,
        publicLoadBalancer: true,
        listenerPort: 80,
      }
    );
    service.loadBalancer.addListener;
    service.targetGroup.configureHealthCheck({
      interval: cdk.Duration.seconds(60),
      path: "/health",
      timeout: cdk.Duration.seconds(5),
    });

    // const service = new ecs.Ec2Service(this, "Service", {
    //   cluster,
    //   taskDefinition,
    //   capacityProviderStrategies: [
    //     {
    //       capacityProvider: capacityProvider.capacityProviderName,
    //       weight: 1,
    //     },
    //   ],
    // });

    // // create application load balancer
    // const alb = new elbv2.ApplicationLoadBalancer(this, "ALB", {
    //   vpc,
    //   internetFacing: true,
    // });

    // const listener = alb.addListener("PublicListener", {
    //   port: 80,
    //   open: true,
    // });
    // listener.addTargets("ECS", {
    //   port: 80,
    //   targets: [
    //     service.loadBalancerTarget({
    //       containerName: "Web",
    //       containerPort: 80,
    //     }),
    //   ],
    //   // include health check (default is none)
    //   healthCheck: {
    //     interval: cdk.Duration.seconds(60),
    //     path: "/health",
    //     timeout: cdk.Duration.seconds(5),
    //   },
    // });
  }
}
