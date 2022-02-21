# Cross Stack Loadbalancer

- Application Load Balancer
  - Listener
    - Target Group
      - Service
- Service
  - ECS Cluster: logical group of task or service
    - Task Definition: define docker image, resource allocaiton, launce type, ...

This example shows how to use a load balancer in a different
stack to load balance to an ECS service.

You must either create an `ApplicationListener` in the same stack as your
ECS service, or create an empty `TargetGroup` in your load balancer stack
and register your ECS service into that.

This example demoes both of these possibilities. It uses Fargate,
but the same principles hold for EC2 services.

(A third option, not pictured here, is to create the shared listener
with a fixed response and add a new listener rule in the service stack).

## Option 1: Split at listener

Shown in `split-at-listener.ts`, create an `ApplicationLoadBalancer`
in a shared stack, and an `ApplicationListener` in the service stack.

- shared stack
  - ALB
- service stack
  - Listener
    - Traget group

Ref. [Listeners for your Application Load Balancers](https://docs.aws.amazon.com/ja_jp/elasticloadbalancing/latest/application/load-balancer-listeners.html)

## Option 2: Split at target group

Shown in `split-at-targetgroup.ts`, create an empty `TargetGroup` in the load
balancer stack, and register a `Service` into it in the service stack.

- shared stack
  - ALB
    - Listener
      - TargetGrop(empty)
- service stack
  - Traget group
