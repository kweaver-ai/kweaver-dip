# DSG Docker Deployment Guide

[中文文档](./DEPLOYMENT.zh.md) | **English**

This document explains how to quickly deploy the DSG (Data Semantic Governance) system using Docker Compose.

## Overview

The DSG system uses Docker Compose for containerized deployment. All services are configured through environment variables and support one-command startup.

## Quick Start

### 1. Prerequisites

- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+ (or `docker compose` command)
- **Memory**: Minimum 8GB RAM (16GB recommended)
- **Disk**: At least 20GB available space

### 2. Configure Environment Variables

```bash
cd deploy

# Create .env file from template
cp .env.example .env

# Edit .env file as needed
vim .env  # or use another editor
```

The `.env` file contains environment variable configurations for all services, including:

- **Database Configuration** (MariaDB)
- **Redis Configuration**
- **Kafka Configuration** (SASL/PLAIN authentication)
- **OpenSearch Configuration**
- **OAuth/Hydra Configuration**
- **Service Endpoint Configuration**
- **Logging and Tracing Configuration**

### 3. Start All Services

Using the provided startup script (recommended):

```bash
# Start all services
make docker-compose-up

# Or use docker compose command
docker compose up -d
```

### 4. Start Specific Services

```bash
# Start only infrastructure services (OpenSearch, Kafka, Redis, MariaDB)
docker compose up -d opensearch kafka redis mariadb

# Start a specific Go service
docker compose up -d basic-search
```

### 5. Check Service Status

```bash
# Check all services status
make docker-compose-ps

# Or use docker compose
docker compose ps
```

### 6. View Service Logs

```bash
# View all service logs
make docker-compose-logs

# View specific service logs
docker compose logs basic-search

# Follow logs in real-time
docker compose logs -f basic-search
```

### 7. Stop Services

```bash
# Stop all services
make docker-compose-down

# Or use docker compose
docker compose down
```

## Development Environment

Use development environment configuration (enable DEBUG mode, use dev-config directory):

```bash
# Use development environment configuration
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Development environment features:
- Enable DEBUG mode and debug log level
- Use configuration files from `dev-config` directory (if exists)
- Reduced resource usage (memory limits, etc.)
- Optimized timeout and retry settings

## Configuration Files

### Environment Variables File (.env)

All service environment variables are configured in the `deploy/.env` file. Main configuration items:

```bash
# Database Configuration
MYSQL_ROOT_PASSWORD=root123
MYSQL_USER=dsg
MYSQL_PASSWORD=dsg123
MYSQL_DATABASE=dsg

# Kafka Configuration
KAFKA_USERNAME=admin
KAFKA_PASSWORD=admin123

# OpenSearch Configuration
OPENSEARCH_INITIAL_ADMIN_PASSWORD=OpenSearch2024!@#

