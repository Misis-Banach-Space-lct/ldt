import cv2
import time
import os
from celery import Celery

app = Celery(
    "tasks",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0",
)

app.conf.update(
    CELERY_TASK_SERIALIZER="json",
    CELERY_ACCEPT_CONTENT=["json"],
    CELERY_RESULT_SERIALIZER="json",
    CELERY_ENABLE_UTC=True,
    CELERY_TASK_PROTOCOL=1,
)


@app.task
def process(a, b):
    time.sleep(5)
    return a + b


@app.task
def get_frames(video_id: int, video_source: str):
    print(f"video_id: {video_id}")
    time.sleep(10)
    cap = cv2.VideoCapture(video_source)
    try:
        os.mkdir(f"./static/frames/{video_id}")
    except Exception as e:
        print(str(e))

    count = 0
    frame = 0
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    while True:
        _, image = cap.read()

        if frame % (fps * 5) == 0:
            cv2.imwrite(f"./static/frames/{video_id}/frame{count}.jpg", image)
            print(f"frame{count}")
            count += 1

        frame += 1
        if frame >= total_frames:
            break

    cap.release()
    return count
