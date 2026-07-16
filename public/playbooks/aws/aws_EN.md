# AWS for Lazy Developers

In 2006, Amazon did something strange for an online store: it took the infrastructure it had built to run its own e-commerce during Black Friday, and put it up for rent to anyone, by the hour. **AWS** (Amazon Web Services) was born. Today AWS has more than 200 services — too many even for AWS engineers themselves, as the joke in the industry goes.

This playbook starts from a simple idea: **the best server is the one you don't have to manage**. A "lazy developer" isn't lazy in the negative sense — they're lazy in the right sense: they hate restarting servers on a Sunday night, hate installing security patches by hand, hate manually scaling an app when it goes viral on TikTok. That's why we'll use almost exclusively **managed** and **serverless** services: things AWS runs on your behalf, so you write code, not sysadmin tickets.

We'll take a tour of the AWS services most useful to a developer, grouped by category, with a simple explanation, a **Terraform** snippet (to "spin them up" — i.e. create them) and a **Python** snippet (to use them from your code, usually with `boto3`, the official AWS library for Python). Of the more advanced topics, we'll touch only on **Bedrock** — managed access to AI models — because it's probably the most useful "advanced" service to know about today.

At the end, we'll put it all together: a real **GitHub Actions** pipeline that tests, builds, and deploys a **FastAPI app on ECS** and a **Lambda function**, both in Python.

---

### Before we start: 4 words you'll use everywhere

| Term | What it means, in plain words |
|---|---|
| **Region** | A geographic zone where AWS's "computers" live (e.g. `eu-west-1` = Ireland). Pick a region close to your users, for speed. |
| **Account** | Your "AWS profile" — everything you create belongs to an account, and you pay based on what you use inside it. |
| **IaC (Infrastructure as Code)** | Instead of creating things by clicking around the AWS Console, you write code (Terraform, in this playbook) that creates them for you — repeatable, versionable in Git, never again "but I clicked something by hand three months ago." |
| **boto3** | The official Python library for talking to AWS: `import boto3` and you're in. |

> 💡 **Tip**: in every Terraform example in this playbook, assume a `provider.tf` file already exists with something like `provider "aws" { region = "eu-west-1" }`. We omit it to stay concise.

---

## 1. Compute — No Servers to Manage

**In a nutshell**: instead of renting a whole computer (EC2) and taking care of it yourself, AWS gives you ways to run code paying only for what you use, without ever having to `ssh` into any machine.

### AWS Lambda

**What it's for**: runs a function when something happens (an HTTP request, an uploaded file, a message on a queue) and then shuts down. You only pay for the milliseconds it runs. It's like a coffee vending machine: it doesn't consume power until someone presses the button.

**How you use it**: you write a function with a standard signature (`handler(event, context)`), upload it to AWS, and something else "invokes" it when needed.

```hcl
# Terraform — create the Lambda function
resource "aws_iam_role" "lambda_exec" {
  name = "hello-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_lambda_function" "hello" {
  function_name    = "hello-lazy-dev"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "app.handler"
  runtime          = "python3.13"
  filename         = "lambda.zip"
  source_code_hash = filebase64sha256("lambda.zip")
}
```

```python
# app.py — the code that runs INSIDE the Lambda
def handler(event, context):
    name = event.get("name", "world")
    return {"statusCode": 200, "body": f"Hello, {name}!"}
```

```python
# invoke.py — how you call the Lambda from outside, e.g. from another script
import boto3, json

client = boto3.client("lambda")
response = client.invoke(
    FunctionName="hello-lazy-dev",
    Payload=json.dumps({"name": "Ada"}).encode(),
)
print(json.load(response["Payload"]))   # => {'statusCode': 200, 'body': 'Hello, Ada!'}
```

### ECS on Fargate

**What it's for**: if your app is already inside a Docker **container** (maybe because it's bigger than a single function, like a full FastAPI app), ECS runs it for you. **Fargate** is the "lazy" part: you don't even pick the computer type anymore — you just say "how much CPU and RAM I need" and AWS takes care of the rest.

**How you use it**: you build a Docker image, push it to **ECR** (the image warehouse, see below), and tell ECS to run it.

