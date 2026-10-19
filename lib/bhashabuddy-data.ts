export type LanguageCode = "te" | "hi" | "ta" | "kn" | "ml";

export type Language = {
  code: LanguageCode;
  name: string;
  nativeName: string;
  locale: string;
  script: string;
};

export const LANGUAGES: Language[] = [
  { code: "te", name: "Telugu", nativeName: "తెలుగు", locale: "te-IN", script: "Telugu" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", locale: "hi-IN", script: "Devanagari" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", locale: "ta-IN", script: "Tamil" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", locale: "kn-IN", script: "Kannada" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", locale: "ml-IN", script: "Malayalam" },
];

export type Phrase = {
  id: string;
  nativeText: string;
  transliteration: string;
  meaning: string;
  category: string;
  note: string;
  day: number;
};

const makePhrase = (
  id: string,
  nativeText: string,
  transliteration: string,
  meaning: string,
  category: string,
  note: string,
  day: number,
): Phrase => ({ id, nativeText, transliteration, meaning, category, note, day });

export const PHRASES: Record<LanguageCode, Phrase[]> = {
  te: [
    makePhrase("te-hello", "నమస్కారం", "Namaskāram", "Hello", "Greetings", "A respectful greeting for most everyday situations.", 1),
    makePhrase("te-name-q", "మీ పేరు ఏమిటి?", "Mī pēru ēmiṭi?", "What is your name?", "Introductions", "Polite way to ask someone their name.", 2),
    makePhrase("te-name", "నా పేరు అనిత.", "Nā pēru Anita.", "My name is Anita.", "Introductions", "Replace Anita with your own name.", 2),
    makePhrase("te-please", "దయచేసి", "Dayacēsi", "Please", "Polite requests", "Useful at the beginning of a request.", 3),
    makePhrase("te-thanks", "ధన్యవాదాలు", "Dhanyavādālu", "Thank you", "Polite requests", "A common polite expression of thanks.", 3),
    makePhrase("te-repeat", "దయచేసి మళ్లీ చెప్పండి.", "Dayacēsi maḷḷī ceppaṇḍi.", "Please say that again.", "Asking for help", "A polite way to ask someone to repeat.", 7),
    makePhrase("te-bus-where", "బస్ స్టేషన్ ఎక్కడ ఉంది?", "Bas stēṣan ekkaḍa undi?", "Where is the bus station?", "Transport", "A practical question when finding a stop.", 8),
    makePhrase("te-station-how", "రైల్వే స్టేషన్‌కి ఎలా వెళ్లాలి?", "Railway station-ki elā veḷḷāli?", "How do I get to the railway station?", "Transport", "Ask this when you need directions.", 8),
    makePhrase("te-left", "సూటిగా వెళ్లి ఎడమవైపు తిరగండి.", "Sūṭigā veḷḷi eḍamavaipu tiragaṇḍi.", "Go straight and turn left.", "Directions", "A simple direction you may hear on a local street.", 8),
    makePhrase("te-bus-go", "ఈ బస్సు అక్కడికి వెళ్తుందా?", "Ī bassu akkaḍiki veḷtundā?", "Does this bus go there?", "Transport", "A simple route check before you board.", 9),
    makePhrase("te-price", "ఇది ఎంత?", "Idi enta?", "How much is this?", "Shopping", "A short, everyday price question.", 12),
    makePhrase("te-water", "నాకు నీళ్లు కావాలి.", "Nāku nīḷḷu kāvāli.", "I would like water.", "Food", "A clear way to ask for water.", 11),
    makePhrase("te-learning", "నేను తెలుగు నేర్చుకుంటున్నాను.", "Nēnu Telugu nērcukuṇṭunnānu.", "I am learning Telugu.", "Social conversation", "A helpful way to set expectations with a conversation partner.", 21),
  ],
  hi: [
    makePhrase("hi-hello", "नमस्ते", "Namaste", "Hello", "Greetings", "A respectful greeting for most everyday situations.", 1),
    makePhrase("hi-name-q", "आपका नाम क्या है?", "Aapka naam kya hai?", "What is your name?", "Introductions", "Polite way to ask someone their name.", 2),
    makePhrase("hi-name", "मेरा नाम अनिता है।", "Mera naam Anita hai.", "My name is Anita.", "Introductions", "Replace Anita with your own name.", 2),
    makePhrase("hi-please", "कृपया", "Kripaya", "Please", "Polite requests", "A polite word to introduce a request.", 3),
    makePhrase("hi-thanks", "धन्यवाद", "Dhanyavaad", "Thank you", "Polite requests", "A common polite expression of thanks.", 3),
    makePhrase("hi-repeat", "कृपया फिर से कहिए।", "Kripaya phir se kahiye.", "Please say that again.", "Asking for help", "A polite way to ask someone to repeat.", 7),
    makePhrase("hi-bus-where", "बस स्टैंड कहाँ है?", "Bus stand kahaan hai?", "Where is the bus stop?", "Transport", "A practical question when finding a stop.", 8),
    makePhrase("hi-station-how", "रेलवे स्टेशन कैसे जाऊँ?", "Railway station kaise jaaun?", "How do I get to the railway station?", "Transport", "Ask this when you need directions.", 8),
    makePhrase("hi-left", "सीधे जाइए और बाएँ मुड़िए।", "Seedhe jaiye aur baayen mudiye.", "Go straight and turn left.", "Directions", "A simple direction you may hear on a local street.", 8),
    makePhrase("hi-bus-go", "क्या यह बस वहाँ जाती है?", "Kya yeh bus vahaan jaati hai?", "Does this bus go there?", "Transport", "A simple route check before you board.", 9),
    makePhrase("hi-price", "यह कितने का है?", "Yeh kitne ka hai?", "How much is this?", "Shopping", "A short, everyday price question.", 12),
    makePhrase("hi-water", "मुझे पानी चाहिए।", "Mujhe paani chahiye.", "I would like water.", "Food", "A clear way to ask for water.", 11),
    makePhrase("hi-learning", "मैं हिंदी सीख रहा/रही हूँ।", "Main Hindi seekh raha/rahi hoon.", "I am learning Hindi.", "Social conversation", "Choose raha or rahi to match how you refer to yourself.", 21),
  ],
  ta: [
    makePhrase("ta-hello", "வணக்கம்", "Vaṇakkam", "Hello", "Greetings", "A respectful greeting for most everyday situations.", 1),
    makePhrase("ta-name-q", "உங்கள் பெயர் என்ன?", "Uṅkaḷ peyar eṉṉa?", "What is your name?", "Introductions", "Polite way to ask someone their name.", 2),
    makePhrase("ta-name", "என் பெயர் அனிதா.", "Eṉ peyar Anitā.", "My name is Anita.", "Introductions", "Replace Anita with your own name.", 2),
    makePhrase("ta-please", "தயவுசெய்து", "Tayavuceytu", "Please", "Polite requests", "A polite word to introduce a request.", 3),
    makePhrase("ta-thanks", "நன்றி", "Naṉṟi", "Thank you", "Polite requests", "A common polite expression of thanks.", 3),
    makePhrase("ta-repeat", "தயவுசெய்து மீண்டும் சொல்லுங்கள்.", "Tayavuceytu mīṇṭum colluṅkaḷ.", "Please say that again.", "Asking for help", "A polite way to ask someone to repeat.", 7),
    makePhrase("ta-bus-where", "பேருந்து நிலையம் எங்கே?", "Pēruntu nilaiyam eṅkē?", "Where is the bus station?", "Transport", "A practical question when finding a stop.", 8),
    makePhrase("ta-station-how", "ரயில் நிலையத்திற்கு எப்படி போவது?", "Rayil nilaiyattiṟku eppaṭi pōvatu?", "How do I get to the railway station?", "Transport", "Ask this when you need directions.", 8),
    makePhrase("ta-left", "நேராகச் சென்று இடப்பக்கம் திரும்புங்கள்.", "Nērāka cenṟu iṭappakkam tirumpuṅkaḷ.", "Go straight and turn left.", "Directions", "A simple direction you may hear on a local street.", 8),
    makePhrase("ta-bus-go", "இந்தப் பேருந்து அங்கே போகுமா?", "Intap pēruntu aṅkē pōkumā?", "Does this bus go there?", "Transport", "A simple route check before you board.", 9),
    makePhrase("ta-price", "இது எவ்வளவு?", "Itu evvaḷavu?", "How much is this?", "Shopping", "A short, everyday price question.", 12),
    makePhrase("ta-water", "எனக்கு தண்ணீர் வேண்டும்.", "Eṉakku taṇṇīr vēṇṭum.", "I would like water.", "Food", "A clear way to ask for water.", 11),
    makePhrase("ta-learning", "நான் தமிழ் கற்றுக்கொள்கிறேன்.", "Nāṉ Tamiḻ kaṟṟukkoḷkiṟēṉ.", "I am learning Tamil.", "Social conversation", "A helpful way to set expectations with a conversation partner.", 21),
  ],
  kn: [
    makePhrase("kn-hello", "ನಮಸ್ಕಾರ", "Namaskāra", "Hello", "Greetings", "A respectful greeting for most everyday situations.", 1),
    makePhrase("kn-name-q", "ನಿಮ್ಮ ಹೆಸರೇನು?", "Nimma hesarēnu?", "What is your name?", "Introductions", "Polite way to ask someone their name.", 2),
    makePhrase("kn-name", "ನನ್ನ ಹೆಸರು ಅನಿತಾ.", "Nanna hesaru Anitā.", "My name is Anita.", "Introductions", "Replace Anita with your own name.", 2),
    makePhrase("kn-please", "ದಯವಿಟ್ಟು", "Dayaviṭṭu", "Please", "Polite requests", "A polite word to introduce a request.", 3),
    makePhrase("kn-thanks", "ಧನ್ಯವಾದಗಳು", "Dhanyavādagaḷu", "Thank you", "Polite requests", "A common polite expression of thanks.", 3),
    makePhrase("kn-repeat", "ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ.", "Dayaviṭṭu mattomme hēḷi.", "Please say that again.", "Asking for help", "A polite way to ask someone to repeat.", 7),
    makePhrase("kn-bus-where", "ಬಸ್ ನಿಲ್ದಾಣ ಎಲ್ಲಿದೆ?", "Bus nilḍāṇa ellide?", "Where is the bus station?", "Transport", "A practical question when finding a stop.", 8),
    makePhrase("kn-station-how", "ರೈಲು ನಿಲ್ದಾಣಕ್ಕೆ ಹೇಗೆ ಹೋಗುವುದು?", "Railu nilḍāṇakke hēge hōguvudu?", "How do I get to the railway station?", "Transport", "Ask this when you need directions.", 8),
    makePhrase("kn-left", "ನೇರವಾಗಿ ಹೋಗಿ ಎಡಕ್ಕೆ ತಿರುಗಿ.", "Nēravāgi hōgi eḍakke tirugi.", "Go straight and turn left.", "Directions", "A simple direction you may hear on a local street.", 8),
    makePhrase("kn-bus-go", "ಈ ಬಸ್ ಅಲ್ಲಿಗೆ ಹೋಗುತ್ತದೆಯೇ?", "Ī bus allige hōguttadeyē?", "Does this bus go there?", "Transport", "A simple route check before you board.", 9),
    makePhrase("kn-price", "ಇದು ಎಷ್ಟು?", "Idu eṣṭu?", "How much is this?", "Shopping", "A short, everyday price question.", 12),
    makePhrase("kn-water", "ನನಗೆ ನೀರು ಬೇಕು.", "Nanage nīru bēku.", "I would like water.", "Food", "A clear way to ask for water.", 11),
    makePhrase("kn-learning", "ನಾನು ಕನ್ನಡ ಕಲಿಯುತ್ತಿದ್ದೇನೆ.", "Nānu Kannada kaliyuttiddēne.", "I am learning Kannada.", "Social conversation", "A helpful way to set expectations with a conversation partner.", 21),
  ],
  ml: [
    makePhrase("ml-hello", "നമസ്കാരം", "Namaskāram", "Hello", "Greetings", "A respectful greeting for most everyday situations.", 1),
    makePhrase("ml-name-q", "നിങ്ങളുടെ പേര് എന്താണ്?", "Niṅṅaḷuṭe pēru entāṇ?", "What is your name?", "Introductions", "Polite way to ask someone their name.", 2),
    makePhrase("ml-name", "എന്റെ പേര് അനിത.", "Enṟe pēru Anita.", "My name is Anita.", "Introductions", "Replace Anita with your own name.", 2),
    makePhrase("ml-please", "ദയവായി", "Dayavāyi", "Please", "Polite requests", "A polite word to introduce a request.", 3),
    makePhrase("ml-thanks", "നന്ദി", "Nandi", "Thank you", "Polite requests", "A common polite expression of thanks.", 3),
    makePhrase("ml-repeat", "ദയവായി ഒരിക്കൽ കൂടി പറയാമോ?", "Dayavāyi orikkal kūṭi paṟayāmō?", "Could you please say that again?", "Asking for help", "A polite way to ask someone to repeat.", 7),
    makePhrase("ml-bus-where", "ബസ് സ്റ്റേഷൻ എവിടെയാണ്?", "Bus station eviṭeyāṇ?", "Where is the bus station?", "Transport", "A practical question when finding a stop.", 8),
    makePhrase("ml-station-how", "റെയിൽവേ സ്റ്റേഷനിലേക്ക് എങ്ങനെ പോകാം?", "Railway stationilekku eṅṅane pōkām?", "How do I get to the railway station?", "Transport", "Ask this when you need directions.", 8),
    makePhrase("ml-left", "നേരെ പോയി ഇടത്തോട്ട് തിരിയുക.", "Nēre pōyi iṭattōṭṭ tiriyuka.", "Go straight and turn left.", "Directions", "A simple direction you may hear on a local street.", 8),
    makePhrase("ml-bus-go", "ഈ ബസ് അവിടേക്ക് പോകുമോ?", "Ī bus aviṭekk pōkumō?", "Does this bus go there?", "Transport", "A simple route check before you board.", 9),
    makePhrase("ml-price", "ഇതിന് എത്രയാണ്?", "Itiṉ etrayāṇ?", "How much is this?", "Shopping", "A short, everyday price question.", 12),
    makePhrase("ml-water", "എനിക്ക് വെള്ളം വേണം.", "Enikk veḷḷaṁ vēṇam.", "I would like water.", "Food", "A clear way to ask for water.", 11),
    makePhrase("ml-learning", "ഞാൻ മലയാളം പഠിക്കുകയാണ്.", "Ñān Malayāḷaṁ paṭhikkukayāṇ.", "I am learning Malayalam.", "Social conversation", "A helpful way to set expectations with a conversation partner.", 21),
  ],
};

