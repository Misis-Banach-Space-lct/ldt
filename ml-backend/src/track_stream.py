import torch
import time
import cv2

frames = []
objects = {}
names = {0: "animal", 1: "balloon", 2: "cart", 3: "person"}


class DetectObjectsStream:
    def __init__(self, detected_obj_id: int, cls: int):
        self.detected_obj_id = detected_obj_id
        self.cls = cls
        self.cnt = 0
        self.start = 0
        self.path = ""
        self.conf = 0


def check_cart(model_cart, image_path: str) -> bool:
    check = model_cart.predict(source=image_path, classes=[1, 2, 3, 5, 6, 7])
    for obj in check[0].boxes.data:
        if obj[-2] > 0.5:
            print("да, это велосипед\машина и т.д.")
            return False
    return True


def process_cadr(
    result_model_predictor: list, start_conf: float, image_path: str, model_cart
) -> list:
    coords = []
    res = result_model_predictor[0].boxes
    for obj in res.data:
        # print(obj[-2], start_conf)
        if int(obj[-1]) == 2:
            if check_cart(model_cart, image_path) == False:
                continue
        if (obj[-2] + start_conf) / 2 > 0.6 or obj[-2] > 0.77:
            coords.append(obj[:4])
    return coords


def save_cadrs(result_after_track: list, model_predictor, model_cart):
    cadr = result_after_track

    for obj in cadr.boxes.data:
        if int(obj[-1]) == 3 or int(obj[-1]) == 0:
            continue

        id = float(obj[4])
        if not id in objects.keys():
            objects[id] = DetectObjectsStream(id, int(obj[-1]))
            objects[id].start = time.time()

        if objects[id].cnt < 20 or obj[-2] > objects[id].conf:
            objects[id].conf = obj[-2]
            objects[id].cnt += 1
            image = cadr.orig_img.copy()

            x1 = int(max(obj[0] - abs(obj[0] - obj[2]) / 4, 0))
            x2 = int(min(obj[2] + abs(obj[0] - obj[2]) / 4, cadr.orig_shape[1]))
            y1 = int(max(obj[1] - abs(obj[1] - obj[3]) / 4, 0))
            y2 = int(min(obj[3] + abs(obj[0] - obj[2]) / 4, cadr.orig_shape[0]))

            crop_img = image[y1:y2, x1:x2]
            coordinates = process_cadr(
                model_predictor.predict(source=crop_img, classes=[1, 2]),
                obj[-2],
                crop_img,
                model_cart,
            )

            if len(coordinates) > 0:
                for coodninate in coordinates:
                    cv2.rectangle(
                        crop_img,
                        (int(coodninate[0]), int(coodninate[1])),
                        (int(coodninate[2]), int(coodninate[3])),
                        (0, 0, 255),
                        2,
                    )
                    cv2.putText(
                        crop_img,
                        names[objects[id].cls],
                        (int(coodninate[0]), int(coodninate[1]) + 10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.9,
                        (36, 255, 12),
                        2,
                    )
                image[y1:y2, x1:x2] = crop_img
                cv2.imwrite("./xxx/" + str(objects[id].cnt) + ".jpg", image)
                objects[id].path = "./xxx/" + str(objects[id].cnt) + ".jpg"

    # cadrs = []
    # for _, obj in objects.items():
    #     if obj.path != '':
    #       cadrs.append(obj)
    # return cadrs
    return objects


# VID_STRIDE = 5
#
# with torch.no_grad():
#     results = model.track(
#         source="rtsp://admin:A1234567@188.170.176.190:8027/Streaming/Channels/101?transportmode=unicast&profile=Profile_1",
#         save=True,
#         stream=True,
#         tracker="bytetrack.yaml",
#         classes=[1, 2, 3],
#     )
#     for res in results:
#         print("Кадр обрабатывается")
#         saved = save_cadrs(res, model_predictor, model_cart)
