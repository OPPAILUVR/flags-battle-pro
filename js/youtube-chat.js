/**
 * Flags Battle Pro — YouTube Live Chat Integration
 * Connects to YouTube Data API v3 live chat and parses viewer messages
 * for flag emojis, country names, and commands (e.g. KKTC).
 *
 * Namespace: window.FB.YouTubeChat
 */
(function () {
  'use strict';
  window.FB = window.FB || {};

  window.FB.YouTubeChat = {
    apiKey: '',
    videoId: '',
    activeLiveChatId: null,
    nextPageToken: null,
    isPolling: false,
    pollTimer: null,
    status: 'disconnected', // 'disconnected' | 'connecting' | 'connected' | 'error'
    statusMessage: '',
    processedIds: {},
    recentBoosts: [],
    topSupporters: {},
    listeners: [],

    init: function () {
      try {
        this.apiKey = localStorage.getItem('fb_yt_api_key') || '';
        this.videoId = localStorage.getItem('fb_yt_video_id') || '';
      } catch (e) {
        // localStorage not available
      }
    },

    /**
     * Extracts YouTube video ID from various URL formats or bare ID.
     */
    extractVideoId: function (input) {
      if (!input) return '';
      input = input.trim();
      // Bare 11-char ID
      if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
        return input;
      }
      // Standard watch URL: youtube.com/watch?v=...
      var match = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
      if (match) return match[1];
      // Shortened URL: youtu.be/...
      match = input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
      if (match) return match[1];
      // Live URL: youtube.com/live/...
      match = input.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
      if (match) return match[1];
      // Embed URL: youtube.com/embed/...
      match = input.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
      if (match) return match[1];
      return input;
    },

    /**
     * Connect to live stream using API Key & Video ID/URL.
     */
    connect: function (apiKey, videoInput, callback) {
      var self = this;
      self.disconnect();

      apiKey = (apiKey || '').trim();
      var videoId = self.extractVideoId(videoInput);

      if (!apiKey) {
        self.status = 'error';
        self.statusMessage = 'API Key is required';
        self._notifyStatus();
        if (callback) callback(false, self.statusMessage);
        return;
      }

      if (!videoId) {
        self.status = 'error';
        self.statusMessage = 'Invalid Video ID or URL';
        self._notifyStatus();
        if (callback) callback(false, self.statusMessage);
        return;
      }

      self.apiKey = apiKey;
      self.videoId = videoId;
      self.status = 'connecting';
      self.statusMessage = 'Fetching live stream details...';
      self._notifyStatus();

      // Save to localStorage
      try {
        localStorage.setItem('fb_yt_api_key', apiKey);
        localStorage.setItem('fb_yt_video_id', videoId);
      } catch (e) {}

      var url = 'https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails,snippet&id=' +
        encodeURIComponent(videoId) + '&key=' + encodeURIComponent(apiKey);

      fetch(url)
        .then(function (res) {
          if (!res.ok) {
            return res.json().then(function (err) {
              throw new Error((err.error && err.error.message) || ('HTTP Error ' + res.status));
            });
          }
          return res.json();
        })
        .then(function (data) {
          if (!data.items || data.items.length === 0) {
            throw new Error('Video not found. Please verify the Video ID.');
          }
          var video = data.items[0];
          var streamDetails = video.liveStreamingDetails;
          if (!streamDetails || !streamDetails.activeLiveChatId) {
            throw new Error('This video is not an active live stream with live chat enabled.');
          }

          self.activeLiveChatId = streamDetails.activeLiveChatId;
          self.status = 'connected';
          self.statusMessage = 'Connected to: ' + (video.snippet ? video.snippet.title : videoId);
          self._notifyStatus();
          self.startPolling();
          if (callback) callback(true, self.statusMessage);
        })
        .catch(function (err) {
          self.status = 'error';
          self.statusMessage = err.message || 'Connection failed';
          self._notifyStatus();
          if (callback) callback(false, self.statusMessage);
        });
    },

    disconnect: function () {
      if (this.pollTimer) {
        clearTimeout(this.pollTimer);
        this.pollTimer = null;
      }
      this.isPolling = false;
      this.activeLiveChatId = null;
      this.nextPageToken = null;
      this.status = 'disconnected';
      this.statusMessage = '';
      this._notifyStatus();
    },

    startPolling: function () {
      this.isPolling = true;
      this.poll();
    },

    poll: function () {
      var self = this;
      if (!self.isPolling || !self.activeLiveChatId || !self.apiKey) return;

      var url = 'https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=' +
        encodeURIComponent(self.activeLiveChatId) +
        '&part=snippet,authorDetails&key=' + encodeURIComponent(self.apiKey);

      if (self.nextPageToken) {
        url += '&pageToken=' + encodeURIComponent(self.nextPageToken);
      }

      fetch(url)
        .then(function (res) {
          if (!res.ok) {
            return res.json().then(function (err) {
              throw new Error((err.error && err.error.message) || ('HTTP ' + res.status));
            });
          }
          return res.json();
        })
        .then(function (data) {
          if (!self.isPolling) return;

          self.nextPageToken = data.nextPageToken;
          var interval = Math.max(1500, data.pollingIntervalMillis || 3000);

          if (data.items && data.items.length > 0) {
            self._processIncoming(data.items);
          }

          self.pollTimer = setTimeout(function () {
            self.poll();
          }, interval);
        })
        .catch(function (err) {
          if (!self.isPolling) return;
          console.warn('[YouTubeChat] Poll warning:', err.message);
          // Wait 5 seconds before retrying
          self.pollTimer = setTimeout(function () {
            self.poll();
          }, 5000);
        });
    },

    _processIncoming: function (items) {
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (this.processedIds[item.id]) continue;
        this.processedIds[item.id] = true;

        var author = (item.authorDetails && item.authorDetails.displayName) || 'Viewer';
        var message = (item.snippet && item.snippet.displayMessage) || '';

        this.processMessage(author, message);
      }
    },

    /**
     * Process a chat message: parse country, add support, notify UI & sound.
     */
    processMessage: function (author, messageText) {
      if (!messageText) return;
      var Data = window.FB.Data;
      if (!Data || !Data.findCountriesInText) return;

      var matchedCodes = Data.findCountriesInText(messageText);
      if (matchedCodes.length === 0) return;

      for (var i = 0; i < matchedCodes.length; i++) {
        var code = matchedCodes[i];
        var countryName = Data.getFlagName(code);
        var flag = Data.FLAGS.find(function (f) { return f.code === code; });
        var emoji = flag ? flag.emoji : '🏁';

        // Add support in game
        if (window.FB.Game) {
          window.FB.Game.addSupport(code, 1);
        }

        // Record viewer country activity for Audience Retention
        if (window.FB.ViewerAudience && window.FB.ViewerAudience.recordActivity) {
          window.FB.ViewerAudience.recordActivity(code, author);
        }

        // Track supporter
        if (!this.topSupporters[author]) {
          this.topSupporters[author] = { name: author, total: 0, countries: {} };
        }
        this.topSupporters[author].total++;
        this.topSupporters[author].countries[code] = (this.topSupporters[author].countries[code] || 0) + 1;

        // Record recent boost
        var boost = {
          id: Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          author: author,
          code: code,
          countryName: countryName,
          emoji: emoji,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };

        this.recentBoosts.unshift(boost);
        if (this.recentBoosts.length > 50) {
          this.recentBoosts.pop();
        }

        // Notify subscribers
        this._notifyBoost(boost);

        // TTS announcement if enabled
        if (window.FB.Game && window.FB.Game.state.ttsEnabled && window.FB.Sound) {
          window.FB.Sound.speak(author + ' supported ' + countryName);
        }
      }
    },

    /**
     * Send a simulated or test chat message.
     */
    sendTestMessage: function (author, messageText) {
      author = (author || 'Streamer').trim();
      messageText = (messageText || '').trim();
      if (!messageText) return;
      this.processMessage(author, messageText);
    },

    onBoost: function (callback) {
      this.listeners.push(callback);
    },

    _notifyBoost: function (boost) {
      for (var i = 0; i < this.listeners.length; i++) {
        try {
          this.listeners[i](boost);
        } catch (e) {
          console.error('[YouTubeChat] listener error:', e);
        }
      }
    },

    onStatusChange: function (callback) {
      this._statusCallback = callback;
    },

    _notifyStatus: function () {
      if (this._statusCallback) {
        try {
          this._statusCallback(this.status, this.statusMessage);
        } catch (e) {}
      }
    }
  };

  // Pre-init
  window.FB.YouTubeChat.init();
})();

