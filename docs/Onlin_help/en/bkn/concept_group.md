# Concept Groups

**Scope**: ADP BKN module. Intended for business analysts, data engineers, AI engineers, and other users who need to manage concepts in a BKN.  
**Related module**: BKN > BKN

## Overview

### Feature Definition

Concept Groups are a core feature in the ADP BKN module used to logically organize and manage **object classes, relationship classes, and action classes** in a BKN. With this feature, users can organize scattered concepts into different groups based on actual business scenarios. A single concept can belong to multiple groups. The main value of the feature is as follows:

- **Improve BKN management efficiency**: business users can quickly locate relevant concepts from a business perspective such as `Recruitment` or `Customer Service`, without searching the full concept set.
- **Accelerate BKN rollout**: implementers can quickly configure and validate business logic by group, reducing repetitive work.
- **Improve retrieval precision**: groups narrow the query scope and help users find target concepts more efficiently, especially in complex BKN scenarios.

### Application Scenarios

| User Role | Scenario Description | Functional Value |
| --- | --- | --- |
| Business Analyst | During requirement analysis, needs to view all object classes and relationship classes under a specific business perspective such as `Recruitment` | Quickly understand the business structure without full-scope searching and improve analysis efficiency |
| Data Engineer | Needs to process similar object classes, relationship classes, and action classes in batches while configuring data source mappings for agents | Supports batch export, import, and modification of BKN configurations, reducing repetitive operations and configuration errors |
| AI Engineer | Needs to retrieve knowledge under a specific scenario such as `Customer Service` when building a RAG system | Limits the retrieval scope by group, provides more accurate knowledge data, and improves the accuracy and relevance of agent responses |

## Prerequisites

Before using Concept Groups, make sure the following conditions are met:

1. You are logged in to ADP and have entered the **BKN** module.
2. You have access to the target **BKN**, granted by the system administrator.
3. To create, edit, or delete groups, you must have the corresponding functional permissions. For details, refer to the ADP permission management guide.

## Operation Guide

### Create a Concept Group

1. In ADP, go to **BKN**, and in the BKN list select the target BKN where the group will be created.
2. After entering the target BKN, click **Concept Groups** in the left navigation bar to open the list page.
3. Click **New** in the upper-left corner to open the **Create Concept Group** dialog.
4. Fill in the required information. Fields marked with `*` are mandatory:
   - **Name***: Enter the group name. Up to 40 characters. It cannot be empty and must be unique under the same branch of the same BKN.
   - **ID**: Optional custom value. Only lowercase letters, digits, underscores, and hyphens are allowed. It cannot begin with an underscore or hyphen. If not specified, the system generates it automatically. It cannot be changed after creation.
   - **Tags**: Up to 5 tags can be added. Each tag can contain up to 40 characters and cannot include `# \ / : * ? " < > |`.
   - **Remarks**: Optional. Up to 255 characters.
5. After completing the form, click **Confirm** to create the concept group.

### View the Concept Group List and Details

#### View Group Details

1. Go to the **Concept Groups** list page and locate the target group.
2. Click anywhere on the group row, or click **View** in the actions column, to open the detail side panel.
3. In the side panel, you can view:
   - Basic information: group name, ID, tags, remarks, creation time, and update time
   - Associated resources: the counts and detailed lists of object classes, relationship classes, and action classes

#### Notes

- By default, all concept groups in the current BKN are sorted by **update time** in descending order.
- The **Associated Resources** column separately displays the full count of object classes, relationship classes, and action classes.
- By default, only the first two tags are displayed. If there are more than two, the UI shows `+N`, where `N` is the number of remaining tags. Hover over `+N` to view all tags.

### Edit a Concept Group

1. Go to the **Concept Groups** list page and locate the group to edit.
2. Click **Edit** in the actions column to open the **Edit Concept Group** dialog.
3. Modify the information. The rules are the same as during creation, and the **group ID cannot be changed**:
   - Name: must remain unique under the same branch of the same BKN and can contain up to 40 characters
   - Tags: you can add new tags, up to 5 in total, or remove existing tags, while following the tag character rules
   - Remarks: existing remarks can be updated or deleted, up to 255 characters
4. Click **Confirm**. The system displays **Edit successful**, and the update is completed.

### Delete a Concept Group

> Warning: After a group is deleted, its associations with all concepts are automatically removed. Group information and association records cannot be restored. The concepts themselves are not deleted.

1. Go to the **Concept Groups** list page and locate the group to delete.
2. Click **Delete** in the actions column. The system shows a confirmation dialog stating that deleting the group may cause features using this group to stop working properly.
3. Click **Confirm** to delete the group, or **Cancel** to abort.

### Add Object Classes to a Concept Group

> Note: After an object class is added, its related relationship classes and action classes are automatically associated with the group. No separate action is required.

