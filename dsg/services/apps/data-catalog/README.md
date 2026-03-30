# Data Catalog Service

**Language / 语言**: [English](README.md) | [中文](README.zh.md)

A comprehensive data catalog management service built with Go that provides data resource cataloging, information system management, data push capabilities, data comprehension, and workflow orchestration with multi-tenant support.

## Overview

The Data Catalog Service is a microservice that handles data resource catalog management, information catalog management, data push workflows, data comprehension processing, assessment management, and provides RESTful APIs for catalog operations, resource management, data push processing, and workflow orchestration.

## Features

- **Data Resource Catalog Management**:
  - Data catalog creation, management, and tracking
  - Data resource registration and organization
  - Catalog column management and metadata
  - Catalog mount resource management
  - Catalog code sequence generation
  - Catalog audit flow binding

- **Information Catalog & System Management**:
  - Information catalog creation and management
  - Information system registration and tracking
  - System operation management
  - Information resource organization

- **Data Push & Workflow**:
  - Data push request management
  - Push workflow orchestration
  - Push statistics and monitoring
  - Audit process management
  - Workflow integration

- **Data Comprehension**:
  - Data comprehension template management
  - Comprehension processing and analysis
  - Template rule configuration

- **Assessment & Scoring**:
  - Data catalog assessment management
  - Catalog score calculation and tracking
  - Assessment workflow support
  - Automated assessment scheduling

- **Category & Tree Management**:
  - Category tree structure management
  - Tree node operations
  - Category configuration
  - Apply scope configuration
  - Module configuration

- **Data Assets Management**:
  - Data assets overview and statistics
  - Asset count and tracking
  - Frontend data assets interface

- **File Resource Management**:
  - File resource registration
  - File metadata management
  - Resource organization

- **Open Catalog**:
  - Open catalog management
  - Public catalog access
  - Catalog sharing capabilities

- **Cognitive Service Integration**:
  - Cognitive service system integration
  - Single catalog processing
  - AI-powered catalog enhancement

- **Statistics & Analytics**:
  - Daily statistics collection
  - Table count synchronization
  - Catalog statistics overview
  - User catalog statistics

- **Feedback & Communication**:
  - Catalog feedback management
  - Resource feedback system
  - User interaction tracking

- **My Favorites**:
  - User favorite catalog management
  - Personal catalog collection

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

- **Language**: Go 1.24+
- **Web Framework**: Gin
- **ORM**: GORM with MySQL driver
- **Message Queue**: Kafka, NSQ
- **Cache**: Redis
- **Dependency Injection**: Google Wire
- **API Documentation**: Swagger
- **Observability**: OpenTelemetry
- **Logging**: Zap
- **Configuration**: Viper
- **Database**: MySQL with migration support
- **Search**: OpenSearch integration via Basic Search service

## Project Structure

```
data-catalog/
├── adapter/              # Adapter layer (drivers and driven)
│   ├── controller/     # HTTP handlers and REST API (Gin)
│   │   ├── data_catalog/ # Data catalog endpoints
│   │   ├── data_resource/ # Data resource endpoints
│   │   ├── info_catalog/ # Information catalog endpoints
│   │   ├── info_system/ # Information system endpoints
│   │   ├── data_push/   # Data push endpoints
│   │   ├── data_comprehension/ # Data comprehension endpoints
│   │   ├── assessment/  # Assessment endpoints
│   │   ├── audit_process/ # Audit process endpoints
│   │   ├── category/    # Category management
│   │   ├── tree/        # Tree structure management
│   │   ├── tree_node/   # Tree node operations
│   │   ├── statistics/  # Statistics endpoints
│   │   ├── my_favorite/ # User favorites
│   │   ├── open_catalog/ # Open catalog
│   │   └── middleware/  # HTTP middleware
│   ├── driver/          # Driver adapters
│   │   ├── http_client/ # HTTP client utilities
│   │   └── mq/          # Message queue handlers
│   └── driven/          # External service clients and storage
│       ├── gorm/        # Database implementation
│       ├── basic_search/ # Basic search integration
│       ├── configuration_center/ # Configuration service
│       ├── auth/        # Authentication service
│       ├── auth_service/ # Auth service client
│       ├── cognitive_assistant/ # Cognitive service
│       └── workflow/    # Workflow integration
├── cmd/                  # Application entry points
│   └── server/          # Main server application
│       ├── config/      # Configuration files
│       ├── docs/        # Swagger documentation
│       └── cmd.go       # Command definitions
├── common/               # Shared utilities and middleware
│   ├── constant/        # Constants
│   ├── errorcode/       # Error codes
│   ├── form_validator/  # Form validation
│   ├── models/          # Common models
│   ├── settings/        # Configuration settings
│   └── util/            # Utility functions
├── domain/              # Business logic and domain models
│   ├── data_catalog/    # Data catalog domain
│   ├── data_resource_catalog/ # Data resource catalog domain
│   ├── info_catalog/    # Information catalog domain
│   ├── info_resource_catalog/ # Information resource catalog
│   ├── data_push/       # Data push domain
│   ├── data_comprehension/ # Data comprehension domain
│   ├── assessment/      # Assessment domain
│   ├── audit_process/   # Audit process domain
│   ├── category/        # Category domain
│   ├── tree/            # Tree domain
│   ├── tree_node/       # Tree node domain
│   ├── statistics/      # Statistics domain
│   ├── my_favorite/     # My favorite domain
│   ├── open_catalog/    # Open catalog domain
│   ├── frontend/        # Frontend domain logic
│   └── common/          # Common domain utilities
├── infrastructure/      # Infrastructure layer
│   ├── repository/      # Repository implementations
│   │   └── db/          # Database models and migrations
│   └── mq/              # Message queue implementations
└── migrations/          # Database migrations
    ├── dm8/             # DM8 database migrations
    └── mariadb/         # MariaDB/MySQL migrations
```

