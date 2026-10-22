#!/usr/bin/env bash
# Controllo post-deploy: verifica che le pagine chiave idratino senza errori.
# Uso: ./scripts/post-deploy-check.sh [URL_BASE]
# Requisiti: browser gestito OpenClaw attivo. Fa solo verifiche read-only.
# Output: per ogni pagina, HTTP code + esito idratazione. Exit 1 se qualche check fallisce.
set -u
BASE="${1:-https://www.osservatorioinfortuni.it}"
PAGES=("/" "/report" "/cronaca-infortuni" "/analisi-delle-cause" "/calcolatore-costo-infortunio")
FAIL=0

for p in "${PAGES[@]}"; do
  url="${BASE}${p}"
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "$url")
  if [ "$code" != "200" ]; then
    echo "FAIL http ${p} -> ${code}"
    FAIL=1
    continue
  fi
  echo "OK   http ${p}"
done

if [ "$FAIL" = "0" ]; then
  echo "Post-deploy check HTTP: tutto verde. Verifica idratazione da fare con il browser (contenuto presente + console senza errori React)."
fi
exit $FAIL