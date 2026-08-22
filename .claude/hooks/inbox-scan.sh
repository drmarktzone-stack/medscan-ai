#!/bin/sh
# Reports waiting prompts. Does not mean "execute them".
# Execute only if the doctor asked in chat or ran /inbox. See CLAUDE.md.
L=$(ls -1 prompts/inbox/*.md 2>/dev/null | grep -vi readme)
H=$(ls -1 prompts/hold/*.md 2>/dev/null | grep -vi readme)
if [ -n "$L" ]; then
  echo "[MedScan] יש קבצים ב-prompts/inbox/. אל תבצע אותם אלא אם הרופא ביקש או הקליד /inbox:"
  echo "$L"
fi
if [ -n "$H" ]; then
  echo "[MedScan] prompts/hold/ מוקפא עד שהרופא ישחרר:"
  echo "$H"
fi
true
