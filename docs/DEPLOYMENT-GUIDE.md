# Gamesta — AWS Deployment Guide (Activity 3)

> **Domain:** `gamesta.in` (Hostinger DNS)  
> **Region:** `ap-south-1` (Mumbai)  
> **Architecture:** EC2 t3.micro (Spring Boot + MySQL in Docker) + S3 (React frontend) + CodePipeline CI/CD  
> **Rubric coverage:** Architecture Diagram ✅ · CloudFormation ✅ · CI/CD Pipeline ✅ · Domain (Hostinger DNS) ✅

---

## Architecture Overview

```
GitHub (push)
    │
    ▼
CodePipeline ──► CodeBuild
    │                │
    │          ┌─────┴──────────────────────────────┐
    │          │  1. npm build → aws s3 sync         │
    │          │  2. SSM RunShellScript → EC2        │
    │          └─────────────────────────────────────┘
    │
    ├──► S3 Bucket "www.gamesta.in" (static website)
    │         ▲
    │         └── CNAME: www.gamesta.in (Hostinger DNS)
    │
    └──► EC2 t3.micro (Elastic IP)
              ├── gamesta_backend  (Spring Boot :8080)
              └── gamesta_mysql    (MySQL 8     :3306)
                        ▲
                        └── A record: api.gamesta.in (Hostinger DNS)
```

---

## Files Used

| File | Purpose |
|------|---------|
| `infra/cloudformation/06-lite-infra.yml` | Stack A — EC2 + S3 + IAM |
| `infra/cloudformation/07-lite-cicd.yml` | Stack B — CodePipeline + CodeBuild |
| `buildspec-lite.yml` | Build + deploy script run by CodeBuild |
| `docker-compose.ec2.yml` | Docker services on EC2 (Spring Boot + MySQL) |
| `Dockerfile` | Multi-stage build: React → Spring Boot fat JAR |

---

## Prerequisites (Do Once)

- AWS account with billing enabled, region set to **ap-south-1**
- GitHub repo `PranavParalkar/Gamesta_SpringBoot` — latest code pushed to `main`
- Hostinger DNS access for `gamesta.in`

---

## Step 1 — Create GitHub CodeStar Connection

> This is a **one-time manual step** — it cannot be automated.

1. Open AWS Console → **Developer Tools → Connections**
2. Click **Create connection**
3. Provider: **GitHub** → Name: `gamesta-github`
4. Click **Connect to GitHub** → authorize the app → select repo `Gamesta_SpringBoot`
5. Click **Connect**
6. Wait for status to show **Available**
7. Copy the full **Connection ARN** — you will need it in Step 4

> ⚠️ If it stays "Pending", click the connection name → **Update pending connection** and complete the OAuth flow in the popup.

---

## Step 2 — Find Your VPC and Public Subnet IDs

1. AWS Console → **VPC → Your VPCs**
2. Copy the **VPC ID** of the default VPC (looks like `vpc-0abc1234ef567890a`)
3. Go to **Subnets**
4. Find any subnet in `ap-south-1` where **Auto-assign public IPv4 = Yes**
5. Copy its **Subnet ID** (looks like `subnet-0abc12345678`)

---

## Step 3 — Deploy Stack A: Infrastructure (`gamesta-lite-infra`)

1. AWS Console → **CloudFormation → Create stack → With new resources (standard)**
2. **Template source:** Upload file → select `infra/cloudformation/06-lite-infra.yml`
3. **Stack name:** `gamesta-lite-infra`
4. Fill in parameters:

| Parameter | Value to Enter |
|-----------|---------------|
| `ProjectName` | `gamesta` |
| `EnvironmentName` | `lite` |
| `FrontendDomain` | `www.gamesta.in` ← **do not change this** |
| `ApiDomain` | `api.gamesta.in` ← **do not change this** |
| `VpcId` | your VPC ID from Step 2 |
| `PublicSubnetId` | your subnet ID from Step 2 |
| `InstanceType` | `t3.micro` |
| `KeyName` | leave blank (we use SSM, not SSH) |
| `AllowedSshCidr` | `0.0.0.0/0` (fine for demo) |
| `AllowedHttpCidr` | `0.0.0.0/0` |
| `AllowedAppCidr` | `0.0.0.0/0` |

5. Click **Next → Next → Submit**
6. Wait for **CREATE_COMPLETE** (~3–5 min)
7. Click the **Outputs** tab — copy these values:

