import cv2
import subprocess
import os

input_url = os.getenv("INPUT_STREAM")
output_url = os.getenv("OUTPUT_STREAM")

# Haar cascade classifier (built into OpenCV)
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# Open RTSP input stream
cap = cv2.VideoCapture(input_url)

if not cap.isOpened():
    raise RuntimeError("ERROR: Cannot open input stream")

width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps    = cap.get(cv2.CAP_PROP_FPS) or 25

# FFmpeg command to publish RTSP
ffmpeg = subprocess.Popen([
    "ffmpeg",
    "-y",
    "-f", "rawvideo",
    "-pix_fmt", "bgr24",
    "-s", f"{width}x{height}",
    "-r", str(fps),
    "-i", "-",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-f", "rtsp",
    output_url
], stdin=subprocess.PIPE)

while True:
    ret, frame = cap.read()
    if not ret:
        continue

    # Convert to grayscale for face detection
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Detect faces
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    # Blur each detected face
    for (x, y, w, h) in faces:
        roi = frame[y:y+h, x:x+w]
        roi_blur = cv2.GaussianBlur(roi, (51, 51), 0)
        frame[y:y+h, x:x+w] = roi_blur

    # Send frame to FFmpeg
    ffmpeg.stdin.write(frame.tobytes())