```hcl
# Terraform — cluster, task definition and ECS service
resource "aws_ecs_cluster" "app" {
  name = "lazy-cluster"
}

resource "aws_ecs_task_definition" "api" {
  family                   = "fastapi-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_exec.arn

  container_definitions = jsonencode([{
    name         = "fastapi"
    image        = "${aws_ecr_repository.api.repository_url}:latest"
    portMappings = [{ containerPort = 8000 }]
  }])
}

resource "aws_ecs_service" "api" {
  name            = "fastapi-service"
  cluster         = aws_ecs_cluster.app.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    assign_public_ip = true
  }
}
```

```python
# use_ecs.py — force a new deployment (useful after pushing a new image)
import boto3

ecs = boto3.client("ecs")
ecs.update_service(
    cluster="lazy-cluster",
    service="fastapi-service",
    force_new_deployment=True,
)
```

### ECR (Elastic Container Registry)

**What it's for**: it's the private warehouse where you keep your Docker images, so ECS (or anyone else) can pull them. Think of it as a private "Docker Hub", inside AWS's own house.

```hcl
resource "aws_ecr_repository" "api" {
  name                 = "fastapi-app"
  image_tag_mutability = "IMMUTABLE"   # once a tag is pushed, it can't be overwritten
}
```

```python
# list_images.py
import boto3

ecr = boto3.client("ecr")
images = ecr.list_images(repositoryName="fastapi-app")["imageIds"]
for img in images:
    print(img.get("imageTag", "no tag"))
```

> 🧠 **The golden rule**: Lambda for code that responds to occasional, short-lived events (seconds). ECS/Fargate for always-on applications, heavier ones, or ones that need to run longer than 15 minutes (the maximum duration of a single Lambda execution).

---

## 2. Storage — Your Infinite Closet

**In a nutshell**: **S3** is a huge space for saving files, where every file has an "address" (key) and you never have to worry about how much space you have — it's, practically, infinite.

### Amazon S3

**What it's for**: imagine a closet as big as you want, divided into "drawers" (**buckets**), where every object you put in has a label (the **key**) to find it again. You put images, videos, backups, log files — practically anything — inside.

**How you use it**: you upload files, read them, and — if needed — generate a temporary link to let someone else download them without making the whole bucket public.

```hcl
resource "random_id" "suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "uploads" {
  bucket = "lazy-dev-uploads-${random_id.suffix.hex}"   # the name must be UNIQUE worldwide
}
```

```python
import boto3

s3 = boto3.client("s3")
BUCKET = "lazy-dev-uploads-abcd1234"

s3.upload_file("photo.jpg", BUCKET, "photo.jpg")   # upload a local file

url = s3.generate_presigned_url(
    "get_object",
    Params={"Bucket": BUCKET, "Key": "photo.jpg"},
    ExpiresIn=3600,   # the link only works for one hour
)
print(url)
```

---

## 3. Database — Where the Data Lives

**In a nutshell**: **DynamoDB** is a blazing-fast database if you already know the "key" of the row you need — perfect for modern apps. **RDS/Aurora** is a classic relational database (like Postgres) but without you having to install or upgrade it.

### DynamoDB

**What it's for**: it's a huge key-value "notebook". If you know the ID of what you're looking for, the answer arrives in milliseconds, no matter the size of the table — whether it has 10 or 10 billion rows.

```hcl
resource "aws_dynamodb_table" "users" {
  name         = "users"
  billing_mode = "PAY_PER_REQUEST"   # you pay per request, nothing to "size" by hand
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"   # S = String
  }
}
```

```python
import boto3

table = boto3.resource("dynamodb").Table("users")

table.put_item(Item={"id": "ada-1", "name": "Ada", "age": 36})

item = table.get_item(Key={"id": "ada-1"})["Item"]
print(item)   # => {'id': 'ada-1', 'name': 'Ada', 'age': Decimal('36')}
```

### RDS / Aurora Serverless

**What it's for**: if you need a real relational database (tables, `JOIN`s, SQL transactions) — like Postgres or MySQL — but without installing it, applying security patches, or managing backups by hand, RDS does it for you. Aurora's **Serverless v2** version is the "lazy" choice: it scales itself, and if traffic is zero, you pay (almost) zero.

