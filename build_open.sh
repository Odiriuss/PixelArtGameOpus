#!/bin/sh
# the open city: the shared engine (rasteriser, lighting, people, audio, fx), the test level's cars, physics, AI
# drivers, walk grid, effects and sounds, then its own sources, as one file
cd "$(dirname "$0")"
OUT="hourglass_opencity.html"
{ cat src_open/o00_head.html
  for f in 01_core 02_font 03_iso 04_people 05_engine 08_audio 10_textures 11_fx 12_props; do cat "src/$f.js"; printf '\n'; done
  for f in t20_carmodels t22_physics t23_ai t33_goons t40_fx t41_audio; do cat "src_test/$f.js"; printf '\n'; done
  for f in $(ls src_open/*.js | sort); do cat "$f"; printf '\n'; done
  printf '</script>\n</body>\n</html>\n'; } > "$OUT"
echo "built $OUT: $(wc -c < "$OUT") bytes"
