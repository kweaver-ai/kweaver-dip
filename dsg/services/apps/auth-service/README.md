# Auth Service

**Language / 语言**: [English](README.md) | [中文](README.zh.md)

A comprehensive authentication and authorization service built with Go that provides policy management, permission enforcement, indicator dimensional rules, and data warehouse authorization request capabilities with multi-tenant support.

## Overview

The Auth Service is a microservice that handles authentication and authorization operations. It provides policy-based access control (PBAC), permission enforcement, indicator dimensional rule management, and data warehouse authorization request workflows. The service supports multi-tenant applications with role-based access control and provides RESTful APIs for policy management, permission checking, and authorization workflows.

## Features

- **Policy Management**:
  - Policy creation, update, and deletion
  - Policy query and listing
  - Policy expiration management
  - Policy-based access control (PBAC)
  - Subject-object-action policy model
  - Policy validation and enforcement

- **Permission Enforcement**:
  - Permission checking and validation
  - Data permission enforcement
  - Menu resource permission checking
  - Rule-based permission enforcement
  - Resource access control
  - Action-based authorization

- **Indicator Dimensional Rules**:
  - Indicator dimensional rule creation and management
  - Rule specification updates
  - Rule query and listing
  - Batch rule operations
  - Indicator-based rule queries
  - Dimensional rule enforcement

- **Data Warehouse Authorization Requests**:
  - Authorization request creation and management
  - Request workflow processing
  - Audit workflow integration
  - Request status tracking
  - Audit list management
  - Request cancellation

- **Resource Management**:
  - Subject-owned resource queries
  - Sub-view listing with action permissions
  - Menu resource action queries
  - Resource access control
  - Object policy queries

- **User Permission Management**:
  - User create permission checking
  - User modify permission checking
  - Permission binding management
  - Role-based permission assignment

- **Workflow Integration**:
  - Workflow consumer registration
  - Workflow event processing
  - Audit workflow support
  - Resource registration

- **Observability**:
  - OpenTelemetry integration for distributed tracing
  - Structured logging with Zap
  - Request/response tracing middleware
  - Comprehensive audit logging
  - Response logging middleware

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
- **OAuth2**: Hydra integration

## Project Structure

