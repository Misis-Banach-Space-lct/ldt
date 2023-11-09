worker:
	cd ml-backend && pip install -r requirements.txt && source venv/bin/activate && python3 -m celery -A worker worker -l info --pool=eventlet -c 7

swag:
	~/go/bin/swag init -g ./backend/cmd/server/main.go -o ./backend/docs
	~/go/bin/swag fmt

debug: swag
	docker compose up db -d 
	cd backend && go run ./cmd/server/main.go

local:
	docker compose up --build -d
	cd ml-backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && python3 -m celery -A worker worker -l info --pool=eventlet -c 7

local-with-logs:
	docker compose up --build

stop:
	docker compose down