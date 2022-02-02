# syntax=docker/dockerfile:1

FROM bitnami/golang:1.17 AS build

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
COPY ./cmd/ ./cmd
COPY ./internal/ ./internal
COPY ./proto/ ./proto
 
RUN export GO111MODULE=on
RUN go mod download

RUN go build -o /pepog ./cmd/app.go

## Deploy
FROM bitnami/minideb:stretch

RUN mkdir -p /app

WORKDIR /app

COPY --from=build /pepog /pepog
COPY .env ./

RUN useradd -r -u 1001 -g root nonroot

RUN chown -R nonroot /app

USER nonroot

EXPOSE 9131:9131

ENTRYPOINT ["/pepog"]
