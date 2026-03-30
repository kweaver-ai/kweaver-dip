# Create Digital Workers

## Contents

- Prerequisites
- Overall creation workflow
- Step 1: Create job responsibilities
- Step 2: Configure skills
- Step 3: Configure knowledge
- Step 4: Configure channel integration
- Final release
- Related information

Through the KWeaver DIP platform, you can configure a dedicated Digital Worker for your enterprise. Creating a Digital Worker requires four steps in sequence: **job responsibilities, skill configuration, knowledge configuration, and channel integration**. After the setup is completed, the Digital Worker can be invoked and interacted with in the enterprise IM system to support different job requirements.

---

## Prerequisites

Before you start creating a Digital Worker, make sure the following conditions are met:

- You have a **KWeaver DIP platform administrator account and password**
- You can access the standard **KWeaver DIP platform login page**
- You have prepared the basic job information, skill requirements, and the **API Key** and **API Secret** for the IM channel to be connected for the Digital Worker

> **Note**
> The configuration in each step is saved automatically during creation. However, after you complete all configuration and verification steps, you still need to perform one final manual save before the Digital Worker is officially released and made available.

---

## Overall Creation Workflow

The creation process of a Digital Worker contains four core steps and must be completed in order:
**Step 1: Create job responsibilities -> Step 2: Configure skills -> Step 3: Configure knowledge -> Step 4: Configure channel integration**

After each step is completed, the system automatically saves the current configuration. After all steps are configured and validated, you still need to manually perform the final save operation. Once the save is successful, the Digital Worker becomes available to all employees in the enterprise.

From the perspective of human-role simulation, these four steps correspond to the Digital Worker's:

- **Identity naming**
- **Skill assignment**
- **Knowledge reserve**
- **Interaction channel setup**

Through these four steps, you can complete the full configuration of a Digital Worker, from role definition to production integration.

### Instructions

Log in to **KWeaver DIP**, click **My Digital Workers > Create**, and enter the Digital Worker creation page.

---

## Step 1: Create Job Responsibilities

In this step, you need to fill in three pieces of basic information. All fields support natural language input. The **Digital Worker name** is required. If it is left blank, you cannot proceed to the next step.

### Digital Workers Name

Set a dedicated identifier for the Digital Worker. It is recommended to keep it consistent with, or closely related to, the actual job title for easier identification and management.

### Role Definition

Define the core work items of this Digital Worker, namely the specific tasks that this role needs to complete in the enterprise.

### Job Description

Define the responsibility boundaries of the Digital Worker, including its scope of work, authority boundaries, and collaboration boundaries.

### Instructions

1. On the **Job Responsibilities** page, enter the Digital Worker name.
2. Enter the role definition to describe the core tasks that the Digital Worker needs to undertake.
3. Enter the job description to define the responsibility boundaries.
4. After the information is completed, the system automatically saves the current configuration.

> **Note**
> The Digital Worker name is required. If it is left blank, the Digital Worker cannot be released.

---

## Step 2: Configure Skills

In the skill configuration step, you need to configure the **skills** that match the role positioning and work tasks of the Digital Worker. Skills can be configured in two ways. They can be used separately or in combination. Configured skills can be debugged, modified, and released.

### Instructions

Click **Create Digital Worker > Skill Configuration > +Skill** to open the skill selection dialog.

### Method 1: Select Existing Platform Skills

If reusable skills already exist on the platform, you can select them directly from the skill library.

#### Instructions

1. In the skill dialog, select the skills to add to the current Digital Worker. Multiple selection is supported.
2. After making the selection, click **Temporary Save**. The selected skills are temporarily saved to the current Digital Worker's skill list.

### Method 2: Create a New Skill with Natural Language

If there is no directly reusable skill on the platform, you can create a new skill by using natural language.

#### Instructions

1. Click **Create Skill** on the page to open the skill creation input box.
2. In the input box, describe the skill in natural language. It is recommended to clearly include the following information:
   - Applicable scenarios
   - Core operations
   - Expected results
3. After the input is complete, click **Generate**.
4. The platform's skill creation agent automatically generates the skill content according to the skill specification.
5. After generation is complete, you can review the full skill content on the page.

### Skill Debugging and Release

Whether you select an existing skill or create a new one, it is recommended to review and debug the skill before officially assigning it to the Digital Worker.