```
auth-service/
├── adapter/              # Adapter layer (drivers and driven)
│   ├── driver/          # HTTP handlers and REST API (Gin)
│   │   ├── v1/          # Version 1 API endpoints
│   │   │   ├── dwh_auth_request_form/ # Data warehouse auth request endpoints
│   │   │   └── indicator_dimensional_rule/ # Indicator dimensional rule endpoints
│   │   ├── v2/          # Version 2 API endpoints
│   │   │   └── auth/    # Auth policy endpoints
│   │   ├── driver.go    # Driver initialization
│   │   ├── httpEngine.go # HTTP engine setup
│   │   └── route.go     # Route definitions
│   └── driven/          # External service clients and storage
│       ├── database/    # Database client implementations
│       │   ├── af_configuration/ # Configuration database client
│       │   └── dynamic/ # Dynamic database client
│       ├── gorm/        # GORM repository implementations
│       ├── hydra/       # OAuth2 Hydra client
│       ├── microservice/ # Microservice clients
│       ├── mq/          # Message queue handlers
│       ├── resources/   # Resource registration
│       └── workflow/   # Workflow integration
├── cmd/                  # Application entry points
│   └── server/          # Main server application
│       ├── config/      # Configuration files
│       ├── docs/        # Swagger documentation
│       ├── main.go      # Main entry point
│       ├── wire.go      # Wire dependency injection
│       └── wire_gen.go  # Generated Wire code
├── common/               # Shared utilities and middleware
│   ├── constant/        # Constants
│   ├── dto/             # Data transfer objects
│   │   ├── auth.go      # Auth DTOs
│   │   ├── completion/  # Completion DTOs
│   │   ├── validation/ # Validation DTOs
│   │   └── ...          # Other DTOs
│   ├── enum/            # Enumerations
│   ├── errorcode/       # Error codes
│   ├── form_validator/  # Form validation
│   ├── settings/        # Configuration settings
│   └── util/            # Utility functions
├── domain/              # Business logic and domain models
│   ├── common_auth/     # Common auth domain
│   │   ├── impl/        # Auth implementation
│   │   └── interface.go  # Auth interfaces
│   ├── dwh_data_auth_request/ # Data warehouse auth request domain
│   ├── indicator_dimensional_rule/ # Indicator dimensional rule domain
│   └── domain.go        # Domain interfaces
├── infrastructure/      # Infrastructure layer
│   ├── mq/              # Message queue implementations
│   │   └── kafka/       # Kafka implementation
│   └── repository/      # Repository implementations
│       ├── db/          # Database repositories
│       └── redis/       # Redis repositories
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
- Configuration center service

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd services/apps/auth-service
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
    addr: 0.0.0.0:8155
  grpc:
    addr: 0.0.0.0:9000

data:
  database:
    driver: mysql
    source: "${DB_USERNAME}:${DB_PASSWORD}@tcp(${DB_HOST}:${DB_PORT})/${DB_NAME}?charset=utf8mb4&parseTime=True&loc=Local"
  redis:
    addr: "${REDIS_HOST}"
    read_timeout: 0.2s
    write_timeout: 0.2s

database:
  dbtype: "${DB_TYPE}"
  host: "${DB_HOST}"
  port: "${DB_PORT}"
  username: "${DB_USERNAME}"
  password: "${DB_PASSWORD}"
  database: "${DB_NAME}"
  max-idle-connections: 5
  max-open-connections: 50

mq:
  kafka:
    Type: kafka
    Host: "${KAFKA_HOST}"
    username: "${KAFKA_USERNAME}"
    password: "${KAFKA_PASSWORD}"
    mechanism: "${KAFKA_MECHANISM}"

telemetry:
  logLevel: "${LOG_LEVEL}"
  traceUrl: "${TRACE_URL}"
  logUrl: "${LOG_URL}"
  serverName: "auth-service"
  serverVersion: "1.0.0"
  traceEnabled: "${TRACE_ENABLED}"
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
| KAFKA_HOST | Kafka broker address | - |
| KAFKA_USERNAME | Kafka username | - |
| KAFKA_PASSWORD | Kafka password | - |
| KAFKA_MECHANISM | Kafka SASL mechanism | PLAIN |
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
go build -o bin/auth-service-server ./cmd/server
```

The binary will be generated in the `bin/` directory as `auth-service-server`.

### Running

Start the service:

```bash
# Run directly
./bin/auth-service-server --confPath cmd/server/config/ --addr :8155

# Or with Go
go run ./cmd/server/main.go --confPath cmd/server/config/ --addr :8155
```

The service will start on the configured port (default: 8155).

### API Endpoints

The service provides RESTful APIs for various functionalities. Key endpoint categories include:

#### Policy Management
- `POST /api/auth-service/v1/policy` - Create policy
- `GET /api/auth-service/v1/policy` - Get policy details
- `PUT /api/auth-service/v1/policy` - Update policy
- `DELETE /api/auth-service/v1/policy` - Delete policy

#### Permission Enforcement
- `POST /api/auth-service/v1/enforce` - Enforce policy validation
- `POST /api/internal/auth-service/v1/enforce` - Internal data permission validation
- `POST /api/internal/auth-service/v1/rule/enforce` - Data policy validation
- `POST /api/internal/auth-service/v1/menu-resource/enforce` - Menu resource permission validation

#### Resource Queries
- `GET /api/auth-service/v1/subject/objects` - Get objects owned by subject
- `GET /api/auth-service/v1/sub-views` - List sub-views with action permissions
- `GET /api/auth-service/v1/menu-resource/actions` - Query allowed actions for menu resources
- `GET /api/internal/auth-service/v1/objects/policy/expired` - Query expired policy objects

