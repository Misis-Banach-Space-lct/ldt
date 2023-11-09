import random
import numpy as np
import torch
from ultralytics import RTDETR
from ultralytics import YOLO
import cv2
import os

from src.detect_stationary import save_cadrs
from src.detect_human_stationary import post_processing

random.seed(42)
np.random.seed(42)
torch.manual_seed(42)

names = {0: "animal", 1: "balloon", 2: "cart", 3: "person"}


def process(video_id: int, video_path: str):
    model = YOLO("weights/model.pt")
    model_predictor = RTDETR("weights/model_predictor.pt")
    model_cart = YOLO("weights/yolov8n.pt")

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_cnt = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    if fps == 0:
        print("fps = 0")
        fps = 5
    duration = frame_cnt / fps

    vid_stride = 5  # чет придумать как связать с duration

    frames = []
    with torch.no_grad():
        results = model.track(
            source=f"../{video_path}",
            save=True,
            stream=True,
            tracker="bytetrack.yaml",
            classes=[1, 2, 3],
            vid_stride=vid_stride,
            project="../static/processed/videos",
        )
        for res in results:
            frames.append(res)

    try:
        os.mkdir(f"../static/processed/frames/{video_id}")
    except Exception as e:
        print(str(e))
    try:
        os.mkdir(f"../static/processed/frames_h")
    except Exception as e:
        print(str(e))
    try:
        os.mkdir(f"../static/processed/frames_h/{video_id}")
    except Exception as e:
        print(str(e))

    saved = save_cadrs(
        frames,
        model_predictor,
        model_cart,
        fps,
        vid_stride,
        save_path=f"../static/processed/frames/{video_id}",
    )

    """
    if len(saved) > 0:
        for save in saved:
            print(f"TimeCode - {save.timestamp}")
            print(f"TimeCodeML - {save.timestampML}")
            print(f"FileName - {save.path}")
            print(f"DetectedClassId - {save.cls}")
    """

    human_saved = post_processing(
        frames, fps, vid_stride, save_path=f"../static/processed/frames_h/{video_id}"
    )

    """
    if len(human_saved) > 0:
        for key in human_saved:
            print(f"TimeCode - {human_saved[key].timestamp}")
            print(f"TimeCodeML - {human_saved[key].timestampML}")
            print(f"FileName - {human_saved[key].path}")
            print(f"DetectedClassId - {human_saved[key].cls}")
    """

    return saved, human_saved
