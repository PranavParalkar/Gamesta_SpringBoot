# Activity-3 Low-Cost Deployment Plan (AWS + Hostinger)

This version is optimized for minimum monthly cost while still fulfilling Activity-3 requirements.

What is kept:
- Architecture diagram (updated to simple architecture)
- Infrastructure as Code using CloudFormation
- CI/CD pipeline (CodePipeline + CodeBuild)
- Domain mapping via Hostinger DNS

What is removed to cut cost:
- ECS Fargate
- ALB
- NAT Gateway
- RDS MySQL
- CloudFront
- ECR

## 1) Low-Cost Architecture

- Frontend: S3 static website hosting
- Backend: Single EC2 `t3.micro` instance (Docker Compose: Spring Boot + MySQL)
- CI/CD: One CodePipeline + one CodeBuild project (build + deploy)
- DNS: Hostinger DNS records for frontend and API

This gives a working end-to-end deployment for academic activity with much lower cost than the previous architecture.

## 2) Estimated Monthly Cost (Approx, ap-south-1)

- EC2 `t3.micro` (on-demand): low cost (main runtime cost)
- S3 static hosting: very low
- CodePipeline + occasional CodeBuild: low for student usage
- Data transfer and storage: low for demo traffic

Important: your final bill depends on traffic, build frequency, and storage usage.

## 3) Fixed Inputs

- AWS region: `ap-south-1`
- Root domain: `gamesta.in`
- API subdomain: `api.gamesta.in`
- GitHub repo: `PranavParalkar/Gamesta_SpringBoot`

## 4) Stack Plan (CloudFormation)

Use two minimal stacks for the activity submission.

### Stack A: `gamesta-lite-infra`

Should create:
- 1 EC2 instance
- 1 security group (allow `22`, `80`, and backend app port like `8080` as needed)
- 1 S3 bucket for frontend
- 1 IAM role/instance profile for EC2 (SSM + S3 read access if needed)

Outputs to keep:
- `Ec2PublicIp`
- `Ec2PublicDns`
- `FrontendBucketName`

### Stack B: `gamesta-lite-cicd`

Should create:
- CodeStar connection (or use existing ARN)
- CodePipeline
- CodeBuild project
- Artifact S3 bucket

Pipeline behavior:
- Source from GitHub
- Build frontend and sync `dist/` to frontend S3 bucket
- Build backend image/app and deploy to EC2 via SSH/SSM

## 5) EC2 Runtime Setup (One-Time)

On EC2 instance:
1. Install Docker and Docker Compose plugin.
2. Create app folder, for example `/opt/gamesta`.
3. Keep a `docker-compose.yml` with:
- Spring Boot app container
- MySQL container
4. Open only required inbound ports in security group.
5. Test backend locally on instance, then from browser using `http://<ec2-public-ip>:8080`.

For activity/demo, this single-instance setup is acceptable and much cheaper than ECS + RDS.

## 6) Frontend Hosting on S3

1. Enable static website hosting on frontend S3 bucket.
2. Configure bucket policy for public read (only for static frontend files).
3. Build frontend in pipeline and upload `dist/` to this bucket.

URL (temporary before DNS): S3 website endpoint from bucket properties.

## 7) Hostinger DNS (No Route53)

Create records in Hostinger DNS zone for `gamesta.in`:

1. Frontend record
- Type: `CNAME` (for `www`) or A record depending on your setup
- Host: `www`
- Target: S3 website endpoint hostname

2. API record
- Type: `A`
- Host: `api`
- Target: `<Ec2PublicIp>`

3. Optional root redirect
- Redirect `gamesta.in` to `www.gamesta.in`

## 8) CI/CD Steps

1. Create/authorize CodeStar connection to GitHub.
2. Deploy `gamesta-lite-cicd` stack with repo and branch details.
3. Ensure buildspec has two tasks:
- Frontend build and S3 sync
- Backend deploy to EC2 (SSH/SSM command)
4. Trigger first pipeline run.
5. Validate backend and frontend URLs.

## 9) Validation Checklist for Submission

1. Architecture diagram showing S3 + EC2 + CI/CD + DNS.
2. CloudFormation stack(s) in `CREATE_COMPLETE`.
3. Pipeline execution success screenshot.
4. Working URLs:
- `http://api.gamesta.in` (or `http://api.gamesta.in:8080` if port not proxied)
- `http://www.gamesta.in` (or root redirect target)

## 10) Trade-Offs (Mention in Viva)

- This is cost-optimized for assignment/demo, not high availability production.
- Single EC2 is a single point of failure.
- No managed RDS backups by default.
- No CloudFront edge caching.

## 11) If Evaluator Strictly Requires Route53

If rubric mandates Route53 specifically, create a minimal hosted zone and two records there, but keep runtime architecture unchanged (still EC2 + S3 + simple CI/CD).

That keeps compliance while remaining low cost.
