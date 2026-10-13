# =============================================================================
# MCU Alumni Portal — Multi-Stage Production Dockerfile
# Enterprise Single-Port Microservices Engine (Port 8000)
# =============================================================================

# Stage 1: Build Go Binary
FROM golang:1.23-alpine AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/bin/microservices ./cmd/microservices

# Stage 2: Minimal Production Runtime
FROM alpine:3.20
WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata
COPY --from=builder /app/bin/microservices /app/microservices

ENV PORT=8000
EXPOSE 8000

CMD ["/app/microservices"]
