FROM python:3.11.2-buster
WORKDIR /app

COPY requirements.txt requirements.txt

RUN apt-get update
RUN apt-get update && apt-get install ffmpeg libsm6 libxext6 -y
RUN pip install -r requirements.txt

COPY . /app
RUN ls

# CMD ["python3", "./src/main.py"]
CMD ["python3", "-m", "celery", "-A", "worker", "worker", "-l", "info"]