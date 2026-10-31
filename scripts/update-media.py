"""Prepare static previews from the exact PokéAPI artwork/game image."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
from io import BytesIO
import json
import re
from pathlib import Path
import tempfile
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PREFIX = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"
SIZES = (160, 320, 640)
parser = argparse.ArgumentParser()
parser.add_argument("--data-dir", type=Path, default=ROOT / "public/data")
parser.add_argument("--refresh", action="store_true")
args = parser.parse_args()
output = ROOT / "public/media/pokemon"
output.mkdir(parents=True, exist_ok=True)
catalog_path = ROOT / "src/lib/media-data.json"
previous = json.loads(catalog_path.read_text(encoding="utf-8")) if catalog_path.exists() else {}
urls = set()
for path in args.data_dir.glob("generation-*.json"):
    for pokemon in json.loads(path.read_text(encoding="utf-8"))["pokemon"]:
        sources = [pokemon["image"], *pokemon.get("historicalArtworks", {}).values()]
        sources.extend(url for sprite in pokemon["gameSprites"].values() for url in sprite.values())
        urls.update(url for url in sources if url and url.startswith(PREFIX) and
                    ("/official-artwork/" in url or url.endswith((".webp", ".gif"))))
if not urls:
    raise SystemExit("No image sources found; keeping the existing catalog.")
for path in args.data_dir.glob("media-*.json"):
    for games in json.loads(path.read_text(encoding="utf-8"))["images"].values():
        urls.update(url for sprite in games.values() for url in sprite.values() if url and url.startswith(PREFIX) and url.endswith((".webp", ".gif")))

cache = Path(tempfile.gettempdir()) / "pokemetrics-media-cache-v1"
cache.mkdir(exist_ok=True)

def prepare(url):
    key = url.removeprefix(PREFIX)
    old = previous.get(key)
    if not args.refresh and old and (old.get("missing") or all((output / f'{old["hash"]}-{size}.webp').is_file() for size in SIZES)):
        return key, old
    cached_file = cache / sha256(url.encode()).hexdigest()
    if cached_file.exists() and not args.refresh:
        data = cached_file.read_bytes()
    else:
        try:
            with urlopen(Request(url, headers={"User-Agent": "Pokemetrics-media-preparer"}), timeout=60) as response:
                data = response.read()
        except HTTPError as error:
            if error.code == 404:
                return key, {"missing": True}
            raise
        cached_file.write_bytes(data)
    digest = sha256(b"pokemetrics-preview-v1" + data).hexdigest()[:20]
    with Image.open(BytesIO(data)) as image:
        animated = getattr(image, "is_animated", False)
        image.seek(0)
        frame = image.convert("RGBA")
        for size in SIZES:
            preview = frame.copy()
            preview.thumbnail((size, size), Image.Resampling.LANCZOS)
            preview.save(output / f"{digest}-{size}.webp", "WEBP", quality=82, method=5)
    return key, {"hash": digest, "animated": animated}

catalog = {}
with ThreadPoolExecutor(max_workers=4) as pool:
    for index, (key, entry) in enumerate(pool.map(prepare, sorted(urls)), 1):
        catalog[key] = entry
        if index % 100 == 0:
            print(f"Previews: {index}/{len(urls)}", flush=True)
# A failed download never replaces the last complete manifest.
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
groups = {}
for key, entry in catalog.items():
    match = re.match(r"^versions/(generation-[a-z]+)/([a-z0-9-]+)/", key)
    group = "-".join(match.groups()) if match else "artwork"
    groups.setdefault(group, {})[key] = entry
group_directory = ROOT / "public/media/catalogs"
group_directory.mkdir(exist_ok=True)
for group, entries in groups.items():
    (group_directory / (group + ".json")).write_text(json.dumps(entries, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"Prepared {len(catalog)} sources, {sum(entry.get('animated', False) for entry in catalog.values())} animations.")
