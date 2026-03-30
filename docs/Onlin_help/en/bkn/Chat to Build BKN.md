# Chat to Build BKN

## Overview

### Feature Definition

Chat to Build BKN lets users quickly generate an initial BKN structure by describing business requirements in natural language. Instead of manually defining every object class, relationship class, and action class from scratch, users can first describe the business scenario, key entities, and expected actions in a conversation, and the system then generates a BKN draft for review and refinement.

This feature is suitable for exploring new business scenarios, building BKN prototypes, and collaborating with business users during knowledge modeling.

### Application Scenarios

This feature is suitable in the following scenarios:

- You already understand the business scenario, but the BKN structure has not been formally designed yet.
- You need to quickly generate a first draft of object classes, relationship classes, and action classes.
- Business users are more comfortable describing requirements in natural language than directly configuring concept structures.
- You want to shorten early-stage BKN modeling time and improve setup efficiency.

## Prerequisites

Before using this feature, make sure the following conditions are met:

1. You are logged in to the platform and have permission to create or edit a BKN.
2. You have already identified the business scenario, core entities, and key business actions.
3. If the BKN will later be bound to data resources, the related data views, models, or tools are already prepared or have been clearly planned.

## Operation Guide

### Step 1: Open the Chat to Build BKN Page

1. Log in to the platform.
2. Go to the **BKN** module.
3. Open the **Chat to Build BKN** entry.
4. Select the target workspace, or choose to create a new BKN.

### Step 2: Describe the Business Scenario in Natural Language

In the chat input box, describe the business scenario that needs to be modeled. It is recommended to include the following information:

- Business domain or scenario name
- Core business entities
- Relationships between entities
- Key business actions or decisions
- Intended use of the BKN

#### Example Prompt

`Build a retail customer operations BKN. It should include customers, orders, products, and stores. Customers can place orders, orders contain products, and stores fulfill orders. It should also support customer churn alerts and high-value customer identification.`

### Step 3: Generate the Initial BKN

1. After completing the input, click **Generate**.
2. The system parses the natural language content and generates an initial BKN draft.
3. The draft usually includes:
   - Basic BKN information
   - Recommended object classes
   - Recommended relationship classes
   - Recommended action classes
   - Optional concept group suggestions

### Step 4: Review the Generated Result

After generation is complete, review the following carefully:

- Whether the business scope is accurate
- Whether the object classes are complete and free of duplication
- Whether the relationship classes correctly reflect business associations
- Whether the action classes match actual business operations
- Whether the names, descriptions, and groupings are clear enough for later maintenance

If the generated result does not meet expectations, continue refining it through chat or switch to manual editing.

### Step 5: Continue the Conversation to Refine the BKN

You can continue the conversation to supplement and refine the generated result. Common adjustments include:

- Adding missing business entities
- Removing unnecessary concepts
- Refining the meaning of relationships
- Adding action classes
- Adjusting names to match internal enterprise terminology
- Splitting overly large concepts into smaller and clearer ones

#### Example Follow-up Instructions

- `Add a supplier object class and connect it to products.`
- `Split online orders and offline orders into two object classes.`
- `Add an action class for inventory replenishment alerts.`
- `Rename customer churn alert to customer retention reminder.`

### Step 6: Confirm and Save

1. After confirming that the generated structure is correct, save the BKN.
2. Open the detailed configuration pages for object classes, relationship classes, and action classes as needed.
3. Continue with the following configurations:
   - Attribute definitions
   - Data resource binding
   - Logic resource binding
   - Action tool configuration
   - Index configuration
4. Save and publish the BKN for later use.

## Prompt Recommendations

To improve generation quality, it is recommended that your prompt be:

- **Specific**: avoid vague descriptions
- **Structured**: cover entities, relationships, and actions where possible
- **Business-oriented**: use the terminology commonly used inside the enterprise
- **Goal-driven**: clearly describe the application scenario and purpose of the BKN

### Recommended Prompt Structure

It is recommended to organize the input in the following order:

1. Scenario background
2. Core entities
3. Entity relationships
4. Business actions or rules
5. Intended use of the BKN

## Notes

- The content generated by the system is an initial draft and should still be reviewed manually before formal use.
- Natural language generation helps improve modeling efficiency, but it does not replace business validation.
- If the scenario is complex, it is recommended to generate the BKN in several rounds and refine it step by step.
- After the BKN is created, data views, logic resources, action resources, and indexes usually still need to be configured manually.

## FAQ

Q1: **Why is the generated BKN incomplete?**  
A1: Common reasons include:

- The business description is too brief.
- Key entities or actions were not explicitly described.
- The scenario is too complex to be fully covered in a single generation round.

Recommended handling:

- Add more complete business details and generate again.
- Continue refining the result through follow-up conversation.
- Manually add any missing concepts after generation.

Q2: **Can I still modify the BKN manually after generating it through chat?**  
A2: Yes. The system generates only the initial structure. You can still manually adjust object classes, relationship classes, action classes, attributes, and resource binding configurations afterward.

Q3: **Does Chat to Build BKN automatically complete data binding?**  
A3: No. This feature is mainly used to generate the conceptual structure of the BKN. Data views, logic resources, action tools, and index settings usually still need to be configured manually.

## Related Information

- Build BKN
- Concept Groups
- Task Management
- How to Create a Skill
