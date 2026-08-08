#!/bin/sh
# אימות → פליטת רשומות → כתיבה. עוצר על כל כישלון.
set -e
F="$1"
node scripts/validateExtraction.mjs "$F"
rm -rf /tmp/recs && node scripts/validateExtraction.mjs "$F" --emit /tmp/kept.json >/dev/null
node scripts/emitKbRecords.mjs /tmp/kept.json /tmp/recs | tail -3
node scripts/tools/loadKb.mjs /tmp/recs
