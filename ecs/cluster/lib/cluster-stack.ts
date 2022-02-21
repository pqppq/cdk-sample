import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_autoscaling as autoscaling,
} from "aws-cdk-lib";

export class ClusterStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "VPC", {
      maxAzs: 2,
      // subnetConfiguration: {
      // @default - The VPC CIDR will be evenly divided between 1 public and 1
      // private subnet per AZ.
      // }
    });

    // managed sets of ec2 instances
    const asg = new autoscaling.AutoScalingGroup(this, "AutoScalingGroup", {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ecs.EcsOptimizedImage.amazonLinux2(),
      desiredCapacity: 3,
    });

		// ECS Cluster
    const cluster = new ecs.Cluster(this, "MyEcsCluster", {
      vpc,
      clusterName: "MyEcsCluster",
    });
    const capacityProvider = new ecs.AsgCapacityProvider(
      this,
      "AsgCapacityProvider",
      {
        autoScalingGroup: asg,
      }
    );
    cluster.addAsgCapacityProvider(capacityProvider);
  }
}