export type Lesson = {
  day: number;
  stage: number;
  stageTitle: string;
  title: string;
  objective: string;
  scenario: string;
  duration: number;
};

const titles = [
  "Say hello", "Introduce yourself", "Keep it polite", "Ask a simple question", "Count what you need",
  "Talk about time", "Ask someone to repeat", "Find your way around", "Take the bus", "Read the landmarks",
  "Order something simple", "Ask about a price", "At the market", "Ask for help", "Say what you like",
  "Share your routine", "Talk about your day", "Meet someone new", "Make a plan", "Offer a kind reply",
  "Handle a misunderstanding", "Add one more detail", "Ask for clarification", "Speak when unsure",
  "Follow a short exchange", "At college or work", "Make a polite request", "Your everyday errand",
  "Scenario check", "Your next conversation",
];

const objectives = [
  "Greet someone and answer a greeting with ease.",
  "Share your name and ask someone else for theirs.",
  "Use two small words that make requests warmer.",
  "Ask a clear question when something is unfamiliar.",
  "Recognise a few numbers when you hear a price.",
  "Ask what time something starts or leaves.",
  "Ask a conversation partner to repeat a sentence.",
  "Ask where a place is and follow one simple direction.",
  "Check whether a bus is going where you need to go.",
  "Use a familiar landmark to understand a route.",
  "Order one drink or snack with a short, polite request.",
  "Ask the price and understand a simple answer.",
  "Make a small purchase and respond to a follow-up.",
  "Ask a nearby person for help with one specific need.",
  "Say one thing you like and ask the other person.",
  "Describe one part of your everyday routine.",
  "Share a short detail about how your day is going.",
  "Start a friendly conversation with someone new.",
  "Suggest a simple plan and respond to an invitation.",
  "Accept, decline, or thank someone politely.",
  "Keep going after one part of the conversation is unclear.",
  "Join two short ideas together with a useful connector.",
  "Ask for a slower or clearer explanation.",
  "Keep a conversation moving while you search for a word.",
  "Understand and answer a two-turn exchange.",
  "Share a simple need in a college or work setting.",
  "Make a request with a courteous opening.",
  "Complete a small errand from greeting to goodbye.",
  "Try three everyday situations with fewer hints.",
  "Notice what feels easier and choose a next step.",
];

