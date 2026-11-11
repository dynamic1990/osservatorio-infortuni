#!/usr/bin/env python3
"""Riallinea gli hash del registro artefatti agli artefatti su disco.

Il registro `scripts/ci/generated-artifacts.json` è il contratto che
`validate-generated-artifacts.py` verifica prima della pubblicazione: ogni
artefatto versionato deve avere il suo sha256 e la sua dimensione.

Ogni ETL che rigenera un artefatto deve poi riallineare la propria voce.
Questo script fa il lavoro in un colpo per tutti gli artefatti presenti nel
registro, così i singoli ETL non devono duplicare la logica.

Uso:
    python3 scripts/ci/aggiorna_registry.py            # aggiorna le voci esistenti
    python3 scripts/ci/aggiorna_registry.py --check    # non scrive, esce 1 se diverge
    python3 scripts/ci/aggiorna_registry.py --add <artifactId> <path>
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / "scripts" / "ci" / "generated-artifacts.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true",
                        help="non scrive: esce 1 se il registro diverge dagli artefatti")
    parser.add_argument("--add", nargs=2, metavar=("ARTIFACT_ID", "PATH"),
                        help="aggiunge una voce al registro")
    args = parser.parse_args()

    if not REGISTRY.exists():
        print(f"manca {REGISTRY.relative_to(ROOT)}", file=sys.stderr)
        return 1

    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    artifacts = registry.get("artifacts")
    if not isinstance(artifacts, list):
        print("registro senza lista 'artifacts'", file=sys.stderr)
        return 1

    if args.add:
        artifact_id, path_text = args.add
        path = ROOT / path_text
        if not path.is_file():
            print(f"artefatto inesistente: {path_text}", file=sys.stderr)
            return 1
        if any(a.get("path") == path_text for a in artifacts):
            print(f"voce già presente per {path_text}: uso la modalità normale", file=sys.stderr)
        else:
            artifacts.append({
                "artifactId": artifact_id,
                "path": path_text,
                "kind": "generated-json",
                "bytes": path.stat().st_size,
                "sha256": sha256(path),
            })
            print(f"[+] {artifact_id}: aggiunto")

    divergenti = []
    mancanti = []
    aggiornati = 0
    for entry in artifacts:
        path_text = entry.get("path")
        if not isinstance(path_text, str):
            continue
        path = ROOT / path_text
        if not path.is_file():
            mancanti.append(path_text)
            continue
        nuovo_sha = sha256(path)
        nuove_bytes = path.stat().st_size
        if entry.get("sha256") != nuovo_sha or entry.get("bytes") != nuove_bytes:
            divergenti.append(path_text)
            if not args.check:
                entry["sha256"] = nuovo_sha
                entry["bytes"] = nuove_bytes
                aggiornati += 1
                print(f"[~] {path_text}")

    if mancanti:
        print("\nAttenzione, artefatti nel registro ma assenti su disco:")
        for m in mancanti:
            print(f"  - {m}")

    if args.check:
        if divergenti or mancanti:
            print(f"\nDIVERGENZE: {len(divergenti)} hash, {len(mancanti)} mancanti", file=sys.stderr)
            return 1
        print(f"OK: {len(artifacts)} artefatti allineati")
        return 0

    if aggiornati:
        REGISTRY.write_text(
            json.dumps(registry, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        print(f"\nRegistro aggiornato: {aggiornati} voci")
    else:
        print("Nessuna modifica: registro già allineato")
    return 0


if __name__ == "__main__":
    sys.exit(main())
