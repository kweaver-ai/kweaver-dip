
################################################################################
# Help
################################################################################
TARGET_MAX_CHAR_NUM=20
## Show help
help:
	@echo ''
	@echo 'Usage:'
	@echo ' make target'
	@echo ''
	@echo 'Targets:'
	@awk '/^[a-zA-Z\-0-9]+:/ 														\
  		{ 																			\
		helpMessage = match(lastLine, /^## (.*)/); 									\
    	if (helpMessage) 															\
    		{ 																		\
    			helpCommand = substr($$1, 0, index($$1, ":")-1);					\
     			helpMessage = substr(lastLine, RSTART + 3, RLENGTH);				\
        		printf " %-$(TARGET_MAX_CHAR_NUM)s %s\n", helpCommand, helpMessage; \
        	} 																		\
        } 																			\
       	{ lastLine = $$0 }' $(MAKEFILE_LIST)


################################################################################
# Dependencies Installation
################################################################################

.PHONY: init
## Example: make init; install the dependence of this project
init:
	go get github.com/swaggo/swag/cmd/swag@v1.16.4
	go install github.com/swaggo/swag/cmd/swag@v1.16.4
	go get github.com/google/wire/cmd/wire@v0.6.0
	go install github.com/google/wire/cmd/wire@v0.6.0


################################################################################
# Code Generation
################################################################################

.PHONY: swag
## Example: make swag; build project with swagger docs
swag:
	swag init --parseDependency -p snakecase -g cmd/server/main.go -o cmd/server/docs

.PHONY: wire
## Example: make wire; generate wire dependency
wire:
	wire ./cmd/server


################################################################################
# Build
################################################################################

.PHONY: build
## Example: make build; build the Go service binary
build:
	@mkdir -p bin
	@echo "Building data-subject-server..."
	@CGO_ENABLED=0 go build -ldflags "-s -w -X main.Version=${VERSION:-1.0}" -o bin/data-subject-server ./cmd/server
	@echo "Build completed: bin/data-subject-server"

.PHONY: build-linux
## Example: make build-linux; build the Go service binary for Linux
build-linux:
	@mkdir -p bin
	@echo "Building data-subject-server for Linux..."
	@GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags "-s -w -X main.Version=${VERSION:-1.0}" -o bin/data-subject-server-linux ./cmd/server
	@echo "Build completed: bin/data-subject-server-linux"


################################################################################
# Start Services
################################################################################

.PHONY: start
## Example: make start; start the service with config (requires build first)
start:
	@if [ ! -f ./bin/data-subject-server ]; then \
		echo "Binary not found, building first..."; \
		$(MAKE) build; \
	fi
	@echo "Starting data-subject-server with config..."
	@./bin/data-subject-server

.PHONY: start-dev
## Example: make start-dev; build and start the service with config
start-dev: build
	@echo "Starting data-subject-server with config..."
	@./bin/data-subject-server


################################################################################
# Development
################################################################################

.PHONY: run
## Example: make run; pull latest code, generate latest document, then build a executable file
run:
	git pull
	swag init --parseDependency -p snakecase -g cmd/server/main.go -o cmd/server/docs
	go run ./cmd/server/main.go

.PHONY: test
## Example: make test; run tests
test:
	go test ./...

.PHONY: fmt
## Example: make fmt; format code
fmt:
	go fmt ./...

.PHONY: vet
## Example: make vet; run go vet
vet:
	go vet ./...

.PHONY: tidy
## Example: make tidy; tidy go modules
tidy:
	go mod tidy