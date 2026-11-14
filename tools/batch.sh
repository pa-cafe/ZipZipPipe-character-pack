#!/usr/bin/env bash
# Generates and packs the listed characters one after another. Usage: tools/batch.sh <id>...
cd "$(dirname "$0")/.."
for id in "$@"; do
  mkdir -p "work/$id"
  node tools/gen.mjs "$id" --jobs 4 >> "work/$id/gen.out" 2>&1
  node tools/pack.mjs "$id" >> "work/$id/gen.out" 2>&1
  tail -1 "work/$id/gen.out"
done
