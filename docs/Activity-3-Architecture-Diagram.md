# Activity-3 Architecture Diagram

```mermaid
flowchart LR
  %% External users and source control
  U[Users]
  GH[GitHub Repo\nPranavParalkar/Gamesta_SpringBoot]

  %% DNS and edge
  R53[Route53\nHosted Zone: gamesta.in]
  CF[CloudFront\nCDN + HTTPS]
  S3[S3 Bucket\nFrontend Static Build]

  %% CI/CD
  CSC[CodeStar Connection\nGitHub Integration]
  CP[CodePipeline]
  CBB[CodeBuild\nBackend Build]
  CBF[CodeBuild\nFrontend Build]
  ECR[ECR\nBackend Image]

  %% Networking
  subgraph AWS[AWS ap-south-1]
    subgraph VPC[VPC]
      subgraph Public[Public Subnets]
        ALB[Application Load Balancer]
        NAT[NAT Gateway]
      end

      subgraph Private[Private Subnets]
        ECS[ECS Fargate Service\nSpring Boot API]
        RDS[RDS MySQL]
      end
    end
  end

  %% Runtime traffic flow
  U -->|https://gamesta.in| R53
  R53 -->|A Alias| CF
  CF --> S3

  U -->|http://api.gamesta.in| R53
  R53 -->|A Alias| ALB
  ALB --> ECS
  ECS --> RDS

  %% Build/deploy flow
  GH --> CSC --> CP
  CP --> CBB
  CBB --> ECR
  CBB -->|imagedefinitions.json| CP
  CP -->|ECS Deploy Action| ECS

  CP --> CBF
  CBF -->|sync dist/| S3
  CBF -->|cache invalidation| CF

  %% Supporting relations
  ECS -->|pull image| ECR
  ECS -->|internet egress| NAT

  %% Notes as classes for readability
  classDef runtime fill:#e8f5e9,stroke:#2e7d32,stroke-width:1px,color:#1b5e20;
  classDef cicd fill:#e3f2fd,stroke:#1565c0,stroke-width:1px,color:#0d47a1;
  classDef edge fill:#fff3e0,stroke:#ef6c00,stroke-width:1px,color:#e65100;
  classDef data fill:#f3e5f5,stroke:#6a1b9a,stroke-width:1px,color:#4a148c;

  class U,ALB,ECS runtime;
  class GH,CSC,CP,CBB,CBF,ECR cicd;
  class R53,CF,S3 edge;
  class RDS data;
```

## Endpoints

- Frontend: https://gamesta.in
- API: http://api.gamesta.in

## Services Included

- Route53
- CloudFront
- S3
- VPC with public and private subnets
- NAT Gateway
- Application Load Balancer
- ECS Fargate
- RDS MySQL
- ECR
- CodeStar Connection
- CodePipeline
- CodeBuild
