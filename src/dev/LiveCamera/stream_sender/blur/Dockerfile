FROM python:3.10-slim

RUN apt-get update && apt-get install -y ffmpeg && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN pip install opencv-python numpy

COPY blur.py /blur.py

CMD ["python", "/blur.py"]