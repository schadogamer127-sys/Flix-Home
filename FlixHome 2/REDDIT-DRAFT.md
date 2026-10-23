Title: I vibe-coded a launcher for my 2018 Samsung Tizen TV — here’s where I’m stuck

Hey everyone,

I’ve been vibe-coding a launcher called **Flix Home with Codex**, specifically for my **Samsung UE43NU7409 (2018, Tizen 4.0 / ARMv7)**. I wanted to give this older TV a cleaner, Apple TV / visionOS-inspired home screen instead of replacing the hardware.

The idea was a quiet interface with big app tiles, a large pixel clock, beige/light and dark modes, and subtle glass effects — without ads, shopping or recommendation rows in the launcher itself.

**What’s working so far**

- The app is signed, installed and running on this particular TV.
- App launching works; YouTube has been tested on the TV.
- There’s a square-dot-matrix clock, light/dark switching and remote controls for sorting/hiding favourites.
- App logos are separate transparent assets, with a local focus glow rather than a background that changes colour across the entire screen.
- Samsung Home remains accessible as a fallback. The launcher runs on the TV without a computer staying on.

**What’s still rough**

The latest pass is closer to my mockups: coloured transparent logos, labels inside the tiles, separate input pills, warm beige and a nearly black dark mode. There is still work to do on the glass material, lighting and matching the references. Some logos are simplified marks or typographic fallbacks.

Performance has also been a problem. Earlier versions lagged badly with larger animated layers. Version 0.5.1 uses pre-rendered textures and immediate focus changes, with animations disabled for this design pass. Both themes and responsive navigation have now been checked on my actual TV, but this is still an experimental project. Some visual checks and the demo recordings were done in a browser; those aren’t proof of TV performance.

**What I wanted, but haven’t solved**

- **A real Home replacement:** the physical Home button still opens Samsung Home, not this launcher. That includes returning from streaming apps.
- **Reliable startup:** launching automatically after a cold boot or waking from standby is not implemented. Resuming the last app wouldn’t count as a proper solution.
- **Better system integration:** HDMI shortcuts are present, but switching to a connected source still needs testing. Direct TV settings didn’t visibly open, so settings are currently reached through Samsung Home.
- Compatibility beyond this exact model hasn’t been established. This is a launcher app, not a replacement OS.

**Where I’m stuck now**

Codex helped get it running, but I’m going in circles trying to turn the references into a consistent design that this old web engine can actually render smoothly. The attached references are the target; I will include my own current TV recording to show where it is now. Smooth transitions are still on the wishlist, but I want to keep navigation responsive on this old hardware.

What would you change first? I’d appreciate honest design feedback, concrete CSS/SVG suggestions, or help with the Tizen-specific Home/startup limitations. If you’ve built something similar for an older Samsung TV, I’d love to hear what actually worked on your model.

Source: https://github.com/schadogamer127-sys/Flix-Home

Credits: this builds on code from [arn0-tv](https://github.com/NelsonEU/arn0-tv) and [AeroTizen](https://github.com/helalaou/AeroTizen). Full code and asset licences are included with the source.
