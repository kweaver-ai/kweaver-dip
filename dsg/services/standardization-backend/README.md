# Standardization Backend Service

[中文版本](README.zh.md)

## Project Introduction

Data Standardization Backend Service is a Spring Boot-based backend service for managing data standardization-related businesses, including data element management, catalog management, dictionary management, rule management, file management, and task management.

## Technology Stack

- **Framework**: Spring Boot 2.7.5
- **Development Language**: Java 1.8
- **Persistence Layer**: MyBatis Plus
- **Database**: MariaDB / Dameng Database
- **Server**: Undertow
- **API Documentation**: Swagger 3.0 + Knife4j
- **Message Queue**: Kafka + NSQ
- **Cache**: Redis
- **Distributed Lock**: Redisson
- **Tool Libraries**: Lombok, Hutool, EasyExcel

## Functional Modules

1. **Data Standardization Management**
   - Business table standardization creation
   - Data element management
   - Data element history records

2. **Catalog Management**
   - Catalog tree structure management
   - Catalog and file association

3. **Code Table Management**
   - Code table data maintenance
   - Code table enum management
   - Code table Excel import/export

4. **Coding Rule Management**
   - Coding rule definition and maintenance
   - Coding rule type management

5. **File Management**
   - Standard file management
   - File attachment management

## Project Structure

```
├── aspect/             # Aspect classes
├── common/             # Common components
│   ├── annotation/     # Custom annotations
│   ├── constant/       # Constant definitions
│   ├── enums/          # Enumeration classes
│   ├── excel/          # Excel processing
│   ├── exception/      # Exception handling
│   ├── mybatis/        # MyBatis interceptors
│   ├── producer/       # Message producers
│   ├── threadpoolexecutor/ # Thread pools
│   ├── util/           # Utility classes
│   └── webfilter/      # Web filters
├── config/             # Configuration classes
├── configuration/      # Configuration management
├── controller/         # Controller layer
├── dto/                # Data transfer objects
├── entity/             # Entity classes
├── filter/             # Filters
├── handler/            # Handlers
├── mapper/             # Data access layer
├── redisson/           # Redisson distributed locks
├── service/            # Service layer
└── vo/                 # View objects
```

## Quick Start

### Environment Requirements

- JDK 1.8+
- Maven 3.6+
- MariaDB / Dameng Database
- Redis
- Kafka / NSQ

### Build and Run

1. **Clone the project**

2. **Configure database and Redis**
   - Modify database and Redis configurations in `application.yml` or `application.properties`

3. **Build the project**
   ```bash
   mvn clean package -DskipTests
   ```

4. **Run the project**
   ```bash
   java -jar target/standardization-web-0.0.1-SNAPSHOT.jar
   ```

5. **Access API documentation**
   - Swagger: http://localhost:{port}/swagger-ui/
   - Knife4j: http://localhost:{port}/doc.html

## Development Specifications

1. **Code Style**
   - Follow Alibaba Java Development Specifications
   - Use Lombok to simplify code
   - Clear naming for methods and variables

2. **Layered Design**
   - Controller layer handles requests and responses
   - Service layer handles business logic
   - Mapper layer handles data access
   - Entity corresponds to database tables
   - DTO for data transmission
   - VO for data returned to frontend

3. **Log Management**
   - Use Slf4j for logging
   - Record audit logs for key operations

4. **Exception Handling**
   - Unified exception handling
   - Custom exception classes
   - Error code enum management

## Contribution Guide

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

## Contact Information