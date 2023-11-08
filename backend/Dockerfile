FROM golang:1.21.0-bookworm
WORKDIR /app

RUN mkdir -p /app/static/videos
RUN mkdir -p /app/static/frames
RUN mkdir -p /app/static/processed/videos
RUN mkdir -p /app/static/processed/frames

COPY go.mod ./
COPY go.sum ./

RUN go mod download

COPY cmd/ ./cmd/
COPY docs ./docs/
COPY internal/ ./internal/
COPY .env .

RUN go build -o ./main ./cmd/server/main.go

CMD [ "./main" ]