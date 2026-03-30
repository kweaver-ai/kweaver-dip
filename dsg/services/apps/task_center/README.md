# Task Center Service

**Language / 语言**: [English](README.md) | [中文](README.zh.md)

A comprehensive task management and workflow orchestration service built with Go that provides project management, task tracking, work order management, and data processing capabilities with multi-tenant support.

## Overview

The Task Center Service is a microservice that handles task management, project orchestration, work order workflows, and data processing pipelines. It supports multi-project management, task lifecycle tracking, work order templates, data quality monitoring, and provides RESTful APIs for project management, task operations, work order processing, and data pipeline orchestration.

## Features

- **Project & Task Management**:
  - Project creation, management, and tracking
  - Task lifecycle management (create, assign, track, complete)
  - Project member management and permissions
  - Task dependencies and workflow orchestration

- **Work Order System**:
  - Work order creation and management
  - Work order templates for standardized processes
  - Work order task breakdown and assignment
  - Work order tracking and status monitoring
  - Work order alarm and notification system

- **Data Processing Pipeline**:
  - Data aggregation inventory management
  - Data aggregation planning and execution
  - Data comprehension planning
  - Data processing overview and monitoring
  - Data processing plan orchestration
  - Data quality assessment and monitoring
  - Data research report generation

- **Object Storage Management**:
  - OSS bucket management
  - File upload, download, and organization
  - Storage quota and permission management

- **User & Tenant Management**:
  - Multi-tenant application support
  - User profile and permission management
  - Role-based access control
  - Tenant isolation and management

- **Notification & Communication**:
  - Real-time notification system
  - Email and in-app notifications
  - Notification templates and customization
  - Operation log tracking and auditing

- **Database & Analytics**:
  - Database sandbox environment
  - Relation data management and querying
  - Points management and scoring system
  - Analytics and reporting

- **Observability**:
  - OpenTelemetry integration for distributed tracing
  - Structured logging with Zap
  - Request/response tracing middleware
  - Comprehensive audit logging

- **API Documentation**:
  - Swagger/OpenAPI documentation
  - Auto-generated API docs
  - Interactive API testing interface

## Technology Stack

- **Language**: Go 1.24.0
- **Web Framework**: Gin
- **ORM**: GORM with MySQL driver
- **Message Queue**: Kafka (via Sarama)
- **Dependency Injection**: Google Wire
- **API Documentation**: Swagger
- **Observability**: OpenTelemetry
- **Logging**: Zap
- **Configuration**: Viper
- **Database**: MySQL with migration support
- **Multi-tenancy**: Tenant isolation and management

## Project Structure

```
task_center/
├── adapter/              # Adapter layer (drivers and driven)
│   ├── driver/          # HTTP handlers and REST API (Gin)
│   │   ├── tc_task/     # Task management endpoints
│   │   ├── tc_project/  # Project management endpoints
│   │   ├── tc_oss/      # Object storage endpoints
│   │   ├── work_order/ # Work order management
│   │   ├── work_order_template/ # Work order templates
│   │   ├── work_order_task/ # Work order tasks
│   │   ├── user/        # User management endpoints
│   │   ├── data_aggregation_inventory/ # Data aggregation
│   │   ├── data_aggregation_plan/ # Data aggregation planning
│   │   ├── data_comprehension_plan/ # Data comprehension
│   │   ├── data_processing_overview/ # Processing overview
│   │   ├── data_processing_plan/ # Processing plan
│   │   ├── data_quality/ # Data quality monitoring
│   │   ├── data_research_report/ # Research reports
│   │   ├── db_sandbox/  # Database sandbox
│   │   ├── notification/ # Notification system
│   │   ├── operation_log/ # Operation logs
│   │   ├── points_management/ # Points system
│   │   ├── relation_data/ # Relation data management
│   │   ├── tenant_application/ # Tenant applications
│   │   └── middleware/ # HTTP middleware
│   └── driven/          # External service clients and storage
│       ├── gorm/         # Database implementation
│       ├── business_grooming/ # Business logic adapters
│       ├── configuration_center/ # Configuration service
│       ├── data_catalog/ # Data catalog integration
│       ├── data_exploration/ # Data exploration tools
│       └── data_view/    # Data view components
├── cmd/                  # Application entry points
│   └── server/           # Main server application
├── common/               # Shared utilities and middleware
│   ├── constant/         # Constants
│   ├── errorcode/        # Error codes
│   ├── initialization/   # Initialization logic
│   ├── settings/         # Configuration settings
│   └── utils/            # Utility functions
├── controller/           # Business logic controllers
├── domain/              # Business logic and domain models
│   ├── tc_task/          # Task domain models
│   ├── tc_project/       # Project domain models
│   ├── tc_oss/           # OSS domain models
│   ├── work_order/       # Work order domain models
│   ├── work_order_template/ # Work order template models
│   ├── work_order_task/  # Work order task models
│   ├── user/             # User domain models
│   ├── data_*/           # Data processing domain models
│   ├── notification/    # Notification domain models
│   ├── operation_log/    # Operation log models
│   ├── points_management/ # Points management models
│   └── relation_data/    # Relation data models
├── infrastructure/      # Infrastructure layer
│   ├── database/        # Database configuration
│   └── message_queue/   # Message queue settings
└── interface/          # Interface definitions
```

