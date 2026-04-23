# Activity-3 AWS Console Execution Plan

This plan is for AWS Console execution (no CLI required), aligned to grading criteria:

1. Architecture Diagram
2. Infrastructure using CloudFormation
3. CI/CD Pipeline
4. Domain Name using Route53

## Fixed Inputs

- AWS Region for stack resources: ap-south-1
- Frontend domain: gamesta.in
- API domain: api.gamesta.in
- GitHub repo: PranavParalkar/Gamesta_SpringBoot
- CloudFront certificate region: us-east-1 (mandatory)

## A) Pre-Setup in Console

1. Sign in to AWS Console and set region to ap-south-1.
2. Ensure Route53 hosted zone exists for gamesta.in.
3. Request ACM certificate in us-east-1 for:
   - gamesta.in
   - *.gamesta.in
4. Validate ACM certificate using DNS validation in Route53.
5. Keep these values ready for later stack parameters:
   - Hosted Zone ID (Route53)
   - ACM certificate ARN (us-east-1)
   - CodeStar connection ARN (after creating connection)
   - DB password
   - Admin secret

## B) Deploy Infrastructure via CloudFormation (Console)

Use AWS Console > CloudFormation > Create stack > With new resources (standard).

### Stack 1: Network

1. Template: Upload file infra/cloudformation/01-network.yml.
2. Stack name: gamesta-network.
3. Keep default CIDR values.
4. Create stack.
5. After CREATE_COMPLETE, open Outputs tab and note:
   - VpcId
   - PublicSubnet1Id
   - PublicSubnet2Id
   - PrivateSubnet1Id
   - PrivateSubnet2Id

### Stack 2: Backend

1. Template: Upload file infra/cloudformation/02-backend.yml.
2. Stack name: gamesta-backend.
3. Fill parameters:
   - VpcId = output from network stack
   - PublicSubnet1Id = output from network stack
   - PublicSubnet2Id = output from network stack
   - PrivateSubnet1Id = output from network stack
   - PrivateSubnet2Id = output from network stack
   - BackendImage = public.ecr.aws/docker/library/nginx:latest (temporary bootstrap)
   - DbPassword = your secure value
   - AdminSecret = your secure value
4. Create stack.
5. After CREATE_COMPLETE, open Outputs and note:
   - EcrRepositoryUri
   - ClusterName
   - ServiceName
   - AlbDnsName
   - AlbHostedZoneId

### Stack 3: Frontend

1. Template: Upload file infra/cloudformation/03-frontend.yml.
2. Stack name: gamesta-frontend.
3. Fill parameters:
   - FrontendDomainName = gamesta.in
   - AcmCertificateArn = ACM cert ARN from us-east-1
4. Create stack.
5. After CREATE_COMPLETE, open Outputs and note:
   - FrontendBucketName
   - CloudFrontDistributionId
   - CloudFrontDomainName

### Stack 4: DNS

1. Template: Upload file infra/cloudformation/04-dns.yml.
2. Stack name: gamesta-dns.
3. Fill parameters:
   - HostedZoneId = hosted zone ID of gamesta.in
   - FrontendDomainName = gamesta.in
   - ApiDomainName = api.gamesta.in
   - CloudFrontDomainName = from frontend stack output
   - AlbDnsName = from backend stack output
   - AlbHostedZoneId = from backend stack output
4. Create stack.
5. Confirm Route53 records are created.

## C) Configure CI/CD in Console

### Step 1: Create GitHub connection (CodeStar)

1. Open Developer Tools > Settings > Connections.
2. Create connection with GitHub.
3. Complete OAuth/installation flow.
4. Save connection and note connection ARN.

### Step 2: Create CI/CD Stack

1. Go to CloudFormation > Create stack.
2. Template: Upload infra/cloudformation/05-cicd.yml.
3. Stack name: gamesta-cicd.
4. Fill parameters:
   - ConnectionArn = CodeStar connection ARN
   - FullRepositoryId = PranavParalkar/Gamesta_SpringBoot
   - BranchName = main
   - EcrRepositoryUri = backend stack output
   - EcsClusterName = backend stack output
   - EcsServiceName = backend stack output
   - FrontendBucketName = frontend stack output
   - CloudFrontDistributionId = frontend stack output
   - ViteApiBaseUrl = http://api.gamesta.in
5. Create stack.

### Step 3: Approve pending connection usage

1. Open CodePipeline.
2. Open pipeline gamesta-dev-pipeline.
3. If Source stage shows authorization required, approve/authorize connection.
4. Release change to trigger first run.

## D) Pipeline Success Criteria

A successful run should show:

1. Source: GitHub fetch successful.
2. BuildBackend: Docker image pushed to ECR and imagedefinitions.json generated.
3. BuildAndDeployFrontend: frontend built and uploaded to S3, CloudFront invalidation completed.
4. DeployBackend: ECS service updated to new image.

## E) Post-Deployment Validation

1. Open https://gamesta.in and confirm frontend loads.
2. Open http://api.gamesta.in and confirm API is reachable.
3. In ECS Console, verify service has healthy running tasks.
4. In ALB target group, verify healthy targets.
5. In CloudFormation, all five stacks must be CREATE_COMPLETE.

## F) Submission Evidence Checklist (Rubric-Mapped)

### 1) Architecture Diagram (5 marks)

- Include final architecture image from docs/Activity-3-Architecture-Diagram.md.

### 2) Infrastructure using CloudFormation (5 marks)

- Screenshot each stack in CREATE_COMPLETE:
  - gamesta-network
  - gamesta-backend
  - gamesta-frontend
  - gamesta-dns
  - gamesta-cicd

### 3) CI/CD Pipeline (5 marks)

- Screenshot successful CodePipeline run.
- Screenshot CodeBuild logs for backend and frontend success.
- Screenshot ECS deploy stage success.

### 4) Domain Name using Route53 (5 marks)

- Screenshot Route53 records for gamesta.in and api.gamesta.in.
- Browser screenshot of both URLs resolving.

## G) Common Failure Points and Quick Fixes

1. CloudFront certificate error:
   - Ensure ACM certificate is in us-east-1, not ap-south-1.
2. Source stage fails in pipeline:
   - Re-authorize CodeStar connection.
3. ECS deploy fails due to image not found:
   - Verify BuildBackend pushed image to ECR.
4. Frontend cannot call API:
   - Verify ViteApiBaseUrl is set to http://api.gamesta.in in cicd stack parameters.
5. DNS not resolving:
   - Confirm hosted zone is authoritative for gamesta.in and records are in the correct zone.
