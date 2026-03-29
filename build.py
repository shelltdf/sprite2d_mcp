#!/usr/bin/env python3
"""Install npm deps and production-build the Vue app."""
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)


def run(cmd: str) -> None:
    print(f"+ {cmd}", flush=True)
    subprocess.check_call(cmd, shell=True)


def main() -> int:
    if not os.path.isfile(os.path.join(ROOT, "package.json")):
        print("package.json not found", file=sys.stderr)
        return 1
    if os.path.isdir(os.path.join(ROOT, "node_modules")):
        run("npm run build")
    else:
        run("npm install")
        run("npm run build")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
