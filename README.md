# HubOS 2.0 - a Local-first, private-by-design smart hub operating system

## overview 
**HubOS** is a *private-by-design* orchestration system that integrates seamlessly with the open-source home automation platform **OpenHAB**. Together, they form a new, security-focused home automation environment that remains fully aligned with the values and philosophy promoted by OpenHAB: openness, transparency, user autonomy, and independence from vendor lock-in.

Users can import or create applications designed to accomplish specific tasks while strictly following a private-by-design and local-first philosophy.

Applications operate primarily on the user’s local infrastructure, ensuring that sensitive data remains under the user’s control and is processed locally whenever possible. External communication is limited, explicit, and configurable, in order to minimize data exposure and preserve privacy.

HubOS extends OpenHAB by providing a secure execution runtime for modular applications and automation components. Its design follows a local-first philosophy, ensuring that all processing, decision-making, and data handling occur on the user's own infrastructure whenever possible. This approach enhances privacy, reduces external dependencies, and reinforces the long-term sustainability of the system. 

Built around strict principles, HubOS isolates modules, enforces controlled communication channels, and standardizes configuration and deployment flows. It operates as a complementary layer to OpenHAB, enabling: 
- Safe execution of third-party or custom applications,
- Fine-grained security controls, and 
- Extensible automation capabilities.

This project is the result of the master's thesis "[HubOS: Improving and Redesigning a Local-First, Privacy-by-Design Operating System for Smart Home Applications](TODO)", in which HubOS was redisigned, hardened, and prepared for production-grade use as a trust-enhancing companion system to OpenHAB.

### Example of Application
- **Smart Camera Monitoring Application**
  
  An application with access to a camera module that uses a facial recognition component to identify unknown faces.
  
  When an unrecognized face is detected, the application automatically sends an alert to the owner along with one or more snapshots of the event.
- **Local Voice Assistant Application**

  An application that implements a fully local voice assistant service, processing voice commands and interactions directly on the user’s device. \
  Web requests are only performed when necessary, for example to retrieve external information or to temporarily leverage a more powerful cloud-based voice assistant model.\
  In such cases, network access is explicit, controlled, and limited to the required scope, in line with the local-first and privacy-by-design principles.
## Table of Contents
### [Installation Guide](#Installation-Guide-1)
#### [Prerequisites](#prerequisites-1)
#### [Configurations](#configurations-1)
##### [Step I. Configure Mosquitto](#step-i-configure-mosquitto-dynamic-security-plugin)
##### [Step II. Configure gVisor](#step-ii-configure-gvisor-1)
##### [Step III. Configure OpenHAB](#step-iii-configure-openhab-1)
##### [Step IV. Create a Database for HubOS](#step-iv-create-a-database-for-hubos-1)
##### [Step V. Configure a Docker Network](#step-v-configure-a-docker-network-1)
##### [Step VI. Configure HubOS](#step-vi-configure-hubos-1)
##### [Step VII. Run HubOS](#step-vii-run-hubos-1)
##### [Step VIII. Add an Application](#step-viii-add-an-application-1)
## Installation Guide
### Prerequisites

HubOS has so far been tested exclusively on Linux systems (Ubuntu >= 22.04.5 lts). 
As a result, we cannot currently guarantee whether the installation procedure differs on **Windows** or **macOS** environments. Compatibility testing for these platforms is planned and the README will be updated progressively as findings become available. 

