# Data Application Service

**Language / 语言**: [English](README.md) | [中文](README.zh.md)

A comprehensive data application service built with Go that provides API interface management, data service publishing, and data application lifecycle management for the DSG (Data Semantic Governance) system.

## Overview

The Data Application Service is a core microservice that manages data application interfaces, including API creation, publishing, version management, and access control. It enables users to expose data views and data catalogs as RESTful APIs with comprehensive lifecycle management.

## Features

- **API Interface Management**:
  - Create, update, and delete API interfaces
  - API versioning and lifecycle management
  - API metadata and documentation
  - Interface authorization and access control

- **Data Service Publishing**:
  - Publish data views as APIs
  - Publish data catalogs as APIs
  - Configure request/response formats
  - Set up data transformation rules

- **Workflow Integration**:
  - API approval workflows
  - Publishing pipeline management
  - Workflow status tracking
  - Callback mechanism support

- **Integration Services**:
  - Configuration center integration
  - User management integration
  - Authorization service integration
  - Metadata management integration

- **Observability**:
  - OpenTelemetry integration for distributed tracing
  - Structured logging with Zap
  - Audit logging support
  - Health check endpoints

- **CDC (Change Data Capture)**:
  - Real-time data synchronization
  - Scheduled data polling
  - Event-driven updates

## Technology Stack

- **Language**: Go 1.24.0
- **Web Framework**: Gin
- **Database**: MariaDB/MySQL (via GORM)
- **Cache**: Redis
- **Message Queue**: Kafka/NSQ
- **Dependency Injection**: Google Wire
- **API Documentation**: Swagger
- **Observability**: OpenTelemetry
- **Logging**: Zap
- **Configuration**: Viper

## Project Structure

```
data-application-service/
├── adapter/          # Adapter layer (drivers and driven)
│   ├── driver/       # HTTP handlers and REST API (Gin)
│   └── driven/       # External service clients
├── cmd/              # Application entry points
│   └── server/       # Main server application
├── common/           # Shared utilities and middleware
│   ├── constant/     # Constants
│   ├── errorcode/    # Error codes
│   ├── form_validator/ # Form validation
│   └── initialization/ # Initialization logic
├── domain/           # Business logic and domain models
├── infrastructure/   # Infrastructure layer
│   ├── config/       # Configuration
│   └── repository/   # Database repositories
├── migrations/       # Database migration files
│   └── mariadb/      # MariaDB migrations
├── docker/           # Docker configuration
└── helm/             # Kubernetes Helm charts
```

## Prerequisites

- Go 1.24.0 or higher
- MariaDB/MySQL database
- Redis server
- Kafka or NSQ message queue
- Configuration center service
- OAuth2/OIDC provider (Hydra)

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd services/apps/data-application-service
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
- **Server**: HTTP/gRPC server settings (port, timeout, etc.)
- **Database**: MariaDB/MySQL connection settings
- **Redis**: Redis connection settings
- **Kafka/NSQ**: Message queue settings
- **Services**: Microservice endpoints
- **Telemetry**: OpenTelemetry configuration
- **Workflow**: Workflow integration settings
- **Callback**: Callback mechanism configuration

Example configuration structure:
```yaml
server:
  http:
    addr: 0.0.0.0:8156
  grpc:
    addr: 0.0.0.0:9000

database:
  dbtype: mysql
  host: localhost
  port: 3306
  username: dsg
  password: dsg123
  database: dsg

redis:
  host: localhost:6379
  password: ""

services:
  configuration_center: "configuration-center:8133"
  data_catalog: "data-catalog:8153"
  data_view: "data-view:8123"
```

### Building

Build the service binary:

```bash
# Build for current platform
make build

# Build for Linux
make build-linux
```

The binary will be generated in the `bin/` directory as `data-application-service-server`.

### Running

Start the service:

```bash
# Run directly
./bin/data-application-service-server --confPath cmd/server/config/

# Or with Go
go run cmd/server/main.go --confPath cmd/server/config/

# Or use Make
make run
```

The service will start on port 8156 by default.

### Database Migrations

The service uses [golang-migrate](https://github.com/golang-migrate/migrate) for database migrations.

```bash
# Create new migration files
make mc name=add_column

# Apply migrations
make mu

# Apply specific version
make mu v=3

# Rollback migrations
make md v=3

# Force version
make mf v=3
```

Required environment variables for migrations:
| Variable | Description | Example |
|----------|-------------|---------|
| MYSQL_HOST | Database host | 127.0.0.1 |
| MYSQL_PORT | Database port | 3306 |
| MYSQL_USERNAME | Database user | root |
| MYSQL_PASSWORD | Database password | 123 |
| MYSQL_DB | Database name | dsg |

### API Endpoints

All endpoints are prefixed with `/api/data-application-service/v1`:

#### Service Management
- `POST /services` - Create a new data service
- `GET /services` - List all data services
- `GET /services/:id` - Get service details
- `PUT /services/:id` - Update service
- `DELETE /services/:id` - Delete service

#### Publishing
- `POST /services/:id/publish` - Publish a service
- `POST /services/:id/unpublish` - Unpublish a service
- `GET /services/:id/versions` - Get service versions

#### Execution
- `POST /execute/:service_id` - Execute a data service

### API Documentation

After generating Swagger docs, access the API documentation at:
- Swagger UI: `http://localhost:8156/swagger/index.html`
- JSON: `http://localhost:8156/swagger/doc.json`

## Development

### Code Generation

```bash
# Generate Wire dependency injection
make wire

# Generate Swagger documentation
make swag
```

### Running Tests

```bash
go test ./...
```

### Docker

Build and run with Docker:

```bash
# Build Docker image
docker build -f docker/Dockerfile -t data-application-service .

# Run container
docker run -p 8156:8156 data-application-service
```

## Architecture

The service follows a clean architecture pattern:

- **Domain Layer**: Business logic and domain models
  - Service management
  - API lifecycle management
  - Publishing workflows

- **Adapter Layer**:
  - **Driver**: HTTP handlers, REST API endpoints (Gin)
  - **Driven**: External service clients (Configuration Center, Data Catalog, etc.)

- **Infrastructure Layer**: Database repositories, external integrations

## Security Considerations

- OAuth2/OIDC authentication via Hydra
- Role-based access control
- API authorization policies
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