```hcl
resource "aws_rds_cluster" "db" {
  cluster_identifier = "lazy-db"
  engine             = "aurora-postgresql"
  engine_mode        = "provisioned"
  master_username    = "admin"
  master_password    = var.db_password

  serverlessv2_scaling_configuration {
    min_capacity = 0.5
    max_capacity = 2
  }
}

resource "aws_rds_cluster_instance" "db_instance" {
  cluster_identifier = aws_rds_cluster.db.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.db.engine
}
```

```python
# NOTE: to QUERY RDS you don't use boto3, but a real SQL driver (e.g. psycopg2) —
# boto3 is only for ADMINISTERING the service, not for talking to the database.
import boto3

rds = boto3.client("rds")
status = rds.describe_db_clusters(DBClusterIdentifier="lazy-db")["DBClusters"][0]["Status"]
print(status)   # => "available"
```

> 🧠 **The golden rule**: use DynamoDB when you know in advance *how* you'll query the data (by key). Use RDS/Aurora when you need complex queries, relationships between tables, or your team simply already thinks in SQL.

---

## 4. Networking & Delivery — How Users Find You

**In a nutshell**: **API Gateway** receives HTTP requests and routes them. **CloudFront** keeps copies of your files close to users around the world, for speed. **Route 53** translates names (`mysite.com`) into real addresses.

### API Gateway

**What it's for**: it's your app's "receptionist" — it receives HTTP requests from the internet and passes them to the right Lambda (or service), handling boring things like CORS, throttling, and authentication for you.

```hcl
resource "aws_apigatewayv2_api" "http_api" {
  name          = "lazy-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.hello.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "hello" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /hello"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}
```

```python
# use_api.py — from the perspective of whoever CALLS the API, you don't need boto3: it's plain HTTP
import requests

response = requests.get("https://abc123.execute-api.eu-west-1.amazonaws.com/hello")
print(response.json())
```

### CloudFront

**What it's for**: it's a **CDN** (Content Delivery Network) — a network of "warehouses" scattered around the world that keep a copy of your files close to whoever requests them. If your S3 bucket is in Ireland and a user downloads it from Japan, without CloudFront the file travels from one end of the world to the other. With CloudFront, the file was already sitting in a warehouse near Tokyo.

```hcl
resource "aws_cloudfront_distribution" "cdn" {
  enabled = true

  origin {
    domain_name = aws_s3_bucket.uploads.bucket_regional_domain_name
    origin_id   = "s3-uploads"
  }

  default_cache_behavior {
    target_origin_id       = "s3-uploads"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods         = ["GET", "HEAD"]
    cached_methods           = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
```

```python
# invalidate_cache.py — after a deploy, tell CloudFront to forget the old copies
import boto3

cf = boto3.client("cloudfront")
cf.create_invalidation(
    DistributionId="E123EXAMPLE",
    InvalidationBatch={
        "Paths": {"Quantity": 1, "Items": ["/*"]},
        "CallerReference": "deploy-2026-07-16",
    },
)
```

### Route 53

**What it's for**: it's the internet's phone book. It translates a readable name like `api.mylazyapp.dev` into the real address of your service (CloudFront, a Load Balancer, etc.).

```hcl
resource "aws_route53_zone" "main" {
  name = "mylazyapp.dev"
}

resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.mylazyapp.dev"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}
```

```python
import boto3

r53 = boto3.client("route53")
for zone in r53.list_hosted_zones()["HostedZones"]:
    print(zone["Name"], zone["Id"])
```

---

## 5. Messaging — The Glue Between Services

**In a nutshell**: when two parts of your app need to "talk" without waiting on each other, you use messaging instead of direct calls. **SQS** is a checkout line, **SNS** is a megaphone, **EventBridge** is a smart sorter.

### SQS (Simple Queue Service)

**What it's for**: it's a queue — like the line at the supermarket checkout. One service puts messages on the queue, another picks them up and processes them **one at a time**, at its own pace. If the consumer is slow or breaks for a moment, the messages just wait there, they aren't lost.

```hcl
resource "aws_sqs_queue" "orders" {
  name                       = "pending-orders"
  visibility_timeout_seconds = 30
}
```

```python
import boto3

sqs = boto3.client("sqs")
queue_url = "https://sqs.eu-west-1.amazonaws.com/123456789012/pending-orders"

sqs.send_message(QueueUrl=queue_url, MessageBody='{"order_id": 42}')

messages = sqs.receive_message(QueueUrl=queue_url, MaxNumberOfMessages=1)
for m in messages.get("Messages", []):
    print(m["Body"])
    sqs.delete_message(QueueUrl=queue_url, ReceiptHandle=m["ReceiptHandle"])
```