| Output Key | What It Is | Use |
|------------|-----------|-----|
| `Ec2InstanceId` | e.g. `i-0abc1234567890abc` | Needed for Stack B |
| `Ec2PublicIp` | e.g. `13.233.x.x` | Paste into Hostinger DNS |
| `FrontendBucketName` | `www.gamesta.in` | Needed for Stack B |
| `HostingerCnameValue` | e.g. `www.gamesta.in.s3-website-ap-south-1.amazonaws.com` | Paste into Hostinger DNS |
| `FrontendWebsiteUrl` | `http://www.gamesta.in.s3-website-ap-south-1.amazonaws.com` | Test before DNS propagates |

> ⚠️ Wait **3–4 minutes** after CREATE_COMPLETE before running the pipeline — the EC2 SSM agent needs time to register.

---

## Step 4 — Configure Hostinger DNS

Log in to **Hostinger → Domains → gamesta.in → DNS Zone**

You need to add **two records**:

---

### Record 1 — API subdomain → EC2 (backend)

| Field | Value |
|-------|-------|
| **Type** | `A` |
| **Name / Host** | `api` |
| **Points to / Value** | the `Ec2PublicIp` from Step 3 (e.g. `13.233.x.x`) |
| **TTL** | `300` |

This makes `api.gamesta.in` route traffic to your EC2 instance.

---

### Record 2 — www subdomain → S3 (frontend)

| Field | Value |
|-------|-------|
| **Type** | `CNAME` |
| **Name / Host** | `www` |
| **Points to / Value** | the `HostingerCnameValue` from Step 3 (e.g. `www.gamesta.in.s3-website-ap-south-1.amazonaws.com`) |
| **TTL** | `300` |

This makes `www.gamesta.in` serve the React frontend from S3.

> **Why does this work?** The S3 bucket is named exactly `www.gamesta.in`. When a browser requests `www.gamesta.in`, the CNAME sends it to the S3 website endpoint. S3 reads the `Host: www.gamesta.in` header, finds a bucket with that exact name, and serves the files. If the bucket were named anything else, S3 would return a 404.

---

### Record 3 — Root domain redirect (optional)

If Hostinger offers a **Redirect** option:
- Redirect `gamesta.in` (Host `@`) → `http://www.gamesta.in`

> If Hostinger says "Cannot redirect domain to itself", delete any existing `@ → www` rule first, then create `@ → www`.

---

### What Hostinger DNS should look like after setup:

```
Type    Name    Value
──────────────────────────────────────────────────────────────────
A       api     13.233.x.x   (your EC2 Elastic IP)
CNAME   www     www.gamesta.in.s3-website-ap-south-1.amazonaws.com
```

---

## Step 5 — Deploy Stack B: CI/CD (`gamesta-lite-cicd`)

1. AWS Console → **CloudFormation → Create stack → With new resources**
2. **Template source:** Upload `infra/cloudformation/07-lite-cicd.yml`
3. **Stack name:** `gamesta-lite-cicd`
4. Fill parameters:

| Parameter | Value |
|-----------|-------|
| `ProjectName` | `gamesta` |
| `EnvironmentName` | `lite` |
| `ConnectionArn` | ARN from Step 1 |
| `FullRepositoryId` | `PranavParalkar/Gamesta_SpringBoot` |
| `BranchName` | `main` |
| `FrontendBucketName` | `www.gamesta.in` (from Step 3 outputs) |
| `Ec2InstanceId` | `i-0abc...` (from Step 3 outputs) |
| `ViteApiBaseUrl` | `http://api.gamesta.in` |
| `DbPassword` | a strong password (e.g. `Gamesta@2025!`) |
| `AdminSecret` | a strong secret (e.g. `Admin@Gamesta25`) |

5. On the **Configure stack options** page check: **"I acknowledge that AWS CloudFormation might create IAM resources"**
6. Click **Submit** → wait for **CREATE_COMPLETE**

---

## Step 6 — Trigger the Pipeline

1. AWS Console → **CodePipeline → Pipelines → `gamesta-lite-pipeline`**
2. If the **Source** stage shows a warning about pending auth:
   - Click the connection → **Update pending connection** → complete GitHub OAuth
3. Click **Release change**
4. Watch the stages complete:
   - **Source** → downloads code from GitHub
   - **BuildAndDeploy** → builds React, syncs to S3, deploys backend to EC2

