"""Preserve modest YouTube thumbnails separately from offline site builds."""
import concurrent.futures
import datetime
import hashlib
import json
from pathlib import Path
import urllib.request

root = Path(__file__).resolve().parent.parent
manifest = root / 'content/talk-thumbnails.json'
previous = json.loads(manifest.read_text()) if manifest.exists() else {}
videos = {}
for source in ['boston-haskell-videos.json', 'external-talks.json']:
    for video in json.loads((root / 'content' / source).read_text())['videos']:
        videos[video['videoId']] = video

def preserve(video_id):
    relative = f'assets/talk-thumbnails/{video_id}.jpg'
    target = root / 'content' / relative
    if video_id in previous and target.exists():
        return video_id, previous[video_id]
    url = f'https://i.ytimg.com/vi/{video_id}/mqdefault.jpg'
    if target.exists():
        data = target.read_bytes()
        mime = 'image/jpeg'
    else:
        try:
            with urllib.request.urlopen(url, timeout=30) as response:
                data = response.read()
                mime = response.headers.get_content_type()
        except urllib.error.HTTPError as error:
            return video_id, dict(url=url, error=f'HTTP {error.code}', retrieved=datetime.date.today().isoformat())
    if mime != 'image/jpeg' or not data.startswith(b'\xff\xd8'):
        raise ValueError(f'Unexpected thumbnail response for {video_id}')
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return video_id, dict(path=relative, url=url, bytes=len(data), sha256=hashlib.sha256(data).hexdigest(), retrieved=datetime.date.today().isoformat())

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    records = dict(pool.map(preserve, videos))
manifest.write_text(json.dumps(records, indent=2) + '\n')
print(f'Preserved {sum('path' in r for r in records.values())} thumbnails ({sum(r.get("bytes", 0) for r in records.values()):,} bytes).')

for video_id, record in records.items():
    if 'error' in record: print(video_id, record['error'])
