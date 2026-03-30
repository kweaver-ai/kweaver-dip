# Data-View - Data View Service

[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat&logo=go)](https://golang.org)
[![Gin](https://img.shields.io/badge/Gin-Web%20Framework-green)](https://gin-gonic.com)
[![GORM](https://img.shields.io/badge/GORM-ORM-blue)](https://gorm.io)
[![Wire](https://img.shields.io/badge/Wire-Dependency%20Injection-orange)](https://github.com/google/wire)

**Language / 语言**: [English](README.md) | [中文](README.zh.md)

An enterprise-grade data view management microservice built with Go, using DDD (Domain-Driven Design) architecture to provide unified data view management, data lineage, data classification, data masking, and other core capabilities for the AnyFabric ecosystem.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Development Guide](#development-guide)
- [Deployment](#deployment)
- [Architecture](#architecture)
- [Security Considerations](#security-considerations)
- [Contributing](#contributing)

## Overview

Data-View is a comprehensive enterprise-grade data view management service that provides core functionalities including metadata view management, logic view management, data lineage analysis, data classification management, data masking, data exploration, dataset management, and graph models.

The service adopts DDD (Domain-Driven Design) architecture, offering excellent scalability and maintainability, supporting multiple databases and message queues to provide enterprises with a unified data view management solution.

## Features

### Core Function Modules

#### 1. Form View (Metadata View)
- Create, edit, and delete metadata views
- View field management
- View filter rule configuration
- Data preview functionality
- Excel view support
- Whitelist policy management
- Masking rule management
- View publishing and batch publishing

#### 2. Logic View
- Custom view creation and management
- Logic entity view management
- View review workflow
- View draft management
- Synthetic and sample data generation
- View authorization management

#### 3. Data Lineage
- Data lineage relationship query
- Lineage relationship visualization
- Lineage data parsing

#### 4. Data Privacy Policy
- Privacy policy creation and management
- Policy and view association
- Masked data query

#### 5. Recognition Algorithm
- Recognition algorithm management
- Algorithm start and stop
- Algorithm export
- Built-in type management

#### 6. Classification Rule
- Classification rule creation and management
- Rule start and stop
- Rule statistics
- Rule export

#### 7. Grade Rule
- Grade rule creation and management
- Rule group management
- Rule start and stop
- Rule statistics and export
- Batch deletion

#### 8. Data Set
- Data set creation and management
- View and data set association
- Data set view tree structure

#### 9. Graph Model
- Graph model creation and management
- Model canvas save and query
- Theme model level setting
- Tag recommendation configuration

#### 10. Explore Rule
- Explore rule creation and management
- Template rule management
- Rule enable status management
- Built-in rule query

#### 11. Explore Task
- Explore task creation and management
- Task cancellation and deletion
- Explore report query

#### 12. Sub View
- Sub view creation and management
- Row and column rule configuration

## Technology Stack

| Type | Technology |
|------|------------|
| Language | Go 1.22+ |
| Web Framework | Gin |
| ORM | GORM |
| Dependency Injection | Wire |
| API Documentation | Swagger |
| Message Queue | Kafka / NSQ |
| Cache | Redis |
| Database | MySQL / MariaDB / DM8 |
| Tracing | OpenTelemetry |
| Logging | Zap |

## Project Structure

```
data-view/
├── cmd/                          # Application entry
│   ├── server/                   # HTTP server
│   │   ├── main.go              # Main entry file
│   │   ├── wire.go              # Wire dependency injection configuration
│   │   ├── wire_gen.go          # Wire generated code
│   │   ├── config/              # Configuration files
│   │   │   └── config.yaml     # Application configuration
│   │   └── docs/                # Swagger documentation
│   └── script/                  # Script tools
│
├── domain/                       # Domain layer (business logic)
│   ├── form_view/               # Metadata view domain
│   ├── logic_view/              # Logic view domain
│   ├── data_lineage/            # Data lineage domain
│   ├── data_privacy_policy/     # Data privacy policy domain
│   ├── recognition_algorithm/   # Recognition algorithm domain
│   ├── classification_rule/     # Classification rule domain
│   ├── grade_rule/             # Grade rule domain
│   ├── grade_rule_group/       # Grade rule group domain
│   ├── data_set/               # Data set domain
│   ├── graph_model/            # Graph model domain
│   ├── explore_rule/           # Explore rule domain
│   ├── explore_task/           # Explore task domain
│   ├── sub_view/               # Sub view domain
│   └── set.go                  # Domain module set
│
├── adapter/                     # Adapter layer
│   ├── driver/                 # Driver adapter (external interfaces)
│   │   ├── form_view/          # Metadata view API
│   │   ├── logic_view/         # Logic view API
│   │   ├── data_lineage/       # Data lineage API
│   │   ├── data_privacy_policy/# Data privacy policy API
│   │   ├── recognition_algorithm/# Recognition algorithm API
│   │   ├── classification_rule/# Classification rule API
│   │   ├── grade_rule/         # Grade rule API
│   │   ├── grade_rule_group/   # Grade rule group API
│   │   ├── data_set/           # Data set API
│   │   ├── graph_model/        # Graph model API
│   │   ├── explore_rule/       # Explore rule API
│   │   ├── explore_task/       # Explore task API
│   │   ├── sub_view/           # Sub view API
│   │   ├── middleware/         # Middleware
│   │   ├── mq/                 # Message queue processing
│   │   ├── route.go            # Route registration
│   │   └── server.go            # HTTP server configuration
│   │
│   └── driven/                 # Driven adapter (external dependencies)
│       ├── configuration_center/# Configuration center client
│       ├── gorm/               # GORM database implementation
│       ├── mq/                 # Message queue implementation
│       ├── redis/              # Redis cache implementation
│       ├── rest/               # REST client
│       ├── sailor_service/      # Sailor service client
│       ├── workflow/            # Workflow service
│       └── callbacks/          # Callback handling
│
├── infrastructure/              # Infrastructure layer
│   ├── config/                 # Configuration management
│   ├── db/                     # Database related
│   ├── cache/                  # Cache related
│   └── mq/                     # Message queue related
│
├── common/                      # Common layer
│   ├── app/                    # Application startup
│   ├── constant/               # Constants
│   ├── errorcode/              # Error codes
│   ├── form_validator/         # Form validation
│   ├── initialization/         # Initialization logic
│   ├── models/                # Data models
│   └── util/                   # Utilities
│
├── migrations/                 # Database migration scripts
│   ├── mariadb/               # MariaDB migration scripts
│   └── dm8/                    # DM8 migration scripts
│
├── go.mod                       # Go module definition
├── go.sum                       # Dependency checksums
├── Makefile                     # Build script
├── Dockerfile                   # Docker image build
├── pipelines.yml                # CI/CD pipeline configuration
└── README.md                   # Project documentation
```

## Quick Start

### Prerequisites

- Go 1.22 or higher
- MySQL/MariaDB or DM8 database
- Redis
- Kafka or NSQ (optional)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd services/apps/data-view
```

2. Install dependencies:
```bash
go mod download
```

3. Generate code:
```bash
# Generate Wire dependency injection code
make wire

# Generate Swagger API documentation
make swag
```

### Configuration

The service uses environment variables and configuration files for configuration management. Configuration files are located in `cmd/server/config/config.yaml`.

Main configuration sections:
- **server**: Server configuration (HTTP/GRPC address, timeout, etc.)
- **doc**: API documentation configuration
- **depServices**: Dependent service address configuration
- **telemetry**: Tracing and logging configuration
- **database**: Database connection configuration
- **redisConfig**: Redis configuration
- **exploration**: Exploration task configuration
- **config**: Other business configuration
- **logs**: Logging configuration

Example configuration structure:
```yaml
server:
  port: 8123
  timeout: 30s

database:
  type: mysql
  host: localhost
  port: 3306
  username: root
  password: password
  name: data_view

redisConfig:
  addr: localhost:6379
  password: ""
  db: 0

exploration:
  worker_count: 10
  task_timeout: 300s
```

Environment variable examples:
```bash
export DB_TYPE=mysql
export DB_HOST=localhost
export DB_PORT=3306
export DB_USERNAME=root
export DB_PASSWORD=password
export DB_NAME=data_view
export REDIS_HOST=localhost
export REDIS_PASSWORD=""
export KAFKA_MQ_HOST=localhost:9092
export TRACE_URL=http://localhost:14268/api/traces
```

### Building

Build the service binary:

```bash
# Build binary file
go build -o bin/data-view ./cmd/server/main.go

# Build for Linux
GOOS=linux GOARCH=amd64 go build -o bin/data-view-linux ./cmd/server/main.go
```

### Running

Start the service:

```bash
# Run in development mode
make run

# Or run directly
./bin/data-view --confPath ./cmd/server/config/

# Or use Go
go run ./cmd/server/main.go --confPath ./cmd/server/config/
```

The service will start on the configured port (default: 8123).

## API Documentation

The project uses Swagger to generate API documentation.

### Generate Documentation

```bash
make swag
```

### Access Documentation

After starting the service, access:
- Swagger UI: `http://localhost:8123/swagger/index.html`
- ReDoc: `http://localhost:8123/swagger/index.html`

### API Paths

All endpoints are prefixed with:

- **Public API**: `/api/data-view/v1/*`
- **Internal API**: `/api/internal/data-view/v1/*`
- **Migration API**: `/api/internal/data-view/v1/*` (version upgrade dedicated)

### Main API Modules

#### Form View API
- `POST /api/data-view/v1/form-view` - Create metadata view
- `GET /api/data-view/v1/form-view/{id}` - Get metadata view details
- `PUT /api/data-view/v1/form-view/{id}` - Update metadata view
- `DELETE /api/data-view/v1/form-view/{id}` - Delete metadata view
- `GET /api/data-view/v1/form-view` - Get metadata view list
- `POST /api/data-view/v1/form-view/batch-publish` - Batch publish views

#### Logic View API
- `POST /api/data-view/v1/logic-view` - Create logic view
- `GET /api/data-view/v1/logic-view/{id}` - Get logic view details
- `PUT /api/data-view/v1/logic-view/{id}` - Update logic view
- `DELETE /api/data-view/v1/logic-view/{id}` - Delete logic view
- `GET /api/data-view/v1/logic-view` - Get logic view list
- `POST /api/data-view/v1/logic-view/{id}/publish` - Publish view
- `POST /api/data-view/v1/logic-view/{id}/review` - Review view

#### Data Lineage API
- `GET /api/data-view/v1/data-lineage/{source}` - Get data lineage relationship
- `GET /api/data-view/v1/data-lineage` - Query lineage relationships
- `POST /api/data-view/v1/data-lineage/parse` - Parse lineage data

#### Data Privacy Policy API
- `POST /api/data-view/v1/privacy-policy` - Create privacy policy
- `GET /api/data-view/v1/privacy-policy/{id}` - Get policy details
- `PUT /api/data-view/v1/privacy-policy/{id}` - Update policy
- `DELETE /api/data-view/v1/privacy-policy/{id}` - Delete policy
- `GET /api/data-view/v1/privacy-policy` - Get policy list

#### Recognition Algorithm API
- `POST /api/data-view/v1/recognition-algorithm` - Create recognition algorithm
- `GET /api/data-view/v1/recognition-algorithm/{id}` - Get algorithm details
- `PUT /api/data-view/v1/recognition-algorithm/{id}` - Update algorithm
- `DELETE /api/data-view/v1/recognition-algorithm/{id}` - Delete algorithm
- `GET /api/data-view/v1/recognition-algorithm` - Get algorithm list
- `POST /api/data-view/v1/recognition-algorithm/{id}/start` - Start algorithm
- `POST /api/data-view/v1/recognition-algorithm/{id}/stop` - Stop algorithm

#### Classification Rule API
- `POST /api/data-view/v1/classification-rule` - Create classification rule
- `GET /api/data-view/v1/classification-rule/{id}` - Get rule details
- `PUT /api/data-view/v1/classification-rule/{id}` - Update rule
- `DELETE /api/data-view/v1/classification-rule/{id}` - Delete rule
- `GET /api/data-view/v1/classification-rule` - Get rule list
- `POST /api/data-view/v1/classification-rule/{id}/start` - Start rule
- `POST /api/data-view/v1/classification-rule/{id}/stop` - Stop rule

#### Grade Rule API
- `POST /api/data-view/v1/grade-rule` - Create grade rule
- `GET /api/data-view/v1/grade-rule/{id}` - Get rule details
- `PUT /api/data-view/v1/grade-rule/{id}` - Update rule
- `DELETE /api/data-view/v1/grade-rule/{id}` - Delete rule
- `GET /api/data-view/v1/grade-rule` - Get rule list
- `POST /api/data-view/v1/grade-rule/{id}/start` - Start rule
- `POST /api/data-view/v1/grade-rule/{id}/stop` - Stop rule

#### Data Set API
- `POST /api/data-view/v1/data-set` - Create data set
- `GET /api/data-view/v1/data-set/{id}` - Get data set details
- `PUT /api/data-view/v1/data-set/{id}` - Update data set
- `DELETE /api/data-view/v1/data-set/{id}` - Delete data set
- `GET /api/data-view/v1/data-set` - Get data set list

#### Graph Model API
- `POST /api/data-view/v1/graph-model` - Create graph model
- `GET /api/data-view/v1/graph-model/{id}` - Get model details
- `PUT /api/data-view/v1/graph-model/{id}` - Update model
- `DELETE /api/data-view/v1/graph-model/{id}` - Delete model
- `GET /api/data-view/v1/graph-model` - Get model list

#### Explore Rule API
- `POST /api/data-view/v1/explore-rule` - Create explore rule
- `GET /api/data-view/v1/explore-rule/{id}` - Get rule details
- `PUT /api/data-view/v1/explore-rule/{id}` - Update rule
- `DELETE /api/data-view/v1/explore-rule/{id}` - Delete rule
- `GET /api/data-view/v1/explore-rule` - Get rule list

#### Explore Task API
- `POST /api/data-view/v1/explore-task` - Create explore task
- `GET /api/data-view/v1/explore-task/{id}` - Get task details
- `PUT /api/data-view/v1/explore-task/{id}` - Update task
- `DELETE /api/data-view/v1/explore-task/{id}` - Delete task
- `GET /api/data-view/v1/explore-task` - Get task list
- `POST /api/data-view/v1/explore-task/{id}/cancel` - Cancel task

#### Sub View API
- `POST /api/data-view/v1/sub-view` - Create sub view
- `GET /api/data-view/v1/sub-view/{id}` - Get sub view details
- `PUT /api/data-view/v1/sub-view/{id}` - Update sub view
- `DELETE /api/data-view/v1/sub-view/{id}` - Delete sub view
- `GET /api/data-view/v1/sub-view` - Get sub view list

## Development Guide

### Code Structure Standards

The project adopts DDD (Domain-Driven Design) architecture with the following main layers:

1. **Domain Layer**: Contains business logic and domain interfaces
   - `interface.go`: Define domain interfaces
   - `v1/`: Implementation version directory

2. **Adapter Layer**:
   - **driver**: Implement HTTP handlers, message queue consumers, etc.
   - **driven**: Implement database operations, external service calls, etc.

3. **Dependency Injection**: Use Wire for dependency injection
   - Modify `cmd/server/wire.go` to add new dependencies
   - Run `make wire` to generate code

### Adding New Features

1. Create a new domain module under `domain/`
2. Create an API handler under `adapter/driver/`
3. Implement external dependencies under `adapter/driven/`
4. Register routes in `adapter/driver/route.go`
5. Update Wire configuration and generate code

### Code Generation

```bash
# Generate Wire dependency injection code
make wire

# Generate Swagger documentation
make swag

# Generate all code
go generate ./...
```

### Database Migration

Database migration scripts are located in the `migrations/` directory:

- `mariadb/`: MariaDB migration scripts
- `dm8/`: DM8 migration scripts

### Running Tests

```bash
# Run tests
go test ./...

# Run tests with coverage
go test -cover ./...
```

### Makefile Commands

```bash
make help          # View all available commands
make init          # Install development dependencies
make swag          # Generate Swagger documentation
make wire          # Generate Wire dependency injection code
make run           # Run project (pull code, generate docs, run)
```

## Deployment

### Docker Deployment

1. Build the image:
```bash
docker build -t data-view:latest .
```

2. Run the container:
```bash
docker run -d \
  --name data-view \
  -p 8123:8123 \
  -v /path/to/config:/usr/local/bin/af/cmd/server/config \
  data-view:latest
```

### Compile Binary

```bash
# Compile
go build -o dv ./cmd/server/main.go

# Run
./dv --confPath ./cmd/server/config/
```

### CI/CD

The project includes CI/CD configurations:
- `pipelines.yml`: Pipeline configuration
- `CITemplate.yml`: CI template
- `push-image.yml`: Image push configuration

## Architecture

The project adopts **DDD (Domain-Driven Design)** architecture with the following main layers:

```
┌─────────────────────────────────────┐
│         Adapter Layer               │
│  ┌──────────┐      ┌──────────┐    │
│  │  Driver   │      │  Driven  │    │
│  │ (HTTP API)│      │(External)│    │
│  └──────────┘      └──────────┘    │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│         Domain Layer                 │
│  (Business Logic & Interfaces)       │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│      Infrastructure Layer            │
│  (DB, Cache, MQ, Config)             │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│         Common Layer                 │
│  (Utils, Constants, Models)          │
└─────────────────────────────────────┘
```

### Directory Description

#### cmd/
Application entry point, containing main program and startup logic.

#### domain/
Domain layer, containing business logic and domain models. Each subdirectory represents a business domain:
- **form_view**: Metadata view related business logic
- **logic_view**: Logic view related business logic
- **data_lineage**: Data lineage analysis business logic
- Other domain modules...

#### adapter/
Adapter layer, divided into two parts:
- **driver**: Driver adapter, implementing external interfaces (HTTP API, message queue consumers, etc.)
- **driven**: Driven adapter, implementing calls to external services (database, cache, external services, etc.)

#### infrastructure/
Infrastructure layer, providing technical implementations:
- **config**: Configuration management
- **db**: Database connection and configuration
- **cache**: Cache implementation
- **mq**: Message queue implementation

#### common/
Common layer, containing shared tools and components:
- **app**: Application startup and lifecycle management
- **constant**: Constants
- **errorcode**: Error codes
- **form_validator**: Form validators
- **util**: Utility functions

## Security Considerations

- **Data Access Control**: Manage data access permissions through whitelist policy management
- **Data Masking**: Support multiple data masking rules to protect sensitive information
- **View Authorization**: Strict view authorization mechanism to ensure data security
- **Audit Logging**: Complete operation audit log recording
- **Tracing**: Integrate OpenTelemetry to support security event tracing
- **Input Validation**: Strict input validation to prevent injection attacks

## Main Dependencies

- **GoCommon**: Internal common library
- **GoUtils**: Utility library
- **go-frame**: Framework core
- **Gin**: Web framework
- **GORM**: ORM framework
- **Wire**: Dependency injection
- **Swagger**: API documentation
- **Kafka/NSQ**: Message queue
- **Redis**: Cache
- **OpenTelemetry**: Tracing

## Contributing

1. Follow the project's code standards and commit standards
2. Add tests for new features
3. Update API documentation when adding new endpoints
4. Run `make swag` to regenerate Swagger documentation
5. Ensure all tests pass before submitting

## License

Enterprise internal distribution, all rights reserved.

## Contact

For questions, please contact the project maintenance team.
