#!/bin/bash


function replaceOrAppendLine() {
    TARGET_FILE=$1
    LINE_SEARCH_STRING=$2
    LINE_REPLACEMENT=$3
    if grep -q "$LINE_SEARCH_STRING" "$TARGET_FILE"; then
        LINE_NUMBER=$(grep -n -m1 "$LINE_SEARCH_STRING" "$TARGET_FILE" | cut -d: -f1)
        echo "Line with $LINE_SEARCH_STRING already found, updating > $TARGET_FILE"
        sed -i "$LINE_NUMBER s|.*|$LINE_REPLACEMENT|" "$TARGET_FILE"
    else
        echo $LINE_REPLACEMENT >>"$TARGET_FILE"
        echo "Appended to $TARGET_FILE"
    fi
}

function replaceLineOnly() {
    TARGET_FILE=$1
    LINE_SEARCH_STRING=$2
    LINE_REPLACEMENT=$3
    if grep -q "$LINE_SEARCH_STRING" "$TARGET_FILE"; then
        LINE_NUMBER=$(grep -n -m1 "$LINE_SEARCH_STRING" "$TARGET_FILE" | cut -d: -f1)
        echo "Line with $LINE_SEARCH_STRING already found, updating > $TARGET_FILE"
        sed -i "$LINE_NUMBER s|.*|$LINE_REPLACEMENT|" "$TARGET_FILE"
    else
        echo "Search string not found, not touching file $TARGET_FILE"
    fi
}

function sudoReplaceOrAppendLine() {
    TARGET_FILE=$1
    LINE_SEARCH_STRING=$2
    LINE_REPLACEMENT=$3
    if grep -q "$LINE_SEARCH_STRING" "$TARGET_FILE"; then
        LINE_NUMBER=$(grep -n -m1 "$LINE_SEARCH_STRING" "$TARGET_FILE" | cut -d: -f1)
        echo "Line with $LINE_SEARCH_STRING found, updating > $TARGET_FILE"
        sudo sed -i "$LINE_NUMBER s|.*|$LINE_REPLACEMENT|" "$TARGET_FILE"
    else
        echo $LINE_REPLACEMENT | sudo tee -a "$TARGET_FILE"
        echo "Appended to $TARGET_FILE"
    fi
}

function sudoReplaceLineOnly() {
    TARGET_FILE=$1
    LINE_SEARCH_STRING=$2
    LINE_REPLACEMENT=$3
    if grep -q "$LINE_SEARCH_STRING" "$TARGET_FILE"; then
        LINE_NUMBER=$(grep -n -m1 "$LINE_SEARCH_STRING" "$TARGET_FILE" | cut -d: -f1)
        echo "Line with $LINE_SEARCH_STRING found, updating > $TARGET_FILE"
        sudo sed -i "$LINE_NUMBER s|.*|$LINE_REPLACEMENT|" "$TARGET_FILE"
    else
        echo "Search string not found, not touching file $TARGET_FILE"
    fi
}



echo
echo '--------------------------------Step 1 REMOTE microK8s STARTED--------------------------------'

if [ ! -f /bin/sudo ] && [ ! -f /usr/bin/sudo ]; then
  echo '----- STEP 1.1: Debian prerequisites -----'
  apt update && apt install -y sudo
fi
echo '----- STEP 1.2: other prerequisites -----'
sudo apt update
sudo apt install -y locales
sudo locale-gen en_US.UTF-8
sudoReplaceOrAppendLine /root/.profile LC_ALL 'export LC_ALL=en_US.UTF-8'
sudo apt install -y snapd mc net-tools htop iotop vim nmon fuse squashfuse

echo '----- STEP 1.3: ELK folder permissions and OS settings -----'
mkdir -p /volumes/logstash/data
chmod 0777 /volumes/logstash/data
sudo sysctl -w vm.max_map_count=262144
sysctl -w fs.inotify.max_user_watches=1200000
sysctl -w fs.inotify.max_user_instances=700
sysctl -w fs.inotify.max_queued_events=1200000
sysctl -w vm.max_map_count=262144
#replaceOrAppendLine /etc/sysctl.conf max_map_count "vm.max_map_count=262144"

echo '----- STEP 1.4: installing microk8s -----'
cd /tmp
# upgrade snap core for Debian 10 bw compatibility
sudo snap install core
# and also update if necessary
sudo snap refresh core

sudo snap install microk8s --channel=1.28/stable --classic

echo '----- STEP 1.5: microk8s permissions and PATH -----'
sudo usermod -aG microk8s root
if [ ! $(sudo which microk8s) ]; then
  if ! grep -q /snap/bin ~/.profile; then
    sudo echo 'export PATH="$PATH:/snap/bin"' >> /root/.profile
  fi
fi
touch /etc/sudoers.d/paths
chmod 0440 /etc/sudoers.d/paths
replaceOrAppendLine /etc/sudoers.d/paths secure_path "Defaults        secure_path=\"/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin\""

echo '----- STEP 1.6: adding ingress, dns, storage, helm to microk8s -----'
set -x
sudo microk8s.status --wait-ready
#sudo microk8s.disable ha-cluster --force
#sudo microk8s.disable metrics-server
sudo microk8s.enable dns
sudo microk8s.enable ingress
sudo microk8s.enable hostpath-storage
sudo microk8s.enable helm3
sleep 3
sudo microk8s.start
echo '----- STEP 1.7: microk8s.status --wait-ready -----'
sleep 10
sudo microk8s.status --wait-ready
set +x

echo '----- STEP 1.8: Updating kubelet to support 1000 pods -----'
replaceOrAppendLine $currentSnapPath/args/kubelet 'max-pods' "--max-pods=1000"
sudo systemctl restart snap.microk8s.daemon-kubelet

echo '----- STEP 1.9: enabling dash and finishing up -----'
sudo microk8s.enable dashboard

sudoReplaceOrAppendLine /root/.bashrc "cluster_aliases" "source ~/cluster_aliases.sh"

#echo '----- STEP 1.10: enabling cert-manager stuff -----'
# see https://microk8s.io/docs/addon-cert-manager
#microk8s kubectl apply -f - <<EOF
#---
#apiVersion: cert-manager.io/v1
#kind: ClusterIssuer
#metadata:
# name: lets-encrypt
#spec:
# acme:
#   email: microk8s@example.com
#   server: https://acme-v02.api.letsencrypt.org/directory
#   privateKeySecretRef:
#     # Secret resource that will be used to store the account's private key.
#     name: lets-encrypt-private-key
#   # Add a single challenge solver, HTTP01 using nginx
#   solvers:
#   - http01:
#       ingress:
#         class: public
#EOF

echo '--------------------------------microK8s setup COMPLETED--------------------------------'
