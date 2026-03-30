# Data Exploration Service

**Language / 语言**: [English](README.md) | [中文](README.zh.md)

A comprehensive data exploration service built with Go that provides asynchronous data exploration capabilities, task configuration management, and report generation using Clean Architecture principles.

## Overview

The Data Exploration Service is a microservice that handles data exploration tasks, manages exploration configurations, generates exploration reports, and integrates with virtualization engines for query execution. It supports concurrent exploration, retry mechanisms, and provides RESTful APIs for creating, managing, and querying data exploration tasks.

## Features

- **Data Exploration**:
  - Asynchronous data exploration execution
  - Support for grouped queries and exploration tasks
  - Integration with virtualization engines
  - Query result caching and management
  - Exploration timeout handling

- **Task Configuration Management**:
  - Create, read, update, and delete exploration task configurations
  - Task scheduling and execution management
  - Task status tracking and monitoring

- **Report Management**:
  - Exploration report generation and storage
  - Report item management
  - Report query and retrieval
  - Third-party report support

- **Concurrency Control**:
  - Configurable concurrency limits
  - Task-level concurrency control
  - Service-level concurrency management

- **Retry Mechanism**:
  - Configurable retry count and wait time
  - SQL execution retry support
  - Timeout handling for retries

- **Observability**:
  - OpenTelemetry integration for distributed tracing
  - Structured logging
  - Request/response tracking middleware
  - Audit logging support

- **API Documentation**:
  - Swagger/OpenAPI documentation
  - Auto-generated API docs

## Technology Stack

- **Language**: Go 1.24+
- **Web Framework**: Gin
- **Database**: MySQL/MariaDB
- **ORM**: GORM
- **Message Queue**: Kafka
- **Cache**: Redis
- **Dependency Injection**: Google Wire
- **API Documentation**: Swagger
- **Observability**: OpenTelemetry
- **Architecture**: Clean Architecture

## Project Structure

```
data-exploration-service/
├── adapter/                    # Adapter layer
│   ├── driver/                # HTTP handlers and REST API (Gin)
│   │   ├── exploration/       # Data exploration API
│   │   │   └── v1/           # API version 1
│   │   ├── task_config/       # Task configuration API
│   │   │   └── v1/           # API version 1
│   │   ├── route.go          # Route configuration
│   │   └── httpEngine.go     # HTTP engine setup
│   └── driven/               # External service clients
│       ├── gorm/             # Database access (GORM)
│       │   ├── report/       # Report repository
│       │   ├── report_item/  # Report item repository
│       │   ├── task_config/ # Task config repository
│       │   └── client_info/ # Client info repository
│       ├── virtualization_engine/ # Virtualization engine client
│       ├── configuration_center/  # Configuration center client
│       ├── user_management/      # User management client
│       ├── hydra/                # OAuth2 client
│       ├── mq/                   # Message queue (Kafka)
│       └── redis_lock/           # Redis distributed lock
├── cmd/                      # Application entry points
│   ├── main.go              # Main entry point
│   ├── root.go              # Root command
│   ├── server.go            # Server command
│   ├── migrate.go           # Migration command
│   └── server/              # Server application
│       ├── config/          # Configuration files
│       ├── docs/            # Swagger documentation
│       ├── app.go           # Application setup
│       └── run.go           # Server run logic
├── common/                   # Shared utilities and middleware
│   ├── constant/           # Constants
│   ├── errorcode/          # Error codes
│   ├── form_validator/      # Form validation
│   ├── models/             # Common models
│   ├── middleware/         # Middleware
│   └── settings/           # Configuration settings
├── domain/                  # Business logic and domain models
│   ├── exploration/        # Data exploration domain
│   │   ├── impl/          # Implementation
│   │   ├── impl/v2/      # Version 2 implementation
│   │   ├── impl/tools/   # Tools and utilities
│   │   ├── interface.go  # Domain interface
│   │   └── server.go     # Exploration server
│   ├── task_config/       # Task configuration domain
│   └── common/            # Common domain logic
├── infrastructure/         # Infrastructure layer
│   └── repository/        # Repository implementations
│       └── db/            # Database models and migrations
└── migrations/            # Database migrations
    ├── dm8/                # DM8 database migrations
    └── mariadb/            # MariaDB/MySQL migrations
```

## Prerequisites

- Go 1.24 or higher
- MySQL 5.7+ or MariaDB 10.3+ database
- Kafka (for message queue)
- Redis (for caching and distributed locks)
- Make build tool

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd services/apps/data-exploration-service
```

2. Install dependencies and tools:
```bash
make init
```

3. Generate Wire dependency injection code:
```bash
make wire
```

4. Generate Swagger API documentation:
```bash
make swag
```

### Configuration

The service uses configuration files for settings. Configuration files should be placed in `cmd/server/config/` directory.

Key configuration sections:
- **Server**: HTTP server settings (port, timeout, etc.)
- **Database**: Database connection settings
- **Redis**: Redis connection settings
- **Kafka**: Kafka message queue settings
- **Exploration**: Data exploration specific settings
- **Telemetry**: OpenTelemetry configuration
- **Logging**: Log level and output settings
- **DepServices**: External service endpoints

Example configuration structure:
```yaml
server:
  http:
    addr: 0.0.0.0:8281
    timeout: 10s

