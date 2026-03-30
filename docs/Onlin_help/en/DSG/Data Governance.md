# How to Perform Data Quality Governance

## 1. Feature Description

Data quality governance is used to continuously monitor data and handle issues, ensuring its **completeness, uniqueness, standardization, accuracy, and timeliness**.

This module provides a complete closed-loop governance capability, including:
- Quality Overview: view the overall quality status
- Quality Rules: define templates for quality validation standards
- Quality Inspection: execute data inspection tasks
- Quality Reports: analyze inspection results
- Quality Rectification: handle data issues

After data quality governance is implemented, the system can:
- Detect data issues in a timely manner
- Provide clear standards for measuring data quality
- Track data issues and handle them through a closed loop
- Continuously improve data quality

## 2. Prerequisites

Before initiating data quality governance, make sure the following condition is met:
- Data objects to be governed, such as database tables, are already available

> **Note**
> Data quality governance relies on database table data for inspection and analysis.

## 3. Overall Governance Process

Standard process: **Initiate a quality inspection (select inspection objects + inspection rules) -> Execute the inspection -> Generate a report -> Initiate rectification -> Process rectification -> Re-inspect for verification**

> **Explanation**
> - Rules determine the inspection standards
> - Inspection is used to identify issues
> - Reports are used to analyze issues
> - Rectification is used to solve issues
> - Re-inspection is used to verify the results

## 4. Entry Path

**KWeaver DIP** > **Global Business Knowledge Network** > **General Business Knowledge Network** > **Data Quality**

## 5. Detailed Steps

### 1. Create a Quality Inspection Work Order

Entry: **Data Quality Management > Quality Inspection > Created by Me > New Quality Inspection Work Order**

Steps:
1. Fill in the basic information of the inspection work order
2. Select the database tables to be inspected
3. Configure the quality inspection rules
4. Click **Submit**

Execution notes:
- After the work order is created, the system automatically generates an inspection task
- The assignee can process the task under **Data Quality Management > Quality Inspection > Assigned to Me**

### 2. Configure Quality Rules

Quality rules define whether data is qualified. They must be configured when creating a work order.

#### Method 1: Use an Existing Quality Rule Template (Recommended)

Rule creation entry: **Data Quality Management > Quality Inspection > New Rule**

Supported rule types:
- Table level: timeliness
- Row level: completeness, uniqueness, accuracy
- Field level: completeness, uniqueness, standardization, accuracy

After a rule is created, the existing template can be selected directly in the work order.

#### Method 2: Create a Rule Manually

On the inspection work order creation page, click **New Rule** to create a temporary rule.

### 3. View Quality Reports

Entry: **Data Quality Management > Quality Reports**

Available operations:
- View inspection results
- Analyze the distribution of data issues
- Determine whether the data meets the standard

If the result does not meet the standard, you can directly initiate **Quality Rectification** from the page.

### 4. Initiate Quality Rectification

Entry: **Quality Report page > Initiate Quality Rectification**

Steps:
1. Fill in the basic information of the rectification work order
2. Fill in the rectification content
3. Submit the work order

The work order is automatically routed to the corresponding handler, who performs the repair in the rectification module.

### 5. Execute Rectification Processing

Entry: **Data Quality Management > Quality Rectification > Rectification Processing**

Steps:
1. Find the corresponding rectification work order and click **Start Processing**
2. Complete the data correction offline
3. Re-initiate profiling or inspection to compare the effect before and after rectification

Result operations:
- If the result meets the standard, click **Complete Work Order**
- If the result does not meet the standard, click **Reject Work Order** and start rectification again

### 6. Manage Quality Rectification Work Orders

Entry: **Data Quality Management > Quality Rectification > Quality Rectification Work Orders**

You can view:
- All rectification work orders
- The progress of unfinished work orders
- The results of completed work orders

Supported operations:
- Send reminders for unfinished work orders
- Provide feedback on completed work orders

### 7. View the Quality Overview

Entry: **Data Quality Management > Quality Overview**

You can view:
- The overall data quality status of each department
- Rankings of departments with high data quality
- Rankings of departments pending rectification
