import os, sys, subprocess, asyncio, json
import edge_tts

OUT_DIR = '/Users/luv/Desktop/flags/audio/prompts'
USER_FILE = '/Users/luv/Desktop/flags/New R9.m4a'
os.makedirs(OUT_DIR, exist_ok=True)

# 1. User Authentic Streamer Voice Clips (Real human male voice from New R9.m4a)
user_clips = [
    {
        'id': 1,
        'gender': 'streamer',
        'title': 'अपनी कंट्री को बचाओ! (Real Streamer)',
        'type': 'human_real',
        'start': 0.0,
        'end': 4.2,
        'text': 'अपनी कंट्री को बचाओ! ... इमोजी जल्दी जल्दी डालो!',
        'transcription': 'Apni country ko bachao! ... Emoji jaldi jaldi dalo!'
    },
    {
        'id': 2,
        'gender': 'streamer',
        'title': 'सुपर चैट अलर्ट! (Real Streamer)',
        'type': 'human_real',
        'start': 4.2,
        'end': 8.8,
        'text': 'सुपर चैट से डालो जल्दी ... जो अपनी कंट्री तुम्हारी कंट्री सर्कल के अंदर है!',
        'transcription': 'Super chat se dalo jaldi ... jo apni country tumhari country circle ke andar hai!'
    },
    {
        'id': 3,
        'gender': 'streamer',
        'title': 'इंडिया पाकिस्तान राइवल्स! (Real Streamer)',
        'type': 'human_real',
        'start': 8.8,
        'end': 14.0,
        'text': 'इंडिया, पाकिस्तान ... जल्दी करो! ... जल्दी जल्दी!',
        'transcription': 'India, Pakistan ... jaldi karo! ... Jaldi jaldi!'
    },
    {
        'id': 4,
        'gender': 'streamer',
        'title': 'कमेंट और शेयर करो! (Real Streamer)',
        'type': 'human_real',
        'start': 14.0,
        'end': 20.2,
        'text': 'जो भी कंट्री सर्कल के बीच में आना चाहती है ... कमेंट करो, लाइक करो, शेयर करो इस वीडियो को!',
        'transcription': 'Jo bhi country circle ke beech me aana chahti hai ... comment karo, like karo, share karo is video ko!'
    },
    {
        'id': 5,
        'gender': 'streamer',
        'title': 'दबा दब फुल स्पीड! (Real Streamer)',
        'type': 'human_real',
        'start': 20.2,
        'end': 28.2,
        'text': 'जल्दी इमोजी टाइप करो ... तेज़ी से तेज़ी से ... दबा दब दबा दब! ... फुल स्पीड से टाइप करो!',
        'transcription': 'Jaldi emoji type karo ... tezi se tezi se ... daba dab daba dab! ... Full speed se type karo!'
    }
]

