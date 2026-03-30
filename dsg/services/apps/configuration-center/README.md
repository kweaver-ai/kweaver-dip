# Configuration Center Service

**Language / 语言**: [English](README.md) | [中文](README.zh.md)

A comprehensive configuration management service built with Go that provides system configuration, user management, role and permission management, menu management, dictionary management, data source management, and workflow orchestration capabilities with multi-tenant support.

## Overview

The Configuration Center Service is a microservice that handles system-wide configuration management, user and role management, permission control, menu configuration, dictionary management, data source configuration, workflow configuration, and provides RESTful APIs for configuration operations, user management, role and permission management, and system administration.

## Features

- **System Configuration Management**:
  - Configuration key-value management
  - Third-party service address configuration
  - Project provider configuration
  - Business domain level configuration
  - Data usage type configuration
  - Timestamp blacklist management
  - Government data sharing configuration

- **User Management**:
  - User creation, management, and tracking
  - User profile management
  - User role assignment
  - User permission management
  - User group management
  - User authentication and authorization

- **Role & Permission Management**:
  - Role creation and management
  - Role group management
  - Permission definition and assignment
  - Role-permission binding
  - User-role binding
  - Scope-based access control
  - Role icon management

- **Menu Management**:
  - Menu structure configuration
  - Menu API binding
  - Menu permission control
  - Dynamic menu generation

- **Dictionary Management**:
  - Dictionary definition and management
  - Dictionary item management
  - Dictionary validation
  - Multi-level dictionary support

- **Data Source Management**:
  - Data source registration and configuration
  - Data source connection management
  - Data source type support
  - Connection pool management

- **Workflow Configuration**:
  - Flowchart configuration and management
  - Flowchart node configuration
  - Flowchart version management
  - Workflow orchestration

- **Code Generation Rules**:
  - Code generation rule definition
  - Rule template management
  - Code sequence generation
  - Custom code format support

- **Business Structure Management**:
  - Business structure definition
  - Business matters management
  - Object main business configuration
  - Business domain configuration

- **Information System Management**:
  - Information system registration
  - System configuration management
  - System integration support

- **Data Management**:
  - Data grade classification
  - Data masking configuration
  - Data security policies

- **Audit & Compliance**:
  - Audit policy management
  - Audit process binding
  - Audit workflow configuration

- **Application Management**:
  - Application registration and management
  - Application configuration
  - Application lifecycle management

- **Frontend Configuration**:
  - Frontend processor configuration
  - Carousel management
  - News policy management
  - SMS configuration

- **Address Book**:
  - Contact management
  - Organization structure
  - User directory

- **Alarm Management**:
  - Alarm rule configuration
  - Alarm policy management
  - Notification settings

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
- **Protocol Buffers**: gRPC support

## Project Structure

