
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
	go get github.com/swaggo/swag/cmd/swag@v1.8.7
	go install github.com/swaggo/swag/cmd/swag@v1.8.7
	go get github.com/google/wire/cmd/wire@v0.5.0
	go install github.com/google/wire/cmd/wire@v0.5.0

.PHONY: swag
## Example: make swag;  build project with swagger docs
swag:
	swag init --parseDependency -p snakecase -g cmd/server/main.go -o cmd/server/docs
	swag fmt


.PHONY: wire
## Example: make wire; generate wire dependency
wire:
	wire ./cmd/server

.PHONY: build
## Example: make build; build the Go service binary
build:
	@mkdir -p bin
	@echo "Building data-application-service-server..."
	@CGO_ENABLED=0 go build -ldflags "-s -w -X main.Version=${VERSION:-1.0}" -o bin/data-application-service-server ./cmd/server
	@echo "Build completed: bin/data-application-service-server"

.PHONY: build-linux
## Example: make build-linux; build the Go service binary for Linux
build-linux:
	@mkdir -p bin
	@echo "Building data-application-service-server for Linux..."
	@GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags "-s -w -X main.Version=${VERSION:-1.0}" -o bin/data-application-service-server-linux ./cmd/server
	@echo "Build completed: bin/data-application-service-server-linux"

.PHONY: start
## Example: make start; start the service with config (requires build first)
start:
	@if [ ! -f ./bin/data-application-service-server ]; then \
		echo "Binary not found, building first..."; \
		$(MAKE) build; \
	fi
	@echo "Starting data-application-service-server..."
	@./bin/data-application-service-server --confPath cmd/server/config/ --addr 0.0.0.0:8156

.PHONY: start-dev
## Example: make start-dev; build and start the service
start-dev: build
	@echo "Starting data-application-service-server..."
	@./bin/data-application-service-server --confPath cmd/server/config/ --addr 0.0.0.0:8156

.PHONY: model
## Example: make model dsn=xxx; generate gin models
model:
	go run ./infrastructure/repository/db/gen/gorm_gen.go -dsn '$(dsn)'

.PHONY: run
## Example: make run; pull least code, generate least document, then build a executable file
run:
	git pull
	swag init --parseDependency -p snakecase -g  cmd/server/main.go  -o  cmd/server/docs
	go run  ./cmd/server/main.go

################################################################################
# database migrate
################################################################################

# database migrate config
MYSQL_HOST=mariadb-mariadb-master.resource
MYSQL_PORT=3330
MYSQL_USERNAME=username
MYSQL_PASSWORD=xxx
MYSQL_DB=data_application_service

SQL_PATH='infrastructure/repository/db/gen/migration'
DATABASE='mysql://$(MYSQL_USERNAME):$(MYSQL_PASSWORD)@tcp($(MYSQL_HOST):$(MYSQL_PORT))/$(MYSQL_DB)?charset=utf8mb4&parseTime=True&loc=Local'


.PHONY: mc
## Example: make mc name=xxx; then create two sql file with version ahead of the file name
mc:
	migrate create -ext sql -dir $(SQL_PATH) -seq  $(name)


.PHONY: mu
## Example: make mu v=3;  then execute the sql file which version=3
mu:
	migrate -database $(DATABASE) -path $(SQL_PATH) up $(v)


.PHONY: md
## Example: make md v=2; then roll back the version 2
md:
	migrate -database $(DATABASE) -path  $(SQL_PATH) down $(v)

.PHONY: mf
## Example: make mf v=3; change the version in database to 3 in force
mf:
	migrate -database $(DATABASE) -path  $(SQL_PATH) force $(v)


## redoc-cli build -o api.html cmd/server/docs/swagger.json