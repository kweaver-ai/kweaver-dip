# Basic Search Service

**Language / 语言**: [English](README.md) | [中文](README.zh.md)

A comprehensive search service built with Go that provides full-text search capabilities for data catalogs, information catalogs, interface services, data views, electronic licenses, indicators, and information systems using OpenSearch/Elasticsearch.

## Overview

The Basic Search Service is a microservice that handles search operations across multiple data domains. It provides unified search APIs for data resource catalogs, information resource catalogs, interface services, data views, electronic licenses, indicators, and information systems. The service leverages OpenSearch/Elasticsearch for high-performance full-text search with support for customizable tokenizers (including HanLP for Chinese text processing).

## Features

- **Data Resource Catalog Search**:
  - Full-text search across data resource catalogs
  - Advanced filtering and sorting capabilities
  - Search result highlighting
  - Statistics and aggregation support
  - Multi-field search support

- **Information Resource Catalog Search**:
  - Full-text search across information resource catalogs
  - Keyword-based search with relevance scoring
  - Filtering and sorting options
  - Search result highlighting

- **Interface Service Search**:
  - Search interface services by name, description, and metadata
  - Service discovery and filtering
  - Relevance-based ranking
  - Search result highlighting

- **Data View Search**:
  - Search data views across the system
  - Multi-criteria filtering
  - Search result highlighting
  - Pagination support

- **Electronic License Search**:
  - Search electronic licenses and certificates
  - License metadata search
  - Filtering and sorting capabilities

- **Indicator Search**:
  - Search indicators and metrics
  - Indicator metadata search
  - Advanced filtering options

- **Information System Search**:
  - Search information systems
  - System metadata search
  - Department-based filtering
  - Keyword search with relevance scoring

- **Unified Data Resource Search**:
  - Cross-domain search across all data resources
  - Unified search interface
  - Aggregated search results
  - Multi-type resource search

- **Search Features**:
  - Full-text search with relevance scoring
  - Multi-field search support
  - Advanced filtering and sorting
  - Search result highlighting
  - Pagination and cursor-based navigation
  - Search statistics and aggregations
  - Configurable tokenizer support (standard or HanLP)

- **Message Queue Integration**:
  - Kafka message consumption for index updates
  - Real-time index synchronization
  - Event-driven search index updates

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
- **Search Engine**: OpenSearch/Elasticsearch
- **Message Queue**: Kafka (via Sarama)
- **Dependency Injection**: Google Wire
- **API Documentation**: Swagger
- **Observability**: OpenTelemetry
- **Logging**: Zap
- **Configuration**: Viper
- **CLI Framework**: Cobra
- **Tokenizer**: Standard tokenizer (with optional HanLP support)

## Project Structure