### SNS (Simple Notification Service)

**What it's for**: it's a megaphone. A message published on a "topic" reaches **all** subscribers at once — email, SMS, another SQS queue, a Lambda. Unlike SQS (one at a time), here everyone receives the same news together.

```hcl
resource "aws_sns_topic" "notifications" {
  name = "order-notifications"
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.notifications.arn
  protocol  = "email"
  endpoint  = "dev@mylazyapp.dev"
}
```

```python
import boto3

sns = boto3.client("sns")
sns.publish(
    TopicArn="arn:aws:sns:eu-west-1:123456789012:order-notifications",
    Subject="Order #42",
    Message="New order received!",
)
```

### EventBridge

**What it's for**: it's a smart package sorter. Based on the "type" of event that arrives, it decides on its own where to route it — without the service that generates the event knowing anything about who will receive it. Great for decoupling different parts of a large system.

```hcl
resource "aws_cloudwatch_event_rule" "new_order" {
  name = "new-order"
  event_pattern = jsonencode({
    source      = ["app.orders"]
    detail-type = ["OrderCreated"]
  })
}

resource "aws_cloudwatch_event_target" "send_to_lambda" {
  rule = aws_cloudwatch_event_rule.new_order.name
  arn  = aws_lambda_function.hello.arn
}
```

```python
import boto3, json

events = boto3.client("events")
events.put_events(Entries=[{
    "Source": "app.orders",
    "DetailType": "OrderCreated",
    "Detail": json.dumps({"order_id": 42}),
}])
```

> 🧠 **The golden rule**: SQS when you need ONE worker processing each message. SNS when you need MULTIPLE recipients that all need to know the same thing right away. EventBridge when you have lots of different event "types" and want to route them with rules, without writing that logic by hand.

---

## 6. Security & Configuration — The Bouncer and the Safe

**In a nutshell**: **IAM** decides who can do what. **SSM Parameter Store** (or **Secrets Manager**) keeps passwords and configuration out of your code, safely.

### IAM (Identity and Access Management)

**What it's for**: it's the bouncer of the "AWS club". Every person, every service, every Lambda has an identity (a **user** or a **role**), and IAM decides — through **policies** — what that identity is allowed to touch. You've already seen examples in the previous sections (the `aws_iam_role` for the Lambda, for ECS): it's always IAM behind the scenes.

```hcl
resource "aws_iam_policy" "read_only_s3" {
  name = "read-only-uploads-bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject"]
      Resource = "${aws_s3_bucket.uploads.arn}/*"
    }]
  })
}
```

```python
import boto3

sts = boto3.client("sts")
print(sts.get_caller_identity())   # who am "I", according to AWS, right now?
```

> 🧠 **The golden rule — Least Privilege**: always grant the **minimum permission necessary**, never `"Action": "*"`. If your Lambda only needs to read from a bucket, give it permission to read ONLY that bucket — not "all of S3", let alone "all of AWS".

### SSM Parameter Store

**What it's for**: it's the safe where you keep passwords, API keys, configuration URLs — instead of writing them in the code or in a `.env` file accidentally committed to Git. `SecureString` encrypts the value automatically.

```hcl
resource "aws_ssm_parameter" "db_password" {
  name  = "/lazyapp/db_password"
  type  = "SecureString"
  value = var.db_password
}
```

```python
import boto3

ssm = boto3.client("ssm")
password = ssm.get_parameter(
    Name="/lazyapp/db_password",
    WithDecryption=True,
)["Parameter"]["Value"]
```

> 💡 **Tip**: for simple secrets (passwords, tokens), Parameter Store is free and enough. For secrets that need to **rotate automatically** (e.g. a database password that changes every 30 days on its own), there's **Secrets Manager** — same idea, with automatic rotation built in, at a slightly higher cost.

---

## 7. Observability — The Dashboard

**In a nutshell**: **CloudWatch** is your car's dashboard: logs, metrics, and alarms that warn you when something's going wrong, before an angry user notices.

### CloudWatch

**What it's for**: every AWS service automatically writes its own logs and metrics (CPU, requests per second, errors...) to CloudWatch. You can read them, search them, and create **alarms** that notify you (or react on their own) when something crosses a threshold.

