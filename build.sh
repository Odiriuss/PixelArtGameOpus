#!/bin/sh
# The Hourglass City: concatenates src/ into the single self-contained page
cd "$(dirname "$0")"
OUT="hourglass_city.html"
{ cat src/00_head.html; for f in $(ls src/*.js | sort); do cat "$f"; printf '\n'; done; printf '</script>\n</body>\n</html>\n'; } > "$OUT"
echo "built $OUT: $(wc -c < "$OUT") bytes"