## Prerequisites

- Go 1.24.0 or higher
- MySQL server (for data storage)
- Kafka (optional, for message queue)
- Redis (optional, for caching)
- Configuration management service

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd services/apps/task_center
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

The service uses Viper for configuration management. Configuration files should be placed in `cmd/server/config/` directory.

Key configuration sections:
- **Server**: HTTP server settings (port, timeout, etc.)
- **Database**: MySQL connection settings
- **Kafka**: Message queue settings (optional)
- **Redis**: Cache settings (optional)
- **Telemetry**: OpenTelemetry configuration
- **Logging**: Log level and output settings
- **Multi-tenancy**: Tenant management settings

Example configuration structure:
```yaml
server:
  port: 8080
  timeout: 30s

database:
  host: localhost
  port: 3306
  username: user
  password: password
  dbname: task_center

kafka:
  brokers:
    - localhost:9092
  topic: task_center

redis:
  addr: localhost:6379
  password: ""
  db: 0

telemetry:
  endpoint: localhost:4317
  service_name: task_center
```

### Building

Build the service binary:

```bash
# Build for current platform
go build -o bin/task-center ./cmd/server

# Build for Linux
GOOS=linux GOARCH=amd64 go build -o bin/task-center-linux ./cmd/server
```

The binary will be generated in the `bin/` directory as `task-center`.

### Running

Start the service:

```bash
# Run directly
./bin/task-center --confPath cmd/server/config/

# Or with Go
go run cmd/server/main.go --confPath cmd/server/config/
```

The service will start on the configured port (default: 8080).

### API Endpoints

The service provides RESTful APIs for various functionalities. Key endpoint categories include:

#### Project Management
- Project CRUD operations
- Project member management
- Project analytics and reporting

#### Task Management
- Task creation, assignment, and tracking
- Task workflow orchestration
- Task dependency management

#### Work Order System
- Work order creation and management
- Work order template operations
- Work order task breakdown

#### Data Processing
- Data aggregation operations
- Data quality monitoring
- Data processing pipeline management

#### User & Tenant Management
- User profile management
- Tenant application management
- Role-based access control

### API Documentation

After generating Swagger docs, access the API documentation at:
- Swagger UI: `http://localhost:<port>/swagger/index.html`
- JSON: `http://localhost:<port>/swagger/doc.json`

## Development

### Code Generation

```bash
# Generate Wire dependency injection
make wire

# Generate Swagger documentation
make swag
```

### Database Migration

```bash
# Run database migrations
migrate -path migrations -database "mysql://user:password@tcp(host:3306)/task_center" up

# Rollback migrations
migrate -path migrations -database "mysql://user:password@tcp(host:3306)/task_center" down
```

### Running Tests

```bash
go test ./...
```

### Code Quality

The project follows Go best practices and clean architecture principles. Consider using:
- `golangci-lint` for code quality checks
- `go vet` for static analysis
- `go fmt` for code formatting

## Architecture

The service follows a clean architecture pattern with clear separation of concerns:

- **Domain Layer**: Business logic and domain models
  - Task management, project orchestration, work order processing
  - Data pipeline management, quality monitoring
  - User and tenant management

- **Adapter Layer**:
  - **Driver**: HTTP handlers, REST API endpoints (Gin)
  - **Driven**: Database implementation, external service clients

- **Common**: Shared utilities, middleware, and configurations

## Multi-tenancy

The service supports multi-tenancy with:
- Database-level tenant isolation
- Tenant-specific configuration and permissions
- Tenant-aware routing and resource management
- Tenant-scoped data access control

## Data Management

- MySQL database for persistent storage
- GORM for ORM and database operations
- Database migration support
- Transaction management
- Connection pooling

## Message Queue Integration

- Kafka integration for asynchronous processing
- Event-driven architecture for workflows
- Message publishing and consumption
- Reliable message delivery

## Security

- Role-Based Access Control (RBAC)
- Tenant isolation and security
- Secure API endpoints
- Input validation and sanitization
- Compliance audit logging

## Monitoring & Observability

- OpenTelemetry for distributed tracing
- Structured logging with correlation IDs
- Performance metrics collection
- Health check endpoints
- Audit tracking for critical operations

## Contributing

1. Follow existing code style and patterns
2. Add tests for new features
3. Update API documentation when adding new endpoints
4. Run `make swag` to regenerate Swagger docs
5. Ensure all tests pass before submitting
6. Follow clean architecture principles

## License

See the LICENSE file in the repository root.

## Support

For issues and questions, please contact the development team or create an issue in the repository.
