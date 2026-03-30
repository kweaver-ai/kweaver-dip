# DSG - Data Semantic Governance

[![Go Version](https://img.shields.io/badge/Go-1.24+-00ADD8?style=flat&logo=go)](https://golang.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Language / 语言**: [English](README.md) | [中文](README.zh.md)

A comprehensive enterprise-grade Data Semantic Governance (DSG) platform that provides unified data catalog management, data view management, data exploration, authentication and authorization, task orchestration, and semantic search capabilities.

## Overview

DSG (Data Semantic Governance) is a microservices-based platform designed for enterprise data governance and semantic management. It provides a complete solution for data cataloging, data view management, data exploration, access control, workflow orchestration, and semantic search across multiple data sources.

The platform follows a microservices architecture pattern, with each service handling specific domain responsibilities. All services are built with Go, using clean architecture principles, and can be deployed independently or together using Docker Compose.

## System Architecture

DSG consists of the following components:

### Core Services

#### 1. **Data Catalog Service** (Port: 8153)
- Data resource catalog management
- Information catalog and system management
- Data push workflows
- Data comprehension and assessment
- Category and tree management
- Statistics and analytics

#### 2. **Data View Service** (Port: 8123)
- Metadata view (Form View) management
- Logic view management
- Data lineage analysis
- Data classification and masking
- Data exploration and dataset management
- Graph model management

#### 3. **Data Exploration Service** (Port: 8281)
- Data exploration task management
- Exploration report generation
- Data quality assessment
- Exploration rule configuration
- Task scheduling and execution

#### 4. **Basic Search Service** (Port: 8163)
- Full-text search across data catalogs
- Information catalog search
- Interface service search
- Data view search
- Electronic license search
- Indicator and information system search
- Unified cross-domain search

#### 5. **Configuration Center Service** (Port: 8133)
- System configuration management
- User and role management
- Permission and access control
- Menu and dictionary management
- Data source configuration
- Workflow configuration
- Code generation rules

#### 6. **Auth Service** (Port: 8155)
- Policy-based access control (PBAC)
- Permission enforcement
- Indicator dimensional rules
- Data warehouse authorization requests
- Resource access management
- Workflow integration

#### 7. **Data Subject Service** (Port: 8134)
- Data subject management
- Subject lifecycle tracking
- Subject relationship management

#### 8. **Task Center Service** (Port: 8080)
- Project and task management
- Work order system
- Data processing pipelines
- Object storage management
- Notification and communication
- Analytics and reporting

#### 9. **Session Service** (Port: 8000)
- User session management
- Session authentication
- Token management

#### 10. **Data Application Service** (Port: 8156)
- API interface management
- Data service publishing
- API lifecycle management
- Workflow integration for API approval
- Change Data Capture (CDC) for real-time synchronization
- Service statistics and monitoring

#### 11. **Data Application Gateway** (Port: 8157)
- Unified API gateway for data services
- Request routing and forwarding
- API execution and invocation
- Service discovery
- Request validation and transformation
- Rate limiting and access control

### Infrastructure Services

- **OpenSearch** (Port: 9200, 9600): Full-text search engine
- **Kafka** (Port: 9092): Message queue with SASL/PLAIN authentication
- **Zookeeper** (Port: 2181): Kafka coordination service
- **Hydra** (Port: 4444, 4445): OAuth2 authentication server
- **Redis** (Port: 6379): Caching and session storage
- **MariaDB** (Port: 3306): Primary database for all services

### Frontend Application

- React-based web application
- Micro-frontend architecture
- Multiple business modules and plugins

## Key Features

### Data Governance
- **Data Cataloging**: Comprehensive data resource and information catalog management
- **Data Classification**: Automated data classification and categorization
- **Data Quality**: Data quality assessment and monitoring
- **Data Lineage**: End-to-end data lineage tracking and visualization
- **Data Masking**: Sensitive data masking and privacy protection

### Semantic Management
- **Semantic Search**: Advanced full-text search with configurable tokenizers
- **Metadata Management**: Rich metadata management and organization
- **Data Views**: Unified data view management (metadata and logic views)
- **Data Exploration**: Interactive data exploration and analysis

### Access Control
- **Policy-Based Access Control (PBAC)**: Fine-grained access control policies
- **Role-Based Access Control (RBAC)**: Role and permission management
- **Resource Authorization**: Resource-level access control
- **Workflow Integration**: Authorization workflow support

### Workflow & Orchestration
- **Task Management**: Comprehensive task and project management
- **Work Order System**: Work order creation and tracking
- **Data Processing Pipelines**: Data aggregation and processing workflows
- **Audit Workflows**: Audit process management and tracking

### Data Application & API Management
- **API Management**: Comprehensive API interface creation and lifecycle management
- **Data Service Publishing**: Publish data views and catalogs as RESTful APIs
- **API Gateway**: Unified entry point for API execution with routing and load balancing
- **Service Discovery**: Dynamic discovery of published data services
- **Request Processing**: Request validation, transformation, and response formatting
- **API Monitoring**: Service call statistics and performance monitoring

### System Management
- **Configuration Management**: Centralized system configuration
- **User Management**: User, role, and permission management
- **Menu Management**: Dynamic menu and navigation management
- **Dictionary Management**: System dictionary and metadata management

## Technology Stack

### Backend Services
- **Language**: Go 1.24+
- **Web Framework**: Gin
- **ORM**: GORM with MySQL/MariaDB driver
- **Message Queue**: Kafka (with SASL/PLAIN), NSQ
- **Cache**: Redis
- **Search Engine**: OpenSearch/Elasticsearch
- **Dependency Injection**: Google Wire
- **API Documentation**: Swagger/OpenAPI
- **Observability**: OpenTelemetry
- **Logging**: Zap
- **Configuration**: Viper
- **CLI Framework**: Cobra

### Frontend
- **Framework**: React
- **Build Tools**: Webpack, Vite
- **Micro-frontend**: Plugin-based architecture

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Database**: MariaDB/MySQL
- **Message Queue**: Kafka, NSQ
- **Cache**: Redis
- **Search**: OpenSearch
- **Authentication**: OAuth2 (Hydra)

## Project Structure

```
dsg/
├── services/              # Backend microservices
│   └── apps/             # Application services
│       ├── auth-service/           # Authentication and authorization
│       ├── basic-search/           # Search service
│       ├── configuration-center/  # Configuration management
│       ├── data-catalog/          # Data catalog management
│       ├── data-exploration-service/ # Data exploration
│       ├── data-subject/          # Data subject management
│       ├── data-view/             # Data view management
│       ├── session/              # Session management
│       ├── task_center/           # Task and workflow management
│       ├── data-application-service/  # Data application and API management
│       └── data-application-gateway/  # API gateway for data services
├── frontend/             # Frontend web application
│   ├── src/             # Source code
│   ├── public/          # Static assets
│   └── config/          # Build configuration
├── deploy/              # Deployment configurations
│   ├── docker/         # Docker configurations
│   │   ├── kafka/      # Kafka configuration
│   │   └── opensearch/ # OpenSearch configuration
│   ├── docker-compose.yml      # Multi-service orchestration
│   └── docker-compose.dev.yml  # Development environment
├── script/              # Utility scripts
│   ├── start-go-services.sh   # Service startup script
│   └── verify-go-work.sh      # Go workspace verification
├── local_patches/       # Local dependency patches
├── go.work             # Go workspace configuration
└── LICENSE             # License file
```

## Prerequisites

- **Go**: 1.24.0 or higher
- **Docker**: 20.10+ and Docker Compose 2.0+
- **Node.js**: 16+ (for frontend development)
- **Make**: For build automation

### Infrastructure Requirements
- **Memory**: Minimum 8GB RAM (16GB recommended)
- **Disk**: At least 20GB free space
- **CPU**: 4+ cores recommended

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd dsg
```

### 2. Start All Services with Docker Compose

The easiest way to start all services is using the provided script:

```bash
# Start all services
./script/start-go-services.sh

# Or start only core services
./script/start-go-services.sh core

# Or start only Go services
./script/start-go-services.sh go
```

### 3. Manual Startup

Alternatively, you can start services manually:

```bash
cd deploy
docker-compose up -d
```

### 4. Verify Services

Check service status:

```bash
cd deploy
docker-compose ps
```

Access service endpoints:
- **OpenSearch**: http://localhost:9200
- **Kafka UI**: http://localhost:8080 (if enabled)
- **Hydra Admin**: http://localhost:4445
- **Basic Search**: http://localhost:8163
- **Configuration Center**: http://localhost:8133
- **Data Catalog**: http://localhost:8153
- **Data View**: http://localhost:8123
- **Auth Service**: http://localhost:8155
- **Task Center**: http://localhost:8080
- **Data Application Service**: http://localhost:8156
- **Data Application Gateway**: http://localhost:8157

## Development

### Go Workspace Setup

DSG uses Go workspaces to manage multiple services:

```bash
# Verify workspace configuration
./script/verify-go-work.sh

# The workspace includes all services:
# - auth-service
# - basic-search
# - configuration-center
# - data-catalog
# - data-exploration-service
# - data-subject
# - session
# - task_center
# - data-view
# - data-application-service
# - data-application-gateway
```

### Building Individual Services

Each service has its own Makefile:

```bash
# Build a specific service
cd services/apps/basic-search
make build

# Build for Linux
make build-linux

# Generate code (wire, swag)
make wire
make swag
```

### Running Services Locally

```bash
# Example: Run basic-search locally
cd services/apps/basic-search
make start-dev

# Or with custom config
./bin/basic-search-server serve -conf dev-config/config.yaml
```

### Frontend Development

```bash
cd frontend
npm install
npm start
```

## Configuration

### Environment Variables

Create a `.env` file in the `deploy/` directory:

```bash
# Database
MYSQL_ROOT_PASSWORD=root123
MYSQL_USER=dsg
MYSQL_PASSWORD=dsg123
MYSQL_DATABASE=dsg

# OAuth
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret

# User Organization
USER_ORG_CODE=your-org-code
USER_ORG_NAME=your-org-name
```

### Service Configuration

Each service has its configuration in:
- `services/apps/{service-name}/cmd/server/config/config.yaml`
- `services/apps/{service-name}/dev-config/config.yaml` (for development)

Key configuration areas:
- **Server**: HTTP/gRPC ports and timeouts
- **Database**: Connection settings
- **Redis**: Cache configuration
- **Kafka**: Message queue settings (with SASL authentication)
- **OpenSearch**: Search engine configuration
- **Telemetry**: OpenTelemetry and logging settings

## Deployment

### Docker Compose Deployment

For development and testing:

```bash
cd deploy
docker-compose up -d
```

### Production Deployment

For production environments, consider:

1. **Kubernetes Deployment**: Use Kubernetes for orchestration
2. **Service Mesh**: Implement service mesh for inter-service communication
3. **Monitoring**: Set up comprehensive monitoring and alerting
4. **Security**: Enable all security features (OpenSearch security, Kafka authentication)
5. **High Availability**: Deploy multiple instances with load balancing
6. **Data Persistence**: Use persistent volumes for databases and search indices

## Service Communication

Services communicate through:
- **REST APIs**: HTTP/REST for synchronous communication
- **gRPC**: For high-performance inter-service calls
- **Message Queue**: Kafka/NSQ for asynchronous event-driven communication
- **Service Discovery**: Docker network for service discovery

## Data Flow

1. **Data Ingestion**: Data is ingested through various services
2. **Cataloging**: Data Catalog service catalogs and organizes data
3. **Indexing**: Basic Search service indexes data in OpenSearch
4. **View Management**: Data View service manages data views and lineage
5. **Access Control**: Auth Service enforces access policies
6. **Exploration**: Data Exploration Service provides exploration capabilities
7. **Workflow**: Task Center orchestrates workflows and processes
8. **API Publishing**: Data Application Service publishes data as RESTful APIs
9. **API Execution**: Data Application Gateway provides unified access to published APIs

## Security

- **OAuth2 Authentication**: Hydra-based OAuth2 authentication
- **Policy-Based Access Control**: Fine-grained PBAC policies
- **Role-Based Access Control**: RBAC for user and resource management
- **Data Masking**: Sensitive data masking capabilities
- **Audit Logging**: Comprehensive audit trails
- **Secure Communication**: TLS/SSL for service communication
- **Kafka SASL**: SASL/PLAIN authentication for Kafka

## Monitoring & Observability

- **Distributed Tracing**: OpenTelemetry integration across all services
- **Structured Logging**: Zap-based structured logging
- **Health Checks**: Health check endpoints for all services
- **Metrics Collection**: Performance and business metrics
- **Audit Tracking**: Comprehensive audit logging

## API Documentation

Each service provides Swagger/OpenAPI documentation:

- **Basic Search**: http://localhost:8163/swagger/index.html
- **Configuration Center**: http://localhost:8133/swagger/index.html
- **Data Catalog**: http://localhost:8153/swagger/index.html
- **Data View**: http://localhost:8123/swagger/index.html
- **Auth Service**: http://localhost:8155/swagger/index.html
- **Task Center**: http://localhost:8080/swagger/index.html
- **Data Application Service**: http://localhost:8156/swagger/index.html
- **Data Application Gateway**: http://localhost:8157/swagger/index.html

## Contributing

1. Follow the existing code style and patterns
2. Add tests for new features
3. Update API documentation when adding new endpoints
4. Run `make swag` to regenerate Swagger docs
5. Ensure all tests pass before submitting
6. Follow clean architecture principles
7. Update service READMEs when adding significant features

## Service-Specific Documentation

Each service has its own detailed README:

- [Basic Search Service](services/apps/basic-search/README.md)
- [Configuration Center Service](services/apps/configuration-center/README.md)
- [Data Catalog Service](services/apps/data-catalog/README.md)
- [Data Exploration Service](services/apps/data-exploration-service/README.md)
- [Data View Service](services/apps/data-view/README.md)
- [Auth Service](services/apps/auth-service/README.md)
- [Task Center Service](services/apps/task_center/README.md)
- [Data Application Service](services/apps/data-application-service/README.md)
- [Data Application Gateway](services/apps/data-application-gateway/README.md)

## License

See the [LICENSE](LICENSE) file in the repository root.

## Support

For issues and questions:
- Create an issue in the repository
- Contact the development team
- Refer to service-specific READMEs for detailed documentation

