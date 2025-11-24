# Deploying the Simple Express Server StArE.js (Server version) to a Kubernetes cluster

## Description
This is an example of how to deploy the simple express server StArE.js app in a Kubernetes Cluster.

## Pre-requisites
First, you need to build the StArE.js base image ([Dockerfile](../../../../Dockerfile)) and push it
to your registry.

Then, edit the [deployment.yaml](deployment.yaml) to fit your needs. The most relevant configs are:
- replicas: how many instances of this server you want to run.
- nodeSelector.type a label to match the workload to a certain group of Kubernetes pods.
- image: the app image in your registry
- env: here you want to set the env variables (same options available as [.env.example](.env.example) file)

## Deploy
```bash
# The Kubernetes namespace you want to deploy the app onto
export NAMESPACE=starejs-express-example
# Create the namespace if not exists
kubectl create namespace $NAMESPACE
# Deploy the app using the deployment.yaml
kubectl -n $NAMESPACE apply -f deployment.yaml
# Deploy the Service to expose and put the instances behind the Kubernetes
# integrated Load Balancer
kubectl -n $NAMESPACE apply -f service.yaml
```

## How to use

```bash
npm run start
```

Now you can make request to

```
http://localhost:3001/<your-serp>?query=<your-query>&numberOfResults=<your-number-of-results-desired>
```

For example:

```
http://localhost:3001/searchcloud?query=hello&numberOfResults=10
```
