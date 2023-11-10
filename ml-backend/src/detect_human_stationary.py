import cv2


class DetectedHumanObject:
    def __init__(self, detected_obj_id: int, cls: int):
        self.detected_obj_id = detected_obj_id
        self.cls = cls
        self.max_x = -1.0
        self.max_y = -1.0
        self.min_x = 38259285289.0
        self.min_y = 38259285289.0
        self.frame_counts = 0
        self.start_frame = 0
        self.end_frame = 0
        self.first_x1 = 0
        self.first_y1 = 0
        self.first_x2 = 0
        self.first_y2 = 0
        self.path = []

        self.timestamp = 0
        self.timestampML = 0


def count_objects(result_after_tracking: list, fps: float, vid_stride: int) -> dict:
    res = result_after_tracking
    objects = {}
    num_frame = 0
    for result in res:
        num_frame += 1
        for obj in result.boxes.data:
            if int(obj[-1]) != 3:
                continue
            id = int(obj[4])
            x1, y1, x2, y2 = obj[:4]

            if id not in objects.keys():
                cls = int(obj[-1])
                objects[id] = DetectedHumanObject(id, cls)
                objects[id].start_frame = num_frame

                objects[id].first_x1 = x1
                objects[id].first_y1 = y1
                objects[id].first_x2 = x2
                objects[id].first_y2 = y2

            objects[id].frame_counts += 1
            objects[id].end_frame = num_frame

            objects[id].max_x = float(max(objects[id].max_x, x1, x2))
            objects[id].max_y = float(max(objects[id].max_y, y1, y2))
            objects[id].min_x = float(min(objects[id].min_x, x1, x2))
            objects[id].min_y = float(min(objects[id].min_y, y1, y2))

            timestamp_ml = num_frame * (1 / fps)
            timestamp_orig = timestamp_ml * vid_stride
            objects[id].timestamp = timestamp_orig
            objects[id].timestampML = timestamp_ml

    return objects


def select_objects(
    objects: dict, result_after_tracking: list, vid_stride: int, save_path: str
) -> dict[int, DetectedHumanObject]:
    if len(result_after_tracking) * vid_stride < 2600:  # меньше 2 минут
        print(
            "Видео слишком короткое для корректного выявления для стационарных торговцев, могут быть ошибки!"
        )
    preds: dict[int, DetectedHumanObject] = {}

    all_frames = len(result_after_tracking)
    boundary_zone = int(
        min(
            result_after_tracking[0].orig_shape[0],
            result_after_tracking[0].orig_shape[1],
        )
        / 4
    )
    frequency_occurrence = 0.4
    fullness = 0.4

    for _, obj in objects.items():
        criterion = [False, False, False]
        # criterion1 = False
        # criterion2 = False
        if (
            obj.max_x - obj.min_x < boundary_zone
            or obj.max_y - obj.min_y < boundary_zone
        ):
            criterion[0] = True
            # print(f'Объект {obj.id} стоял примерно в одной области')
        if (obj.end_frame - obj.start_frame) > 0 and obj.frame_counts / (
            obj.end_frame - obj.start_frame
        ) > fullness:
            criterion[1] = True
            # print(f'Объект {obj.id} хорошо детектился')
        if obj.frame_counts / all_frames > frequency_occurrence:
            criterion[2] = True
            # print(f'Объект {obj.id} был более, чем в половине видео')
        if False not in criterion:
            obj.path.append(save_path + f"/{obj.detected_obj_id}" + ".jpg")
            preds[obj.detected_obj_id] = obj

    return preds


def show(preds: dict, result_after_tracking: list):
    for _, obj in preds.items():
        image = result_after_tracking[obj.start_frame].orig_img.copy()
        cv2.rectangle(
            image,
            (int(obj.first_x1) + 1, int(obj.first_y1) + 1),
            (int(obj.first_x2) + 1, int(obj.first_y2) + 1),
            (0, 0, 255),
            2,
        )
        # cv2.putText(image, 'StacionarnyTorgovec', (int(obj.first_x1), int(obj.first_y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (36, 255 , 12), 2)
        cv2.imwrite(obj.path, image)


def post_processing(
    result_after_tracking: list, fps: float, vid_stride: int, save_path: str
) -> dict:
    objects = count_objects(result_after_tracking, fps, vid_stride)
    preds = select_objects(objects, result_after_tracking, vid_stride, save_path)
    print(preds.keys(), ": Возможные торговцы")
    show(preds, result_after_tracking)

    return preds
