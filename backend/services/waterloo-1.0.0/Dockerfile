# syntax=docker/dockerfile:1

FROM golang:1.16-alpine

WORKDIR /app

COPY go.mod ./
COPY go.sum ./

RUN go mod download

COPY ./cmd/ ./cmd
COPY ./internal/ ./internal
COPY ./proto/ ./proto
COPY .env ./

RUN go build -o waterloo ./cmd/app.go

EXPOSE 9155

CMD ["./waterloo"]
