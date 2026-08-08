#!/bin/sh
# MedScan — SessionStart inbox scanner.
# Prints any new prompt files waiting in prompts/inbox/ so Claude Code
# notices them automatically at session start (stdout is injected into context).
L=$(ls -1 prompts/inbox/*.md 2>/dev/null | grep -vi readme)
if [ -n "$L" ]; then
  echo "[MedScan] נמצאו פרומפטים חדשים ב-prompts/inbox/ — בצע אותם לפי הפרוטוקול ב-CLAUDE.md (אחד-אחד, npm run build + create_checkpoint אחרי כל שלב, ואז העבר ל-prompts/done/):"
  echo "$L"
fi
true
