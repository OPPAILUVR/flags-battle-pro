# Flags Battle Pro 3.0 🏁

An interactive battle royale stream game designed for streamers (OBS Studio, YouTube, TikTok, Twitch) inspired by interactive chat stream games.

![Flags Battle Pro](Screenshot%202026-11-05%20at%2011.16.53%20PM.png)

## Features

- **2D Physics Arena**: Circular glowing arena with rotating gap where flags bounce with momentum, collide elastically, and fall into the bottom elimination pile.
- **3 Dynamic Game Modes**:
  - **Normal Mode**: Classic battle royale! Gap opens and rotates, flags fall through. Last flag standing wins. First to 3 victories becomes champion.
  - **Lightning Mode**: No gap! Lightning strikes from the sky knocking out random flags.
  - **Chaos Mode**: Shrinking arena, vortex gravity pulls, wind forces, and speed bursts.
- **Live Chat Boosts & Shields**:
  - Viewers boost their country flags in live chat via YouTube Data API v3 or simulated live chat.
  - Supports flag emojis (🇹🇷, 🇧🇷, 🇯🇵, etc.), country names in English and Turkish, country codes, and custom commands like `KKTC`.
  - **Tiers**: Diamond (10) = 1 shield, Crown (50) = 2, Legend (100) = 3, Champion (500) = 5.
  - Shields deflect flags away from the gap with glowing aura and sound effects.
  - Floating live chat supporter toast overlay on stream (`ayse_k sends 🇹🇷 +1`).
- **YouTube Live Stream Connect**:
  - Enter your YouTube Data API v3 key and Live Stream Video ID or URL.
  - Polling runs automatically and awards shields to viewers' countries in real time.
  - Test chat simulator allows streamers to test messages (`ayse_k: 🇹🇷`) directly inside the UI.
- **11 Moving Theme Arenas**:
  - Live, Orbit, Stadium, Synthwave, Dunes, Deep sea, Aurora, Cyberpunk, Volcano, Matrix, and Colosseum.
- **Procedural Sound FX & TTS**:
  - Built with Web Audio API (bounces, lightning zaps, shield deflections, victory fanfares) — no external audio files required.
  - SpeechSynthesis Text-to-Speech announcing eliminated countries and champions.
- **Bilingual Interface**: Seamless 1-click toggle between **English (EN)** and **Turkish (TR)**.
- **OBS Studio Stream-Ready**: Perfect 9:16 vertical viewport for OBS Browser Source.

## Running the Game

Start the local server with Python:

```bash
python3 server.py 8080
```

Then open in your browser or OBS Studio:
```
http://localhost:8080
```

## Streamer Controls & Test Keys

- **Start / Reset**: Kick off rounds or reset the match.
- **Flags Count**: Adjust between 10 and 150+ flags in the arena.
- **Auto Mode**: Automatically advances to the next round 5 seconds after a winner is declared.
- **Test Keys Mode**: Press any letter key (`A-Z`) on your keyboard while playing to simulate viewer chat boosts and trigger shields!

