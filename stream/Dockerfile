FROM golang:1.21.0-bookworm
WORKDIR /app

COPY go.mod ./
COPY go.sum ./

RUN go mod download

COPY . .

RUN go build -o ./main ./main.go
RUN chmod 777 ./main

CMD [ "./main" ]