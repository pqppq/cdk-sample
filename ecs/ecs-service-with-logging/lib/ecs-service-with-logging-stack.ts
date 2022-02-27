import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_autoscaling as asg,
} from "aws-cdk-lib";

export class EcsServiceWithLoggingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
    });

    const cluster = new ecs.Cluster(this, "EC2Cluster", {
      vpc,
    });
    const capacityProvider = new ecs.AsgCapacityProvider(
      this,
      "CapacityProvider",
      {
        capacityProviderName: "CapacityProvider",
        autoScalingGroup: new asg.AutoScalingGroup(this, "AutoScalingGroup", {
          vpc,
          instanceType: new ec2.InstanceType("t2.micro"),
          machineImage: ecs.EcsOptimizedImage.amazonLinux2(),
        }),
        enableManagedTerminationProtection: false,
        // machineImageType: ecs.MachineImageType.AMAZON_LINUX_2,
      }
    );
    cluster.addAsgCapacityProvider(capacityProvider);

    const logging = new ecs.AwsLogDriver({
      streamPrefix: "myapp",
    });

    const taskDefinition = new ecs.Ec2TaskDefinition(this, "TaskDefinition");
    taskDefinition.addContainer("Container", {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      memoryLimitMiB: 512,
      logging,
    });

    const service = new ecs.Ec2Service(this, "EC2Service", {
      cluster,
      taskDefinition,
    });
  }
}
