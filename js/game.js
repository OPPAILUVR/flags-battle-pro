/**
 * ============================================
 * FLAGS BATTLE PRO 3.0 — Game Logic (game.js)
 * ============================================
 * 
 * Game state management, round logic, modes,
 * scoring, and event system.
 */
(function () {
  'use strict';
  window.FB = window.FB || {};

  /* ── Constants ─────────────────────────── */
  const WINS_TO_CHAMPION = Infinity;
  const LIGHTNING_MIN_INTERVAL = 2.0;   // seconds
  const LIGHTNING_MAX_INTERVAL = 4.0;
  const CHAOS_MIN_INTERVAL = 3.0;
  const CHAOS_MAX_INTERVAL = 6.0;
  const ROUND_END_DELAY = 5.0;         // seconds before auto-next
  const CHAOS_EVENTS = ['vortex_pull', 'wind_gust', 'speed_burst', 'arena_shrink'];

  /* ── Shield Tier Thresholds ────────────── */
  const SHIELD_TIERS = [
    { threshold: 5, shields: 1 },
    { threshold: 15, shields: 2 },
    { threshold: 30, shields: 3 },
    { threshold: 50, shields: 4 },
    { threshold: 100, shields: 5 }
  ];

  /* ── Helper: random float in range ─────── */
  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  /* ── Helper: shuffle array (Fisher-Yates) ─ */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ══════════════════════════════════════════
     GAME MODULE
     ══════════════════════════════════════════ */
  const Game = {

    /* ── State ───────────────────────────── */
    state: {
      phase: 'idle',          // idle | playing | round_end | champion
      round: 1,
      maxRounds: Infinity,
      flagCount: 8,
      gapDegrees: 60,
      baseGapDegrees: 60,
      speedMultiplier: 1.0,
      bounceMultiplier: 1.2,
      roundWins: {},          // { code: wins }
      eliminationOrder: [],   // codes in order of elimination (first out = index 0)
      lastEliminated: null,   // { code, name }
      remaining: 0,
      autoMode: false,
      lightningMode: false,
      chaosMode: false,
      chatMode: false,
      testKeysMode: false,
      support: {},            // { code: supportCount }
      shields: {},            // { code: shieldCount }
      winner: null,           // current round winner code
      champion: null,         // match champion code
      allTimeRounds: 0,
      allTimeEliminations: 0,
      paused: false,
      soundEnabled: true,
      ttsEnabled: false,
      activeFlags: [],        // [{code, name}] for the current match
      totalFlags: 0           // total in this round (for scoring)
    },

    /* ── Timers (in seconds, counted down) ─ */
    lightningTimer: 0,
    chaosTimer: 0,
    roundEndTimer: 0,
    autoNextTimer: 0,
    grandChampionTimer: 240,
    _recentVoters: [],

    /* ── Events ──────────────────────────── */
    _events: {},

    /* ──────────────────────────────────────
       INIT
       ────────────────────────────────────── */
    init(config) {
      if (config) {
        if (config.flagCount !== undefined) this.state.flagCount = config.flagCount;
        if (config.maxRounds !== undefined) this.state.maxRounds = config.maxRounds;
      }
      this.resetState();
    },

    /* ── Reset entire state to idle ──────── */
    resetState() {
      this.state.phase = 'idle';
      this.state.round = 1;
      this.state.roundWins = {};
      this.state.eliminationOrder = [];
      this.state.lastEliminated = null;
      this.state.remaining = 0;
      this.state.support = {};
      this.state.shields = {};
      this.state.gapDegrees = this.state.baseGapDegrees || 60;
      this.state.winner = null;
      this.state.champion = null;
      this.state.activeFlags = [];
      this.state.totalFlags = 0;
      this.state.paused = false;
      this.lightningTimer = 0;
      this.chaosTimer = 0;
      this.roundEndTimer = 0;
      this.autoNextTimer = 0;
    },

    /* ──────────────────────────────────────
       START ROUND
       ────────────────────────────────────── */
    start() {
      const Data = window.FB.Data;
      const Physics = window.FB.Physics;
      const Renderer = window.FB.Renderer;

      // If starting from champion state, clear champion flag
      if (this.state.phase === 'champion') {
        this.state.champion = null;
      }

      // 1. Read chat before the new round starts!
      // Collect all country codes viewers supported in live chat or test messages
      const chatSupportedCodes = [];
      for (const code of Object.keys(this.state.support)) {
        if ((this.state.support[code] || 0) > 0 && !chatSupportedCodes.includes(code)) {
          chatSupportedCodes.push(code);
        }
      }
      if (window.FB.YouTubeChat && window.FB.YouTubeChat.recentBoosts) {
        window.FB.YouTubeChat.recentBoosts.forEach(b => {
          if (b.code && !chatSupportedCodes.includes(b.code)) {
            chatSupportedCodes.push(b.code);
          }
        });
      }

      // 2. Viewer retention fan favorites (Nepal, India, Pakistan, Brazil + custom)
      const retentionCodes = (window.FB.ViewerAudience && window.FB.ViewerAudience.enabled)
        ? window.FB.ViewerAudience.getCountries()
        : ['np', 'in', 'pk', 'br'];

      // Priority list guaranteed to be spawned and inside the circle every round
      const priorityCodes = Array.from(new Set([...retentionCodes, ...chatSupportedCodes]));

      // On first round or if rebuilding activeFlags: assemble priority flags first, then random
      if (this.state.round === 1 || this.state.activeFlags.length === 0) {
        const allFlags = Data.getAllFlags();
        const priorityFlags = [];
        const priorityMap = {};

        priorityCodes.forEach(code => {
          const found = allFlags.find(f => f.code === code);
          if (found) {
            priorityFlags.push(found);
            priorityMap[code] = true;
          }
        });

        // Fill remaining slots up to flagCount with shuffled flags
        const remainingPool = allFlags.filter(f => !priorityMap[f.code]);
        const neededCount = Math.max(0, this.state.flagCount - priorityFlags.length);
        const randomPicked = shuffle(remainingPool).slice(0, neededCount);

        this.state.activeFlags = priorityFlags.concat(randomPicked);
      } else {
        // In subsequent rounds, ensure any newly supported chat countries or retention countries
        // are also injected into activeFlags if not already present
        const allFlags = Data.getAllFlags();
        priorityCodes.forEach(code => {
          if (!this.state.activeFlags.some(f => f.code === code)) {
            const found = allFlags.find(f => f.code === code);
            if (found) {
              this.state.activeFlags.push(found);
            }
          }
        });
      }

      // Reset round-specific state
      this.state.eliminationOrder = [];
      this.state.lastEliminated = null;
      this._lastBanner = null;
      const prevWinner = this.state.winner;
      this.state.winner = null;
      this.state.paused = false;

      // Select up to 8 contenders for this string-cutting battle
      const battleSize = Math.min(8, Math.max(2, this.state.flagCount || 8), this.state.activeFlags.length);
      const selected = [];
      const usedCodes = {};

      // Slot 0: Defending champion if present
      if (prevWinner) {
        const champObj = this.state.activeFlags.find(f => f.code === prevWinner);
        if (champObj) {
          selected.push({
            code: champObj.code,
            name: champObj.name,
            role: 'champion',
            votes: this.state.support[champObj.code] || 0
          });
          usedCodes[champObj.code] = true;
        }
      }

      // Next: Top chat-supported countries
      const sortedChat = chatSupportedCodes
        .filter(c => !usedCodes[c])
        .sort((a, b) => (this.state.support[b] || 0) - (this.state.support[a] || 0));

      for (const code of sortedChat) {
        if (selected.length >= battleSize) break;
        const found = this.state.activeFlags.find(f => f.code === code);
        if (found) {
          selected.push({
            code: found.code,
            name: found.name,
            role: 'votes',
            votes: this.state.support[found.code] || 1
          });
          usedCodes[found.code] = true;
        }
      }

      // Remaining slots: random picks from activeFlags
      const remainingPool = shuffle(this.state.activeFlags.filter(f => !usedCodes[f.code]));
      for (const f of remainingPool) {
        if (selected.length >= battleSize) break;
        selected.push({
          code: f.code,
          name: f.name,
          role: 'random',
          votes: 0
        });
        usedCodes[f.code] = true;
      }

      this.state.totalFlags = selected.length;
      this.state.remaining = this.state.totalFlags;

      // Reset starting gap for the round
      const startingGap = this.state.baseGapDegrees || this.state.gapDegrees || 60;
      this.state.gapDegrees = startingGap;

      // Reset physics with battle contenders
      Physics.reset();
      Physics.setGapSize(startingGap);
      Physics.setRotationSpeed(this.state.speedMultiplier);
      Physics.setBounce(this.state.bounceMultiplier);

      const flags = selected.map(f => ({
        code: f.code,
        name: f.name,
        role: f.role,
        votes: f.votes,
        shields: this.state.shields[f.code] || 0,
        isViewerFavorite: (window.FB.ViewerAudience ? window.FB.ViewerAudience.isRetentionCountry(f.code) : ['np', 'in', 'pk', 'br'].includes(f.code)),
        hasChatSupport: chatSupportedCodes.includes(f.code),
        supportCount: this.state.support[f.code] || 0
      }));
      Physics.spawnFlags(flags);

      // Preload flag images in renderer
      Renderer.preloadFlags(selected.map(f => f.code));

      // Reset mode timers
      this.lightningTimer = randRange(LIGHTNING_MIN_INTERVAL, LIGHTNING_MAX_INTERVAL);
      this.chaosTimer = randRange(CHAOS_MIN_INTERVAL, CHAOS_MAX_INTERVAL);
      this.roundEndTimer = 0;
      this.autoNextTimer = 0;

      // Set phase
      this.state.phase = 'playing';

      // Play start sound
      if (this.state.soundEnabled && window.FB.Sound) {
        window.FB.Sound.play('start');
      }

      // Schedule interactive streamer voice hype prompts
      if (window.FB.Sound && window.FB.Sound.scheduleVoiceHype) {
        window.FB.Sound.scheduleVoiceHype(6, 12);
      }

      // Emit start event
      this.emit('start', {
        round: this.state.round,
        flagCount: this.state.totalFlags
      });
    },

    /* ──────────────────────────────────────
       PAUSE / RESUME
       ────────────────────────────────────── */
    pause() {
      this.state.paused = true;
      if (window.FB.Physics) window.FB.Physics.paused = true;
      if (window.FB.Sound && window.FB.Sound.stopVoiceHype) window.FB.Sound.stopVoiceHype();
    },

    resume() {
      this.state.paused = false;
      if (window.FB.Physics) window.FB.Physics.paused = false;
      if (window.FB.Sound && window.FB.Sound.scheduleVoiceHype) window.FB.Sound.scheduleVoiceHype(10, 20);
    },

    togglePause() {
      if (this.state.paused) {
        this.resume();
      } else {
        this.pause();
      }
    },

    /* ──────────────────────────────────────
       RESET
       ────────────────────────────────────── */
    reset() {
      this.resetState();
      if (window.FB.Physics) window.FB.Physics.reset();
      if (window.FB.Renderer) window.FB.Renderer.clearParticles();
      if (window.FB.Sound && window.FB.Sound.stopVoiceHype) window.FB.Sound.stopVoiceHype();
      this.emit('reset', {});
    },

    /* ──────────────────────────────────────
       MAIN UPDATE (called every frame)
       ────────────────────────────────────── */
    update(dt) {
      // dt is in "frame ticks" — we convert to seconds (~60fps assumed)
      const dtSec = dt / 60;

      if (this.state.paused) return;
      if (this.state.phase !== 'playing' && this.state.phase !== 'round_end' && this.state.phase !== 'champion') return;

      // Handle round_end and champion auto-next countdown
      if (this.state.phase === 'round_end' || this.state.phase === 'champion') {
        if (this.state.autoMode) {
          this.autoNextTimer -= dtSec;
          if (this.autoNextTimer <= 0) {
            this.nextRound();
          }
        }
        // Still render even in round_end / champion so we can see arena and confetti particles
        if (window.FB.Renderer) {
          window.FB.Renderer.updateParticles(dtSec);
          window.FB.Renderer.render(this.getRenderState());
        }
        return;
      }

      // --- Phase: playing ---
      const Physics = window.FB.Physics;
      const Renderer = window.FB.Renderer;

      // Constantly monitor chat support and ensure top chat country is safe inside circle
      const topChat = this.getTopChatCountry(true);
      const safeCode = topChat ? topChat.code : null;
      if (Physics) {
        Physics.setSafeCountry(safeCode);
      }

      // 1. Update physics
      const result = Physics.update(dt);

      // 2. Handle eliminations
      if (result.eliminated && result.eliminated.length > 0) {
        for (const flagData of result.eliminated) {
          this.handleElimination(flagData);
        }
      }

      // 3. Handle shield saves
      if (result.shieldSaves && result.shieldSaves.length > 0) {
        for (const flagData of result.shieldSaves) {
          this.handleShieldSave(flagData);
        }
      }

      // 3b. Handle safe country saves (divine protection from gap)
      if (result.safeSaves && result.safeSaves.length > 0) {
        for (const flagData of result.safeSaves) {
          this.handleSafeSave(flagData);
        }
      }

      // 3c. Handle gap expansion (5% increase every full rotation)
      if (result.gapExpanded) {
        this.state.gapDegrees = result.currentGapDegrees;
        this.emit('gap_expand', { gapDegrees: this.state.gapDegrees });
      }

      // 3d. Handle string cuts (sparks + sound)
      if (result.cuts && result.cuts.length > 0) {
        if (Renderer) {
          for (var ci = 0; ci < result.cuts.length; ci++) {
            var cut = result.cuts[ci];
            Renderer.addParticles('spark', cut.x, cut.y, { color: cut.color, count: 6 });
          }
        }
        if (this.state.soundEnabled && window.FB.Sound) {
          var cutNow = Date.now();
          if (!this._lastCutSound || cutNow - this._lastCutSound > 65) {
            window.FB.Sound.play('bounce');
            this._lastCutSound = cutNow;
          }
        }
      }

      // 3e. Handle emoji bounce sounds (throttled)
      if (result.bounces && result.bounces.length > 0 && this.state.soundEnabled && window.FB.Sound) {
        var nowMs = Date.now();
        if (!this._lastBounceSound || nowMs - this._lastBounceSound > 110) {
          for (var bi = 0; bi < result.bounces.length; bi++) {
            if (result.bounces[bi].force > 1.8) {
              window.FB.Sound.play('bounce');
              this._lastBounceSound = nowMs;
              break;
            }
          }
        }
      }

      // Update elimination banner timer
      if (this._lastBanner && this._lastBanner.timer > 0) {
        this._lastBanner.timer = Math.max(0, this._lastBanner.timer - dtSec);
      }

      // Update Grand Champion countdown timer
      if (this.grandChampionTimer === undefined) this.grandChampionTimer = 240;
      this.grandChampionTimer -= dtSec;
      if (this.grandChampionTimer <= 0) {
        this.grandChampionTimer = 240;
      }

      // 4. Lightning mode
      if (this.state.lightningMode) {
        this.lightningTimer -= dtSec;
        if (this.lightningTimer <= 0) {
          this.triggerLightning();
        }
      }

      // 5. Chaos mode
      if (this.state.chaosMode) {
        this.chaosTimer -= dtSec;
        if (this.chaosTimer <= 0) {
          this.triggerChaosEvent();
        }
      }

      // 6. Check for round end (1 or 0 flags remaining)
      const activeCount = Physics.getActiveCount();
      this.state.remaining = activeCount;

      if (activeCount <= 1 && this.state.phase === 'playing') {
        this.endRound();
      }

      // 7. Update and render particles + scene
      if (Renderer) {
        Renderer.updateParticles(dtSec);
        Renderer.render(this.getRenderState());
      }
    },

    /* ──────────────────────────────────────
       HANDLE ELIMINATION
       ────────────────────────────────────── */
    handleElimination(flagData) {
      // flagData: { code, name, x, y }
      const Data = window.FB.Data;
      const code = flagData.code;
      const name = flagData.name || (Data ? Data.getFlagName(code) : code.toUpperCase());

      this.state.eliminationOrder.push(code);
      this.state.lastEliminated = { code: code, name: name };
      this.state.remaining = window.FB.Physics.getActiveCount();
      this.state.allTimeEliminations++;
      this._lastBanner = {
        text: name.toUpperCase() + ' IS OUT!',
        color: flagData.color || '#ff3b5c',
        timer: 2.0
      };

      // Play eliminate sound
      if (this.state.soundEnabled && window.FB.Sound) {
        window.FB.Sound.play('eliminate');
      }

      // Add spark particles at flag position
      if (window.FB.Renderer) {
        window.FB.Renderer.addParticles('spark', flagData.x, flagData.y, 8);
      }

      // Emit event
      this.emit('eliminate', {
        code: code,
        name: name,
        remaining: this.state.remaining,
        x: flagData.x,
        y: flagData.y
      });

      // TTS: speak flag name
      if (this.state.ttsEnabled && window.FB.Sound) {
        window.FB.Sound.speak(name);
      }
    },

    /* ──────────────────────────────────────
       HANDLE SHIELD SAVE
       ────────────────────────────────────── */
    handleShieldSave(flagData) {
      // flagData: { code, name, x, y, shieldsLeft }
      const Data = window.FB.Data;
      const code = flagData.code;
      const name = flagData.name || (Data ? Data.getFlagName(code) : code.toUpperCase());

      if (this.state.soundEnabled && window.FB.Sound) {
        window.FB.Sound.play('shield');
      }

      if (window.FB.Renderer) {
        window.FB.Renderer.addParticles('shield', flagData.x, flagData.y, 6);
      }

      this.emit('shield_save', {
        code: code,
        name: name,
        shieldsLeft: flagData.shieldsLeft !== undefined ? flagData.shieldsLeft : (this.state.shields[code] || 0)
      });
    },

    /* ──────────────────────────────────────
       HANDLE SAFE COUNTRY SAVE
       ────────────────────────────────────── */
    handleSafeSave(flagData) {
      // flagData: { code, name, x, y }
      const Data = window.FB.Data;
      const code = flagData.code;
      const name = flagData.name || (Data ? Data.getFlagName(code) : code.toUpperCase());

      if (this.state.soundEnabled && window.FB.Sound) {
        window.FB.Sound.play('shield');
      }

      if (window.FB.Renderer) {
        window.FB.Renderer.addParticles('shield', flagData.x, flagData.y, { color: '#ffd700' });
      }

      this.emit('safe_save', {
        code: code,
        name: name,
        x: flagData.x,
        y: flagData.y
      });
    },

    /* ──────────────────────────────────────
       TRIGGER LIGHTNING
       ────────────────────────────────────── */
    triggerLightning() {
      const Physics = window.FB.Physics;
      const Data = window.FB.Data;
      const activeFlags = Physics.getActiveFlags();

      if (activeFlags.length <= 1) {
        this.lightningTimer = randRange(LIGHTNING_MIN_INTERVAL, LIGHTNING_MAX_INTERVAL);
        return;
      }

      // Safe country is immune to lightning while other competitors exist
      const vulnerable = activeFlags.filter(f => !f.isSafe);
      const candidates = vulnerable.length > 0 ? vulnerable : activeFlags;
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      const targetName = target.name || (Data ? Data.getFlagName(target.code) : target.code.toUpperCase());

      // Add lightning visual particles (line from top to flag)
      if (window.FB.Renderer) {
        window.FB.Renderer.addParticles('lightning', target.x, target.y, 12);
      }

      // Play lightning sound
      if (this.state.soundEnabled && window.FB.Sound) {
        window.FB.Sound.play('lightning');
      }

      // Remove flag from physics
      Physics.removeFlag(target.code);

      // Handle the elimination
      this.handleElimination({
        code: target.code,
        name: targetName,
        x: target.x,
        y: target.y
      });

      this.emit('lightning_strike', {
        code: target.code,
        name: targetName,
        x: target.x,
        y: target.y
      });

      // Reset timer
      this.lightningTimer = randRange(LIGHTNING_MIN_INTERVAL, LIGHTNING_MAX_INTERVAL);
    },

    /* ──────────────────────────────────────
       TRIGGER CHAOS EVENT
       ────────────────────────────────────── */
    triggerChaosEvent() {
      const Physics = window.FB.Physics;
      const eventType = CHAOS_EVENTS[Math.floor(Math.random() * CHAOS_EVENTS.length)];

      switch (eventType) {
        case 'vortex_pull':
          // Apply inward force to all flags for 2 seconds
          Physics.applyChaosEffect('vortex_pull', { duration: 2.0, strength: 0.5 });
          break;

        case 'wind_gust':
          // Apply horizontal force for 1.5 seconds
          {
            const angle = Math.random() * Math.PI * 2;
            Physics.applyChaosEffect('wind_gust', {
              duration: 1.5,
              forceX: Math.cos(angle) * 2.0,
              forceY: Math.sin(angle) * 2.0
            });
          }
          break;

        case 'speed_burst':
          // Multiply all velocities by 1.5
          Physics.applyChaosEffect('speed_burst', { multiplier: 1.5 });
          break;

        case 'arena_shrink':
          // Shrink arena radius by 10px (min 150px)
          Physics.applyChaosEffect('arena_shrink', { shrinkAmount: 10, minRadius: 150 });
          break;
      }

      // Play chaos sound
      if (this.state.soundEnabled && window.FB.Sound) {
        window.FB.Sound.play('chaos');
      }

      this.emit('chaos_event', { type: eventType });

      // Reset timer
      this.chaosTimer = randRange(CHAOS_MIN_INTERVAL, CHAOS_MAX_INTERVAL);
    },

    /* ──────────────────────────────────────
       END ROUND
       ────────────────────────────────────── */
    endRound() {
      const Physics = window.FB.Physics;
      const activeFlags = Physics.getActiveFlags();

      // Determine the winner (last flag standing)
      let winnerCode = null;
      let winnerName = '';
      const Data = window.FB.Data;

      if (activeFlags.length >= 1) {
        winnerCode = activeFlags[0].code;
        winnerName = activeFlags[0].name || (Data ? Data.getFlagName(winnerCode) : winnerCode.toUpperCase());
      } else if (this.state.eliminationOrder.length > 0) {
        // Edge case: all flags eliminated simultaneously — last eliminated is "winner"
        winnerCode = this.state.eliminationOrder[this.state.eliminationOrder.length - 1];
        winnerName = Data ? Data.getFlagName(winnerCode) : winnerCode.toUpperCase();
      }

      if (winnerCode) {
        // Record round win
        if (!this.state.roundWins[winnerCode]) {
          this.state.roundWins[winnerCode] = 0;
        }
        this.state.roundWins[winnerCode]++;
        this.state.winner = winnerCode;
      }

      this.state.allTimeRounds++;

      // Play round end sound
      if (this.state.soundEnabled && window.FB.Sound) {
        window.FB.Sound.play('round_end');
      }

      // Emit round_end event
      this.emit('round_end', {
        round: this.state.round,
        winner: winnerCode,
        winnerName: winnerName,
        wins: this.state.roundWins[winnerCode] || 0
      });

      // Check for champion (only if maxRounds is set and finite)
      if (winnerCode && isFinite(this.state.maxRounds) && this.state.maxRounds > 0 && this.state.roundWins[winnerCode] >= this.state.maxRounds) {
        if (window.FB.Sound && window.FB.Sound.stopVoiceHype) window.FB.Sound.stopVoiceHype();
        this.declareChampion(winnerCode);
        return;
      }

      // Set phase to round_end
      this.state.phase = 'round_end';
      if (window.FB.Sound && window.FB.Sound.stopVoiceHype) window.FB.Sound.stopVoiceHype();

      // If auto mode, schedule next round
      if (this.state.autoMode) {
        this.autoNextTimer = ROUND_END_DELAY;
      }
    },

    /* ──────────────────────────────────────
       DECLARE CHAMPION
       ────────────────────────────────────── */
    declareChampion(code) {
      const Data = window.FB.Data;
      this.state.champion = code;
      this.state.phase = 'champion';

      // Play champion sound
      if (this.state.soundEnabled && window.FB.Sound) {
        window.FB.Sound.play('champion');
      }

      // TTS announce champion
      if (this.state.ttsEnabled && window.FB.Sound) {
        const name = Data.getCountryName(code);
        window.FB.Sound.speak('Champion! ' + name);
      }

      // Add confetti particles
      if (window.FB.Renderer) {
        const canvas = window.FB.Renderer.canvas;
        if (canvas) {
          const cx = canvas.width / 2;
          const cy = canvas.height / 2;
          window.FB.Renderer.addParticles('confetti', cx, cy, 60);
        }
      }

      // If auto mode, schedule next round so it NEVER freezes
      if (this.state.autoMode) {
        this.autoNextTimer = ROUND_END_DELAY;
      }

      this.emit('champion', {
        code: code,
        name: Data.getCountryName(code),
        wins: this.state.roundWins[code]
      });
    },

    /* ──────────────────────────────────────
       NEXT ROUND
       ────────────────────────────────────── */
    nextRound() {
      if (this.state.phase === 'champion') {
        this.state.champion = null;
      }

      this.state.round++;
      this.start();
    },

    /* ──────────────────────────────────────
       SUPPORT & SHIELDS
       ────────────────────────────────────── */
    addSupport(code, amount) {
      if (!code) return;
      code = code.toLowerCase();

      if (!this.state.support[code]) {
        this.state.support[code] = 0;
      }
      this.state.support[code] += (amount || 1);

      // Chat saving / spawning logic: if in active playing phase, ensure the flag is inside the arena!
      if (this.state.phase === 'playing' && window.FB.Physics) {
        const Physics = window.FB.Physics;
        const Data = window.FB.Data;
        const name = Data ? Data.getFlagName(code) : code.toUpperCase();

        // 1. If flag was eliminated, rescue it back inside the circle!
        const elimIdx = this.state.eliminationOrder.indexOf(code);
        if (elimIdx !== -1) {
          this.state.eliminationOrder.splice(elimIdx, 1);
          Physics.rescueFlag(code);
          this.state.remaining++;
          this.emit('flag_rescued', { code: code, name: name });
        } else {
          // 2. If flag is not even in Physics arena, spawn it into the circle!
          const active = Physics.getActiveFlags();
          const hasFlag = active.some(function (f) { return f.code === code; });
          if (!hasFlag) {
            Physics.addFlag(code, name, this.state.shields[code] || 0);
            if (!this.state.activeFlags.some(function (f) { return f.code === code; })) {
              this.state.activeFlags.push({ code: code, name: name });
            }
            this.state.remaining++;
            this.state.totalFlags++;
            if (window.FB.Renderer) {
              window.FB.Renderer.loadFlagImage(code);
            }
            this.emit('flag_joined', { code: code, name: name });
          }
        }
      }

      // Speed boost on chat support (matches "EVERY 5 VOTES = 2s SPEED BOOST")
      if (window.FB.Physics && this.state.phase === 'playing') {
        window.FB.Physics.boostFlag(code, 2.0);
      }

      // Record for live voter feed
      if (!this._recentVoters) this._recentVoters = [];
      const ytBoosts = (window.FB.YouTubeChat && window.FB.YouTubeChat.recentBoosts) ? window.FB.YouTubeChat.recentBoosts : [];
      const latestYt = ytBoosts.find(b => b.code === code);
      const voterAuthor = latestYt && latestYt.author ? latestYt.author : ('viewer_' + code);
      this._recentVoters.unshift({
        code: code,
        name: name,
        author: voterAuthor,
        votes: this.state.support[code] || 1
      });
      if (this._recentVoters.length > 6) {
        this._recentVoters.length = 6;
      }

      // Calculate new shield tier
      const supportCount = this.state.support[code];
      let newShields = 0;
      for (const tier of SHIELD_TIERS) {
        if (supportCount >= tier.threshold) {
          newShields = tier.shields;
        }
      }

      const oldShields = this.state.shields[code] || 0;
      if (newShields > oldShields) {
        this.state.shields[code] = newShields;
        // Update physics
        if (window.FB.Physics && this.state.phase === 'playing') {
          window.FB.Physics.addShield(code, newShields - oldShields);
        }
        this.emit('shield_upgrade', {
          code: code,
          shields: newShields,
          support: supportCount
        });
      }
    },

    /* ──────────────────────────────────────
       SETTERS
       ────────────────────────────────────── */
    setFlagCount(n) {
      this.state.flagCount = Math.max(2, Math.min(8, n));
    },

    setGapSize(deg) {
      this.state.baseGapDegrees = Math.max(15, Math.min(150, deg));
      this.state.gapDegrees = this.state.baseGapDegrees;
      if (window.FB.Physics) {
        window.FB.Physics.setGapSize(this.state.gapDegrees);
      }
    },

    setRotationSpeed(mult) {
      this.state.speedMultiplier = Math.max(0, Math.min(5.0, Math.round(mult * 10) / 10));
      if (window.FB.Physics) {
        window.FB.Physics.setRotationSpeed(this.state.speedMultiplier);
      }
    },

    setBounce(mult) {
      this.state.bounceMultiplier = Math.max(0.5, Math.min(3.0, Math.round(mult * 10) / 10));
      if (window.FB.Physics) {
        window.FB.Physics.setBounce(this.state.bounceMultiplier);
      }
    },

    setAutoMode(enabled) {
      this.state.autoMode = !!enabled;
      if (enabled && (this.state.phase === 'round_end' || this.state.phase === 'champion')) {
        if (this.autoNextTimer <= 0) {
          this.autoNextTimer = ROUND_END_DELAY;
        }
      }
    },

    setLightningMode(enabled) {
      this.state.lightningMode = !!enabled;
      if (enabled) {
        this.lightningTimer = randRange(LIGHTNING_MIN_INTERVAL, LIGHTNING_MAX_INTERVAL);
      }
    },

    setChaosMode(enabled) {
      this.state.chaosMode = !!enabled;
      if (enabled) {
        this.chaosTimer = randRange(CHAOS_MIN_INTERVAL, CHAOS_MAX_INTERVAL);
      }
    },

    setChatMode(enabled) {
      this.state.chatMode = !!enabled;
    },

    setTestKeysMode(enabled) {
      this.state.testKeysMode = !!enabled;
    },

    /* ──────────────────────────────────────
       SCOREBOARD
       ────────────────────────────────────── */
    getScoreboard() {
      // Returns sorted array of { code, name, wins } — top 5 by wins
      const Data = window.FB.Data;
      const entries = [];
      const seen = {};

      // First, add all flags with wins
      for (const code of Object.keys(this.state.roundWins)) {
        entries.push({
          code: code,
          name: Data.getCountryName(code),
          wins: this.state.roundWins[code]
        });
        seen[code] = true;
      }

      // Sort by wins descending, then by best elimination rank (survived longest)
      entries.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        // Tie-break: higher index in elimination order = survived longer = better
        const aIdx = this.state.eliminationOrder.indexOf(a.code);
        const bIdx = this.state.eliminationOrder.indexOf(b.code);
        // If not eliminated (still alive), they get highest rank
        const aRank = aIdx === -1 ? Infinity : aIdx;
        const bRank = bIdx === -1 ? Infinity : bIdx;
        return bRank - aRank;
      });

      return entries.slice(0, 5);
    },

    getRoundScores() {
      // Return top 5 survivors for the current round
      // Score = index in elimination order (higher = survived longer)
      // Flags still alive get highest score
      const Data = window.FB.Data;
      const entries = [];
      const totalFlags = this.state.totalFlags;

      // Surviving flags get top scores
      if (window.FB.Physics) {
        const active = window.FB.Physics.getActiveFlags();
        for (const f of active) {
          entries.push({
            code: f.code,
            name: f.name,
            score: totalFlags
          });
        }
      }

      // Eliminated flags get score based on how long they survived
      for (let i = this.state.eliminationOrder.length - 1; i >= 0; i--) {
        const code = this.state.eliminationOrder[i];
        entries.push({
          code: code,
          name: Data.getCountryName(code),
          score: i + 1   // first eliminated = 1, last eliminated = highest
        });
      }

      // Sort by score descending
      entries.sort((a, b) => b.score - a.score);

      return entries.slice(0, 5);
    },

    getEliminatedPile() {
      const Data = window.FB.Data;
      return this.state.eliminationOrder.map(code => ({
        code: code,
        name: Data ? Data.getFlagName(code) : code.toUpperCase()
      }));
    },

    getTopWinners() {
      return this.getScoreboard().slice(0, 3).map((w, idx) => ({
        rank: idx + 1,
        code: w.code,
        name: w.name,
        wins: w.wins
      }));
    },

    /**
     * Get the country with the most chat mentions.
     * @param {boolean} onlyActive  If true, prioritizes active flags in the arena.
     * @returns {{ code: string, count: number, name: string } | null}
     */
    getTopChatCountry(onlyActive = true) {
      const support = this.state.support;
      const activeFlags = window.FB.Physics ? window.FB.Physics.getActiveFlags() : [];
      const activeCodes = {};
      for (let i = 0; i < activeFlags.length; i++) {
        activeCodes[activeFlags[i].code] = true;
      }

      let topCode = null;
      let maxCount = 0;

      // 1. Look among currently active arena flags
      if (onlyActive && activeFlags.length > 0) {
        for (const code of Object.keys(support)) {
          if (activeCodes[code]) {
            const count = support[code] || 0;
            if (count > maxCount) {
              maxCount = count;
              topCode = code;
            }
          }
        }
      }

      // 2. Fallback to overall highest in chat if no match among active flags
      if (!topCode) {
        for (const code of Object.keys(support)) {
          const count = support[code] || 0;
          if (count > maxCount) {
            maxCount = count;
            topCode = code;
          }
        }
      }

      if (!topCode || maxCount <= 0) return null;

      const Data = window.FB.Data;
      return {
        code: topCode,
        count: maxCount,
        name: Data ? Data.getCountryName(topCode) : topCode.toUpperCase()
      };
    },

    getRenderState() {
      const pState = window.FB.Physics ? window.FB.Physics.getState() : {};
      const Data = window.FB.Data;

      // Top 3 scoreboard entries for canvas HUD
      const topScoreboard = this.getScoreboard().slice(0, 3);

      // Top voted countries for the 10-slot VOTES bar
      const voteQueueCodes = Object.keys(this.state.support || {})
        .filter(c => (this.state.support[c] || 0) > 0)
        .sort((a, b) => (this.state.support[b] || 0) - (this.state.support[a] || 0))
        .slice(0, 10);

      // Winner info for in-circle WINNER! display
      let winnerInfo = null;
      if ((this.state.phase === 'round_end' || this.state.phase === 'champion') && this.state.winner) {
        winnerInfo = {
          code: this.state.winner,
          name: Data ? Data.getCountryName(this.state.winner) : this.state.winner.toUpperCase(),
          wins: this.state.roundWins[this.state.winner] || 1
        };
      }

      return Object.assign({}, pState, {
        eliminatedPile: this.getEliminatedPile(),
        topWinners: this.getTopWinners(),
        topScoreboard: topScoreboard,
        safeCountry: this.getTopChatCountry(true),
        eliminationBanner: (this._lastBanner && this._lastBanner.timer > 0) ? this._lastBanner : null,
        grandChampionTimer: this.grandChampionTimer !== undefined ? this.grandChampionTimer : 240,
        voteQueueCodes: voteQueueCodes,
        recentVoters: (this._recentVoters || []).slice(0, 4),
        winnerInfo: winnerInfo,
        phase: this.state.phase
      });
    },

    /* ──────────────────────────────────────
       EVENT EMITTER
       ────────────────────────────────────── */
    on(event, callback) {
      if (!this._events[event]) {
        this._events[event] = [];
      }
      this._events[event].push(callback);
    },

    off(event, callback) {
      if (!this._events[event]) return;
      this._events[event] = this._events[event].filter(cb => cb !== callback);
    },

    emit(event, data) {
      if (!this._events[event]) return;
      for (const cb of this._events[event]) {
        try {
          cb(data);
        } catch (e) {
          console.error('[Game] Event handler error for "' + event + '":', e);
        }
      }
    }
  };

  window.FB.Game = Game;
})();
