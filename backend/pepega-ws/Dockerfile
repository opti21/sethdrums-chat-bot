# syntax=docker/dockerfile:1

FROM golang:1.16-alpine

WORKDIR /app

COPY go.mod ./
COPY go.sum ./

RUN go mod download

COPY ./cmd/ ./cmd
COPY ./pkg/ ./pkg
COPY .env ./

RUN go build -o pepepga-ws ./cmd/app.go

EXPOSE 443:443
EXPOSE 80:80

CMD ["./pepega-ws -production"]