# 2. Girl Streamer Voice Clips (EXACT TEXT PRESERVED, tone tuned for warm natural human conversational speech)
girl_prompts = [
    {
        'id': 6,
        'gender': 'girl',
        'title': 'अरे सुनो सुनो! (Girl Streamer)',
        'voice': 'hi-IN-SwaraNeural',
        'rate': '+2%',
        'pitch': '+0Hz',
        'text': 'अरे सुनो सुनो! ... अरे देखो यार! ... तुम्हारी कंट्री नीचे फिसल रही है! ... जल्दी से इमोजी भेजो चैट में!',
        'transcription': 'Are suno suno! ... Are dekho yaar! ... Tumhari country neeche fisal rahi hai! ... Jaldi se emoji bhejo chat mein!'
    },
    {
        'id': 7,
        'gender': 'girl',
        'title': 'ओह माय गॉड बचाओ! (Girl Streamer)',
        'voice': 'hi-IN-SwaraNeural',
        'rate': '+3%',
        'pitch': '+1Hz',
        'text': 'ओह माय गॉड! ... ये क्या हो रहा है! ... नेपाल और इंडिया वाले, जल्दी टाइप करो यार! ... बचा लो अपनी कंट्री को!',
        'transcription': 'Oh my god! ... Ye kya ho raha hai! ... Nepal aur India wale, jaldi type karo yaar! ... Bacha lo apni country ko!'
    },
    {
        'id': 8,
        'gender': 'girl',
        'title': 'चैट में इतनी शांति क्यों है? (Girl Streamer)',
        'voice': 'hi-IN-SwaraNeural',
        'rate': '+2%',
        'pitch': '+0Hz',
        'text': 'अरे भाई साहब! ... चैट में इतनी शांति क्यों है? ... जल्दी जल्दी अपना फ्लैग भेजो! ... बिल्कुल टाइम नहीं है!',
        'transcription': 'Are bhai sahab! ... Chat mein itni shanti kyu hai? ... Jaldi jaldi apna flag bhejo! ... Bilkul time nahi hai!'
    },
    {
        'id': 9,
        'gender': 'girl',
        'title': 'चैट में आग लगा दी! (Girl Streamer)',
        'voice': 'hi-IN-SwaraNeural',
        'rate': '+3%',
        'pitch': '+1Hz',
        'text': 'यस यस यस! ... क्या बात है! ... ब्राज़ील और पाकिस्तान वालों ने चैट में आग लगा दी! ... सुपर चैट से शील्ड ले लो जल्दी!',
        'transcription': 'Yes yes yes! ... Kya baat hai! ... Brazil aur Pakistan walo ne chat mein aag laga di! ... Super chat se shield le lo jaldi!'
    },
    {
        'id': 10,
        'gender': 'girl',
        'title': 'सर्कल का गैप खुल गया! (Girl Streamer)',
        'voice': 'hi-IN-SwaraNeural',
        'rate': '+2%',
        'pitch': '+0Hz',
        'text': 'अरे रुको रुको! ... सर्कल का गैप खुल गया है! ... अपनी कंट्री को बाहर जाने से बचाना है ... तो फुल स्पीड से कमेंट करो!',
        'transcription': 'Are ruko ruko! ... Circle ka gap khul gaya hai! ... Apni country ko bahar jane se bachana hai ... to full speed se comment karo!'
    },
    {
        'id': 11,
        'gender': 'girl',
        'title': 'कौन जीतेगा आज? (Girl Streamer)',
        'voice': 'hi-IN-SwaraNeural',
        'rate': '+2%',
        'pitch': '+0Hz',
        'text': 'ओहो! ... कौन सी कंट्री जीतेगी आज? ... जल्दी से लाइक करो, शेयर करो ... और अपना कंट्री नेम चैट में ड्रॉप करो!',
        'transcription': 'Oho! ... Kaun si country jeetegi aaj? ... Jaldi se like karo, share karo ... aur apna country name chat mein drop karo!'
    },
    {
        'id': 12,
        'gender': 'girl',
        'title': 'Drop Flags Right Now! (Girl Hype)',
        'voice': 'en-IN-NeerjaExpressiveNeural',
        'rate': '+2%',
        'pitch': '+0Hz',
        'text': 'Wait wait wait! ... Your country is right near the gap! ... Spam your flag emojis in the chat right now!',
        'transcription': 'Wait wait wait! ... Your country is right near the gap! ... Spam your flag emojis in the chat right now!'
    },
    {
        'id': 13,
        'gender': 'girl',
        'title': 'Cheer For Your Flag! (Girl Hype)',
        'voice': 'en-IN-NeerjaExpressiveNeural',
        'rate': '+2%',
        'pitch': '+0Hz',
        'text': 'Come on guys! ... Cheer for your country! ... Drop those flag emojis right now in the chat and save them!',
        'transcription': 'Come on guys! ... Cheer for your country! ... Drop those flag emojis right now in the chat and save them!'
    },
    {
        'id': 14,
        'gender': 'girl',
        'title': 'लास्ट के कुछ सेकंड! (Girl Streamer)',
        'voice': 'hi-IN-SwaraNeural',
        'rate': '+3%',
        'pitch': '+1Hz',
        'text': 'अरे बाप रे! ... लास्ट के कुछ ही सेकंड बचे हैं! ... जल्दी करो, जल्दी करो! ... अपनी कंट्री को विनर बनाओ यार!',
        'transcription': 'Are baap re! ... Last ke kuch hi second bache hain! ... Jaldi karo, jaldi karo! ... Apni country ko winner banao yaar!'
    }
]

