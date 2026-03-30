# How to View and Manage Database Tables

Database table management is used to centrally view data from connected systems and carry out basic semantic governance. It includes:
- Viewing database table and field structures
- Supplementing information for database tables and fields
- Identifying the update time of business data

Through database table management, you can transform technical data into understandable business data and provide a foundation for subsequent business object modeling and data governance.

## 1. Prerequisites

Before using the database table management feature, make sure the following conditions are met:
- A data source has already been connected
- A data scan task has been initiated for the data source and the scan task has finished running

> **Note**
> The system generates the corresponding database table information only after the data scan is completed. If the scan has not been completed, database tables cannot be viewed.

## 2. Overall Process

Main workflow of database table management: **View database tables -> Check fields -> Complete/correct information -> Save -> Data profiling (optional)**

Explanation:
- View database tables: confirm whether the data has been connected successfully
- Complete/correct information: supplement or correct table and field information
- Data profiling: identify the update time of business data

### Entry Path

Open **KWeaver DIP** > **Global Business Knowledge Network** > **General Business Knowledge Network**, then select **Database Tables** to enter the database table management page.

## 3. Detailed Instructions

### 1. View Database Tables

After entering the database table page, you can perform the following operations:
- View the list of all currently scanned database tables
- Browse the basic information of each database table and filter the list by **Organizational Structure**, **Information System**, or **Data Source**

Click any database table name or **Details** to open the details page, where you can view:
- Database table information
- Field list and field details
- Data quality

### 2. Edit a Database Table

Click **Edit/Change** to enter the database table editing page, where you can modify table and field information.

#### Editing Methods

- Double-click a database table name or field name to edit it directly
- Click a database table to modify its detailed information in the panel on the right
- Click a field to modify its detailed information in the panel on the right

#### Handling Abnormal Fields

If field exceptions occur during editing, such as duplicate names, the system marks them automatically:
- Click **All Fields** to filter abnormal fields
- Correct the abnormal fields one by one

> **Note**
> You can update the database table information only after all abnormal fields have been resolved.

#### Save Updates

After completing the modifications to fields and database table information, click **Update** in the upper-right corner of the page to submit the changes.

### 3. Profile the Update Time of Business Data

The update time of business data is used to indicate how recent the data is.

#### How to Start Profiling

In the database table list, select **Profile** > **Start Profiling** for the **Business Data Update Time** profiling task.

#### View Tasks

- After a profiling task is started, the system displays a prompt. You can click **Profiling Tasks** to view the execution status
- After closing the prompt, you can also click **Profiling Tasks** at the top of the database table list page to view all tasks

#### View Results

After profiling is completed, you can view the latest business data update time on the database table details page.
