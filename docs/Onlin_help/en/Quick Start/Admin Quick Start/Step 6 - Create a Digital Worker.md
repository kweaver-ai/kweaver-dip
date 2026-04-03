<callout emoji="memo" background-color="light-orange" border-color="light-orange">
In the previous step, you completed [Step 5 - Build a Decision Agent](./Step%205%20-%20Build%20a%20Decision%20Agent.md). You can now learn how to create a Digital Worker.
</callout>

# Step 6: Create a Digital Worker

In the DIP workspace, you can create a Digital Worker to encapsulate the capabilities of a Decision Agent and combine job responsibilities, skills, and business knowledge to provide conversation, execution, and service capabilities for specific business scenarios.

This document walks you through the creation and configuration of a Digital Worker and helps you build a Digital Worker that can be used in real business scenarios.

## Feature Description

After the Digital Worker is created, you can build an intelligent agent with job capabilities in the system to support business consultation, task execution, and process collaboration.

You can perform the following operations:

- Create a Digital Worker
- Configure job responsibilities and role settings
- Configure skills and invocation logic
- Bind Business Knowledge Networks and data resources
- Integrate enterprise channels and provide services externally

## Prerequisites

Before you begin, make sure the following conditions are met:

- Model integration and configuration are complete.
- A Business Knowledge Network has already been created.
- A Decision Agent has already been created.
- Job information, skill requirements, and channel configuration such as `API Key` are ready.
- You have permission to use Digital Worker features.

## Instructions

Follow the steps below to complete the creation and configuration of a Digital Worker. This usually includes job responsibility definition, skill configuration, knowledge binding, and channel integration.

You can complete the configuration flexibly according to your business needs.

## Overall Workflow

Creating a Digital Worker usually includes the following four core steps:

1. Create job responsibilities
2. Configure skills
3. Configure knowledge
4. Configure channel integration

After all steps are configured, you still need to publish them before the Digital Worker can be used officially.

## Step 1: Create a Digital Worker

1. In the left navigation bar, open **My Digital Workers**.
2. Click **New**.
3. Open the Digital Worker creation and configuration page.

## Step 2: Configure Job Responsibilities

Define the job positioning and responsibility scope for the Digital Worker.

Steps:

1. Enter the job title. It is recommended to reflect the business role.
2. Configure the job description to explain the responsibilities and service scope.
3. Set role preferences such as tone, style, or behavioral constraints.

## Step 3: Configure Skills

Configure the skills that the Digital Worker can invoke to perform specific business tasks.

Steps:

1. Select or add skill capabilities.
2. Configure skill invocation rules.
3. Set skill execution conditions or priorities.

## Step 4: Configure Business Knowledge and Data

Bind Business Knowledge Networks and data resources for the Digital Worker.

Steps:

1. Select the associated Business Knowledge Network.
2. Configure the scope of knowledge usage.
3. Bind data sources such as document repositories or structured data.
4. Set data access policies.

## Step 5: Configure Channel Integration

Connect the Digital Worker to enterprise channels so that it can provide services externally.

Steps:

1. Select the integration channel, such as an enterprise IM platform.
2. Fill in channel configuration items such as `API Key` and `API Secret`.
3. Configure access permissions and usage scope.

## Step 6: Debug and Publish

Before formal use, validate and publish the Digital Worker.

Steps:

1. Open the debugging page.
2. Enter test questions or business tasks.
3. Check the response results and execution behavior.
4. Adjust the configuration based on the results.
5. Click **Publish** to complete the release.

After publishing is complete, the Digital Worker can provide services through the corresponding channel.

## Recommended Configuration Order

It is recommended that you create a Digital Worker in the following order:

1. Create the Digital Worker
2. Configure job responsibilities
3. Configure skills
4. Bind business knowledge and data
5. Configure channel integration
6. Debug and publish

## Notes

- The effectiveness of a Digital Worker depends on model capability, Business Knowledge Network quality, and the quality of skill configuration.
- It is recommended to complete Decision Agent and Business Knowledge Network configuration before creating a Digital Worker.
- Skill configuration should stay aligned with job responsibilities.
- Channel configuration must ensure that permissions and security policies are correct.

## FAQ

### Why is the Digital Worker not responding properly?

Possible causes include no model configured, no Business Knowledge Network bound, inactive skills, or incorrect channel configuration.

### Is it mandatory to configure skills?

No, but well-designed skill configuration can significantly improve task execution capability.
