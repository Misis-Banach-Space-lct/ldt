# MISIS Banach Space ldt

## run worker
```
cd ml-backend
python3 -m celery -A worker worker -l info --pool=eventlet
```