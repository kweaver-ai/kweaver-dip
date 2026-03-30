# How to Build Data Standards

## 1. Overview

Data standard management is used to establish unified data definition standards and avoid inconsistent interpretations of the same data across different systems and users.

This module contains four core parts:
- Data elements: define the business meaning of data and its attribute standards
- Code tables: define the allowed values of fields and their meanings
- Coding rules: standardize how business codes are generated and structured
- Standard files: manage standard specification documents in a unified way

### Value

After data standards are established, you can:
- Unify data definitions
- Make data meanings clear
- Standardize data usage

This supports the following implementation scenarios:
- Semantic enhancement for business objects
- Data quality rule configuration
- System data consistency

## 2. Overall Process

Recommended sequence for building standards: **Define data elements -> Configure code tables -> Define coding rules -> Associate standard files**

Additional notes:
- Data elements are the core of the standard system
- Code tables and coding rules are optional depending on business needs
- Standard files are used for centralized management of specification documents

### Entry Path

**KWeaver DIP** > **Global Business Knowledge Network** > **General Business Knowledge Network** > **Data Standards**

## 3. Detailed Instructions

### 1. Create a Data Element

1. Go to: **Data Standards > Data Elements > New**
2. Fill in the required information, such as the Chinese name, English name, directory, department, and standard category of the data element
3. Click **OK** to complete the creation

#### Import Data Elements in Bulk

- Click **Import** to download the system import template
- Complete the data element information as required by the template
- Upload the completed file to finish the bulk import

### 2. Create a Code Table

1. Go to: **Data Standards > Code Tables > New**
2. Fill in the required information, such as the Chinese name, English name, directory, department, standard category, code values, and code value descriptions
3. Click **OK** to complete the creation

#### Import Code Tables in Bulk

- Click **Import** to download the system import template
- Complete the code table information as required by the template
- Upload the completed file to finish the bulk import

### 3. Create a Coding Rule

1. Go to: **Data Standards > Coding Rules > New**
2. Fill in the required information, such as the coding rule name, directory, department, standard category, and coding rule configuration
3. Click **OK** to complete the creation

### 4. Add a Standard File

1. Go to: **Data Standards > Standard Files > Add File**
2. Choose one of the following methods to add the file:
   - Upload a local file
   - Add a file link
3. Fill in the additional information, such as directory, department, standard category, standard file name, standard number, effective date, and description
4. Click **OK** to finish adding the file
