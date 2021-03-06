#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const cdk = require("aws-cdk-lib");
const ec2_instance_stack_1 = require("../lib/ec2-instance-stack");
const app = new cdk.App();
new ec2_instance_stack_1.Ec2InstanceStack(app, "Ec2InstanceStack", {});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWMyLWluc3RhbmNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWMyLWluc3RhbmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHVDQUFxQztBQUNyQyxtQ0FBbUM7QUFDbkMsa0VBQTZEO0FBRTdELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQzFCLElBQUkscUNBQWdCLENBQUMsR0FBRyxFQUFFLGtCQUFrQixFQUFFLEVBQUUsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuaW1wb3J0IFwic291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyXCI7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XG5pbXBvcnQgeyBFYzJJbnN0YW5jZVN0YWNrIH0gZnJvbSBcIi4uL2xpYi9lYzItaW5zdGFuY2Utc3RhY2tcIjtcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbm5ldyBFYzJJbnN0YW5jZVN0YWNrKGFwcCwgXCJFYzJJbnN0YW5jZVN0YWNrXCIsIHt9KTtcbiJdfQ==