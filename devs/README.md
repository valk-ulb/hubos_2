# HubOS 2.0 - Devs Documentation

<!--## Description-->

This README is intended to provide developers with a clear and structured understanding of how the application is designed, built, and operated.

It explains the overall architecture of an application, and its modules, and the logic of TABAC rules, with a particular focus on how those rules are implemented and enforced within the system.

The document serves as a practical guide for:
- Understanding the purpose and scope of the application
- Identifying and navigating the different modules and services
- Learning how TABAC rules are modeled, validated, and applied
- Setting up a development environment and extending the application safely
- Maintaining consistency with regulatory constraints and business logic

Rather than acting as a full technical specification, this documentation aims to bridge the gap between business requirements and technical implementation, allowing any developer joining the project to quickly understand:
- How to create an application,
- How to create TABAC rules, and
- how those rules interact with the codebase.

By following this documentation, developers should be able to create new application or new features, adjust regulatory logic, or refactor existing components while preserving compliance, security, and architectural coherence.

>[!NOTE]
> For a beter and deeper understanding of this project and how it operates, it is strongly recommended to read the associated [master’s thesis](www.example.com) that led to the creation of this system. 
 
## Table of Content
TO DO
## Core Concepts

Within the HubOS environment, three core concepts must be clearly defined and understood:

### 1. HubOS System
The HubOS system is responsible for the overall platform logic. It handles:

- Application validation and lifecycle management

- Creation and orchestration of Docker containers

- Interaction with OpenHAB for the creation and management of rules, items, channels, and related automation components

The HubOS system acts as the central authority that enforces consistency, security, and regulatory constraints across all applications.

### 2. Applications

Applications are developed and shared by users. Their purpose is to extend the functionality of the OpenHAB environment.

Examples include:

- A facial recognition application using cameras connected to OpenHAB

- A local-first voice assistant application

- Security, monitoring, or automation services

