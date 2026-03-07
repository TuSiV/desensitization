#!/usr/bin/env bash
set -euo pipefail

LLVM_WINDRES="/Users/chen/Library/xPacks/@xpack-dev-tools/clang/21.1.8-1.1/.content/bin/llvm-windres"

for arg in "$@"; do
  if [[ "$arg" == "-V" || "$arg" == "/?" ]]; then
    echo "GNU windres (llvm-windres wrapper)"
    exit 0
  fi
done

exec "$LLVM_WINDRES" --target=pe-x86-64 "$@"
