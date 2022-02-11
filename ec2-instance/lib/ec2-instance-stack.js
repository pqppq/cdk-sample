"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ec2InstanceStack = void 0;
const cdk = require("aws-cdk-lib");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_s3_assets_1 = require("aws-cdk-lib/aws-s3-assets");
const path = require("path");
class Ec2InstanceStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Create a Key Pair to be used with this EC2 Instance
        // Temporarily disabled since `cdk-ec2-key-pair` is not yet CDK v2 compatible
        // const key = new KeyPair(this, 'KeyPair', {
        //   name: 'cdk-keypair',
        //   description: 'Key Pair created with CDK Deployment',
        // });
        // key.grantReadOnPublicKey
        //         })
        // create new VPC with 2 subnets
        // constructor Vpc(scope: Construct, id: string, props?: ec2.VpcProps | undefined): ec2.Vpc
        const vpc = new aws_cdk_lib_1.aws_ec2.Vpc(this, "VPC", {
            natGateways: 0,
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: "asterisk",
                    subnetType: aws_cdk_lib_1.aws_ec2.SubnetType.PUBLIC,
                },
            ],
        });
        // allow ssh access from anywhere
        const securityGroup = new aws_cdk_lib_1.aws_ec2.SecurityGroup(this, "SecurityGroup", {
            vpc,
            description: "Allow SSH in-bound traffic",
            allowAllOutbound: true,
        });
        securityGroup.addIngressRule(aws_cdk_lib_1.aws_ec2.Peer.anyIpv4(), // Any IPv4 address
        aws_cdk_lib_1.aws_ec2.Port.tcp(22), // TCP port 22
        "Allow SSH Access");
        const role = new aws_cdk_lib_1.aws_iam.Role(this, "ec2Role", {
            assumedBy: new aws_cdk_lib_1.aws_iam.ServicePrincipal("ec2.amazonaws.com"),
        });
        role.addManagedPolicy(aws_cdk_lib_1.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"));
        // use latest AMI - cpu type arm64
        const ami = new aws_cdk_lib_1.aws_ec2.AmazonLinuxImage({
            generation: aws_cdk_lib_1.aws_ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
            cpuType: aws_cdk_lib_1.aws_ec2.AmazonLinuxCpuType.ARM_64,
        });
        // create the instance using secyrity group, AMI, and keypair defined in the VPC created
        const instance = new aws_cdk_lib_1.aws_ec2.Instance(this, "Instance", {
            vpc,
            machineImage: ami,
            instanceType: aws_cdk_lib_1.aws_ec2.InstanceType.of(aws_cdk_lib_1.aws_ec2.InstanceClass.T4G, aws_cdk_lib_1.aws_ec2.InstanceSize.MICRO),
            securityGroup: securityGroup,
            // keyName: key.keyPairName,
            role: role,
        });
        // create an asset that will be used as part of user data to run first load
        // An asset represents a local file or directory, which is automatically uploaded to S3 and then can be referenced within a CDK application.
        const asset = new aws_s3_assets_1.Asset(this, "Asset", {
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
        // new cdk.CfnOutput(this, 'Key Name', {value: key.keyPariName})
        new cdk.CfnOutput(this, "Download Key Command", {
            value: "aws secretsmanager get-secret-value --secret-id ec2-ssh-key/cdk-keypair/private --query SecretString --output text > cdk-key.pem && chmod 400 cdk-key.pem",
        });
        new cdk.CfnOutput(this, "ssh command", {
            value: "ssh -i cdk-key.pem -o IdentitiesOnly=yes ec2-user@" +
                instance.instancePublicIp,
        });
    }
}
exports.Ec2InstanceStack = Ec2InstanceStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWMyLWluc3RhbmNlLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWMyLWluc3RhbmNlLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQyw2Q0FBZ0Y7QUFDaEYsNkRBQWtEO0FBRWxELDZCQUE2QjtBQUU3QixNQUFhLGdCQUFpQixTQUFRLG1CQUFLO0lBQ3pDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBa0I7UUFDMUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDeEIsc0RBQXNEO1FBQ3RELDZFQUE2RTtRQUM3RSw2Q0FBNkM7UUFDN0MseUJBQXlCO1FBQ3pCLHlEQUF5RDtRQUN6RCxNQUFNO1FBQ04sMkJBQTJCO1FBQzNCLGFBQWE7UUFFYixnQ0FBZ0M7UUFDaEMsMkZBQTJGO1FBQzNGLE1BQU0sR0FBRyxHQUFHLElBQUkscUJBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtZQUNuQyxXQUFXLEVBQUUsQ0FBQztZQUNkLG1CQUFtQixFQUFFO2dCQUNuQjtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsVUFBVTtvQkFDaEIsVUFBVSxFQUFFLHFCQUFHLENBQUMsVUFBVSxDQUFDLE1BQU07aUJBQ2xDO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCxpQ0FBaUM7UUFDakMsTUFBTSxhQUFhLEdBQUcsSUFBSSxxQkFBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ2pFLEdBQUc7WUFDSCxXQUFXLEVBQUUsNEJBQTRCO1lBQ3pDLGdCQUFnQixFQUFFLElBQUk7U0FDdkIsQ0FBQyxDQUFDO1FBRUgsYUFBYSxDQUFDLGNBQWMsQ0FDMUIscUJBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsbUJBQW1CO1FBQ3ZDLHFCQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxjQUFjO1FBQ2hDLGtCQUFrQixDQUNuQixDQUFDO1FBRUYsTUFBTSxJQUFJLEdBQUcsSUFBSSxxQkFBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFO1lBQ3pDLFNBQVMsRUFBRSxJQUFJLHFCQUFHLENBQUMsZ0JBQWdCLENBQUMsbUJBQW1CLENBQUM7U0FDekQsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLGdCQUFnQixDQUNuQixxQkFBRyxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FBQyw4QkFBOEIsQ0FBQyxDQUMzRSxDQUFDO1FBRUYsa0NBQWtDO1FBQ2xDLE1BQU0sR0FBRyxHQUFHLElBQUkscUJBQUcsQ0FBQyxnQkFBZ0IsQ0FBQztZQUNuQyxVQUFVLEVBQUUscUJBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjO1lBQ3BELE9BQU8sRUFBRSxxQkFBRyxDQUFDLGtCQUFrQixDQUFDLE1BQU07U0FDdkMsQ0FBQyxDQUFDO1FBRUgsd0ZBQXdGO1FBQ3hGLE1BQU0sUUFBUSxHQUFHLElBQUkscUJBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUNsRCxHQUFHO1lBQ0gsWUFBWSxFQUFFLEdBQUc7WUFDakIsWUFBWSxFQUFFLHFCQUFHLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FDL0IscUJBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUNyQixxQkFBRyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQ3ZCO1lBQ0QsYUFBYSxFQUFFLGFBQWE7WUFDNUIsNEJBQTRCO1lBQzVCLElBQUksRUFBRSxJQUFJO1NBQ1gsQ0FBQyxDQUFDO1FBRUgsMkVBQTJFO1FBQzNFLDRJQUE0STtRQUM1SSxNQUFNLEtBQUssR0FBRyxJQUFJLHFCQUFLLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRTtZQUNyQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsa0JBQWtCLENBQUM7U0FDL0MsQ0FBQyxDQUFDO1FBRUgsaURBQWlEO1FBQ2pELE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLENBQUM7WUFDdkQsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNO1lBQ3BCLFNBQVMsRUFBRSxLQUFLLENBQUMsV0FBVztTQUM3QixDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsUUFBUSxDQUFDLHFCQUFxQixDQUFDO1lBQ3RDLFFBQVEsRUFBRSxTQUFTO1lBQ25CLFNBQVMsRUFBRSxjQUFjO1NBQzFCLENBQUMsQ0FBQztRQUVILEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRS9CLGdDQUFnQztRQUNoQyxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDO1FBQzVFLGdFQUFnRTtRQUNoRSxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLHNCQUFzQixFQUFFO1lBQzlDLEtBQUssRUFDSCwySkFBMko7U0FDOUosQ0FBQyxDQUFDO1FBQ0gsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDckMsS0FBSyxFQUNILG9EQUFvRDtnQkFDcEQsUUFBUSxDQUFDLGdCQUFnQjtTQUM1QixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFoR0QsNENBZ0dDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gXCJhd3MtY2RrLWxpYlwiO1xuaW1wb3J0IHsgYXdzX2VjMiBhcyBlYzIsIGF3c19pYW0gYXMgaWFtLCBTdGFjaywgU3RhY2tQcm9wcyB9IGZyb20gXCJhd3MtY2RrLWxpYlwiO1xuaW1wb3J0IHsgQXNzZXQgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLXMzLWFzc2V0c1wiO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcblxuZXhwb3J0IGNsYXNzIEVjMkluc3RhbmNlU3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuICAgIC8vIENyZWF0ZSBhIEtleSBQYWlyIHRvIGJlIHVzZWQgd2l0aCB0aGlzIEVDMiBJbnN0YW5jZVxuICAgIC8vIFRlbXBvcmFyaWx5IGRpc2FibGVkIHNpbmNlIGBjZGstZWMyLWtleS1wYWlyYCBpcyBub3QgeWV0IENESyB2MiBjb21wYXRpYmxlXG4gICAgLy8gY29uc3Qga2V5ID0gbmV3IEtleVBhaXIodGhpcywgJ0tleVBhaXInLCB7XG4gICAgLy8gICBuYW1lOiAnY2RrLWtleXBhaXInLFxuICAgIC8vICAgZGVzY3JpcHRpb246ICdLZXkgUGFpciBjcmVhdGVkIHdpdGggQ0RLIERlcGxveW1lbnQnLFxuICAgIC8vIH0pO1xuICAgIC8vIGtleS5ncmFudFJlYWRPblB1YmxpY0tleVxuICAgIC8vICAgICAgICAgfSlcblxuICAgIC8vIGNyZWF0ZSBuZXcgVlBDIHdpdGggMiBzdWJuZXRzXG4gICAgLy8gY29uc3RydWN0b3IgVnBjKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogZWMyLlZwY1Byb3BzIHwgdW5kZWZpbmVkKTogZWMyLlZwY1xuICAgIGNvbnN0IHZwYyA9IG5ldyBlYzIuVnBjKHRoaXMsIFwiVlBDXCIsIHtcbiAgICAgIG5hdEdhdGV3YXlzOiAwLFxuICAgICAgc3VibmV0Q29uZmlndXJhdGlvbjogW1xuICAgICAgICB7XG4gICAgICAgICAgY2lkck1hc2s6IDI0LFxuICAgICAgICAgIG5hbWU6IFwiYXN0ZXJpc2tcIiwgLy8gbG9naWNhbCBuYW1lIGZvciB0aGllIHN1Ym5ldFxuICAgICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBVQkxJQywgLy8gcHVibGljIHN1Ym5ldFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIGFsbG93IHNzaCBhY2Nlc3MgZnJvbSBhbnl3aGVyZVxuICAgIGNvbnN0IHNlY3VyaXR5R3JvdXAgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAodGhpcywgXCJTZWN1cml0eUdyb3VwXCIsIHtcbiAgICAgIHZwYyxcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkFsbG93IFNTSCBpbi1ib3VuZCB0cmFmZmljXCIsXG4gICAgICBhbGxvd0FsbE91dGJvdW5kOiB0cnVlLCAvLyBXaGV0aGVyIHRvIGFsbG93IGFsbCBvdXRib3VuZCB0cmFmZmljIGJ5IGRlZmF1bHQuXG4gICAgfSk7XG5cbiAgICBzZWN1cml0eUdyb3VwLmFkZEluZ3Jlc3NSdWxlKFxuICAgICAgZWMyLlBlZXIuYW55SXB2NCgpLCAvLyBBbnkgSVB2NCBhZGRyZXNzXG4gICAgICBlYzIuUG9ydC50Y3AoMjIpLCAvLyBUQ1AgcG9ydCAyMlxuICAgICAgXCJBbGxvdyBTU0ggQWNjZXNzXCJcbiAgICApO1xuXG4gICAgY29uc3Qgcm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCBcImVjMlJvbGVcIiwge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoXCJlYzIuYW1hem9uYXdzLmNvbVwiKSwgLy8gSUFNIHByaW5jaXBhbFxuICAgIH0pO1xuICAgIHJvbGUuYWRkTWFuYWdlZFBvbGljeShcbiAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZShcIkFtYXpvblNTTU1hbmFnZWRJbnN0YW5jZUNvcmVcIilcbiAgICApO1xuXG4gICAgLy8gdXNlIGxhdGVzdCBBTUkgLSBjcHUgdHlwZSBhcm02NFxuICAgIGNvbnN0IGFtaSA9IG5ldyBlYzIuQW1hem9uTGludXhJbWFnZSh7XG4gICAgICBnZW5lcmF0aW9uOiBlYzIuQW1hem9uTGludXhHZW5lcmF0aW9uLkFNQVpPTl9MSU5VWF8yLFxuICAgICAgY3B1VHlwZTogZWMyLkFtYXpvbkxpbnV4Q3B1VHlwZS5BUk1fNjQsXG4gICAgfSk7XG5cbiAgICAvLyBjcmVhdGUgdGhlIGluc3RhbmNlIHVzaW5nIHNlY3lyaXR5IGdyb3VwLCBBTUksIGFuZCBrZXlwYWlyIGRlZmluZWQgaW4gdGhlIFZQQyBjcmVhdGVkXG4gICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgZWMyLkluc3RhbmNlKHRoaXMsIFwiSW5zdGFuY2VcIiwge1xuICAgICAgdnBjLFxuICAgICAgbWFjaGluZUltYWdlOiBhbWksXG4gICAgICBpbnN0YW5jZVR5cGU6IGVjMi5JbnN0YW5jZVR5cGUub2YoXG4gICAgICAgIGVjMi5JbnN0YW5jZUNsYXNzLlQ0RyxcbiAgICAgICAgZWMyLkluc3RhbmNlU2l6ZS5NSUNST1xuICAgICAgKSxcbiAgICAgIHNlY3VyaXR5R3JvdXA6IHNlY3VyaXR5R3JvdXAsXG4gICAgICAvLyBrZXlOYW1lOiBrZXkua2V5UGFpck5hbWUsXG4gICAgICByb2xlOiByb2xlLFxuICAgIH0pO1xuXG4gICAgLy8gY3JlYXRlIGFuIGFzc2V0IHRoYXQgd2lsbCBiZSB1c2VkIGFzIHBhcnQgb2YgdXNlciBkYXRhIHRvIHJ1biBmaXJzdCBsb2FkXG4gICAgLy8gQW4gYXNzZXQgcmVwcmVzZW50cyBhIGxvY2FsIGZpbGUgb3IgZGlyZWN0b3J5LCB3aGljaCBpcyBhdXRvbWF0aWNhbGx5IHVwbG9hZGVkIHRvIFMzIGFuZCB0aGVuIGNhbiBiZSByZWZlcmVuY2VkIHdpdGhpbiBhIENESyBhcHBsaWNhdGlvbi5cbiAgICBjb25zdCBhc3NldCA9IG5ldyBBc3NldCh0aGlzLCBcIkFzc2V0XCIsIHtcbiAgICAgIHBhdGg6IHBhdGguam9pbihfX2Rpcm5hbWUsIFwiLi4vc3JjL2NvbmZpZy5zaFwiKSxcbiAgICB9KTtcblxuICAgIC8vIGxvY2FsIHBhdGggdGhhdCB0aGUgZmlsZSB3aWxsIGJlIGRvd25sb2FkZWQgdG9cbiAgICBjb25zdCBsb2NhbFBhdGggPSBpbnN0YW5jZS51c2VyRGF0YS5hZGRTM0Rvd25sb2FkQ29tbWFuZCh7XG4gICAgICBidWNrZXQ6IGFzc2V0LmJ1Y2tldCxcbiAgICAgIGJ1Y2tldEtleTogYXNzZXQuczNPYmplY3RLZXksXG4gICAgfSk7XG5cbiAgICBpbnN0YW5jZS51c2VyRGF0YS5hZGRFeGVjdXRlRmlsZUNvbW1hbmQoe1xuICAgICAgZmlsZVBhdGg6IGxvY2FsUGF0aCxcbiAgICAgIGFyZ3VtZW50czogXCItLXZlcmJvc2UgLXlcIixcbiAgICB9KTtcblxuICAgIGFzc2V0LmdyYW50UmVhZChpbnN0YW5jZS5yb2xlKTtcblxuICAgIC8vIGNyZWF0ZSBvdXRwdXQgZm9yIGNvbm5lY3Rpb25nXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgXCJJUCBBZGRyZXNzXCIsIHsgdmFsdWU6IGluc3RhbmNlLmluc3RhbmNlUHVibGljSXAgfSk7XG4gICAgLy8gbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0tleSBOYW1lJywge3ZhbHVlOiBrZXkua2V5UGFyaU5hbWV9KVxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIFwiRG93bmxvYWQgS2V5IENvbW1hbmRcIiwge1xuICAgICAgdmFsdWU6XG4gICAgICAgIFwiYXdzIHNlY3JldHNtYW5hZ2VyIGdldC1zZWNyZXQtdmFsdWUgLS1zZWNyZXQtaWQgZWMyLXNzaC1rZXkvY2RrLWtleXBhaXIvcHJpdmF0ZSAtLXF1ZXJ5IFNlY3JldFN0cmluZyAtLW91dHB1dCB0ZXh0ID4gY2RrLWtleS5wZW0gJiYgY2htb2QgNDAwIGNkay1rZXkucGVtXCIsXG4gICAgfSk7XG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgXCJzc2ggY29tbWFuZFwiLCB7XG4gICAgICB2YWx1ZTpcbiAgICAgICAgXCJzc2ggLWkgY2RrLWtleS5wZW0gLW8gSWRlbnRpdGllc09ubHk9eWVzIGVjMi11c2VyQFwiICtcbiAgICAgICAgaW5zdGFuY2UuaW5zdGFuY2VQdWJsaWNJcCxcbiAgICB9KTtcbiAgfVxufVxuIl19