#### Instructions

1. Review and test the selected or generated skill content.
2. If you need to make changes, click **Edit** on the right side of the skill.
3. Save the modified content after adjustment.
4. After debugging confirms that everything is correct, click **Release** above the skill list.
5. After the release is completed, the skill is officially assigned to the current Digital Worker.

> **Important**
> After a skill is released, it is synchronized to the Digital Worker skill library. In the current version, it **cannot be deleted directly** and can only be updated later through editing.

> **Related Reference**
> For skill creation specifications and detailed instructions, see **"How to Create a Skill"**.

---

## Step 3: Configure Knowledge

In the knowledge configuration step, you need to configure the business knowledge that the Digital Worker can use. The configuration logic is similar to skill configuration and also supports two methods. Knowledge reserve mainly relies on the platform's global **BKN**.

### Instructions

Click **Create Digital Worker > Knowledge Configuration > +Knowledge** to open the BKN selection dialog.

### Method 1: Create Knowledge with Natural Language

This method is suitable when you need to customize dedicated knowledge content for the Digital Worker.

#### Instructions

1. Use natural language to describe the knowledge to be configured. It is recommended to clearly include the following information:
   - Knowledge domain
   - Applicable scenarios
   - Core knowledge points
2. After the input is complete, follow the platform prompts to create the dedicated BKN.
3. After creation is completed, associate it with the current Digital Worker.

### Method 2: Select Existing Platform Knowledge

This method is suitable when you want to directly reuse a global **BKN** that has already been configured on the platform.

#### Instructions

1. View the BKNs already available on the platform and select the knowledge network to configure for the current Digital Worker.
2. If you need to review the content further, click **View Details** to check the complete information of the BKN.
3. After confirmation, select it to formally configure the BKN for the current Digital Worker.

### Knowledge Details You Can View

In the BKN details, you can usually view the following information:

- Detailed information about object classes, relationship classes, and action classes
- Related data mapped to object classes
- The number of associations of relationship classes and how objects are connected
- The basic required conditions corresponding to action classes

After the knowledge configuration is completed, the system automatically saves the current configuration.

> **Related Reference**
> For detailed instructions on creating a BKN with natural language, see **"How to Create a BKN with Natural Language"**.

---

## Step 4: Configure Channel Integration

Channel integration is used to configure the interaction channel of the Digital Worker, enabling it to be invoked and interacted with directly in the enterprise IM system. The current version has clear limits on supported channels and configuration methods, so the setup and testing must be completed step by step.

### Instructions

Click **Create Digital Worker > Channel Integration > +Channel** to open the channel selection dialog.

### Channel Support Rules

The current version supports the following two enterprise IM interaction channels:

- **Feishu**
- **DingTalk**

At the same time, the current version has the following restrictions:

- One Digital Worker **supports only one channel**
- The Digital Worker can be invoked and interacted with only in the selected IM system
- If you need to switch channels, you must first delete the original channel configuration and then add the new one

### Channel Configuration Steps

1. Click **+Channel** on the page.
2. In the channel types displayed on the platform, select the channel to integrate, either **Feishu** or **DingTalk**.
3. Open the configuration page of the selected channel.
4. Enter the corresponding **API Key** and **API Secret** for the channel.
5. After the information is completed, click **Test Connection** on the page to run the connection test.
6. After the test passes, the system automatically saves the current channel configuration.

> **Important**
> **API Key** and **API Secret** are required. If either is missing or incorrect, channel setup will fail.

---

## Final Release

After completing and validating the four steps, **job responsibilities, skill selection or creation, knowledge configuration, and channel integration**, you can perform the final release.

### Instructions

1. Confirm that all configuration information is correct.
2. Click **Release** at the top of the page to complete the final save of all configurations.
3. After the save succeeds, the Digital Worker is successfully created.

After release, the Digital Worker will:

- Be available to all employees in the enterprise
- Be invoked and used through the selected enterprise IM channel

> **Note**
> The current version supports **visibility to all users only**. It does not yet support limiting visibility by department or personnel scope.

---

## Related Information

- How to Create a Skill
- How to Create a BKN with Natural Language
- Digital Worker Skill Editing and Update Guide
- How to Obtain API Key and API Secret for Enterprise IM Channels
- Digital Worker Configuration Troubleshooting FAQ