```hcl
resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/ecs/fastapi"
  retention_in_days = 14   # after 14 days, old logs are automatically deleted
}

resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "ecs-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods   = 2
  metric_name           = "CPUUtilization"
  namespace              = "AWS/ECS"
  period                   = 60
  statistic                 = "Average"
  threshold                 = 80
}
```

```python
import boto3

logs = boto3.client("logs")
events = logs.filter_log_events(
    logGroupName="/ecs/fastapi",
    filterPattern="ERROR",
)
for e in events["events"]:
    print(e["message"])
```

---

## 8. The Advanced Level: Bedrock

**In a nutshell**: **Amazon Bedrock** gives you access, through a single API, to ready-made AI models (like Anthropic's Claude) — without training them, without managing GPUs, without hosting anything yourself.

### Amazon Bedrock

**What it's for**: imagine you want to add "intelligence" to your app — answering questions, summarizing text, generating content — but without building and maintaining an AI model yourself (a job for specialized teams, not a "lazy developer"). Bedrock is a shop of ready-to-use models, for rent: you call an API, pay for what you use, and a world-class model answers you.

**How you use it**: you enable access to the model you're interested in (from the Console, a one-time step), grant your AWS identity permission to invoke it, and then call `invoke_model` from Python.

```hcl
# Bedrock's "provisioning" is almost all permissions — the model already exists, managed by AWS
resource "aws_iam_policy" "use_bedrock" {
  name = "use-claude-on-bedrock"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["bedrock:InvokeModel"]
      Resource = "arn:aws:bedrock:*::foundation-model/anthropic.claude-*"
    }]
  })
}
```

```python
import boto3, json

bedrock = boto3.client("bedrock-runtime")

response = bedrock.invoke_model(
    modelId="anthropic.claude-3-5-sonnet-20241022-v2:0",
    body=json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 200,
        "messages": [{"role": "user", "content": "Explain Bedrock in one sentence, like I'm thirteen"}],
    }),
)

text = json.loads(response["body"].read())["content"][0]["text"]
print(text)
```

> 🧠 **The golden rule**: Bedrock is "advanced" not because it's complicated to use (you just saw it: an `invoke_model` call and you're done), but because it touches a different domain — generative AI. For everything else (SageMaker, Rekognition, Comprehend...) this playbook deliberately stops here: they're specialist services, not the daily bread of a "lazy" developer who wants to ship product.

---

## 9. Project: the CI/CD Pipeline with GitHub Actions

Let's put it all together: a **FastAPI** app running on **ECS/Fargate**, and a **Lambda** — both in Python, both automatically tested and linted on every push to `main`, both deployed without you ever having to type an `aws` command by hand.

![CI/CD Pipeline](aws-cicd-pipeline.png)

### Project structure

```
my-project/
├── api/
│   ├── app/
│   │   └── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── lambda/
│   ├── handler.py
│   └── requirements.txt
├── tests/
│   ├── test_api.py
│   └── test_lambda.py
└── .github/
    └── workflows/
        └── deploy.yml
```

```python
# api/app/main.py
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}
```

```dockerfile
# api/Dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```python
# lambda/handler.py
def handler(event, context):
    return {"statusCode": 200, "body": "Hello from the Lambda!"}
```

### Step 0: the IAM role GitHub will use to authenticate

The first rule of "lazy but secure": **no AWS keys saved in GitHub secrets**. We use **OIDC** (OpenID Connect): we create an IAM role that explicitly trusts "this repository, on this branch" — GitHub presents a temporary token, AWS verifies it, and grants access only for the duration of the job. No static credentials to rotate or accidentally leak.

```hcl
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_iam_role" "github_actions" {
  name = "github-actions-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:sub" = "repo:my-user/my-project:ref:refs/heads/main"
        }
      }
    }]
  })
}
```

### Step 1: workflow trigger and permissions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

permissions:
  id-token: write   # required to authenticate with AWS via OIDC
  contents: read

env:
  AWS_REGION: eu-west-1
```

### Step 2: the job that lints and tests (shared by both API and Lambda)

No deploy starts if lint or tests fail — this job is a dependency (`needs`) for both of the following deploys.

