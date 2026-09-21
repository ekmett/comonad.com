"""Exercise a running native companion server against independent zlib results."""
import json
import urllib.error
import urllib.parse
import urllib.request
import zlib

root = 'http://127.0.0.1:8081'
count = 0
for message in ['', '123456789', '12345689', 'λ → Haskell 🦀', '\0\xff', '<>&"']:
    data = message.encode()
    for split in sorted(set([0, len(data) // 2, len(data)])):
        query = urllib.parse.urlencode({'message': message, 'split': split})
        with urllib.request.urlopen(root + '/crc?' + query) as response:
            result = json.load(response)
        assert result == {'direct': zlib.crc32(data), 'combined': zlib.crc32(data), 'bytes': len(data)}
        count += 1
for path, status in [('/missing', 404), ('/crc?split=-1', 400), ('/crc?split=bad', 400), ('/crc?message=a&split=2', 400)]:
    try:
        urllib.request.urlopen(root + path)
        raise AssertionError('Expected an error response')
    except urllib.error.HTTPError as error:
        assert error.code == status
        count += 1
print(f'{count} native HTTP checks passed against zlib, including invalid input handling.')
