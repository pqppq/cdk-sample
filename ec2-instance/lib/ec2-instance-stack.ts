import * as cdk from "aws-cdk-lib";
import {
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_secretsmanager as secretsmanager,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Asset } from "aws-cdk-lib/aws-s3-assets";
import { Construct } from "constructs";

import { KeyPair } from "cdk-ec2-key-pair";

import * as path from "path";

export class Ec2InstanceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // create new VPC with 2 subnets
    // constructor Vpc(scope: Construct, id: string, props?: ec2.VpcProps | undefined): ec2.Vpc
    const vpc = new ec2.Vpc(this, "VPC", {
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "asterisk", // logical name for thie subnet
          subnetType: ec2.SubnetType.PUBLIC, // public subnet
        },
      ],
    });

    // allow ssh access from anywhere
    const securityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {
      vpc,
      description: "Allow SSH in-bound traffic",
      allowAllOutbound: true, // Whether to allow all outbound traffic by default.
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(), // Any IPv4 address
      ec2.Port.tcp(22), // TCP port 22
      "Allow SSH Access"
    );

    const role = new iam.Role(this, "ec2Role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"), // IAM principal
    });
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );

    // use latest AMI - cpu type arm64
    const ami = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: ec2.AmazonLinuxCpuType.ARM_64,
    });

    //Create a Key Pair to be used with this EC2 Instance
    const key = new KeyPair(this, "KeyPair", {
      name: "cdk-ec2-instance-keypair",
      description: "Key Pair created with CDK Deployment",
      storePublicKey: true,
    });
    key.grantReadOnPublicKey(role);

    // create the instance using secyrity group, AMI, and keypair defined in the VPC created
    const instance = new ec2.Instance(this, "Instance", {
      vpc,
      machineImage: ami,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MICRO
      ),
      securityGroup: securityGroup,
      keyName: key.keyPairName,
      role: role,
    });

    // create an asset that will be used as part of user data to run first load
    // An asset represents a local file or directory, which is automatically uploaded to S3 and then can be referenced within a CDK application.(ex. handler code for a Lambda)
    const asset = new Asset(this, "Asset", {
      path: path.join(__dirname, "../src/config.sh"),
    });

    // local path that the file will be downloaded to
    const localPath = instance.userData.addS3DownloadCommand({
      bucket: asset.bucket,
      bucketKey: asset.s3ObjectKey,
    });

    instance.userData.addExecuteFileCommand({
      filePath: localPath,
      arguments: "--verbose -y",
    });

    asset.grantRead(instance.role);

    // create output for connectiong
    new cdk.CfnOutput(this, "IP Address", { value: instance.instancePublicIp });
    new cdk.CfnOutput(this, "Key Name", { value: key.keyPairName });
    new cdk.CfnOutput(this, "Download Key Command", {
      value:
        "aws secretsmanager get-secret-value --secret-id ec2-ssh-key/cdk-keypair/private --query SecretString --output text > cdk-key.pem && chmod 400 cdk-key.pem",
    });
    new cdk.CfnOutput(this, "ssh command", {
      value:
        "ssh -i cdk-key.pem -o IdentitiesOnly=yes ec2-user@" +
        instance.instancePublicIp,
    });
  }
}
