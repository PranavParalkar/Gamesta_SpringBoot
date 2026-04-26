# Activity-3 AWS Console Execution Plan (Low-Cost)

This plan keeps only minimum services needed to complete the activity.

## Criteria Mapping

1. Architecture diagram: use low-cost diagram from docs folder.
2. Infrastructure as Code: deploy CloudFormation stack(s).
3. CI/CD: use CodePipeline + CodeBuild.
4. Domain: configure Hostinger DNS or Route53 if strictly required.

## Fixed Inputs

- Region: ap-south-1
- Frontend domain: gamesta.in
- API domain: api.gamesta.in
- Repo: PranavParalkar/Gamesta_SpringBoot

## A) Pre-Setup

1. Open AWS Console in region ap-south-1.
2. Keep a GitHub connection ARN ready (CodeStar connection).
3. Confirm domain DNS control in Hostinger (or Route53 if required by evaluator).

## B) CloudFormation Deploy (Console)

### Stack 1: gamesta-lite-infra

Template should create:
- EC2 t3.micro (backend runtime)
- Security group
- S3 bucket (frontend static hosting)
- IAM role/instance profile

After CREATE_COMPLETE, note outputs:
- Ec2PublicIp
- Ec2PublicDns
- FrontendBucketName

### Stack 2: gamesta-lite-cicd

Template should create:
- CodePipeline
- CodeBuild
- Artifact bucket

Pass parameters:
- ConnectionArn
- Repository ID
- Branch name
- FrontendBucketName
- Ec2PublicIp or deployment target details

## C) EC2 One-Time Runtime Setup

1. Connect to EC2.
2. Install Docker and Docker Compose plugin.
3. Place backend app + MySQL compose setup in /opt/gamesta.
4. Start containers and verify backend is reachable.

## D) S3 Frontend Hosting

1. Enable static website hosting on frontend bucket.
2. Configure bucket policy for frontend public files.
3. Confirm S3 website endpoint works.

## E) DNS Setup

In Hostinger:
1. `api` A record -> Ec2PublicIp
2. `www` CNAME -> S3 website endpoint hostname
3. Optional: root redirect `gamesta.in` -> `www.gamesta.in`

If Route53 is mandatory:
1. Create hosted zone for `gamesta.in`.
2. Add equivalent records in Route53.

## F) CI/CD Validation

Pipeline should:
1. Pull source from GitHub.
2. Build frontend and upload to S3.
3. Deploy backend update to EC2 (SSH/SSM step).

## G) Submission Evidence Checklist

1. Architecture diagram screenshot.
2. CloudFormation stack(s) CREATE_COMPLETE screenshot.
3. CodePipeline successful execution screenshot.
4. DNS records screenshot.
5. Browser screenshots for frontend and API URLs.

## H) Viva Talking Points

1. Why this architecture?
- Lowest-cost approach that still fulfills all assignment components.

2. What was removed?
- ECS, RDS, ALB, NAT, CloudFront, ECR.

3. Trade-off?
- Single EC2 instance is simpler and cheaper but not highly available.
