# Voice Highlight – Talk-to-Glow for Foundry VTT

---

### What it does

Voice Highlight listens to each player’s microphone **locally in the browser** (no Discord or external services) and adds a coloured outline around the token of the player’s linked “Player Character” while they’re talking.
Nothing is transmitted except a tiny “speaking / silent” flag through Foundry’s built-in socket, so it works for every connected user, even in self-hosted games.

### Features

* **Instant outline** when you speak, **soft fade-out** on silence.
* Per-client settings – every player chooses their own threshold, colour, outline width and silence timeout.
* Pure client-side; no server modules, no Discord bot, no permissions hassle.

### Installation

1. Copy the module folder to your `Data/modules/` directory **or** add the manifest URL to Foundry’s “Install Module” dialog.
2. Enable **Voice Highlight** in *Game Settings → Manage Modules*.
3. Ask every player to enable microphone access when prompted.

### Usage

* Open *Settings → Module Settings → Voice Highlight*.
* Pick your **Outline colour**, **Width**, **Silence time-out** (how long after last sound before the outline fades) and **Voice threshold** (input sensitivity).
* Make sure each user has a **“Player Character”** set in *User Configuration* – the module uses that actor’s tokens.

### Settings Reference

| Setting          | Description                         | Range / Default    |
| ---------------- | ----------------------------------- | ------------------ |
| Voice threshold  | RMS level that counts as “speaking” | 0.01 – 0.50 (0.06) |
| Outline colour   | Token ring colour                   | Any HEX            |
| Outline width    | Ring thickness in px                | 1 – 10 (4)         |
| Silence time-out | Milliseconds of quiet before fade   | 200 – 2000 (700)   |

### Known Limitations

* Only the **primary character** (User → *Player Character*) is outlined.
* If several tokens of that actor are on the same scene they share one outline state.
* Browser must allow microphone access; page needs HTTPS or localhost.

### Un-installation

Simply disable or delete the module – it adds nothing to worlds or actors.
