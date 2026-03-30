# Subject Domain Service

**Language / 语言**: [English](README.md) | [中文](README.zh.md)

A comprehensive business object management service built with Go that provides CRUD operations for business objects (Subject Domains), form-subject relations management, and Excel data import/export capabilities using Clean Architecture principles.

## Overview

The Subject Domain Service is a microservice that handles business object management, form-subject associations, and data processing operations. It supports Excel-based data import/export, Change Data Capture (CDC), template processing, and provides RESTful APIs for creating, updating, and deleting business objects and their relationships.

## Features

- **Business Object Management**:
  - Create, read, update, and delete business object definitions
  - Name uniqueness validation
  - Business logic validation

- **Form-Subject Relations**:
  - Manage associations between forms and business objects
  - Attribute mapping and field linking
  - Relationship validation

- **Excel Data Processing**:
  - Excel data import/export
  - Template-based processing
  - Rule-based data validation
  - Standard template support

- **Change Data Capture (CDC)**:
  - Real-time data change tracking
  - Kafka-based event streaming
  - Database change notifications

- **Data Standardization**:
  - Standard information management
  - Data classification and categorization
  - Attribute grouping and organization

- **Observability**:
  - OpenTelemetry integration for distributed tracing
  - Structured logging
  - Request/response tracking middleware
  - Audit logging support

- **API Documentation**:
  - Swagger/OpenAPI documentation
  - Auto-generated API docs

## Technology Stack

- **Language**: Go 1.19+
- **Web Framework**: Gin
- **Database**: MySQL/MariaDB, DM8
- **ORM**: GORM
- **Message Queue**: Kafka
- **Dependency Injection**: Google Wire
- **API Documentation**: Swagger
- **Observability**: OpenTelemetry
- **Architecture**: Clean Architecture

## Project Structure

```
data-subject/
├── adapter/                    # Adapter layer
│   ├── driver/                # HTTP handlers and REST API (Gin)
│   │   ├── middleware/        # Middleware
│   │   ├── route.go          # Route configuration
│   │   ├── server.go         # Server entry
│   │   └── subject_domain/   # Business object API
│   └── driven/               # External service clients
│       ├── business-grooming/ # Business grooming service
│       ├── callbacks/        # Callback handlers
│       ├── gorm/            # Database access (GORM)
│       └── mq/              # Message queue (Kafka)
├── cmd/                      # Application entry points
│   └── server/              # Main server application
│       ├── config/          # Configuration files
│       ├── mock/            # Mock implementations
│       └── main.go          # Main entry point
├── common/                   # Shared utilities and middleware
│   ├── constant/           # Constants
│   ├── errorcode/          # Error codes
│   ├── form_validator/      # Form validation
│   ├── initialization/     # Initialization logic
│   └── util/               # Utilities
├── domain/                  # Business logic and domain models
│   ├── excel_process/      # Excel processing
│   ├── file_manager/       # File management
│   ├── model/             # Domain models
│   └── subject_domain/    # Business object domain
├── infrastructure/         # Infrastructure layer
│   ├── config/            # Configuration management
│   └── db/                # Database models
└── migrations/            # Database migrations
    ├── dm8/                # DM8 database migrations
    └── mariadb/            # MariaDB/MySQL migrations
```

## Prerequisites

- Go 1.19 or higher
- MySQL 5.7+ or MariaDB 10.3+ or DM8 database
- Kafka (optional, for message queue)
- Make build tool

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd services/apps/data-subject
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

The service uses Viper for configuration management. Configuration files should be placed in `cmd/server/config/` directory.

Key configuration sections:
- **Server**: HTTP server settings (port, timeout, etc.)
- **Database**: Database connection settings
- **Telemetry**: OpenTelemetry configuration
- **Logging**: Log level and output settings
- **DepServices**: External service endpoints

Example configuration structure:
```yaml
server:
  name: "data-subject"
  http:
    network: "tcp"
    addr: ":8133"
    timeout: "30s"
  grpc:
    network: "tcp"
    addr: ":8134"
    timeout: "30s"

database:
  dbtype: "mysql"
  host: "${MYSQL_HOST}"
  port: "${MYSQL_PORT}"
  username: "${MYSQL_USERNAME}"
  password: "${MYSQL_PASSWORD}"
  database: "${MYSQL_DB}"
  maxIdleConnections: 10
  maxOpenConnections: 100
```

Environment Variables:
| Variable | Description | Default |
|----------|-------------|---------|
| MYSQL_HOST | Database host | 127.0.0.1 |
| MYSQL_PORT | Database port | 3306 |
| MYSQL_USERNAME | Database username | root |
| MYSQL_PASSWORD | Database password | 123 |
| MYSQL_DB | Database name | af_subject |

### Building

Build the service binary:

```bash
# Build with Wire
go generate ./...

# Build binary
go build -o bin/data-subject ./cmd/server

# Build for Linux
GOOS=linux GOARCH=amd64 go build -o bin/data-subject-linux ./cmd/server
```

### Running

Start the service:

```bash
# Run with Make
make run

# Or directly
go run ./cmd/server/main.go --confPath cmd/server/config/

# With specific address
go run ./cmd/server/main.go --addr :8133
```

The service will start on the configured port (default: 8133).

### API Endpoints

All endpoints are prefixed with `/api/data-subject/v1`:

#### Business Object Management
- `GET /subject-domains` - Get list of business objects
- `POST /subject-domains` - Create a new business object
- `PUT /subject-domains` - Update an existing business object
- `DELETE /subject-domains/{did}` - Delete a business object
- `POST /subject-domains/check` - Check business object name uniqueness

#### Form-Subject Relations
- `GET /form-subject-relations` - Get form-subject relations
- `POST /form-subject-relations` - Create form-subject relation
- `PUT /form-subject-relations` - Update form-subject relation
- `DELETE /form-subject-relations/{id}` - Delete form-subject relation

#### Import/Export
- `POST /import` - Import data from Excel
- `GET /export` - Export data to Excel

#### Standard Information
- `GET /standard-info` - Get standard information
- `POST /standard-info` - Create standard information
- `PUT /standard-info` - Update standard information

### API Documentation

After generating Swagger docs, access the API documentation at:
- Swagger UI: `http://localhost:<port>/swagger/index.html`
- JSON: `http://localhost:<port>/swagger/doc.json`

## Database Migrations

### DM8 Database
```bash
# Execute DM8 migration scripts
ls migrations/dm8/0.1.0/pre/
```

### MariaDB/MySQL Database
```bash
# Execute MariaDB migration scripts
ls migrations/mariadb/0.1.0/pre/
```

## Development

### Code Generation

```bash
# Generate Wire dependency injection
make wire

# Generate Swagger documentation
make swag

# Generate gRPC code
make protoc
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
  - `subject_domain`: Business object domain
  - `excel_process`: Excel processing domain
  - `file_manager`: File management domain
  - `model`: Domain models

- **Adapter Layer**:
  - **Driver**: HTTP handlers, REST API endpoints (Gin)
  - **Driven**: External service clients (GORM, Kafka, etc.)

- **Common**: Shared utilities, middleware, and configurations

## Excel Processing

The service provides comprehensive Excel processing capabilities:
- Template-based data import
- Rule-based validation
- Standard template support
- Data export functionality
- File validation and error handling

## CDC (Change Data Capture)

The service supports Change Data Capture for:
- Real-time database change notifications
- Event streaming via Kafka
- Data synchronization across services

## Security Considerations

- Input validation and sanitization
- SQL injection prevention via GORM
- Secure database connections
- Audit logging for all operations
- Access control middleware

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