# 3. Boy Streamer Voice Clips (EXACT TEXT PRESERVED, tone tuned for warm natural human conversational speech)
boy_prompts = [
    {
        'id': 15,
        'gender': 'boy',
        'title': 'स्क्रीन देखो भाई! (Boy Streamer)',
        'voice': 'hi-IN-MadhurNeural',
        'rate': '+3%',
        'pitch': '+0Hz',
        'text': 'अरे भाई भाई भाई! ... ज़रा स्क्रीन देखो! ... तुम्हारी कंट्री बाहर निकलने वाली है! ... जल्दी इमोजी स्पैम करो यार!',
        'transcription': 'Are bhai bhai bhai! ... Zara screen dekho! ... Tumhari country bahar nikalne wali hai! ... Jaldi emoji spam karo yaar!'
    },
    {
        'id': 16,
        'gender': 'boy',
        'title': 'महामुकाबला शुरू! (Boy Streamer)',
        'voice': 'hi-IN-MadhurNeural',
        'rate': '+3%',
        'pitch': '+1Hz',
        'text': 'ओ तेरी! ... इंडिया और पाकिस्तान का महामुकाबला चल रहा है! ... देखते हैं कौन चैट में सबसे आगे निकलता है!',
        'transcription': 'O teri! ... India aur Pakistan ka maha mukabla chal raha hai! ... Dekhte hain kaun chat mein sabse aage nikalta hai!'
    },
    {
        'id': 17,
        'gender': 'boy',
        'title': 'दबा दब टाइप करो! (Boy Streamer)',
        'voice': 'hi-IN-MadhurNeural',
        'rate': '+2%',
        'pitch': '+0Hz',
        'text': 'अरे क्या कर रहे हो यार? ... दबा दब टाइप करो ना! ... फुल स्पीड से चैट भर दो अपनी कंट्री से!',
        'transcription': 'Are kya kar rahe ho yaar? ... Daba dab type karo na! ... Full speed se chat bhar do apni country se!'
    },
    {
        'id': 18,
        'gender': 'boy',
        'title': 'तूफान ला दिया चैट में! (Boy Streamer)',
        'voice': 'hi-IN-MadhurNeural',
        'rate': '+3%',
        'pitch': '+1Hz',
        'text': 'ओ भाई साहब! ... ये तो बिल्कुल सेफ हो गई! ... चैट में तूफान ला दिया तुम लोगों ने! ... ओपी बोलते भाई ओपी!',
        'transcription': 'O bhai sahab! ... Ye to bilkul safe ho gayi! ... Chat mein toofan la diya tum logo ne! ... OP bolte bhai OP!'
    },
    {
        'id': 19,
        'gender': 'boy',
        'title': 'सुपर चैट ठोको! (Boy Streamer)',
        'voice': 'hi-IN-MadhurNeural',
        'rate': '+2%',
        'pitch': '+0Hz',
        'text': 'अरे सुनो भाई लोग! ... जिसको भी अपनी कंट्री को सर्कल के अंदर रखना है ... फटाफट से कमेंट करो और सुपर चैट ठोको!',
        'transcription': 'Are suno bhai log! ... Jisko bhi apni country ko circle ke andar rakhna hai ... fatafat se comment karo aur super chat thoko!'
    },
    {
        'id': 20,
        'gender': 'boy',
        'title': 'गैप घूम रहा है! (Boy Streamer)',
        'voice': 'hi-IN-MadhurNeural',
        'rate': '+3%',
        'pitch': '+0Hz',
        'text': 'अरे अरे अरे! ... गैप घूम रहा है भाई! ... जल्दी से अपनी कंट्री को धक्का मारो अंदर! ... फुल स्पीड!',
        'transcription': 'Are are are! ... Gap ghum raha hai bhai! ... Jaldi se apni country ko dhakka maro andar! ... Full speed!'
    },
    {
        'id': 21,
        'gender': 'boy',
        'title': 'Amazing Comeback! (Boy Hype)',
        'voice': 'en-IN-PrabhatNeural',
        'rate': '+2%',
        'pitch': '+0Hz',
        'text': 'Yes! Amazing comeback! ... Look at that bounce! ... Keep spamming your country flags in the chat right now!',
        'transcription': 'Yes! Amazing comeback! ... Look at that bounce! ... Keep spamming your country flags in the chat right now!'
    },
    {
        'id': 22,
        'gender': 'boy',
        'title': 'कहाँ सो रहे हो सब? (Boy Streamer)',
        'voice': 'hi-IN-MadhurNeural',
        'rate': '+2%',
        'pitch': '+0Hz',
        'text': 'अरे कहाँ सो रहे हो सब लोग? ... नेपाल, ब्राज़ील, बांग्लादेश! ... जल्दी से अपना झंडा भेजो चैट में!',
        'transcription': 'Are kahan so rahe ho sab log? ... Nepal, Brazil, Bangladesh! ... Jaldi se apna jhanda bhejo chat mein!'
    },
    {
        'id': 23,
        'gender': 'boy',
        'title': 'लास्ट राउंड क्लैश! (Boy Streamer)',
        'voice': 'hi-IN-MadhurNeural',
        'rate': '+3%',
        'pitch': '+1Hz',
        'text': 'अरे भाई लास्ट राउंड चल रहा है! ... जो लास्ट तक टिकेगा वही बनेगा आज का चैंपियन! ... लेट्स गो!',
        'transcription': 'Are bhai last round chal raha hai! ... Jo last tak tikega wahi banega aaj ka champion! ... Lets go!'
    },
    {
        'id': 24,
        'gender': 'boy',
        'title': 'फुल पावर लाइक ठोको! (Boy Streamer)',
        'voice': 'hi-IN-MadhurNeural',
        'rate': '+2%',
        'pitch': '+0Hz',
        'text': 'लाइक ठोको, शेयर करो! ... और फुल पावर से चैट में अपनी कंट्री का नाम लिखो! ... रुकना नहीं है बिल्कुल!',
        'transcription': 'Like thoko, share karo! ... Aur full power se chat mein apni country ka naam likho! ... Rukna nahi hai bilkul!'
    }
]

