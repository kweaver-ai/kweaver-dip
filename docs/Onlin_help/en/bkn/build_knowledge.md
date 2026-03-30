# Build BKN

## Overview

### Positioning of the BKN Engine

The BKN engine uses a unified business knowledge modeling methodology and a three-part model of **data, logic, and action**. By extracting object classes, relationship classes, and action classes and establishing links among them, it forms a BKN that supports intelligent decision-making and automated operations.

### Layered Architecture of BKN

BKN evolves vertically from **general -> industry -> customer-defined**, and each layer serves a different purpose:

| Layer | Core Purpose | Example |
| --- | --- | --- |
| General BKN | Accumulates cross-industry foundational concepts, relationships, and attributes to provide a standardized knowledge foundation | Concepts: `Person`, `Customer`; Relationships: `Belongs To`, `Associated With` |
| Industry BKN | Inherits from the general layer and adds industry-specific concepts and rules to reduce vertical-domain modeling costs | Finance: `Risk Control Indicator`; Retail: `Supply Chain Node` |
| Customer-defined BKN | Supports enterprise-specific business models and enables accurate mapping to real scenarios | Business processes for a specific product, customer segmentation strategies |

## Core Concepts

BKN is built on **concept models and resources**. The core elements are defined below:

| Element | Subtype | Definition | Example |
| --- | --- | --- | --- |
| BKN Model | Concept Group | Logical grouping of concepts. Concepts can belong to multiple groups. | The `User Management` group contains the `Customer` object class and the `Associated Order` relationship class |
|  | Concept - Object Class | Defines the essential properties of a business entity, including data properties and logical properties | - |
|  | Concept - Relationship Class | Describes structural associations between entities without involving business actions | - |
|  | Concept - Action Class | Defines concrete business operations together with their conditional constraints | - |
|  | Mapping - Association Rule | Establishes bindings between concepts and data, logic, and action resources | - |
| Resources | Data Resource | Data views from VEGA virtualization | Customer consumption record view, device status view |
|  | Logic Resource | Resources from VEGA data models and operators or functions in Execution Factory | Customer activity scoring model, risk scoring operator |
|  | Action Resource | Tools and MCP interfaces from Execution Factory | SMS push tool, device scheduling MCP interface |

## Build Process

### Prerequisites

1. Complete business scenario analysis and identify the core entities and relationships that need to be modeled.
2. Create the required data views in VEGA virtualization for binding data resources.

### Create a BKN

1. Log in to the system and click **BKN > BKN**.
2. Click **+ New** and configure the following in the dialog:
   1. **ID**: Custom identifier. If left blank, the system generates one automatically.
   2. **Name**: Should reflect the business scenario, such as `Retail Customer Management BKN`.
   3. **Tags**: Used to classify and quickly search BKN.
   4. **Icon + Color**: Visual identifiers used to distinguish different BKNs in the system.
   5. **Description**: A short explanation of the purpose of the BKN. Optional.
3. Click **Save** to complete creation.

### Define Concepts: Object Class / Relationship Class / Action Class

#### Create an Object Class

1. Open **BKN > Object Class**.
2. Click **+ New** and configure the object class as follows:
   - **Step 1: Data View**
     - If DIP already has a data view that contains object class data, select **Import Attributes from Data View**. The system automatically maps columns from the data view to attributes. Unwanted attributes can be discarded later.
     - If there is no existing data source, select **Create Attributes Manually** to continue.
   - **Step 2: Basic Information**
     - **Name**: Display name of the object class
     - **ID**: Unique identifier of the object class
     - **Icon / Color**: Configure the default icon and theme color for easier visual distinction
     - **Concept Group**: Add the object class to a specified group for organization and filtering
     - **Description**: Briefly explain the purpose or meaning of the object class
   - **Step 3: Attribute Definition**
     - Every object class must contain at least one attribute as the primary key used to uniquely identify instances. Additional attributes can be added as needed.
     - Key parameters:
       - Primary key: choose one or more attributes, such as `Customer ID`, as the unique identifier of the object class instance
       - Title: specify one attribute as the default display name of the object class
       - Incremental: only integer (`integer`, `unsigned integer`) and time types (`datetime`, `timestamp`) are supported
   - **Step 4: Attribute Mapping**
     - Data properties: map basic type attributes to a data view by dragging fields from the logic view on the left to the logic properties on the right.
     - Logic properties: map to data models, operators, or functions. Bind the resource ID and configure the association between object-class data properties and logic-resource fields through **Logic Property > Target Property > Configure**.
