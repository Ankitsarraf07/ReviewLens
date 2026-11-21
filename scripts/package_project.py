"""Create a source-only assessment ZIP without local secrets or runtime data."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
import os

root = Path(__file__).resolve().parents[1]
destination = root.parent / "reviewlens-submission.zip"
excluded_dirs = {".git", "node_modules", ".next", "output", "tmp", "coverage", ".codex", ".agents", "__pycache__"}

def included(path):
    relative = path.relative_to(root)
    if any(part in excluded_dirs for part in relative.parts):
        return False
    if path.name.startswith(".env") and path.name != ".env.example":
        return False
    if path.name == "AGENTS.md" or path.name == "next-env.d.ts":
        return False
    if path.name.endswith((".db", ".db-wal", ".db-shm", ".tsbuildinfo", ".zip", ".log", ".pem")):
        return False
    return path.is_file()

with ZipFile(destination, "w", ZIP_DEFLATED) as archive:
    for directory, folders, files in os.walk(root):
        folders[:] = sorted(folder for folder in folders if folder not in excluded_dirs)
        for filename in sorted(files):
            path = Path(directory) / filename
            if included(path):
                archive.write(path, Path("reviewlens") / path.relative_to(root))
with ZipFile(destination) as archive:
    entries = archive.namelist()
    assert "reviewlens/.env.example" in entries
    assert not any(Path(name).name.startswith(".env") and Path(name).name != ".env.example" for name in entries)
    assert archive.testzip() is None
    local_env = root / ".env.local"
    if local_env.exists():
        for line in local_env.read_text(encoding="utf-8-sig").splitlines():
            if line.startswith("GEMINI_API_KEY="):
                key = line.split("=", 1)[1].strip().strip("\"'")
                if key and key != "your_api_key_here":
                    assert all(key.encode() not in archive.read(name) for name in entries), "A local API key was found in the ZIP."
print(f"Created {destination} ({len(entries)} source files; no real environment files or runtime databases).")
