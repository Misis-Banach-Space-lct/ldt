import cv2


class DetectedObject:
    def __init__(self, detected_obj_id: int, cls: int):
        self.detected_obj_id = detected_obj_id
        self.cls = cls
        self.cnt = 0
        self.start = 0
        self.path = []
        self.conf = 0

        self.timestamp = 0
        self.timestampML = 0


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
        # if (obj[-2] + start_conf) / 2 > 0.6 or obj[-2] > 0.77:
        if (obj[-2] + start_conf) / 2 > 0.5:
            coords.append(obj[:4])
    return coords


def save_cadrs(
    result_after_track: list,
    model_predictor,
    model_cart,
    fps: float,
    vid_stride: int,
    save_path: str,
) -> list[DetectedObject]:
    res = result_after_track
    objects: dict[int, DetectedObject] = {}

    num_cadr = 0
    for cadr in res:
        num_cadr += 1
        for obj in cadr.boxes.data:
            if int(obj[-1]) == 3 or int(obj[-1]) == 0:
                continue

            id = int(obj[4])
            if not id in objects.keys():
                objects[id] = DetectedObject(id, int(obj[-1]))
                objects[id].start = num_cadr

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
                        # cv2.putText(crop_img, names[objects[id].cls], (int(coodninate[0]), int(coodninate[1]) + 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (36, 255 , 12), 2)
                    image[y1:y2, x1:x2] = crop_img

                    timestamp_ml = num_cadr * (1 / fps)
                    timestamp_orig = timestamp_ml * vid_stride

                    cv2.imwrite(save_path + f"/{num_cadr}" + ".jpg", image)
                    objects[id].path.append(save_path + f"/{num_cadr}" + ".jpg")

                    objects[id].timestamp = timestamp_orig
                    objects[id].timestampML = timestamp_ml

    cadrs: list[DetectedObject] = []
    for _, obj in objects.items():
        if obj.path != []:
            cadrs.append(obj)
    return cadrs
