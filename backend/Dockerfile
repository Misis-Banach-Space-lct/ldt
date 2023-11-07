FROM golang:1.21.0-bookworm
WORKDIR /app

RUN apt-get update
RUN apt-get -y install python3
RUN apt-get -y install python3-setuptools
RUN apt-get -y install python3-pip
RUN pip install celery --break-system-packages
RUN pip install redis --break-system-packages

RUN mkdir -p /app/static/videos

COPY go.mod ./
COPY go.sum ./

RUN go mod download

COPY cmd/ ./cmd/
COPY docs ./docs/
COPY tools/ ./tools/
COPY internal/ ./internal/
COPY .env .

RUN go build -o ./main ./cmd/server/main.go

CMD [ "./main" ]