```
configuration-center/
├── adapter/              # Adapter layer (drivers and driven)
│   ├── driver/          # HTTP handlers and REST API (Gin)
│   │   ├── user/        # User management endpoints
│   │   ├── role/        # Role management endpoints
│   │   ├── permission/  # Permission management endpoints
│   │   ├── menu/        # Menu management endpoints
│   │   ├── dict/        # Dictionary management endpoints
│   │   ├── datasource/  # Data source management endpoints
│   │   ├── configuration/ # Configuration management endpoints
│   │   ├── flowchart/   # Workflow configuration endpoints
│   │   ├── code_generation_rule/ # Code generation rule endpoints
│   │   ├── business_structure/ # Business structure endpoints
│   │   ├── info_system/ # Information system endpoints
│   │   ├── data_grade/  # Data grade endpoints
│   │   ├── data_masking/ # Data masking endpoints
│   │   ├── apps/        # Application management endpoints
│   │   ├── firm/        # Firm/Organization management endpoints
│   │   ├── front_end_processor/ # Frontend processor endpoints
│   │   ├── carousels/   # Carousel management endpoints
│   │   ├── news_policy/ # News policy endpoints
│   │   ├── audit_policy/ # Audit policy endpoints
│   │   ├── address_book/ # Address book endpoints
│   │   ├── alarm_rule/  # Alarm rule endpoints
│   │   └── middleware/ # HTTP middleware
│   └── driven/          # External service clients and storage
│       ├── gorm/        # Database implementation
│       ├── mq/          # Message queue handlers
│       ├── rest/         # REST client implementations
│       ├── thrift/       # Thrift client implementations
│       ├── workflow/    # Workflow integration
│       └── callbacks/   # Callback handlers
├── cmd/                  # Application entry points
│   └── server/          # Main server application
│       ├── config/      # Configuration files
│       ├── docs/        # Swagger documentation
│       ├── static/      # Static files
│       ├── app.go       # Application initialization
│       ├── cdc.go       # Change data capture
│       └── main.go      # Main entry point
├── common/               # Shared utilities and middleware
│   ├── constant/        # Constants
│   ├── errorcode/       # Error codes
│   ├── form_validator/  # Form validation
│   ├── models/          # Common models
│   ├── settings/        # Configuration settings
│   ├── trace_util/      # Tracing utilities
│   ├── user_util/       # User utilities
│   └── util/            # Utility functions
├── domain/              # Business logic and domain models
│   ├── user/            # User domain
│   ├── role/            # Role domain
│   ├── role_v2/         # Role v2 domain
│   ├── role_group/      # Role group domain
│   ├── permission/      # Permission domain
│   ├── permissions/     # Permissions domain
│   ├── menu/            # Menu domain
│   ├── menu_api/        # Menu API domain
│   ├── dict/            # Dictionary domain
│   ├── datasource/      # Data source domain
│   ├── configuration/   # Configuration domain
│   ├── flowchart/       # Flowchart domain
│   ├── code_generation_rule/ # Code generation rule domain
│   ├── business_structure/ # Business structure domain
│   ├── business_matters/ # Business matters domain
│   ├── info_system/     # Information system domain
│   ├── data_grade/      # Data grade domain
│   ├── data_masking/    # Data masking domain
│   ├── apps/            # Application domain
│   ├── firm/            # Firm domain
│   ├── front_end_processor/ # Frontend processor domain
│   ├── carousels/       # Carousel domain
│   ├── news_policy/     # News policy domain
│   ├── audit_policy/    # Audit policy domain
│   ├── audit_process_bind/ # Audit process bind domain
│   ├── address_book/    # Address book domain
│   ├── object_main_business/ # Object main business domain
│   ├── alarm_rule/      # Alarm rule domain
│   ├── register/        # Registration domain
│   ├── sms_conf/        # SMS configuration domain
│   ├── tool/            # Tool domain
│   └── common/          # Common domain utilities
├── infrastructure/      # Infrastructure layer
│   ├── conf/            # Configuration definitions
│   ├── repository/      # Repository implementations
│   └── mq/              # Message queue implementations
├── interface/           # Interface definitions
│   └── conf/            # Configuration interfaces
└── migrations/          # Database migrations
    ├── dm8/             # DM8 database migrations
    └── mariadb/         # MariaDB/MySQL migrations
```

## Prerequisites

- Go 1.24+ or higher
- MySQL server (for data storage)
- Redis (for caching)
- Kafka or NSQ (for message queue)
- OAuth2 server (Hydra) for authentication

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd services/apps/configuration-center
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

# Generate Protocol Buffers code
make protoc
```

### Configuration

The service uses Viper for configuration management. Configuration files should be placed in `cmd/server/config/` directory.

Key configuration sections:
- **Server**: HTTP and gRPC server settings (port, timeout, etc.)
- **Database**: MySQL connection settings
- **Redis**: Cache settings
- **Message Queue**: Kafka/NSQ settings
- **Telemetry**: OpenTelemetry configuration
- **Logging**: Log level and output settings
- **OAuth**: OAuth2 client configuration
- **DepServices**: External service endpoints

Example configuration structure:
```yaml
server:
  http:
    addr: 0.0.0.0:8133
    timeout: 1s
  grpc:
    addr: 0.0.0.0:9000
    timeout: 1s

data:
  database:
    driver: mysql
    source: "${DB_USERNAME}:${DB_PASSWORD}@tcp(${DB_HOST}:${DB_PORT})/${DB_NAME}?charset=utf8mb4&parseTime=True&loc=Local"
  redis:
    addr: "${REDIS_HOST}"
    password: "${REDIS_PASSWORD}"

