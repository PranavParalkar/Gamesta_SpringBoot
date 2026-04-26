# Activity-3 Architecture Diagram (Low-Cost)

```mermaid
flowchart LR
  U[Users]
  GH[GitHub Repo\nPranavParalkar/Gamesta_SpringBoot]

  DNS[DNS\nHostinger or Route53]
  S3[S3 Static Website\nFrontend]

  subgraph AWS[AWS ap-south-1]
    EC2[EC2 t3.micro\nSpring Boot + MySQL\nDocker Compose]
    CP[CodePipeline]
    CB[CodeBuild\nBuild + Deploy]
  end

  U -->|gamesta.in / www| DNS
  DNS --> S3

  U -->|api.gamesta.in| DNS
  DNS --> EC2

  GH --> CP --> CB
  CB -->|frontend dist sync| S3
  CB -->|backend deploy| EC2

  classDef runtime fill:#e8f5e9,stroke:#2e7d32,stroke-width:1px,color:#1b5e20;
  classDef cicd fill:#e3f2fd,stroke:#1565c0,stroke-width:1px,color:#0d47a1;
  classDef edge fill:#fff3e0,stroke:#ef6c00,stroke-width:1px,color:#e65100;

  class U,EC2 runtime;
  class GH,CP,CB cicd;
  class DNS,S3 edge;
```

## Endpoints

- Frontend: `http://www.gamesta.in` (or root redirect)
- API: `http://api.gamesta.in`

## Services Included

- DNS provider: Hostinger or Route53
- S3 (frontend static hosting)
- EC2 single instance (backend + database for demo)
- CodePipeline
- CodeBuild

## Why This Is Cheaper

- Removes always-on managed services with higher baseline cost (ECS, RDS, NAT, ALB, CloudFront).
- Uses one small EC2 instance for backend runtime.
- Keeps only required services for assignment completion.
