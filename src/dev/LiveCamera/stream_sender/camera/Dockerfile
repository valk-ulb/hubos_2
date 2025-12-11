FROM bluenviron/mediamtx:1-ffmpeg

# Files
COPY fake-video.mp4 /video.mp4
COPY mediamtx.yml /mediamtx.yml
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

