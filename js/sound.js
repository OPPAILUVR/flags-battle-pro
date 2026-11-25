/**
 * Flags Battle Pro — Sound Engine
 * Procedural audio via Web Audio API + SpeechSynthesis TTS.
 * All effects are generated from oscillators, noise, and filters — no external files.
 *
 * Namespace: window.FB.Sound
 */
(function() {
  'use strict';

  window.FB = window.FB || {};

  window.FB.Sound = {

    /** @type {AudioContext|null} */
    ctx: null,

    /** @type {GainNode|null} */
    masterGain: null,

    /** Whether all audio output is muted */
    muted: false,

    /** Master volume 0‑1 */
    volume: 0.5,

    // ──────────────────────────────────────────────
    // Initialise the AudioContext and master gain
    // ──────────────────────────────────────────────
    init: function() {
      if (this.ctx) return; // already initialised
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
      this.initVoiceHype();
    },

    // ──────────────────────────────────────────────
    // Resume context if suspended (autoplay policy)
    // ──────────────────────────────────────────────
    ensureContext: function() {
      if (!this.ctx) this.init();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },

    // ──────────────────────────────────────────────
    // Play a named sound effect
    // ──────────────────────────────────────────────
    play: function(effectName) {
      if (this.muted || !this.ctx) return;
      this.ensureContext();

      switch (effectName) {
        case 'bounce':      this._bounce();     break;
        case 'eliminate':   this._eliminate();  break;
        case 'shield':      this._shield();     break;
        case 'lightning':   this._lightning();  break;
        case 'victory':     this._victory();    break;
        case 'start':       this._start();      break;
        case 'round_end':   this._roundEnd();   break;
        case 'tick':        this._tick();       break;
        case 'chaos':
        case 'chaos_event': this._chaosEvent(); break;
        case 'champion':    this._champion();   break;
        default:
          // Unknown effect — silently ignore
          break;
      }
    },

    // ──────────────────────────────────────────────
    // Mute / unmute
    // ──────────────────────────────────────────────
    setMuted: function(muted) {
      this.muted = !!muted;
    },

    // ──────────────────────────────────────────────
    // Set master volume (0‑1)
    // ──────────────────────────────────────────────
    setVolume: function(vol) {
      this.volume = Math.max(0, Math.min(1, vol));
      if (this.masterGain) {
        this.masterGain.gain.value = this.volume;
      }
    },

    // ──────────────────────────────────────────────
    // TTS via SpeechSynthesis
    // ──────────────────────────────────────────────
    speak: function(text, lang) {
      if (this.muted || !window.speechSynthesis) return;
      var utter = new SpeechSynthesisUtterance(text);
      utter.lang  = (lang === 'tr') ? 'tr-TR' : 'en-US';
      utter.rate   = 1.0;
      utter.pitch  = 1.0;
      utter.volume = this.volume;
      window.speechSynthesis.speak(utter);
    },

    // ══════════════════════════════════════════════
    //  STREAMER VOICE HYPE (24 BOY & GIRL INTERACTIVE PROMPTS)
    // ══════════════════════════════════════════════
    voiceHypeEnabled: true,
    voiceGenderPreference: 'both', // 'both' | 'boy' | 'girl' | 'streamer'
    lastVoiceGender: 'boy',
    voiceHypeAudio: null,
    voiceHypeTimer: null,
    _voiceChangeListeners: [],
    voiceHypeList: [
      // 1-5: User's Real Authentic Voice Clips (from New R9.m4a)
      { id: 1, gender: 'streamer', file: 'audio/prompts/prompt_01.mp3', title: 'अपनी कंट्री को बचाओ! (Real Streamer)', text: 'अपनी कंट्री को बचाओ! ... इमोजी जल्दी जल्दी डालो!' },
      { id: 2, gender: 'streamer', file: 'audio/prompts/prompt_02.mp3', title: 'सुपर चैट अलर्ट! (Real Streamer)', text: 'सुपर चैट से डालो जल्दी ... जो अपनी कंट्री तुम्हारी कंट्री सर्कल के अंदर है!' },
      { id: 3, gender: 'streamer', file: 'audio/prompts/prompt_03.mp3', title: 'इंडिया पाकिस्तान राइवल्स! (Real Streamer)', text: 'इंडिया, पाकिस्तान ... जल्दी करो! ... जल्दी जल्दी!' },
      { id: 4, gender: 'streamer', file: 'audio/prompts/prompt_04.mp3', title: 'कमेंट और शेयर करो! (Real Streamer)', text: 'जो भी कंट्री सर्कल के बीच में आना चाहती है ... कमेंट करो, लाइक करो, शेयर करो इस वीडियो को!' },
      { id: 5, gender: 'streamer', file: 'audio/prompts/prompt_05.mp3', title: 'दबा दब फुल स्पीड! (Real Streamer)', text: 'जल्दी इमोजी टाइप करो ... तेज़ी से तेज़ी से ... दबा दब दबा दब! ... फुल स्पीड से टाइप करो!' },

      // 6-14: Girl Streamer Voice Clips (Expressive female voices with natural silence breaks)
      { id: 6, gender: 'girl', file: 'audio/prompts/prompt_06.mp3', title: 'अरे सुनो सुनो! (Girl Streamer)', text: 'अरे सुनो सुनो! ... अरे देखो यार! ... तुम्हारी कंट्री नीचे फिसल रही है! ... जल्दी से इमोजी भेजो चैट में!' },
      { id: 7, gender: 'girl', file: 'audio/prompts/prompt_07.mp3', title: 'ओह माय गॉड बचाओ! (Girl Streamer)', text: 'ओह माय गॉड! ... ये क्या हो रहा है! ... नेपाल और इंडिया वाले, जल्दी टाइप करो यार! ... बचा लो अपनी कंट्री को!' },
      { id: 8, gender: 'girl', file: 'audio/prompts/prompt_08.mp3', title: 'चैट में इतनी शांति क्यों है? (Girl Streamer)', text: 'अरे भाई साहब! ... चैट में इतनी शांति क्यों है? ... जल्दी जल्दी अपना फ्लैग भेजो! ... बिल्कुल टाइम नहीं है!' },
      { id: 9, gender: 'girl', file: 'audio/prompts/prompt_09.mp3', title: 'चैट में आग लगा दी! (Girl Streamer)', text: 'यस यस यस! ... क्या बात है! ... ब्राज़ील और पाकिस्तान वालों ने चैट में आग लगा दी! ... सुपर चैट से शील्ड ले लो जल्दी!' },
      { id: 10, gender: 'girl', file: 'audio/prompts/prompt_10.mp3', title: 'सर्कल का गैप खुल गया! (Girl Streamer)', text: 'अरे रुको रुको! ... सर्कल का गैप खुल गया है! ... अपनी कंट्री को बाहर जाने से बचाना है ... तो फुल स्पीड से कमेंट करो!' },
      { id: 11, gender: 'girl', file: 'audio/prompts/prompt_11.mp3', title: 'कौन जीतेगा आज? (Girl Streamer)', text: 'ओहो! ... कौन सी कंट्री जीतेगी आज? ... जल्दी से लाइक करो, शेयर करो ... और अपना कंट्री नेम चैट में ड्रॉप करो!' },
      { id: 12, gender: 'girl', file: 'audio/prompts/prompt_12.mp3', title: 'Drop Flags Right Now! (Girl Hype)', text: 'Wait wait wait! ... Your country is right near the gap! ... Spam your flag emojis in the chat right now!' },
      { id: 13, gender: 'girl', file: 'audio/prompts/prompt_13.mp3', title: 'Cheer For Your Flag! (Girl Hype)', text: 'Come on guys! ... Cheer for your country! ... Drop those flag emojis right now in the chat and save them!' },
      { id: 14, gender: 'girl', file: 'audio/prompts/prompt_14.mp3', title: 'लास्ट के कुछ सेकंड! (Girl Streamer)', text: 'अरे बाप रे! ... लास्ट के कुछ ही सेकंड बचे हैं! ... जल्दी करो, जल्दी करो! ... अपनी कंट्री को विनर बनाओ यार!' },

      // 15-24: Boy Streamer Voice Clips (Expressive male voices with natural silence breaks & excitement)
      { id: 15, gender: 'boy', file: 'audio/prompts/prompt_15.mp3', title: 'स्क्रीन देखो भाई! (Boy Streamer)', text: 'अरे भाई भाई भाई! ... ज़रा स्क्रीन देखो! ... तुम्हारी कंट्री बाहर निकलने वाली है! ... जल्दी इमोजी स्पैम करो यार!' },
      { id: 16, gender: 'boy', file: 'audio/prompts/prompt_16.mp3', title: 'महामुकाबला शुरू! (Boy Streamer)', text: 'ओ तेरी! ... इंडिया और पाकिस्तान का महामुकाबला चल रहा है! ... देखते हैं कौन चैट में सबसे आगे निकलता है!' },
      { id: 17, gender: 'boy', file: 'audio/prompts/prompt_17.mp3', title: 'दबा दब टाइप करो! (Boy Streamer)', text: 'अरे क्या कर रहे हो यार? ... दबा दब टाइप करो ना! ... फुल स्पीड से चैट भर दो अपनी कंट्री से!' },
      { id: 18, gender: 'boy', file: 'audio/prompts/prompt_18.mp3', title: 'तूफान ला दिया चैट में! (Boy Streamer)', text: 'ओ भाई साहब! ... ये तो बिल्कुल सेफ हो गई! ... चैट में तूफान ला दिया तुम लोगों ने! ... ओपी बोलते भाई ओपी!' },
      { id: 19, gender: 'boy', file: 'audio/prompts/prompt_19.mp3', title: 'सुपर चैट ठोको! (Boy Streamer)', text: 'अरे सुनो भाई लोग! ... जिसको भी अपनी कंट्री को सर्कल के अंदर रखना है ... फटाफट से कमेंट करो और सुपर चैट ठोको!' },
      { id: 20, gender: 'boy', file: 'audio/prompts/prompt_20.mp3', title: 'गैप घूम रहा है! (Boy Streamer)', text: 'अरे अरे अरे! ... गैप घूम रहा है भाई! ... जल्दी से अपनी कंट्री को धक्का मारो अंदर! ... फुल स्पीड!' },
      { id: 21, gender: 'boy', file: 'audio/prompts/prompt_21.mp3', title: 'Amazing Comeback! (Boy Hype)', text: 'Yes! Amazing comeback! ... Look at that bounce! ... Keep spamming your country flags in the chat right now!' },
      { id: 22, gender: 'boy', file: 'audio/prompts/prompt_22.mp3', title: 'कहाँ सो रहे हो सब? (Boy Streamer)', text: 'अरे कहाँ सो रहे हो सब लोग? ... नेपाल, ब्राज़ील, बांग्लादेश! ... जल्दी से अपना झंडा भेजो चैट में!' },
      { id: 23, gender: 'boy', file: 'audio/prompts/prompt_23.mp3', title: 'लास्ट राउंड क्लैश! (Boy Streamer)', text: 'अरे भाई लास्ट राउंड चल रहा है! ... जो लास्ट तक टिकेगा वही बनेगा आज का चैंपियन! ... लेट्स गो!' },
      { id: 24, gender: 'boy', file: 'audio/prompts/prompt_24.mp3', title: 'फुल पावर लाइक ठोको! (Boy Streamer)', text: 'लाइक ठोको, शेयर करो! ... और फुल पावर से चैट में अपनी कंट्री का नाम लिखो! ... रुकना नहीं है बिल्कुल!' },

      // 25-44: Motu Patlu Universe - Full Character Cast from Furfuri Nagar
      // Motu, Patlu, John the Don, Henchmen Chamche, Inspector Chingum, Dr. Jhatka, Ghasitaram
      { id: 25, gender: 'motu_patlu', character: 'motu', character_name: 'Motu', file: 'audio/prompts/prompt_25.mp3', title: 'अरे बाप रे स्क्रीन देखो! (Motu)', text: 'अरे भैया! अरे बाप रे बाप! ज़रा स्क्रीन देखो तुम लोग! तुम्हारी कंट्री बाहर फिसल रही है यार! जल्दी से चैट में झंडा भेजो, दबा-दब टाइप करो ना!' },
      { id: 26, gender: 'motu_patlu', character: 'motu', character_name: 'Motu', file: 'audio/prompts/prompt_26.mp3', title: 'समोसे की कसम बचाओ! (Motu)', text: 'अरे पतलू! समोसे की कसम, अपनी कंट्री को बाहर मत जाने देना यार! सारे दर्शक जल्दी से चैट में अपना फ्लैग भेजो और कंट्री को सेफ करो!' },
      { id: 27, gender: 'motu_patlu', character: 'motu', character_name: 'Motu', file: 'audio/prompts/prompt_27.mp3', title: 'दिमाग की बत्ती गुल! (Motu)', text: 'खाली पेट मेरे दिमाग की बत्ती नहीं जलती! अरे तुम लोग जल्दी-जल्दी चैट में इमोजी स्पैम करो और अपनी कंट्री को विनर बनाओ यार!' },
      { id: 28, gender: 'motu_patlu', character: 'motu', character_name: 'Motu', file: 'audio/prompts/prompt_28.mp3', title: 'फुल स्पीड से लाइक ठोको! (Motu)', text: 'अरे क्या कर रहे हो भाई?! नेपाल, इंडिया, पाकिस्तान, ब्राज़ील वाले कहां सो रहे हो? जल्दी से लाइक ठोको और चैट में अपनी कंट्री का नाम लिखो!' },
      { id: 29, gender: 'motu_patlu', character: 'patlu', character_name: 'Patlu', file: 'audio/prompts/prompt_29.mp3', title: 'ज़बरदस्त आइडिया! (Patlu)', text: 'आइडिया! मोटू मेरे पास एक ज़बरदस्त आइडिया है! अरे व्यूअर्स, अगर अपनी कंट्री को बचाना है ना... तो अभी के अभी चैट में फ्लैग इमोजी की बारिश कर दो! लेट्स गो!' },
      { id: 30, gender: 'motu_patlu', character: 'patlu', character_name: 'Patlu', file: 'audio/prompts/prompt_30.mp3', title: 'सर्कल का गैप घूम रहा है! (Patlu)', text: 'अरे मोटू संभल के! सर्कल का गैप घूम रहा है! सब दर्शक जल्दी से स्क्रीन पर ध्यान दो और फुल स्पीड से वोट करके अपनी कंट्री को धक्का मारो अंदर!' },
      { id: 31, gender: 'motu_patlu', character: 'patlu', character_name: 'Patlu', file: 'audio/prompts/prompt_31.mp3', title: 'पतलू की मास्टर स्ट्रेटेजी (Patlu)', text: 'पतलू की सलाह मानो भाई लोग! लास्ट राउंड चल रहा है! जल्दी से वीडियो को शेयर करो और चैट में अपनी कंट्री का नाम भर दो!' },
      { id: 32, gender: 'motu_patlu', character: 'john', character_name: 'John the Don', file: 'audio/prompts/prompt_32.mp3', title: 'डॉन का आर्डर! (John the Don)', text: 'अरे ए चमचे! ज़रा स्क्रीन देखो रे! ये पूरा सर्कल और ट्रॉफी डॉन की है! जिसको भी अपनी कंट्री को जिंदा रखना है... सीधा चैट में नाम ठोक डालो! इट्स एन आर्डर!' },
      { id: 33, gender: 'motu_patlu', character: 'john', character_name: 'John the Don', file: 'audio/prompts/prompt_33.mp3', title: 'डॉन का जलवा! (John the Don)', text: 'देखा डॉन का जलवा! इसे बोलते हैं डॉन का पावर! अरे दम है तो अपनी कंट्री को बचा के दिखाओ! जल्दी-जल्दी कमेंट करो बे!' },
      { id: 34, gender: 'motu_patlu', character: 'john', character_name: 'John the Don', file: 'audio/prompts/prompt_34.mp3', title: 'डॉन को गुस्सा आ रहा है! (John the Don)', text: 'अरे क्या रे! सब लोग सो रहे हो क्या?! जब डॉन को गुस्सा आता है तो धरती कांप उठती है! फटाफट चैट में अपनी कंट्री का नाम लिखो वरना सबको बाहर फेंक दूंगा!' },
      { id: 35, gender: 'motu_patlu', character: 'john', character_name: 'John the Don', file: 'audio/prompts/prompt_35.mp3', title: 'चैट में आग लगा दो! (John the Don)', text: 'अरे सुनो भाई लोग! जॉन बनेगा डॉन! अगर अपनी कंट्री को चैंपियन बनाना है, तो चैट में आग लगा दो! फुल स्पीड!' },
      { id: 36, gender: 'motu_patlu', character: 'chamcha', character_name: 'Chamcha', file: 'audio/prompts/prompt_36.mp3', title: 'बॉस बॉस सही पकड़े हैं! (Chamcha)', text: 'अरे बॉस बॉस! सही पकड़े हैं! वो देखो स्क्रीन पे सब लोग दबा-दब कमेंट करके अपनी कंट्री को ऊपर खींच रहे हैं! क्या बात है!' },
      { id: 37, gender: 'motu_patlu', character: 'chamcha', character_name: 'Chamcha', file: 'audio/prompts/prompt_37.mp3', title: 'बॉस देखो चैट में तूफान! (Chamcha)', text: 'बॉस बॉस ज़रा चैट देखो! व्यूअर्स ने तो तूफान ला दिया! हर कोई अपने देश का झंडा भेज रहा है! शाबाश भाई लोग!' },
      { id: 38, gender: 'motu_patlu', character: 'chingum', character_name: 'Inspector Chingum', file: 'audio/prompts/prompt_38.mp3', title: 'चिंगम के चंगुल से बचना इम्पॉसिबल! (Inspector Chingum)', text: 'आयना! डोंट एंग्री मी! ये कौन अपनी कंट्री को बाहर जाने दे रहा है?! चिंगम के चंगुल से कोई नहीं बच सकता! फटाफट चैट में अपना फ्लैग डालो, इट्स माय ऑर्डर!' },
      { id: 39, gender: 'motu_patlu', character: 'chingum', character_name: 'Inspector Chingum', file: 'audio/prompts/prompt_39.mp3', title: 'कानून के हाथ बहुत लंबे हैं! (Inspector Chingum)', text: 'हे हे, आयना! कानून के हाथ बहुत लंबे हैं! जो चैट में अपनी कंट्री का नाम नहीं लिखेगा, चिंगम उसे अरेस्ट कर लेगा! जल्दी वोट करो!' },
      { id: 40, gender: 'motu_patlu', character: 'chingum', character_name: 'Inspector Chingum', file: 'audio/prompts/prompt_40.mp3', title: 'चिंगम का एनकाउंटर अलर्ट! (Inspector Chingum)', text: 'आयना! ये मुकाबला बहुत कड़क चल रहा है! अपनी कंट्री को बाहर जाने से रोको, ये इंस्पेक्टर चिंगम का आर्डर है! जल्दी इमोजी डालो!' },
      { id: 41, gender: 'motu_patlu', character: 'jhatka', character_name: 'Dr. Jhatka', file: 'audio/prompts/prompt_41.mp3', title: 'झटका का नया गैजेट! (Dr. Jhatka)', text: 'ओए पाजी! तुसी कमाल करते हो ji! अपनी कंट्री को धक्का मारो अंदर! जल्दी से लाइक ठोको और चैट में आग लगा दो ji!' },
      { id: 42, gender: 'motu_patlu', character: 'jhatka', character_name: 'Dr. Jhatka', file: 'audio/prompts/prompt_42.mp3', title: 'कसम पाजी की सेफ रहेगी! (Dr. Jhatka)', text: 'ओए शावा! कसम पाजी की, ऐसा मुकाबला आज तक नहीं देखा! सब लोग फुल स्पीड से अपनी कंट्री को वोट करो ji, तुम्हारी कंट्री बिल्कुल सेफ रहेगी!' },
      { id: 43, gender: 'motu_patlu', character: 'ghasitaram', character_name: 'Ghasitaram', file: 'audio/prompts/prompt_43.mp3', title: 'बीस साल का तजुर्बा! (Ghasitaram)', text: 'अरे हमरा बीस साल का तजुर्बा है भाई! जो लास्ट तक टिका रहेगा वही चैंपियन बनेगा! अरे जल्दी-जल्दी वोट करो, बिल्कुल देर मत करो!' },
      { id: 44, gender: 'motu_patlu', character: 'ghasitaram', character_name: 'Ghasitaram', file: 'audio/prompts/prompt_44.mp3', title: 'घसीटाराम की पक्की सलाह! (Ghasitaram)', text: 'अरे हम पहले ही कहे थे! जिसका चैट में सबसे ज्यादा सपोर्ट होगा वही ट्रॉफी उठाएगा! जल्दी से लाइक और कमेंट करो भाई, हमारा तजुर्बा कभी गलत नहीं होता!' }
    ],

    initVoiceHype: function() {
      try {
        var saved = localStorage.getItem('fb_voice_hype');
        if (saved !== null) {
          this.voiceHypeEnabled = (saved === '1' || saved === 'true');
        }
        var savedGender = localStorage.getItem('fb_voice_gender');
        var validGenders = ['both', 'boy', 'girl', 'motu_patlu', 'motu', 'patlu', 'john', 'chingum', 'jhatka', 'ghasitaram', 'streamer', 'all'];
        if (savedGender && validGenders.indexOf(savedGender) !== -1) {
          this.voiceGenderPreference = savedGender;
        }
      } catch (e) {}
    },

    setVoiceGenderPreference: function(pref) {
      var validGenders = ['both', 'boy', 'girl', 'motu_patlu', 'motu', 'patlu', 'john', 'chingum', 'jhatka', 'ghasitaram', 'streamer', 'all'];
      if (validGenders.indexOf(pref) !== -1) {
        this.voiceGenderPreference = pref;
        try {
          localStorage.setItem('fb_voice_gender', pref);
        } catch (e) {}
      }
    },

    setVoiceHypeEnabled: function(enabled) {
      this.voiceHypeEnabled = !!enabled;
      try {
        localStorage.setItem('fb_voice_hype', this.voiceHypeEnabled ? '1' : '0');
      } catch (e) {}
      if (!this.voiceHypeEnabled) {
        this.stopVoiceHype();
        if (this.voiceHypeTimer) {
          clearTimeout(this.voiceHypeTimer);
          this.voiceHypeTimer = null;
        }
      }
      for (var i = 0; i < this._voiceChangeListeners.length; i++) {
        try { this._voiceChangeListeners[i](this.voiceHypeEnabled); } catch (e) {}
      }
    },

    onVoiceHypeChange: function(fn) {
      this._voiceChangeListeners.push(fn);
    },

    stopVoiceHype: function() {
      if (this.voiceHypeAudio) {
        try {
          this.voiceHypeAudio.pause();
          this.voiceHypeAudio.currentTime = 0;
        } catch (e) {}
        this.voiceHypeAudio = null;
      }
    },

    playVoiceHype: function(idx) {
      if (!this.voiceHypeEnabled || this.muted) return null;
      this.stopVoiceHype();

      var list = this.voiceHypeList;
      if (!list || list.length === 0) return null;

      var choice;
      if (typeof idx === 'number' && idx >= 0 && idx < list.length) {
        choice = list[idx];
      } else {
        // Filter based on gender / character preference
        var pref = this.voiceGenderPreference || 'both';
        var candidates = [];

        if (pref === 'boy') {
          candidates = list.filter(function(p) { return p.gender === 'boy' || p.gender === 'streamer'; });
        } else if (pref === 'girl') {
          candidates = list.filter(function(p) { return p.gender === 'girl'; });
        } else if (pref === 'motu_patlu') {
          candidates = list.filter(function(p) { return p.gender === 'motu_patlu'; });
        } else if (pref === 'motu') {
          candidates = list.filter(function(p) { return p.character === 'motu'; });
        } else if (pref === 'patlu') {
          candidates = list.filter(function(p) { return p.character === 'patlu'; });
        } else if (pref === 'john') {
          candidates = list.filter(function(p) { return p.character === 'john' || p.character === 'chamcha'; });
        } else if (pref === 'chingum') {
          candidates = list.filter(function(p) { return p.character === 'chingum'; });
        } else if (pref === 'jhatka') {
          candidates = list.filter(function(p) { return p.character === 'jhatka'; });
        } else if (pref === 'ghasitaram') {
          candidates = list.filter(function(p) { return p.character === 'ghasitaram'; });
        } else if (pref === 'streamer') {
          candidates = list.filter(function(p) { return p.gender === 'streamer'; });
        } else if (pref === 'all') {
          candidates = list;
        } else {
          // 'both' — switch voices between boy and girl randomly / alternately
          var targetGender = (this.lastVoiceGender === 'boy') ? 'girl' : 'boy';
          candidates = list.filter(function(p) {
            if (targetGender === 'boy') {
              return p.gender === 'boy' || p.gender === 'streamer';
            }
            return p.gender === 'girl';
          });
        }

        if (candidates.length === 0) candidates = list;
        choice = candidates[Math.floor(Math.random() * candidates.length)];
      }

      // Track last gender played to alternate boy and girl voices
      this.lastVoiceGender = (choice.gender === 'girl') ? 'girl' : 'boy';

      var self = this;
      var audio = new Audio(choice.file);
      audio.volume = Math.max(0, Math.min(1, this.volume * 1.15));
      self.voiceHypeAudio = audio;

      audio.onended = function() {
        self.voiceHypeAudio = null;
      };
      audio.onerror = function() {
        if (choice.file.endsWith('.mp3')) {
          var altAudio = new Audio(choice.file.replace('.mp3', '.m4a'));
          altAudio.volume = audio.volume;
          self.voiceHypeAudio = altAudio;
          altAudio.play().catch(function() {});
          altAudio.onended = function() { self.voiceHypeAudio = null; };
        } else {
          self.voiceHypeAudio = null;
        }
      };

      audio.play().catch(function() {});
      return choice;
    },

    scheduleVoiceHype: function(minSec, maxSec) {
      if (!this.voiceHypeEnabled) return;
      if (this.voiceHypeTimer) {
        clearTimeout(this.voiceHypeTimer);
      }
      minSec = minSec || 24;
      maxSec = maxSec || 38;
      var delayMs = (minSec + Math.random() * (maxSec - minSec)) * 1000;
      var self = this;
      this.voiceHypeTimer = setTimeout(function() {
        if (window.FB.Game && window.FB.Game.state.phase === 'playing' && self.voiceHypeEnabled && !self.muted) {
          self.playVoiceHype();
          self.scheduleVoiceHype(minSec, maxSec);
        }
      }, delayMs);
    },

    // ══════════════════════════════════════════════
    //  INTERNAL SOUND GENERATORS
    // ══════════════════════════════════════════════

    // ── 1. BOUNCE ────────────────────────────────
    // Short percussive click / thump
    _bounce: function() {
      var ctx = this.ctx;
      var t   = ctx.currentTime;

      // Low sine burst (150 Hz, 50 ms exponential decay)
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.05);
      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.06);

      // Tiny click on top (short noise burst, 5 ms)
      var noiseLen = 0.005;
      var noiseBuf = this._createNoiseBuffer(noiseLen);
      var noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;
      var ng = ctx.createGain();
      ng.gain.setValueAtTime(0.3, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + noiseLen);
      noiseSrc.connect(ng);
      ng.connect(this.masterGain);
      noiseSrc.start(t);
      noiseSrc.stop(t + noiseLen + 0.001);
    },

    // ── 2. ELIMINATE ─────────────────────────────
    // Descending tone + noise burst
    _eliminate: function() {
      var ctx = this.ctx;
      var t   = ctx.currentTime;

      // Descending sine sweep 600 Hz → 200 Hz over 200 ms
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.2);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.linearRampToValueAtTime(0.0, t + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.26);

      // White noise burst (100 ms)
      var noiseBuf = this._createNoiseBuffer(0.1);
      var noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;
      var ng = ctx.createGain();
      ng.gain.setValueAtTime(0.35, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      // Band-limit the noise
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2000;
      bp.Q.value = 0.8;
      noiseSrc.connect(bp);
      bp.connect(ng);
      ng.connect(this.masterGain);
      noiseSrc.start(t);
      noiseSrc.stop(t + 0.11);
    },

    // ── 3. SHIELD ────────────────────────────────
    // Bright ascending chime + shimmer
    _shield: function() {
      var ctx = this.ctx;
      var t   = ctx.currentTime;

      // Two sine tones: 800 Hz and 1200 Hz with quick attack
      var freqs = [800, 1200];
      for (var i = 0; i < freqs.length; i++) {
        var osc  = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freqs[i];
        gain.gain.setValueAtTime(0.0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.01);  // quick attack
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.36);
      }

      // Sparkle / shimmer: short high-frequency noise burst
      var shimmerBuf = this._createNoiseBuffer(0.15);
      var shimmerSrc = ctx.createBufferSource();
      shimmerSrc.buffer = shimmerBuf;
      var hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 6000;
      var sg = ctx.createGain();
      sg.gain.setValueAtTime(0.15, t + 0.02);
      sg.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      shimmerSrc.connect(hp);
      hp.connect(sg);
      sg.connect(this.masterGain);
      shimmerSrc.start(t + 0.02);
      shimmerSrc.stop(t + 0.2);
    },

    // ── 4. LIGHTNING ─────────────────────────────
    // Electric crack + rumble
    _lightning: function() {
      var ctx = this.ctx;
      var t   = ctx.currentTime;

      // White noise crack with bandpass sweep
      var crackBuf = this._createNoiseBuffer(0.15);
      var crackSrc = ctx.createBufferSource();
      crackSrc.buffer = crackBuf;
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(8000, t);
      bp.frequency.exponentialRampToValueAtTime(800, t + 0.15);
      bp.Q.value = 2.0;
      var cg = ctx.createGain();
      cg.gain.setValueAtTime(0.7, t);
      cg.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      crackSrc.connect(bp);
      bp.connect(cg);
      cg.connect(this.masterGain);
      crackSrc.start(t);
      crackSrc.stop(t + 0.16);

      // Secondary sizzle burst
      var sizzleBuf = this._createNoiseBuffer(0.08);
      var sizzleSrc = ctx.createBufferSource();
      sizzleSrc.buffer = sizzleBuf;
      var hp2 = ctx.createBiquadFilter();
      hp2.type = 'highpass';
      hp2.frequency.value = 4000;
      var sg2 = ctx.createGain();
      sg2.gain.setValueAtTime(0.4, t + 0.03);
      sg2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      sizzleSrc.connect(hp2);
      hp2.connect(sg2);
      sg2.connect(this.masterGain);
      sizzleSrc.start(t + 0.03);
      sizzleSrc.stop(t + 0.11);

      // Low rumble (60 Hz sine, 300 ms)
      var rumble  = ctx.createOscillator();
      var rGain   = ctx.createGain();
      rumble.type = 'sine';
      rumble.frequency.value = 60;
      rGain.gain.setValueAtTime(0.5, t + 0.05);
      rGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      rumble.connect(rGain);
      rGain.connect(this.masterGain);
      rumble.start(t + 0.05);
      rumble.stop(t + 0.36);
    },

    // ── 5. VICTORY ───────────────────────────────
    // Triumphant fanfare: ascending arpeggio C5-E5-G5-C6
    _victory: function() {
      var ctx   = this.ctx;
      var t     = ctx.currentTime;
      // C5=523.25, E5=659.25, G5=783.99, C6=1046.50
      var notes = [523.25, 659.25, 783.99, 1046.50];
      var dur   = 0.15; // each note duration

      for (var i = 0; i < notes.length; i++) {
        this._playTone(notes[i], dur, 'sine', t + i * dur, 0.45);
      }

      // Sustain the last note a bit longer
      var lastStart = t + notes.length * dur;
      this._playTone(notes[notes.length - 1], 0.4, 'sine', lastStart - dur, 0.3);
    },

    // ── 6. START ─────────────────────────────────
    // Game start horn / buzzer
    _start: function() {
      var ctx = this.ctx;
      var t   = ctx.currentTime;

      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.linearRampToValueAtTime(0.0, t + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.31);

      // Add a sub-octave layer for thickness
      var sub  = ctx.createOscillator();
      var sg   = ctx.createGain();
      sub.type = 'square';
      sub.frequency.value = 220;
      sg.gain.setValueAtTime(0.2, t);
      sg.gain.linearRampToValueAtTime(0.0, t + 0.3);
      sub.connect(sg);
      sg.connect(this.masterGain);
      sub.start(t);
      sub.stop(t + 0.31);
    },

    // ── 7. ROUND END ─────────────────────────────
    // Two-note ascending chime: C5, G5
    _roundEnd: function() {
      var ctx = this.ctx;
      var t   = ctx.currentTime;

      // C5 = 523.25 Hz, G5 = 783.99 Hz
      this._playTone(523.25, 0.2, 'sine', t, 0.4);
      this._playTone(783.99, 0.3, 'sine', t + 0.2, 0.4);
    },

    // ── 8. TICK ──────────────────────────────────
    // Subtle countdown tick
    _tick: function() {
      var ctx = this.ctx;
      var t   = ctx.currentTime;

      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1000;
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.025);
    },

    // ── 9. CHAOS EVENT ───────────────────────────
    // Warbly frequency-modulated alert
    _chaosEvent: function() {
      var ctx = this.ctx;
      var t   = ctx.currentTime;

      // Carrier oscillator (300 Hz sine)
      var carrier = ctx.createOscillator();
      carrier.type = 'sine';
      carrier.frequency.value = 300;

      // Modulator oscillator (8 Hz) → modulation depth controls FM
      var modulator = ctx.createOscillator();
      modulator.type = 'sine';
      modulator.frequency.value = 8;

      var modGain = ctx.createGain();
      modGain.gain.value = 150; // modulation depth in Hz

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);

      var envGain = ctx.createGain();
      envGain.gain.setValueAtTime(0.0, t);
      envGain.gain.linearRampToValueAtTime(0.5, t + 0.02);
      envGain.gain.setValueAtTime(0.5, t + 0.15);
      envGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      carrier.connect(envGain);
      envGain.connect(this.masterGain);

      carrier.start(t);
      modulator.start(t);
      carrier.stop(t + 0.31);
      modulator.stop(t + 0.31);

      // Add a secondary warble at higher pitch
      var carrier2 = ctx.createOscillator();
      carrier2.type = 'sine';
      carrier2.frequency.value = 500;
      var mod2 = ctx.createOscillator();
      mod2.type = 'sine';
      mod2.frequency.value = 12;
      var mg2 = ctx.createGain();
      mg2.gain.value = 100;
      mod2.connect(mg2);
      mg2.connect(carrier2.frequency);
      var eg2 = ctx.createGain();
      eg2.gain.setValueAtTime(0.0, t + 0.05);
      eg2.gain.linearRampToValueAtTime(0.3, t + 0.07);
      eg2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      carrier2.connect(eg2);
      eg2.connect(this.masterGain);
      carrier2.start(t + 0.05);
      mod2.start(t + 0.05);
      carrier2.stop(t + 0.26);
      mod2.stop(t + 0.26);
    },

    // ── 10. CHAMPION ─────────────────────────────
    // Extended celebration: fanfare + shimmer + ascending chromatic
    _champion: function() {
      var ctx = this.ctx;
      var t   = ctx.currentTime;

      // Part 1: Victory fanfare arpeggio (C5-E5-G5-C6)
      var fanfare = [523.25, 659.25, 783.99, 1046.50];
      var noteDur = 0.12;
      for (var i = 0; i < fanfare.length; i++) {
        this._playTone(fanfare[i], noteDur, 'sine', t + i * noteDur, 0.45);
      }

      // Part 2: Ascending chromatic scale (C5 up 12 semitones)
      var chromStart = t + fanfare.length * noteDur + 0.05;
      var baseFreq   = 523.25; // C5
      var chromDur    = 0.06;
      for (var j = 0; j < 13; j++) {
        var freq = baseFreq * Math.pow(2, j / 12);
        this._playTone(freq, chromDur + 0.04, 'sine', chromStart + j * chromDur, 0.25 + j * 0.015);
      }

      // Part 3: Shimmering noise bed
      var shimmerStart = t + 0.1;
      var shimmerLen   = 1.2;
      var shimBuf      = this._createNoiseBuffer(shimmerLen);
      var shimSrc      = ctx.createBufferSource();
      shimSrc.buffer   = shimBuf;
      var hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 5000;
      var shimGain = ctx.createGain();
      shimGain.gain.setValueAtTime(0.0, shimmerStart);
      shimGain.gain.linearRampToValueAtTime(0.12, shimmerStart + 0.2);
      shimGain.gain.setValueAtTime(0.12, shimmerStart + shimmerLen - 0.3);
      shimGain.gain.exponentialRampToValueAtTime(0.001, shimmerStart + shimmerLen);
      shimSrc.connect(hp);
      hp.connect(shimGain);
      shimGain.connect(this.masterGain);
      shimSrc.start(shimmerStart);
      shimSrc.stop(shimmerStart + shimmerLen + 0.01);

      // Part 4: Final sustained chord (C5 + E5 + G5 + C6)
      var chordStart = chromStart + 13 * chromDur + 0.05;
      for (var k = 0; k < fanfare.length; k++) {
        this._playTone(fanfare[k], 0.6, 'sine', chordStart, 0.3);
      }
    },

    // ══════════════════════════════════════════════
    //  UTILITY METHODS
    // ══════════════════════════════════════════════

    /**
     * Create a white noise AudioBuffer of the given duration in seconds.
     * @param {number} duration — length in seconds
     * @returns {AudioBuffer}
     */
    _createNoiseBuffer: function(duration) {
      var ctx        = this.ctx;
      var sampleRate = ctx.sampleRate;
      var length     = Math.ceil(sampleRate * duration);
      var buffer     = ctx.createBuffer(1, length, sampleRate);
      var data       = buffer.getChannelData(0);
      for (var i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      return buffer;
    },

    /**
     * Play a simple tone with an amplitude envelope.
     * @param {number} freq       — frequency in Hz
     * @param {number} duration   — length in seconds
     * @param {string} type       — oscillator type ('sine', 'square', 'sawtooth', 'triangle')
     * @param {number} startTime  — AudioContext time to begin
     * @param {number} gainValue  — peak gain (0‑1)
     */
    _playTone: function(freq, duration, type, startTime, gainValue) {
      var ctx  = this.ctx;
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();

      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Quick attack, sustain, then exponential release in last 30 %
      var attackEnd  = startTime + 0.005;
      var releaseAt  = startTime + duration * 0.7;
      var endTime    = startTime + duration;

      gain.gain.setValueAtTime(0.0, startTime);
      gain.gain.linearRampToValueAtTime(gainValue, attackEnd);
      gain.gain.setValueAtTime(gainValue, releaseAt);
      gain.gain.exponentialRampToValueAtTime(0.001, endTime);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(endTime + 0.01);
    }
  };

})();