1. Go to the **Concept Groups** list page, click the target group, and enter the **Group Edit** page.
2. Under **Group Details** on the left, click the **Object Classes** tab, and then click **Add** to open the **Select Object Class** dialog.
3. Select the object classes to add:
   - The left side shows the full object class list. You can filter it by entering keywords in **Search by Name**, or use **Tag Filter** to filter by a single tag.
   - Select the object classes to add. Object classes already associated with the current group are shown as selected and cannot be selected again. Selected items are synchronized to the **Selected Object Classes** list on the right.
   - To remove a selected object class, click the **x** icon after that object class in the right-side list.
4. After confirming the selection, click **Confirm**. The system displays **Added successfully**, and the object classes are added.

### Remove Object Classes from a Concept Group

> Warning: After object classes are removed, their related action classes and all dangling relationship classes are also permanently removed from the group and cannot be restored. This operation only removes the association between the object class and the current group. It does not delete the object class itself.

1. Go to the **Concept Groups** list page, click the target group, and enter the **Group Edit** page.
2. Under **Group Details** on the left, click the **Object Classes** tab to view the current object class list in the group.
3. Select the object classes to remove. Multiple selection is supported. Then click **Remove** above the list. The system shows a confirmation dialog stating that removing the selected object classes will also remove their related action classes and dangling relationship classes, and that the operation cannot be restored.
4. Click **Confirm** to continue. The system displays **Removed successfully**, and the selected object classes are removed. Click **Cancel** to abort.

### Import and Export Concept Groups

#### Export a Concept Group

1. Go to the **Concept Groups** list page and locate the group to export.
2. Click **Export** in the actions column. The system automatically generates and downloads a JSON export file. The file name usually contains the group name and export time.
3. The exported file includes the group's basic information, such as name, ID, tags, and remarks, as well as associated concept information for object classes, relationship classes, and action classes.

#### Import a Concept Group

> Note: Import supports only a single concept group at a time, in a single JSON file. Batch import is not supported. The system saves only the relationships between object classes and existing groups. If a group does not exist, that relationship is not saved.

1. Go to the **Concept Groups** list page of the target BKN and click **Import** in the upper-right corner to open the **Import Concept Group** dialog.
2. Click **Select File** and choose the JSON file to import from your local machine. The system automatically filters out non-JSON files.
3. After the file is uploaded, the system automatically checks whether there are groups with duplicate IDs or names:
   - If there is no conflict, the import starts directly, and the system displays **Import successful** after completion.
   - If conflicts are detected, the system opens a **Conflict Handling** dialog and lets you choose a handling method:
   - **Overwrite**: replace the existing group in the system with the information from the imported file
   - **Create New**: create a new group in the system and write the imported content into it
   - **Ignore**: keep the existing group in the system and skip the conflicting item in the imported file
   - You can also select **Apply this action to all subsequent similar conflicts** to avoid choosing repeatedly for later conflicts
4. After selecting the handling method, click **Confirm**. The system starts the import and displays **Import successful** after completion. If some content is not imported, the reason is shown.

## Notes

- Concept Groups **do not support nesting**. One group cannot contain another group.
- Relationship classes and action classes **cannot be added, edited, or assigned to groups directly**. They can only be associated indirectly through related object classes. After an object class is added, the associations are created automatically. After an object class is removed, the associations are removed automatically.
- Group names must be **unique within the same BKN**, and custom group IDs must follow the character rules and cannot be changed after creation.
- Up to 5 tags can be added. Each tag can contain up to 40 characters and cannot include `# \ / : * ? " < > |`.
- When an object class is deleted, the system automatically removes its associations with **all concept groups**. These association records cannot be restored.
- Import and export support **only a single concept group** at a time. Export files are in JSON format and include group information together with associated concepts.

## FAQ

Q1: **Why can't I add a relationship class or action class directly to a concept group?**  
A1: Handle it according to the following logic:

- Relationship classes and action classes depend on object classes. For example, in the relationship `Employee - Belongs To - Department`, `Employee` and `Department` are object classes. Adding the relationship by itself has no practical business meaning.
- Associating through object classes avoids invalid associations between relationship classes or action classes and groups, and keeps the BKN logically consistent.
- If you need to add relationship classes or action classes, add their related object classes first. The system associates the related items automatically.

Q2: **What should I choose when conflict prompts appear during concept group import?**  
A2: Choose the handling method based on your goal:

- Choose **Overwrite** when the imported file is the latest version and should replace the existing group. The original group's basic information and associations are overwritten.
- Choose **Create New** when you want to preserve the imported content without affecting existing groups. The system creates a new group and writes the imported configuration and associations into it.
- Choose **Ignore** when you want to keep the existing groups in the system and import only non-conflicting groups. The system skips duplicate items and imports only content without conflicts.
- If there are multiple repeated conflicts, you can select **Apply this action to all subsequent similar conflicts** to avoid making the same choice repeatedly.

Q3: **If a concept group is deleted, are the previously associated object classes in the BKN also deleted?**  
A3: No. The details are as follows:

- Deleting a group only removes the associations between that group and all related concepts, including object classes, relationship classes, and action classes.
- The group information itself, such as name, ID, tags, and association records, is deleted.
- Object classes, relationship classes, and action classes remain in the BKN and can still be queried, used, or associated with other groups later.
