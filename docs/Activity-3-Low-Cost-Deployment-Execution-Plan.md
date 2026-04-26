# Activity-3 Low-Cost Deployment Execution Plan (AWS + Hostinger)

This setup is optimized for low monthly cost and avoids Route53.

## 1) What You Deploy

CloudFormation stacks:
1. `gamesta-lite-infra` using `infra/cloudformation/06-lite-infra.yml`
2. `gamesta-lite-cicd` using `infra/cloudformation/07-lite-cicd.yml`

Other files used:
- `buildspec-lite.yml`
- `docker-compose.ec2.yml`

## 2) Cost-Oriented Architecture

- Frontend: S3 static website hosting
- Backend: Single EC2 instance (`t3.micro`) running Docker Compose
- Database: MySQL container on same EC2 instance
- CI/CD: CodePipeline + single CodeBuild project
- DNS: Hostinger zone records for `gamesta.in` and `api.gamesta.in`

## 3) Pre-Setup

1. AWS region: `ap-south-1`
2. Hostinger domain: `gamesta.in`
3. GitHub repo: `PranavParalkar/Gamesta_SpringBoot`
4. Existing CodeStar connection ARN (or create one in Developer Tools -> Connections)
5. Note your VPC ID and one public subnet ID in `ap-south-1`

## 4) Deploy Stack A: Lite Infra

CloudFormation console:
1. Create stack -> Upload `infra/cloudformation/06-lite-infra.yml`
2. Stack name: `gamesta-lite-infra`
3. Required parameters:
- `VpcId` = your VPC
- `PublicSubnetId` = public subnet in same VPC
4. Recommended values:
- `InstanceType = t3.micro`
- `AllowedSshCidr = <your_ip>/32` (do not keep open for production)
- `AllowedHttpCidr = 0.0.0.0/0`
- `AllowedAppCidr = 0.0.0.0/0`
- `KeyName` optional

After `CREATE_COMPLETE`, note outputs:
- `Ec2InstanceId`
- `Ec2PublicIp`
- `FrontendBucketName`
- `FrontendWebsiteUrl`

Note: `Ec2PublicDns` can be empty in some VPC configurations. For DNS and Hostinger records, use `Ec2PublicIp`.

## 5) Hostinger DNS Records

In Hostinger DNS zone for `gamesta.in`:

1. API record:
- Type: `A`
- Host: `api`
- Value: `<Ec2PublicIp>`

2. Frontend record (www):
- Type: `CNAME`
- Host: `www`
- Value: `<FrontendBucketName>.s3-website-ap-south-1.amazonaws.com`

3. Root handling:
- Preferred: use Hostinger ALIAS/ANAME for host `@` to point root to the same S3 website hostname.
- If ALIAS/ANAME is not available, keep `www` as the primary frontend URL and use `http://www.gamesta.in` in validation screenshots.
- If Hostinger redirect shows "You cannot redirect your domain to itself", remove any `www -> @` rule first, then retry `@ -> www` redirect.

## 6) Deploy Stack B: Lite CI/CD

CloudFormation console:
1. Create stack -> Upload `infra/cloudformation/07-lite-cicd.yml`
2. Stack name: `gamesta-lite-cicd`
3. Parameters:
- `ConnectionArn` = CodeStar connection ARN
- `FullRepositoryId` = `PranavParalkar/Gamesta_SpringBoot`
- `BranchName` = `main`
- `FrontendBucketName` = output from lite infra
- `Ec2InstanceId` = output from lite infra
- `ViteApiBaseUrl` = `http://api.gamesta.in`
- `DbPassword` = your value
- `AdminSecret` = your value

## 7) First Pipeline Run

1. Open CodePipeline
2. Open pipeline `gamesta-lite-pipeline`
3. If source auth is pending, authorize connection
4. Release change

The pipeline does:
1. Build frontend and upload to S3 website bucket
2. Send SSM command to EC2
3. EC2 pulls latest repo branch and runs:
- `docker compose -f docker-compose.ec2.yml --env-file /opt/gamesta/.env up -d --build`

## 8) Validate Deployment

1. CloudFormation stacks `CREATE_COMPLETE`
2. CodePipeline execution succeeded
3. Frontend works at:
- `http://www.gamesta.in`
4. API works at:
- `http://api.gamesta.in:8080`

If you later put Nginx reverse proxy on EC2, API can be served on port 80 as `http://api.gamesta.in`.

## 9) Submission Evidence Checklist

1. Architecture diagram (low-cost variant)
2. `gamesta-lite-infra` stack success screenshot
3. `gamesta-lite-cicd` stack success screenshot
4. CodePipeline success screenshot
5. Hostinger DNS records screenshot
6. Browser screenshots:
- frontend URL
- API URL

## 10) Known Trade-Offs

- Single EC2 instance is single point of failure
- MySQL container is not managed RDS
- No CloudFront edge caching
- Suitable for assignment/demo, not production HA
