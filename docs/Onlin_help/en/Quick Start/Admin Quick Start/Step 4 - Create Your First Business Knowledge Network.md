<callout emoji="memo" background-color="light-orange" border-color="light-orange">
In the previous step, you completed [Step 3 - Data Access](./Step%203%20-%20Data%20Access.md). You can now learn how to create a Business Knowledge Network.
</callout>

# Step 4: Create Your First Business Knowledge Network

In the DIP workspace, you can create a **Business Knowledge Network (BKN)** to model business objects, relationships, and behaviors in a structured way, thereby supporting the understanding and execution capabilities of Decision Agents and Digital Workers.

This document walks you through the creation of your first Business Knowledge Network and helps you complete the basic flow from business description to model construction and validation.

## Feature Description

After a Business Knowledge Network is created, you can build a structured business semantic model in the system to support business understanding, decision-making, and execution.

You can perform the following operations:

- Define business objects, relationships, and actions
- Build the Business Knowledge Network structure
- Configure data mappings
- Test and validate the model

## Prerequisites

Before you begin, make sure the following conditions are met:

- Data access has already been configured.
- You have permission related to business modeling.
- The business scenario and core object relationships are already clear.

## Instructions

Follow the methods below to create the Business Knowledge Network. The system supports both conversation-based modeling and GUI-based modeling.

You can choose the most appropriate method based on your business needs.

## Method 1: Create Through Conversation (Recommended)

With the conversation-based method, you can describe the business in natural language and let the system automatically generate the initial Business Knowledge Network structure.

Operation path:
**Global Business Knowledge Network > Domain Business Knowledge Network > Create Business Knowledge Network by Conversation**

Steps:

1. Open **Ontology Engine** and then open **Create Business Knowledge Network by Conversation**.
2. In the input box, describe your business scenario. It is recommended to include the following information:
   - Business scenario
   - Core objects
   - Relationships among objects
   - Key business actions
   - Optional: data sources
3. Send the conversation content and wait for the system to generate the initial BKN model.
4. Check whether the generated result includes:
   - Object classes
   - Relationship classes
   - Action classes
5. If needed, continue refining or modifying the model through the conversation.
6. After generation, open the Business Knowledge Network detail page and check the mapping and validation results.

## Method 2: Create Through the GUI

With the GUI method, you can complete the Business Knowledge Network configuration step by step on the page.

### Step 1: Create a Business Knowledge Network

Create a Business Knowledge Network container in the system.

Steps:

1. Go to **Global Business Knowledge Network > Domain Business Knowledge Network**.
2. Click **+ New** in the upper-right corner.
3. Fill in the following information in the dialog box:
   - **ID**: Unique identifier. Optional. Generated automatically by default.
   - **Name**: It is recommended to reflect the business scenario, for example `Retail Customer Management Knowledge Network`.
   - **Tags**: Used for classification and search.
   - **Icon + Color**: Used for visual distinction.
   - **Description**: Optional additional explanation of the purpose.
4. Click **Save**.

Result:

- A Business Knowledge Network instance is created successfully.

### Step 2: Define the Business Model (Object Classes / Relationship Classes / Action Classes)

Build the core structure of the Business Knowledge Network.

#### 2.1 Create an Object Class

Operation path:
**Business Knowledge Network > Object Class**

Steps:

1. Open the target Business Knowledge Network.
2. Switch to the **Object Class** tab.

You can continue later with field, property, and association configuration as needed.

## Recommended Workflow

It is recommended that you create the Business Knowledge Network in the following order:

1. Generate the initial model through conversation
2. Adjust the structure through the GUI
3. Refine object classes, relationship classes, and action classes
4. Configure data mappings
5. Test and validate

## Notes

- The structure of the Business Knowledge Network directly affects the understanding and execution capabilities of Decision Agents.
- It is recommended to generate the initial structure through conversation first and then adjust it through the GUI.
- Object classes, relationship classes, and action classes should remain semantically consistent.
- Data mappings should stay consistent with the data that has already been connected.

## FAQ

### Why is the conversation-based method recommended?

It can quickly generate an initial structure, reduce modeling cost, and is suitable for first-time use or fast scenario validation.

### Can the conversation-based method and the GUI method be used together?

Yes. It is usually recommended to generate the basic model through conversation first and then refine it through the GUI.

### Can a Business Knowledge Network be modified after it is created?

Yes, but structural changes may affect existing configurations and business logic.
