"""Narrow TV helper for a developer's Flix Home; no system configuration writes."""
import argparse
import json
from pathlib import Path
import urllib.request
import xml.etree.ElementTree as ET
from sdb import Sdb

root = Path(__file__).resolve().parents[1]
manifest = ET.parse(root / 'app/config.xml')
appid = manifest.getroot().find('{http://tizen.org/ns/widgets}application').get('id')
package = appid.split('.')[0]
parser = argparse.ArgumentParser()
parser.add_argument('action', choices=['status', 'install', 'launch', 'remove'])
parser.add_argument('--tv', required=True)
parser.add_argument('--profile', type=Path, help='Directory containing device-profile.xml')
args = parser.parse_args()
if package == 'FlixHome01':
    raise SystemExit('Run python3 tools/init_identity.py first.')
with urllib.request.urlopen('http://' + args.tv + ':8001/api/v2/', timeout=5) as response:
    info = json.load(response)
if info.get('device', {}).get('modelName') != 'UE43NU7409':
    raise SystemExit('Device guard failed; no changes made.')
with Sdb(args.tv) as bridge:
    before = bridge.applist()
    if args.action == 'status':
        print('Flix Home registered:', appid in before)
        print(json.dumps(bridge.capability(), indent=2))
    elif args.action == 'install':
        if not args.profile:
            raise SystemExit('--profile with your own device-profile.xml is required')
        tool = bridge.capability()['sdk_toolpath']
        bridge.push((args.profile / 'device-profile.xml').read_bytes(), tool + '/device-profile.xml')
        print(bridge.install(appid, (root / ('FlixHome-' + manifest.getroot().get('version') + '.wgt')).read_bytes(), tool))
        if appid not in bridge.applist():
            raise SystemExit('App not registered after installation; inspect TV response.')
    elif args.action == 'launch':
        if appid not in before:
            raise SystemExit('Flix Home is not registered.')
        print(bridge.launch(appid))
    else:
        # This helper removes only its own package. No caller-supplied app ID.
        print(bridge.uninstall(package))
        if appid in bridge.applist():
            raise SystemExit('App still registered after uninstall; inspect TV response.')
