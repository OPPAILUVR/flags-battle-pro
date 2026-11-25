/**
 * ============================================
 * FLAGS BATTLE PRO 3.0 — App Controller (app.js)
 * ============================================
 * 
 * Main application controller. Initializes all
 * modules, runs the game loop, binds all UI
 * events, and updates the DOM each frame.
 */
(function () {
  'use strict';
  window.FB = window.FB || {};

  /* ── Cached DOM Elements ───────────────── */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  let els = {}; // populated after DOMContentLoaded

  /* ── State ─────────────────────────────── */
  let audioInitialized = false;
  let currentTab = 'roundScores';    // 'roundScores' | 'topPerformers'
  let currentTheme = 'live';
  let lastFrameTime = 0;
  let uiUpdateCounter = 0;          // throttle some UI updates
  let chatSimInterval = null;

  /* ══════════════════════════════════════════
     INITIALIZATION
     ══════════════════════════════════════════ */
  function init() {
    cacheElements();
    initModules();
    generateArenaGrid();
    bindEvents();
    registerGameEvents();
    updateLanguageUI();
    updateFlagCountDisplay();
    updateGapDisplay();
    updateSpeedDisplay();
    updateBounceDisplay();
    if (window.FB.Sound && window.FB.Sound.initVoiceHype) {
      window.FB.Sound.initVoiceHype();
      updateVoiceHypeUI(window.FB.Sound.voiceHypeEnabled);
    }
    initYouTubeUI();
    initRetentionUI();
    updateFlagCountDisplay();
    updateSpeedDisplay();
    updateStringsDisplay();
    updateIntroDisplay();
    updateChampDisplay();
    startGameLoop();
    renderIdleState();
  }

  /** Cache all frequently-accessed DOM elements */
  function cacheElements() {
    els = {
      // Buttons
      btnStart: $('#btn-start'),
      btnReset: $('#btn-reset'),
      btnPause: $('#btn-pause'),
      btnSound: $('#btn-sound'),
      btnVoice: $('#btn-voice'),
      btnVoicePreview: $('#btn-voice-preview'),
      btnMic: $('#btn-mic'),
      btnFlagMinus: $('#btn-flag-minus'),
      btnFlagPlus: $('#btn-flag-plus'),
      btnSpeedMinus: $('#btn-speed-minus'),
      btnSpeedPlus: $('#btn-speed-plus'),
      speedDisplay: $('#speed-display'),
      btnStringsMinus: $('#btn-strings-minus'),
      btnStringsPlus: $('#btn-strings-plus'),
      stringsDisplay: $('#strings-display'),
      btnIntroMinus: $('#btn-intro-minus'),
      btnIntroPlus: $('#btn-intro-plus'),
      introDisplay: $('#intro-display'),
      btnChampMinus: $('#btn-champ-minus'),
      btnChampPlus: $('#btn-champ-plus'),
      champDisplay: $('#champ-display'),
      btnRefresh: $('#btn-refresh'),
      btnLangEn: $('#btn-lang-en'),
      btnLangTr: $('#btn-lang-tr'),
      btnLangEn2: $('#btn-lang-en-2'),
      btnLangTr2: $('#btn-lang-tr-2'),

      // Toggles
      toggleAuto: $('#toggle-auto'),
      toggleLightning: $('#toggle-lightning'),
      toggleChaos: $('#toggle-chaos'),
      toggleChat: $('#toggle-chat'),
      toggleVoiceHype: $('#toggle-voice-hype'),
      selectVoiceGender: $('#select-voice-gender'),
      toggleRetention: $('#toggle-retention'),
      btnRetentionSettings: $('#btn-retention-settings'),
      retentionModal: $('#retention-modal'),
      btnCloseRetentionModal: $('#btn-close-retention-modal'),
      retentionPillsList: $('#retention-pills-list'),
      inputAddRetention: $('#input-add-retention'),
      btnAddRetention: $('#btn-add-retention'),
      btnResetRetention: $('#btn-reset-retention'),
      demographicsContainer: $('#demographics-table-container'),
      toggleTestKeys: $('#toggle-test-keys'),

      // Tabs
      tabRoundScores: $('#tab-round-scores'),
      tabTopPerformers: $('#tab-top-performers'),

      // Display elements
      remainingCount: $('#remaining-count'),
      eliminatedCount: $('#eliminated-count'),
      lastEliminatedFlag: $('#last-eliminated-flag'),
      lastEliminatedName: $('#last-eliminated-name'),
      flagsInRound: $('#flags-in-round'),
      roundNumber: $('#round-number'),
      roundTotal: $('#round-total'),
      flagCountDisplay: $('#flag-count-display'),
      scoreboardList: $('#scoreboard-list'),
      roundScoresList: $('#round-scores-list'),
      allTimeRounds: $('#all-time-rounds'),
      allTimeEliminations: $('#all-time-eliminations'),

      // Round Winner overlay
      roundWinnerOverlay: $('#round-winner-overlay'),
      roundWinnerNumber: $('#round-winner-number'),
      roundWinnerFlag: $('#round-winner-flag-img'),
      roundWinnerName: $('#round-winner-country-name'),
      roundWinnerWins: $('#round-winner-wins-count'),
      roundWinnerFooter: $('#round-winner-footer-text'),

      // Champion overlay
      championOverlay: $('#champion-overlay'),
      championFlagImg: $('#champion-flag-img'),
      championCountryName: $('#champion-country-name'),
      championWinsCount: $('#champion-wins-count'),
      championFooterText: $('#champion-footer-text'),

      // Canvas & viewport
      canvas: $('#arena-canvas'),
      viewport: $('#stream-viewport'),

      // Arena grid
      arenaGrid: $('#arena-grid'),

      // YouTube Chat & Modal
      btnYtSettings: $('#btn-yt-settings'),
      toolMessages: $('#tool-messages'),
      ytModal: $('#yt-modal'),
      btnCloseYtModal: $('#btn-close-yt-modal'),
      ytApiKey: $('#yt-api-key'),
      ytVideoId: $('#yt-video-id'),
      btnYtConnect: $('#btn-yt-connect'),
      btnYtDisconnect: $('#btn-yt-disconnect'),
      ytStatusBadge: $('#yt-status-badge'),
      ytStatusDetail: $('#yt-status-detail'),
      testChatAuthor: $('#test-chat-author'),
      testChatMsg: $('#test-chat-msg'),
      btnSendTestChat: $('#btn-send-test-chat'),
      ytChatFeed: $('#yt-chat-feed'),

      // Supporter Toast
      boostToast: $('#chat-boost-toast'),
      toastAuthor: $('#toast-author'),
      toastFlag: $('#toast-flag'),
      toastCountry: $('#toast-country'),

      // Safe Leader Banner (Most typed in chat)
      safeLeaderBanner: $('#safe-leader-banner'),
      safeLeaderFlag: $('#safe-leader-flag'),
      safeLeaderName: $('#safe-leader-name'),
      safeLeaderVotes: $('#safe-leader-votes')
    };
  }

  /** Initialize all FB modules in order */
  function initModules() {
    const canvas = els.canvas;
    const viewport = els.viewport;

    // Set canvas resolution to match the viewport size
    resizeCanvas();

    // Init Physics
    if (window.FB.Physics) {
      window.FB.Physics.init({
        width: canvas.width,
        height: canvas.height
      });
    }

    // Init Renderer
    if (window.FB.Renderer) {
      window.FB.Renderer.init(canvas);
    }

    // Init Game
    if (window.FB.Game) {
      window.FB.Game.init({
        flagCount: 8,
        maxRounds: Infinity
      });
    }
  }

  /** Resize canvas to 9:16 vertical stream resolution (540x960, YouTube Shorts / TikTok format) */
  function resizeCanvas() {
    const canvas = els.canvas;
    if (!canvas) return;
    canvas.width = 540;
    canvas.height = 960;

    // Update physics and renderer dimensions
    if (window.FB.Physics) {
      window.FB.Physics.setDimensions(540, 960);
    }
    if (window.FB.Renderer) {
      window.FB.Renderer.resize(540, 960);
    }
  }

  /* ══════════════════════════════════════════
     ARENA THEME GRID
     ══════════════════════════════════════════ */
  function generateArenaGrid() {
    const grid = els.arenaGrid;
    if (!grid) return;

    const themes = window.FB.Renderer ? window.FB.Renderer.getThemes() : [];
    if (themes.length === 0) {
      // Fallback themes if renderer doesn't provide them
      const fallbackThemes = [
        { id: 'classic', name: 'Classic', colors: ['#6c5ce7', '#a855f7'] },
        { id: 'fire', name: 'Fire', colors: ['#ff4757', '#ff6348'] },
        { id: 'ocean', name: 'Ocean', colors: ['#0984e3', '#00cec9'] },
        { id: 'neon', name: 'Neon', colors: ['#fd79a8', '#e056fd'] },
        { id: 'forest', name: 'Forest', colors: ['#00b894', '#55efc4'] },
        { id: 'sunset', name: 'Sunset', colors: ['#f0932b', '#eb4d4b'] }
      ];
      fallbackThemes.forEach(t => themes.push(t));
    }

    grid.innerHTML = '';
    themes.forEach(theme => {
      const thumb = document.createElement('div');
      thumb.className = 'arena-thumb' + (theme.id === currentTheme ? ' active' : '');
      thumb.setAttribute('data-theme', theme.id);

      // Create circle preview
      const circle = document.createElement('div');
      circle.className = 'arena-thumb-circle';
      const gradient = `radial-gradient(circle, ${theme.colors[0]}, ${theme.colors[1] || theme.colors[0]})`;
      circle.style.background = gradient;

      // Name label
      const label = document.createElement('div');
      label.className = 'arena-thumb-name';
      label.textContent = theme.name;

      thumb.appendChild(circle);
      thumb.appendChild(label);
      grid.appendChild(thumb);
    });
  }

  /* ══════════════════════════════════════════
     EVENT BINDING
     ══════════════════════════════════════════ */
  function bindEvents() {
    // --- Audio context init on first user interaction ---
    document.addEventListener('click', initAudioOnce, { once: false });
    document.addEventListener('keydown', initAudioOnce, { once: false });

    // --- Window resize ---
    window.addEventListener('resize', debounce(resizeCanvas, 200));

    // --- Start / Reset ---
    els.btnStart.addEventListener('click', onStartClick);
    els.btnReset.addEventListener('click', onResetClick);

    // --- Pause ---
    els.btnPause.addEventListener('click', onPauseClick);

    // --- Sound toggle ---
    els.btnSound.addEventListener('click', onSoundToggle);

    // --- Streamer Voice Hype toggle ---
    if (els.btnVoice) {
      els.btnVoice.addEventListener('click', onVoiceHypeToggle);
    }

    // --- Mic / TTS toggle ---
    els.btnMic.addEventListener('click', onMicToggle);

    // --- Flag count (contenders) +/- ---
    els.btnFlagMinus.addEventListener('click', () => {
      const Game = window.FB.Game;
      Game.setFlagCount(Game.state.flagCount - 1);
      updateFlagCountDisplay();
    });

    els.btnFlagPlus.addEventListener('click', () => {
      const Game = window.FB.Game;
      Game.setFlagCount(Game.state.flagCount + 1);
      updateFlagCountDisplay();
    });

    // --- Flag speed +/- ---
    els.btnSpeedMinus.addEventListener('click', () => {
      const Game = window.FB.Game;
      Game.setRotationSpeed(Game.state.speedMultiplier - 0.2);
      updateSpeedDisplay();
    });

    els.btnSpeedPlus.addEventListener('click', () => {
      const Game = window.FB.Game;
      Game.setRotationSpeed(Game.state.speedMultiplier + 0.2);
      updateSpeedDisplay();
    });

    // --- Strings per flag +/- ---
    if (els.btnStringsMinus) {
      els.btnStringsMinus.addEventListener('click', () => {
        const P = window.FB.Physics;
        if (!P) return;
        var cur = P._stringsPerFlag || 11;
        P._stringsPerFlag = Math.max(3, cur - 1);
        updateStringsDisplay();
      });
    }
    if (els.btnStringsPlus) {
      els.btnStringsPlus.addEventListener('click', () => {
        const P = window.FB.Physics;
        if (!P) return;
        var cur = P._stringsPerFlag || 11;
        P._stringsPerFlag = Math.min(20, cur + 1);
        updateStringsDisplay();
      });
    }

    // --- Intro duration +/- ---
    if (els.btnIntroMinus) {
      els.btnIntroMinus.addEventListener('click', () => {
        const P = window.FB.Physics;
        if (!P) return;
        P.introDuration = Math.max(0, (P.introDuration || 3.2) - 0.5);
        updateIntroDisplay();
      });
    }
    if (els.btnIntroPlus) {
      els.btnIntroPlus.addEventListener('click', () => {
        const P = window.FB.Physics;
        if (!P) return;
        P.introDuration = Math.min(10, (P.introDuration || 3.2) + 0.5);
        updateIntroDisplay();
      });
    }

    // --- Grand champion timer +/- ---
    if (els.btnChampMinus) {
      els.btnChampMinus.addEventListener('click', () => {
        const G = window.FB.Game;
        if (!G) return;
        G.grandChampionTimer = Math.max(60, (G.grandChampionTimer || 240) - 30);
        updateChampDisplay();
      });
    }
    if (els.btnChampPlus) {
      els.btnChampPlus.addEventListener('click', () => {
        const G = window.FB.Game;
        if (!G) return;
        G.grandChampionTimer = Math.min(600, (G.grandChampionTimer || 240) + 30);
        updateChampDisplay();
      });
    }

    // --- Language buttons (header) ---
    els.btnLangEn.addEventListener('click', () => switchLanguage('en'));
    els.btnLangTr.addEventListener('click', () => switchLanguage('tr'));

    // --- Language buttons (media row) ---
    els.btnLangEn2.addEventListener('click', () => switchLanguage('en'));
    els.btnLangTr2.addEventListener('click', () => switchLanguage('tr'));

    // --- Refresh ---
    els.btnRefresh.addEventListener('click', () => {
      if (window.FB.Renderer) window.FB.Renderer.clearParticles();
      if (window.FB.Physics) window.FB.Physics.resetChaosEffects();
    });

    // --- Toggles ---
    els.toggleAuto.addEventListener('change', (e) => {
      window.FB.Game.setAutoMode(e.target.checked);
    });

    els.toggleLightning.addEventListener('change', (e) => {
      window.FB.Game.setLightningMode(e.target.checked);
    });

    els.toggleChaos.addEventListener('change', (e) => {
      window.FB.Game.setChaosMode(e.target.checked);
    });

    els.toggleChat.addEventListener('change', (e) => {
      window.FB.Game.setChatMode(e.target.checked);
      if (e.target.checked) {
        startChatSimulation();
      } else {
        stopChatSimulation();
      }
    });

    if (els.toggleVoiceHype) {
      els.toggleVoiceHype.addEventListener('change', (e) => {
        onVoiceHypeChange(e.target.checked);
      });
    }

    if (els.selectVoiceGender) {
      els.selectVoiceGender.addEventListener('change', (e) => {
        if (window.FB.Sound && window.FB.Sound.setVoiceGenderPreference) {
          window.FB.Sound.setVoiceGenderPreference(e.target.value);
        }
      });
    }

    if (els.btnVoicePreview) {
      els.btnVoicePreview.addEventListener('click', onVoiceHypePreview);
    }

    els.toggleTestKeys.addEventListener('change', (e) => {
      window.FB.Game.setTestKeysMode(e.target.checked);
    });

    // --- Viewer Retention & Audience Demographics ---
    if (els.toggleRetention) {
      els.toggleRetention.addEventListener('change', (e) => {
        if (window.FB.ViewerAudience) {
          window.FB.ViewerAudience.setEnabled(e.target.checked);
        }
      });
    }

    if (els.btnRetentionSettings) {
      els.btnRetentionSettings.addEventListener('click', () => {
        if (els.retentionModal) {
          els.retentionModal.classList.remove('hidden');
          renderRetentionPills();
          renderDemographicsTable();
        }
      });
    }

    if (els.btnCloseRetentionModal) {
      els.btnCloseRetentionModal.addEventListener('click', () => {
        if (els.retentionModal) els.retentionModal.classList.add('hidden');
      });
    }

    if (els.btnAddRetention) {
      els.btnAddRetention.addEventListener('click', handleAddRetentionCountry);
    }

    if (els.inputAddRetention) {
      els.inputAddRetention.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddRetentionCountry();
        }
      });
    }

    if (els.btnResetRetention) {
      els.btnResetRetention.addEventListener('click', () => {
        if (window.FB.ViewerAudience) {
          window.FB.ViewerAudience.resetToDefault();
          renderRetentionPills();
          renderDemographicsTable();
        }
      });
    }

    // --- Arena theme selection ---
    els.arenaGrid.addEventListener('click', (e) => {
      const thumb = e.target.closest('.arena-thumb');
      if (!thumb) return;
      const themeId = thumb.getAttribute('data-theme');
      setArenaTheme(themeId);
    });

    // --- Tabs ---
    els.tabRoundScores.addEventListener('click', () => {
      currentTab = 'roundScores';
      els.tabRoundScores.classList.add('active');
      els.tabTopPerformers.classList.remove('active');
      updateScoresUI();
    });

    els.tabTopPerformers.addEventListener('click', () => {
      currentTab = 'topPerformers';
      els.tabTopPerformers.classList.add('active');
      els.tabRoundScores.classList.remove('active');
      updateScoresUI();
    });

    // --- Keyboard shortcuts (test keys mode) ---
    document.addEventListener('keydown', onKeyDown);

    // --- Champion overlay click to dismiss & advance ---
    els.championOverlay.addEventListener('click', () => {
      els.championOverlay.classList.add('hidden');
      const Game = window.FB.Game;
      if (Game && Game.state.phase === 'champion') {
        Game.nextRound();
      }
    });

    // --- Round winner overlay click to proceed to next round ---
    if (els.roundWinnerOverlay) {
      els.roundWinnerOverlay.addEventListener('click', () => {
        hideRoundWinnerOverlay();
        const Game = window.FB.Game;
        if (Game && (Game.state.phase === 'round_end' || Game.state.phase === 'champion')) {
          Game.nextRound();
        }
      });
    }
  }

  /* ── Audio Context lazy init ───────────── */
  function initAudioOnce() {
    if (audioInitialized) return;
    if (window.FB.Sound) {
      window.FB.Sound.init();
      audioInitialized = true;
    }
  }

  /* ══════════════════════════════════════════
     BUTTON HANDLERS
     ══════════════════════════════════════════ */
  function onStartClick() {
    initAudioOnce();
    hideRoundWinnerOverlay();
    const Game = window.FB.Game;

    if (Game.state.phase === 'idle' || Game.state.phase === 'champion') {
      Game.start();
    } else if (Game.state.phase === 'round_end') {
      Game.nextRound();
    } else if (Game.state.phase === 'playing') {
      // Already playing — do nothing or restart?
      // Let's just resume if paused
      if (Game.state.paused) {
        Game.resume();
      }
    }
  }

  function onResetClick() {
    const Game = window.FB.Game;
    Game.reset();
    hideRoundWinnerOverlay();
    els.championOverlay.classList.add('hidden');
    clearUI();
  }

  function onPauseClick() {
    const Game = window.FB.Game;
    if (Game.state.phase !== 'playing') return;

    Game.togglePause();

    if (Game.state.paused) {
      els.btnPause.textContent = '▶';
      els.btnPause.classList.add('active');
    } else {
      els.btnPause.textContent = '⏸';
      els.btnPause.classList.remove('active');
    }
  }

  function onSoundToggle() {
    const Game = window.FB.Game;
    Game.state.soundEnabled = !Game.state.soundEnabled;
    if (Game.state.soundEnabled) {
      els.btnSound.classList.add('active');
      els.btnSound.textContent = '🔊';
    } else {
      els.btnSound.classList.remove('active');
      els.btnSound.textContent = '🔇';
    }
  }

  function onMicToggle() {
    const Game = window.FB.Game;
    Game.state.ttsEnabled = !Game.state.ttsEnabled;
    els.btnMic.classList.toggle('active', Game.state.ttsEnabled);
  }

  function onVoiceHypeToggle() {
    const Sound = window.FB.Sound;
    if (!Sound) return;
    const nextState = !Sound.voiceHypeEnabled;
    Sound.setVoiceHypeEnabled(nextState);
    updateVoiceHypeUI(nextState);
  }

  function onVoiceHypeChange(enabled) {
    const Sound = window.FB.Sound;
    if (!Sound) return;
    Sound.setVoiceHypeEnabled(enabled);
    updateVoiceHypeUI(enabled);
  }

  function onVoiceHypePreview() {
    const Sound = window.FB.Sound;
    if (!Sound) return;
    if (!Sound.voiceHypeEnabled) {
      Sound.setVoiceHypeEnabled(true);
      updateVoiceHypeUI(true);
    }
    const played = Sound.playVoiceHype();
    if (played && els.btnVoicePreview) {
      els.btnVoicePreview.classList.add('pulse-active');
      setTimeout(() => {
        if (els.btnVoicePreview) els.btnVoicePreview.classList.remove('pulse-active');
      }, 1500);
    }
  }

  function updateVoiceHypeUI(enabled) {
    const Sound = window.FB.Sound;
    if (els.btnVoice) {
      els.btnVoice.classList.toggle('active', enabled);
      els.btnVoice.textContent = enabled ? '📢' : '🔈';
      els.btnVoice.title = enabled ? 'Streamer Voice Hype: ON' : 'Streamer Voice Hype: OFF';
    }
    if (els.toggleVoiceHype) {
      els.toggleVoiceHype.checked = enabled;
    }
    if (els.selectVoiceGender && Sound && Sound.voiceGenderPreference) {
      els.selectVoiceGender.value = Sound.voiceGenderPreference;
    }
  }

  /* ══════════════════════════════════════════
     LANGUAGE
     ══════════════════════════════════════════ */
  function switchLanguage(lang) {
    if (window.FB.Data) {
      window.FB.Data.lang = lang;
    }
    updateLanguageUI();
  }

  function updateLanguageUI() {
    const Data = window.FB.Data;
    const lang = Data ? Data.lang : 'en';

    // Update all data-i18n elements
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (Data) {
        el.textContent = Data.t(key);
      }
    });

    // Update language button active states
    const isEn = lang === 'en';
    els.btnLangEn.classList.toggle('active', isEn);
    els.btnLangTr.classList.toggle('active', !isEn);
    els.btnLangEn2.classList.toggle('active', isEn);
    els.btnLangTr2.classList.toggle('active', !isEn);
  }

  /* ══════════════════════════════════════════
     ARENA THEME
     ══════════════════════════════════════════ */
  function setArenaTheme(themeId) {
    currentTheme = themeId;

    // Update thumbnails
    const thumbs = els.arenaGrid.querySelectorAll('.arena-thumb');
    thumbs.forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-theme') === themeId);
    });

    // Tell renderer
    if (window.FB.Renderer) {
      window.FB.Renderer.setTheme(themeId);
    }
  }

  /* ══════════════════════════════════════════
     CHAT SIMULATION
     ══════════════════════════════════════════ */
  function startChatSimulation() {
    if (chatSimInterval) clearInterval(chatSimInterval);
    chatSimInterval = setInterval(() => {
      const Game = window.FB.Game;
      if (!Game.state.chatMode || Game.state.phase !== 'playing' || Game.state.paused) return;
      const active = window.FB.Physics ? window.FB.Physics.getActiveFlags() : [];
      if (active.length > 0) {
        const randFlag = active[Math.floor(Math.random() * active.length)];
        const simAuthors = ['ayse_k', 'emre61', 'can_99', 'stream_fan', 'gamer_tr', 'flag_king', 'speedy', 'pro_stream'];
        const author = simAuthors[Math.floor(Math.random() * simAuthors.length)];
        if (window.FB.YouTubeChat) {
          window.FB.YouTubeChat.processMessage(author, randFlag.code);
        } else {
          Game.addSupport(randFlag.code, 1);
        }
      }
    }, 2200);
  }

  function stopChatSimulation() {
    if (chatSimInterval) {
      clearInterval(chatSimInterval);
      chatSimInterval = null;
    }
  }

  /* ══════════════════════════════════════════
     YOUTUBE LIVE CHAT & SUPPORTER TOAST
     ══════════════════════════════════════════ */
  let toastTimer = null;

  function showSupporterToast(boost) {
    if (!els.boostToast) return;
    if (els.toastAuthor) els.toastAuthor.textContent = boost.author;
    if (els.toastCountry) els.toastCountry.textContent = boost.countryName;
    if (els.toastFlag) {
      els.toastFlag.src = 'https://flagcdn.com/w40/' + boost.code.toLowerCase() + '.png';
      els.toastFlag.alt = boost.countryName;
    }

    els.boostToast.classList.remove('hidden', 'fade-out');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.boostToast.classList.add('fade-out');
      setTimeout(() => {
        els.boostToast.classList.add('hidden');
      }, 300);
    }, 2400);
  }

  function appendChatFeedItem(boost) {
    if (!els.ytChatFeed) return;
    const emptyMsg = els.ytChatFeed.querySelector('.chat-feed-empty');
    if (emptyMsg) emptyMsg.remove();

    const item = document.createElement('div');
    item.className = 'chat-feed-item';
    item.innerHTML = `
      <div class="feed-left">
        <span class="feed-author">${escapeHtml(boost.author)}</span>
        <img class="feed-flag-img" src="https://flagcdn.com/w40/${boost.code.toLowerCase()}.png" alt="">
        <span class="feed-country">${escapeHtml(boost.countryName)}</span>
      </div>
      <div>
        <span class="feed-badge">+1</span>
        <span class="feed-time">${boost.time}</span>
      </div>
    `;
    els.ytChatFeed.insertBefore(item, els.ytChatFeed.firstChild);

    while (els.ytChatFeed.children.length > 30) {
      els.ytChatFeed.removeChild(els.ytChatFeed.lastChild);
    }
  }

  function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function initYouTubeUI() {
    const YT = window.FB.YouTubeChat;
    if (!YT) return;

    // Populate inputs from saved state
    if (els.ytApiKey && YT.apiKey) els.ytApiKey.value = YT.apiKey;
    if (els.ytVideoId && YT.videoId) els.ytVideoId.value = YT.videoId;

    // Open modal buttons
    if (els.btnYtSettings) {
      els.btnYtSettings.addEventListener('click', () => {
        if (els.ytModal) els.ytModal.classList.remove('hidden');
      });
    }

    if (els.toolMessages) {
      els.toolMessages.addEventListener('click', () => {
        if (els.ytModal) els.ytModal.classList.remove('hidden');
      });
    }

    // Close modal
    if (els.btnCloseYtModal) {
      els.btnCloseYtModal.addEventListener('click', () => {
        if (els.ytModal) els.ytModal.classList.add('hidden');
      });
    }

    if (els.ytModal) {
      els.ytModal.addEventListener('click', (e) => {
        if (e.target === els.ytModal) {
          els.ytModal.classList.add('hidden');
        }
      });
    }

    // Connect button
    if (els.btnYtConnect) {
      els.btnYtConnect.addEventListener('click', () => {
        const apiKey = els.ytApiKey ? els.ytApiKey.value : '';
        const videoId = els.ytVideoId ? els.ytVideoId.value : '';
        YT.connect(apiKey, videoId);
      });
    }

    // Disconnect button
    if (els.btnYtDisconnect) {
      els.btnYtDisconnect.addEventListener('click', () => {
        YT.disconnect();
      });
    }

    // Test Chat message
    function handleSendTestMessage() {
      const author = els.testChatAuthor ? els.testChatAuthor.value : 'ayse_k';
      const msg = els.testChatMsg ? els.testChatMsg.value : '';
      if (!msg) return;
      YT.sendTestMessage(author, msg);
      if (els.testChatMsg) els.testChatMsg.value = '';
    }

    if (els.btnSendTestChat) {
      els.btnSendTestChat.addEventListener('click', handleSendTestMessage);
    }

    if (els.testChatMsg) {
      els.testChatMsg.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSendTestMessage();
        }
      });
    }

    // Status change listener
    YT.onStatusChange((status, message) => {
      if (els.ytStatusBadge) {
        els.ytStatusBadge.className = 'status-badge ' + status;
        const Data = window.FB.Data;
        if (status === 'connected') {
          els.ytStatusBadge.textContent = Data ? Data.t('connected') : 'Connected 🟢';
          if (els.btnYtConnect) els.btnYtConnect.classList.add('hidden');
          if (els.btnYtDisconnect) els.btnYtDisconnect.classList.remove('hidden');
        } else if (status === 'connecting') {
          els.ytStatusBadge.textContent = Data ? Data.t('connecting') : 'Connecting...';
        } else {
          els.ytStatusBadge.textContent = Data ? Data.t('disconnected') : 'Disconnected 🔴';
          if (els.btnYtConnect) els.btnYtConnect.classList.remove('hidden');
          if (els.btnYtDisconnect) els.btnYtDisconnect.classList.add('hidden');
        }
      }
      if (els.ytStatusDetail) {
        els.ytStatusDetail.textContent = message || '';
      }
    });

    // On boost listener
    YT.onBoost((boost) => {
      showSupporterToast(boost);
      appendChatFeedItem(boost);
      renderDemographicsTable();
    });
  }

  /* ══════════════════════════════════════════
     AUDIENCE RETENTION & VIEWER DEMOGRAPHICS UI
     ══════════════════════════════════════════ */
  function initRetentionUI() {
    const VA = window.FB.ViewerAudience;
    if (!VA) return;

    if (els.toggleRetention) {
      els.toggleRetention.checked = VA.enabled;
    }

    VA.onChange(() => {
      renderRetentionPills();
      renderDemographicsTable();
    });

    renderRetentionPills();
    renderDemographicsTable();
  }

  function renderRetentionPills() {
    if (!els.retentionPillsList) return;
    const VA = window.FB.ViewerAudience;
    const Data = window.FB.Data;
    if (!VA || !Data) return;

    const countries = VA.getCountries();
    els.retentionPillsList.innerHTML = '';

    if (countries.length === 0) {
      els.retentionPillsList.innerHTML = '<span class="text-secondary" style="font-size:12px;opacity:0.7;">No countries selected. All flags will have standard physics.</span>';
      return;
    }

    countries.forEach(code => {
      const flag = Data.FLAGS.find(f => f.code === code);
      const name = flag ? flag.name : code.toUpperCase();
      const emoji = flag ? flag.emoji : '🏁';

      const pill = document.createElement('div');
      pill.className = 'retention-pill';

      const emojiSpan = document.createElement('span');
      emojiSpan.className = 'retention-pill-emoji';
      emojiSpan.textContent = emoji;

      const nameSpan = document.createElement('span');
      nameSpan.textContent = name;

      const removeBtn = document.createElement('span');
      removeBtn.className = 'retention-pill-remove';
      removeBtn.innerHTML = '&times;';
      removeBtn.title = 'Remove ' + name;
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        VA.removeCountry(code);
      });

      pill.appendChild(emojiSpan);
      pill.appendChild(nameSpan);
      pill.appendChild(removeBtn);
      els.retentionPillsList.appendChild(pill);
    });
  }

  function handleAddRetentionCountry() {
    if (!els.inputAddRetention) return;
    const input = (els.inputAddRetention.value || '').trim().toLowerCase();
    if (!input) return;

    const Data = window.FB.Data;
    const VA = window.FB.ViewerAudience;
    if (!Data || !VA) return;

    let matchedCode = null;
    const foundByCode = Data.FLAGS.find(f => f.code === input);
    if (foundByCode) {
      matchedCode = foundByCode.code;
    } else {
      const matched = Data.findCountriesInText(input);
      if (matched && matched.length > 0) {
        matchedCode = matched[0];
      }
    }

    if (matchedCode) {
      const added = VA.addCountry(matchedCode);
      els.inputAddRetention.value = '';
      if (added) {
        renderRetentionPills();
        renderDemographicsTable();
      }
    } else {
      els.inputAddRetention.style.borderColor = 'var(--danger)';
      setTimeout(() => {
        if (els.inputAddRetention) els.inputAddRetention.style.borderColor = '';
      }, 1200);
    }
  }

  function renderDemographicsTable() {
    if (!els.demographicsContainer) return;
    const VA = window.FB.ViewerAudience;
    if (!VA) return;

    const stats = VA.getStatsList();
    if (!stats || stats.length === 0) {
      els.demographicsContainer.innerHTML = '<div class="demographics-empty">No viewer chat data recorded yet. Connect YouTube live chat or send test messages to see viewer country origins!</div>';
      return;
    }

    let html = '<table class="demographics-table"><thead><tr><th>Country</th><th>Chats</th><th>Retention Status</th></tr></thead><tbody>';

    stats.forEach(item => {
      const isRetained = item.isRetained;
      const statusBtn = isRetained
        ? `<button class="btn-retain-toggle active" data-code="${item.code}">✓ Holding Longer</button>`
        : `<button class="btn-retain-toggle" data-code="${item.code}">+ Hold Longer</button>`;

      html += `<tr>
        <td><strong>${item.emoji} ${escapeHtml(item.name)}</strong> <span style="opacity:0.6;font-size:11px;">(${item.code.toUpperCase()})</span></td>
        <td><span style="color:var(--accent-gold);font-weight:700;">${item.count}</span></td>
        <td>${statusBtn}</td>
      </tr>`;
    });

    html += '</tbody></table>';
    els.demographicsContainer.innerHTML = html;

    const btns = els.demographicsContainer.querySelectorAll('.btn-retain-toggle');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-code');
        if (!code) return;
        if (VA.isRetentionCountry(code)) {
          VA.removeCountry(code);
        } else {
          VA.addCountry(code);
        }
      });
    });
  }

  /* ══════════════════════════════════════════
     KEYBOARD
     ══════════════════════════════════════════ */
  function onKeyDown(e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const Game = window.FB.Game;

    // Test keys mode: any letter key adds support to a random active flag
    if (Game.state.testKeysMode && Game.state.phase === 'playing') {
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        const activeFlags = window.FB.Physics ? window.FB.Physics.getActiveFlags() : [];
        if (activeFlags.length > 0) {
          const randomFlag = activeFlags[Math.floor(Math.random() * activeFlags.length)];
          if (window.FB.YouTubeChat) {
            window.FB.YouTubeChat.processMessage('Viewer', randomFlag.code);
          } else {
            Game.addSupport(randomFlag.code, 1);
          }
        }
      }
    }

    // Space bar to pause/resume or advance when round ended
    if (e.key === ' ') {
      if (Game.state.phase === 'playing') {
        e.preventDefault();
        onPauseClick();
      } else if (Game.state.phase === 'round_end' || Game.state.phase === 'champion') {
        e.preventDefault();
        hideRoundWinnerOverlay();
        if (els.championOverlay) els.championOverlay.classList.add('hidden');
        Game.nextRound();
      }
    }
  }

  /* ══════════════════════════════════════════
     GAME EVENT LISTENERS
     ══════════════════════════════════════════ */
  function registerGameEvents() {
    const Game = window.FB.Game;

    Game.on('start', () => {
      hideRoundWinnerOverlay();
      if (els.championOverlay) els.championOverlay.classList.add('hidden');
    });

    Game.on('eliminate', (data) => {
      updateLastEliminated(data.code, data.name);
    });

    Game.on('round_end', (data) => {
      updateScoreboardUI();
      updateScoresUI();
      if (!Game.state.champion || !isFinite(Game.state.maxRounds)) {
        showRoundWinnerOverlay(data.winner, data.winnerName, data.round, data.wins);
      }
    });

    Game.on('champion', (data) => {
      hideRoundWinnerOverlay();
      showChampionOverlay(data.code, data.name, data.wins);
    });

    Game.on('gap_expand', (data) => {
      updateGapDisplay();
      if (els.gapSizeDisplay) {
        els.gapSizeDisplay.classList.add('gap-pulse');
        setTimeout(() => {
          if (els.gapSizeDisplay) els.gapSizeDisplay.classList.remove('gap-pulse');
        }, 350);
      }
    });

    Game.on('reset', () => {
      hideRoundWinnerOverlay();
      clearUI();
    });
  }

  /* ══════════════════════════════════════════
     UI UPDATE (called each frame)
     ══════════════════════════════════════════ */
  function updateUI() {
    const Game = window.FB.Game;
    const state = Game.state;

    // Update counters
    els.remainingCount.textContent = state.remaining;
    els.eliminatedCount.textContent = state.eliminationOrder.length;
    els.flagsInRound.textContent = state.remaining;
    els.roundNumber.textContent = state.round;
    els.roundTotal.textContent = (state.maxRounds && isFinite(state.maxRounds)) ? state.maxRounds : '∞';
    updateGapDisplay();

    // Auto countdown footer updates
    if (state.phase === 'round_end' || state.phase === 'champion') {
      const secsLeft = Math.max(1, Math.ceil(Game.autoNextTimer));
      if (els.roundWinnerFooter) {
        if (state.autoMode) {
          els.roundWinnerFooter.textContent = `Next round starting in ${secsLeft}s... (Click to skip)`;
        } else {
          els.roundWinnerFooter.textContent = 'Click anywhere or press Space for Next Round';
        }
      }
      if (els.championFooterText) {
        if (state.autoMode) {
          els.championFooterText.textContent = `Next battle starting in ${secsLeft}s... (Click to skip)`;
        } else {
          els.championFooterText.textContent = 'Click anywhere for Next Battle';
        }
      }
    }

    // Throttle expensive UI updates (every 10 frames)
    uiUpdateCounter++;
    if (uiUpdateCounter % 10 === 0) {
      updateScoreboardUI();
      updateScoresUI();
    }

    // All-time stats
    els.allTimeRounds.textContent = state.allTimeRounds;
    els.allTimeEliminations.textContent = state.allTimeEliminations;

    // Keep Safe Country banner hidden in string-cutting mode
    if (els.safeLeaderBanner) {
      els.safeLeaderBanner.classList.add('hidden');
    }
  }

  /** Update last eliminated display */
  function updateLastEliminated(code, name) {
    if (!code) return;
    els.lastEliminatedFlag.src = 'https://flagcdn.com/w40/' + code.toLowerCase() + '.png';
    els.lastEliminatedFlag.alt = name;

    const Data = window.FB.Data;
    const lastLabel = Data ? Data.t('last') : 'Last';
    els.lastEliminatedName.textContent = lastLabel + ': ' + name;
  }

  /** Rebuild the scoreboard (top 5 by wins) */
  function updateScoreboardUI() {
    const Game = window.FB.Game;
    const entries = Game.getScoreboard();
    const list = els.scoreboardList;
    list.innerHTML = '';

    entries.forEach((entry, idx) => {
      const row = document.createElement('div');
      row.className = 'scoreboard-entry';

      // Rank
      const rank = document.createElement('span');
      rank.className = 'scoreboard-rank' + (idx === 0 ? ' gold' : '');
      rank.textContent = '#' + (idx + 1);

      // Flag image
      const flag = document.createElement('img');
      flag.className = 'scoreboard-flag';
      flag.src = 'https://flagcdn.com/w40/' + entry.code.toLowerCase() + '.png';
      flag.alt = entry.name;
      flag.loading = 'lazy';

      // Name
      const name = document.createElement('span');
      name.className = 'scoreboard-name';
      name.textContent = entry.name;

      // Win dots / score display (safe for infinite rounds)
      const dots = document.createElement('span');
      dots.className = 'scoreboard-wins';
      if (isFinite(Game.state.maxRounds) && Game.state.maxRounds <= 5) {
        for (let i = 0; i < Game.state.maxRounds; i++) {
          const dot = document.createElement('span');
          dot.className = 'win-dot' + (i < entry.wins ? ' filled' : '');
          dots.appendChild(dot);
        }
      } else {
        const badge = document.createElement('span');
        badge.className = 'scoreboard-score';
        badge.textContent = entry.wins > 0 ? ('🏆 ' + entry.wins) : '-';
        dots.appendChild(badge);
      }

      row.appendChild(rank);
      row.appendChild(flag);
      row.appendChild(name);
      row.appendChild(dots);
      list.appendChild(row);
    });
  }

  /** Rebuild the round scores / top performers tab */
  function updateScoresUI() {
    const Game = window.FB.Game;
    const list = els.roundScoresList;
    list.innerHTML = '';

    let entries;
    if (currentTab === 'roundScores') {
      entries = Game.getRoundScores();
    } else {
      // Top performers: use scoreboard with score-like display
      entries = Game.getScoreboard().map(e => ({
        code: e.code,
        name: e.name,
        score: e.wins
      }));
    }

    entries.forEach((entry, idx) => {
      const row = document.createElement('div');
      row.className = 'score-entry';

      const rank = document.createElement('span');
      rank.className = 'score-rank';
      rank.textContent = '#' + (idx + 1);

      const flag = document.createElement('img');
      flag.className = 'score-flag';
      flag.src = 'https://flagcdn.com/w40/' + entry.code.toLowerCase() + '.png';
      flag.alt = entry.name;
      flag.loading = 'lazy';

      const name = document.createElement('span');
      name.className = 'score-name';
      name.textContent = entry.name;

      const score = document.createElement('span');
      score.className = 'score-value';
      score.textContent = entry.score;

      row.appendChild(rank);
      row.appendChild(flag);
      row.appendChild(name);
      row.appendChild(score);
      list.appendChild(row);
    });
  }

  /** Update flag count display */
  function updateFlagCountDisplay() {
    if (els.flagCountDisplay) {
      els.flagCountDisplay.textContent = window.FB.Game.state.flagCount;
    }
  }

  /** Update flag speed display */
  function updateSpeedDisplay() {
    if (els.speedDisplay) {
      els.speedDisplay.textContent = window.FB.Game.state.speedMultiplier.toFixed(1) + 'x';
    }
  }

  /** Update strings per flag display */
  function updateStringsDisplay() {
    if (els.stringsDisplay) {
      var val = (window.FB.Physics && window.FB.Physics._stringsPerFlag) ? window.FB.Physics._stringsPerFlag : 11;
      els.stringsDisplay.textContent = val;
    }
  }

  /** Update intro duration display */
  function updateIntroDisplay() {
    if (els.introDisplay) {
      var val = (window.FB.Physics && window.FB.Physics.introDuration !== undefined) ? window.FB.Physics.introDuration : 3.2;
      els.introDisplay.textContent = val.toFixed(1) + 's';
    }
  }

  /** Update grand champion timer display */
  function updateChampDisplay() {
    if (els.champDisplay) {
      var secs = Math.max(0, Math.floor((window.FB.Game && window.FB.Game.grandChampionTimer !== undefined) ? window.FB.Game.grandChampionTimer : 240));
      var mm = String(Math.floor(secs / 60)).padStart(1, '0');
      var ss = String(secs % 60).padStart(2, '0');
      els.champDisplay.textContent = mm + ':' + ss;
    }
  }

  /** Update gap display (no-op for new game, kept for compatibility) */
  function updateGapDisplay() {}

  /** Update bounce display (no-op for new game, kept for compatibility) */
  function updateBounceDisplay() {}

  /** Show round winner overlay */
  function showRoundWinnerOverlay(code, name, round, wins) {
    if (!els.roundWinnerOverlay) return;

    const Data = window.FB.Data;
    const countryName = name || (Data && code ? Data.getCountryName(code) : (code ? code.toUpperCase() : 'Winner'));

    if (els.roundWinnerNumber) els.roundWinnerNumber.textContent = round || 1;
    if (els.roundWinnerFlag) {
      els.roundWinnerFlag.src = 'https://flagcdn.com/w160/' + (code ? code.toLowerCase() : 'un') + '.png';
      els.roundWinnerFlag.alt = countryName;
    }
    if (els.roundWinnerName) els.roundWinnerName.textContent = countryName;
    if (els.roundWinnerWins) els.roundWinnerWins.textContent = wins || 1;
    if (els.roundWinnerFooter) {
      const isAuto = window.FB.Game && window.FB.Game.state.autoMode;
      els.roundWinnerFooter.textContent = isAuto
        ? 'Next round starting soon... or click anywhere to skip'
        : 'Click anywhere or press Space for Next Round';
    }

    // Spawn animated CSS confetti pieces over the card
    const existingConfetti = els.roundWinnerOverlay.querySelectorAll('.winner-confetti-particle');
    existingConfetti.forEach(c => c.remove());

    const confettiColors = ['#ffd700', '#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#ff6b81', '#ffffff', '#a55eea'];
    for (let i = 0; i < 36; i++) {
      const p = document.createElement('div');
      p.className = 'winner-confetti-particle';
      const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      const sizeW = 6 + Math.random() * 8;
      const sizeH = 4 + Math.random() * 6;
      const startX = 6 + Math.random() * 88;
      const startY = -12 - Math.random() * 20;
      const driftX = (Math.random() - 0.5) * 160;
      const duration = 1.6 + Math.random() * 1.4;
      const delay = Math.random() * 0.45;
      const rot = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720);

      p.style.width = sizeW + 'px';
      p.style.height = sizeH + 'px';
      p.style.background = color;
      p.style.left = startX + '%';
      p.style.top = startY + '%';
      p.style.setProperty('--drift-x', driftX + 'px');
      p.style.setProperty('--rot', rot + 'deg');
      p.style.animationDuration = duration + 's';
      p.style.animationDelay = delay + 's';

      els.roundWinnerOverlay.appendChild(p);
    }

    els.roundWinnerOverlay.classList.remove('hidden');

    // Pop canvas confetti
    if (window.FB.Renderer && window.FB.Renderer.canvas) {
      const W = window.FB.Renderer.canvas.width;
      const H = window.FB.Renderer.canvas.height;
      window.FB.Renderer.addParticles('confetti', W * 0.5, H * 0.42, 90);
      window.FB.Renderer.addParticles('confetti', W * 0.25, H * 0.35, 40);
      window.FB.Renderer.addParticles('confetti', W * 0.75, H * 0.35, 40);
    }

    // Play victory tone fanfare
    if (window.FB.Sound) {
      window.FB.Sound.play('victory');
    }
  }

  /** Hide round winner overlay */
  function hideRoundWinnerOverlay() {
    if (els.roundWinnerOverlay) {
      els.roundWinnerOverlay.classList.add('hidden');
    }
  }

  /** Show champion overlay */
  function showChampionOverlay(code, name, wins) {
    hideRoundWinnerOverlay();
    if (els.championFlagImg) {
      els.championFlagImg.src = 'https://flagcdn.com/w160/' + code.toLowerCase() + '.png';
      els.championFlagImg.alt = name;
    }
    if (els.championCountryName) els.championCountryName.textContent = name;
    if (els.championWinsCount) els.championWinsCount.textContent = wins;
    if (els.championOverlay) els.championOverlay.classList.remove('hidden');

    if (window.FB.Renderer && window.FB.Renderer.canvas) {
      const W = window.FB.Renderer.canvas.width;
      const H = window.FB.Renderer.canvas.height;
      window.FB.Renderer.addParticles('confetti', W * 0.5, H * 0.5, 120);
    }
  }

  /** Clear all UI to initial state */
  function clearUI() {
    els.remainingCount.textContent = '0';
    els.eliminatedCount.textContent = '0';
    els.flagsInRound.textContent = '0';
    els.roundNumber.textContent = '1';
    els.roundTotal.textContent = (window.FB.Game && window.FB.Game.state.maxRounds && isFinite(window.FB.Game.state.maxRounds)) ? window.FB.Game.state.maxRounds : '∞';
    els.lastEliminatedFlag.src = '';
    const Data = window.FB.Data;
    const lastLabel = Data ? Data.t('last') : 'Last';
    els.lastEliminatedName.textContent = lastLabel + ': ---';
    els.scoreboardList.innerHTML = '';
    els.roundScoresList.innerHTML = '';
    els.championOverlay.classList.add('hidden');
    hideRoundWinnerOverlay();
    if (els.safeLeaderBanner) els.safeLeaderBanner.classList.add('hidden');
    els.btnPause.textContent = '⏸';
    els.btnPause.classList.remove('active');
    updateFlagCountDisplay();
    updateGapDisplay();
    updateSpeedDisplay();
    updateBounceDisplay();
  }

  /** Render initial idle state (empty arena with ring) */
  function renderIdleState() {
    if (window.FB.Renderer) {
      window.FB.Renderer.render(
        window.FB.Game ? window.FB.Game.getRenderState() : (window.FB.Physics ? window.FB.Physics.getState() : null)
      );
    }
  }

  /* ══════════════════════════════════════════
     GAME LOOP
     ══════════════════════════════════════════ */
  function startGameLoop() {
    lastFrameTime = performance.now();
    requestAnimationFrame(gameLoop);
  }

  function gameLoop(timestamp) {
    // Fixed timestep approach: we always pass dt=1 "tick"
    const dt = 1;

    const Game = window.FB.Game;

    if (Game.state.phase === 'playing' || Game.state.phase === 'round_end' || Game.state.phase === 'champion') {
      Game.update(dt);
      updateUI();
    } else if (Game.state.phase === 'idle') {
      // Still render the idle view
      if (window.FB.Renderer) {
        window.FB.Renderer.updateParticles(1 / 60);
        window.FB.Renderer.render(Game.getRenderState());
      }
    }

    requestAnimationFrame(gameLoop);
  }

  /* ══════════════════════════════════════════
     UTILITIES
     ══════════════════════════════════════════ */

  /** Simple debounce */
  function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /* ══════════════════════════════════════════
     BOOTSTRAP
     ══════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', init);

  window.FB.App = {
    switchLanguage,
    setArenaTheme,
    clearUI,
    resizeCanvas
  };
})();
