#!/bin/sh
# the test level: the shared engine (rasteriser, lighting, people, audio, fx) + its own sources, as one file
cd "$(dirname "$0")"
OUT="hourglass_testlevel.html"
{ cat src_test/t00_head.html
  for f in 01_core 02_font 03_iso 04_people 05_engine 08_audio 10_textures 11_fx 12_props; do cat "src/$f.js"; printf '\n'; done
  for f in $(ls src_test/*.js | sort); do cat "$f"; printf '\n'; done
  printf '</script>\n</body>\n</html>\n'; } > "$OUT"
echo "built $OUT: $(wc -c < "$OUT") bytes"
