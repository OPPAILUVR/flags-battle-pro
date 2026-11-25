/**
 * Flags Battle Pro — Data Module
 * Complete flag database, internationalization strings, and theme metadata.
 * 
 * Namespace: window.FB.Data
 */
(function() {
  'use strict';

  window.FB = window.FB || {};

  window.FB.Data = {
    /** Current language code ('en' or 'tr') */
    lang: 'en',

    // ──────────────────────────────────────────────
    // ALL countries – ISO 3166-1 alpha-2 codes
    // ──────────────────────────────────────────────
    FLAGS: [
      { code: 'af', name: 'Afghanistan', nameTR: 'Afganistan', emoji: '🇦🇫' },
      { code: 'al', name: 'Albania', nameTR: 'Arnavutluk', emoji: '🇦🇱' },
      { code: 'dz', name: 'Algeria', nameTR: 'Cezayir', emoji: '🇩🇿' },
      { code: 'ad', name: 'Andorra', nameTR: 'Andorra', emoji: '🇦🇩' },
      { code: 'ao', name: 'Angola', nameTR: 'Angola', emoji: '🇦🇴' },
      { code: 'ar', name: 'Argentina', nameTR: 'Arjantin', emoji: '🇦🇷' },
      { code: 'am', name: 'Armenia', nameTR: 'Ermenistan', emoji: '🇦🇲' },
      { code: 'au', name: 'Australia', nameTR: 'Avustralya', emoji: '🇦🇺' },
      { code: 'at', name: 'Austria', nameTR: 'Avusturya', emoji: '🇦🇹' },
      { code: 'az', name: 'Azerbaijan', nameTR: 'Azerbaycan', emoji: '🇦🇿' },
      { code: 'bh', name: 'Bahrain', nameTR: 'Bahreyn', emoji: '🇧🇭' },
      { code: 'bd', name: 'Bangladesh', nameTR: 'Bangladeş', emoji: '🇧🇩' },
      { code: 'by', name: 'Belarus', nameTR: 'Belarus', emoji: '🇧🇾' },
      { code: 'be', name: 'Belgium', nameTR: 'Belçika', emoji: '🇧🇪' },
      { code: 'bz', name: 'Belize', nameTR: 'Belize', emoji: '🇧🇿' },
      { code: 'bj', name: 'Benin', nameTR: 'Benin', emoji: '🇧🇯' },
      { code: 'bo', name: 'Bolivia', nameTR: 'Bolivya', emoji: '🇧🇴' },
      { code: 'ba', name: 'Bosnia', nameTR: 'Bosna Hersek', emoji: '🇧🇦' },
      { code: 'bw', name: 'Botswana', nameTR: 'Botsvana', emoji: '🇧🇼' },
      { code: 'br', name: 'Brazil', nameTR: 'Brezilya', emoji: '🇧🇷' },
      { code: 'bn', name: 'Brunei', nameTR: 'Brunei', emoji: '🇧🇳' },
      { code: 'bg', name: 'Bulgaria', nameTR: 'Bulgaristan', emoji: '🇧🇬' },
      { code: 'kh', name: 'Cambodia', nameTR: 'Kamboçya', emoji: '🇰🇭' },
      { code: 'cm', name: 'Cameroon', nameTR: 'Kamerun', emoji: '🇨🇲' },
      { code: 'ca', name: 'Canada', nameTR: 'Kanada', emoji: '🇨🇦' },
      { code: 'cl', name: 'Chile', nameTR: 'Şili', emoji: '🇨🇱' },
      { code: 'cn', name: 'China', nameTR: 'Çin', emoji: '🇨🇳' },
      { code: 'co', name: 'Colombia', nameTR: 'Kolombiya', emoji: '🇨🇴' },
      { code: 'cr', name: 'Costa Rica', nameTR: 'Kosta Rika', emoji: '🇨🇷' },
      { code: 'hr', name: 'Croatia', nameTR: 'Hırvatistan', emoji: '🇭🇷' },
      { code: 'cu', name: 'Cuba', nameTR: 'Küba', emoji: '🇨🇺' },
      { code: 'cy', name: 'Cyprus', nameTR: 'Kıbrıs', emoji: '🇨🇾' },
      { code: 'cz', name: 'Czechia', nameTR: 'Çekya', emoji: '🇨🇿' },
      { code: 'cd', name: 'DR Congo', nameTR: 'Kongo DC', emoji: '🇨🇩' },
      { code: 'dk', name: 'Denmark', nameTR: 'Danimarka', emoji: '🇩🇰' },
      { code: 'do', name: 'Dominican Rep.', nameTR: 'Dominik Cum.', emoji: '🇩🇴' },
      { code: 'ec', name: 'Ecuador', nameTR: 'Ekvador', emoji: '🇪🇨' },
      { code: 'eg', name: 'Egypt', nameTR: 'Mısır', emoji: '🇪🇬' },
      { code: 'sv', name: 'El Salvador', nameTR: 'El Salvador', emoji: '🇸🇻' },
      { code: 'ee', name: 'Estonia', nameTR: 'Estonya', emoji: '🇪🇪' },
      { code: 'et', name: 'Ethiopia', nameTR: 'Etiyopya', emoji: '🇪🇹' },
      { code: 'fj', name: 'Fiji', nameTR: 'Fiji', emoji: '🇫🇯' },
      { code: 'fi', name: 'Finland', nameTR: 'Finlandiya', emoji: '🇫🇮' },
      { code: 'fr', name: 'France', nameTR: 'Fransa', emoji: '🇫🇷' },
      { code: 'ga', name: 'Gabon', nameTR: 'Gabon', emoji: '🇬🇦' },
      { code: 'ge', name: 'Georgia', nameTR: 'Gürcistan', emoji: '🇬🇪' },
      { code: 'de', name: 'Germany', nameTR: 'Almanya', emoji: '🇩🇪' },
      { code: 'gh', name: 'Ghana', nameTR: 'Gana', emoji: '🇬🇭' },
      { code: 'gr', name: 'Greece', nameTR: 'Yunanistan', emoji: '🇬🇷' },
      { code: 'gt', name: 'Guatemala', nameTR: 'Guatemala', emoji: '🇬🇹' },
      { code: 'hn', name: 'Honduras', nameTR: 'Honduras', emoji: '🇭🇳' },
      { code: 'hu', name: 'Hungary', nameTR: 'Macaristan', emoji: '🇭🇺' },
      { code: 'is', name: 'Iceland', nameTR: 'İzlanda', emoji: '🇮🇸' },
      { code: 'in', name: 'India', nameTR: 'Hindistan', emoji: '🇮🇳' },
      { code: 'id', name: 'Indonesia', nameTR: 'Endonezya', emoji: '🇮🇩' },
      { code: 'ir', name: 'Iran', nameTR: 'İran', emoji: '🇮🇷' },
      { code: 'iq', name: 'Iraq', nameTR: 'Irak', emoji: '🇮🇶' },
      { code: 'ie', name: 'Ireland', nameTR: 'İrlanda', emoji: '🇮🇪' },
      { code: 'il', name: 'Israel', nameTR: 'İsrail', emoji: '🇮🇱' },
      { code: 'it', name: 'Italy', nameTR: 'İtalya', emoji: '🇮🇹' },
      { code: 'ci', name: 'Ivory Coast', nameTR: 'Fildişi Sahili', emoji: '🇨🇮' },
      { code: 'jm', name: 'Jamaica', nameTR: 'Jamaika', emoji: '🇯🇲' },
      { code: 'jp', name: 'Japan', nameTR: 'Japonya', emoji: '🇯🇵' },
      { code: 'jo', name: 'Jordan', nameTR: 'Ürdün', emoji: '🇯🇴' },
      { code: 'kz', name: 'Kazakhstan', nameTR: 'Kazakistan', emoji: '🇰🇿' },
      { code: 'ke', name: 'Kenya', nameTR: 'Kenya', emoji: '🇰🇪' },
      { code: 'kw', name: 'Kuwait', nameTR: 'Kuveyt', emoji: '🇰🇼' },
      { code: 'kg', name: 'Kyrgyzstan', nameTR: 'Kırgızistan', emoji: '🇰🇬' },
      { code: 'la', name: 'Laos', nameTR: 'Laos', emoji: '🇱🇦' },
      { code: 'lv', name: 'Latvia', nameTR: 'Letonya', emoji: '🇱🇻' },
      { code: 'lb', name: 'Lebanon', nameTR: 'Lübnan', emoji: '🇱🇧' },
      { code: 'ly', name: 'Libya', nameTR: 'Libya', emoji: '🇱🇾' },
      { code: 'lt', name: 'Lithuania', nameTR: 'Litvanya', emoji: '🇱🇹' },
      { code: 'lu', name: 'Luxembourg', nameTR: 'Lüksemburg', emoji: '🇱🇺' },
      { code: 'mg', name: 'Madagascar', nameTR: 'Madagaskar', emoji: '🇲🇬' },
      { code: 'my', name: 'Malaysia', nameTR: 'Malezya', emoji: '🇲🇾' },
      { code: 'ml', name: 'Mali', nameTR: 'Mali', emoji: '🇲🇱' },
      { code: 'mt', name: 'Malta', nameTR: 'Malta', emoji: '🇲🇹' },
      { code: 'mx', name: 'Mexico', nameTR: 'Meksika', emoji: '🇲🇽' },
      { code: 'mn', name: 'Mongolia', nameTR: 'Moğolistan', emoji: '🇲🇳' },
      { code: 'me', name: 'Montenegro', nameTR: 'Karadağ', emoji: '🇲🇪' },
      { code: 'ma', name: 'Morocco', nameTR: 'Fas', emoji: '🇲🇦' },
      { code: 'mz', name: 'Mozambique', nameTR: 'Mozambik', emoji: '🇲🇿' },
      { code: 'mm', name: 'Myanmar', nameTR: 'Myanmar', emoji: '🇲🇲' },
      { code: 'na', name: 'Namibia', nameTR: 'Namibya', emoji: '🇳🇦' },
      { code: 'np', name: 'Nepal', nameTR: 'Nepal', emoji: '🇳🇵' },
      { code: 'nl', name: 'Netherlands', nameTR: 'Hollanda', emoji: '🇳🇱' },
      { code: 'nz', name: 'New Zealand', nameTR: 'Yeni Zelanda', emoji: '🇳🇿' },
      { code: 'ni', name: 'Nicaragua', nameTR: 'Nikaragua', emoji: '🇳🇮' },
      { code: 'ng', name: 'Nigeria', nameTR: 'Nijerya', emoji: '🇳🇬' },
      { code: 'kp', name: 'North Korea', nameTR: 'Kuzey Kore', emoji: '🇰🇵' },
      { code: 'mk', name: 'North Macedonia', nameTR: 'Kuzey Makedonya', emoji: '🇲🇰' },
      { code: 'no', name: 'Norway', nameTR: 'Norveç', emoji: '🇳🇴' },
      { code: 'om', name: 'Oman', nameTR: 'Umman', emoji: '🇴🇲' },
      { code: 'pk', name: 'Pakistan', nameTR: 'Pakistan', emoji: '🇵🇰' },
      { code: 'ps', name: 'Palestine', nameTR: 'Filistin', emoji: '🇵🇸' },
      { code: 'pa', name: 'Panama', nameTR: 'Panama', emoji: '🇵🇦' },
      { code: 'py', name: 'Paraguay', nameTR: 'Paraguay', emoji: '🇵🇾' },
      { code: 'pe', name: 'Peru', nameTR: 'Peru', emoji: '🇵🇪' },
      { code: 'ph', name: 'Philippines', nameTR: 'Filipinler', emoji: '🇵🇭' },
      { code: 'pl', name: 'Poland', nameTR: 'Polonya', emoji: '🇵🇱' },
      { code: 'pt', name: 'Portugal', nameTR: 'Portekiz', emoji: '🇵🇹' },
      { code: 'qa', name: 'Qatar', nameTR: 'Katar', emoji: '🇶🇦' },
      { code: 'ro', name: 'Romania', nameTR: 'Romanya', emoji: '🇷🇴' },
      { code: 'ru', name: 'Russia', nameTR: 'Rusya', emoji: '🇷🇺' },
      { code: 'rw', name: 'Rwanda', nameTR: 'Ruanda', emoji: '🇷🇼' },
      { code: 'sa', name: 'Saudi Arabia', nameTR: 'Suudi Arabistan', emoji: '🇸🇦' },
      { code: 'sn', name: 'Senegal', nameTR: 'Senegal', emoji: '🇸🇳' },
      { code: 'rs', name: 'Serbia', nameTR: 'Sırbistan', emoji: '🇷🇸' },
      { code: 'sg', name: 'Singapore', nameTR: 'Singapur', emoji: '🇸🇬' },
      { code: 'sk', name: 'Slovakia', nameTR: 'Slovakya', emoji: '🇸🇰' },
      { code: 'si', name: 'Slovenia', nameTR: 'Slovenya', emoji: '🇸🇮' },
      { code: 'so', name: 'Somalia', nameTR: 'Somali', emoji: '🇸🇴' },
      { code: 'za', name: 'South Africa', nameTR: 'Güney Afrika', emoji: '🇿🇦' },
      { code: 'kr', name: 'South Korea', nameTR: 'Güney Kore', emoji: '🇰🇷' },
      { code: 'es', name: 'Spain', nameTR: 'İspanya', emoji: '🇪🇸' },
      { code: 'lk', name: 'Sri Lanka', nameTR: 'Sri Lanka', emoji: '🇱🇰' },
      { code: 'sd', name: 'Sudan', nameTR: 'Sudan', emoji: '🇸🇩' },
      { code: 'se', name: 'Sweden', nameTR: 'İsveç', emoji: '🇸🇪' },
      { code: 'ch', name: 'Switzerland', nameTR: 'İsviçre', emoji: '🇨🇭' },
      { code: 'sy', name: 'Syria', nameTR: 'Suriye', emoji: '🇸🇾' },
      { code: 'tw', name: 'Taiwan', nameTR: 'Tayvan', emoji: '🇹🇼' },
      { code: 'tj', name: 'Tajikistan', nameTR: 'Tacikistan', emoji: '🇹🇯' },
      { code: 'tz', name: 'Tanzania', nameTR: 'Tanzanya', emoji: '🇹🇿' },
      { code: 'th', name: 'Thailand', nameTR: 'Tayland', emoji: '🇹🇭' },
      { code: 'tn', name: 'Tunisia', nameTR: 'Tunus', emoji: '🇹🇳' },
      { code: 'tr', name: 'Turkey', nameTR: 'Türkiye', emoji: '🇹🇷' },
      { code: 'tm', name: 'Turkmenistan', nameTR: 'Türkmenistan', emoji: '🇹🇲' },
      { code: 'ug', name: 'Uganda', nameTR: 'Uganda', emoji: '🇺🇬' },
      { code: 'ua', name: 'Ukraine', nameTR: 'Ukrayna', emoji: '🇺🇦' },
      { code: 'ae', name: 'UAE', nameTR: 'BAE', emoji: '🇦🇪' },
      { code: 'gb', name: 'United Kingdom', nameTR: 'Birleşik Krallık', emoji: '🇬🇧' },
      { code: 'us', name: 'United States', nameTR: 'ABD', emoji: '🇺🇸' },
      { code: 'uy', name: 'Uruguay', nameTR: 'Uruguay', emoji: '🇺🇾' },
      { code: 'uz', name: 'Uzbekistan', nameTR: 'Özbekistan', emoji: '🇺🇿' },
      { code: 've', name: 'Venezuela', nameTR: 'Venezuela', emoji: '🇻🇪' },
      { code: 'vn', name: 'Vietnam', nameTR: 'Vietnam', emoji: '🇻🇳' },
      { code: 'ye', name: 'Yemen', nameTR: 'Yemen', emoji: '🇾🇪' },
      { code: 'zm', name: 'Zambia', nameTR: 'Zambiya', emoji: '🇿🇲' },
      { code: 'zw', name: 'Zimbabwe', nameTR: 'Zimbabve', emoji: '🇿🇼' }
    ],

    // ──────────────────────────────────────────────
    // Internationalization strings (EN / TR)
    // ──────────────────────────────────────────────
    STRINGS: {
      en: {
        start: 'Start', reset: 'Reset', pause: 'Pause', resume: 'Resume',
        round: 'Round', flags: 'flags', remaining: 'remaining', eliminated: 'eliminated',
        last: 'Last', champion: 'CHAMPION', wins: 'WINS', topWinners: 'TOP WINNERS',
        scoreboard: 'Scoreboard', topN: 'top 5', roundScores: 'Round scores',
        topPerformers: 'Top performers', allTime: 'All time', rounds: 'rounds',
        eliminations: 'eliminations', flagsInArena: 'Flags in the arena',
        modes: 'Modes', auto: 'Auto', autoDesc: 'Next round starts by itself',
        lightning: 'Lightning', lightningDesc: 'Strikes knock out flags',
        chaos: 'Chaos', chaosDesc: 'Random events in the arena',
        chat: 'Chat', chatDesc: 'Viewers boost their country',
        testKeys: 'Test keys', testKeysDesc: 'Try boosts with keys',
        arena: 'Arena', tools: 'Tools', champions: 'Champions', messages: 'Messages',
        match: 'Match', normalMode: 'Normal Mode',
        normalDesc: 'Classic battle royale! The circle opens, flags fall through the gap. Last flag standing wins. First to 3 victories becomes the champion!',
        lightningMode: 'Lightning Mode',
        lightningModeDesc: 'No gap! Lightning strikes from the sky, eliminating random flags. Survive the storm and be the last one standing!',
        chaosMode: 'Chaos Mode',
        chaosModeDesc: 'Shrinking arena, moving center, random events! Vortex pulls, wind forces, speed bursts, and chaos spins. Pure unpredictable madness!',
        live: 'Live', orbit: 'Orbit', stadium: 'Stadium', synthwave: 'Synthwave',
        dunes: 'Dunes', deepsea: 'Deep sea', aurora: 'Aurora', cyberpunk: 'Cyberpunk',
        volcano: 'Volcano', matrix: 'Matrix', colosseum: 'Colosseum',
        circleGap: 'Circle gap', circleSpeed: 'Circle speed', emojiBounce: 'Emoji bounce',
        youtubeChatConnect: 'YouTube Chat Connect',
        apiKey: 'YouTube API Key',
        videoIdOrUrl: 'Live Stream URL or Video ID',
        connect: 'Connect',
        disconnect: 'Disconnect',
        connected: 'Connected 🟢',
        disconnected: 'Disconnected 🔴',
        connecting: 'Connecting...',
        testMessage: 'Test Live Chat Simulator',
        send: 'Send',
        recentChatBoosts: 'Live Chat Boosts',
        chatHelp: 'Viewers send flag emojis (e.g. 🇹🇷), country names, or KKTC to boost their flag in real time!',
        safeLeader: 'SAFE (CHAT LEADER):',
        safeBadge: 'SAFE',
        safeDesc: 'Country most typed in chat is safe inside circle till last',
        voiceHype: 'Voice Hype',
        voiceHypeDesc: 'Interactive calls to save country',
        retentionMode: 'Viewer Retention',
        retentionDesc: 'Hold Nepal, India, Pak, Brazil longer in circle',
        viewerDemographics: 'Audience Retention & Demographics'
      },
      tr: {
        start: 'Başla', reset: 'Sıfırla', pause: 'Durdur', resume: 'Devam',
        round: 'Tur', flags: 'bayrak', remaining: 'kalan', eliminated: 'elenen',
        last: 'Son', champion: 'ŞAMPİYON', wins: 'GALİBİYET', topWinners: 'EN İYİLER',
        scoreboard: 'Skor Tablosu', topN: 'ilk 5', roundScores: 'Tur skorları',
        topPerformers: 'En iyiler', allTime: 'Tüm zamanlar', rounds: 'tur',
        eliminations: 'eleme', flagsInArena: 'Arenadaki bayraklar',
        modes: 'Modlar', auto: 'Otomatik', autoDesc: 'Sonraki tur kendiliğinden başlar',
        lightning: 'Yıldırım', lightningDesc: 'Yıldırımlar bayrakları düşürür',
        chaos: 'Kaos', chaosDesc: 'Arenada rastgele olaylar',
        chat: 'Sohbet', chatDesc: 'İzleyiciler ülkelerini destekler',
        testKeys: 'Test tuşları', testKeysDesc: 'Tuşlarla destek dene',
        arena: 'Arena', tools: 'Araçlar', champions: 'Şampiyonlar', messages: 'Mesajlar',
        match: 'Maç', normalMode: 'Normal Mod',
        normalDesc: 'Klasik battle royale! Daire açılır, bayraklar boşluktan düşer. Son kalan bayrak kazanır. 3 galibiyet alan şampiyon olur!',
        lightningMode: 'Yıldırım Modu',
        lightningModeDesc: 'Boşluk yok! Yıldırımlar gökyüzünden çarpar, rastgele bayrakları eler. Fırtınada hayatta kal!',
        chaosMode: 'Kaos Modu',
        chaosModeDesc: 'Küçülen arena, hareketli merkez, rastgele olaylar! Girdap çekişleri, rüzgar güçleri, hız patlamaları!',
        live: 'Canlı', orbit: 'Yörünge', stadium: 'Stadyum', synthwave: 'Synthwave',
        dunes: 'Kumul', deepsea: 'Derin Deniz', aurora: 'Aurora', cyberpunk: 'Siberpunk',
        volcano: 'Yanardağ', matrix: 'Matrix', colosseum: 'Kolezyum',
        circleGap: 'Boşluk boyutu', circleSpeed: 'Dönüş hızı', emojiBounce: 'Emoji sekmesi',
        youtubeChatConnect: 'YouTube Sohbet Bağlantısı',
        apiKey: 'YouTube API Anahtarı',
        videoIdOrUrl: 'Canlı Yayın URL veya Video ID',
        connect: 'Bağlan',
        disconnect: 'Bağlantıyı Kes',
        connected: 'Bağlandı 🟢',
        disconnected: 'Bağlantı Yok 🔴',
        connecting: 'Bağlanıyor...',
        testMessage: 'Test Canlı Sohbet Simülatörü',
        send: 'Gönder',
        recentChatBoosts: 'Canlı Sohbet Destekleri',
        chatHelp: 'İzleyiciler bayrak emojisi (örn. 🇹🇷), ülke adı veya KKTC yazarak bayraklarını gerçek zamanlı kurtarır!',
        safeLeader: 'GÜVENDE (CHAT LİDERİ):',
        safeBadge: 'GÜVENDE',
        safeDesc: 'Chatte en çok yazılan ülke sonuna kadar dairede güvende kalır',
        voiceHype: 'Yayıncı Sesi',
        voiceHypeDesc: 'İzleyicilere etkileşimli sesli çağrılar',
        retentionMode: 'İzleyici Tutma',
        retentionDesc: 'Nepal, Hindistan, Pak, Brezilya bayraklarını dairede daha uzun tut',
        viewerDemographics: 'İzleyici Demografisi ve Tutma'
      }
    },

    // ──────────────────────────────────────────────
    // Helper: get translated string by key
    // ──────────────────────────────────────────────
    t: function(key) {
      return (this.STRINGS[this.lang] && this.STRINGS[this.lang][key])
        || this.STRINGS.en[key]
        || key;
    },

    // ──────────────────────────────────────────────
    // Get all flags (copy)
    // ──────────────────────────────────────────────
    getAllFlags: function() {
      return this.FLAGS.slice();
    },

    // ──────────────────────────────────────────────
    // Get flag display name in current language
    // ──────────────────────────────────────────────
    getFlagName: function(code) {
      var flag = this.FLAGS.find(function(f) { return f.code === code; });
      if (!flag) return (code || '').toUpperCase();
      return this.lang === 'tr' ? flag.nameTR : flag.name;
    },

    // Alias for getFlagName
    getCountryName: function(code) {
      return this.getFlagName(code);
    },

    // ──────────────────────────────────────────────
    // Get flag image URL from flagcdn.com
    // ──────────────────────────────────────────────
    getFlagUrl: function(code) {
      return 'https://flagcdn.com/w40/' + code + '.png';
    },

    // ──────────────────────────────────────────────
    // Find flag entry by its emoji
    // ──────────────────────────────────────────────
    findByEmoji: function(emoji) {
      return this.FLAGS.find(function(f) { return f.emoji === emoji; });
    },

    // ──────────────────────────────────────────────
    // Get a random subset of flags (Fisher-Yates)
    // ──────────────────────────────────────────────
    getRandomFlags: function(count) {
      var arr = this.FLAGS.slice();
      // Fisher-Yates shuffle for true randomness
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
      return arr.slice(0, Math.min(count, arr.length));
    },

    // ──────────────────────────────────────────────
    // Shield tier thresholds (support → shields)
    // ──────────────────────────────────────────────
    SHIELD_TIERS: [
      { name: 'Diamond',  nameTR: 'Elmas',     threshold: 10,  shields: 1, color: '#b9f2ff' },
      { name: 'Crown',    nameTR: 'Taç',       threshold: 50,  shields: 2, color: '#ffd700' },
      { name: 'Legend',   nameTR: 'Efsane',     threshold: 100, shields: 3, color: '#ff6b9d' },
      { name: 'Champion', nameTR: 'Şampiyon',   threshold: 500, shields: 5, color: '#c44dff' }
    ],

    // ──────────────────────────────────────────────
    // Calculate shield count from cumulative support
    // ──────────────────────────────────────────────
    getShieldsForSupport: function(supportCount) {
      var shields = 0;
      for (var i = this.SHIELD_TIERS.length - 1; i >= 0; i--) {
        if (supportCount >= this.SHIELD_TIERS[i].threshold) {
          shields = this.SHIELD_TIERS[i].shields;
          break;
        }
      }
      return shields;
    },

    // ──────────────────────────────────────────────
    // Parse chat message for flag emojis, country names, or codes
    // ──────────────────────────────────────────────
    findCountriesInText: function(text) {
      if (!text || typeof text !== 'string') return [];
      var results = [];
      var lowerText = text.toLowerCase().trim();

      // 1. Check for flag emojis (e.g. 🇹🇷, 🇧🇷)
      for (var i = 0; i < this.FLAGS.length; i++) {
        var flag = this.FLAGS[i];
        if (flag.emoji && text.indexOf(flag.emoji) !== -1) {
          var count = text.split(flag.emoji).length - 1;
          for (var c = 0; c < count; c++) {
            results.push(flag.code);
          }
        }
      }

      // 2. Special text commands (from Screenshot 2: "Typing KKTC gives Northern Cyprus +1 support")
      if (/\bkktc\b/i.test(text)) {
        results.push('cy');
      }

      // 3. Country names and 2-letter codes
      var words = lowerText.replace(/[^a-z0-9ğüşıöç\s]/gi, ' ').split(/\s+/).filter(Boolean);
      for (var w = 0; w < words.length; w++) {
        var word = words[w];
        if (word.length < 2) continue;

        if (word === 'usa' || word === 'abd') {
          results.push('us');
          continue;
        }
        if (word === 'uk') {
          results.push('gb');
          continue;
        }
        if (word === 'uae' || word === 'bae') {
          results.push('ae');
          continue;
        }
        if (word === 'bharat' || word === 'hindustan' || word === 'ind') {
          results.push('in');
          continue;
        }
        if (word === 'brasil') {
          results.push('br');
          continue;
        }
        if (word === 'pak' || word === 'pakhtoon') {
          results.push('pk');
          continue;
        }
        if (word === 'nepali' || word === 'nep') {
          results.push('np');
          continue;
        }
        if (word === 'bangla' || word === 'bangladesh' || word === 'bd') {
          results.push('bd');
          continue;
        }
        if (word === 'turkey' || word === 'turkiye') {
          results.push('tr');
          continue;
        }
        if (word === 'indonesia' || word === 'indo') {
          results.push('id');
          continue;
        }

        for (var j = 0; j < this.FLAGS.length; j++) {
          var f = this.FLAGS[j];
          if (word === f.code) {
            results.push(f.code);
            break;
          }
          if (word === f.name.toLowerCase() || (f.nameTR && word === f.nameTR.toLowerCase())) {
            results.push(f.code);
            break;
          }
        }
      }

      return results;
    }
  };

  /* ══════════════════════════════════════════════════════════════════
     VIEWER AUDIENCE & RETENTION SYSTEM
     Ensures viewer favorite countries (Nepal, India, Pakistan, Brazil)
     and chat-supported countries stay longer in the circle to entertain viewers.
     Allows dynamic customization based on incoming viewer demographics.
     ══════════════════════════════════════════════════════════════════ */
  window.FB.ViewerAudience = {
    defaultCountries: ['np', 'in', 'pk', 'br'],
    countries: ['np', 'in', 'pk', 'br'],
    enabled: true,
    activityStats: {}, // { code: { count, lastSeen, users: {} } }
    _listeners: [],

    init: function () {
      try {
        var saved = localStorage.getItem('fb_retention_countries');
        if (saved) {
          var parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.countries = parsed;
          }
        }
        var savedEn = localStorage.getItem('fb_retention_enabled');
        if (savedEn !== null) {
          this.enabled = (savedEn === '1' || savedEn === 'true');
        }
      } catch (e) {}
    },

    save: function () {
      try {
        localStorage.setItem('fb_retention_countries', JSON.stringify(this.countries));
        localStorage.setItem('fb_retention_enabled', this.enabled ? '1' : '0');
      } catch (e) {}
      this._notify();
    },

    getCountries: function () {
      return this.countries.slice();
    },

    isRetentionCountry: function (code) {
      if (!this.enabled || !code) return false;
      return this.countries.indexOf(code.toLowerCase()) !== -1;
    },

    addCountry: function (code) {
      if (!code) return false;
      code = code.toLowerCase().trim();
      // Validate that code exists in FLAGS
      var exists = window.FB.Data && window.FB.Data.FLAGS.some(function (f) { return f.code === code; });
      if (!exists) return false;

      if (this.countries.indexOf(code) === -1) {
        this.countries.push(code);
        this.save();
        return true;
      }
      return false;
    },

    removeCountry: function (code) {
      if (!code) return false;
      code = code.toLowerCase().trim();
      var idx = this.countries.indexOf(code);
      if (idx !== -1) {
        this.countries.splice(idx, 1);
        this.save();
        return true;
      }
      return false;
    },

    resetToDefault: function () {
      this.countries = this.defaultCountries.slice();
      this.save();
    },

    setEnabled: function (val) {
      this.enabled = !!val;
      this.save();
    },

    recordActivity: function (code, author) {
      if (!code) return;
      code = code.toLowerCase().trim();
      if (!this.activityStats[code]) {
        this.activityStats[code] = { code: code, count: 0, lastSeen: Date.now(), users: {} };
      }
      this.activityStats[code].count++;
      this.activityStats[code].lastSeen = Date.now();
      if (author) {
        this.activityStats[code].users[author] = (this.activityStats[code].users[author] || 0) + 1;
      }

      // Dynamic learning: If a country is receiving frequent chat support (>= 3 chats),
      // auto-add to retention list so that new live viewers are automatically entertained!
      if (this.activityStats[code].count >= 3 && this.countries.indexOf(code) === -1) {
        this.addCountry(code);
      }

      this._notify();
    },

    getStatsList: function () {
      var self = this;
      var list = Object.keys(this.activityStats).map(function (c) {
        var stat = self.activityStats[c];
        var name = window.FB.Data ? window.FB.Data.getFlagName(c) : c.toUpperCase();
        var flag = window.FB.Data && window.FB.Data.FLAGS.find(function (f) { return f.code === c; });
        return {
          code: c,
          name: name,
          emoji: flag ? flag.emoji : '🏁',
          count: stat.count,
          lastSeen: stat.lastSeen,
          isRetained: self.countries.indexOf(c) !== -1
        };
      });
      list.sort(function (a, b) { return b.count - a.count; });
      return list;
    },

    onChange: function (fn) {
      this._listeners.push(fn);
    },

    _notify: function () {
      for (var i = 0; i < this._listeners.length; i++) {
        try { this._listeners[i](this.countries, this.enabled); } catch (e) {}
      }
    }
  };

  // Pre-init ViewerAudience
  window.FB.ViewerAudience.init();

})();
