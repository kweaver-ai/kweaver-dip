# Skills, Tools, and MCP Guide

## Skill Overview

Skills are core capability components used to create Decision Agents for specific tasks. They are essentially the "power system" of a Decision Agent. The main categories are listed below:

| Skill Type | Definition and Purpose |
| --- | --- |
| MCP (Model Context Protocol) | An open standard for connecting AI models with data sources and tools. It replaces fragmented agent code integrations and improves the reliability and efficiency of AI systems |
| Tool | A packaged function or service that can be invoked by an agent. It is created by uploading a JSON or YAML operator file that complies with the OpenAPI 3.0 specification |
| Skill Agent | A specialized capability module that can be invoked by other Decision Agents. It does not interact directly with end users and instead provides reusable encapsulated capabilities |

## Methods for Creating Skills

Depending on business requirements, you can create skills in the following three ways. Execution Factory provides the **Tool** and **MCP** options:

| Creation Method | Description | Suitable Scenarios |
| --- | --- | --- |
| Tool | Import external tool files and skip the manual tool creation process | You already have an external tool that complies with the OpenAPI specification and want to connect it quickly |
| MCP | Connect to an external MCP service and use the standard protocol to connect data sources and tools | You need to integrate various external services in a standardized way and reduce code development costs |
| Agent | Build a capability using models, knowledge bases, memory, and other features. When publishing, choose **Publish as Skill Agent** | You need to handle complex business tasks that require coordination across multiple resources |

### Core Differences Between Tools and MCP

| Dimension | Tool | MCP |
| --- | --- | --- |
| Maintenance method | Maintained in the execution platform and supports operations such as create and disable | Treated as a toolbox. Tools are provided by the MCP server and cannot be controlled by the execution platform |
| Invocation protocol | Only needs to follow standard HTTP conventions | Must follow the fixed MCP parameter-passing format |
| Integration convenience | The integration process is relatively cumbersome | You only need to provide the MCP URL to dynamically obtain tool information, which simplifies development |

---

# Tool and Toolbox Overview

Tools are atomic capability units that agents use to perform specific tasks such as calculation, search, and operations. A toolbox is a module used to centrally manage tool collections. It supports creating toolboxes, importing tools, testing invocations, and managing tool status. It is suitable for scenarios where multiple types of tools need to be maintained in a unified way.

## Key Terms

| Term | Meaning |
| --- | --- |
| Tool | An atomic capability unit used by an agent to execute a specific task such as calculation, search, or operation |
| Toolbox | A container that groups tools. One toolbox can include multiple tools |
| OpenAPI | One of the technical options for a toolbox. It supports connecting to existing HTTP services and requires compliance with the OpenAPI specification |

---

## Scenario 1: Create a Toolbox

1. Open the toolbox list page: go to **Execution Factory > Operator Management > Tools**.
2. Start creation: click **New Toolbox** in the upper-right corner.
3. Fill in the configuration:
   - Toolbox name (required)
   - Toolbox description (required)
   - Toolbox business type (required, for example `Data Query`)
   - Toolbox technical option (choose one of two; cannot be changed afterward):
     - OpenAPI: connect to an existing HTTP service
     - Function Compute: write custom code online and let the platform host and run it
4. Click **Confirm** to complete creation.

## Scenario 2: Import Tools into a Toolbox

1. Open the target toolbox: after creating a toolbox, the system enters the toolbox detail page automatically. You can also click the toolbox name in the toolbox list.
2. Start import: click **Import Tool** and choose an import method:
   - Import an OpenAPI-format file
   - Import from an existing operator
3. Complete the import: upload the selected file or choose the operator according to the selected method. After import, the tools are displayed in the toolbox list.

## Scenario 3: Test a Tool in a Toolbox

1. Open the debugging page: in the tool list of the toolbox, find the target tool and click **Debug**.
2. Fill in the test parameters:
   - Enter the `Authorization` information in the **Input** area header
   - Fill in the parameters in the request body, such as `agent_name` and `session_id`
3. Run the test: click **Run** and review the debugging result.

## Scenario 4: Manage Tools in a Toolbox

1. Open the target toolbox: click the toolbox name from the tool list.
2. Perform management operations:
   - Enable / Disable: click the status switch on the right side of the tool. Disabled tools cannot be debugged or invoked.
   - Delete tool: click **Delete** for the corresponding tool.
   - Other operations: the system also supports actions such as taking a tool offline, permission configuration, and editing.

## Scenario 5: Import a Toolbox

1. Open the toolbox list page: go to **Execution Factory > Operator Management > Tools**.
2. Start import: click **Import Toolbox** in the upper-right corner and choose an import method:
   - Import an OpenAPI-format file
   - Import a file exported from ADP
3. Complete the import: upload the selected file. After import, the toolbox appears in the toolbox list.

---

# MCP Overview

## MCP Registration Communication Modes

When an MCP Server is registered, a communication mode must be specified. The current version supports only the following two modes:

| Communication Mode | Suitable Scenario | Configuration Requirements |
| --- | --- | --- |
| SSE (Server-Sent Events) | The MCP Server is exposed as a web service and needs to support event streams and real-time responses | Configure the URL and HTTP headers, such as `Authorization` |
| Streamable HTTP | Data needs to be returned in multiple real-time chunks within a single HTTP request, for example in large-model inference or long-text generation | Configure the URL and HTTP headers, such as `Authorization` |

> Note: `stdio` mode, which is used for local process interaction, and other extension modes are not currently supported. Support for protocols such as WebSocket and gRPC will be added later through a plugin mechanism.

## MCP Creation Methods

### New Mode

1. Connect to an existing MCP service: connect to an external MCP service already deployed by the customer.
2. Add from a toolbox: expose tools from an existing toolbox through the MCP protocol.

### Import Mode

1. Import an OpenAPI-format file.
2. Import a file exported from ADP.

## Scenario 1: Create a New MCP

1. Open the MCP list page: go to **Execution Factory > Operator Management > MCP**.
2. Choose a creation method:
   - Connect to an existing MCP service: directly connect an external service
   - Add from a toolbox: expose tools from an existing toolbox through the MCP protocol
3. Fill in the configuration: enter the MCP service name, description, communication mode, URL, headers, and other required parameters as prompted, then click **Confirm**.
4. Debug and verify:
   - Open the MCP debugging page and enter test parameters
   - Click **Run** to verify that the service works correctly
5. Ongoing management:
   - Return to the MCP list page, where you can view, edit, publish, export, configure permissions for, or delete the target MCP

## Scenario 2: Import an MCP

1. Open the MCP list page: go to **Execution Factory > Operator Management > MCP**.
2. Select the local file to import and complete the import. After import, the MCP appears in the MCP list.