# OAuth Configuration
OAUTH_CLIENT_ID=default-client-id
OAUTH_CLIENT_SECRET=default-client-secret
```

### Service Configuration Files

Each service's configuration files are located at:
- `services/apps/{service-name}/cmd/server/config/config.yaml` - Production config
- `services/apps/{service-name}/dev-config/config.yaml` - Development config (optional, not committed to Git)
- `services/apps/{service-name}/dev-config/config.docker.yaml` - Docker environment config (optional, not committed to Git)

**Note**: The `dev-config` directory and `.env` files are not committed to the Git repository and need to be configured locally.

## Service Ports

| Service | Port | Description |
|---------|------|-------------|
| basic-search | 8163 | Basic search service |
| configuration-center | 8133 | Configuration center service |
| data-catalog | 8153 | Data catalog service |
| data-exploration-service | 8281 | Data exploration service |
| data-view | 8123 | Data view service |
| auth-service | 8155 | Authentication service |
| data-subject | 8134 | Data subject service |
| session | 8000 | Session service |
| task-center | 8080 | Task center service |
| opensearch | 9200, 9600 | OpenSearch search engine |
| kafka | 9092, 31000 | Kafka message queue |
| zookeeper | 2181 | Zookeeper coordination service |
| hydra | 4444, 4445 | OAuth2 authentication service |
| redis | 6379 | Redis cache |
| mariadb | 3306 | MariaDB database |

## Health Check

```bash
# Check all services health status
curl http://localhost:9200/_cluster/health  # OpenSearch
curl http://localhost:8163/health           # Basic Search
curl http://localhost:8133/health           # Configuration Center
```

## Common Issues

### 1. Service Startup Failure

**Problem**: Service exits immediately after startup

**Solution**:
- Check logs: `docker compose logs [service-name]`
- Verify configuration files exist
- Check environment variables are set correctly
- Ensure dependent services are started

### 2. Port Conflicts

**Problem**: Port is already in use

**Solution**: Modify port mappings in `.env` file or `docker-compose.yml`

### 3. Out of Memory

**Problem**: Service crashes due to insufficient memory

**Solution**:
- Reduce number of service instances
- Adjust memory limits in `docker-compose.dev.yml`
- Increase system memory

### 4. Database Connection Failure

**Problem**: Service cannot connect to MariaDB

**Solution**:
- Ensure MariaDB service is running: `docker compose ps mariadb`
- Check environment variables `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` are correct
- Check MariaDB health: `docker compose exec mariadb mysqladmin ping -h localhost -u root -proot123`

### 5. Kafka Connection Failure

**Problem**: Service cannot connect to Kafka

**Solution**:
- Ensure Kafka and Zookeeper services are running
- Check SASL authentication configuration (username and password)
- Verify `KAFKA_HOST` environment variable is set to `kafka` (Docker service name)

### 6. Configuration File Not Found

**Problem**: `panic: stat cmd/server/config/: no such file or directory`

**Solution**:
- Ensure configuration files are in the correct location
- Check if Dockerfile correctly copies configuration files
- Verify volume mount paths are correct

## Data Persistence

All data is stored in Docker volumes:

```bash
# List all volumes
docker volume ls | grep dsg

# Inspect specific volume details
docker volume inspect dsg_opensearch-data

# Backup data (example)
docker run --rm -v dsg_opensearch-data:/data -v $(pwd):/backup \
  ubuntu tar czf /backup/opensearch-backup.tar.gz /data
```

## Cleanup and Reset

```bash
# Stop all services and remove volumes (⚠️ will delete all data)
docker compose down -v
docker system prune -f
```

## Production Environment Notes

⚠️ **Current configuration is for development/testing environments only**

Production environments require:

1. **Enable Security Features**
   - OpenSearch security plugin
   - Kafka SASL/PLAIN authentication (already enabled)
   - Database access control

2. **Use External Services**
   - External database cluster
   - External Redis cluster
   - External Kafka cluster
   - External OpenSearch cluster

3. **Configure Persistence**
   - Use external storage volumes
   - Configure database backups
   - Configure log collection

4. **Monitoring and Alerting**
   - Configure service monitoring
   - Set up resource alerts
   - Configure log aggregation

5. **High Availability Deployment**
   - Use Kubernetes or other orchestration tools
   - Configure load balancing
   - Implement service auto-recovery

## Advanced Usage

### Start Only Infrastructure Services

```bash
docker compose up -d opensearch kafka zookeeper redis mariadb hydra
```

### Restart Specific Services

```bash
docker compose restart basic-search
```

### Rebuild Service Images

```bash
# Rebuild all services
docker compose build

# Rebuild specific service
docker compose build basic-search
```

### View Service Resource Usage

```bash
docker stats
```

## Troubleshooting

### View Service Logs

```bash
# View all service logs
docker compose logs

# View last 100 log lines
docker compose logs --tail=100

# Follow logs in real-time
docker compose logs -f
```

### Enter Container for Debugging

```bash
# Enter container
docker compose exec basic-search /bin/bash

# View files inside container
docker compose exec basic-search ls -la /opt/basic-search/config/
```

### Check Network Connectivity

```bash
# Check network connectivity between containers
docker compose exec basic-search ping opensearch
docker compose exec basic-search ping kafka
```

## Related Documentation

- [README.md](../README.md) - Project overview
- [README.zh.md](../README.zh.md) - Project overview (Chinese)
- [docker-compose.yml](docker-compose.yml) - Docker Compose configuration
- Each service README - See `services/apps/{service-name}/README.md`

## Support

If you encounter issues:
1. Check service logs
2. Verify configuration files
3. Review the Common Issues section in this document
4. Create an Issue or contact the development team
