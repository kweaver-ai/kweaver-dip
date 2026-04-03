#!/bin/bash

# Etrino Deployment Script
# Automatically add node labels, create directories and install Etrino services

# 1. Dynamically get node names from Kubernetes cluster
echo "Getting node names from Kubernetes cluster..."
NODES=($(kubectl get nodes -o jsonpath='{.items[*].metadata.name}'))

# 2. Add labels to nodes
echo "Adding labels to nodes..."
for i in "${!NODES[@]}"; do
    node="${NODES[$i]}"
    label_name="node${i}"
    echo "Labeling node ${node} with: aishu.io/hostname=${label_name}"
    kubectl label nodes "${node}" aishu.io/hostname="${label_name}"
done

echo "Node labeling completed!"

# 3. Create directories on nodes
echo "Creating required directories on nodes..."
for node in "${NODES[@]}"; do
    echo "Creating directories on node ${node}..."
    ssh "${node}" "mkdir -p /sysvol/journalnode/mycluster /sysvol/namenode /sysvol/datanode /sysvol/namenode-slaves"
done

echo "Directory creation completed!"

# 4. Add Helm repository
echo "Adding Helm repository..."
helm repo add myrepo https://kweaver-ai.github.io/helm-repo/

# 5. Update local Helm repository
echo "Updating local Helm repository..."
helm repo update

# 6. Install services in kweaver namespace
echo "Installing Etrino services in kweaver namespace..."
helm install -n kweaver vega-hdfs myrepo/vega-hdfs --version 3.1.0-release -f ~/.kweaver-ai/config.yaml
helm install -n kweaver vega-calculate myrepo/vega-calculate --version 3.3.3-release -f ~/.kweaver-ai/config.yaml
helm install -n kweaver vega-metadata myrepo/vega-metadata --version 3.3.0-release -f ~/.kweaver-ai/config.yaml

echo "Etrino services installation completed!"
