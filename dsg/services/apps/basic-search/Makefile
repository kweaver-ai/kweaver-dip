
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
# database migrate
################################################################################

.PHONY: init
## Example: make init; install the dependence of this project
init:
	go get github.com/swaggo/swag/cmd/swag@v1.16.4
	go install github.com/swaggo/swag/cmd/swag@v1.16.4
	go get github.com/google/wire/cmd/wire@v0.5.0
	go install github.com/google/wire/cmd/wire@v0.5.0

.PHONY: swag
## Example: make swag;  build project with swagger docs
swag:
	swag init --parseDependency -p snakecase -g cmd/server/main.go cmd/server/cmd.go cmd/server/wire_gen.go  -o cmd/server/docs


.PHONY: wire
## Example: make wire; generate wire dependency
wire:
	wire ./cmd/server

.PHONY: build
## Example: make build; build the Go service binary
build:
	@mkdir -p bin
	@echo "Building basic-search-server..."
	@CGO_ENABLED=0 go build -ldflags "-s -w -X main.Version=${VERSION:-1.0}" -o bin/basic-search-server ./cmd/server
	@echo "Build completed: bin/basic-search-server"

.PHONY: build-linux
## Example: make build-linux; build the Go service binary for Linux
build-linux:
	@mkdir -p bin
	@echo "Building basic-search-server for Linux..."
	@GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags "-s -w -X main.Version=${VERSION:-1.0}" -o bin/basic-search-server-linux ./cmd/server
	@echo "Build completed: bin/basic-search-server-linux"

.PHONY: start
## Example: make start; start the service with dev-config (requires build first)
start:
	@if [ ! -f ./bin/basic-search-server ]; then \
		echo "Binary not found, building first..."; \
		$(MAKE) build; \
	fi
	@echo "Starting basic-search-server with dev-config..."
	@./bin/basic-search-server serve -conf dev-config/config.yaml

.PHONY: start-dev
## Example: make start-dev; build and start the service with dev-config
start-dev: build
	@echo "Starting basic-search-server with dev-config..."
	@./bin/basic-search-server serve -conf dev-config/config.yaml

.PHONY: model
## Example: make model dsn=xxx tables=xxx; generate gorm models
model:
	go run ./infrastructure/repository/db/gen/gorm_gen.go -dsn '$(dsn)' -tables '$(tables)'

.PHONY: run
## Example: make run; pull least code, generate least document, then build a executable file
run:
	git pull
	swag init --parseDependency -p snakecase -g cmd/server/main.go cmd/server/cmd.go cmd/server/wire_gen.go -o cmd/server/docs
	go run ./cmd/server/main.go



## redoc-cli build -o api.html cmd/server/docs/swagger.json