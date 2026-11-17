#!/bin/bash
# Klik dua kali (Mac) atau jalankan ./mulai-editor.command (Linux) untuk membuka editor.
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js belum terpasang. Unduh di https://nodejs.org lalu jalankan file ini lagi."
  read -r -p "Tekan Enter untuk menutup…"
  exit 1
fi
( sleep 1; (open "http://localhost:4173/editor/" || xdg-open "http://localhost:4173/editor/") >/dev/null 2>&1 ) &
node scripts/dev.js