config:
  oauth:
    oauthClientID: "${OAUTH_CLIENT_ID}"
    oauthClientSecret: "${OAUTH_CLIENT_SECRET}"
    oauthAdminHost: hydra-admin
    oauthAdminPort: 4445
  kafkaMQ:
    host: "${KAFKA_MQ_HOST}"
    clientID: "af.configuration-center"
    groupID: "af.configuration-center"
    sasl:
      enabled: true
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
| OAUTH_CLIENT_ID | OAuth2 client ID | - |
| OAUTH_CLIENT_SECRET | OAuth2 client secret | - |

### Building

Build the service binary:

```bash
# Build for current platform
make build

# Build for Linux
make build-linux

# Or directly
go build -o bin/cc ./cmd/server
```

The binary will be generated in the `bin/` directory as `cc`.

### Running

Start the service:

```bash
# Run with Make (builds and starts)
make start-dev

# Or start with existing binary
make start

# Or directly
go run ./cmd/server/main.go --confPath cmd/server/config/ --addr :8133
```

The service will start on the configured port (default: 8133).

### API Endpoints

The service provides RESTful APIs for various functionalities. Key endpoint categories include:

#### Configuration Management
- Configuration key-value operations
- Third-party service address configuration
- Project provider configuration
- Business domain level management
- Data usage type configuration

#### User Management
- User CRUD operations
- User profile management
- User role assignment
- User permission management

#### Role & Permission Management
- Role CRUD operations
- Role group management
- Permission definition and assignment
- Role-permission binding
- User-role binding

#### Menu Management
- Menu structure configuration
- Menu API binding
- Menu permission control

#### Dictionary Management
- Dictionary CRUD operations
- Dictionary item management
- Dictionary validation

#### Data Source Management
- Data source registration and configuration
- Data source connection management
- Connection pool management

#### Workflow Configuration
- Flowchart configuration and management
- Flowchart node configuration
- Flowchart version management

#### Code Generation Rules
- Code generation rule definition
- Rule template management
- Code sequence generation

### API Documentation

After generating Swagger docs, access the API documentation at:
- Swagger UI: `http://localhost:8133/swagger/index.html`
- JSON: `http://localhost:8133/swagger/doc.json`

## Development

### Code Generation

```bash
# Generate Wire dependency injection
make wire

# Generate Swagger documentation
make swag

# Generate Protocol Buffers code
make protoc

# Generate GORM models
make model dsn="mysql://user:pass@tcp(host:port)/db" out_dao=true
```

### Database Migration

```bash
# Set migration environment variables
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USERNAME=root
export MYSQL_PASSWORD=password
export MYSQL_DB=configuration_center

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
  - User management, role and permission management
  - Configuration management, menu management
  - Dictionary management, data source management
  - Workflow configuration, code generation rules

- **Adapter Layer**:
  - **Driver**: HTTP handlers, REST API endpoints (Gin)
  - **Driven**: Database implementation, external service clients

- **Common**: Shared utilities, middleware, and configurations

## Configuration Management Features

The service provides comprehensive configuration management capabilities:
- Key-value configuration storage
- Third-party service address management
- Project provider configuration
- Business domain level configuration
- Data usage type configuration
- Timestamp blacklist management
- Government data sharing configuration

## User & Role Management

The service provides comprehensive user and role management:
- Multi-tenant user management
- Role-based access control (RBAC)
- Permission definition and assignment
- Role group management
- Scope-based access control
- User-role binding management

## Message Queue Integration

The service integrates with Kafka and NSQ for:
- Asynchronous configuration updates
- Event-driven architecture
- Configuration change notifications
- Reliable message delivery

## Change Data Capture (CDC)

The service supports Change Data Capture for:
- Real-time database change tracking
- Event streaming
- Data synchronization

## Security Considerations

- OAuth2 authentication via Hydra
- Role-based access control (RBAC)
- Permission-based authorization
- Input validation and sanitization
- SQL injection prevention via GORM
- Secure database connections
- Audit logging for all operations

## Monitoring & Observability

- OpenTelemetry for distributed tracing
- Structured logging with correlation IDs
- Performance metrics collection
- Health check endpoints
- Audit tracking for critical operations
- Change data capture monitoring

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
