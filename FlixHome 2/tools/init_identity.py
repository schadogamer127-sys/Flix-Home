"""Generate a new package ID once. Keep that ID and author certificate for upgrades."""
from pathlib import Path
import re,secrets,string
p=Path(__file__).resolve().parents[1]/'app/config.xml'
s=p.read_text()
if 'FlixHome01' not in s:
    raise SystemExit('Identity already initialized; no changes made.')
identity='F'+''.join(secrets.choice(string.ascii_letters+string.digits) for _ in range(9))
p.write_text(s.replace('FlixHome01',identity))
print('Initialized package:',identity)
