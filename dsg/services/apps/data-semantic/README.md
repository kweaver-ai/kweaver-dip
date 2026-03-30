# data-semantic

> A microservice for semantic understanding of database tables and AI-powered business object identification.

[![Go Version](https://img.shields.io/badge/Go-1.24+-00ADD8?style=flat&logo=go)](https://golang.org)
[![Framework](https://img.shields.io/badge/Framework-Go--Zero-blue)](https://go-zero.dev)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Overview

`data-semantic` is a Go-Zero based microservice that provides intelligent semantic understanding of database tables. Through AI-powered analysis, it automatically identifies business objects from table structures, supports user editing and confirmation, and maintains version control throughout the process.

### Key Features

- **AI-Powered Semantic Analysis**: Automatically analyzes table and field business semantics
- **Business Object Identification**: Groups related fields into business objects
- **Version Control**: Supports re-identification with historical version preservation
- **Asynchronous Processing**: Kafka-based message queue for AI analysis
- **User Editing**: Full support for manual editing and correction of AI results
- **5-State Workflow Machine**: Not Understanding → Understanding → Pending Confirmation → Completed → Published

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   HTTP API  │ ──── │   Kafka      │ ──── │  AI Service │
│   (Go-Zero) │      │  Message Q   │      │             │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │
       ▼                     ▼
┌─────────────┐      ┌──────────────┐
│  MySQL 8.0  │      │   Redis 7.0  │
│             │      │   (Rate Limit)│
└─────────────┘      └──────────────┘
```

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | Go | 1.24+ |
| Framework | Go-Zero | v1.9+ |
| Database | MySQL | 8.0 |
| Cache | Redis | 7.0 |
| Message Queue | Kafka | 3.0 |
| ORM | SQLx / GORM | - |

### Key Dependencies

- `github.com/zeromicro/go-zero` - Microservice framework
- `github.com/IBM/sarama` - Kafka client
- `github.com/jmoiron/sqlx` - SQL extensions
- `github.com/jinguoxing/idrm-go-base` - Common utilities
- `github.com/stretchr/testify` - Testing framework
- `github.com/google/uuid` - UUID v7 generation

## Project Structure

```
data-semantic/
├── api/                      # API service layer
│   ├── doc/                  # API definitions & documentation
│   ├── etc/                  # Configuration files
│   └── internal/             # Internal implementation
│       ├── handler/          # Request handlers (parameter validation)
│       ├── logic/            # Business logic
│       ├── middleware/       # Middlewares
│       └── types/            # Type definitions
├── consumer/                 # Kafka consumers
├── model/                    # Data models (SQLx)
├── migrations/               # Database migrations (mariadb/dm8)
├── deploy/                   # Deployment configs (Docker/K8s)
├── specs/                    # SDD specification documents
├── .specify/                 # Spec Kit configuration
├── Makefile                  # Build commands
└── go.mod                    # Go module definition
```

## Getting Started

### Prerequisites

- Go 1.24 or higher
- MySQL 8.0
- Redis 7.0
- Kafka 3.0
- Docker (optional, for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/tianyuliang/data-semantic.git
cd data-semantic

# Install dependencies
go mod download
```

### Configuration

Edit `api/etc/api.yaml`:

```yaml
Name: data-semantic
Host: 0.0.0.0
Port: 8888

# Database configuration
DB:
  Host: localhost
  Port: 3306
  DBName: af_main
  Username: root
  Password: your_password

# Redis configuration
Redis:
  Host: localhost
  Port: 6379
  Type: node
  Pass: ""

# Kafka configuration
Kafka:
  Hosts:
    - localhost:9092
  GroupId: data-understanding-consumer-group

# JWT authentication
Auth:
  AccessSecret: your_secret_key
  AccessExpire: 7200
```

### Running the Service

```bash
# Run API service
go run api/api.go

# Or using Makefile
make run
```

The API will be available at `http://localhost:8888`

## API Documentation

### Base URL

```
/api/v1/data-semantic
```

### Authentication

All endpoints require JWT Bearer Token authentication:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:id/status` | Get understanding status |
| POST | `/:id/generate` | Generate understanding data |
| GET | `/:id/fields` | Get field semantic data |
| PUT | `/:id/semantic-info` | Save semantic information |
| GET | `/:id/business-objects` | Get business objects |
| PUT | `/:id/business-objects` | Save business objects |
| PUT | `/:id/business-objects/attributes/move` | Move attribute to object |
| POST | `/:id/business-objects/regenerate` | Regenerate business objects |
| POST | `/:id/submit` | Submit and confirm |
| DELETE | `/:id/business-objects` | Delete understanding results |

### Understanding States

| State | Value | Description |
|-------|-------|-------------|
| Not Understanding | 0 | Initial state |
| Understanding | 1 | AI processing in progress |
| Pending Confirmation | 2 | Awaiting user review |
| Completed | 3 | Confirmed and published |
| Published | 4 | Fully published |

### Example: Generate Understanding

```bash
curl -X POST http://localhost:8888/api/v1/data-semantic/{id}/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "understand_status": 1
}
```

### Swagger Documentation

Interactive API documentation is available:

- **JSON**: [api/doc/swagger/swagger.json](api/doc/swagger/swagger.json)
- **Markdown**: [api/doc/API.md](api/doc/API.md)

Use [Swagger UI](https://petstore.swagger.io/) with the swagger.json file.

## Development

### Code Generation

```bash
# Generate API code from .api definition
make api

# Generate Swagger documentation
make swagger

# Generate both
make gen
```

### Testing

```bash
# Run all tests
make test

# Run with coverage
go test -cover ./...

# Run specific test
go test -v ./api/internal/logic/data_semantic/...
```

### Linting

```bash
# Format code
make fmt

# Run linter
make lint
```

### Build

```bash
# Build binary
make build

# Output: bin/data-semantic
```

## Deployment

### Docker

```bash
# Build Docker image
make docker-build

# Run container
make docker-run

# Stop container
make docker-stop
```

### Kubernetes

```bash
# Deploy to dev environment
make k8s-deploy-dev

# Deploy to prod environment
make k8s-deploy-prod

# Check status
make k8s-status
```

## Development Workflow

This project follows **Spec-Driven Development (SDD)** methodology:

```
1. Context   → Read .specify/memory/constitution.md
2. Specify   → Create specs/{feature}/spec.md (EARS format)
3. Design    → Create specs/{feature}/plan.md
4. Tasks     → Create specs/{feature}/tasks.md
5. Implement → Code, test, verify
```

### Spec Kit Commands

```
/speckit.start <feature description>     # Start SDD workflow
/speckit.specify <feature description>   # Create specification
/speckit.plan                            # View technical plan
/speckit.tasks                           # View task list
/speckit.implement                       # Start implementation
/speckit.constitution                    # View project constitution
```

## Coding Standards

### Layer Architecture

```
HTTP Request → Handler → Logic → Model → Database
     ↓           ↓        ↓       ↓         ↓
  Parameter   Business  Data   MySQL
  Validation  Logic    Access
```

### Responsibilities

| Layer | Max Lines | Responsibilities |
|-------|-----------|------------------|
| Handler | 30 | Parameter binding, validation, response formatting |
| Logic | 50 | Business logic, transaction management |
| Model | 50 | Data access (SQLx/GORM) |

### Naming Conventions

- Files: `snake_case.go`
- Packages: `lowercase`
- Structs: `PascalCase`
- Methods: `PascalCase`
- Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

### Error Handling

```go
import "github.com/jinguoxing/idrm-go-base/errorx"

// Use predefined error codes
if user == nil {
    return nil, errorx.NewWithCode(errorx.ErrCodeNotFound)
}
```

## Documentation

- [CLAUDE.md](CLAUDE.md) - Project development guide
- [specs/](specs/) - SDD specification documents
- [.specify/memory/constitution.md](.specify/memory/constitution.md) - Project constitution

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
