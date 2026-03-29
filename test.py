#!/usr/bin/env python3
"""Smoke test: production build must succeed."""
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)


def main() -> int:
    if not os.path.isdir(os.path.join(ROOT, "node_modules")):
        subprocess.check_call("npm install", shell=True)
    subprocess.check_call("npm run build", shell=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
