<callout emoji="memo" background-color="light-orange" border-color="light-orange">
In the previous step, you completed [Step 2 - Model Management](./Step%202%20-%20Model%20Management.md). You can now learn how to quickly complete data access.
</callout>

# Step 3: Data Access

In KWeaver DIP, you can use the data access feature to bring data from business systems into the platform and manage and use it in a unified way. Data access usually includes creating data source connections, building data views, and configuring data models and indicators.

This document walks you through the basic data access configuration and helps you quickly establish the basic path from raw data to business indicators.

## Feature Description

After data access is completed, you can centrally manage different data resources in the system and provide data support for later Business Knowledge Network construction, Decision Agent execution, and data analysis capabilities.

You can perform the following operations:

- Create data source connections
- Build data views
- Create data models and indicators
- Manage and maintain data resources

## Prerequisites

Before you begin, make sure the following conditions are met:

- You are logged in to the KWeaver DIP workspace.
- You have permission to use data access and VEGA Virtualization features.
- You have prepared the data source connection information, such as the address, port, username, and password.

## Instructions

Follow the steps below to complete the basic data access configuration. This usually includes data source connection creation, data view construction, and data model configuration.

You can complete the configuration flexibly according to your business needs.

## Step 1: Create a Data Source Connection

You can first create a data source connection so that the system can access external data sources.

1. Go to **VEGA Virtualization > Data Connection > Connection Management**.
2. Click **New**.
3. Select the data source type, such as `MySQL` or `Excel`.
4. Fill in the connection information:
   - Connection name. It is recommended to include the environment and purpose, for example `MySQL-Production-Orders`
   - Address, port, username, password, and other required fields
5. Click **Finish** to save the connection.

After the connection is created, the system can access the data source.

## Step 2: Create a Data View

After the data source connection is completed, you can create a data view based on the data source for unified data structure and field management.

1. Open **Data View Management**.
2. Select the corresponding data source.
3. Create a new data view.
4. Configure fields, data types, and related rules.
5. Save the data view.

## Step 3: Create Data Models and Indicators

Based on the data view, you can further build data models and business indicators to support business analysis and applications.

1. Open the data model or indicator management module.
2. Select the target data view.
3. Configure the data model structure or business indicators.
4. Save the configuration.

## Recommended Configuration Order

It is recommended that you complete data access in the following order:

1. Create a data source connection
2. Create a data view
3. Create data models and indicators

## Notes

- Data source connection information must be accurate, otherwise the connection may fail.
- It is recommended to name data sources by environment, such as development, testing, and production.
- The data view structure affects the later construction of models and indicators.
- Data permissions and access control should be configured according to actual business requirements.

## FAQ

### Why can I not connect to the data source?

Possible causes include incorrect connection information, network issues, or insufficient permissions.

### Can a data view be modified after it is created?

Yes, but structural changes may affect models or indicators that already use the view.

### Why do I need to create data models or indicators?

They are used to transform raw data into structured and business-oriented assets for later analysis and application.