> First run takes **8–15 min** (Docker builds the Spring Boot image on EC2 for the first time).

---

## Step 7 — Verify Everything Works

### Test frontend (before DNS propagates)
Use the raw S3 URL from Stack A outputs:
```
http://www.gamesta.in.s3-website-ap-south-1.amazonaws.com
```

### Test frontend (after DNS propagates — up to 30 min)
```
http://www.gamesta.in
```

### Test backend API
```
http://api.gamesta.in:8080/api/events
```
or directly by IP (works immediately, no DNS needed):
```
http://<Ec2PublicIp>:8080/api/events
```
Expected: JSON array response.

### Check Docker containers via SSM
1. EC2 Console → select instance → **Connect → Session Manager**
2. Run:
```bash
sudo docker ps
sudo docker logs gamesta_backend --tail 50
```

---

## Step 8 — Submission Evidence Checklist

| # | Screenshot | What to Show |
|---|-----------|-------------|
| 1 | Architecture diagram | The diagram at top of this file |
| 2 | Stack A complete | CloudFormation → `gamesta-lite-infra` → Events tab showing CREATE_COMPLETE |
| 3 | Stack B complete | CloudFormation → `gamesta-lite-cicd` → Events tab showing CREATE_COMPLETE |
| 4 | Pipeline success | CodePipeline → `gamesta-lite-pipeline` → all stages green |
| 5 | Hostinger DNS | DNS Zone showing `api` A record + `www` CNAME |
| 6 | Frontend URL | Browser showing `http://www.gamesta.in` working |
| 7 | Backend URL | Browser showing `http://api.gamesta.in:8080` returning JSON |

---

## Troubleshooting

### "EC2 not available in SSM" — pipeline fails

**Cause:** SSM agent hasn't registered yet, or instance profile is missing.

**Fix:**
1. Go to EC2 → instance → **Connect → Session Manager tab**
2. If Session Manager works → SSM is fine, just wait and re-run the pipeline
3. If not: check the instance profile is attached (Actions → Security → Modify IAM role)
4. In Session Manager: `sudo systemctl status amazon-ssm-agent`

### `www.gamesta.in` shows S3 "NoSuchBucket" error

**Cause:** The CNAME is correct but something is wrong with the bucket name.

**Fix:** In CloudFormation → `gamesta-lite-infra` → Outputs → confirm `FrontendBucketName` = `www.gamesta.in`. If it doesn't match, you entered a different value for `FrontendDomain` during stack creation. Delete and recreate the stack with `FrontendDomain = www.gamesta.in`.

### Backend container keeps restarting

**Check logs:**
```bash
sudo docker logs gamesta_backend --tail 100
```
MySQL needs ~30s to initialize on first boot. The compose file has a healthcheck with `retries: 10`. If still failing:
```bash
cd /opt/gamesta
sudo docker compose -f docker-compose.ec2.yml --env-file .env restart backend
```

### DNS not working after 30 min

Check propagation:
```bash
nslookup www.gamesta.in 8.8.8.8
nslookup api.gamesta.in 8.8.8.8
```
If returns correct values but browser doesn't work, clear browser DNS cache: `chrome://net-internals/#dns`

---

## Monthly Cost Estimate

| Service | Cost |
|---------|------|
| EC2 t3.micro (on-demand, 24/7) | ~$9–10/month |
| S3 (< 1 GB storage, low traffic) | < $0.10/month |
| CodePipeline (1 active pipeline) | $1/month |
| CodeBuild (< 100 build-min/month) | Free tier |
| Elastic IP (attached to running instance) | Free |
| **Total** | **~$10–11/month** |

> Stop EC2 when not demonstrating. An unattached EIP costs $0.005/hr.

---

## Rubric Mapping

| Rubric Criteria | Implementation |
|-----------------|---------------|
| Architecture Diagram | Diagram above |
| Infrastructure using CloudFormation | `gamesta-lite-infra` + `gamesta-lite-cicd` stacks |
| CI/CD Pipeline | CodePipeline + CodeBuild via `buildspec-lite.yml` |
| Domain Name (Route53 or DNS) | Hostinger DNS: `api` A record + `www` CNAME |

> **Route53 note:** The rubric mentions Route53 specifically. If your evaluator requires it strictly, create a Route53 Hosted Zone for `gamesta.in` (cost: ~$0.50/month), add the same two records there, then point Hostinger's **nameservers** to the Route53 NS records. Runtime architecture stays identical.