#### Indicator Dimensional Rules
- `POST /api/auth-service/v1/indicator-dimensional-rules` - Create indicator dimensional rule
- `DELETE /api/auth-service/v1/indicator-dimensional-rules/:id` - Delete rule
- `PUT /api/auth-service/v1/indicator-dimensional-rules/:id/spec` - Update rule spec
- `GET /api/auth-service/v1/indicator-dimensional-rules/:id` - Get rule details
- `GET /api/auth-service/v1/indicator-dimensional-rules` - List rules
- `GET /api/internal/auth-service/v1/indicator-dimensional-rules/indicators` - Batch get rules by indicator IDs
- `GET /api/internal/auth-service/v1/indicator-dimensional-rules/batch` - Get rules by indicator

#### Data Warehouse Authorization Requests
- `POST /api/auth-service/v1/dwh-data-auth-request` - Create authorization request
- `PUT /api/auth-service/v1/dwh-data-auth-request/:id` - Update request
- `GET /api/auth-service/v1/dwh-data-auth-request/:id` - Get request details
- `DELETE /api/auth-service/v1/dwh-data-auth-request/:id` - Delete request
- `GET /api/auth-service/v1/dwh-data-auth-request` - List requests
- `PUT /api/auth-service/v1/dwh-data-auth-request/audit/:id` - Cancel audit
- `GET /api/auth-service/v1/dwh-data-auth-request/audit` - Get audit list
- `GET /api/internal/auth-service/v1/dwh-data-auth-request` - Query applicant request status

### API Documentation

After generating Swagger docs, access the API documentation at:
- Swagger UI: `http://localhost:8155/swagger/index.html`
- JSON: `http://localhost:8155/swagger/doc.json`

## Development

### Code Generation

```bash
# Generate Wire dependency injection
make wire

# Generate Swagger documentation
make swag

# Generate GORM models
make model dsn="mysql://user:pass@tcp(host:port)/db"
```

### Database Migration

```bash
# Set migration environment variables
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USERNAME=root
export MYSQL_PASSWORD=password
export MYSQL_DB=auth_service

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
  - Policy management and enforcement
  - Permission checking and validation
  - Indicator dimensional rule management
  - Data warehouse authorization request workflows

- **Adapter Layer**:
  - **Driver**: HTTP handlers, REST API endpoints (Gin)
  - **Driven**: Database implementation, external service clients

- **Common**: Shared utilities, middleware, and configurations

## Policy-Based Access Control (PBAC)

The service implements a policy-based access control model:
- **Subject**: User, role, or group requesting access
- **Object**: Resource or data being accessed
- **Action**: Operation being performed (read, write, delete, etc.)
- **Policy**: Rules defining access permissions

Policies support:
- Multiple subjects and objects
- Action-based permissions
- Policy expiration
- Policy inheritance
- Rule-based enforcement

## Permission Enforcement

The service provides multiple enforcement mechanisms:
- **Policy Enforcement**: Standard policy-based permission checking
- **Rule Enforcement**: Rule-based permission validation
- **Menu Resource Enforcement**: Menu and resource-level permission checking
- **Data Permission Enforcement**: Data-level access control

## Indicator Dimensional Rules

The service manages indicator dimensional rules for:
- Indicator access control
- Dimensional filtering
- Rule specification management
- Batch rule operations
- Rule-based authorization

## Data Warehouse Authorization Requests

The service handles data warehouse authorization workflows:
- Request creation and management
- Workflow integration
- Audit process support
- Request status tracking
- Audit list management

## Message Queue Integration

The service integrates with Kafka and NSQ for:
- Asynchronous policy updates
- Event-driven authorization workflows
- Workflow event processing
- Reliable message delivery

## Workflow Integration

The service integrates with workflow systems for:
- Authorization request workflows
- Audit process management
- Resource registration
- Workflow consumer registration

## Security Considerations

- OAuth2 authentication via Hydra
- Policy-based access control (PBAC)
- Permission-based authorization
- Input validation and sanitization
- SQL injection prevention via GORM
- Secure database connections
- Audit logging for all operations
- Token-based authentication

## Monitoring & Observability

- OpenTelemetry for distributed tracing
- Structured logging with correlation IDs
- Performance metrics collection
- Health check endpoints
- Audit tracking for critical operations
- Response logging middleware

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