Each application follows a specific directory structure, which is described in the [next section](#composition-of-an-application), and operates under the constraints defined by HubOS and the applicable rules.

### 3. Modules

Modules are the primary building blocks of applications. They consist of source code bundled with a Dockerfile and are executed within isolated Docker containers.

Each module is designed to perform a well-defined task.
The role, lifecycle, and interaction model of modules are described in more detail in a dedicated section.

## Composition of an Application
In order to ensure the proper functioning of HubOS, a strict file structure must be respected. This structure allows HubOS to discover applications, validate configuration, and orchestrate execution correctly.

Required elements:

- **<app_name>/modules/**
  
    Contains the application’s modules. Each module is an isolated functional component and must include its own source code and a Dockerfile. Modules are executed inside isolated Docker containers.

- **<app_name>/tabac-rules/rules.json**
  
    Contains the application’s TABAC rules. HubOS uses this file to validate and enforce regulatory constraints and to determine whether specific actions are allowed under defined conditions.

- **<app_name>/config.json**
  
    Defines application-level configuration (openhab related devices or servers configuration).

- **<app_name>/manifest.json**
  
    Describes application metadata and operational requirements (e.g., name, description, and modules used by the app). HubOS relies on this file to validate and register the application.
```
src/
└── apps/
    └── <app-name>/
        ├── modules/
        │   ├── <module-name1>/
        │   │   ├── Dockerfile
        │   │   └── ... # Source code
        │   ├── <module-name2>/
        │   │   ├── Dockerfile
        │   │   └── ... # Source code
        │   └── <module-name...>/
        │       ├── Dockerfile
        │       └── ... # Source code
        ├── tabac-rules/
        │   └── rules.json
        ├── config.json
        └── manifest.json
```
### Manifest file
The `manifest.json` file is used to **describe the application to the user** and to HubOS.
It defines the application’s identity, purpose, and the modules it relies on.

The manifest includes, among other things:

- The **application name**
- A **type** for the application
- A **detailed description** of the application
- The **list of modules** used by the application
  
The **primary goal of the manifest** is to provide a **clear, human-readable description** of the application and its modules, allowing both users and developers to quickly understand what the application does and how it is structured.

Fields such as **description** and **type** are designed with this objective in mind and are expected to play a much more prominent role in a future update of HubOS, where they will be more actively leveraged for application discovery, presentation, and management.

#### Application Name Constraint

It is mandatory that the name defined in the manifest **matches exactly the name of the application’s** root directory.
This requirement allows HubOS to reliably locate and return to the application root when needed during validation, execution, or recovery processes.

If the names do not match, the application will not be considered valid.

#### Modules Declaration
There is **no limit** to the number of modules that can be declared within an application.
However, each module declared in the manifest must reference an existing module directory.

More specifically:

- The **name** field of a module **must match the name of a folder** located inside the `modules/` directory.

- If a module is declared in the manifest with:
    ```json 
    {"name": "my_module"}
    ```
    then a corresponding directory `modules/my_module/` must exist.

#### Expected `manifest.json` Structure
The `manifest.json` file must follow a well-defined structure in order to be correctly validated and interpreted by HubOS.

Below is the expected structure of a valid manifest file:

```json
{
    "name": "<application_name>",
    "description": "<detailed application description>",
    "type": "<application_type>",
    "modules":[
        {
            "name": "<module_name>",
            "type": "<module_type>",
            "description": "<module descprtion>"
        },
        {
            ...
        }
    ]
}
```
##### Field Description

- **name** (string, required, unique)

    The unique name of the application.
    This value must match exactly the name of the application’s root directory.

- **description** (string, required)
    
    A detailed, human-readable description of the application’s purpose and behavior.

- **modules** (array, required)
    
    A list of modules used by the application.
    - Each entry must contain a name field.
    - The name must reference an existing directory inside modules/.

If a module declared in the manifest does not exist in the modules/ directory, the application will fail validation and will not be executed by HubOS.
### Configuration file

The `config.json` file is a JSON configuration file that allows an application to be adapted to the user’s **environment**.
It defines the variables that must be provided by the end user in order for the application to function correctly within their OpenHAB setup and usage context.

The configuration file is composed of three main sections:
- devices
- servers
- others
#### Devices
The devices section lists all OpenHAB-related devices used by the application.

```json
{
    "devices":{
        "<device_name>":{
            "UID": "<Thing_UID_or_Item_Name>",
            "type" : "<Device_type>",
            "description": "<Device description>"
        },
        "<device_name2>":{...}
    }
}
```

Each device entry is identified by a unique key, which corresponds to the device name defined by the developer.

This device name acts as a key-device_configuration identifier and must be unique within the application.
It is used by HubOS and by application modules to reference the device unambiguously and to prevent duplicates.

Each device entry describes:

- **Device name** (string, required, unique)
  
    Acts as the key-device identifier.
    This value must be unique within the application and is used to reference the device in modules.

    - **Device UID** (string, required)

        Can be either a Thing UID or an Item name defined in OpenHAB.

    - **Device type** (string, required)

        Describes the category or role of the device (e.g., camera, sensor, actuator).

    - **Description** (string, required)

        Explains the role of the device within the application.

This abstraction allows the application to remain portable across different OpenHAB installations, where device identifiers may vary.

#### Servers
The servers section lists all external servers or services that application modules may use during execution.
```json
{
    "servers":{
        "<server_name1>":{
            "host": "<IP_adresse_or_Domain_Name>",
            "description": "<Server description>"
        },
        "<server_name2>":{...}
    }
}
```
Each server entry is identified by a unique key, which corresponds to the server name defined by the developer.

This server name acts as a key-server_configuration identifier and must be unique within the application.

It is used by HubOS and by application modules to reference the server unambiguously and to prevent duplicates.

Each server entry defines:

- **Server name** (string, required, unique)
    
    Acts as the key-server identifier.
    This value must be unique within the application and is used to reference the server in modules.

    - **Host** (string, required)
    
        The server address, defined as an IP address or a domain name.

    - **Description** (string, required)
    
        Explains the role of the server or service within the application.

        This includes APIs, cloud services, or any external dependency required by the application.

#### Others

The others section contains any additional configuration elements required by the application that do not fall under the devices or servers sections.

Typical examples include:

- API tokens or keys

- Authentication credentials

- Feature flags or application-specific parameters

This section is left entirely to the developer’s discretion.
It is not read, interpreted, or used by HubOS.

Instead, it is provided as a flexible configuration space that allows developers to define additional variables that do not fit into the devices or servers categories.

How these values are accessed and used by the application will be described in detail in the Modules section, where the interaction between module code and application configuration is explained.

#### Purpose and Validation

The primary purpose of `config.json` is to define environment-dependent variables that must be completed by the end user so that the application can adapt to their specific setup.

For example, the UID or item name of an OpenHAB device may differ from one installation to another and therefore cannot be hardcoded by the developer.

The **description** and **type** fields are required and strongly encouraged for each configurable entry, as they help the end user understand:

- Why a field must be filled in

- What kind of information is expected

For other values, the developer is free to:

- Provide default values, or

- Leave them empty until completed by the end user

During application execution, HubOS will verify that **all required configuration fields have been properly completed**.
If one or more required fields are missing or incomplete, the application **will not be validated or executed**.

### TABAC rules
The TABAC rules file is a JSON document that defines which **actions** must be executed when a rule is **triggered**, while respecting additional **conditions**.

TABAC rules are closely related to the **OpenHAB rule engine**.
For this reason, developers are strongly encouraged to familiarize themselves with OpenHAB rules, as this will greatly facilitate the understanding of TABAC rules and their behavior.

The philosophy behind HubOS is to provide a **verbose and explicit rule system**, designed to make it easy to understand:
- the purpose of each rule,
- when it is triggered,
- and which actions result from it.

#### TABAC Rule Structure
Each TABAC rule is composed of:
- a **name**
- a **description**
- three main sections:
    - **when** (main trigger)
    - **conditions** (additional conditions evaluated after the trigger)
    - **then** (actions to execute)
### Modules
Dockerfile
.env

