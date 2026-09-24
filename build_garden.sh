#!/bin/sh
# Ravenshore Garden (the cinematic loop): concatenates src_garden/ into the single self-contained page
cd "$(dirname "$0")/src_garden"
OUT="../ravenshore_garden.html"
{ cat 00_head.html; for f in 01_core.js 02_sky.js 03_far.js 04_mid_hill.js 05_garden.js 06_garden_dyn.js 07_timeline.js 08_woman.js 09_robot.js 10_particles.js 11_fg_car.js 12_main.js; do cat "$f"; done; printf '</script>\n</body>\n</html>\n'; } > "$OUT"
echo "built ravenshore_garden.html: $(wc -c < "$OUT") bytes"
