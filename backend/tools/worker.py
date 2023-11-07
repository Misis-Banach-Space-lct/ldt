import time
from celery import Celery

app = Celery(
    "tasks",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0",
)

app.conf.update(
    CELERY_TASK_SERIALIZER="json",
    CELERY_ACCEPT_CONTENT=["json"],  # Ignore other content
    CELERY_RESULT_SERIALIZER="json",
    CELERY_ENABLE_UTC=True,
    CELERY_TASK_PROTOCOL=1,
)


@app.task
def add(a, b):
    time.sleep(5)
    return a + b


@app.task
def add_reflect(a, b):
    return a + b
