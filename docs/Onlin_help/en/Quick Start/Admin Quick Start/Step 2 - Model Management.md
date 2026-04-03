<callout emoji="memo" background-color="light-orange" border-color="light-orange">
In the previous step, you completed [Step 1 - Complete Basic Enterprise Configuration](./Step%201%20-%20Complete%20Basic%20Enterprise%20Configuration.md). You can now learn how to quickly complete model management.
</callout>

# Step 2: Model Management

Model Management is used to centrally configure and manage models connected to the platform, including model integration, quota configuration, default model settings, and model usage statistics. Through Model Management, you can provide foundational support for Business Knowledge Networks, Decision Agents, Digital Workers, and other intelligent capabilities.

This document walks you through the basic configuration of Model Management so that you can quickly connect models and complete the related settings.

## Feature Description

After Model Management is configured, you can centrally manage different model resources and their invocation relationships in the system, providing support for later permission configuration, business execution, and intelligent capabilities.

You can perform the following operations:

- Integrate large models or small models
- Configure model quotas
- Set a default model
- View model invocation statistics

## Prerequisites

Before you begin, make sure the following conditions are met:

- You are logged in to the **KWeaver DIP** workspace.
- You have permission to use Model Management features.
- You have prepared the information required for model integration, such as endpoint URLs, authentication details, and model parameters.

## Instructions

Follow the steps below to complete the basic Model Management configuration. This usually includes model integration, quota configuration, default model settings, and model statistics review.

You can complete the configuration flexibly according to your business needs.

## Model Integration

Model integration is the prerequisite for using Model Management. After models are integrated, Business Knowledge Networks, Decision Agents, Digital Workers, and other capabilities in the system can invoke the corresponding models.

You can choose to integrate large models or small models based on your needs.

### Integrate a Large Model

1. Log in to the KWeaver DIP workspace.
2. In the left navigation bar, select **Model Management**. The page opens to the **Large Models** tab by default.
3. Click **New**.
4. Fill in the model information in the dialog box. Fields marked with `*` are required.
5. Click **Save** to complete the large-model integration.

### Integrate a Small Model

1. Open **Model Management** and switch to the **Small Models** tab.
2. Click **New**.
3. Fill in the model information.
4. Click **Save** to complete the small-model integration.

## Quota Management

After model integration is complete, you can configure invocation quotas for models according to business needs to control the scope of resource usage.

### Steps

1. Open **Model Management**.
2. Select the target model and open the quota configuration page.
3. Set the quota rules.
4. Click **Save** to complete the configuration.

### Rule Description

Quota rules are used to limit the number of model invocations within a given period and prevent excessive resource consumption.

#### Billing Cycle Rule

Quotas are counted and reset by cycle. The exact cycle depends on the system configuration.

#### Quota Recovery Rule

When a cycle ends, unused quota is automatically cleared or reclaimed according to the configured rules.

## Default Model

You can set a default model for the system. When no model is explicitly specified, the system invokes the default model automatically.

### Steps

1. Open **Model Management**.
2. Select the target model.
3. Click **Set as Default Model**.

## Model Statistics

Through the Model Statistics feature, you can view model usage and use the results for resource management and optimization.

### Supported Metrics

- Number of invocations
- Usage volume
- Success rate
- Failure status

## Recommended Configuration Order

It is recommended that you complete Model Management in the following order:

1. Integrate models
2. Configure quotas
3. Set the default model
4. Review model statistics

## Notes

- If model integration is not completed, related business capabilities cannot invoke models.
- It is recommended to adjust quota settings according to the actual business workload.
- The default model affects automatic invocation behavior across the system.

## FAQ

### Why can a Decision Agent or Digital Worker not run properly?

Possible causes include incomplete model integration, no default model configured, or insufficient quota.

### Do I need to integrate both large models and small models?

No. You can choose which type to integrate based on your business needs.

### When do quota rules take effect after they are saved?

They usually take effect immediately after saving. The actual behavior depends on the system configuration.

### Why should I set a default model?

It provides a fallback model when no model is explicitly specified and helps prevent business execution from being interrupted.
