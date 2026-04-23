# Activity-3 Deployment Plan (AWS + Hostinger, No Route53)

This guide deploys your project using AWS services and Hostinger DNS only.

Scope:
- Use CloudFormation for infra
- Use CodePipeline/CodeBuild for CI/CD
- Use Hostinger for DNS and ACM validation
- Do not create or use Route53 records

## 1) Fixed Inputs

- AWS region (stacks): `ap-south-1`
- CloudFront certificate region: `us-east-1`
- Root domain: `gamesta.in`
- API subdomain (you create in Hostinger): `api.gamesta.in`
- GitHub repo: `PranavParalkar/Gamesta_SpringBoot`

## 2) What Changes vs Original Route53 Plan

1. Deploy stacks:
- `gamesta-network`
- `gamesta-backend`
- `gamesta-frontend`
- `gamesta-cicd`

2. Skip stack:
- `gamesta-dns` (template `infra/cloudformation/04-dns.yml`)

3. DNS records are created manually in Hostinger.

## 3) Pre-Setup Checklist

1. Hostinger domain `gamesta.in` is active.
2. GitHub repository is accessible.
3. In AWS, set region to `ap-south-1` for stack deployment.
4. Prepare secrets:
- DB password
- Admin secret
5. Create CodeStar connection in AWS Developer Tools and keep ARN.

## 4) ACM Certificate (Important)

CloudFront custom domain cert must be in `us-east-1`.

1. Open ACM in `us-east-1`.
2. Request public certificate for:
- `gamesta.in`
- `*.gamesta.in`
3. Choose DNS validation.
4. ACM will show CNAME validation records.
5. Go to Hostinger DNS zone and add all ACM CNAME records exactly.
6. Wait until ACM status becomes `Issued`.

## 5) Deploy CloudFormation Stacks (Console)

Use AWS Console -> CloudFormation -> Create stack -> With new resources.

### Stack A: Network

- Template: `infra/cloudformation/01-network.yml`
- Stack name: `gamesta-network`
- Use default CIDR parameters.
- After `CREATE_COMPLETE`, note outputs:
- `VpcId`
- `PublicSubnet1Id`
- `PublicSubnet2Id`
- `PrivateSubnet1Id`
- `PrivateSubnet2Id`

### Stack B: Backend

- Template: `infra/cloudformation/02-backend.yml`
- Stack name: `gamesta-backend`
- Parameters:
- VPC/subnet values from network stack
- `BackendImage = public.ecr.aws/docker/library/nginx:latest` (bootstrap image)
- `DbPassword = <your value>`
- `AdminSecret = <your value>`
- After `CREATE_COMPLETE`, note outputs:
- `EcrRepositoryUri`
- `ClusterName`
- `ServiceName`
- `AlbDnsName`
- `AlbHostedZoneId`

### Stack C: Frontend

- Template: `infra/cloudformation/03-frontend.yml`
- Stack name: `gamesta-frontend`
- Parameters:
- `FrontendDomainName = gamesta.in`
- `AcmCertificateArn = <ACM ARN from us-east-1>`
- After `CREATE_COMPLETE`, note outputs:
- `FrontendBucketName`
- `CloudFrontDistributionId`
- `CloudFrontDomainName`

## 6) Create DNS Records in Hostinger (No Route53)

Use Hostinger -> Domains -> DNS Zone Editor for `gamesta.in`.

### Record 1: API

Create:
- Type: `CNAME`
- Name/Host: `api`
- Target/Points to: `<AlbDnsName>`
- TTL: `300` (or default)

Result: `api.gamesta.in` -> ALB

### Record 2: Frontend Root Domain

You need `gamesta.in` -> CloudFront.

Preferred if Hostinger supports it:
- Type: `ALIAS` or `ANAME`
- Name: `@`
- Target: `<CloudFrontDomainName>`

If Hostinger does not support ALIAS/ANAME for apex:
1. Create `www` CNAME -> `<CloudFrontDomainName>`
2. Add domain forwarding: `gamesta.in` -> `https://www.gamesta.in`
3. In this case, frontend canonical URL should be `https://www.gamesta.in`

## 7) Create CI/CD Stack

### Step 1: CodeStar Connection

1. Open Developer Tools -> Settings -> Connections.
2. Create GitHub connection.
3. Complete authorization.
4. Copy connection ARN.

### Step 2: Deploy CICD Stack

- Template: `infra/cloudformation/05-cicd.yml`
- Stack name: `gamesta-cicd`
- Parameters:
- `ConnectionArn = <CodeStar ARN>`
- `FullRepositoryId = PranavParalkar/Gamesta_SpringBoot`
- `BranchName = main`
- `EcrRepositoryUri = <from backend stack>`
- `EcsClusterName = <from backend stack>`
- `EcsServiceName = <from backend stack>`
- `FrontendBucketName = <from frontend stack>`
- `CloudFrontDistributionId = <from frontend stack>`
- `ViteApiBaseUrl = http://api.gamesta.in`

### Step 3: First Run

1. Open CodePipeline.
2. Open pipeline `gamesta-dev-pipeline`.
3. Approve authorization if Source stage asks.
4. Release change.

## 8) Validation Checklist

1. CloudFormation stacks in `CREATE_COMPLETE`:
- `gamesta-network`
- `gamesta-backend`
- `gamesta-frontend`
- `gamesta-cicd`

2. CodePipeline success:
- Source success
- BuildBackend success
- BuildAndDeployFrontend success
- DeployBackend success

3. App URLs:
- `https://gamesta.in` (or `https://www.gamesta.in` if apex fallback used)
- `http://api.gamesta.in`

4. Runtime health:
- ECS service has healthy tasks
- ALB target group healthy

## 9) Common Issues and Quick Fixes

1. CloudFront certificate error
- Cert must be in `us-east-1`.
- Cert status must be `Issued`.

2. `api.gamesta.in` not resolving
- Check Hostinger CNAME `api` -> correct ALB DNS.
- Wait for DNS propagation (5 to 30 minutes, sometimes longer).

3. Frontend domain not opening
- Confirm root/apex record strategy (ALIAS/ANAME or www + redirect).
- Verify CloudFront distribution is deployed.

4. Frontend cannot call API
- Confirm CICD parameter `ViteApiBaseUrl` is `http://api.gamesta.in`.
- Re-run pipeline after fixing parameter.

5. ECS deploy fails image not found
- Check BuildBackend logs and ECR push.

## 10) Submission Notes (If Rubric Mentions Route53)

If your rubric strictly requires Route53 screenshots, this Hostinger-only approach may lose marks for that single item. Functional deployment is still valid and production-capable with external DNS.

For transparent submission, mention:
- DNS provider used: Hostinger
- Route53 stack intentionally skipped
- Equivalent DNS records configured manually
