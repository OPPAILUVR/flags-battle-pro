import os, sys, subprocess, asyncio, json
import edge_tts

OUT_DIR = '/Users/luv/Desktop/flags/audio/prompts'
os.makedirs(OUT_DIR, exist_ok=True)

# Warm, punchy broadcast audio mastering chain (NO robotic vocoder pitch shift)
AUDIO_FILTER = (
    "highpass=f=75,"
    "equalizer=f=140:width_type=o:width=1.4:g=1.8,"
    "equalizer=f=3400:width_type=o:width=1.8:g=2.2,"
    "acompressor=threshold=-16dB:ratio=2.5:attack=5:release=55:makeup=2,"
    "volume=1.2,"
    "loudnorm=I=-16:TP=-1.5:LRA=11"
)

motu_patlu_prompts = [
    # 25-28: Motu (The hearty, samosa-loving, dramatic comic hero)
    {
        'id': 25,
        'gender': 'motu_patlu',
        'character': 'motu',
        'character_name': 'Motu',
        'title': 'अरे बाप रे स्क्रीन देखो! (Motu)',
        'voice': 'hi-IN-MadhurNeural',
        'pitch': '+0Hz',
        'rate': '+6%',
        'text': 'अरे भैया! अरे बाप रे बाप! ज़रा स्क्रीन देखो तुम लोग! तुम्हारी कंट्री बाहर फिसल रही है यार! जल्दी से चैट में झंडा भेजो, दबा-दब टाइप करो ना!'
    },
    {
        'id': 26,
        'gender': 'motu_patlu',
        'character': 'motu',
        'character_name': 'Motu',
        'title': 'समोसे की कसम बचाओ! (Motu)',
        'voice': 'hi-IN-MadhurNeural',
        'pitch': '+0Hz',
        'rate': '+5%',
        'text': 'अरे पतलू! समोसे की कसम, अपनी कंट्री को बाहर मत जाने देना यार! सारे दर्शक जल्दी से चैट में अपना फ्लैग भेजो और कंट्री को सेफ करो!'
    },
    {
        'id': 27,
        'gender': 'motu_patlu',
        'character': 'motu',
        'character_name': 'Motu',
        'title': 'दिमाग की बत्ती गुल! (Motu)',
        'voice': 'hi-IN-MadhurNeural',
        'pitch': '+0Hz',
        'rate': '+5%',
        'text': 'खाली पेट मेरे दिमाग की बत्ती नहीं जलती! अरे तुम लोग जल्दी-जल्दी चैट में इमोजी स्पैम करो और अपनी कंट्री को विनर बनाओ यार!'
    },
    {
        'id': 28,
        'gender': 'motu_patlu',
        'character': 'motu',
        'character_name': 'Motu',
        'title': 'फुल स्पीड से लाइक ठोको! (Motu)',
        'voice': 'hi-IN-MadhurNeural',
        'pitch': '+0Hz',
        'rate': '+7%',
        'text': 'अरे क्या कर रहे हो भाई?! नेपाल, इंडिया, पाकिस्तान, ब्राज़ील वाले कहां सो रहे हो? जल्दी से लाइक ठोको और चैट में अपनी कंट्री का नाम लिखो!'
    },

    # 29-31: Patlu (The sharp, intellectual master strategist with an Idea!)
    {
        'id': 29,
        'gender': 'motu_patlu',
        'character': 'patlu',
        'character_name': 'Patlu',
        'title': 'ज़बरदस्त आइडिया! (Patlu)',
        'voice': 'hi-IN-MadhurNeural',
        'pitch': '+0Hz',
        'rate': '+9%',
        'text': 'आइडिया! मोटू मेरे पास एक ज़बरदस्त आइडिया है! अरे व्यूअर्स, अगर अपनी कंट्री को बचाना है ना... तो अभी के अभी चैट में फ्लैग इमोजी की बारिश कर दो! लेट्स गो!'
    },
    {
        'id': 30,
        'gender': 'motu_patlu',
        'character': 'patlu',
        'character_name': 'Patlu',
        'title': 'सर्कल का गैप घूम रहा है! (Patlu)',
        'voice': 'hi-IN-MadhurNeural',
        'pitch': '+0Hz',
        'rate': '+8%',
        'text': 'अरे मोटू संभल के! सर्कल का गैप घूम रहा है! सब दर्शक जल्दी से स्क्रीन पर ध्यान दो और फुल स्पीड से वोट करके अपनी कंट्री को धक्का मारो अंदर!'
    },
    {
        'id': 31,
        'gender': 'motu_patlu',
        'character': 'patlu',
        'character_name': 'Patlu',
        'title': 'पतलू की मास्टर स्ट्रेटेजी (Patlu)',
        'voice': 'hi-IN-MadhurNeural',
        'pitch': '+0Hz',
        'rate': '+8%',
        'text': 'पतलू की सलाह मानो भाई लोग! लास्ट राउंड चल रहा है! जल्दी से वीडियो को शेयर करो और चैट में अपनी कंट्री का नाम भर दो!'
    },

    # 32-35: John the Don (The comical tapori rhyming gangster villain)
    {
        'id': 32,
        'gender': 'motu_patlu',
        'character': 'john',
        'character_name': 'John the Don',
        'title': 'डॉन का आर्डर! (John the Don)',
        'voice': 'hi-IN-MadhurNeural',
        'pitch': '+0Hz',
        'rate': '+1%',
        'text': 'अरे ए चमचे! ज़रा स्क्रीन देखो रे! ये पूरा सर्कल और ट्रॉफी डॉन की है! जिसको भी अपनी कंट्री को जिंदा रखना है... सीधा चैट में नाम ठोक डालो! इट्स एन आर्डर!'
    },
    {
        'id': 33,
        'gender': 'motu_patlu',
        'character': 'john',
        'character_name': 'John the Don',
        'title': 'डॉन का जलवा! (John the Don)',
        'voice': 'hi-IN-MadhurNeural',
        'pitch': '+0Hz',
        'rate': '+2%',
        'text': 'देखा डॉन का जलवा! इसे बोलते हैं डॉन का पावर! अरे दम है तो अपनी कंट्री को बचा के दिखाओ! जल्दी-जल्दी कमेंट करो बे!'
    },
    {
        'id': 34,
        'gender': 'motu_patlu',
        'character': 'john',
        'character_name': 'John the Don',
        'title': 'डॉन को गुस्सा आ रहा है! (John the Don)',
        'voice': 'hi-IN-MadhurNeural',
        'pitch': '+0Hz',
        'rate': '+1%',
        'text': 'अरे क्या रे! सब लोग सो रहे हो क्या?! जब डॉन को गुस्सा आता है तो धरती कांप उठती है! फटाफट चैट में अपनी कंट्री का नाम लिखो वरना सबको बाहर फेंक दूंगा!'
    },
    {
        'id': 35,
        'gender': 'motu_patlu',
        'character': 'john',
        'character_name': 'John the Don',
        'title': 'चैट में आग लगा दो! (John the Don)',
        'voice': 'hi-IN-MadhurNeural',
        'pitch': '+0Hz',
        'rate': '+2%',
        'text': 'अरे सुनो भाई लोग! जॉन बनेगा डॉन! अगर अपनी कंट्री को चैंपियन बनाना है, तो चैट में आग लगा दो! फुल स्पीड!'
    },

    # 36-37: Number 1 & Number 2 (John's Henchmen Chamche)
    {
        'id': 36,
        'gender': 'motu_patlu',
        'character': 'chamcha',
        'character_name': 'Chamcha',
        'title': 'बॉस बॉस सही पकड़े हैं! (Chamcha)',
        'voice': 'hi-IN-MadhurNeural',
        'pitch': '+0Hz',
        'rate': '+11%',
        'text': 'अरे बॉस बॉस! सही पकड़े हैं! वो देखो स्क्रीन पे सब लोग दबा-दब कमेंट करके अपनी कंट्री को ऊपर खींच रहे हैं! क्या बात है!'
    },
    {
        'id': 37,
        'gender': 'motu_patlu',
        'character': 'chamcha',
        'character_name': 'Chamcha',
        'title': 'बॉस देखो चैट में तूफान! (Chamcha)',
        'voice': 'hi-IN-MadhurNeural',
        'pitch': '+0Hz',
        'rate': '+10%',
        'text': 'बॉस बॉस ज़रा चैट देखो! व्यूअर्स ने तो तूफान ला दिया! हर कोई अपने देश का झंडा भेज रहा है! शाबाश भाई लोग!'
    },

    # 38-40: Inspector Chingum (South Indian action supercop)
    {
        'id': 38,
        'gender': 'motu_patlu',
        'character': 'chingum',
        'character_name': 'Inspector Chingum',
        'title': 'चिंगम के चंगुल से बचना इम्पॉसिबल! (Inspector Chingum)',
        'voice': 'hi-IN-MadhurNeural',
        'pitch': '+0Hz',
        'rate': '+7%',
        'text': 'आयना! डोंट एंग्री मी! ये कौन अपनी कंट्री को बाहर जाने दे रहा है?! चिंगम के चंगुल से कोई नहीं बच सकता! फटाफट चैट में अपना फ्लैग डालो, इट्स माय ऑर्डर!'
    },
    {
        'id': 39,
        'gender': 'motu_patlu',
        'character': 'chingum',
        'character_name': 'Inspector Chingum',
        'title': 'कानून के हाथ बहुत लंबे हैं! (Inspector Chingum)',
        'voice': 'hi-IN-MadhurNeural',
        'pitch': '+0Hz',
        'rate': '+6%',
        'text': 'हे हे, आयना! कानून के हाथ बहुत लंबे हैं! जो चैट में अपनी कंट्री का नाम नहीं लिखेगा, चिंगम उसे अरेस्ट कर लेगा! जल्दी वोट करो!'
    },
    {
        'id': 40,
        'gender': 'motu_patlu',
        'character': 'chingum',
        'character_name': 'Inspector Chingum',
        'title': 'चिंगम का एनकाउंटर अलर्ट! (Inspector Chingum)',
        'voice': 'hi-IN-MadhurNeural',
        'pitch': '+0Hz',
        'rate': '+7%',
        'text': 'आयना! ये मुकाबला बहुत कड़क चल रहा है! अपनी कंट्री को बाहर जाने से रोको, ये इंस्पेक्टर चिंगम का आर्डर है! जल्दी इमोजी डालो!'
    },

    # 41-42: Dr. Jhatka (The Punjabi eccentric inventor scientist)
    {
        'id': 41,
        'gender': 'motu_patlu',
        'character': 'jhatka',
        'character_name': 'Dr. Jhatka',
        'title': 'झटका का नया गैजेट! (Dr. Jhatka)',
        'voice': 'hi-IN-MadhurNeural',
        'pitch': '+0Hz',
        'rate': '+7%',
        'text': 'ओए पाजी! तुसी कमाल करते हो ji! अपनी कंट्री को धक्का मारो अंदर! जल्दी से लाइक ठोको और चैट में आग लगा दो ji!'
    },
    {
        'id': 42,
        'gender': 'motu_patlu',
        'character': 'jhatka',
        'character_name': 'Dr. Jhatka',
        'title': 'कसम पाजी की सेफ रहेगी! (Dr. Jhatka)',
        'voice': 'hi-IN-MadhurNeural',
        'pitch': '+0Hz',
        'rate': '+6%',
        'text': 'ओए शावा! कसम पाजी की, ऐसा मुकाबला आज तक नहीं देखा! सब लोग फुल स्पीड से अपनी कंट्री को वोट करो ji, तुम्हारी कंट्री बिल्कुल सेफ रहेगी!'
    },

    # 43-44: Ghasitaram (Bihari/Bengali seasoned photographer with 20 years experience)
    {
        'id': 43,
        'gender': 'motu_patlu',
        'character': 'ghasitaram',
        'character_name': 'Ghasitaram',
        'title': 'बीस साल का तजुर्बा! (Ghasitaram)',
        'voice': 'hi-IN-MadhurNeural',
        'pitch': '+0Hz',
        'rate': '+4%',
        'text': 'अरे हमरा बीस साल का तजुर्बा है भाई! जो लास्ट तक टिका रहेगा वही चैंपियन बनेगा! अरे जल्दी-जल्दी वोट करो, बिल्कुल देर मत करो!'
    },
    {
        'id': 44,
        'gender': 'motu_patlu',
        'character': 'ghasitaram',
        'character_name': 'Ghasitaram',
        'title': 'घसीटाराम की पक्की सलाह! (Ghasitaram)',
        'voice': 'hi-IN-MadhurNeural',
        'pitch': '+0Hz',
        'rate': '+5%',
        'text': 'अरे हम पहले ही कहे थे! जिसका चैट में सबसे ज्यादा सपोर्ट होगा वही ट्रॉफी उठाएगा! जल्दी से लाइक और कमेंट करो भाई, हमारा तजुर्बा कभी गलत नहीं होता!'
    }
]

