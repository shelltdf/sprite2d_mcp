#!/usr/bin/env python3
"""Build and zip dist/ into dist-release.zip."""
import os
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)


def main() -> int:
    import subprocess

    if not (ROOT / "node_modules").is_dir():
        subprocess.check_call("npm install", shell=True)
    subprocess.check_call("npm run build", shell=True)
    dist = ROOT / "dist"
    if not dist.is_dir():
        print("dist/ missing after build", file=sys.stderr)
        return 1
    out = ROOT / "dist-release.zip"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in dist.rglob("*"):
            if path.is_file():
                arc = path.relative_to(dist).as_posix()
                zf.write(path, arc)
    print(f"Wrote {out}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
