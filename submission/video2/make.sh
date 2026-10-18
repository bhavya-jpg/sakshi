#!/bin/bash
# Reproducible build of sakshi_explainer.mp4 from film.html + vo/*.wav
set -euo pipefail
cd "$(dirname "$0")"
RENDER=${RENDER:-../video/tools/render-frames.mjs}
node build-timeline.mjs
node build-audio.mjs
node build-srt.mjs
T=$(node -e 'console.log(JSON.parse(require("fs").readFileSync("timeline.js","utf8").replace(/^window.TL=/,"").replace(/;\s*$/,"")).total)')
node "$RENDER" "$PWD/film.html" "$PWD/build/film_video.mp4" "$T"
ffmpeg -v error -y -i build/film_video.mp4 -i build/mix.wav -i sakshi_explainer.srt -map 0:v -map 1:a -map 2:s \
  -c:v copy -c:a aac -b:a 192k -c:s mov_text -metadata:s:s:0 language=eng -t "$T" -movflags +faststart sakshi_explainer.mp4
ffprobe -v error -show_entries format=duration,size -of compact sakshi_explainer.mp4
