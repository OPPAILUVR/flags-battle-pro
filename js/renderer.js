/**
 * Flags Battle Pro — Canvas 2D Renderer
 * Arena, flags, particles, overlays — fully themed & polished.
 *
 * Namespace: window.FB.Renderer
 */
(function () {
  'use strict';
  window.FB = window.FB || {};

  /* ------------------------------------------------------------------ */
  /*  Theme Definitions                                                  */
  /* ------------------------------------------------------------------ */

  var themes = {
    live:      { bg: ['#1a0a2e','#2d1b69'], ring: ['#ff6b9d','#c44dff'], glow: 'rgba(255,107,157,0.4)', particle: '#ff6b9d' },
    orbit:     { bg: ['#0a0a20','#0d1b3e'], ring: ['#4da6ff','#0066cc'], glow: 'rgba(77,166,255,0.4)',  particle: '#4da6ff' },
    stadium:   { bg: ['#1a1a0a','#2d2d1b'], ring: ['#ffd700','#ff8c00'], glow: 'rgba(255,215,0,0.4)',   particle: '#ffd700' },
    synthwave: { bg: ['#2d0a4e','#ff6b00'], ring: ['#00ffff','#ff00ff'], glow: 'rgba(0,255,255,0.4)',   particle: '#00ffff' },
    dunes:     { bg: ['#3d2b1f','#c2956b'], ring: ['#daa520','#cd853f'], glow: 'rgba(218,165,32,0.4)',  particle: '#daa520' },
    deepsea:   { bg: ['#0a1628','#0d3b5e'], ring: ['#00ced1','#20b2aa'], glow: 'rgba(0,206,209,0.4)',   particle: '#00ced1' },
    aurora:    { bg: ['#0a1a0a','#1a3d2d'], ring: ['#00ff7f','#7fff00'], glow: 'rgba(0,255,127,0.4)',   particle: '#00ff7f' },
    cyberpunk: { bg: ['#1a0a1a','#3d0a2d'], ring: ['#ff0055','#ffdd00'], glow: 'rgba(255,0,85,0.4)',    particle: '#ff0055' },
    volcano:   { bg: ['#1a0500','#4a1500'], ring: ['#ff4500','#ff0000'], glow: 'rgba(255,69,0,0.4)',    particle: '#ff4500' },
    matrix:    { bg: ['#000a00','#003300'], ring: ['#00ff00','#00cc00'], glow: 'rgba(0,255,0,0.4)',      particle: '#00ff00' },
    colosseum: { bg: ['#1a1510','#3d3020'], ring: ['#c0c0c0','#808080'], glow: 'rgba(192,192,192,0.4)', particle: '#c0c0c0' }
  };

  /* ------------------------------------------------------------------ */
  /*  Utility                                                            */
  /* ------------------------------------------------------------------ */

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function hexToRgba(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  /* ------------------------------------------------------------------ */
  /*  Renderer Module                                                    */
  /* ------------------------------------------------------------------ */

  window.FB.Renderer = {

    canvas:  null,
    ctx:     null,
    theme:   themes.live,
    themeName: 'live',

    /* image cache: code → Image */
    flagImages:   {},
    /* loading status: code → bool */
    _flagLoading: {},

    /* particle arrays */
    particles:        [],
    ambientParticles: [],

    /* internal frame counter for subtle animations */
    _frame: 0,

    /* ================================================================ */
    /*  Initialisation                                                   */
    /* ================================================================ */

    /**
     * Attach to a <canvas> element and prepare rendering context.
     */
    init: function (canvas) {
      this.canvas = canvas;
      this.ctx    = canvas.getContext('2d');
      canvas.width  = 540;
      canvas.height = 960;
      this.setTheme('live');
      this.initAmbientParticles();
    },

    /* ================================================================ */
    /*  Theme                                                            */
    /* ================================================================ */

    /**
     * Get list of all available themes for UI thumbnails.
     */
    getThemes: function () {
      return Object.keys(themes).map(function (k) {
        var t = themes[k];
        var title = k.charAt(0).toUpperCase() + k.slice(1);
        if (k === 'deepsea') title = 'Deep sea';
        return {
          id: k,
          name: title,
          colors: [t.ring[0], t.ring[1]],
          glow: t.glow,
          bg: t.bg
        };
      });
    },

    /**
     * Switch to a named theme. Reinitialises ambient particles.
     */
    setTheme: function (name) {
      if (themes[name]) {
        this.themeName = name;
        this.theme = themes[name];
      } else {
        this.themeName = 'live';
        this.theme = themes.live;
      }
      this.initAmbientParticles();
    },

    /* ================================================================ */
    /*  Flag image loading                                               */
    /* ================================================================ */

    /**
     * Preload and cache a single flag image by country code.
     */
    loadFlagImage: function (code) {
      if (!code) return null;
      var cleanCode = code.toLowerCase();
      // Return cached image immediately if available
      if (this.flagImages[cleanCode]) return this.flagImages[cleanCode];
      if (this._flagLoading[cleanCode]) return null;
      this._flagLoading[cleanCode] = true;
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = 'https://flagcdn.com/w80/' + cleanCode + '.png';
      var self = this;
      img.onload = function () {
        self.flagImages[cleanCode] = img;
        self.flagImages[code] = img;
      };
      img.onerror = function () {
        // Create a crisp fallback canvas with the country code
        var fc = document.createElement('canvas');
        fc.width = 80; fc.height = 54;
        var fctx = fc.getContext('2d');
        fctx.fillStyle = '#444';
        fctx.fillRect(0, 0, 80, 54);
        fctx.fillStyle = '#fff';
        fctx.font = 'bold 20px sans-serif';
        fctx.textAlign = 'center';
        fctx.textBaseline = 'middle';
        fctx.fillText(cleanCode.toUpperCase(), 40, 27);
        self.flagImages[cleanCode] = fc;
        self.flagImages[code] = fc;
      };
      return null;
    },

    /**
     * Batch-preload an array of country codes.
     */
    loadFlagImages: function (codes) {
      if (!codes) return;
      for (var i = 0; i < codes.length; i++) {
        this.loadFlagImage(codes[i]);
      }
    },

    preloadFlags: function (codes) {
      this.loadFlagImages(codes);
    },

    /* ================================================================ */
    /*  Ambient Particles                                                */
    /* ================================================================ */

    /**
     * Create slow-moving background particles for atmosphere.
     */
    initAmbientParticles: function () {
      this.ambientParticles = [];
      var count = 40;
      for (var i = 0; i < count; i++) {
        this.ambientParticles.push({
          x:    rand(0, 540),
          y:    rand(0, 960),
          vx:   rand(-0.15, 0.15),
          vy:   rand(-0.15, 0.15),
          size: rand(1, 2.5),
          alpha: rand(0.15, 0.45)
        });
      }
    },

    /* ================================================================ */
    /*  Main Render                                                      */
    /* ================================================================ */

    /**
     * Render a complete frame.
     * @param {Object} state  Game state snapshot.
     */
    render: function (state) {
      if (!this.canvas || !this.ctx) return;
      this._frame++;
      var ctx = this.ctx;
      var W = this.canvas.width;
      var H = this.canvas.height;

      state = state || {};

      // Unpack state with fallback to Physics / Game
      var pState = (window.FB && window.FB.Physics) ? window.FB.Physics.getState() : {};
      var gState = (window.FB && window.FB.Game) ? window.FB.Game.state : {};

      var flags          = state.flags          || pState.flags          || [];
      var anchors        = state.anchors        || pState.anchors        || [];
      var arenaAngle     = state.arenaAngle     !== undefined ? state.arenaAngle     : (pState.arenaAngle || 0);
      var arenaRadius    = state.arenaRadius    !== undefined ? state.arenaRadius    : (pState.arenaRadius || 280);
      var gapSize        = state.gapSize        !== undefined ? state.gapSize        : (pState.gapSize || Math.PI / 3);
      var centerX        = state.centerX        !== undefined ? state.centerX        : (pState.centerX || W / 2);
      var centerY        = state.centerY        !== undefined ? state.centerY        : (pState.centerY || H / 2);
      var eliminatedPile = state.eliminatedPile || (window.FB.Game && window.FB.Game.getEliminatedPile ? window.FB.Game.getEliminatedPile() : []);
      var topWinners     = state.topWinners     || (window.FB.Game && window.FB.Game.getTopWinners ? window.FB.Game.getTopWinners() : []);
      var phase          = state.phase          || gState.phase || 'idle';
      var introTimer     = state.introTimer     !== undefined ? state.introTimer     : (pState.introTimer || 0);
      var introDuration  = state.introDuration  !== undefined ? state.introDuration  : (pState.introDuration || 3.2);
      var elimBanner     = state.eliminationBanner || null;
      var topScoreboard  = state.topScoreboard  || [];
      var grandTimer     = state.grandChampionTimer !== undefined ? state.grandChampionTimer : 240;
      var voteQueueCodes = state.voteQueueCodes || [];
      var recentVoters   = state.recentVoters   || [];
      var winnerInfo     = state.winnerInfo     || null;

      // Update particles
      this.updateParticles(1);
      this._updateAmbient(W, H);

      // --- Layer 1: Deep Black Background (matching recording) ---
      this._drawBackground(ctx, W, H);

      // --- Layer 2: Top HUD (Vote Header + 2x4 Grid + Grand Champion Timer + Top 3) ---
      this._drawTopHUD(ctx, W, flags, grandTimer, topScoreboard);

      // --- Layer 3: Closed White Glowing Arena Ring ---
      this._drawArenaRing(ctx, centerX, centerY, arenaRadius);

      // --- Layer 4: Intro Lobby OR Winner OR Strings + Active Flags ---
      if (winnerInfo && (phase === 'round_end' || phase === 'champion')) {
        this._drawInCircleWinner(ctx, winnerInfo, centerX, centerY, arenaRadius);
      } else if (introTimer > 0 && flags.length > 0) {
        this._drawIntroLobby(ctx, flags, centerX, centerY, arenaRadius, introTimer, introDuration);
      } else {
        this._drawStringsAndAnchors(ctx, flags, anchors);
        this._drawActiveFlags(ctx, flags);
      }

      // --- Layer 5: Elimination Banner ("COUNTRY IS OUT!") ---
      if (elimBanner) {
        this._drawEliminationBanner(ctx, elimBanner, W, centerY - arenaRadius + 24);
      }

      // --- Layer 6: Effect particles (sparks / confetti / lightning) ---
      this._drawParticles(ctx);

      // --- Layer 7: Bottom HUD (VOTES 10-slot row + CTA + 4-row Live Voter Feed) ---
      this._drawBottomHUD(ctx, W, H, centerY + arenaRadius, voteQueueCodes, recentVoters);
    },

    /* ================================================================ */
    /*  Layer renderers                                                  */
    /* ================================================================ */

    /**
     * Layer 1 — Crisp deep-dark background matching the screen recording.
     */
    _drawBackground: function (ctx, W, H) {
      ctx.fillStyle = '#060608';
      ctx.fillRect(0, 0, W, H);
    },

    /**
     * Layer 2 — Top HUD: Vote header, 2x4 contender grid, Grand Champion timer, Top 3 leaderboard.
     */
    _drawTopHUD: function (ctx, W, flags, grandTimer, topScoreboard) {
      // Header text
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('VOTE NOW · CHARGE YOUR SPEED', W / 2, 12);

      ctx.fillStyle = '#9ca3af';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('EVERY 5 VOTES = 2s SPEED BOOST', W / 2, 28);
      ctx.restore();

      // 2x4 Contender Status Grid (y = 48..90)
      var cols = 4;
      var cellW = (W - 40) / cols;
      var startX = 20;
      var startY = 48;

      for (var i = 0; i < Math.min(8, flags.length); i++) {
        var f = flags[i];
        var col = i % cols;
        var row = Math.floor(i / cols);
        var cx = startX + col * cellW;
        var cy = startY + row * 22;

        ctx.save();
        ctx.globalAlpha = f.eliminated ? 0.35 : 1.0;

        // Mini circular flag
        this._drawCircularFlag(ctx, f, cx + 10, cy + 8, 7.5);

        // 2-letter code
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#e5e7eb';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText((f.code || '').toUpperCase(), cx + 22, cy + 8);

        // Status: OUT or votes/5
        ctx.textAlign = 'right';
        if (f.eliminated) {
          ctx.fillStyle = '#9ca3af';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText('OUT', cx + cellW - 8, cy + 8);
        } else {
          var prog = (f.supportCount || 0) % 5;
          ctx.fillStyle = prog > 0 ? '#facc15' : '#9ca3af';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText(prog + '/5', cx + cellW - 8, cy + 8);
        }
        ctx.restore();
      }

      // Row 2: Grand Champion Timer (left) + Top 3 Leaderboard (right)
      var row2Y = 100;

      // Left: GRAND CHAMPION IN + green MM:SS
      ctx.save();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('GRAND CHAMPION IN', 20, row2Y);

      var secs = Math.max(0, Math.floor(grandTimer || 0));
      var mm = String(Math.floor(secs / 60)).padStart(2, '0');
      var ss = String(secs % 60).padStart(2, '0');
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 34px monospace';
      ctx.fillText(mm + ':' + ss, 20, row2Y + 15);
      ctx.restore();

      // Right: Top 3 Leaderboard
      var lbX = 225;
      var lbW = W - lbX - 20;
      var rankColors = ['#facc15', '#cbd5e1', '#d97706'];

      for (var r = 0; r < 3; r++) {
        var entry = topScoreboard[r];
        var ry = row2Y + r * 20;

        ctx.save();
        // Rank circle
        ctx.beginPath();
        ctx.arc(lbX + 8, ry + 8, 7, 0, Math.PI * 2);
        ctx.fillStyle = rankColors[r];
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(r + 1), lbX + 8, ry + 8.5);

        if (entry) {
          this._drawCircularFlag(ctx, { code: entry.code, color: '#ffffff' }, lbX + 26, ry + 8, 7.5);

          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = r === 0 ? '#facc15' : '#e5e7eb';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText((entry.name || entry.code).toUpperCase(), lbX + 40, ry + 8.5);

          ctx.textAlign = 'right';
          ctx.fillStyle = '#f97316';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(String(entry.wins || 0), lbX + lbW, ry + 8.5);
        } else {
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(255,255,255,0.22)';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('---', lbX + 40, ry + 8.5);
        }
        ctx.restore();
      }
    },

    /**
     * Layer 4b — In-Circle Winner Display (matches recording's WINNER! screen).
     */
    _drawInCircleWinner: function (ctx, winnerInfo, cx, cy, r) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('WINNER!', cx, cy - 86);

      // Large circular winner flag
      this._drawCircularFlag(ctx, { code: winnerInfo.code, color: '#facc15' }, cx, cy - 10, 52);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText((winnerInfo.name || winnerInfo.code).toUpperCase(), cx, cy + 68);

      ctx.fillStyle = '#9ca3af';
      ctx.font = 'bold 10px sans-serif';
      var winLabel = winnerInfo.wins === 1 ? '1 ROUND WIN THIS CHAMPIONSHIP' : (winnerInfo.wins + ' ROUND WINS THIS CHAMPIONSHIP');
      ctx.fillText(winLabel, cx, cy + 92);
      ctx.restore();
    },

    /**
     * Layer 7 — Bottom HUD: VOTES 10-slot row, CTA, and 4-row Live Voter Feed.
     */
    _drawBottomHUD: function (ctx, W, H, arenaBottomY, voteQueueCodes, recentVoters) {
      var votesY = Math.max(arenaBottomY + 26, 660);

      // "VOTES" + 10 circular slots
      ctx.save();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('VOTES', 28, votesY);

      var slotStartX = 96;
      var slotGap = 39;
      for (var i = 0; i < 10; i++) {
        var sx = slotStartX + i * slotGap;
        var code = voteQueueCodes[i];
        if (code) {
          this._drawCircularFlag(ctx, { code: code, color: '#ffffff' }, sx, votesY, 13);
        } else {
          ctx.beginPath();
          ctx.arc(sx, votesY, 13, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.22)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // CTA line
      var ctaY = votesY + 34;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('COMMENT A COUNTRY · TOP 7 PLAY NEXT!', W / 2, ctaY);

      // 4-row Live Voter Feed
      var feedStartY = ctaY + 24;
      var rowH = 38;
      var rowGap = 6;
      var barW = W - 40;

      for (var r = 0; r < 4; r++) {
        var ry = feedStartY + r * (rowH + rowGap);
        if (ry + rowH > H - 6) break;
        var v = recentVoters[r];

        // Dark pill background
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(20, ry, barW, rowH, 8);
        else ctx.rect(20, ry, barW, rowH);
        ctx.fill();

        if (v) {
          this._drawCircularFlag(ctx, { code: v.code, color: '#ffffff' }, 42, ry + rowH / 2, 11);

          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#facc15';
          ctx.font = 'bold 12px sans-serif';
          var cName = (v.name || v.code).toUpperCase();
          ctx.fillText(cName, 62, ry + rowH / 2);

          var nameW = ctx.measureText(cName).width;
          ctx.fillStyle = '#9ca3af';
          ctx.font = '11px sans-serif';
          var handle = '@' + String(v.author || 'viewer').replace(/^@/, '');
          if (handle.length > 18) handle = handle.slice(0, 17) + '…';
          ctx.fillText(handle, 68 + nameW, ry + rowH / 2);

          ctx.textAlign = 'right';
          ctx.fillStyle = '#facc15';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('#' + (r + 1) + ' · ' + v.votes + ' VOTES', 20 + barW - 12, ry + rowH / 2);
        } else {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.font = '11px sans-serif';
          ctx.fillText('Waiting for live chat votes...', W / 2, ry + rowH / 2);
        }
      }
      ctx.restore();
    },

    /**
     * Layer 2 — Subtle floating dots.
     */
    _drawAmbientParticles: function (ctx) {
      var t = this.theme;
      var color = t.particle;
      for (var i = 0; i < this.ambientParticles.length; i++) {
        var p = this.ambientParticles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(color, p.alpha);
        ctx.fill();
      }
    },

    /**
     * Update ambient particle positions (wrap around edges).
     */
    _updateAmbient: function (W, H) {
      for (var i = 0; i < this.ambientParticles.length; i++) {
        var p = this.ambientParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -5) p.x = W + 5;
        if (p.x > W + 5) p.x = -5;
        if (p.y < -5) p.y = H + 5;
        if (p.y > H + 5) p.y = -5;
      }
    },

    /**
     * Layer 3 — Soft shadow behind the arena.
     */
    _drawArenaShadow: function (ctx, cx, cy, r) {
      var grad = ctx.createRadialGradient(cx, cy + 8, r * 0.5, cx, cy + 8, r + 40);
      grad.addColorStop(0, 'rgba(0,0,0,0.35)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy + 8, r + 40, 0, Math.PI * 2);
      ctx.fill();
    },

    /**
     * Layer 4 — Closed glowing arena ring.
     */
    _drawArenaRing: function (ctx, cx, cy, r) {
      // Crisp white ring with fast double-stroke glow (avoids expensive shadowBlur)
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    },

    /**
     * Layer 4b — Intro Lobby ("NEXT BATTLE / WHO JOINS?" -> "GET READY!").
     */
    _drawIntroLobby: function (ctx, flags, cx, cy, r, introTimer, introDuration) {
      var progress = 1 - (introTimer / (introDuration || 3.2));
      var count = flags.length;

      // Center prompt
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('NEXT BATTLE', cx, cy - 12);

      var ready = introTimer < 0.85;
      ctx.fillStyle = ready ? '#facc15' : '#94a3b8';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(ready ? 'GET READY!' : 'WHO JOINS?', cx, cy + 12);
      ctx.restore();

      // Reveal slots one by one
      for (var i = 0; i < count; i++) {
        var f = flags[i];
        var revealAt = i / (count + 1);
        var revealed = progress >= revealAt;
        var sx = f.introX;
        var sy = f.introY;
        var slotR = 22;

        ctx.save();
        if (!revealed) {
          ctx.beginPath();
          ctx.arc(sx, sy, slotR, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fill();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = 'rgba(255,255,255,0.28)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', sx, sy + 1);
        } else {
          // Draw circular flag in slot
          this._drawCircularFlag(ctx, f, sx, sy, slotR);

          // Crown for defending champion
          if (f.role === 'champion') {
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('👑', sx, sy - slotR - 10);
          }

          // Country name & role label
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText((f.name || f.code).toUpperCase(), sx, sy + slotR + 4);

          var sub = f.role === 'champion' ? 'CHAMPION'
            : (f.role === 'votes' ? (f.votes + ' VOTES') : 'RANDOM PICK');
          ctx.fillStyle = f.role === 'champion' ? '#facc15' : '#94a3b8';
          ctx.font = 'bold 8px sans-serif';
          ctx.fillText(sub, sx, sy + slotR + 15);
        }
        ctx.restore();
      }
    },

    /**
     * Layer 5a — Draw shared perimeter anchor dots and taut colored strings (batched for 60fps).
     */
    _drawStringsAndAnchors: function (ctx, flags, anchors) {
      if (!anchors || anchors.length === 0) return;

      ctx.save();
      ctx.lineWidth = 1.5;

      for (var i = 0; i < anchors.length; i++) {
        var a = anchors[i];
        var owner = (a.ownerId !== null && a.ownerId !== undefined) ? flags[a.ownerId] : null;

        if (owner && !owner.eliminated) {
          var color = owner.color || '#ffffff';
          ctx.globalAlpha = 0.72;
          ctx.strokeStyle = color;
          ctx.beginPath();
          ctx.moveTo(owner.x, owner.y);
          ctx.lineTo(a.ax, a.ay);
          ctx.stroke();

          ctx.globalAlpha = 1.0;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(a.ax, a.ay, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    },

    /**
     * Helper — Draw a circular clipped flag with colored ring.
     */
    _drawCircularFlag: function (ctx, f, x, y, radius) {
      var img = this.loadFlagImage(f.code);
      ctx.save();

      // Speed boost outer glow
      if (f.speedBoostTimer > 0) {
        ctx.shadowBlur = 16;
        ctx.shadowColor = '#facc15';
      }

      // Clip to circle and draw flag image
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.clip();

      // img can be an HTMLImageElement or a fallback canvas
      var canDraw = false;
      if (img) {
        if (img instanceof HTMLCanvasElement) {
          canDraw = true; // fallback canvas is always ready
        } else if (img.complete && img.naturalWidth > 0) {
          canDraw = true;
        }
      }

      if (canDraw) {
        var drawW = radius * 2.8;
        var drawH = radius * 2.05;
        ctx.drawImage(img, x - drawW / 2, y - drawH / 2, drawW, drawH);
      } else {
        ctx.fillStyle = f.color || '#334155';
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        // Draw country code text as placeholder
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold ' + Math.max(8, Math.round(radius * 0.7)) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((f.code || '??').toUpperCase(), x, y);
      }
      ctx.restore();

      // Colored border ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = f.speedBoostTimer > 0 ? '#facc15' : (f.color || '#ffffff');
      ctx.lineWidth = f.speedBoostTimer > 0 ? 3.2 : 2.5;
      ctx.stroke();
      ctx.restore();
    },

    /**
     * Layer 5b — Draw active flags.
     */
    _drawActiveFlags: function (ctx, flags) {
      for (var i = 0; i < flags.length; i++) {
        var f = flags[i];
        if (f.eliminated) continue;

        this._drawCircularFlag(ctx, f, f.x, f.y, f.radius || 18);

        // Shield indicator
        if (f.shields > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(f.x, f.y, (f.radius || 18) + 4, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
      }
    },

    /**
     * Layer 6 — Floating "COUNTRY IS OUT!" banner above the arena.
     */
    _drawEliminationBanner: function (ctx, banner, W, y) {
      var alpha = Math.min(1, banner.timer / 0.5);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 18px sans-serif';
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.fillStyle = banner.color || '#ff3b5c';
      ctx.fillText(banner.text, W / 2, Math.max(54, y));
      ctx.restore();
    },

    /**
     * Layer 5b — Golden glowing aura circle around safe country flags.
     * Shows viewers this country is protected by chat and cannot exit the arena.
     */
    _drawSafeAura: function (ctx, f) {
      var frame = this._frame || 0;
      var pulse = 0.65 + 0.35 * Math.sin(frame * 0.1);
      var radiusPulse = 25 + 3 * Math.sin(frame * 0.12);

      ctx.save();

      // 1. Soft radial background glow
      var grad = ctx.createRadialGradient(f.x, f.y, 8, f.x, f.y, radiusPulse + 9);
      grad.addColorStop(0, 'rgba(255, 215, 0, 0.35)');
      grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, radiusPulse + 9, 0, Math.PI * 2);
      ctx.fill();

      // 2. Radiant glowing outer ring
      ctx.beginPath();
      ctx.arc(f.x, f.y, radiusPulse + 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 215, 0, ' + (pulse * 0.45) + ')';
      ctx.lineWidth = 4.5;
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#ffd700';
      ctx.stroke();

      // 3. Crisp inner neon gold ring
      ctx.beginPath();
      ctx.arc(f.x, f.y, radiusPulse, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 240, 150, ' + pulse + ')';
      ctx.lineWidth = 2.2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffd700';
      ctx.stroke();

      // 4. Rotating golden star motes
      for (var k = 0; k < 3; k++) {
        var ang = frame * 0.05 + (k * Math.PI * 2 / 3);
        var dotX = f.x + Math.cos(ang) * radiusPulse;
        var dotY = f.y + Math.sin(ang) * radiusPulse;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ffd700';
        ctx.fill();
      }

      // 5. Floating "👑 SAFE" badge above flag
      var badgeY = f.y - 22;
      var badgeW = 44;
      var badgeH = 14;
      var bx = f.x - badgeW / 2;
      var by = badgeY - badgeH / 2;

      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.fillStyle = 'rgba(20, 10, 35, 0.92)';
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1;

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(bx, by, badgeW, badgeH, 4);
      } else {
        ctx.rect(bx, by, badgeW, badgeH);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 8.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👑 SAFE', f.x, badgeY);

      ctx.restore();
    },

    /**
     * Draw a single flag image as a circle with drop shadow, bounce squash-and-stretch, and crisp border.
     */
    _drawFlag: function (ctx, f, w, h, isGrave) {
      var img = this.flagImages[f.code || f.id];
      var bScale = (!isGrave && f.bounceScale && f.bounceScale > 1.0) ? f.bounceScale : 1.0;
      var radius = (f.radius || 15) * bScale;
      var diameter = radius * 2;

      ctx.save();

      // Opacity for eliminated
      if (f.opacity !== undefined && f.opacity < 1) {
        ctx.globalAlpha = f.opacity;
      }

      // Drop shadow for the circular flag token
      if (!isGrave) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 3;
      }

      // Clip inside circle
      ctx.beginPath();
      ctx.arc(f.x, f.y, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.save();
      ctx.clip();

      if (img && img.complete && img.naturalWidth > 0) {
        // Cover aspect ratio inside circle so image fills without distortion
        var nw = img.naturalWidth;
        var nh = img.naturalHeight;
        var aspect = nw / nh;
        var drawW, drawH;
        if (aspect >= 1) {
          drawH = diameter;
          drawW = diameter * aspect;
        } else {
          drawW = diameter;
          drawH = diameter / aspect;
        }
        var ix = f.x - drawW / 2;
        var iy = f.y - drawH / 2;
        ctx.drawImage(img, ix, iy, drawW, drawH);
      } else {
        var emoji = '';
        if (window.FB.Data && window.FB.Data.FLAGS) {
          var matched = window.FB.Data.FLAGS.find(function (item) { return item.code === (f.code || f.id); });
          if (matched && matched.emoji) emoji = matched.emoji;
        }

        if (emoji) {
          ctx.font = Math.round(diameter * 0.72) + 'px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(emoji, f.x, f.y);
        } else {
          ctx.fillStyle = '#444';
          ctx.beginPath();
          ctx.arc(f.x, f.y, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold ' + Math.round(radius * 0.75) + 'px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((f.code || '??').toUpperCase(), f.x, f.y);
        }
      }

      // Subtle 3D circular token gloss/rim highlight
      if (!isGrave) {
        var grad = ctx.createLinearGradient(f.x, f.y - radius, f.x, f.y + radius);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
        grad.addColorStop(0.45, 'rgba(255, 255, 255, 0.0)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore(); // restore clip

      // Crisp circular border outline around the flag
      if (!isGrave) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(f.x, f.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    },

    /**
     * Layer 6 — Glowing shield aura.
     */
    _drawShield: function (ctx, f) {
      var t = this.theme;
      var pulse = 0.55 + 0.25 * Math.sin(this._frame * 0.08);
      ctx.save();
      ctx.beginPath();
      ctx.arc(f.x, f.y, 23, 0, Math.PI * 2);
      ctx.strokeStyle = hexToRgba(t.ring[0], pulse);
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 12;
      ctx.shadowColor = t.ring[0];
      ctx.stroke();

      // Small badge showing count
      if (f.shieldCount > 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('×' + f.shieldCount, f.x + 19, f.y - 14);
      }
      ctx.restore();
    },

    /**
     * Layer 8 — Eliminated flags still falling (semi-transparent).
     */
    _drawEliminatedFalling: function (ctx, flags) {
      for (var i = 0; i < flags.length; i++) {
        var f = flags[i];
        if (!f.eliminated) continue;
        if (f.opacity <= 0) continue;
        // Only render if still remotely on-screen
        if (f.y > 1050 || f.y < -100) continue;
        this._drawFlag(ctx, f, 34, 22, false);
      }
    },

    /**
     * Layer 9 — Graveyard pile at the bottom of the canvas.
     */
    _drawGraveyard: function (ctx, pile, W, H) {
      if (!pile || pile.length === 0) return;

      var visible = pile.slice(-48);
      var flagR = 9; // circular token radius (18px diameter)
      var padding = 12;
      var maxX = W - 165; // Leave room for floating Top Winners card
      var startX = padding;
      var colW = (flagR * 2) + 4; // 22px
      var rowH = (flagR * 2) + 4; // 22px
      var cols = Math.floor((maxX - startX) / colW);
      if (cols < 1) cols = 1;

      ctx.save();
      ctx.globalAlpha = 0.85;

      for (var i = 0; i < visible.length; i++) {
        var code = visible[i].code || visible[i].id;
        var img = this.flagImages[code];
        var col = i % cols;
        var row = Math.floor(i / cols);

        var px = startX + col * colW;
        var py = (H - 16 - flagR * 2) - (row * rowH);
        var cx = px + flagR;
        var cy = py + flagR;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        if (img && img.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, flagR, 0, Math.PI * 2);
          ctx.clip();
          var nw = img.naturalWidth;
          var nh = img.naturalHeight;
          var aspect = nw / nh;
          var d = flagR * 2;
          var dw = aspect >= 1 ? d * aspect : d;
          var dh = aspect >= 1 ? d : d / aspect;
          ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
          ctx.restore();

          ctx.beginPath();
          ctx.arc(cx, cy, flagR, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.fillStyle = '#555';
          ctx.beginPath();
          ctx.arc(cx, cy, flagR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    },

    /**
     * Layer 10 — Top Winners overlay floating card at the bottom right.
     */
    _drawTopWinners: function (ctx, winners, W, H) {
      if (!winners || winners.length === 0) return;

      var cardW = 150;
      var cardH = 92;
      var cardX = W - cardW - 12;
      var cardY = H - cardH - 12;

      ctx.save();

      // Card shadow & glass background
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;

      ctx.fillStyle = 'rgba(15, 10, 30, 0.88)';
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(cardX, cardY, cardW, cardH, 8);
      } else {
        ctx.rect(cardX, cardY, cardW, cardH);
      }
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Header
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏆 TOP WINNERS', cardX + 10, cardY + 14);

      // Divider line
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
      ctx.beginPath();
      ctx.moveTo(cardX + 8, cardY + 24);
      ctx.lineTo(cardX + cardW - 8, cardY + 24);
      ctx.stroke();

      var medals = ['🥇', '🥈', '🥉'];
      var count = Math.min(winners.length, 3);
      var rowH = 20;

      for (var i = 0; i < count; i++) {
        var w = winners[i];
        var ry = cardY + 36 + (i * rowH);

        // Medal
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(medals[i] || (i + 1), cardX + 8, ry);

        // Flag
        var fImg = this.flagImages[w.code];
        var fx = cardX + 24;
        var fy = ry - 7;
        var rMini = 7;
        if (fImg && fImg.complete && fImg.naturalWidth > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(fx + rMini, fy + rMini, rMini, 0, Math.PI * 2);
          ctx.clip();
          var nw = fImg.naturalWidth;
          var nh = fImg.naturalHeight;
          var aspect = nw / nh;
          var d = rMini * 2;
          var dw = aspect >= 1 ? d * aspect : d;
          var dh = aspect >= 1 ? d : d / aspect;
          ctx.drawImage(fImg, fx + rMini - dw / 2, fy + rMini - dh / 2, dw, dh);
          ctx.restore();
          ctx.beginPath();
          ctx.arc(fx + rMini, fy + rMini, rMini, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Country name
        var name = w.name || (w.code ? w.code.toUpperCase() : '??');
        if (name.length > 9) name = name.substring(0, 8) + '…';

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(name, cardX + 46, ry);

        // Wins count
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(w.wins + 'W', cardX + cardW - 8, ry);
      }

      ctx.restore();
    },

    /* ================================================================ */
    /*  Particle System                                                  */
    /* ================================================================ */

    /**
     * Spawn particles of a given type at (x, y).
     * @param {string} type  'spark'|'shield'|'lightning'|'confetti'|'ambient'
     * @param {number} x
     * @param {number} y
     * @param {Object} config  Optional overrides (color, count, etc.)
     */
    addParticle: function (type, x, y, config) {
      config = config || {};
      var color = config.color || (this.theme ? this.theme.particle : '#ff6b9d');
      var i, p;

      switch (type) {

        /* --- Spark: 5-8 small fast circles --- */
        case 'spark': {
          var sparkCount = Math.floor(rand(5, 9));
          for (i = 0; i < sparkCount; i++) {
            var angle = rand(0, Math.PI * 2);
            var speed = rand(1.5, 4);
            this.particles.push({
              type: 'spark',
              x: x,
              y: y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1,
              maxLife: 1,
              decay: rand(0.02, 0.04),
              color: color,
              size: rand(1.5, 3)
            });
          }
          break;
        }

        /* --- Shield: expanding ring + 10 sparkles --- */
        case 'shield': {
          // Expanding ring (single particle rendered as ring)
          this.particles.push({
            type: 'shieldRing',
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            life: 1,
            maxLife: 1,
            decay: 0.025,
            color: config.color || '#00ffff',
            size: 5,
            maxSize: 40
          });
          // Sparkles
          for (i = 0; i < 10; i++) {
            var a2 = rand(0, Math.PI * 2);
            var s2 = rand(1, 3.5);
            this.particles.push({
              type: 'spark',
              x: x,
              y: y,
              vx: Math.cos(a2) * s2,
              vy: Math.sin(a2) * s2,
              life: 1,
              maxLife: 1,
              decay: rand(0.02, 0.035),
              color: config.color || '#00ffff',
              size: rand(2, 4)
            });
          }
          break;
        }

        /* --- Lightning: bright jagged line from top to target --- */
        case 'lightning': {
          this.particles.push({
            type: 'lightning',
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            life: 1,
            maxLife: 1,
            decay: 0.06,
            color: config.color || '#ffffff',
            size: 3,
            // Pre-compute jagged path from top of canvas to (x,y)
            segments: this._generateLightningPath(x, 0, x, y)
          });
          // Flash overlay
          this.particles.push({
            type: 'flash',
            x: 300,
            y: 400,
            vx: 0,
            vy: 0,
            life: 1,
            maxLife: 1,
            decay: 0.08,
            color: '#ffffff',
            size: 1
          });
          break;
        }

        /* --- Confetti: 50+ colourful rectangles --- */
        case 'confetti': {
          var confettiColors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
                                '#ff6b9d', '#c44dff', '#00ffff', '#ff8c00'];
          var cCount = config.count || 60;
          for (i = 0; i < cCount; i++) {
            var ac = rand(0, Math.PI * 2);
            var sc = rand(1, 5);
            this.particles.push({
              type: 'confetti',
              x: x + rand(-80, 80),
              y: y + rand(-40, 10),
              vx: Math.cos(ac) * sc,
              vy: Math.sin(ac) * sc - rand(1, 3),
              life: 1,
              maxLife: 1,
              decay: rand(0.004, 0.008),
              color: confettiColors[Math.floor(rand(0, confettiColors.length))],
              size: rand(3, 6),
              rotation: rand(0, Math.PI * 2),
              rotSpeed: rand(-0.1, 0.1)
            });
          }
          break;
        }

        default:
          break;
      }
    },

    /**
     * Generate a jagged lightning bolt path between two points.
     * Returns array of {x, y} points.
     */
    _generateLightningPath: function (x1, y1, x2, y2) {
      var segments = [];
      var steps = 12;
      var dx = x2 - x1;
      var dy = y2 - y1;

      for (var i = 0; i <= steps; i++) {
        var t = i / steps;
        var jitterX = (i === 0 || i === steps) ? 0 : rand(-25, 25);
        var jitterY = (i === 0 || i === steps) ? 0 : rand(-5, 5);
        segments.push({
          x: x1 + dx * t + jitterX,
          y: y1 + dy * t + jitterY
        });
      }
      return segments;
    },

    /**
     * Update all effect particles: move, age, remove dead.
     */
    updateParticles: function (dt) {
      for (var i = this.particles.length - 1; i >= 0; i--) {
        var p = this.particles[i];

        p.life -= p.decay * dt;

        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        // Move
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Type-specific updates
        if (p.type === 'confetti') {
          p.vy += 0.05 * dt; // gravity for confetti
          p.rotation += p.rotSpeed * dt;
        }
        if (p.type === 'spark') {
          p.vx *= 0.96;
          p.vy *= 0.96;
        }
        if (p.type === 'shieldRing') {
          // Expand the ring
          p.size = lerp(5, p.maxSize, 1 - p.life);
        }
      }
    },

    /**
     * Layer 7 — Draw all effect particles.
     */
    _drawParticles: function (ctx) {
      for (var i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];
        var alpha = Math.max(0, p.life);

        ctx.save();

        switch (p.type) {

          case 'spark': {
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 6;
            ctx.shadowColor = p.color;
            ctx.fill();
            break;
          }

          case 'shieldRing': {
            ctx.globalAlpha = alpha * 0.7;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.stroke();
            break;
          }

          case 'lightning': {
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.size * alpha;
            ctx.shadowBlur = 20;
            ctx.shadowColor = p.color;
            ctx.lineJoin = 'round';
            if (p.segments && p.segments.length > 1) {
              ctx.beginPath();
              ctx.moveTo(p.segments[0].x, p.segments[0].y);
              for (var s = 1; s < p.segments.length; s++) {
                ctx.lineTo(p.segments[s].x, p.segments[s].y);
              }
              ctx.stroke();

              // Thinner bright core
              ctx.globalAlpha = alpha * 0.7;
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.5 * alpha;
              ctx.shadowBlur = 30;
              ctx.beginPath();
              ctx.moveTo(p.segments[0].x, p.segments[0].y);
              for (s = 1; s < p.segments.length; s++) {
                ctx.lineTo(p.segments[s].x, p.segments[s].y);
              }
              ctx.stroke();
            }
            break;
          }

          case 'flash': {
            ctx.globalAlpha = alpha * 0.25;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            break;
          }

          case 'confetti': {
            ctx.globalAlpha = alpha;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            break;
          }

          default:
            break;
        }

        ctx.restore();
      }
    },

    addParticles: function (type, x, y, countOrConfig) {
      var cfg = typeof countOrConfig === 'number' ? { count: countOrConfig } : (countOrConfig || {});
      this.addParticle(type, x, y, cfg);
    },

    clearParticles: function () {
      this.particles = [];
    },

    /* ================================================================ */
    /*  Resize                                                           */
    /* ================================================================ */

    /**
     * Handle canvas resize (maintains aspect ratio or sets dimensions).
     */
    resize: function (w, h) {
      if (this.canvas) {
        if (w && h) {
          this.canvas.width = w;
          this.canvas.height = h;
        } else {
          this.canvas.width  = 540;
          this.canvas.height = 960;
        }
      }
    }
  };

})();