async def generate():
    print(f"Generating {len(motu_patlu_prompts)} Motu Patlu Cast Prompts with natural dialect, tone, and zero-pitch distortion...")
    for p in motu_patlu_prompts:
        num_str = f"{p['id']:02d}"
        raw_mp3 = f"{OUT_DIR}/raw_{num_str}.mp3"
        mp3_path = f"{OUT_DIR}/prompt_{num_str}.mp3"
        m4a_path = f"{OUT_DIR}/prompt_{num_str}.m4a"

        comm = edge_tts.Communicate(
            p['text'],
            p['voice'],
            rate=p['rate'],
            pitch=p['pitch'],
            volume='+15%'
        )
        await comm.save(raw_mp3)

        subprocess.run([
            '/opt/homebrew/bin/ffmpeg', '-y',
            '-i', raw_mp3,
            '-af', AUDIO_FILTER,
            '-c:a', 'libmp3lame', '-b:a', '128k', '-ar', '48000', mp3_path
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

        subprocess.run([
            '/opt/homebrew/bin/ffmpeg', '-y',
            '-i', raw_mp3,
            '-af', AUDIO_FILTER,
            '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', m4a_path
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

        if os.path.exists(raw_mp3):
            os.remove(raw_mp3)

        print(f"Generated Prompt {num_str} [{p['character_name']}]: {p['title']}")

if __name__ == '__main__':
    asyncio.run(generate())
    print("ALL 20 MOTU PATLU DIALECT AUDIO FILES RE-GENERATED SUCCESSFULLY!")