# 4. Motu Patlu Cartoon Voices (Iconic Furfuri Nagar humor, samosas, and ideas!)
motu_patlu_prompts = [
    {
        'id': 25,
        'gender': 'motu_patlu',
        'character': 'motu',
        'title': 'दिमाग की बत्ती (Motu Cartoon)',
        'voice': 'hi-IN-MadhurNeural',
        'rate': '+1%',
        'pitch': '-7Hz',
        'text': 'खाली पेट मेरे दिमाग की बत्ती नहीं जलती! ... तुम लोग जल्दी से चैट में समोसा और फ्लैग भेजो यार!',
        'transcription': 'Khali pet mere dimag ki batti nahi jalti! ... Tum log jaldi se chat mein samosa aur flag bhejo yaar!'
    },
    {
        'id': 26,
        'gender': 'motu_patlu',
        'character': 'motu',
        'title': 'अरे पतलू बचाओ! (Motu Cartoon)',
        'voice': 'hi-IN-MadhurNeural',
        'rate': '+2%',
        'pitch': '-7Hz',
        'text': 'अरे पतलू! ... ज़रा देखो तो सही! ... अपनी कंट्री नीचे गिरने वाली है! ... बचाओ बचाओ बचाओ!',
        'transcription': 'Are Patlu! ... Zara dekho to sahi! ... Apni country neeche girne wali hai! ... Bachao bachao bachao!'
    },
    {
        'id': 27,
        'gender': 'motu_patlu',
        'character': 'motu',
        'title': 'समोसे की खुशबू (Motu Cartoon)',
        'voice': 'hi-IN-MadhurNeural',
        'rate': '+1%',
        'pitch': '-6Hz',
        'text': 'ओ भाई साहब! ... चैट में तो गरमा-गरम समोसे की खुशबू आ रही है! ... जल्दी से अपनी कंट्री का नाम लिखो!',
        'transcription': 'O bhai sahab! ... Chat mein to garma-garam samose ki khushboo aa rahi hai! ... Jaldi se apni country ka naam likho!'
    },
    {
        'id': 28,
        'gender': 'motu_patlu',
        'character': 'motu',
        'title': 'गाड़ी छूट जाएगी! (Motu Cartoon)',
        'voice': 'hi-IN-MadhurNeural',
        'rate': '+2%',
        'pitch': '-7Hz',
        'text': 'अरे जल्दी इमोजी भेजो भाई! ... वरना गाड़ी छूट जाएगी! ... फुल स्पीड से चैट में आग लगा दो!',
        'transcription': 'Are jaldi emoji bhejo bhai! ... Warna gaadi chhoot jayegi! ... Full speed se chat mein aag laga do!'
    },
    {
        'id': 29,
        'gender': 'motu_patlu',
        'character': 'patlu',
        'title': 'मेरे पास एक आइडिया है! (Patlu Cartoon)',
        'voice': 'hi-IN-MadhurNeural',
        'rate': '+8%',
        'pitch': '+14Hz',
        'text': 'आइडिया! ... मोटू मेरे पास एक ज़बरदस्त आइडिया है! ... व्यूअर्स, चैट में अपनी कंट्री का नाम लिखो और उसे विनर बनाओ!',
        'transcription': 'Idea! ... Motu mere paas ek zabardast idea hai! ... Viewers, chat mein apni country ka naam likho aur use winner banao!'
    },
    {
        'id': 30,
        'gender': 'motu_patlu',
        'character': 'patlu',
        'title': 'मोटू संभल के! (Patlu Cartoon)',
        'voice': 'hi-IN-MadhurNeural',
        'rate': '+8%',
        'pitch': '+15Hz',
        'text': 'अरे मोटू संभल के! ... सर्कल का गैप घूम रहा है! ... सब लोग जल्दी से स्क्रीन पर ध्यान दो और वोट करो!',
        'transcription': 'Are Motu sambhal ke! ... Circle ka gap ghum raha hai! ... Sab log jaldi se screen par dhyan do aur vote karo!'
    },
    {
        'id': 31,
        'gender': 'motu_patlu',
        'character': 'patlu',
        'title': 'पतलू की सलाह (Patlu Cartoon)',
        'voice': 'hi-IN-MadhurNeural',
        'rate': '+7%',
        'pitch': '+14Hz',
        'text': 'पतलू की सलाह मानो भाई लोग! ... जल्दी से लाइक करो, शेयर करो ... और अपनी कंट्री को सेफ करो!',
        'transcription': 'Patlu ki salah mano bhai log! ... Jaldi se like karo, share karo ... aur apni country ko safe karo!'
    },
    {
        'id': 32,
        'gender': 'motu_patlu',
        'character': 'duo',
        'title': 'मोटू पतलू की जोड़ी (Motu Patlu Duo)',
        'voice': 'hi-IN-MadhurNeural',
        'rate': '+3%',
        'pitch': '-2Hz',
        'text': 'मोटू पतलू की जोड़ी बोल रही है भाई लोग! ... अपनी कंट्री को बाहर मत जाने देना! ... लेट्स गो!',
        'transcription': 'Motu Patlu ki jodi bol rahi hai bhai log! ... Apni country ko bahar mat jane dena! ... Lets go!'
    }
]

