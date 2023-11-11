import random
import numpy as np
import torch
from ultralytics import RTDETR
from ultralytics import YOLO
import cv2
from pydantic import BaseModel
import os
from src.detect_stationary import save_cadrs
from src.detect_human_stationary import post_processing
from src.dbscan_moving import moving_count, otbor
from src.track_stream import save_cadrs as save_cadrs_stream, check_person
from src.dbscan_stream import moving_stream

random.seed(42)
np.random.seed(42)
torch.manual_seed(42)

names = {0: "animal", 1: "balloon", 2: "cart", 3: "person"}


class MlResult(BaseModel):
    fileName: list
    videoId: int
    timeCode: float
    timeCodeMl: float
    detectedClassId: int


class MlResultStream(BaseModel):
    fileName: list
    videoId: int
    timeCode: float
    detectedClassId: int


def process(video_id: int, video_path: str, rtsp: bool = False):
    model = YOLO("weights/model.pt")
    model_predictor = RTDETR("weights/model_predictor.pt")
    model_cart = YOLO("weights/yolov8n.pt")

    if rtsp:
        try:
            os.mkdir(f"../static/processed/s_frames/{video_id}")
        except Exception as e:
            print(str(e))
        try:
            os.mkdir(f"../static/processed/s_frames_h/{video_id}")
        except Exception as e:
            print(str(e))
        try:
            os.mkdir(f"../static/processed/s_frames_a/{video_id}")
        except Exception as e:
            print(str(e))

        with torch.no_grad():
            results = model.track(
                source="rtsp://admin:A1234567@188.170.176.190:8031/Streaming/Channels/101?transportmode=unicast&profile=Profile_1",
                # save=True,
                stream=True,
                tracker="bytetrack.yaml",
                classes=[1, 2, 3],
            )
            num_frame = 0
            for res in results:
                num_frame += 1
                objects = {}
                people = {}
                print("Кадр обрабатывается")
                saved = save_cadrs_stream(
                    res,
                    model_predictor,
                    model_cart,
                    save_path=f"../static/processed/s_frames/{video_id}",
                    num_frame=num_frame,
                    objects=objects,
                ).values()
                savedModels = [
                    MlResultStream(
                        fileName=[path.replace("../", "") for path in obj.path],
                        videoId=video_id,
                        detectedClassId=obj.cls,
                        timeCode=obj.timestamp,
                    )
                    for obj in saved
                ]
                """
                if len(saved) > 0:
                    for key in saved:
                        # print(f"TimeCode - {saved[key].timestamp}")
                        # print(f"TimeCodeML - {saved[key].timestampML}")
                        print(f"FileName - {saved[key].path}")
                        # print(f"DetectedClassId - {saved[key].cls}")
                """

                human_saved = check_person(
                    res,
                    num_frames=num_frame,
                    people=people,
                    save_path=f"../static/processed/s_frames_h/{video_id}",
                ).values()
                humanModels = [
                    MlResultStream(
                        fileName=[path.replace("../", "") for path in obj.path],
                        videoId=video_id,
                        timeCode=obj.timestamp,
                        detectedClassId=obj.cls,
                    )
                    for obj in human_saved
                ]

                actives = {}
                active_saved = moving_stream(
                    res,
                    num_frames=num_frame,
                    objects3=actives,
                    save_path=f"../static/processed/s_frames_a/{video_id}",
                ).values()
                activeModels = [
                    MlResultStream(
                        fileName=[path.replace("../", "") for path in obj.path],
                        videoId=video_id,
                        timeCode=obj.timestamp,
                        detectedClassId=obj.cls,
                    )
                    for obj in active_saved
                ]

    else:
        cap = cv2.VideoCapture(f"../{video_path}")
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_cnt = cap.get(cv2.CAP_PROP_FRAME_COUNT)
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
            )
            for res in results:
                frames.append(res)

        try:
            os.mkdir(f"../static/processed/frames/{video_id}")
        except Exception as e:
            print(str(e))
        try:
            os.mkdir(f"../static/processed/frames_a/{video_id}")
        except Exception as e:
            print(str(e))
        try:
            os.mkdir(f"../static/processed/frames_h/{video_id}")
        except Exception as e:
            print(str(e))

        saved = save_cadrs(
            # video_id=1,
            result_after_track=frames,
            model_predictor=model_predictor,
            model_cart=model_cart,
            fps=fps,
            vid_stride=vid_stride,
            save_path=f"../static/processed/frames/{video_id}",
        )

        savedModels = [
            MlResult(
                fileName=[path.replace("../", "") for path in obj.path],
                videoId=video_id,
                detectedClassId=obj.cls,
                timeCode=obj.timestamp,
                timeCodeMl=obj.timestampML,
            )
            for obj in saved
        ]

        """
        if len(saved) > 0:
            for save in saved:
                print(f"TimeCode - {save.timestamp}")
                print(f"TimeCodeML - {save.timestampML}")
                print(f"FileName - {save.path}")
                print(f"DetectedClassId - {save.cls}")
        """

        human_saved = post_processing(
            frames,
            fps,
            vid_stride,
            save_path=f"../static/processed/frames_h/{video_id}",
        )
        humanModels = [
            MlResult(
                fileName=[path.replace("../", "") for path in obj.path],
                videoId=video_id,
                timeCode=obj.timestamp,
                timeCodeMl=obj.timestampML,
                detectedClassId=obj.cls,
            )
            for obj in human_saved.values()
        ]

        """
        if len(human_saved) > 0:
            for key in human_saved:
                print(f"TimeCode - {human_saved[key].timestamp}")
                print(f"TimeCodeML - {human_saved[key].timestampML}")
                print(f"FileName - {human_saved[key].path}")
                print(f"DetectedClassId - {human_saved[key].cls}")
        """

        objects_active = moving_count(frames, fps=fps, vid_stride=vid_stride)
        active_saved = otbor(
            objects_active, save_path=f"../static/processed/frames_a/{video_id}"
        )
        activeModels = [
            MlResult(
                fileName=[path.replace("../", "") for path in obj.path],
                videoId=video_id,
                timeCode=obj.timestamp,
                timeCodeMl=obj.timestampML,
                detectedClassId=obj.cls,
            )
            for obj in active_saved
        ]

        return savedModels, humanModels, activeModels
