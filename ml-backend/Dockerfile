FROM python:3.11.2
WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt

RUN apt-get update
RUN apt-get update && apt-get install ffmpeg libsm6 libxext6 -y

COPY . /app

CMD ["python3", "ml.py"]
# CMD ["python3", "-m", "celery", "-A", "worker", "worker", "-l", "info"]