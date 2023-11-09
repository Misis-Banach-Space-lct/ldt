import cv2
import matplotlib.pyplot as plt


def yaml_to_pixels(path: str, coords: list):
    image = cv2.imread(path)
    for coord in coords:
        x_center, y_center, width, height = coord[0], coord[1], coord[2], coord[3]

        x_min = int((x_center - width / 2) * image.shape[1])
        x_max = int((x_center + width / 2) * image.shape[1])
        y_min = int((y_center - height / 2) * image.shape[0])
        y_max = int((y_center + height / 2) * image.shape[0])

        cv2.rectangle(image, (x_min, y_min), (x_max, y_max), (255, 0, 0), 2)
    plt.imshow(image)
    return x_min, y_min, x_max, y_max


coords = [
    [0.54, 0.6466666666666666, 0.5275, 0.6866666666666666],
    [0.895, 0.7383333333333333, 0.15125, 0.5233333333333333],
    [0.408125, 0.555, 0.0975, 0.2816666666666667],
]

x1, y1, x2, y2 = yaml_to_pixels("telejka.jpg", coords)


def front_to_yaml(x: float, y: float, width: int, height: int, path: str):
    image = cv2.imread(path)
    x_center = (x + width / 2) / image.shape[1]
    y_center = (y - height / 2) / image.shape[0]
    n_width = width / image.shape[1]
    n_height = height / image.shape[0]
    return x_center, y_center, n_width, n_height


front_to_yaml(x1, y2, x2 - x1, y2 - y1, "telejka.jpg")