```
basic-search/
├── adapter/              # Adapter layer (drivers and driven)
│   ├── driver/          # HTTP handlers and REST API (Gin)
│   │   ├── data_catalog/ # Data catalog search endpoints
│   │   ├── data_view/   # Data view search endpoints
│   │   ├── data_search_all/ # Unified data resource search endpoints
│   │   ├── interface_svc/ # Interface service search endpoints
│   │   ├── info_catalog/ # Information catalog search endpoints
│   │   ├── info_system/ # Information system search endpoints
│   │   ├── elec_license/ # Electronic license search endpoints
│   │   ├── indicator/   # Indicator search endpoints
│   │   ├── mq.go        # Message queue handlers
│   │   └── route.go     # Route definitions
│   └── driven/          # External service clients and storage
│       ├── opensearch/  # OpenSearch client implementation
│       ├── es_data_datalog/ # Data catalog ES adapter
│       ├── es_data_view/ # Data view ES adapter
│       ├── es_info_catalog/ # Information catalog ES adapter
│       ├── es_info_system/ # Information system ES adapter
│       ├── es_interface_svc/ # Interface service ES adapter
│       ├── es_elec_license/ # Electronic license ES adapter
│       ├── es_indicator/ # Indicator ES adapter
│       ├── es_common/   # Common ES utilities
│       ├── configuration_center/ # Configuration center client
│       ├── user_management/ # User management client
│       └── hydra/       # OAuth2 Hydra client
├── cmd/                  # Application entry points
│   └── server/          # Main server application
│       ├── config/      # Configuration files
│       ├── docs/        # Swagger documentation
│       ├── cmd.go       # Command definitions
│       ├── main.go      # Main entry point
│       ├── wire.go      # Wire dependency injection
│       └── wire_gen.go  # Generated Wire code
├── common/               # Shared utilities and middleware
│   ├── constant/        # Constants
│   ├── errorcode/       # Error codes
│   ├── es/              # OpenSearch utilities
│   ├── form_validator/  # Form validation
│   ├── middleware/      # HTTP middleware
│   ├── models/          # Common models
│   ├── settings/        # Configuration settings
│   ├── trace_util/      # Tracing utilities
│   └── util/            # Utility functions
├── domain/              # Business logic and domain models
│   ├── data_catalog/    # Data catalog search domain
│   ├── data_view/       # Data view search domain
│   ├── data_search_all/ # Unified search domain
│   ├── interface_svc/   # Interface service search domain
│   ├── info_catalog/    # Information catalog search domain
│   ├── info_system/     # Information system search domain
│   ├── elec_license/    # Electronic license search domain
│   ├── indicator/       # Indicator search domain
│   └── domain.go        # Domain interfaces
├── dev-config/          # Development configuration
│   ├── config.yaml      # Local development config
│   └── config.docker.yaml # Docker environment config
└── docker/              # Docker configuration
    └── Dockerfile        # Docker build file
```

## Prerequisites

- Go 1.24+ or higher
- OpenSearch/Elasticsearch cluster (for search index)
- Kafka (for message queue, optional)
- OAuth2 server (Hydra) for authentication
- Configuration center service

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd services/apps/basic-search
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

The service uses Viper for configuration management. Configuration files should be placed in `dev-config/` directory for development or `cmd/server/config/` for production.

Key configuration sections:
- **Server**: HTTP server settings (port, timeout, etc.)
- **OpenSearch**: OpenSearch connection settings (read/write URIs, credentials)
- **Kafka**: Message queue settings (optional)
- **Telemetry**: OpenTelemetry configuration
- **Logging**: Log level and output settings
- **OAuth**: OAuth2 client configuration
- **DepServices**: External service endpoints

Example configuration structure:
```yaml
server:
  http:
    host: 0.0.0.0:8163

opensearch:
  readUri: "http://opensearch:9200"
  writeUri: "http://opensearch:9200"
  username: "admin"
  password: "admin123"
  sniff: false
  healthcheck: true
  debug: true
  useHanLP: false  # Set to true to use HanLP tokenizer (requires plugin)
  highlight:
    preTag: <span style="color:#FF6304;">
    postTag: </span>

kafka:
  version: "2.3.1"
  uri: "kafka:9092"
  clientId: "af.basic-search"
  username: "admin"
  password: "admin123"
  groupId: "af.basic-search-1"

oauth:
  hydraAdmin: "http://hydra:4445"
  clientId: "${OAUTH_CLIENT_ID}"
  clientSecret: "${OAUTH_CLIENT_SECRET}"

telemetry:
  traceUrl: "${TRACE_URL}"
  logLevel: "error"
  logUrl: "${LOG_URL}"
  serverName: "basic-search"
  serverVersion: "2.3.1"
  traceEnabled: "true"
```

Environment Variables:
| Variable | Description | Default |
|----------|-------------|---------|
| USER_ORG_CODE | User organization code | - |
| USER_ORG_NAME | User organization name | - |
| OAUTH_CLIENT_ID | OAuth2 client ID | - |
| OAUTH_CLIENT_SECRET | OAuth2 client secret | - |
| CONFIG_PATH | Configuration file path | config/config.yaml |

### Building

Build the service binary:

```bash
# Build for current platform
make build

# Build for Linux
make build-linux

# Or directly
go build -o bin/basic-search-server ./cmd/server
```

The binary will be generated in the `bin/` directory as `basic-search-server`.

### Running

Start the service:

```bash
# Run with Make (builds and starts)
make start-dev

# Or start with existing binary
make start

# Or directly
go run ./cmd/server serve -conf dev-config/config.yaml

# Or with custom address
./bin/basic-search-server serve -conf dev-config/config.yaml -addr :8163
```

