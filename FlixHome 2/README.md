# Flix Home · experimental Tizen TV launcher

Version **0.6.1** is a local, remote-first launcher for the Samsung UE43NU7409
(2018). A large constructed square-pixel clock, flat black / warm ivory themes,
minimal transparent glass tiles and one local brand-coloured focus rim.
No ads, feeds, analytics or continuously running computer are needed.

**Physical Home replacement and reliable cold-boot/standby autostart are not
implemented. This remains a launchable app; Samsung Home is preserved.**

## Current design

- Flat backgrounds: #000000 dark and #F3EFE6 light. No gradients, horizon,
  ground shadows, reflections, texture or global colour changes.
- Fixed square-pixel SVG geometry; seconds are smaller. Only changed digits
  perform a 280 ms two-phase folding movement, requested after the static pass.
  Settings → Animationen toggles Klappuhr / Reduziert. Browser reduced-motion
  preferences also suppress the folding overlay. Card focus remains immediate.
- Quiet neutral glass, fine rims and no outer card shadows. A narrow precomputed
  glow belongs only to the active card. No fading trail or multiple active glows.
- Full transparent Disney+ and stacked HBO/max wordmarks; names inside cards.
- A compact 760×688 settings panel with equal 64 px rows. Only its menu has focus
  while open. A tiny canvas snapshot (48×43) is computed once per opening and
  enlarged to soften the content behind the translucent panel. This snapshot is
  a visual approximation, remains static until reopening, and uses no live blur
  filter or continuous render loop. The real clock continues behind the overlay.

![Home and settings in both themes — browser captures](docs/preview.jpg)

## Compatibility and evidence

Target: Samsung UE43NU7409, firmware T-KTM2DEUC-1360.0, Tizen 4.0 / ARMv7
confirmed via SDB. No ES modules, CSS grid, external fonts or live backdrop blur.
Other models are untested; the installer guard is intentionally narrow.

0.6.1 was signed, verified, installed and launched on this TV. After 0.6.0's
focus light was reported too weak and the folding clock requested, the owner
confirmed in 0.6.1 that both the visible tile light and folding digits work.
Earlier builds also received physical confirmation for YouTube launching,
Samsung Home return and responsive navigation in both themes. This is user
validation, not a measured frame-rate benchmark.

Browser QA at 1920×1080 covers both homes, both settings panels, and YouTube,
Netflix, Prime Video and Twitch focus states. The flat scene assets each contain
one colour. Exactly one card glow is visible; none remain active in a dialog.
Clock folding was captured in intermediate states. Screenshots use mock apps
and inputs and are **browser captures, not TV footage**. The capture harness
only disables preview scaling to retain full resolution.

HDMI switching to a connected source remains unverified. A direct settings API
callback previously reported success without opening a visible menu, so settings
route through Samsung Home. No root, firmware changes or service disabling.

## Browser preview

```sh
python3 -m http.server 8092 --bind 127.0.0.1 --directory app
```

Open http://127.0.0.1:8092. Use arrows, Enter and Escape. Hold OK on TV to edit
an app. Favorites can be sorted or hidden; preferences persist in localStorage.
The visible Hell/Dunkel control distinguishes the selected mode from focus.

## Build and install on your own TV

Use your own Samsung TV author/distributor certificate profile and device
registration. [Samsung's certificate documentation](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/creating-certificates.html)
explains the official process. Preserve the author certificate and initialized
package ID for future updates. Keep certificates outside the repository.

The Python helper expects a private profile directory containing `author.p12`,
`distributor.p12` and `password.txt`, using the same password for both archives.
Installation additionally needs your own `device-profile.xml`. Never commit
that directory. A certificate backup is not firmware recovery.

```sh
python3 -m venv .local/venv
. .local/venv/bin/activate
pip install -r requirements.txt
python3 tools/init_identity.py
python3 tools/build.py --certificates /absolute/path/to/private-profile
python3 tools/tv.py status --tv YOUR_TV_IP
python3 tools/tv.py install --tv YOUR_TV_IP --profile /absolute/path/to/private-profile
python3 tools/tv.py launch --tv YOUR_TV_IP
```

Enable TV Developer Mode, enter your computer's LAN address and restart the TV
first. The developer bridge is SDB on port 26101, not Android ADB. The narrow
installer checks the tested model UE43NU7409 and changes only this app's package
and developer device profile; it does not alter system Home/startup settings.
Do not bypass that model check to infer compatibility with another TV.
The TV and computer must be able to reach each other on the local network.
Development-app retention and certificates depend on Samsung firmware/policy.

Generated artwork is already included. To change it, install Node.js and run
`npm install` then `npm run artwork`. Node is only a build dependency. No
inspiration JPGs or TV-extracted icons are required. The public edition uses transparent vector marks and a plain typographic fallback
for HBO/max; source and licenses are included. Unknown apps use a single letter.

## Rollback and practical tests

Keep your previous signed WGT, package ID and author certificate before updating.
Reinstall that WGT with the same author and identity. If the firmware refuses a
lower manifest version, rebuild the saved old source with a higher version and
the same author. Uninstalling first may discard favorites. To remove only this
launcher: `python3 tools/tv.py remove --tv YOUR_TV_IP`.
Samsung Home remains the system Home throughout. No firmware changes or full
firmware recovery are part of this project.

After an update, verify remote focus, round card edges, app launch/return,
light/dark persistence, clock transitions, Samsung Home and settings via Home.
Test a connected HDMI source separately. Cold boot and standby should be tested
separately; resuming the last app does not prove a configured default launcher.
No service disabling, flash, downgrade, bootloader change or storage relocation
is included. No claim of USB-only app installation is made.

## Contributing

Include model, firmware, Tizen version and a reproducible UI case in reports;
redact IPs, device identifiers, account details and signing material. Do not post
raw diagnostic dumps. Use only assets you can redistribute. MIT source license;
upstream notices are in THIRD_PARTY_NOTICES.md. No affiliation with Samsung,
Apple, or the named streaming services.