# Audio filter chain: Warm, natural podcast mic tone without harsh robotic compression
AUDIO_FILTER = (
    "volume=1.12,"
    "equalizer=f=120:width_type=o:width=1.5:g=1.8,"
    "equalizer=f=3200:width_type=o:width=2:g=1.2,"
    "loudnorm=I=-16:TP=-1.5:LRA=12"
)

all_prompts = []

# Process user authentic clips 1..5
print("=== Processing User Authentic Voice Clips (1-5) ===")
for c in user_clips:
    num_str = f"{c['id']:02d}"
    mp3_path = f"{OUT_DIR}/prompt_{num_str}.mp3"
    m4a_path = f"{OUT_DIR}/prompt_{num_str}.m4a"
    dur = c['end'] - c['start']

    subprocess.run([
        '/opt/homebrew/bin/ffmpeg', '-y',
        '-ss', str(c['start']), '-t', str(dur),
        '-i', USER_FILE,
        '-af', AUDIO_FILTER,
        '-c:a', 'libmp3lame', '-b:a', '128k', '-ar', '48000', mp3_path
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    subprocess.run([
        '/opt/homebrew/bin/ffmpeg', '-y',
        '-ss', str(c['start']), '-t', str(dur),
        '-i', USER_FILE,
        '-af', AUDIO_FILTER,
        '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', m4a_path
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    all_prompts.append(c)
    print(f"Processed Prompt {num_str} ({c['gender']}): {c['title']}")

# Process Girl, Boy, & Motu Patlu clips
async def generate_speech_clips(prompts_list, category_name):
    print(f"\n=== Generating {category_name} Voice Clips ===")
    for p in prompts_list:
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

        # Apply broadcast warmth & leveling filter
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

        all_prompts.append(p)
        print(f"Generated Prompt {num_str} ({p['gender']}): {p['title']}")

async def main():
    await generate_speech_clips(girl_prompts, "Girl (Female)")
    await generate_speech_clips(boy_prompts, "Boy (Male)")
    await generate_speech_clips(motu_patlu_prompts, "Motu Patlu (Cartoon)")

asyncio.run(main())

# Save complete manifest
manifest_path = f"{OUT_DIR}/manifest.json"
with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(all_prompts, f, ensure_ascii=False, indent=2)

print(f"\nSUCCESS: All {len(all_prompts)} prompts generated and saved!")
