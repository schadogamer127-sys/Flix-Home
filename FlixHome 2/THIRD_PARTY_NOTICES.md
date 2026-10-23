# Third-party code

`app/js/apps.js`, `app/js/inputs.js` and `app/js/brands.js` derive from
[arn0-tv](https://github.com/NelsonEU/arn0-tv), commit
`b35c292e5bc63648cb8fef576bf5eacd9ea488d1`, MIT, Arnaud Etienne.
The retained license is `app/LICENSE-arn0.txt`.

`tools/sdb.py` and `tools/signer.py` derive from
[AeroTizen](https://github.com/helalaou/AeroTizen), commit
`9a099d134f476697b5ab689f360c1da43a3cbe66`, MIT.
The retained license is `tools/LICENSE-AeroTizen`.
See also the TizenSdb.Core attribution in the signer's source.

Transparent brand paths and their source/license information are documented in
`app/ASSET-SOURCES.md`. Simple Icons CC0 and the exact Custom Brand Icons MIT
license are retained under `tools/marks/`; the latter is also in the app.
No TV-extracted bitmap icons, reference photographs, proprietary fonts or
signed packages are included. Device-specific signing material stays outside
this repository. Brand names do not imply affiliation.

Sharp is an optional development dependency with its own licenses. It is not
bundled or needed to run the generated TV app. Python cryptography is used for
local signing and is not included in the TV package.
