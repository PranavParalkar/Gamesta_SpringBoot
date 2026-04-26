# Activity-3 AWS Execution Plan (Low-Cost)

This plan is optimized to fulfill activity requirements with minimal AWS cost.

## 1) Assignment Criteria Coverage

1. Architecture Diagram: `docs/Activity-3-Architecture-Diagram.md`
2. Infrastructure using CloudFormation: lightweight stacks
3. CI/CD Pipeline: CodePipeline + CodeBuild
4. Domain Name: Hostinger DNS (or Route53 if mandatory by rubric)

## 2) Fixed Inputs

- Region: `ap-south-1`
- Frontend domain: `gamesta.in`
- API domain: `api.gamesta.in`
- GitHub repository: `PranavParalkar/Gamesta_SpringBoot`

## 3) Cost-Optimized Service Set

- Frontend: S3 static hosting
- Backend: single EC2 `t3.micro` instance
- Database: MySQL container on same EC2 (for demo/academic purpose)
- CI/CD: one CodePipeline + one CodeBuild
- DNS: Hostinger records (or minimal Route53 zone if required)

Removed from this plan:
- ECS Fargate
- ALB
- NAT Gateway
- RDS
- CloudFront
- ECR

## 4) Recommended CloudFormation Stacks

### Stack A: `gamesta-lite-infra`

Create:
- EC2 instance
- Security group
- S3 frontend bucket
- IAM role for EC2/SSM

Keep outputs:
- `Ec2PublicIp`
- `Ec2PublicDns`
- `FrontendBucketName`

### Stack B: `gamesta-lite-cicd`

Create:
- CodePipeline
- CodeBuild
- artifact bucket
- (optional) connection resource references

## 5) Deployment Order (Console-Friendly)

1. Deploy `gamesta-lite-infra`.
2. On EC2, install Docker + Docker Compose plugin.
3. Start backend and MySQL containers using your compose file.
4. Configure S3 static website hosting for frontend bucket.
5. Deploy `gamesta-lite-cicd`.
6. Connect GitHub via CodeStar and run first pipeline.
7. Configure DNS in Hostinger (or Route53 if mandatory).

## 6) DNS Configuration

If using Hostinger:
- `api` -> A record -> `Ec2PublicIp`
- `www` -> CNAME -> S3 website endpoint
- root redirect `gamesta.in` -> `www.gamesta.in`

If rubric strictly requires Route53:
- Create hosted zone for `gamesta.in`
- Create equivalent records in Route53

## 7) CI/CD Behavior

Source: GitHub main branch

Build/Deploy in CodeBuild:
1. Build frontend and upload to S3 bucket.
2. Build backend artifact/image.
3. Deploy backend to EC2 via SSM Run Command or SSH.

## 8) Submission Evidence Checklist

1. Low-cost architecture diagram screenshot.
2. CloudFormation stack(s) in `CREATE_COMPLETE`.
3. Successful pipeline run screenshot.
4. DNS records screenshot (Hostinger or Route53 per rubric).
5. Browser proof:
- `http://www.gamesta.in` (or your configured frontend URL)
- `http://api.gamesta.in`

## 9) Viva Talking Points

1. Why this architecture?
- Meets all assignment criteria at lower cost.

2. Why avoid ECS/RDS/ALB here?
- They increase baseline monthly cost for a student/demo workload.

3. Limitation?
- Single EC2 is not highly available and not ideal for production scale.
