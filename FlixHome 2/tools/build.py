"""Build with the owner's existing author/distributor certificates, never create new identity."""
import argparse
from pathlib import Path
import xml.etree.ElementTree as ET
from signer import sign_wgt

parser = argparse.ArgumentParser()
parser.add_argument('--certificates', required=True, type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
manifest = ET.parse(root / 'app/config.xml').getroot()
if manifest.find('{http://tizen.org/ns/widgets}application').get('package') == 'FlixHome01':
    raise SystemExit('Run python3 tools/init_identity.py first.')
version = manifest.get('version')
target = root / ('FlixHome-' + version + '.wgt')
sign_wgt(str(root / 'app'), str(target), str(args.certificates))
print('Signed package:', target)
