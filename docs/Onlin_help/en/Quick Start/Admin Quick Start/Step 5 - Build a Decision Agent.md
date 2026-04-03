<callout emoji="memo" background-color="light-orange" border-color="light-orange">
In the previous step, you completed [Step 4 - Create Your First Business Knowledge Network](./Step%204%20-%20Create%20Your%20First%20Business%20Knowledge%20Network.md). You can now learn how to build a Decision Agent.
</callout>

# Step 5: Build a Decision Agent

In KWeaver DIP, you can create a Decision Agent to integrate model capabilities, business knowledge, and data capabilities to support business Q&A, task decisions, knowledge retrieval, process execution, and similar scenarios.

This document walks you through the creation and basic configuration of a Decision Agent and helps you quickly build a runnable agent.

## Feature Description

After the Decision Agent is built, you can create intelligent agents with business understanding and execution capabilities in the system to support multiple business scenarios.

You can perform the following operations:

- Create a Decision Agent
- Configure models and capabilities
- Bind Business Knowledge Networks and data sources
- Debug and validate
- Publish and provide services externally

## Prerequisites

Before you begin, make sure the following conditions are met:

- Model integration and configuration are complete.
- A Business Knowledge Network has already been created.
- Available data sources, such as a knowledge network or document repository, are ready.
- You have permission to use Decision Agent features.

## Instructions

Follow the steps below to complete the creation and configuration of a Decision Agent. This usually includes agent creation, capability configuration, debugging, validation, and publishing.

You can complete the configuration flexibly according to your business needs.

## Step 1: Create a Decision Agent

1. Go to **Development > Decision Agent**.
2. Click **New**.
3. Open the Decision Agent creation and configuration page.
4. In the basic information section, fill in the following fields:
   - **Name**: Enter the agent name.
   - **Summary**: Briefly describe the purpose and function of the agent.
   - **Avatar**: Upload or generate an avatar for the agent.
   - **Product**: Select the product type associated with the agent, such as `DIP`.

After the basic information is completed, you can continue with the following configuration steps.

## Step 2: Configure Role Instructions

Role instructions define the identity, task goals, and execution boundaries of the Decision Agent. They are a key configuration item that affects output quality.

The platform supports the following configuration modes:

- **Natural language mode**: Use prompts to describe the agent's role, tasks, and constraints. This is suitable for quickly building most scenarios.
- **Dolphin (expert mode)**: Write Dolphin code to implement more complex task logic and decision flows. This is suitable for advanced configuration scenarios.

It is recommended that the role instructions clearly define the following:

- **Role definition**: who the agent is and what problems it is responsible for
- **Target tasks**: the core tasks that the agent must complete
- **Execution constraints**: the agent's permissions, behavioral boundaries, output requirements, and exception handling methods

If the agent is used for a specific business scenario, it is recommended to use business terminology, business rules, and real task objectives in the role instructions so that the model can understand the task more accurately.

## Step 3: Configure Knowledge Sources

To enable the Decision Agent to analyze and make decisions based on business knowledge, you need to configure appropriate knowledge sources.

Supported knowledge sources include:

- **Business Knowledge Network**: suitable for carrying enterprise business concepts, relationships, and rules. This is the recommended knowledge source.
- **Knowledge entries**: suitable for supplementing specific business explanations, document knowledge, or structured knowledge content.

If the Decision Agent is used for enterprise business decisions, Q&A analysis, process assistance, and similar scenarios, it is recommended to connect a **Business Knowledge Network** first. Compared with relying only on a general model, an agent connected to a Business Knowledge Network usually gains more accurate business understanding, more stable answer quality, and stronger rule constraints.

## Step 4: Configure Skills and Decision Models

Based on business needs, you can configure one or more skill modules for the Decision Agent to expand its capability boundaries. Examples include:

- Data analysis
- Contract matching
- Retrieval augmentation
- Task planning

At the same time, you also need to select the model that the agent uses when performing tasks. Common options include:

- **Large language models**: suitable for general Q&A, content generation, and basic reasoning
- **Reasoning models**: suitable for structured judgment, complex logical analysis, and multi-step decision-making

In most cases:

- If the scenario is mainly knowledge Q&A and conversational interaction, a general large language model is usually the first choice.
- If the scenario is mainly rule judgment, task decomposition, and complex decisions, it is recommended to choose a model that is better suited to reasoning tasks.

Whether the model selection is appropriate directly affects the agent's understanding, reasoning depth, and execution stability.

## Step 5: Complete Advanced Configuration

Based on actual needs, you can continue improving the following configuration items:

- **Long-term memory**: retain historical interaction information to improve context continuity and personalization
- **Default opening**: set the greeting shown when the agent starts
- **Related questions**: configure the question directions the agent can answer
- **Task planning**: set the strategy for task decomposition and execution planning
- **Preset questions**: preconfigure common questions so that users can start conversations quickly

If the agent involves complex business tasks, it is recommended to combine task planning and long-term memory. When long-term memory is enabled, you should also pay attention to data privacy and compliance requirements.

## Step 6: Debug and Validate

After the configuration is complete, it is recommended to debug the agent in a test environment first and focus on the following:

- Whether the role instructions are clear and stable
- Whether the model has been integrated correctly and can be invoked
- Whether the Business Knowledge Network is working
- Whether skill invocation behaves as expected
- Whether the output complies with business rules and scenario requirements

If you encounter inaccurate answers, knowledge that cannot be called, or unstable decision results, it is recommended to check the following first:

- Whether the model is configured correctly
- Whether the role instructions are expressed clearly
- Whether the knowledge sources are bound correctly
- Whether the required skills are enabled and compatible with the current product type

## Step 7: Publish the Decision Agent

After debugging is complete, you can publish the agent.

1. Click **Save** to store the current configuration as a draft.
2. Click **Publish** to formally deploy the current version to the platform.

After publishing, the Decision Agent is available to users. If you need to change the configuration later, you can continue editing the existing version and publish it again. The new version overwrites the online version. Historical versions are retained on the configuration information page for later traceability and version management.

## Recommended Configuration Order

It is recommended that you complete Decision Agent setup in the following order:

1. Create the agent
2. Configure basic information
3. Configure the model
4. Bind business knowledge and data
5. Debug and validate
6. Publish

## Notes

- The effectiveness of a Decision Agent depends on model capability and the quality of the Business Knowledge Network.
- It is recommended to complete Business Knowledge Network construction before configuring the agent.
- Model parameter settings affect result stability and response quality.
- Data and knowledge configuration should remain consistent to avoid incorrect invocation behavior.

## FAQ

### Why can the Decision Agent not run properly?

Possible causes include no model configured, no Business Knowledge Network bound, or unavailable data sources.

### What does model configuration affect?

It affects understanding ability, generation quality, response speed, and stability.

### Is it mandatory to bind a Business Knowledge Network?

No, but binding one can significantly improve business understanding and result accuracy.

### Can the agent be modified after it is published?

Yes, but it is recommended to validate it again after modification to ensure the results still meet expectations.