const scenarios = [
  "A neighbour greets you on the way outside.",
  "You meet a classmate before your first class.",
  "You are asking a shopkeeper for a small favour.",
  "You have reached a new place and need to ask a question.",
  "You are buying fruit and checking the total.",
  "You are checking when the next bus leaves.",
  "A helpful local gives you directions in a busy street.",
  "You are outside a transit stop, trying to find the bus station.",
  "You are speaking with a bus conductor before boarding.",
  "You are using a shop or a landmark to find the right turn.",
  "You are ordering at a small neighbourhood café.",
  "You are checking the price of something at a market stall.",
  "You are choosing a few things at a local shop.",
  "You need to find a nearby public place.",
  "You are chatting with someone about food or music.",
  "A new friend asks what your weekdays are like.",
  "Someone asks how you are doing today.",
  "You are introduced to a neighbour or classmate.",
  "A friend asks if you are free later this week.",
  "You are responding to a kind offer from a colleague.",
  "You missed one sentence and want to keep the conversation going.",
  "You are describing a small plan to a new friend.",
  "You are not sure you heard the directions correctly.",
  "You are ordering something while thinking through the words.",
  "A local asks one simple follow-up question.",
  "You need to ask a classmate where to meet.",
  "You want someone to speak a little more slowly.",
  "You are picking up one item on the way home.",
  "You move between a shop, a street, and a café.",
  "You revisit the situations that mattered to you this month.",
];

