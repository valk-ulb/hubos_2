# HubOS Installation Guide

## 1. Install Ubuntu Server
Install Ubuntu Server 24.04.3 LTS normally.

## 2. Install Docker
```bash
sudo apt update
sudo apt install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

### Add Docker apt source:
```bash
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF
```

### Install Docker Engine
```bash
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### Add user to Docker group
```bash
sudo usermod -aG docker $USER
```

### Check Docker status
```bash
 sudo systemctl status docker
```

### Start Docker if necessary
```bash
sudo systemctl start docker
```

## 3. Install Java 21
```bash
sudo apt install openjdk-21-jdk
```

## 4. Install OpenHAB
```bash
curl -fsSL "https://openhab.jfrog.io/artifactory/api/gpg/key/public" | gpg --dearmor > openhab.gpg
sudo mkdir /usr/share/keyrings
sudo mv openhab.gpg /usr/share/keyrings
sudo chmod u=rw,g=r,o=r /usr/share/keyrings/openhab.gpg
echo 'deb [signed-by=/usr/share/keyrings/openhab.gpg] https://openhab.jfrog.io/artifactory/openhab-linuxpkg stable main' | sudo tee /etc/apt/sources.list.d/openhab.list
sudo apt-get update
sudo apt-get install openhab
sudo systemctl start openhab.service
sudo systemctl enable openhab.service
```

### Check OpenHab status
```bash
sudo systemctl status openhab.service
```

## 5. Install Mosquitto + Dynamic Security Plugin
Edit `/etc/mosquitto/mosquitto.conf`:
```
plugin /usr/lib/x86_64-linux-gnu/mosquitto_dynamic_security.so
plugin_opt_config_file /etc/mosquitto/dynamic-security.json
listener 1884
```

Initialize:
```bash
sudo systemctl stop mosquitto
sudo mosquitto_ctrl dynsec init /etc/mosquitto/dynamic-security.json admin-user
sudo chown mosquitto:mosquitto /etc/mosquitto/dynamic-security.json
sudo systemctl start mosquitto
```

## 6. Install gVisor
```bash
(
  set -e
  ARCH=$(uname -m)
  URL=https://storage.googleapis.com/gvisor/releases/release/latest/${ARCH}
  wget ${URL}/runsc ${URL}/runsc.sha512 ${URL}/containerd-shim-runsc-v1 ${URL}/containerd-shim-runsc-v1.sha512
  sha512sum -c runsc.sha512 -c containerd-shim-runsc-v1.sha512
  rm -f *.sha512
  chmod a+rx runsc containerd-shim-runsc-v1
  sudo mv runsc containerd-shim-runsc-v1 /usr/local/bin
)
sudo /usr/local/bin/runsc install
sudo systemctl reload docker
```
### Test gVisor
```bash
sudo docker run --rm --runtime=runsc hello-world
```

## 7. Setup repo
Clone the repo. install npm
```bash
sudo apt install npm
```
cd into the repo and install npm packages
```bash
cd hubos_2
npm i
```


## 8. Create `.env`
Update `API_TOKEN` and `MQTT_BROKER_THING_UID` with the real values from OpenHAB. Next chapters will show you how to find these values.
```bash
## POSTGRESQL 
POSTGRES_HOST=localhost
POSTGRES_DATABASE=hubos-db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=root
POSTGRES_PORT=5432

## OPENHAB
OPENHAB_URL=localhost
OPENHAB_PORT=8080
MQTT_BROKER_THING_UID=

# OPENHAB API
API_TOKEN=

## HUBOS
HUBOS_URL=127.0.0.1 # Node.js 17+ no longer prefers IPv4 over IPv6 for DNS lookups. E.g. It's not guaranteed that localhost will be resolved to 127.0.0.1 – it might just as well be ::1 (or some other IP address).
HUBOS_PORT=9090
HUBOS_PROXY_PORT=3000

## DOCKER
HOST_DOCKER_SUBNET=172.25.0.0/16
HOST_DOCKER_GATEWAY=172.25.0.1
HOST_DOCKER_IP=172.17.0.1
HOST_DOCKER_PORT=9091

## MQTT
MQTT_HOST=localhost
MQTT_PORT=1884
MQTT_ADMIN_USERNAME=admin-user
MQTT_ADMIN_PASSWORD=admin

MQTT_OPENHAB_CLIENT_USERNAME=openhabClient
MQTT_OPENHAB_CLIENT_PASSWORD=openhabClient

MQTT_HUBOS_CLIENT_USERNAME=hubosClient
MQTT_HUBOS_CLIENT_PASSWORD=hubosClient

## JWT

ACCESS_TOKEN_SECRET=f0b02766593f9ded717e8301c3012c9b07f67c86581d039da2b1fc7459e98303c1c389725b8b6ca57446dc11b72cb1c7b58f71f0887100ae41955fec4facb8e7
REFRESH_TOKEN_SECRET=5bc2168fe2ebbf4a946c9ffcfafeccc8bf4a960139b3e2eb0f2e73f592adaab846f0750f0584262127e871effbc9ce5051c9ed6ca6fdda078bcdbc4d06e73f1f
### time before jwt expiration (can be : 5s,2m,1h,1.5d, ... )
ACCESS_TIME_BEFORE_EXPIRATION=60s
REFRESH_TIME_BEFORE_EXPIRATION=1d
```


## 9. Install PostgreSQL
```bash
sudo apt install postgresql
sudo -i -u postgres
psql
ALTER USER postgres PASSWORD 'root';
CREATE DATABASE "hubos-db";
\q
logout
```
> The database creation (`CREATE DATABASE "hubos-db";`) must be done at least once on a fresh system.
## 10. Configure OpenHAB

### Login

1.  Open the OpenHAB web interface: `http://YOUR_IP:8080/`\
2.  Create an account:
    -   **Username:** `admin`\
    -   **Password:** `admin`\
3.  Skip the setup wizard.

### Create API Token

1.  Click your **profile** (bottom-left).
2.  Select **"Create New API Token"**.
    -   **Username:** `admin`
    -   **Password:** `admin`
    -   **Token Name:** `hubOS`
3.  **Do not close the page yet.**
4.  Copy the generated token and add it to your `.env` file

### MQTT Setup

1.  Go to **Add-on Store** → Install **MQTT Binding**
2.  Navigate to **Settings → Things → + → MQTT Binding → MQTT Broker**
3.  Open **Advanced Settings** and set:
    -   **Broker Hostname/IP:** `localhost`
    -   **Username:** `openhabClient`
    -   **Password:** `openhabClient`
4.  Create the Thing and copy its **Thing UID**.
5.  Add it to your `.env`

## 11. Start HubOS
```bash
node src/start.js start --debug --reset
```