# Step 1: Complete Basic Enterprise Configuration

Before you start using **KWeaver DIP**, you first need to complete the basic configuration of your enterprise organizational structure. In this section, you will learn how to quickly set up organizations, departments, and users, and how to use multiple import methods such as domain controller synchronization and template import to complete initialization efficiently.

A well-designed organizational structure not only helps with user management, but also directly affects later permission configuration, role assignment, and business collaboration efficiency. It is a critical foundation for stable system operation.

## Add or Import Users, Departments, and Organizations

In the DIP system workspace, you can quickly initialize the organizational structure, including creating organizations, departments, and users. You can also batch import users and organizations through domain control or templates. This document walks you through the basic configuration of users, departments, and organizations.

## Feature Description

After the organizational structure is configured, you can centrally manage users and their affiliations in the system and lay the groundwork for later permission assignment, role settings, and business collaboration.

You can perform the following operations:

- Create organizations and departments
- Create users
- Import domain users and organizations
- Export and import users and organizations through a template
- Edit, delete, or move users, departments, and organizations

## Setup Steps

Follow the steps below to quickly add or import users, departments, and organizations.

### Step 1: Create Organizations and Departments

You can first create one or more independent organizations in the system and then continue building the department structure under each organization.

1. Go to **Organization Management > Users and Departments > Department Management**.
2. Create organizations according to your business needs.
3. After an organization is created, select the target organization.
4. Click **Department Management > New Department** to create departments under that organization.

After creation, you can continue editing or deleting organizations and departments, or move them to other organizations or departments.

### Step 2: Create Users

After the organizations and departments are set up, you can add users to the designated organization.

1. Go to **Organization Management > User Management > Users and Departments**.
2. Select the organization where you want to create users.
3. Click **User Management** and then select **New User**.
4. Fill in the user's basic attributes in the dialog box.

After a user is created, administrators can also perform the following management operations:

- Edit user information
- Delete users
- Move users
- Remove users from the current organization
- Assign roles to users
- Set the user security level

### Step 3: Import Domain Users and Organizations

If your enterprise has already connected a domain controller, you can import domain users and organizations through domain authentication integration to reduce manual maintenance costs.

1. Click **Organization Management > User Management > Domain Authentication Integration** and create new domain controller information.
2. After the domain controller is enabled, go to **Organization Management > User Management > Users and Departments**.
3. Click **Import User Organization**.
4. Select **Import Domain User Organization**.
5. Fill in the required configuration information in the dialog box.
6. After confirming the information is correct, click **Import**.

After the import is complete, the system imports users and the organizational structure from the domain into AnyShare according to the configuration.

### Step 4: Export and Import Users and Organizations Through a Template

If you want to maintain users and organization information in batches, you can also use a template file for export and import.

1. Go to **Organization Management > User Management > Users and Departments > Import User Organization > Export and Import User Organization**.
2. Click **Export** to download the default AnyShare user-organization template.
3. Fill in user information based on the template requirements and save the spreadsheet file.
4. In the import dialog box, click **Select File** and upload the completed spreadsheet.
5. Choose one of the following import strategies based on your needs:
   - Overwrite users with the same name
   - Skip users with the same name
6. Click **Import** to complete the batch import of users and organizations.

This method is suitable for quickly maintaining a large number of user records during the initial deployment stage or when the organizational structure is adjusted.

## Follow-up Information

After you finish adding or importing users, departments, and organizations, you can continue with role assignment, permission control, and organizational structure adjustment to make system management more standardized and efficient.