export const CURRICULUM: Lesson[] = titles.map((title, index) => {
  const day = index + 1;
  const stage = day <= 3 ? 1 : day <= 7 ? 2 : day <= 14 ? 3 : day <= 21 ? 4 : 5;
  const stageTitles = ["First interactions", "Everyday essentials", "Moving around", "Social communication", "Practical conversation"];
  return {
    day,
    stage,
    stageTitle: stageTitles[stage - 1],
    title,
    objective: objectives[index],
    scenario: scenarios[index],
    duration: day === 29 || day === 30 ? 15 : day % 4 === 0 ? 12 : 10,
  };
});

export const STAGES = [
  { number: 1, title: "First interactions", range: "01—03", days: "Days 1–3" },
  { number: 2, title: "Everyday essentials", range: "04—07", days: "Days 4–7" },
  { number: 3, title: "Moving around", range: "08—14", days: "Days 8–14" },
  { number: 4, title: "Social communication", range: "15—21", days: "Days 15–21" },
  { number: 5, title: "Practical conversation", range: "22—30", days: "Days 22–30" },
];

export function getLessonPhrases(languageCode: LanguageCode, day: number): Phrase[] {
  const matching = PHRASES[languageCode].filter((phrase) => phrase.day === day);
  if (matching.length) return matching;
  const fallback = PHRASES[languageCode].filter((phrase) => [3, 7, 8, 11, 12].includes(phrase.day));
  return fallback.slice(0, 2);
}

export function getLanguage(code: LanguageCode): Language {
  return LANGUAGES.find((language) => language.code === code) ?? LANGUAGES[0];
}

export function getNextDay(completedDays: number[]): number {
  for (let day = 1; day <= 30; day += 1) {
    if (!completedDays.includes(day)) return day;
  }
  return 30;
}
