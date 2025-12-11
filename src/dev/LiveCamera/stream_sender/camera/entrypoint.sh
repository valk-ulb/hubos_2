#!/bin/sh

# Start MediaMTX in the background
/mediamtx &

sleep 2

# Loop video into the RTSP feed
ffmpeg -re -stream_loop -1 -i /video.mp4 -c copy -f rtsp rtsp://localhost:8554/mystream