The service will start on the configured port (default: 8163).

### API Endpoints

The service provides RESTful APIs for various search functionalities. Key endpoint categories include:

#### Data Resource Catalog Search
- `POST /api/basic-search/v1/data-catalog/search` - Search data resource catalogs
- `POST /api/basic-search/v1/data-catalog/statistics` - Get data catalog statistics

#### Information Resource Catalog Search
- `POST /api/basic-search/v1/info-catalog/search` - Search information resource catalogs

#### Interface Service Search
- `POST /api/basic-search/v1/interface-svc/search` - Search interface services

#### Data View Search
- `POST /api/basic-search/v1/data-view/search` - Search data views

#### Electronic License Search
- `POST /api/basic-search/v1/elec-license/search` - Search electronic licenses

#### Information System Search
- `GET /api/basic-search/v1/info-systems/search` - Search information systems (GET)
- `POST /api/basic-search/v1/info-systems/search` - Search information systems (POST)

#### Unified Data Resource Search
- `POST /api/basic-search/v1/data-resource/search` - Unified search across all data resources

### API Documentation

After generating Swagger docs, access the API documentation at:
- Swagger UI: `http://localhost:8163/swagger/index.html`
- JSON: `http://localhost:8163/swagger/doc.json`

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

### Code Quality

The project follows Go best practices and clean architecture principles. Consider using:
- `golangci-lint` for code quality checks
- `go vet` for static analysis
- `go fmt` for code formatting

## Architecture

The service follows a clean architecture pattern with clear separation of concerns:

- **Domain Layer**: Business logic and domain models
  - Search domain logic for each resource type
  - Search query construction and result processing
  - Search result transformation

- **Adapter Layer**:
  - **Driver**: HTTP handlers, REST API endpoints (Gin)
  - **Driven**: OpenSearch client implementation, external service clients

- **Common**: Shared utilities, middleware, and configurations

## Search Engine Integration

The service integrates with OpenSearch/Elasticsearch for:
- High-performance full-text search
- Multi-field search capabilities
- Relevance scoring and ranking
- Search result highlighting
- Aggregations and statistics
- Configurable tokenizers (standard or HanLP)
- Index management and updates

### Tokenizer Configuration

The service supports two tokenizer modes:
- **Standard Tokenizer**: Default OpenSearch tokenizer (no plugin required)
- **HanLP Tokenizer**: Chinese text processing tokenizer (requires HanLP plugin)

Configure via `opensearch.useHanLP` in the configuration file:
```yaml
opensearch:
  useHanLP: false  # Set to true to use HanLP tokenizer
```

When `useHanLP` is `false`, the service automatically adjusts index mappings to use the standard tokenizer, ensuring compatibility without requiring the HanLP plugin.

## Message Queue Integration

The service integrates with Kafka for:
- Real-time index updates
- Event-driven search index synchronization
- Asynchronous search index operations
- Reliable message delivery

## Index Management

The service manages multiple OpenSearch indices:
- Data catalog indices (with versioning support)
- Information catalog indices
- Interface service indices
- Data view indices
- Electronic license indices
- Indicator indices
- Information system indices

Each index type has its own mapping configuration and can be independently managed and updated.

## Search Features

### Full-Text Search
- Multi-field search support
- Keyword-based search with relevance scoring
- Phrase matching and fuzzy search
- Boolean query support

### Filtering and Sorting
- Advanced filtering by multiple criteria
- Custom sorting options
- Pagination support
- Cursor-based navigation

### Search Result Highlighting
- Configurable highlight tags
- Multi-field highlighting
- Highlight fragment extraction

### Statistics and Aggregations
- Search result statistics
- Aggregation support for analytics
- Faceted search capabilities

## Security Considerations

- OAuth2 authentication via Hydra
- Token-based authorization
- Input validation and sanitization
- Secure OpenSearch connections
- Audit logging for all search operations

## Monitoring & Observability

- OpenTelemetry for distributed tracing
- Structured logging with correlation IDs
- Performance metrics collection
- Health check endpoints
- Audit tracking for critical operations
- Search query logging

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
