.PHONY: setupproto protogen
setupproto: ## Fetches deps for building .pb.go files
	go get google.golang.org/protobuf/cmd/protoc-gen-go \
			google.golang.org/grpc/cmd/protoc-gen-go-grpc

protogen: ## Create .pb.go files
	mkdir -p internal/proto/ && \
	protoc --proto_path=proto \
			--go_out=internal/proto --go_opt=paths=source_relative \
			--go-grpc_out=internal/proto --go-grpc_opt=paths=source_relative \
				./proto/*.proto