To run HubOS, the following dependencies must be installed beforehand: 
- [OpenHAB](https://www.openhab.org/download/) >= 5.0.3,
- [Java SE Development Kit](https://www.oracle.com/fr/java/technologies/downloads/) >= 21,
- [Node.js](https://nodejs.org/en/download) >= 24.12.0,
- npm >= 11.6.4,
- [Mosquitto](https://mosquitto.org/download/) >= 2.0.22,
- [Docker Engine](https://docs.docker.com/engine/install/) - latest release,
- [gvisor](https://gvisor.dev/docs/user_guide/install/) - latest release.
- [PostgreSQL](https://www.postgresql.org/download/) >14.20

### Configurations
#### Step I. Configure Mosquitto [Dynamic Security Plugin](https://mosquitto.org/documentation/dynamic-security/)

HubOS relies on the *Mosquitto Dynamic Security plugin to manage MQTT *access control* for its modules. 
This plugin allows HubOS to assign fine-grained permissions and restrict which MQTT topics each module can publish to or subscribe to.  

> [!IMPORTANT]
>If your host is already running a Mosquitto MQTT broker, enabling this plugin and changing the configuration may alter the behaviour of your existing Mosquitto instance. Make sure you understand the impact on your current setup before proceeding.

For the full and up-to-date configuration details, please refer to the official Mosquitto documentation: [Dynamic Security Plugin Documentation](https://mosquitto.org/documentation/dynamic-security/#installation)

If you just want a minimal setup compatible with HubOS, you can follow these steps:

##### 1. Enable the plugin in the Mosquitto configuration

Edit your Mosquitto configuration file (typically located at `/etc/mosquitto/mosquitto.conf`) and add:
```
plugin path/to/mosquitto_dynamic_security.so
plugin_opt_config_file path/to/dynamic-security.json
```
- It is recommended to use `per_listener_settings` false with this plugin so that all listeners share the same authentication and access control configuration.
- `path/to/dynamic-security.json` is expected to be in the same directory as the main Mosquitto configuration file, unless otherwise specified.
- On Linux you would expect the plugin library to be installed to `/usr/lib/x86_64-linux-gnu/mosquitto_dynamic_security.so` or a similar path, but this will vary depending on the particular distribution and hardware in use.


##### 2. Initialize the dynamic-security.json file

Create the initial Dynamic Security configuration file by running:
```
mosquitto_ctrl dynsec init path/to/dynamic-security.json <admin-username>
```

This command will:

- create the dynamic-security.json file, and

- define an initial admin user (admin-user) that you can use to manage roles, clients, and topic access.

>[!IMPORTANT]
>It is important to verify the permissions of the dynamic-security.json file. Make sure it is readable and writable by Mosquitto by running: `$ chmod 666 /path/to/dynamic-security.json`


>[!TIP]
>It is highly recommended to choose an admin username that is unique (not “admin”, “root”, or other common names) and a strong, randomly generated password.
This significantly increases the security of your system and prevents unauthorized access to MQTT topic management.


Once the plugin is active and the configuration file initialized, HubOS will be able to integrate with the Mosquitto Dynamic Security API to manage access control policies for its modules.

##### 3. Restart mosquitto.service
```
$ sudo systemctl restart mosquitto.service
```

#### Step II. Configure gVisor
To install gVisor as a Docker runtime, run the following commands:
```
$ /usr/local/bin/runsc install
$ sudo systemctl reload docker
$ docker run --rm --runtime=runsc hello-world
```

#### Step III. Configure OpenHAB
1. Navigate with a web browser to `http://<ip-address>:8080`
2. Continue by following the tutorial to get started
##### A. Create a new API token
To allow HubOS to authenticate and interact with your OpenHAB instance, you must create an API token.
1. Open your OpenHAB profile page `http://localhost:8080/profile/`
2. Click on “Create new API token”
    ![create new api token step 1](/images/openhab_create_new_api_token_step_1.png)
3. Complete the form
    - Enter your OpenHAB username
    - Enter your OpenHAB password
    - Choose a name for the token
    - Validate and confirm
    
    ![create new api token step 2](/images/openhab_create_new_api_token_step_2.png)
> OpenHAB will then generate the token. This token is shown only once. Make sure to copy and store it securely.

![create new api token step 3](/images/openhab_create_new_api_token_step_3.png)
##### B. Configure MQTT Client
1. Navigate to Settings → Things → +

   ![Adding a MQTT Broker step 1](/images/openhab_add_broker_step_1.png)

2. Click on Install Bindings

    ![Adding a MQTT Broker step 2](/images/openhab_add_broker_step_2.png)

3. Search for "MQTT" and install MQTT Binding by openHAB

    ![Adding a MQTT Broker step 3](/images/openhab_add_broker_step_3.png)

4. Go back to Settings → Things and click on the installed MQTT Binding

    ![Adding a MQTT Broker step 4](/images/openhab_add_broker_step_4.png)

5. Add a new MQTT Broker

    ![Adding a MQTT Broker step 5](/images/openhab_add_broker_step_5.png)

6. Enter the hostname/IP and used port of your Mosquitto broker instance 

    ![Adding a MQTT Broker step 6](/images/openhab_add_broker_step_6.png)
    >[!NOTE]
    > If your MQTT broker is running on localhost (and therefore does not support hostname validation via TLS certificates), you must disable the “Hostname validation” option in the MQTT Broker configuration.
    > This ensures that OpenHAB can successfully establish a connection to the local MQTT broker.

7. In the Username and Password fields, insert the credentials you want that OpenHAB should use to connect to the Mosquitto broker

    ![Adding a MQTT Broker step 7](/images/openhab_add_broker_step_7.png)

8.  Save the MQTT Broker Thing and take note of the Thing UID of the MQTT Broker
   
    >[!NOTE]
    >You will notice that the Thing status is OFFLINE or shows an error. This is completely normal because the credentials required to connect to the MQTT broker are not yet created (they will be generated during HubOS’s first execution).

    ![Adding a MQTT Broker step 8](/images/openhab_add_broker_step_8.png)

#### Step IV. Create a Database for HubOS.
run the following command : 
```
$ psql -U postgres -c "CREATE DATABASE hubos-db;"
```

#### Step V. Configure a Docker Network

##### Creating the Docker Network for HubOS
An important step is to create the dedicated Docker network that will be used by the containers started by HubOS.

To create the network, run:
```
$ docker network create -d bridge <hubos-network-name>
```
You are free to choose any value for <hubos-network-name>.
This command will print a network ID; the first characters of this ID correspond to the identifier of the new network interface that has been created.

![Create a new Docker network](/images/openhab_docker_network_step_1.png)

You can verify that the network was successfully created with:
```
$ docker network ls
```

![docker network ls](/images/openhab_docker_network_step_3.png)


To find the exact name of the new network interface on the host, run:
```
$ ifconfig
```

![ifconfig](/images/openhab_docker_network_step_2.png)


In our case, the interface name is: *br-8bdb0dd075ea*.

##### Adding isolation iptables rules for the HubOS network
The last step is to add iptables isolation rules specifically for this Docker network.

Run the following commands:
```
iptables --flush DOCKER-USER
iptables -A DOCKER-USER -d 127.0.0.1/32 -i br-8bdb0dd075ea -j ACCEPT
iptables -A DOCKER-USER -i br-8bdb0dd075ea -o lo -j REJECT --reject-with icmp-port-unreachable
iptables -A DOCKER-USER -i br-8bdb0dd075ea -o br-8bdb0dd075ea -j REJECT --reject-with icmp-port-unreachable
iptables -A DOCKER-USER -j RETURN
```
You can check that the rules have been correctly applied with:
```
iptables --list-rules DOCKER-USER
```
This allows you to verify that the isolation rules for the HubOS Docker network are now active.

![iptables --list-rules DOCKER-USER](/images/openhab_docker_network_step_4.png)

#### Step VI. Configure HubOS

HubOS configuration is done through the .env file located at the root of the project.

The first step is to copy the `.env.example` file and rename it to `.env` in the root directory of the project:

```
$ cp .env.example .env
```

The following sections will explain each element of the .env file in detail.

##### A. PostgreSQL
- **POSTGRES_HOST**: Specifies the hostname or IP address of the PostgreSQL server that HubOS should connect to. 
  - If running on the same host: use `localhost`
- **POSTGRES_DATABASE**: Defines the name of the PostgreSQL database used by HubOS. 
  - This database must exist before starting HubOS. We decided to name it `hubos_db`
- **POSTGRES_USER**: The PostgreSQL username that HubOS will use for authentication when connecting to the database.
- **POSTGRES_PASSWORD**: The password associated with the PostgreSQL user.
- **POSTGRES_PORT**: The port on which PostgreSQL is running.
  - By default: `5432`
##### B. OpenHAB
- **OPENHAB_URL**: Specifies the hostname or IP address of your OpenHAB instance.
  - If running on the same host: use `localhost`
- **OPENHAB_PORT**: Defines the port on which OpenHAB is accessible.
  - The default OpenHAB port is `8080`
- **MQTT_BROKER_THING_UID**: Defines the UID of the MQTT Broker Thing configured inside OpenHAB.
  - This value must correspond to the Thing UID of the MQTT Broker created during **step III.B** of the OpenHAB configuration process. Example value: `mqtt:broker:mybroker`
##### C. HubOS

- HUBOS_URL: Specifies the hostname that will be used by the HubOS instance
  - This is the address through which other services or clients can reach HubOS.
- HUBOS_PORT: Defines the port on which the HubOS instance will run.
  - This is the main port used for HubOS internal services and communication.
- HUBOS_PROXY_PORT: Specifies the port that HubOS will use for its proxy component.
##### D. Docker
- HOST_DOCKER_IP: Specifies the IP address of the host machine where Docker Engine is running. 
  - This address is used by HubOS to communicate with Docker-related services. 
- HOST_DOCKER_PORT: Defines the port used by the Docker-related service exposed on the host.
##### E. MQTT
- MQTT_HOST: Specifies the hostname or IP address of your Mosquitto broker instance.
- MQTT_PORT: Defines the port on which Mosquitto is accessible
  - The default Mosquitto port is `1883`
- MQTT_ADMIN_USERNAME: The administrator username used to authenticate with the Mosquitto Dynamic Security Plugin.

- MQTT_ADMIN_PASSWORD: The password associated with the MQTT admin user

- MQTT_OPENHAB_CLIENT_USERNAME: Insert the username that you used and defined when creating the OpenHAB MQTT Broker Thing.
- MQTT_OPENHAB_CLIENT_PASSWORD: Insert the password that you used and defined when creating the OpenHAB MQTT Broker Thing.

- MQTT_HUBOS_CLIENT_USERNAME: Insert the MQTT client username that HubOS will use to interact with the MQTT broker.
- MQTT_HUBOS_CLIENT_PASSWORD: The password associated with the HubOS MQTT client user.

> HubOS will use this field to automatically create the MQTT client for the HubOS and OpenHAB instance.
##### F. JWT

This feature will be implemented in a future release.
For now, no configuration is required.

#### Step VII. Run HubOS

It is possible that your Docker Engine requires root privileges to run containers.
In this case, you must add the user running HubOS to the docker group so it can interact with the Docker daemon without using sudo.

You can do this by running:

```
sudo usermod -aG docker $USER
```
After running this command, log out and log back in (or use newgrp docker) to apply the group changes.

From the root of the project directory, install all required dependencies using:
```
npm install
```

The project can then be executed using the following commands:

- Development mode:
    ```
    npm run dev
    ```
- Production mode:
    ```
    npm run prod
    ```

You can also use the --reset argument to clear all data created by HubOS:
```
npm run dev -- --reset
```
or 
```
npm run prod -- --reset
```
This will reset the HubOS environment to a clean state.

>[!TIP]
>It is recommended **not to run HubOS with root privileges**.
HubOS has been designed to run using **standard user privileges**, without requiring administrative access.


#### Step VIII. Add an Application

Applications are added manually to the system.\
To register a new application, the developer must copy the new application’s directory into the following location: `src/apps/`

Each application added to the src/apps/ directory is represented by a dedicated folder.
This folder must follow a predefined structure in order to be correctly recognized and executed by HubOS.

An application directory contains the following elements:

- **modules\/**

  Contains the functional modules of the application. Each module is responsible for a specific task or feature and can interact with other modules through well-defined interfaces.

- **tabac-rules/**
  
  Contains the tobacco-related rules and constraints applicable to the application. These rules define what the application is allowed to do, under which conditions, and how regulatory compliance is enforced at runtime.

- **config.json**
  
  Defines the application’s configuration parameters, such as environment-specific settings, module options, and feature toggles.

- **manifest.json**
  
  Describes the application’s metadata, including its name, version, required permissions, dependencies, and entry points.

> [!NOTE]
> Following this structure is mandatory to ensure proper loading, validation, and execution of the application within the HubOS ecosystem.

Detailed documentation regarding the expected application structure as well as the internal functioning of HubOS is available in the [devs folder](https://github.com/valk-ulb/hubos_2/tree/main/devs)

This documentation provides in-depth technical guidance for developers who wish to create, integrate, or extend applications within the HubOS ecosystem.