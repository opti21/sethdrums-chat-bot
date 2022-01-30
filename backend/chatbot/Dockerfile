# syntax=docker/dockerfile:1

FROM golang:1.17-buster AS build

WORKDIR /app

COPY go.mod ./
COPY go.sum ./

RUN go mod download

COPY ./cmd/ ./cmd
COPY ./pkg/ ./pkg
COPY ./proto/ ./proto
COPY .env ./

RUN go build -o /pepega-chat ./cmd/main.go

FROM gcr.io/distroless/base-debian10

WORKDIR /app

COPY --from=build /pepega-chat /pepega-chat

EXPOSE 9131:9131

USER nonroot:nonroot

CMD ["/pepega-chat"]
