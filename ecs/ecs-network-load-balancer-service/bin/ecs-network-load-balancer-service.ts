#!/usr/bin/env node
import {App} from 'aws-cdk-lib';
import { EcsNetworkLoadBalancerServiceStack } from '../lib/ecs-network-load-balancer-service-stack';


const app = new App();

new EcsNetworkLoadBalancerServiceStack(app, 'EcsNetworkLoadBalancerServiceStack', {
});
