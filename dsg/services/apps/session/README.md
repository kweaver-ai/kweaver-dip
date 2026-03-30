# Session Service

**Language / 语言**: [English](README.md) | [中文](README.zh.md)

A comprehensive session management service built with Go that provides authentication, authorization, and session management capabilities using OAuth2/OIDC protocols and Redis for session storage.

## Overview

The Session Service is a microservice that handles user authentication, session management, and token operations. It supports OAuth2/OIDC flows, single sign-on (SSO), third-party authentication (e.g., AnyShare), and provides RESTful APIs for login, logout, token refresh, and user information retrieval.

## Features

- **OAuth2/OIDC Authentication**:
  - OAuth2 authorization code flow
  - Login and logout callbacks
  - Token management and refresh
  - Support for multiple platforms

- **Single Sign-On (SSO)**:
  - SSO authentication support
  - Third-party SSO integration (AnyShare)
  - Session-based authentication

- **Session Management**:
  - Redis-based session storage
  - Session creation, retrieval, and deletion
  - Configurable session expiration
  - Cookie-based session tracking

- **User Information**:
  - User profile retrieval
  - Username lookup
  - Platform information

- **Observability**:
  - OpenTelemetry integration for distributed tracing
  - Structured logging with Zap
  - Request/response tracing middleware
  - Audit logging support

- **API Documentation**:
  - Swagger/OpenAPI documentation
  - Auto-generated API docs

## Technology Stack

- **Language**: Go 1.24.0
- **Web Framework**: Gin
- **Session Storage**: Redis (via go-redis)
- **Authentication**: OAuth2/OIDC (Hydra)
- **Dependency Injection**: Google Wire
- **API Documentation**: Swagger
- **Observability**: OpenTelemetry
- **Logging**: Zap
- **Configuration**: Viper
- **Message Queue**: Kafka (via Sarama, optional)

## Project Structure

```
session/
├── adapter/          # Adapter layer (drivers and driven)
│   ├── driver/       # HTTP handlers and REST API (Gin)
│   └── driven/       # External service clients (OAuth2, User Management, etc.)
├── cmd/              # Application entry points
│   └── server/       # Main server application
├── common/           # Shared utilities and middleware
│   ├── constant/     # Constants
│   ├── cookie_util/  # Cookie utilities
│   ├── errorcode/    # Error codes
│   ├── form_validator/ # Form validation
│   ├── initialization/ # Initialization logic
│   ├── settings/     # Configuration settings
│   ├── trace_util/   # Tracing utilities
│   └── units/        # Unit utilities
├── domain/           # Business logic and domain models
│   ├── d_session/   # Session domain (Redis implementation)
│   ├── login/        # Login use case
│   ├── logout/      # Logout use case
│   ├── refresh_token/ # Token refresh use case
│   └── user_info/   # User information use case
└── session/          # Additional session utilities
```

## Prerequisites

- Go 1.24.0 or higher
- Redis server (for session storage)
- OAuth2/OIDC provider (e.g., Hydra)
- User Management service (for user information)
- Kafka (optional, for message consumption)

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd services/apps/session
```

2. Install dependencies:
```bash
go mod download
```

3. Generate code:
```bash
# Generate Wire dependency injection code
go generate ./...

# Generate Swagger API documentation (if swag is installed)
swag init -g cmd/server/main.go
```

### Configuration

The service uses Viper for configuration management. Configuration files should be placed in `cmd/server/config/` directory.

Key configuration sections:
- **Server**: HTTP server settings (port, timeout, etc.)
- **Redis**: Redis connection settings for session storage
- **OAuth2**: OAuth2/OIDC provider settings (Hydra)
- **User Management**: User management service endpoint
- **Authentication**: Authentication service endpoint
- **Telemetry**: OpenTelemetry configuration
- **Logging**: Log level and output settings
- **Session**: Session expiration and cookie settings

Example configuration structure:
```yaml
server:
  port: 8080
  timeout: 30s

redis:
  addr: localhost:6379
  password: ""
  db: 0

oauth2:
  client_id: your-client-id
  client_secret: your-client-secret
  auth_url: http://hydra:4444/oauth2/auth
  token_url: http://hydra:4444/oauth2/token

session:
  expire_seconds: 3600
  cookie_name: session_id
```

### Building

Build the service binary:

```bash
# Build for current platform
go build -o bin/session-server ./cmd/server

# Build for Linux
GOOS=linux GOARCH=amd64 go build -o bin/session-server-linux ./cmd/server
```

The binary will be generated in the `bin/` directory as `session-server`.

### Running

Start the service:

```bash
# Run directly
./bin/session-server --confPath cmd/server/config/

# Or with Go
go run cmd/server/main.go --confPath cmd/server/config/
```

The service will start on the configured port (default: 8080).

### API Endpoints

All endpoints are prefixed with `/af/api/session/v1`:

#### Authentication
- `GET /login` - Initiate OAuth2 login flow (redirects to authorization server)
- `GET /login/callback` - Handle OAuth2 login callback
- `GET /logout` - Initiate logout flow
- `GET /logout/callback` - Handle logout callback
- `GET /refresh-token` - Refresh access token

#### Single Sign-On
- `POST /sso` - Third-party SSO authentication (AnyShare)
- `GET /sso` - Single sign-on authentication

#### User Information
- `GET /userinfo` - Get user information
- `GET /username` - Get username
- `GET /platform` - Get login platform information

### API Documentation

After generating Swagger docs, access the API documentation at:
- Swagger UI: `http://localhost:<port>/swagger/index.html`
- JSON: `http://localhost:<port>/swagger/doc.json`

## Development

### Code Generation

```bash
# Generate Wire dependency injection
go generate ./...

# Generate Swagger documentation (if swag is installed)
swag init -g cmd/server/main.go
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

The service follows a clean architecture pattern:

- **Domain Layer**: Business logic and domain models
  - `d_session`: Session domain with Redis implementation
  - `login`: Login use case
  - `logout`: Logout use case
  - `refresh_token`: Token refresh use case
  - `user_info`: User information use case

- **Adapter Layer**:
  - **Driver**: HTTP handlers, REST API endpoints (Gin)
  - **Driven**: External service clients (OAuth2, User Management, Authentication)

- **Common**: Shared utilities, middleware, and configurations

## Session Management

Sessions are stored in Redis with the following characteristics:
- Session ID is stored in HTTP cookies
- Session data includes: tokens, user information, platform, SSO status
- Configurable expiration time
- Automatic cleanup on logout

## Security Considerations

- Sessions are stored server-side in Redis
- Session IDs are transmitted via secure cookies
- OAuth2/OIDC protocols for secure authentication
- Token refresh mechanism for long-lived sessions
- Support for multiple authentication platforms

## Contributing

1. Follow the existing code style and patterns
2. Add tests for new features
3. Update API documentation when adding new endpoints
4. Run `swag init` to regenerate Swagger docs
5. Ensure all tests pass before submitting

## License

See the LICENSE file in the repository root.

## Support

For issues and questions, please contact the development team or create an issue in the repository.
