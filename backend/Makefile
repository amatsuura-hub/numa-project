.PHONY: build test lint clean

build:
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o bin/bootstrap cmd/api/main.go

test:
	go test ./... -v -count=1

lint:
	golangci-lint run ./...

clean:
	rm -rf bin/

deploy: build
	cd bin && zip -j bootstrap.zip bootstrap
	aws lambda update-function-code \
		--function-name $${LAMBDA_FUNCTION_NAME} \
		--zip-file fileb://bin/bootstrap.zip