## Prerequisites

- Go 1.24+ or higher
- MySQL server (for data storage)
- Redis (for caching)
- Kafka or NSQ (for message queue)
- OpenSearch (via Basic Search service)
- Configuration management service

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd services/apps/data-catalog
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
- **Redis**: Cache settings
- **Message Queue**: Kafka/NSQ settings
- **Telemetry**: OpenTelemetry configuration
- **Logging**: Log level and output settings
- **DepServices**: External service endpoints

Example configuration structure:
```yaml
server:
  http:
    host: 0.0.0.0:8153

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
  host: "${REDIS_HOST}"
  password: "${REDIS_PASSWORD}"
  database: ${REDIS_DB}

mq:
  connConfs:
    - mqType: kafka
      host: "${KAFKA_MQ_HOST}"
      auth:
        username: "${KAFKA_MQ_USENAME}"
        password: "${KAFKA_MQ_PASSWORD}"
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
| KAFKA_MQ_HOST | Kafka broker address | - |
| KAFKA_MQ_USENAME | Kafka username | - |
| KAFKA_MQ_PASSWORD | Kafka password | - |
| CONFIGURATION_CENTER_HOST | Configuration center service host | - |
| BASIC_SEARCH_HOST | Basic search service host | - |

### Building

Build the service binary:

```bash
# Build for current platform
make build

# Build for Linux
make build-linux

# Or directly
go build -o bin/data-catalog-server ./cmd/server
```

The binary will be generated in the `bin/` directory as `data-catalog-server`.

### Running

Start the service:

```bash
# Run with Make (builds and starts)
make start-dev

# Or start with existing binary
make start

# Or directly
go run ./cmd/server server --conf cmd/server/config/config.yaml --addr :8153
```

The service will start on the configured port (default: 8153).

### API Endpoints

The service provides RESTful APIs for various functionalities. Key endpoint categories include:

#### Data Catalog Management
- Data catalog CRUD operations
- Catalog column management
- Catalog mount resource operations
- Catalog audit flow management
- Catalog code sequence generation

#### Data Resource Management
- Data resource registration and management
- Resource catalog operations
- Resource metadata management

#### Information Catalog & System
- Information catalog operations
- Information system management
- System operation tracking

#### Data Push
- Data push request management
- Push workflow orchestration
- Push statistics and monitoring

#### Data Comprehension
- Comprehension template management
- Template rule configuration
- Comprehension processing

#### Assessment & Scoring
- Assessment management
- Catalog score calculation
- Automated assessment scheduling

#### Category & Tree
- Category tree management
- Tree node operations
- Category configuration

#### Statistics
- Daily statistics collection
- Table count synchronization
- Catalog statistics overview

### API Documentation

After generating Swagger docs, access the API documentation at:
- Swagger UI: `http://localhost:8153/swagger/index.html`
- JSON: `http://localhost:8153/swagger/doc.json`

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

### Database Migration

```bash
# Set migration environment variables
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USERNAME=root
export MYSQL_PASSWORD=password
export MYSQL_DB=data_catalog

# Create migration file
make mc name=create_table

# Execute migration up
make mu v=1

# Execute migration down
make md v=1

# Force migration version
make mf v=3
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
  - Data catalog management, resource organization
  - Information catalog and system management
  - Data push workflow orchestration
  - Assessment and scoring logic
  - Category and tree management

- **Adapter Layer**:
  - **Controller**: HTTP handlers, REST API endpoints (Gin)
  - **Driven**: Database implementation, external service clients

- **Common**: Shared utilities, middleware, and configurations

## Data Catalog Features

The service provides comprehensive data catalog capabilities:
- Multi-level catalog organization
- Catalog code sequence generation
- Catalog audit workflow integration
- Catalog mount resource management
- Catalog column metadata management
- Catalog statistics and analytics
- Catalog search integration with OpenSearch

## Message Queue Integration

The service integrates with Kafka and NSQ for:
- Asynchronous catalog operations
- Event-driven architecture
- Catalog change notifications
- Workflow event processing
- Reliable message delivery

## Search Integration

The service integrates with Basic Search service (OpenSearch) for:
- Catalog search capabilities
- Full-text search support
- Search result highlighting
- Catalog indexing and updates

## Workflow Integration

The service integrates with workflow systems for:
- Data push workflow orchestration
- Audit process management
- Assessment workflow support
- Automated task scheduling

## Security Considerations

- Input validation and sanitization
- SQL injection prevention via GORM
- Secure database connections
- OAuth2 authentication via Hydra
- Access control middleware
- Audit logging for all operations

## Monitoring & Observability

- OpenTelemetry for distributed tracing
- Structured logging with correlation IDs
- Performance metrics collection
- Health check endpoints
- Audit tracking for critical operations
- Daily statistics collection
- Automated task scheduling

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