3. Click **Save and Exit** to finish creating the object class.

#### Create a Relationship Class

1. Open **BKN > Relationship Class**.
2. Click **+ New** and configure the following:
   - **Name**: Should reflect the meaning of the relationship, such as `Customer - Associated With - Order`
   - **Start Object Class / End Object Class**: Select the two object classes to be associated
   - **Association Method**:
     - Direct association: connect an attribute of one object class directly to an attribute of another object class, such as `Customer ID -> Order Table.Customer ID`
     - Indirect association: connect through a data view. This is suitable when direct association is not possible, such as `Device -> Device Status View -> Fault Record`
3. Click **Save and Exit** to finish creating the relationship class.

#### Create an Action Class

1. Open **BKN > Action Class**.
2. Click **+ New** and configure the following:
   - **Name**: Should reflect the business action, such as `Customer Churn Alert`
   - **Conditional Association**: Configure the trigger rule for the action, such as `customer purchase count in the last 30 days < 2`
   - **Associated Tool**: Select the target tool from Execution Factory, such as an SMS push tool
3. Click **Save and Exit** to finish creating the action class.

### Configure Indexes

1. Open the detail page of an object class and click **Actions > Index Settings**.
2. Select the target attribute and click **Configure**. Complete the settings in the side panel.
3. Click **Confirm** to finish index configuration.

#### Index Configuration Rules

- Only fields of type **string**, **text**, and **vector** support index configuration. Other field types are disabled by default.
- **string / text** fields support the following index capabilities:
  - Keyword index: used for exact matching and requires field length configuration
  - Full-text index: used for text search and requires selecting a tokenizer (`standard`, `ik_max_word`, or `english`)
  - Vector index: after selecting a small model, the system automatically displays vector dimensions, batch size, and maximum token count
- **vector** fields support **vector indexes only**.

### Import a BKN

1. On the **BKN** list page, click **Import**.
2. Upload a historical configuration file in JSON format.
3. The system automatically parses and imports concepts and mapping relationships without requiring you to reconfigure view mappings.
4. **Note**: After import, create index build tasks as needed to regenerate data indexes. Persisted data is not retained.

### Export a BKN

1. On the **BKN** list page, select the target BKN and click **More > Export**.
2. Select the export format (`JSON`) and click **Confirm** to download.

## Appendix

### Attribute Type Reference

| Attribute Type | Description | Typical Usage | Example |
| --- | --- | --- | --- |
| boolean | Boolean value (`true` / `false`) | State flags, switch settings | `is_active: true` |
| short | 16-bit signed integer | Small numeric ranges, status codes | `age: 25` |
| integer | 32-bit signed integer | ID values, counters | `user_id: 12345` |
| long | 64-bit signed integer | Large numeric IDs, timestamps | `timestamp: 1640995200000` |
| float | Single-precision floating-point number | Numeric values without high precision requirements | `price: 99.99` |
| double | Double-precision floating-point number | Precise calculations, geographic coordinates | `latitude: 39.9042` |
| decimal | High-precision decimal number | Financial amounts, interest calculations | `amount: 12345.6789` |
| varchar | Variable-length string | General text such as names and email addresses | `name: "Zhang San"` |
| keyword | Non-tokenized string for exact matching | Category tags, status codes | `status: "completed"` |
| text | Tokenized text for full-text search | Product descriptions, article content | `description: "This is a product description"` |
| date | Date without time | Birthdays, order dates | `birthday: "1990-05-15"` |
| datetime | Date and time | Creation time, update time | `created_at: "2024-01-20 14:30:25"` |
| timestamp | Timestamp in milliseconds or seconds | System logs, event time | `login_timestamp: 1642671025000` |
| vector | Vector data for similarity search | AI embeddings, recommendation systems | `embedding: [0.1, 0.2, 0.3]` |
| metric | Metric data for monitoring | System monitoring, business indicators | `cpu_usage: 75.5` |
| operator | Operator or function reference | Logical computation, business rules | `calculate_score` |

### Tokenizer Reference

| Tokenizer | Suitable Language / Scenario | Characteristics |
| --- | --- | --- |
| Standard tokenizer | Mixed-language text | Splits text according to Unicode rules, lowercases automatically, and works well in general scenarios |
| IK max-word tokenizer | Chinese text | Preserves semantic completeness as much as possible and reduces ambiguity |
| English tokenizer | Pure English text | Supports stemming such as `running -> run` to improve recall |
