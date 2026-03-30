# Data Application Gateway

**Language / 语言**: [English](README.md) | [中文](README.zh.md)

A lightweight API gateway service built with Go that provides unified access to data application services, request routing, and API execution capabilities for the DSG (Data Semantic Governance) system.

## Overview

The Data Application Gateway is a microservice that acts as the unified entry point for executing data application APIs. It handles request routing, authentication, rate limiting, and forwards requests to the appropriate data application services. This gateway enables external consumers to access published data services through a single endpoint.

## Features

- **API Gateway**:
  - Unified API endpoint for all data services
  - Request routing and forwarding
  - Dynamic service discovery
  - Load balancing support

- **Request Processing**:
  - Request validation and transformation
  - Parameter mapping and conversion
  - Response formatting
  - Error handling and standardization

- **Security**:
  - OAuth2/OIDC authentication integration
  - API key validation
  - Rate limiting and throttling
  - Access control enforcement

- **Integration**:
  - Data Application Service integration
  - Configuration center integration
  - User management integration
  - Authorization service integration

- **Observability**:
  - OpenTelemetry integration for distributed tracing
  - Structured logging with Zap
  - Request/response logging
  - Health check endpoints

## Technology Stack

- **Language**: Go 1.24.0
- **Web Framework**: Gin
- **Database**: MariaDB/MySQL (via GORM)
- **Cache**: Redis
- **Dependency Injection**: Google Wire
- **API Documentation**: Swagger
- **Observability**: OpenTelemetry
- **Logging**: Zap
- **Configuration**: Viper

## Project Structure

```
data-application-gateway/
├── adapter/          # Adapter layer (drivers and driven)
│   ├── driver/       # HTTP handlers and REST API (Gin)
│   └── driven/       # External service clients
├── cmd/              # Application entry points
│   └── server/       # Main server application
├── common/           # Shared utilities and middleware
│   ├── constant/     # Constants
│   ├── errorcode/    # Error codes
│   └── initialization/ # Initialization logic
├── domain/           # Business logic and domain models
├── infrastructure/   # Infrastructure layer
│   ├── config/       # Configuration
│   └── repository/   # Database repositories
├── docker/           # Docker configuration
└── helm/             # Kubernetes Helm charts
```

## Prerequisites

- Go 1.24.0 or higher
- MariaDB/MySQL database
- Redis server
- Data Application Service
- Configuration center service
- OAuth2/OIDC provider (Hydra)

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd services/apps/data-application-gateway
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
- **Services**: Microservice endpoints
- **Telemetry**: OpenTelemetry configuration

Example configuration structure:
```yaml
server:
  http:
    addr: 0.0.0.0:8157
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
  data_application_service: "data-application-service:8156"
  auth_service: "auth-service:8155"
```

### Building

Build the service binary:

```bash
# Build for current platform
make build

# Build for Linux
make build-linux
```

The binary will be generated in the `bin/` directory as `data-application-gateway-server`.

### Running

Start the service:

```bash
# Run directly
./bin/data-application-gateway-server --confPath cmd/server/config/

# Or with Go
go run cmd/server/main.go --confPath cmd/server/config/

# Or use Make
make run
```

The service will start on port 8157 by default.

### API Endpoints

All endpoints are prefixed with `/api/data-application-gateway/v1`:

#### API Execution
- `POST /execute/:service_id` - Execute a published data service
- `GET /execute/:service_id` - Execute a data service (GET method)

#### Service Discovery
- `GET /services` - List available published services
- `GET /services/:id` - Get service metadata

#### Health
- `GET /health` - Health check endpoint
- `GET /ready` - Readiness check endpoint

### API Documentation

After generating Swagger docs, access the API documentation at:
- Swagger UI: `http://localhost:8157/swagger/index.html`
- JSON: `http://localhost:8157/swagger/doc.json`

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
docker build -f docker/Dockerfile -t data-application-gateway .

# Run container
docker run -p 8157:8157 data-application-gateway
```

## Architecture

The service follows a clean architecture pattern:

- **Domain Layer**: Business logic and domain models
  - Request routing
  - Service discovery
  - API execution

- **Adapter Layer**:
  - **Driver**: HTTP handlers, REST API endpoints (Gin)
  - **Driven**: External service clients (Data Application Service, Configuration Center, etc.)

- **Infrastructure Layer**: Database repositories, external integrations

## Request Flow

1. Client sends request to gateway
2. Gateway authenticates the request
3. Gateway looks up the target service
4. Request is validated and transformed
5. Request is forwarded to Data Application Service
6. Response is received and formatted
7. Response is returned to client

## Security Considerations

- OAuth2/OIDC authentication via Hydra
- API key validation for service-to-service calls
- Rate limiting to prevent abuse
- Request/response logging for audit

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