```yaml
jobs:
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.13"

      - name: Install dependencies
        run: pip install ruff pytest -r api/requirements.txt -r lambda/requirements.txt

      - name: Lint with ruff
        run: ruff check api lambda

      - name: Test with pytest
        run: pytest tests/
```

### Step 3: the job that deploys the FastAPI app to ECS

```yaml
  deploy-api:
    needs: lint-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to AWS (OIDC, no saved keys)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-actions-deploy
          aws-region: ${{ env.AWS_REGION }}

      - name: Log in to ECR
        id: ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push the Docker image
        env:
          REGISTRY: ${{ steps.ecr.outputs.registry }}
          REPOSITORY: fastapi-app
        run: |
          docker build -t $REGISTRY/$REPOSITORY:latest ./api
          docker push $REGISTRY/$REPOSITORY:latest

      - name: Update the ECS service
        run: |
          aws ecs update-service \
            --cluster lazy-cluster \
            --service fastapi-service \
            --force-new-deployment
```

> 💡 **Tip**: here, to keep things simple, we always retag `:latest` and use `--force-new-deployment` to tell ECS "go pull the image again." In a real project, it's better to tag each image with `${{ github.sha }}`, register a **new Task Definition** pointing to that exact tag, and update the service against that — that way you always know EXACTLY which commit is running in production, and a rollback is just "go back to the previous Task Definition," a one-second operation.

### Step 4: the job that deploys the Lambda

```yaml
  deploy-lambda:
    needs: lint-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to AWS (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-actions-deploy
          aws-region: ${{ env.AWS_REGION }}

      - name: Package the function
        run: |
          cd lambda
          pip install -r requirements.txt -t package
          cd package && zip -r ../function.zip . && cd ..
          zip -g function.zip handler.py

      - name: Publish the new code
        run: |
          aws lambda update-function-code \
            --function-name hello-lazy-dev \
            --zip-file fileb://lambda/function.zip
```

### Concepts applied

- **Section 1**: `aws_lambda_function`, `aws_ecs_service`, `aws_ecr_repository` — the Lambda + ECS/Fargate pair, both "no servers to manage"
- **Section 6**: the IAM role for GitHub Actions, with the least-privilege principle (only `sts:AssumeRoleWithWebIdentity`, only from that repo/branch)
- **Section 7**: the container logs end up in CloudWatch (`/ecs/fastapi`) — the first place to look if the deploy seems to have gone fine but the app isn't responding

---

## 🎉 You made it!

You've completed **AWS for Lazy Developers**. Now you know:

- Why "lazy" is a virtue: managed and serverless services take server management off your plate
- **Compute**: Lambda for short, event-driven functions, ECS/Fargate for always-on containers, ECR for hosting Docker images
- **Storage**: S3 as an infinite closet, with temporary links to share files without making them public
- **Database**: DynamoDB for fast key-based queries, RDS/Aurora Serverless for real SQL without managing it yourself
- **Networking**: API Gateway as the HTTP receptionist, CloudFront as a global CDN, Route 53 as the internet's phone book
- **Messaging**: SQS (queue, one at a time), SNS (megaphone, to everyone), EventBridge (smart sorter)
- **Security**: IAM and the least-privilege principle, Parameter Store so you never write a password in your code
- **Observability**: CloudWatch as the dashboard for logs, metrics, and alarms
- **The advanced level**: Bedrock, to add generative AI to your app with a single API call
- How to build a real CI/CD pipeline with GitHub Actions: lint, test, OIDC authentication with no saved keys, deploy to ECS and to Lambda

**Where to go from here?**

- 📖 [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/) — the official guidelines for designing well on AWS
- 🧱 [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs) — the documentation for every single resource you saw here
- 🐍 [Boto3 Docs](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html) — every AWS service has a boto3 client, with all its available methods
- 🤖 [Amazon Bedrock User Guide](https://docs.aws.amazon.com/bedrock/) — dig deeper into the available models and advanced options (streaming, agents, knowledge bases)
- 🐍 [.NET Pragmatic Approach](/it/playbook/dotnet) — if you fancy comparing the same pragmatic spirit applied to a completely different ecosystem

> 🧠 **One last piece of advice**: you don't need to know all 200 AWS services. You need to know the 10-15 that solve 90% of the problems you'll run into — the ones you just saw in this playbook — and know when it's time to look up a new one. The rest, you learn when you actually need it. Happy deploying! 🟠