database:
  dbtype: "${DB_TYPE}"
  host: "${DB_HOST}"
  port: "${DB_PORT}"
  username: "${DB_USERNAME}"
  password: "${DB_PASSWORD}"
  database: "${DB_NAME}"
  max-idle-connections: 5
  max-open-connections: 50

redis:
  addr: ${REDIS_HOST}
  password: ${REDIS_PASSWORD}
  DB: ${REDIS_DB}

kafka:
  addr: ${KAFKA_URI}
  username: ${KAFKA_USERNAME}
  password: ${KAFKA_PASSWORD}
  mechanism: ${KAFKA_MECHANISM}
  groupId: ${KAFKA_CONSUMER_GROUP}

exploration:
  cacheExpireTime: ${EXPLORE_CACHE_EXPIRE_TIME}
  groupLimit: ${EXPLORE_GROUP_LIMIT}
  reportDefaultOvertime: ${REPORT_DEFAULT_OVER_TIME}
  concurrency_enable: ${concurrency_enable}
  concurrency_limit: ${concurrency_limit}
  retry_count: ${retry_count}
```

Environment Variables:
| Variable | Description | Default |
|----------|-------------|---------|
| DB_HOST | Database host | - |
| DB_PORT | Database port | 3306 |
| DB_USERNAME | Database username | - |
| DB_PASSWORD | Database password | - |
| DB_NAME | Database name | - |
| REDIS_HOST | Redis host | - |
| REDIS_PASSWORD | Redis password | - |
| KAFKA_URI | Kafka broker address | - |
| KAFKA_USERNAME | Kafka username | - |
| KAFKA_PASSWORD | Kafka password | - |
| CONFIGURATION_CENTER_HOST | Configuration center service host | - |
| VIRTUALIZATION_ENGINE_URL | Virtualization engine URL | - |

### Building

Build the service binary:

```bash
# Build binary
make build

# Build for Linux
make build-linux

# Or directly
go build -o bin/app ./cmd
```

### Running

Start the service:

```bash
# Run with Make (builds and starts)
make start-dev

# Or start with existing binary
make start

# Or directly
go run ./cmd server --conf cmd/server/config/ --addr :8281
```

The service will start on the configured port (default: 8281).

### API Endpoints

All endpoints are prefixed with `/api`:

#### Data Exploration
- `POST /exploration` - Execute asynchronous data exploration
- `GET /exploration/{id}` - Get exploration task status
- `GET /exploration/{id}/result` - Get exploration result
- `DELETE /exploration/{id}` - Cancel exploration task

#### Task Configuration
- `GET /task-config` - Get task configuration list
- `POST /task-config` - Create task configuration
- `PUT /task-config/{id}` - Update task configuration
- `DELETE /task-config/{id}` - Delete task configuration

#### Report Management
- `GET /report` - Get report list
- `GET /report/{id}` - Get report details
- `GET /report/{id}/items` - Get report items

### API Documentation

After generating Swagger docs, access the API documentation at:
- Swagger UI: `http://localhost:8281/swagger/index.html`
- JSON: `http://localhost:8281/swagger/doc.json`

## Database Migrations

### MariaDB/MySQL Database
```bash
# Set migration environment variables
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USERNAME=root
export MYSQL_PASSWORD=password
export MYSQL_DB=data_exploration

# Execute migration up
make mu v=1

# Execute migration down
make md v=1
```

### DM8 Database
```bash
# Execute DM8 migration scripts
ls migrations/dm8/0.1.0/pre/
```

## Development

### Code Generation

```bash
# Generate Wire dependency injection
make wire

# Generate Swagger documentation
make swag

# Generate GORM models
make model dsn="mysql://user:pass@tcp(host:port)/db" tables="table1,table2"
```

### Running Tests

```bash
go test ./...
```

### Code Quality

The project follows Go best practices and Clean Architecture principles. Consider using:
- `golangci-lint` for code quality checks
- `go vet` for static analysis
- `go fmt` for code formatting

## Architecture

The service follows a Clean Architecture pattern:

- **Domain Layer**: Business logic and domain models
  - `exploration`: Data exploration domain logic
  - `task_config`: Task configuration domain logic
  - `common`: Common domain utilities

- **Adapter Layer**:
  - **Driver**: HTTP handlers, REST API endpoints (Gin)
  - **Driven**: External service clients (GORM, Kafka, Redis, etc.)

- **Common**: Shared utilities, middleware, and configurations

## Data Exploration Features

The service provides comprehensive data exploration capabilities:
- Asynchronous exploration execution
- Grouped query support
- Integration with virtualization engines
- Result caching and management
- Concurrent exploration support
- Retry mechanism for failed queries
- Timeout handling
- Report generation and storage

## Message Queue Integration

The service integrates with Kafka for:
- Exploration task event publishing
- Virtual query result consumption
- Task status updates
- Event-driven architecture support

## Security Considerations

- Input validation and sanitization
- SQL injection prevention via GORM
- Secure database connections
- OAuth2 authentication via Hydra
- Access control middleware
- Audit logging for all operations

## Contributing

1. Follow the existing code style and patterns
2. Add tests for new features
3. Update API documentation when adding new endpoints
4. Run `make swag` to regenerate Swagger docs
5. Ensure all tests pass before submitting

## License

See the LICENSE file in the repository root.

## Support

For issues and questions, please contact the development team or create an issue in the repository.
