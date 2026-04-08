# DIP Hub Application Makefile
# Commands for development, testing, and deployment

.PHONY: help install dev run test lint clean docker-build docker-run

# Default target
help:
	@echo "DIP Hub Application - Available Commands"
	@echo ""
	@echo "  make install     - Install production dependencies"
	@echo "  make dev         - Install development dependencies"
	@echo "  make run         - Run the application"
	@echo "  make run-dev     - Run the application in development mode"
	@echo "  make test        - Run tests"
	@echo "  make test-cov    - Run tests with coverage"
	@echo "  make lint        - Run linter"
	@echo "  make clean       - Clean up cache files"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-run  - Run Docker container"
	@echo ""

# Python settings
PYTHON := python3
PIP := pip3
VENV := .venv
VENV_BIN := $(VENV)/bin

# Application settings
APP_MODULE := src.main:app
HOST ?= 0.0.0.0
PORT ?= 8000

# Create virtual environment
$(VENV):
	$(PYTHON) -m venv $(VENV)

# Install production dependencies
install: $(VENV)
	$(VENV_BIN)/pip install --upgrade pip
	$(VENV_BIN)/pip install -r requirements.txt

# Install development dependencies
dev: $(VENV)
	$(VENV_BIN)/pip install --upgrade pip
	$(VENV_BIN)/pip install -r requirements.txt

# Run the application
run:
	$(VENV_BIN)/python -m src.main

# Run the application in development mode with auto-reload
run-dev:
	DIP_HUB_DEBUG=true $(VENV_BIN)/uvicorn $(APP_MODULE) --host $(HOST) --port $(PORT) --reload

# Run the application with uvicorn directly
run-uvicorn:
	$(VENV_BIN)/uvicorn $(APP_MODULE) --host $(HOST) --port $(PORT)

# Run tests
test:
	$(VENV_BIN)/pytest tests/ -v

# Run tests with coverage
test-cov:
	$(VENV_BIN)/pytest tests/ -v --cov=src --cov-report=term-missing --cov-report=html

# Run linter
lint:
	$(VENV_BIN)/python -m py_compile src/**/*.py

# Clean up cache files
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name ".coverage" -delete 2>/dev/null || true

# Docker commands
DOCKER_IMAGE := dip-hub
DOCKER_TAG := latest

docker-build:
	docker build -t $(DOCKER_IMAGE):$(DOCKER_TAG) .

docker-run:
	docker run -p $(PORT):$(PORT) --env-file .env $(DOCKER_IMAGE):$(DOCKER_TAG)

