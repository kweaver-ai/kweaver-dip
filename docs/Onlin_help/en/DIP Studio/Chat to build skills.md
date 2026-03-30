# How to Create Skills Through Conversation

By creating skills, you can give a Digital Worker more explicit and reusable execution capabilities. Skills can package external APIs, database queries, or complex calculation logic into capability units that a Digital Worker can understand and invoke, helping it complete tasks in business scenarios in a more professional and reliable way.

For example, you can create skills such as `Query Customer Orders` or `Call an External API to Generate a Report`. After configuration is complete, the Digital Worker can invoke them as needed to improve the efficiency and accuracy of complex task handling.

After skills are created, a Digital Worker can become:

- **More professional**: accurately understand and handle work within a specific business scenario
- **Reusable**: turn validated processes into standardized capabilities that can be called repeatedly
- **Composable**: coordinate multiple skills to complete complex business processes with multiple steps and stages

This document walks you through the full process: describing requirements, generating a skill, previewing and testing it, and then formally publishing it.

## Prerequisites

Before you start creating a skill, make sure the following conditions are met:

- You have a **KWeaver DIP platform administrator account and password**
- You can access the **KWeaver DIP platform login page**
- If the skill needs to call external interfaces, prepare the following in advance:
  - API documentation
  - Access credentials such as API keys or tokens
  - Input parameter and response structure descriptions

## Open the Skill Configuration Page

1. Go to **KWeaver DIP > My Digital Workers**.
2. Click **Create** to enter the Digital Worker creation page.
3. On the creation page, select **Skill Configuration**.
4. In the right-side area, click **Select Skills** to enter the skill selection and creation interface.

## Describe Skill Requirements and Generate the Skill

You can describe the requirement in natural language, and the system automatically understands it and generates the skill content.

1. In the **Select Skills** dialog, locate the text input box.
2. Enter the skill requirements. It is recommended to clearly describe:
   - The goal of the skill
   - The execution flow
   - The required input information
   - The expected output result
3. You can also upload supplementary materials, such as:
   - Business requirement documents
   - Sample data
   - Interface documentation
   - Rule description files

### Requirement Clarification

If the system cannot fully determine the boundaries of the skill, it automatically asks **3 to 5 clarification questions**, focusing on:

- The scope where the skill should be used
- Input and output specifications
- Core processing rules
- Fallback handling for exceptional cases

Provide additional information as needed to improve generation accuracy.

### Automatically Generate the Skill Files

After the system fully understands the requirements, it automatically:

- Generates a standardized skill package
- Writes the complete skill content
- Produces an initial draft that can be tested and published

## Preview and Test the Skill

After the skill is generated, preview and test it before release to verify that it meets business expectations.

1. On the skill configuration page, trigger a test through conversation.
2. Check the execution result in the preview area on the right.
3. Focus on verifying the following four points:
   - Whether the input information is recognized correctly
   - Whether the execution flow matches the requirement
   - Whether the output result is complete and accurate
   - Whether no boundary cases are missed

> Tip: If the test result does not meet expectations, go back to the requirement description area, improve the description, and regenerate the skill.

## Publish the Skill

After all tests pass, formally publish the skill.

1. Click **Publish** in the upper-right corner of the page.
2. Before publishing, review the following again:
   - Skill name
   - Skill description
   - Version information
3. After confirming that everything is correct, complete the publish operation.

## Important Notes

1. The more detailed the skill description is, the more accurate the automatically generated result will be.
2. For skills that depend on external interfaces, make sure permissions are ready in advance and that parameter and response structure descriptions are complete.
3. Before release, you must complete at least one end-to-end test to reduce execution deviations.
