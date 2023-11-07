worker:
	python3 -m celery -A backend.tools.worker worker

swag:
	~/go/bin/swag init -g ./backend/cmd/server/main.go -o ./backend/docs
	~/go/bin/swag fmt

debug: swag
	docker compose up db -d 
	cd backend && go run ./cmd/server/main.go

local-no-logs:
	docker compose up --build -d

local:
	docker compose up --build

stop:
	docker compose down