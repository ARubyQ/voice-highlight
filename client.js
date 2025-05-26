const MODULE_ID = "voice-highlight";

const CFG = {
  threshold: 0.06,
  color: 0xffd900,
  width: 4,
  silenceMs: 700
};

const local = { speaking: false, silence: 0 };
const fadeTimers = new Map();
const LOOP_MS = 60;

const hex2num = h => parseInt(h.replace("#", ""), 16);

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "threshold", {
    name: "Voice threshold",
    hint: "Lower value = higher sensitivity (RMS)",
    scope: "client",
    config: true,
    type: Number,
    default: 0.06,
    range: { min: 0.01, max: 0.5, step: 0.01 },
    onChange: v => (CFG.threshold = v)
  });

  game.settings.register(MODULE_ID, "color", {
    name: "Outline colour",
    scope: "client",
    config: true,
    type: String,
    default: "#ffd900",
    onChange: v => (CFG.color = hex2num(v))
  });

  game.settings.register(MODULE_ID, "width", {
    name: "Outline width (px)",
    scope: "client",
    config: true,
    type: Number,
    default: 4,
    range: { min: 1, max: 10, step: 1 },
    onChange: v => (CFG.width = v)
  });

  game.settings.register(MODULE_ID, "silence", {
    name: "Silence time-out (ms)",
    scope: "client",
    config: true,
    type: Number,
    default: 700,
    range: { min: 200, max: 2000, step: 50 },
    onChange: v => (CFG.silenceMs = v)
  });
});

Hooks.once("ready", () => {
  CFG.threshold = game.settings.get(MODULE_ID, "threshold");
  CFG.color = hex2num(game.settings.get(MODULE_ID, "color"));
  CFG.width = game.settings.get(MODULE_ID, "width");
  CFG.silenceMs = game.settings.get(MODULE_ID, "silence");

  startMicLoop();

  game.socket.on(`module.${MODULE_ID}`, payload => {
    setUserSpeaking(payload.userId, payload.speaking);
  });

  Hooks.on("canvasReady", clearAllOutlines);
});

async function startMicLoop() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    src.connect(analyser);

    const data = new Uint8Array(analyser.fftSize);

    setInterval(() => {
      analyser.getByteTimeDomainData(data);

      let sum = 0;
      for (const v of data) {
        const n = (v - 128) / 128;
        sum += n * n;
      }
      const rms = Math.sqrt(sum / data.length);
      const talking = rms > CFG.threshold;

      if (talking) {
        local.silence = 0;
        if (!local.speaking) flipSpeaking(true);
      } else {
        local.silence += LOOP_MS;
        if (local.speaking && local.silence >= CFG.silenceMs) flipSpeaking(false);
      }
    }, LOOP_MS);
  } catch (err) {
    ui.notifications.error("Voice-Highlight: microphone access denied");
  }
}

function flipSpeaking(flag) {
  local.speaking = flag;
  setUserSpeaking(game.user.id, flag);
  game.socket.emit(`module.${MODULE_ID}`, { userId: game.user.id, speaking: flag });
}

function setUserSpeaking(userId, flag) {
  const user = game.users.get(userId);
  const actor = user?.character;
  if (!actor) return;

  canvas.tokens?.placeables
    .filter(t => t.document.actorId === actor.id)
    .forEach(t => outlineToken(t, flag));
}

function outlineToken(tok, flag) {
  clearTimeout(fadeTimers.get(tok.id));

  if (flag) {
    ensureOutline(tok);
    tok._vhOutline.alpha = 1;
  } else {
    const tid = setTimeout(() => {
      if (tok._vhOutline) tok._vhOutline.alpha = 0;
    }, 120);
    fadeTimers.set(tok.id, tid);
  }
}

function ensureOutline(tok) {
  if (tok._vhOutline && !tok._vhOutline.destroyed) return;

  const pad = 4;
  const radius = Math.max(tok.w, tok.h) / 2 + pad;

  const g = new PIXI.Graphics();
  g.lineStyle(CFG.width, CFG.color, 1);
  g.drawCircle(0, 0, radius);
  g.position.set(tok.w / 2, tok.h / 2);
  g.alpha = 0;
  g.zIndex = 1000;

  tok.addChildAt(g, 0);
  tok._vhOutline = g;
}

function clearAllOutlines() {
  canvas.tokens?.placeables.forEach(t => {
    if (t._vhOutline) {
      t.removeChild(t._vhOutline);
      t._vhOutline.destroy({ children: true });
      t._vhOutline = null;
    }
  });
  fadeTimers.clear();
}
