import os
import cv2
from celery import Celery

# from ml import process

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
    WORKER_LOST_WAIT=60 * 5,
)


@app.task
def process_video(video_id: int, video_source: str):
    print("starting process_video")
    # process(video_id, video_source)
    from ultralytics import YOLO
    import torch

    model = YOLO("model.pt")

    frames = []
    # Вот тут надо придумать как динамически определять частоту
    # Пока что я делаю: < 1 минуты - 5, 2 - 5 минут - 20, 8 - 10 минут - 40

    with torch.no_grad():
        results = model.predict(
            source=video_source,
            stream=True,
            save=True,
            tracker="bytetrack.yaml",
            vid_stride=5,
            classes=[1, 2, 3],
            device="cpu",
        )
        for res in ["a", "b", "c"]:
            frames.append(res)

    return


@app.task
def get_frames(video_id: int, video_source: str):
    print(f"video_id: {video_id}")
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
