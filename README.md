# FinOps Automation Platform

This repository contains a Node.js backend service, a React frontend, and Kubernetes manifests for deploying to AWS EKS.

## What changed

- Unified the deployment path into a single `deploy.yml` workflow.
- Converted the Dockerfile to a multi-stage build that compiles the React frontend and packages the backend in a production image.
- Fixed the Kubernetes deployment manifest so it uses immutable image tags injected at deploy time.
- Added runtime config and secret handling for New Relic.
- Cleaned stale root package files and duplicate backend entrypoints.

## Deployment

The GitHub Actions workflow publishes a build to ECR and deploys the app to EKS.

Required repository secrets:
- `NEW_RELIC_LICENSE_KEY`

The workflow uses OIDC authentication, so your EKS cluster also needs the OIDC role mapped in `aws-auth.yaml`.

## Kubernetes

Apply the namespace and config before deployment with:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
```

Secrets are created dynamically by the GitHub Actions workflow using the repository secret.
