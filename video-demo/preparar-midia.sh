#!/usr/bin/env bash
# Extrai quadros (30 fps) das mídias reais do portfólio para a composição ler
# como imagens: assim cada quadro do vídeo final é determinístico, sem
# depender de seek de <video> no navegador.
set -euo pipefail
cd "$(dirname "$0")"
R=..
C=.cache
mkdir -p "$C"
extrai() { # nome fonte filtro segundos
  local nome=$1 fonte=$2 filtro=$3 dur=${4:-8}
  [ -d "$C/$nome" ] && return
  mkdir -p "$C/$nome"
  ffmpeg -v error -y -t "$dur" -i "$fonte" -vf "fps=30,$filtro" -q:v 3 "$C/$nome/%04d.jpg"
  echo "$nome: $(ls "$C/$nome" | wc -l) quadros"
}
# Ganwalk e Dezert Horse: capturados ao vivo por capture-site.mjs (ver README).
extrai pinkh "$R/pink-opala-preview/horizontal.mp4" "scale=1600:-2" 8
extrai pinkv "$R/pink-opala-preview/vertical.mp4" "scale=1080:-2" 8
extrai intranet "$R/public/videos/intranet-preview.mp4" "scale=1440:-2" 9
extrai lpvideo "$R/public/videos/landing-pages-preview.mp4" "scale=960:-2" 7
extrai cagumela "$R/public/videos/cagumela-ceu.mp4" "scale=720:-2" 8
extrai musica "$R/public/videos/0824.mp4" "scale=540:-2" 8
