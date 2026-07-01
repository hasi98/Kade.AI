export type UiLanguage = "en" | "si" | "si-Latn" | "ta" | "ta-Latn";

export const UI_TRANSLATIONS: Record<string, Partial<Record<Exclude<UiLanguage, "en">, string>>> = {
  "Start shopping your way": {
    "si": "ඔයාට කැමති විදිහට ශොපින් පටන් ගන්න",
    "ta": "உங்கள் விருப்பப்படி ஷாப்பிங்கைத் தொடங்குங்கள்",
    "si-Latn": "Oyata kamathi widihata shopping patan ganna",
    "ta-Latn": "Ungal viruppappadi shopping-ai thodangungal"
  },
  "Use Kade instantly as a guest, or sign in with Google only if you want your profile shown here.": {
    "si": "ලොග් නොවී නිකන්ම කඩේ පාවිච්චි කරන්නත් පුළුවන්, නැත්නම් ඔයාගේ ප්‍රොෆයිල් එක මෙතන පේන්න Google එකෙන් සයින් ඉන් වෙන්න.",
    "ta": "உடனே கெஸ்ட்டாக 'கடே'யைப் பயன்படுத்துங்கள், அல்லது உங்கள் புரொஃபைல் இங்கே தெரிய வேண்டுமானால் மட்டும் கூகுள் மூலம் சைன்-இன் செய்யவும்.",
    "si-Latn": "Log nowee nikanma Kade pawichchi karannath puluwan, nathnam oyage profile eka methana penna Google eken sign in wenna.",
    "ta-Latn": "Udane guest-aa 'Kade'-yai payanpaduthunga, illana ungal profile inge theriya vaendumanal mattum Google moolam sign-in seiyavum."
  },
  "Continue as guest": {
    "si": "එකවුන්ට් නැතුව ඉස්සරහට යන්න",
    "ta": "கெஸ்ட்டாகத் தொடரவும்",
    "si-Latn": "Account nathuwa issarahata yanna",
    "ta-Latn": "Guest-aa thodaravum"
  },
  "No account needed": {
    "si": "එකවුන්ට් එකක් ඕනෙම නැහැ",
    "ta": "அக்கவுண்ட் தேவையில்லை",
    "si-Latn": "Account ekak onemada naha",
    "ta-Latn": "Account thevaillai"
  },
  "Optional - shopping still works without signing in.": {
    "si": "සයින් ඉන් නොවී වුණත් කිසිම ප්‍රශ්නයක් නැතුව ශොපින් කරන්න පුළුවන්.",
    "ta": "கட்டாயமில்லை - சைன்-இன் செய்யாமலும் ஷாப்பிங் செய்ய முடியும்.",
    "si-Latn": "Sign in nowee unath kisima prashnayak nathuwa shopping karanna puluwan.",
    "ta-Latn": "Kattayamillai - sign-in seiyamalum shopping seiya mudiyum."
  },
  "Continue with Google": {
    "si": "Google එකෙන් ඉස්සරහට යන්න",
    "ta": "கூகுள் மூலம் தொடரவும்",
    "si-Latn": "Google eken issarahata yanna",
    "ta-Latn": "Google moolam thodaravum"
  },
  "Sign in with Google": {},
  "Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable Google sign-in.": {
    "si": "Google sign-in වැඩ කරන්න NEXT_PUBLIC_GOOGLE_CLIENT_ID ඇඩ් කරන්න.",
    "ta": "கூகுள் சைன்-இன்னை எனேபிள் செய்ய NEXT_PUBLIC_GOOGLE_CLIENT_ID ஐச் சேர்க்கவும்.",
    "si-Latn": "Google sign-in wada karanna NEXT_PUBLIC_GOOGLE_CLIENT_ID add karanna.",
    "ta-Latn": "Google sign-in enable seiya NEXT_PUBLIC_GOOGLE_CLIENT_ID-ai serkkavum."
  },
  "Google did not return a sign-in token. Try again or continue as guest.": {
    "si": "Google එකෙන් ලොග් වෙන්න බැරි වුණා. ආයෙත් ට්‍රයි කරන්න, නැත්නම් එකවුන්ට් නැතුවම යන්න.",
    "ta": "கூகுள் சைன்-இன் டோக்கன் கிடைக்கவில்லை. மீண்டும் முயலவும் அல்லது கெஸ்ட்டாகத் தொடரவும்.",
    "si-Latn": "Google eken log wenna bari una. Ayeth try karanna, nathnam account nathuwama yanna.",
    "ta-Latn": "Google sign-in token kidaikkavillai. Meendum muyalavum illana guest-aa thodaravum."
  },
  "Could not read the Google profile. Guest mode still works.": {
    "si": "Google ප්‍රොෆයිල් එක කියවන්න බැරි වුණා. හැබැයි ලොග් නොවී වුණත් වැඩේ කරන්න පුළුවන්.",
    "ta": "கூகுள் புரொஃபைலை ரீட் செய்ய முடியவில்லை. ஆனாலும் கெஸ்ட் மோடில் பயன்படுத்தலாம்.",
    "si-Latn": "Google profile eka kiyawanna bari una. Habai log nowee unath wade karanna puluwan.",
    "ta-Latn": "Google profile-ai read seiya mudiyavillai. Aanalum guest mode-il payanpaduthalaam."
  },
  "Guest": {
    "si": "ලොග් නොවී",
    "ta": "கெஸ்ட்",
    "si-Latn": "Log nowee",
    "ta-Latn": "Guest"
  },
  "Guest mode": {
    "si": "එකවුන්ට් නැතිව (ගෙස්ට් මෝඩ්)",
    "ta": "கெஸ்ட் மோட்",
    "si-Latn": "Account nathuwa (Guest mode)",
    "ta-Latn": "Guest mode"
  },
  "Google account": {
    "si": "Google එකවුන්ට් එක",
    "ta": "கூகுள் அக்கவுண்ட்",
    "si-Latn": "Google account eka",
    "ta-Latn": "Google account"
  },
  "Switch account": {
    "si": "වෙන එකවුන්ට් එකකට මාරු වෙන්න",
    "ta": "வேறு அக்கவுண்ட்டுக்கு மாறவும்",
    "si-Latn": "Wena account ekakata maru wenna",
    "ta-Latn": "Vera account-ukku maaravum"
  },
  "Sign out": {
    "si": "සයින් අවුට් වෙන්න",
    "ta": "சைன் அவுட் செய்யவும்",
    "si-Latn": "Sign out wenna",
    "ta-Latn": "Sign out seiyavum"
  },
  "Settings": {
    "si": "සෙටින්ග්ස්",
    "ta": "செட்டிங்ஸ்",
    "si-Latn": "Settings",
    "ta-Latn": "Settings"
  },
  "Account": {
    "si": "එකවුන්ට් එක",
    "ta": "அக்கவுண்ட்",
    "si-Latn": "Account eka",
    "ta-Latn": "Account"
  },
  "Using guest mode.": {
    "si": "දැනට ලොග් නොවී තමයි පාවිච්චි කරන්නේ.",
    "ta": "கெஸ்ட் மோடில் இருக்கிறீர்கள்.",
    "si-Latn": "Danata log nowee thamai pawichchi karanne.",
    "ta-Latn": "Danata guest mode-il irukireergal."
  },
  "Signed in as {name}": {
    "si": "{name} විදිහට සයින් ඉන් වෙලා ඉන්නේ",
    "ta": "{name} ஆக சைன்-இன் செய்துள்ளீர்கள்",
    "si-Latn": "{name} widihata sign in wela inne",
    "ta-Latn": "{name} aaga sign-in seithulleergal"
  },
  "Change sign-in option": {
    "si": "ලොග් වෙන විදිහ වෙනස් කරන්න",
    "ta": "சைன்-இன் ஆப்ஷனை மாற்றவும்",
    "si-Latn": "Log wena widiha wenas karanna",
    "ta-Latn": "Sign-in option-ai maatravum"
  },
  "Language": {
    "si": "භාෂාව",
    "ta": "மொழி",
    "si-Latn": "Bhashawa",
    "ta-Latn": "Mozhi"
  },
  "Choose the default chat language.": {
    "si": "චැට් කරන්න ඕනෙ ප්‍රධාන භාෂාව තෝරන්න.",
    "ta": "சாட் செய்ய வேண்டிய டிஃபால்ட் மொழியைத் தேர்ந்தெடுக்கவும்.",
    "si-Latn": "Chat karanna one pradhana bhashawa thoranna.",
    "ta-Latn": "Chat seiya vendiya default mozhiyai thernaedukkavum."
  },
  "English": {
    "si": "ඉංග්‍රීසි (English)",
    "ta": "ஆங்கிலம் (English)",
    "si-Latn": "English",
    "ta-Latn": "English"
  },
  "Sinhala": {
    "si": "සිංහල",
    "ta": "温加ளம்",
    "si-Latn": "Sinhala",
    "ta-Latn": "Singhalame"
  },
  "Tamil": {
    "si": "දෙමළ",
    "ta": "தமிழ்",
    "si-Latn": "Demala",
    "ta-Latn": "Thamizh"
  },
  "Voice": {
    "si": "වොයිස් එක",
    "ta": "வாய்ஸ்",
    "si-Latn": "Voice eka",
    "ta-Latn": "Voice"
  },
  "Pick a simple voice profile for Gemini Live.": {
    "si": "Gemini Live එකට කැමති වොයිස් එකක් තෝරගන්න.",
    "ta": "ஜெமினி லைவ்விற்கு பொருத்தமான வாய்ஸ் புரொஃபைலைத் தேர்ந்தெடுக்கவும்.",
    "si-Latn": "Gemini Live ekata kamathi voice ekak thoraganna.",
    "ta-Latn": "Gemini Live-ukku poruththamana voice profile-ai thernaedukkavum."
  },
  "Female": {
    "si": "කාන්තා (Female)",
    "ta": "பெண் குரல்",
    "si-Latn": "Kanthaa (Female)",
    "ta-Latn": "Pen kural"
  },
  "Male": {
    "si": "පිරිමි (Male)",
    "ta": "ஆண் குரல்",
    "si-Latn": "Pirimi (Male)",
    "ta-Latn": "Aan kural"
  },
  "Kade AI": {
    "si": "කඩේ AI",
    "ta": "கடே AI",
    "si-Latn": "Kade AI",
    "ta-Latn": "Kade AI"
  },
  "New chat": {
    "si": "අලුත් චැට් එකක්",
    "ta": "புதிய சாட்",
    "si-Latn": "Aluth chat ekak",
    "ta-Latn": "Puthiya chat"
  },
  "Trending today": {
    "si": "අද වැඩියෙන්ම බලපු ඒවා",
    "ta": "இன்று ட்ரெண்டிங்கில் உள்ளவை",
    "si-Latn": "Ada wadiyenma balapu ewa",
    "ta-Latn": "Indru trending-il ullavai"
  },
  "Surprise me": {
    "si": "මොනවා හරි අලුත් දෙයක් පෙන්නන්න",
    "ta": "சர்ப்ரைஸ் பண்ணுங்க",
    "si-Latn": "Monawa hari aluth deyak pennanna",
    "ta-Latn": "Surprise pannunga"
  },
  "Apology saver": {
    "si": "තරහ වෙලා නම් ශේප් කරගන්න ගිෆ්ට්ස්",
    "ta": "மன்னிப்பு கேட்க சிறந்த கிஃப்ட்டுகள்",
    "si-Latn": "Taraha wela nam shape karaganna gifts",
    "ta-Latn": "Mannippu ketka sirantha gift-ugal"
  },
  "Under Rs. 5,000": {
    "si": "රුපියල් 5,000ට අඩු",
    "ta": "ரூ. 5,000க்கு கீழ்",
    "si-Latn": "Rupiyal 5,000ta adu",
    "ta-Latn": "Roobai 5,000ku keezh"
  },
  "Today": {
    "si": "අද",
    "ta": "இன்று",
    "si-Latn": "Ada",
    "ta-Latn": "Indru"
  },
  "Yesterday": {
    "si": "ඊයේ",
    "ta": "நேற்று",
    "si-Latn": "Eye",
    "ta-Latn": "Naetru"
  },
  "Your saved chats will appear here.": {
    "si": "ඔයා සේව් කරගත්තු චැට් මෙතන බලාගන්න පුළුවන්.",
    "ta": "நீங்கள் சேமித்த சாட்டுகள் இங்கே தோன்றும்.",
    "si-Latn": "Oya saved kargaththu chat methana balaganna puluwan.",
    "ta-Latn": "Neengal saemiththa chat-ugal inge thonrum."
  },
  "Chat actions": {
    "si": "චැට් එකේ වෙනස්කම්",
    "ta": "சாட் ஆப்ஷன்கள்",
    "si-Latn": "Chat eke wenaskam",
    "ta-Latn": "Chat option-gal"
  },
  "Pin": {
    "si": "පින් කරන්න",
    "ta": "பின் பண்ணுங்க",
    "si-Latn": "Pin karanna",
    "ta-Latn": "Pin pannunga"
  },
  "Unpin": {
    "si": "අන්පින් කරන්න",
    "ta": "அன்பின் பண்ணுங்க",
    "si-Latn": "Unpin karanna",
    "ta-Latn": "Unpin pannunga"
  },
  "Rename": {
    "si": "නම වෙනස් කරන්න",
    "ta": "பெயரை மாற்றவும்",
    "si-Latn": "Nama wenas karanna",
    "ta-Latn": "Peyarai maatravum"
  },
  "Delete": {
    "si": "ඩිලීට් කරන්න",
    "ta": "டெலீட் பண்ணுங்க",
    "si-Latn": "Delete karanna",
    "ta-Latn": "Delete pannunga"
  },
  "Temporary chat": {
    "si": "තාවකාලික චැට් එකක්",
    "ta": "தற்காலிக சாட்",
    "si-Latn": "Thawakalika chat ekak",
    "ta-Latn": "Tharkaalika chat"
  },
  "Kapruka shopping desk": {
    "si": "Kapruka ශොපින් ඩෙස්ක් එක",
    "ta": "கப்ரூக Shopping Desk",
    "si-Latn": "Kapruka shopping desk eka",
    "ta-Latn": "Kapruka shopping desk"
  },
  "MCP live": {
    "si": "MCP ලයිව්",
    "ta": "MCP லைவ்",
    "si-Latn": "MCP live",
    "ta-Latn": "MCP live"
  },
  "Open sidebar": {
    "si": "සයිඩ් බාර් එක ඇරගන්න",
    "ta": "சைட்பாரை திறக்கவும்",
    "si-Latn": "Sidebar eka araganna",
    "ta-Latn": "Sidebar-ai thirakkavum"
  },
  "Voice mode": {
    "si": "වොයිස් මෝඩ් එක",
    "ta": "வாய்ஸ் மோட்",
    "si-Latn": "Voice mode eka",
    "ta-Latn": "Voice mode"
  },
  "Light mode": {
    "si": "ලයිට් මෝඩ්",
    "ta": "லைட் மோட்",
    "si-Latn": "Light mode",
    "ta-Latn": "Light mode"
  },
  "Dark mode": {
    "si": "ඩාර්ක් මෝඩ්",
    "ta": "டார்க் மோட்",
    "si-Latn": "Dark mode",
    "ta-Latn": "Dark mode"
  },
  "Product": {
    "si": "බඩු භාණ්ඩ",
    "ta": "தயாரிப்பு",
    "si-Latn": "Badu bhanda",
    "ta-Latn": "Thayarippu"
  },
  "Cart": {
    "si": "කාර්ට් එක",
    "ta": "கார்ட்",
    "si-Latn": "Cart eka",
    "ta-Latn": "Cart"
  },
  "Hey, I'm Kade. Think of me as your Kapruka shopping friend.": {
    "si": "ෂා මරු! මම කඩේ AI, ඔයාගේ Kapruka ශොපින් යාළුවා කියලා හිතන්නකෝ.",
    "ta": "ஹே, நான் தான் கடே. உங்கள் கப்ரூக ஷாப்பிங் பிரெண்ட்னு நினைச்சுக்கோங்க.",
    "si-Latn": "Sha maru! Mama Kade AI, oyage Kapruka shopping yaaluwa kiyala hithannako.",
    "ta-Latn": "Hey, naan thaan Kade. Ungal Kapruka shopping friend-nu nenachukkonga."
  },
  "We can browse, rescue a last-minute gift, fix an apology situation, or just look around. What are we finding today?": {
    "si": "අපිට බඩු බලන්න, අන්තිම මොහොතේ ගිෆ්ට් එකක් හොයාගන්න, නැත්නම් තරහ වුණු කෙනෙක්ව ශේප් කරගන්න තෑග්ගක් බලන්න පුළුවන්. අද මොන වගේ දෙයක්ද හොයන්නේ?",
    "ta": "நாம பொருட்களை பிரவுஸ் பண்ணலாம், லாஸ்ட் மினிட் கிஃப்ட் தேடலாம், அல்லது யார்கிட்டயாவது ஸாரி கேக்க கிஃப்ட் பாக்கலாம். இன்னைக்கு என்ன தேடப்போறோம்?",
    "si-Latn": "Apita badu balanna, anthima mohothe gift ekak hoyaganna, nathnam taraha wunu kenekwa shape karaganna thaggak balanna puluwan. Ada mona wage deyakda hoyanne?",
    "ta-Latn": "Naama porutkalai browse pannalaam, last minute gift thedalaam, illana yaarkittayavathu sorry ketka gift paakkalaam. Innaiku enna thedapporom?"
  },
  "What are we finding today?": {
    "si": "අද මොනවද අපි හොයන්නේ?",
    "ta": "இன்னைக்கு என்ன தேடப்போறோம்?",
    "si-Latn": "Ada monawada api hoyanne?",
    "ta-Latn": "Innaiku enna thedapporom?"
  },
  "Birthday cake under LKR 8000 to Colombo": {
    "si": "කොළඹට රුපියල් 8000ට අඩු බර්ත්ඩේ කේක් එකක්",
    "ta": "கொழும்புக்கு LKR 8000க்கு கீழ் பர்த்டே கேக்",
    "si-Latn": "Colombota Rs 8000ta adu birthday cake ekak",
    "ta-Latn": "Colombo-ku LKR 8000ku keezh birthday cake"
  },
  "Premium chocolate hamper for a friend": {
    "si": "යාළුවෙක්ට දෙන්න සුපිරි චොකලට් හැම්පර් එකක්",
    "ta": "பிரெண்டுக்கு கொடுக்க பிரீமியம் சாக்லேட் ஹாம்பர்",
    "si-Latn": "Yaluwekta denna supiri chocolate hamper ekak",
    "ta-Latn": "Friend-ukku kodukka premium chocolate hamper"
  },
  "Machan surprise gift karanna, budget 5000": {
    "si": "මචං සර්ප්‍රයිස් ගිෆ්ට් එකක් දෙන්න, බජට් එක 5000යි",
    "ta": "மச்சான் சர்ப்ரைஸ் கிஃப்ட் பண்ணனும், பட்ஜெட் 5000",
    "si-Latn": "Machan surprise gift karanna, budget 5000යි",
    "ta-Latn": "Machan surprise gift pannanum, budget 5000"
  },
  "Ask Kade AI...": {
    "si": "කඩේ AI එකෙන් අහන්න...",
    "ta": "கடே AI இடம் கேளுங்கள்...",
    "si-Latn": "Kade AI eken ahanna...",
    "ta-Latn": "Kade AI idam kelungal..."
  },
  "Thinking...": {
    "si": "Kapruka එකේ බලන ගමන්...",
    "ta": "கப்ரூகவில் தேடப்படுகிறது...",
    "si-Latn": "Kapruka eke balana gaman...",
    "ta-Latn": "Kapruka-vil thedappadugirathu..."
  },
  "Sure, let me check Kapruka for that.": {
    "si": "අනිවාර්යයෙන්, මම ඒක Kapruka එකේ චෙක් කරලා බලන්නම්.",
    "ta": "கண்டிப்பா, நான் கப்ரூகவில செக் பண்ணி பாக்குறேன்.",
    "si-Latn": "Aniwarayen, mama eka Kapruka eke check karala balannam.",
    "ta-Latn": "Kandippaa, naan Kapruka-vila check panni paakkuraen."
  },
  "Here are the closest options. Say a number, say a name, or tap one.": {
    "si": "මෙන්න ගැලපෙනම ටිකක් හොයාගත්තා. නම්බර් එකක් හරි, නමක් හරි කියන්න, නැත්නම් එකක් ටැප් කරන්න.",
    "ta": "இதோ நெருக்கமான ஆப்ஷன்கள் இருக்கு. நம்பர் அல்லது பேரை சொல்லுங்க, இல்லனா ஒன்னை டேப் பண்ணுங்க.",
    "si-Latn": "Menna galapenama tikak hoyagatta. Number ekak hari, namak hari kiyanna, nathnam ekak tap karanna.",
    "ta-Latn": "Idho nerukkamaana options iruku. Number illana paerai sollunga, illana onnai tap pannunga."
  },
  "Here are more options I found. Say a number, say a name, or tap one.": {
    "si": "මෙන්න තවත් බඩු වගයක් හම්බුණා. නම්බර් එකක් හරි නමක් හරි කියන්න, නැත්නම් ටැප් කරන්න.",
    "ta": "நான் கண்டுபிடிச்ச இன்னும் சில ஆப்ஷன்கள் இதோ. நம்பர் அல்லது பேரை சொல்லுங்க, இல்லனா டேப் பண்ணுங்க.",
    "si-Latn": "Menna thawat badu wagayak hambuna. Number ekak hari namak hari kiyanna, nathnam tap karanna.",
    "ta-Latn": "Naan kandupidichcha innum sila options idho. Number illana paerai sollunga, illana tap pannunga."
  },
  "I could not find new options beyond the ones already shown. Want me to try a different type?": {
    "si": "දැනට පේන්න තියෙන ඒවා ඇරෙන්න වෙන අලුත් ඒවා හම්බුණේ නැහැ. වෙන ජාතියක එකක් බලමුද?",
    "ta": "ஏற்கனவே காட்டியதை தவிர புதிய ஆப்ஷன்கள் எதுவும் கிடைக்கவில்லை. வேறு டைப்பில் தேடவா?",
    "si-Latn": "Danata penna thiyena ewa arenna wena aluth ewa hambune naha. Wena jathiyaka ekak balamuda?",
    "ta-Latn": "Aerkanave kaatiyathai thavira puthiya options ethuvum kidaikkavillai. Vera type-il thedavaa?"
  },
  "I could not find that exact one. Want to try a nearby option?": {
    "si": "ඔයා කියපු එකම නෙමෙයි හම්බුණේ, ඒකට ළඟින්ම යන වෙන එකක් බලමුද?",
    "ta": "நீங்கள் கேட்ட அதே பொருள் கிடைக்கவில்லை. அதற்கு நெருக்கமான ஒன்றை ட்ரை பண்ணலாமா?",
    "si-Latn": "Oya kiyapu ekama nemei hambune, ekata langinma yana wena ekak balamuda?",
    "ta-Latn": "Neengal ketta athe porul kidaikkavillai. Atharku nerukkamaana onrai try pannalaama?"
  },
  "{count} results - tap to explore": {
    "si": "බඩු {count} ක් තියෙනවා - බලන්න ටැප් කරන්න",
    "ta": "{count} முடிவுகள் - விபரங்களை பார்க்க டேப் பண்ணுங்க",
    "si-Latn": "Badu {count} k thiyenawa - balanna tap karanna",
    "ta-Latn": "{count} mudivugal - viberangalai paakka tap pannunge"
  },
  "Show more options": {
    "si": "තව දේවල් පෙන්නන්න",
    "ta": "மேலும் ஆப்ஷன்களை காட்டு",
    "si-Latn": "Thawa dewal pennanna",
    "ta-Latn": "Maelum options-ai kaattu"
  },
  "Check delivery cost": {
    "si": "ඩිලිවරි ගාස්තුව බලන්න",
    "ta": "டெலிவரி கட்டணத்தை சரிபார்க்கவும்",
    "si-Latn": "Delivery gaasthuwa balanna",
    "ta-Latn": "Delivery kattanathai sari paarkavum"
  },
  "Add selected to cart": {
    "si": "තෝරගත්තු එක කාර්ට් එකට දාන්න",
    "ta": "தேர்ந்தெடுத்ததை கார்டில் சேர்க்கவும்",
    "si-Latn": "Thoragaththu eka cart ekata danna",
    "ta-Latn": "Thernaeduththathai cart-il serkkavum"
  },
  "Add all to cart": {
    "si": "ඔක්කොම ටික කාර්ට් එකට දාන්න",
    "ta": "எல்லாவற்றையும் கார்டில் சேர்க்கவும்",
    "si-Latn": "Okkoma tika cart ekata danna",
    "ta-Latn": "Ellavattrayum cart-il serkkavum"
  },
  "Show chocolate cakes": {
    "si": "චොකලට් කේක් පෙන්නන්න",
    "ta": "சாக்லேட் கேக்குகளை காட்டு",
    "si-Latn": "Chocolate cakes pennanna",
    "ta-Latn": "Chocolate cake-galai kaattu"
  },
  "Try birthday cakes": {
    "si": "බර්ත්ඩේ කේක් බලන්න",
    "ta": "பர்த்டே கேக்குகளை ட்ரை பண்ணுங்க",
    "si-Latn": "Birthday cakes balanna",
    "ta-Latn": "Birthday cake-galai try pannunga"
  },
  "Try gift hampers": {
    "si": "ගිෆ්ට් හැම්පර්ස් බලන්න",
    "ta": "கிஃப்ட் ஹாம்பர்களை ட்ரை பண்ணுங்க",
    "si-Latn": "Gift hampers balanna",
    "ta-Latn": "Gift hamper-galai try pannunga"
  },
  "Browse cakes": {
    "si": "කේක් වර්ග බලන්න",
    "ta": "கேக்குகளை பிரவுஸ் பண்ணுங்க",
    "si-Latn": "Cake warga balanna",
    "ta-Latn": "Cake-galai browse pannunga"
  },
  "Chocolate gifts": {
    "si": "චොකලට් තෑගි බෝග",
    "ta": "சாக்லேட் கிஃப்ட்டுகள்",
    "si-Latn": "Chocolate thagi boga",
    "ta-Latn": "Chocolate gift-ugal"
  },
  "Biscuit hampers": {
    "si": "බිස්කට් හැම්පර්ස්",
    "ta": "பிஸ்கட் ஹாம்பர்கள்",
    "si-Latn": "Biscuit hampers balanna",
    "ta-Latn": "Biscuit hamper-gal"
  },
  "Track my order": {
    "si": "මගේ ඕඩර් එක කොහේද තියෙන්නේ කියලා බලන්න",
    "ta": "என் ஆர்டரை டிராக் செய்யணும்",
    "si-Latn": "Mage order eka koheda thiyenne kiyala balanna",
    "ta-Latn": "En order-ai track seiyanum"
  },
  "Something went wrong connecting to the server. Please try again!": {
    "si": "සර්වර් එකට කනෙක්ට් වෙද්දි පොඩි අවුලක් වුණා. පොඩ්ඩක් ආයෙත් ට්‍රයි කරන්න!",
    "ta": "சர்வருடன் இணைப்பதில் ஏதோ பிரச்சினை. தயவுசெய்து மீண்டும் முயலவும்!",
    "si-Latn": "Server ekata connect weddi podi awulak una. Poddak ayeth try karanna!",
    "ta-Latn": "Server-udan iṇaipathil aetho prachinai. Thayavuseithu meendum muyalavum!"
  },
  "Connecting to Kade AI...": {
    "si": "කඩේ AI එකට කනෙක්ට් වෙනවා...",
    "ta": "கடே AI உடன் இணைகிறது...",
    "si-Latn": "Kade AI ekata connect wenawa...",
    "ta-Latn": "Kade AI-udan inaigirathu..."
  },
  "Connecting...": {
    "si": "සම්බන්ධ වෙමින් පවතිනවා...",
    "ta": "இணைகிறது...",
    "si-Latn": "Sambandhawemin pawathinawa...",
    "ta-Latn": "Inaigirathu..."
  },
  "Speaking...": {
    "si": "කියවනවා...",
    "ta": "பேசுகிறது...",
    "si-Latn": "Kiyawanawa...",
    "ta-Latn": "Paesugirathu..."
  },
  "Listening...": {
    "si": "අහගෙන ඉන්නවා...",
    "ta": "கேட்கிறது...",
    "si-Latn": "Ahagena innawa...",
    "ta-Latn": "Ketkirathu..."
  },
  "Searching for more options...": {
    "si": "තව දේවල් හොයන ගමන්...",
    "ta": "மேலும் ஆப்ஷன்கள் தேடப்படுகிறது...",
    "si-Latn": "Thawa dewal hoyana gaman...",
    "ta-Latn": "Maelum options thedappadugirathu..."
  },
  "Selecting that product...": {
    "si": "ඒ ප්‍රොඩක්ට් එක තෝරගන්නවා...",
    "ta": "அந்த தயாரிப்பை தேர்ந்தெடுக்கிறேன்...",
    "si-Latn": "E product eka thoragannawa...",
    "ta-Latn": "Antha thayarippai thernaedukkiraen..."
  },
  "Let me search Kapruka for that.": {
    "si": "මම ඒක Kapruka එකේ සර්ච් කරලා බලන්නම්කෝ.",
    "ta": "இருங்க, நான் கப்ரூகவில அதை தேடி பாக்குறேன்.",
    "si-Latn": "Mama eka Kapruka eke search karala balannamko.",
    "ta-Latn": "Irunga, naan Kapruka-vila athai thedi paakkuraen."
  },
  "Found {count} good options for you.": {
    "si": "ඔයාට ගැලපෙනම සුපිරි බඩු {count} ක් හම්බුණා.",
    "ta": "உங்களுக்காக {count} நல்ல ஆப்ஷன்கள் கிடைச்சிருக்கு.",
    "si-Latn": "Oyata galapenama supiri badu {count} k hambuna.",
    "ta-Latn": "Ungalukaga {count} nalla options kidaichiruku."
  },
  "Checking delivery availability.": {
    "si": "ඩිලිවරි කරන්න පුළුවන්ද කියලා බලනවා.",
    "ta": "டெலிவரி செய்ய முடியுமா என்று சரிபார்க்கிறேன்.",
    "si-Latn": "Delivery karanna puluwand kiyala balanawa.",
    "ta-Latn": "Delivery seiya mudiyuma endru sari paarkiraen."
  },
  "Setting up your order now.": {
    "si": "ඕඩර් එක ලෑස්ති කරන ගමන්.",
    "ta": "உங்கள் ஆர்டரை இப்போது தயார் செய்கிறேன்.",
    "si-Latn": "Order eka lasthi karana gaman.",
    "ta-Latn": "Ungal order-ai ippodhu thayar seigiraen."
  },
  "Looking up your order status.": {
    "si": "ඕඩර් එකේ විස්තර බලනවා.",
    "ta": "உங்கள் ஆர்டர் நிலையை சரிபார்க்கிறேன்.",
    "si-Latn": "Order eke wisthara balanawa.",
    "ta-Latn": "Ungal order nilaiyai sari paarkiraen."
  },
  "The order did not go through on my side. Want me to check the details and try again?": {
    "si": "මගේ පැත්තෙන් ඕඩර් එක හරියට වුණේ නැහැ. විස්තර ටික ආයෙත් බලලා ට්‍රයි කරමුද?",
    "ta": "என் பக்கத்தில் ஆர்டர் கம்ப்ளீட் ஆகவில்லை. விபரங்களை சரிபார்த்துவிட்டு மீண்டும் முயலவா?",
    "si-Latn": "Mage patthen order eka hariyata wune naha. Wisthara tika ayeth balala try karamuda?",
    "ta-Latn": "En pakkaththil order complete aagavillai. Viberangalai sari paarthuvittu meendum muyalavaa?"
  },
  "Payment link ready": {
    "si": "පේමන්ට් ලින්ක් එක ලෑස්තියි",
    "ta": "பேமெண்ட் லிங்க் ரெடி",
    "si-Latn": "Payment link eka lasthiyi",
    "ta-Latn": "Payment link ready"
  },
  "Order needs attention": {
    "si": "ඕඩර් එකේ පොඩි අවුලක් තියෙනවා",
    "ta": "ஆர்டரில் கவனம் தேவை",
    "si-Latn": "Order eke podi awulak thiyenawa",
    "ta-Latn": "Order-il gavanam thevai"
  },
  "Collecting order details...": {
    "si": "ඕඩර් එකේ විස්තර එකතු කරගන්නවා...",
    "ta": "ஆர்டர் விபரங்களை சேகரிக்கிறேன்...",
    "si-Latn": "Order eke wisthara ekathu karagannawa...",
    "ta-Latn": "Order viberangalai segarikiraen..."
  },
  "Correcting detail...": {
    "si": "විස්තර වෙනස් කරන ගමන්...",
    "ta": "விபரங்களை திருத்துகிறேன்...",
    "si-Latn": "Wisthara wenas karana gaman...",
    "ta-Latn": "Viberangalai thiruthugiraen..."
  },
  "Review on the right": {
    "si": "දකුණු පැත්තෙන් විස්තර බලන්න",
    "ta": "வலது பக்கத்தில் சரிபார்க்கவும்",
    "si-Latn": "Dakunu patthen wisthara balanna",
    "ta-Latn": "Valathu pakkaththil sari paarkavum"
  },
  "Waiting for city...": {
    "si": "සිටි එක දානකන් බලන් ඉන්නවා...",
    "ta": "சிட்டி பெயருக்காக காத்திருக்கிறேன்...",
    "si-Latn": "City eka danakan balan innawa...",
    "ta-Latn": "City peyarukaga kaathirukiraen..."
  },
  "Checking delivery...": {
    "si": "ඩිලිවරි බලන ගමන්...",
    "ta": "டெலிவரியை சரிபார்க்கிறேன்...",
    "si-Latn": "Delivery balana gaman...",
    "ta-Latn": "Delivery-ai sari paarkiraen..."
  },
  "Placing order...": {
    "si": "ඕඩර් එක දාන ගමන්...",
    "ta": "ஆர்டர் செய்யப்படுகிறது...",
    "si-Latn": "Order eka dana gaman...",
    "ta-Latn": "Order seiyappadugirathu..."
  },
  "Checkout needs attention": {
    "si": "චෙක්අවුට් එකේ පොඩි වෙනසක් වෙන්න ඕනේ",
    "ta": "செக்அவுட்டில் கவனம் தேவை",
    "si-Latn": "Checkout eke podi wenasak wenna one",
    "ta-Latn": "Checkout-il gavanam thevai"
  },
  "Show products": {
    "si": "බඩු ටික පෙන්නන්න",
    "ta": "தயாரிப்புகளை காட்டு",
    "si-Latn": "Badu tika pennanna",
    "ta-Latn": "Thayarippugalai kaattu"
  },
  "Test sound": {
    "si": "සද්දේ චෙක් කරන්න",
    "ta": "சவுண்ட் டெஸ்ட்",
    "si-Latn": "Sadde check karanna",
    "ta-Latn": "Sound test"
  },
  "Mute": {
    "si": "මියුට් කරන්න",
    "ta": "ம்யூட்",
    "si-Latn": "Mute karanna",
    "ta-Latn": "Mute"
  },
  "End call": {
    "si": "කෝල් එක කට් කරන්න",
    "ta": "காலை முடிக்கவும்",
    "si-Latn": "Call eka cut karanna",
    "ta-Latn": "Call-ai mudikkavum"
  },
  "Select Gemini Live voice": {
    "si": "Gemini Live වොයිස් එක තෝරන්න",
    "ta": "ஜெமினி லைவ் வாய்ஸை தேர்ந்தெடுக்கவும்",
    "si-Latn": "Gemini Live voice eka thoranna",
    "ta-Latn": "Gemini Live voice-ai thernaedukkavum"
  },
  "What's the recipient's full name?": {
    "si": "තෑග්ග ලැබෙන කෙනාගේ සම්පූර්ණ නම මොකක්ද?",
    "ta": "பொருளைப் பெறுபவரின் முழுப் பெயர் என்ன?",
    "si-Latn": "Thagga labena kenage sampurna nama mokakda?",
    "ta-Latn": "Porulai perubavarin muzhu peyar enna?"
  },
  "What's their contact number? Kapruka needs it to coordinate delivery.": {
    "si": "එයාගේ ෆෝන් නම්බර් එක මොකක්ද? Kapruka එකෙන් ඩිලිවරි එකට කතා කරන්න ඒක ඕනේ වෙනවා.",
    "ta": "அவங்களோட போன் நம்பர் என்ன? டெலிவரியை கோஆர்டினேட் பண்ண கப்ரூகவிற்கு அது தேவைப்படும்.",
    "si-Latn": "Eyage phone number eka mokakda? Kapruka eken delivery ekata katha karanna eka one wenawa.",
    "ta-Latn": "Avangada phone number enna? Delivery-ai coordinate panna Kapruka-vukku adhu thevaippadum."
  },
  "Can you send a valid contact number? Something like 0771234567 or +94771234567.": {
    "si": "හරි ෆෝන් නම්බර් එකක් එවන්න පුළුවන්ද? 0771234567 හෝ +94771234567 වගේ එකක්.",
    "ta": "சரியான போன் நம்பரை அனுப்ப முடியுமா? 0771234567 அல்லது +94771234567 போல இருக்கணும்.",
    "si-Latn": "Hari phone number ekak ewanna puluwanda? 0771234567 ho +94771234567 wage ekak.",
    "ta-Latn": "Sariyana phone number-ai anuppa mudiyuma? 0771234567 allathu +94771234567 pola irukkanum."
  },
  "What's the full delivery address?": {
    "si": "ඩිලිවරි කරන්න ඕනෙ සම්පූර්ණ ඇඩ්‍රස් එක කියන්න.",
    "ta": "முழுமையான டெலிவரி அட்ரஸ் என்ன?",
    "si-Latn": "Delivery karanna one sampurna address eka kiyanna.",
    "ta-Latn": "Muzhumaiyana delivery address enna?"
  },
  "Which delivery city should I use?": {
    "si": "ඩිලිවරි කරන්න ඕනෙ ප්‍රධාන නගරය (City) මොකක්ද?",
    "ta": "டெலிவரி செய்ய வேண்டிய சிட்டி எது?",
    "si-Latn": "Delivery karanna one pradhana nagaraya (City) mokakda?",
    "ta-Latn": "Delivery seiya vendiya city edhu?"
  },
  "Colombo needs the delivery zone. Is it Colombo 01, Colombo 02, Colombo 03, or another Colombo number?": {
    "si": "කොළඹට නම් ඩිලිවරි කලාපය (Zone) ඕනේ. කොළඹ 01, 02, 03 ද නැත්නම් වෙනත් නම්බර් එකක්ද?",
    "ta": "கொழும்பு என்றால் டெலிவரி ஸோன் தேவை. கொழும்பு 01, கொழும்பு 02, கொழும்பு 03 அல்லது வேறு கொழும்பு நம்பரா?",
    "si-Latn": "Colombota nam delivery zone eka one. Colombo 01, 02, 03 da nathnam wenath number ekakda?",
    "ta-Latn": "Colombo endral delivery zone thevai. Colombo 01, Colombo 02, Colombo 03 allathu vera Colombo number-aa?"
  },
  "When should it be delivered?": {
    "si": "ඩිලිවරි කරන්න ඕනේ කවදාටද?",
    "ta": "எப்போது டெலிவரி செய்ய வேண்டும்?",
    "si-Latn": "Delivery karanna one kawadateda?",
    "ta-Latn": "Eppodhu delivery seiya vaendum?"
  },
  "What's your name for the gift card?": {
    "si": "ගිෆ්ට් කාඩ් එකට දාන්න ඕනෙ ඔයාගේ නම මොකක්ද?",
    "ta": "கிஃப்ட் கார்டில் போட உங்கள் பெயர் என்ன?",
    "si-Latn": "Gift card ekata danna one oyage nama mokakda?",
    "ta-Latn": "Gift card-il poda ungal peyar enna?"
  },
  "Should I show your name or keep it anonymous?": {
    "si": "ඔයාගේ නම දාන්නද, නැත්නම් රහසිගතව (Anonymous) යවන්නද?",
    "ta": "உங்கள் பெயரை காட்டவா அல்லது அநாமதேயமாக (Anonymous) அனுப்பவா?",
    "si-Latn": "Oyage nama dannada, nathnam rahasigathawa (Anonymous) yawannada?",
    "ta-Latn": "Ungal peyarai kaattavaa allathu anonymous-aa anuppavaa?"
  },
  "Want to add a custom message? You can say skip if not.": {
    "si": "කාඩ් එකට විශේෂ මැසේජ් එකක් ඇඩ් කරන්න ඕනෙද? නැත්නම් 'skip' කියන්න.",
    "ta": "கார்டில் மெசேஜ் எதுவும் சேர்க்க வேண்டுமா? இல்லைனா ஸ்கிப் (skip) பண்ணலாம்.",
    "si-Latn": "Card ekata vishesha message ekak add karanna oneda? Nathnam 'skip' kiyanna.",
    "ta-Latn": "Card-il message edhuvum serkka venduma? Illaina skip pannalaam."
  },
  "All set. Please check the details on the right - are they correct?": {
    "si": "ඔක්කොම හරි. දකුණු පැත්තේ තියෙන විස්තර ටික බලන්න, ඔක්කොම හරිද?",
    "ta": "எல்லாம் ரெடி. வலது பக்கத்தில் உள்ள விபரங்கள் சரியா என்று பார்க்கவும்.",
    "si-Latn": "Okkoma hari. Dakunu patthe thiyena wisthara tika balanna, okkoma harida?",
    "ta-Latn": "Ellaam ready. Valathu pakkaththil ulla viberangal sariyaa endru paarkavum."
  },
  "Okay, let me confirm everything:": {
    "si": "එල, මම විස්තර ටික ආයෙත් කියන්නම්:",
    "ta": "ஓகே, எல்லாத்தையும் கன்பார்ம் பண்ணிடுறேன்:",
    "si-Latn": "Ela, mama wisthara tika ayeth kiyannam:",
    "ta-Latn": "Okay, ellathayum confirm panniduraen:"
  },
  "Shall I create the order?": {
    "si": "ඕඩර් එක දාන්නද එහෙනම්?",
    "ta": "ஆர்டரை கிரியேட் பண்ணட்டுமா?",
    "si-Latn": "Order eka dannada ehenam?",
    "ta-Latn": "Order-ai create pannattuma?"
  },
  "Yes, create order": {
    "si": "ඔව්, ඕඩර් එක දාන්න",
    "ta": "ஆம், ஆர்டர் செய்யவும்",
    "si-Latn": "Ow, order eka danna",
    "ta-Latn": "Aam, order seiyavum"
  },
  "Edit details": {
    "si": "විස්තර වෙනස් කරන්න",
    "ta": "விபரங்களை மாற்று",
    "si-Latn": "Wisthara wenas karanna",
    "ta-Latn": "Viberangalai maatru"
  },
  "Recipient name": {
    "si": "ලැබෙන්නාගේ නම",
    "ta": "பெறுபவர் பெயர்",
    "si-Latn": "Labennage nama",
    "ta-Latn": "Perubavar peyar"
  },
  "Phone": {
    "si": "ෆෝන් නම්බර් එක",
    "ta": "போன்",
    "si-Latn": "Phone number eka",
    "ta-Latn": "Phone"
  },
  "Address": {
    "si": "ඇඩ්‍රස් එක",
    "ta": "அட்ரஸ்",
    "si-Latn": "Address eka",
    "ta-Latn": "Address"
  },
  "City": {
    "si": "නගරය (City)",
    "ta": "சிட்டி",
    "si-Latn": "Nagaraya (City)",
    "ta-Latn": "City"
  },
  "Date": {
    "si": "දිනය",
    "ta": "தேதி",
    "si-Latn": "Dinaya",
    "ta-Latn": "Thaethi"
  },
  "Message": {
    "si": "මැසේජ් එක",
    "ta": "மெசேஜ்",
    "si-Latn": "Message eka",
    "ta-Latn": "Message"
  },
  "A few details are still missing. Let's fill those before placing the order.": {
    "si": "තව විස්තර කිහිපයක් අඩුවෙන් තියෙන්නේ. ඕඩර් එක දාන්න කලින් ඒවා පුරවමු.",
    "ta": "இன்னும் சில விபரங்கள் விடுபட்டிருக்கு. ஆர்டர் செய்வதற்கு முன் அதை நிரப்பிடுவோம்.",
    "si-Latn": "Thawa wisthara kihipayak aduwen thiyenne. Order eka danna kalin ewa purawamu.",
    "ta-Latn": "Innum sila viberangal vidupattiruku. Order seivadharku mun adhai nirappiduvom."
  },
  "Okay, I won't place it yet. Tell me what you want to change.": {
    "si": "හරි, මම දැනට ඕඩර් එක දාන්නේ නැහැ. මොනවද වෙනස් වෙන්න ඕනේ කියලා කියන්න.",
    "ta": "ஓகே, நான் இன்னும் ஆர்டர் செய்யவில்லை. எதை மாற்ற வேண்டும் என்று சொல்லுங்கள்.",
    "si-Latn": "Hari, mama danata order eka danne naha. Monawada wenas wenna one kiyala kiyanna.",
    "ta-Latn": "Okay, naan innum order seiyavillai. Edhai maatra vaendum endru sollungal."
  },
  "The cart is empty.": {
    "si": "කාර්ට් එක හිස්.",
    "ta": "கார்ட் காலியாக உள்ளது.",
    "si-Latn": "Cart eka his.",
    "ta-Latn": "Cart kaaliyaaga ullathu."
  },
  "One of the items may be out of stock.": {
    "si": "සමහර විට මේ බඩු ඉවර වෙලා වෙන්න ඇති (Out of stock).",
    "ta": "ஏதோ ஒரு பொருள் ஸ்டாக்கில் இல்லாமல் இருக்கலாம்.",
    "si-Latn": "Samahara wita me badu iwara wela wenna athi (Out of stock).",
    "ta-Latn": "Aetho oru porul stock-il illaamal irukkalaam."
  },
  "There is a delivery city or date issue.": {
    "si": "ඩිලිවරි නගරයේ හෝ දිනයේ මොකක් හරි අවුලක් තියෙනවා.",
    "ta": "டெலிவரி சிட்டி அல்லது தேதியில் ஏதோ பிரச்சினை உள்ளது.",
    "si-Latn": "Delivery nagaraye ho dinaye mokak hari awulak thiyenawa.",
    "ta-Latn": "Delivery city allathu thaethiyil aetho prachinai ullathu."
  },
  "Something went wrong while creating the order.": {
    "si": "ඕඩර් එක හදද්දි මොකක් හරි වැරදීමක් වුණා.",
    "ta": "ஆர்டர் கிரியேட் செய்யும்போது ஏதோ தவறு நடந்துவிட்டது.",
    "si-Latn": "Order eka hadaddi mokak hari waradeemak una.",
    "ta-Latn": "Order create seiyumpodhu aetho thavari nadandhuvittathu."
  },
  "Want me to fix it and try again?": {
    "si": "මම ඒක හදලා ආයෙත් ට්‍රයි කරන්නද?",
    "ta": "நான் அதை சரிசெய்து மீண்டும் முயலவா?",
    "si-Latn": "Mama eka hadala ayeth try karannada?",
    "ta-Latn": "Naan adhai sariseithu meendum muyalavaa?"
  },
  "Yesss! Order created!": {
    "si": "නියමයි! ඕඩර් එක හැදුණා!",
    "ta": "யெஸ்ஸ்ஸ்! ஆர்டர் கிரியேட் ஆகியாச்சு!",
    "si-Latn": "Niyamayi! Order eka haduna!",
    "ta-Latn": "Yesss! Order create aagiyaachu!"
  },
  "Your payment link is ready - prices are locked for 60 minutes so pay soon!": {
    "si": "පේමන්ට් ලින්ක් එක ලෑස්තියි - විනාඩි 60ක් යනකන් විතරයි මේ මිල තියෙන්නේ, ඒ නිසා ඉක්මනට ගෙවන්න!",
    "ta": "உங்கள் பேமெண்ட் லிங்க் ரெடி - 60 நிமிடங்களுக்கு மட்டுமே இந்த விலை மாறாது, எனவே சீக்கிரம் பே பண்ணுங்க!",
    "si-Latn": "Payment link eka lasthiyi - winadi 60k yanakan witarayi me mila thiyenne, e nisa ikmanata gewanna!",
    "ta-Latn": "Ungal payment link ready - 60 nimishangaluku mattume indha vilai maaradhu, enave seekiram pay pannunga!"
  },
  "Delivery on {date} to {city}. You did good!": {
    "si": "{city} ට ඩිලිවරි වෙන්නේ {date} දිනට. වැඩේ නියමෙට කෙරුණා!",
    "ta": "{city} க்கு {date} அன்று டெலிவரி செய்யப்படும். சூப்பரா பண்ணிட்டீங்க!",
    "si-Latn": "{city} ta delivery wenne {date} dinata. Wade niyameta keruna!",
    "ta-Latn": "{city} ku {date} andru delivery seiyappadum. Super-aa panniteenga!"
  },
  "Open payment link": {
    "si": "පේමන්ට් ලින්ක් එක ඇරගන්න",
    "ta": "பேமெண்ட் லிங்கை திறக்கவும்",
    "si-Latn": "Payment link eka araganna",
    "ta-Latn": "Payment link-ai thirakkavum"
  },
  "Open secure payment link": {
    "si": "ආරක්‍ෂිත පේමන්ට් ලින්ක් එක ඇරගන්න",
    "ta": "பாதுகாப்பான பேமெண்ட் லிங்கை திறக்கவும்",
    "si-Latn": "Arakshitha payment link eka araganna",
    "ta-Latn": "Paadhukaappana payment link-ai thirakkavum"
  },
  "Secure checkout is ready. The payment link locks the current cart and delivery details.": {
    "si": "සුරක්ෂිත චෙක්අවුට් එක ලෑස්තියි. පේමන්ට් ලින්ක් එකෙන් දැනට තියෙන බඩු සහ ඩිලිවරි විස්තර ලොක් වෙනවා.",
    "ta": "பாதுகாப்பான செக்அவுட் தயார். இந்த லிங்க் தற்போதைய கார்ட் மற்றும் டெலிவரி விபரங்களை லாக் செய்திடும்.",
    "si-Latn": "Surakshitha checkout eka lasthiyi. Payment link eken danata thiyena badu saha delivery wisthara lock wenawa.",
    "ta-Latn": "Paadhukaappana checkout thayar. Indha link tharpo some card mattrum delivery viberangalai lock seithidum."
  },
  "Create secure Kapruka pay link": {
    "si": "සුරක්ෂිත Kapruka පේ ලින්ක් එකක් හදන්න",
    "ta": "பாதுகாப்பான கப்ரூக Pay லிங்கை உருவாக்கு",
    "si-Latn": "Surakshitha Kapruka pay link ekak hadanna",
    "ta-Latn": "Paadhukaappana Kapruka pay link-ai uruvaaku"
  },
  "Pay within {time}": {
    "si": "{time} ඇතුළත ගෙවන්න",
    "ta": "{time} க்குள் பே பண்ணவும்",
    "si-Latn": "{time} athulatha gewanna",
    "ta-Latn": "{time} kul pay pannavum"
  },
  "Payment link expired": {
    "si": "පේමන්ට් ලින්ක් එක කල් ඉකුත් වී ඇත (Expired)",
    "ta": "பேமெண்ட் லிங்க் எக்ஸ்பயர் ஆகிவிட்டது",
    "si-Latn": "Payment link eka kal ikuth wee atha (Expired)",
    "ta-Latn": "Payment link expire aagivittathu"
  },
  "Share payment link": {
    "si": "පේමන්ට් ලින්ක් එක ශෙයා කරන්න",
    "ta": "பேமெண்ட் லிங்கை ஷேர் செய்யவும்",
    "si-Latn": "Payment link eka share karanna",
    "ta-Latn": "Payment link-ai share seiyavum"
  },
  "Save for reorder": {
    "si": "ආයෙත් ඕඩර් කරන්න සේව් කරගන්න",
    "ta": "மீண்டும் ஆர்டர் செய்ய சேமிக்கவும்",
    "si-Latn": "Ayeth order karanna save karaganna",
    "ta-Latn": "Meendum order seiya saemikkavum"
  },
  "Checkout details are not started yet.": {
    "si": "චෙක්අවුට් විස්තර තවම පටන් ගත්තේ නැහැ.",
    "ta": "செக்அவுட் விபரங்கள் இன்னும் ஆரம்பிக்கப்படவில்லை.",
    "si-Latn": "Checkout wisthara thama patan gatte naha.",
    "ta-Latn": "Checkout viberangal innum aarambikkappadavillai."
  },
  "Checkout collection started. Ask the current question again.": {
    "si": "චෙක්අවුට් විස්තර එකතු කිරීම ඇරඹුණා. දැනට අහපු ප්‍රශ්නය ආයෙත් අහන්න.",
    "ta": "செக்அவுட் விபரங்கள் சேகரிக்கத் தொடங்கியாச்சு. தற்போதைய கேள்வியை மீண்டும் கேட்கவும்.",
    "si-Latn": "Checkout wisthara ekathu kireema arabuna. Danata ahapu prashnaya ayeth ahanna.",
    "ta-Latn": "Checkout viberangal segarikka thodangiyaachu. Tharpoothaiya kelviyai meendum ketkavum."
  },
  "Checkout details are not complete. Continue collecting them.": {
    "si": "චෙක්අවුට් විස්තර තවම සම්පූර්ණ නැහැ. ඉතුරු ටිකත් එකතු කරන්න.",
    "ta": "செக்அவுட் விபரங்கள் இன்னும் முழுமையடையவில்லை. தொடர்ந்து சேகரிக்கவும்.",
    "si-Latn": "Checkout wisthara thama sampurna naha. Ithuru tikat ekathu karanna.",
    "ta-Latn": "Checkout viberangal innum muzhumaiyadadavillai. Thodarndhu segarikkavum."
  },
  "Order creation failed.": {
    "si": "ඕඩර් එක හදන්න බැරි වුණා.",
    "ta": "ஆர்டர் கிரியேஷன் தோல்வியடைந்தது.",
    "si-Latn": "Order eka hadanna bari una.",
    "ta-Latn": "Order creation tholviyadainthathu."
  },
  "Try again": {
    "si": "ආයෙත් ට්‍රයි කරන්න",
    "ta": "மீண்டும் முயலவும்",
    "si-Latn": "Ayeth try karanna",
    "ta-Latn": "Meendum muyalavum"
  },
  "No form stress. Just the details Kapruka needs for the secure pay link.": {
    "si": "ෆෝම් පුරවන්න දඟලන්න ඕනෙ නැහැ. Kapruka එකට පේමන්ට් ලින්ක් එක හදන්න ඕනෙ විස්තර ටික විතරක් දෙන්න.",
    "ta": "ஃபார்ம் ஃபில் பண்ணும் டென்ஷன் இல்லை. கப்ரூக பேமெண்ட் லிங்கிற்கு தேவையான விபரங்கள் மட்டும் தான்.",
    "si-Latn": "Form purawanna dangalanna one naha. Kapruka ekata payment link eka hadanna one wisthara tika witarak denna.",
    "ta-Latn": "Form fill pannum tension illai. Kapruka payment link-uku thevaiyana viberangal mattum thaan."
  },
  "Collecting details": {
    "si": "විස්තර එකතු කරගන්නවා",
    "ta": "விபரங்கள் சேகரிக்கப்படுகின்றன",
    "si-Latn": "Wisthara ekathu karagannawa",
    "ta-Latn": "Viberangal segarikkappadugindrana"
  },
  "Choose the detail you want to fix.": {
    "si": "වෙනස් කරන්න ඕනෙ මොන විස්තරයද කියලා තෝරන්න.",
    "ta": "மாற்ற வேண்டிய விபரத்தைத் தேர்ந்தெடுக்கவும்.",
    "si-Latn": "Wenas karanna one mona wistharayada kiyala thoranna.",
    "ta-Latn": "Maatra vendiya viberathai thernaedukkavum."
  },
  "Answer in the chat. I will ask one thing at a time.": {
    "si": "චැට් එකෙන් උත්තර දෙන්න. මම එක සැරේට අහන්නේ එක ප්‍රශ්නයයි.",
    "ta": "சாட்டில் பதிலளிக்கவும். நான் ஒவ்வொன்றாகக் கேட்கிறேன்.",
    "si-Latn": "Chat eken utthara denna. Mama eka sareta ahanne eka prashnayayi.",
    "ta-Latn": "Chat-il bathilalikkavum. Naan ovvondraaga ketkiraen."
  },
  "Check delivery availability": {
    "si": "ඩිලිවරි කරන්න පුළුවන්ද බලන්න",
    "ta": "டெலிவரி வசதியை சரிபார்க்கவும்",
    "si-Latn": "Delivery karanna puluwanda balanna",
    "ta-Latn": "Delivery vasathiyai sari paarkavum"
  },
  "Delivery to {city}": {
    "si": "{city} ට ඩිලිවරි කෙරේ",
    "ta": "{city} க்கான டெலிவரி",
    "si-Latn": "{city} ta delivery kere",
    "ta-Latn": "{city} kaana delivery"
  },
  "Delivery fee": {
    "si": "ඩිලිවරි ගාස්තුව",
    "ta": "டெலிவரி கட்டணம்",
    "si-Latn": "Delivery gaasthuwa",
    "ta-Latn": "Delivery kattanam"
  },
  "Free delivery": {
    "si": "නොමිලේ ඩිලිවරි (Free Delivery)",
    "ta": "இலவச டெலிவரி",
    "si-Latn": "Nomile delivery (Free Delivery)",
    "ta-Latn": "Ilavasa delivery"
  },
  "Next available delivery to {city} is on {date} - {fee} for delivery.": {
    "si": "ඊළඟට {city} ට ඩිලිවරි කරන්න පුළුවන් ළඟම දවස {date} - ඩිලිවරි ගාස්තුව {fee} වෙයි.",
    "ta": "{city} க்கான அடுத்த டெலிவரி {date} அன்று சாத்தியம் - டெலிவரி கட்டணம் {fee}.",
    "si-Latn": "Eelagata {city} ta delivery karanna puluwan langama dawasa {date} - delivery gaasthuwa {fee} wei.",
    "ta-Latn": "{city} kaana adutha delivery {date} andru saathiyam - delivery kattanam {fee}."
  },
  "Delivery is available to {city} on {date}.": {
    "si": "{date} දිනට {city} ට ඩිලිවරි කරන්න පුළුවන්.",
    "ta": "{date} அன்று {city} க்கு டெலிவரி செய்ய முடியும்.",
    "si-Latn": "{date} dinata {city} ta delivery karanna puluwan.",
    "ta-Latn": "{date} andru {city} ku delivery seiya mudiyum."
  },
  "Confirm this delivery": {
    "si": "ඩිලිවරි එක ස්ථිර කරන්න",
    "ta": "இந்த டெலிவரியை உறுதிப்படுத்தவும்",
    "si-Latn": "Delivery eka sthira karanna",
    "ta-Latn": "Indha delivery-ai urudhipaduthavum"
  },
  "Check another date": {
    "si": "වෙන දවසක් බලන්න",
    "ta": "வேறு தேதியை சரிபார்க்கவும்",
    "si-Latn": "Wena dawasak balanna",
    "ta-Latn": "Vera thaethiyai sari paarkavum"
  },
  "Continue checkout": {
    "si": "චෙක්අවුට් එකට ඉස්සරහට යන්න",
    "ta": "செக்அவுட்டைத் தொடரவும்",
    "si-Latn": "Checkout ekata issarahata yanna",
    "ta-Latn": "Checkout-ai thodaravum"
  },
  "Want to try another city or date?": {
    "si": "වෙන සිටි එකක් හෝ දවසක් බලමුද?",
    "ta": "வேறு சிட்டி அல்லது தேதியை ட்ரை பண்ணலாமா?",
    "si-Latn": "Wena city ekak ho dawasak balamuda?",
    "ta-Latn": "Vera city allathu thaethiyai try pannalaama?"
  },
  "I can't find \"{city}\" in Kapruka delivery cities. Can you say the nearest main city? For example: Colombo 03, Kandy, Galle, or Balangoda.": {
    "si": "Kapruka ඩිලිවරි ලිස්ට් එකේ \"{city}\" හම්බුණේ නැහැ. ළඟම තියෙන ප්‍රධාන නගරය කියන්න පුළුවන්ද? උදාහරණයකට: Colombo 03, Kandy, Galle, නැත්නම් Balangoda වගේ.",
    "ta": "கப்ரூக டெலிவரி லிஸ்ட்டில் \"{city}\" நகரம் இல்லை. அதற்கு அருகிலுள்ள பிரதான நகரத்தை சொல்ல முடியுமா? உதாரணத்திற்கு: Colombo 03, Kandy, Galle, அல்லது Balangoda.",
    "si-Latn": "Kapruka delivery list eke \"{city}\" hambune naha. Langama thiyena pradhana nagaraya kiyanna puluwanda? Udaharanayakata: Colombo 03, Kandy, Galle, nathnam Balangoda wage.",
    "ta-Latn": "Kapruka delivery list-il \"{city}\" nagaram illai. Atharku arugilulla pradhana nagarathai solla mudiyuma? Udaharanathirku: Colombo 03, Kandy, Galle, allathu Balangoda."
  },
  "Your cart": {
    "si": "ඔයාගේ කාර්ට් එක",
    "ta": "உங்கள் கார்ட்",
    "si-Latn": "Oyage cart eka",
    "ta-Latn": "Ungal cart"
  },
  "Your gift bundle": {
    "si": "ඔයාගේ ගිෆ්ට් බන්ඩල් එක",
    "ta": "உங்கள் கிஃப்ட் பண்டில்",
    "si-Latn": "Oyage gift bundle eka",
    "ta-Latn": "Ungal gift bundle"
  },
  "Total": {
    "si": "එකතුව (Total)",
    "ta": "மொத்தம்",
    "si-Latn": "Ekathuwa (Total)",
    "ta-Latn": "Moththam"
  },
  "Add to cart": {
    "si": "කාර්ට් එකට දාන්න",
    "ta": "கார்டில் சேர்க்கவும்",
    "si-Latn": "Cart ekata danna",
    "ta-Latn": "Cart-il serkkavum"
  },
  "Added to cart": {
    "si": "කාර්ට් එකට දැම්මා",
    "ta": "கார்டில் சேர்க்கப்பட்டது",
    "si-Latn": "Cart ekata damma",
    "ta-Latn": "Cart-il serkkappaddathu"
  },
  "In Stock": {
    "si": "බඩු තියෙනවා (In Stock)",
    "ta": "ஸ்டாக்கில் உள்ளது",
    "si-Latn": "Badu thiyenawa (In Stock)",
    "ta-Latn": "Stock-il ullathu"
  },
  "Check Stock": {
    "si": "බඩු තියෙනවද බලන්න",
    "ta": "ஸ்டாக் உள்ளதா என பார்க்கவும்",
    "si-Latn": "Badu thiyenawada balanna",
    "ta-Latn": "Stock ullathaa ena paarkavum"
  },
  "Next day delivery": {
    "si": "ඊළඟ දවසෙම ඩිලිවරි",
    "ta": "அடுத்த நாள் டெலிவரி",
    "si-Latn": "Eelaga dawasema delivery",
    "ta-Latn": "Adutha naal delivery"
  },
  "Gift Wrap": {
    "si": "ගිෆ්ට් රැප් කරන්න",
    "ta": "கிஃப்ட் ரேப்",
    "si-Latn": "Gift wrap karanna",
    "ta-Latn": "Gift wrap"
  },
  "Personal Note": {
    "si": "පෞද්ගලික පණිවිඩයක්",
    "ta": "தனிப்பட்ட மெசேஜ்",
    "si-Latn": "Paudgalika paniwidayak",
    "ta-Latn": "Thanippatta message"
  },
  "Ingredients": {
    "si": "අඩංගු ද්‍රව්‍ය (Ingredients)",
    "ta": "தேவையான பொருட்கள்",
    "si-Latn": "Adangu drawya (Ingredients)",
    "ta-Latn": "Thevaiyana porutkal"
  },
  "Full details": {
    "si": "සම්පූර්ණ විස්තර",
    "ta": "முழு விபரங்கள்",
    "si-Latn": "Sampurna wisthara",
    "ta-Latn": "Muzhu viberangal"
  },
  "Included": {
    "si": "ඇතුළත් කර ඇත",
    "ta": "சேர்க்கப்பட்டுள்ளது",
    "si-Latn": "Athulath kara atha",
    "ta-Latn": "Serkkappaddullathu"
  },
  "View on Kapruka": {
    "si": "Kapruka එකෙන් බලන්න",
    "ta": "கப்ரூகவில் பார்க்கவும்",
    "si-Latn": "Kapruka eken balanna",
    "ta-Latn": "Kapruka-vil paarkavum"
  },
  "Opens kapruka.com": {
    "si": "kapruka.com වෙබ් සයිට් එක ඇරෙයි",
    "ta": "kapruka.com ஓபன் ஆகும்",
    "si-Latn": "kapruka.com web site eka areyi",
    "ta-Latn": "kapruka.com open aagum"
  },
  "Prices and availability checked live from Kapruka": {
    "si": "මිල ගණන් සහ බඩු තියෙනවද කියලා Kapruka එකෙන් සජීවීව බලන ලදී",
    "ta": "விலைகள் மற்றும் ஸ்டாக் விபரங்கள் கப்ரூகவிலிருந்து லைவ்வாக சரிபார்க்கப்பட்டது",
    "si-Latn": "Mila ganan saha badu thiyenawada kiyala Kapruka eken live balana ladi",
    "ta-Latn": "Vilaigal mattrum stock viberangal Kapruka-vilirundhu live-aaga sari paarkappaddathu"
  },
  "About this product": {
    "si": "මේ භාණ්ඩය ගැන විස්තර",
    "ta": "இந்த தயாரிப்பு பற்றி",
    "si-Latn": "Me bhandaya gana wisthara",
    "ta-Latn": "Indha thayarippu patri"
  },
  "Show more": {
    "si": "තව බලන්න",
    "ta": "மேலும் காட்டு",
    "si-Latn": "Thawa balanna",
    "ta-Latn": "Maelum kaattu"
  },
  "Choose option:": {
    "si": "වර්ගය තෝරන්න:",
    "ta": "ஆப்ஷனைத் தேர்ந்தெடுக்கவும்:",
    "si-Latn": "Wargaya thoranna:",
    "ta-Latn": "Option-ai thernaedukkavum:"
  },
  "Ships from LK": {
    "si": "ලංකාවෙන්මයි එවන්නේ",
    "ta": "இலங்கையிலிருந்து அனுப்பப்படுகிறது",
    "si-Latn": "Lankawenmayi ewanne",
    "ta-Latn": "Ilangaiyilirundhu anuppappadugirathu"
  },
  "International delivery available": {
    "si": "පිටරටවලටත් ඩිලිවරි කරන්න පුළුවන්",
    "ta": "சர்வதேச டெலிவரி உண்டு",
    "si-Latn": "Pitaratawalatath delivery karanna puluwan",
    "ta-Latn": "Sarvadhesa delivery undu"
  },
  "No product selected": {
    "si": "කිසිම ප්‍රොඩක්ට් එකක් තෝරලා නැහැ",
    "ta": "தயாரிப்பு எதுவும் தேர்ந்தெடுக்கப்படவில்லை",
    "si-Latn": "Kisima product ekak thorala naha",
    "ta-Latn": "Thayarippu edhuvum thernaedukkappadavillai"
  },
  "Pick something from chat or search to inspect it here.": {
    "si": "චැට් එකෙන් හෝ සර්ච් එකෙන් මොනවා හරි තෝරලා මෙතනින් විස්තර බලන්න.",
    "ta": "சாட் அல்லது தேடலில் இருந்து ஒன்றை தேர்ந்தெடுத்து இங்கே பார்க்கவும்.",
    "si-Latn": "Chat eken ho search eken monawa hari thorala methanin wisthara balanna.",
    "ta-Latn": "Chat allathu thedalil irundhu onrai thernaeduththu inge paarkavum."
  },
  "Tracking received": {
    "si": "ට්‍රැකින් විස්තර හම්බුණා",
    "ta": "டிராக்கிங் விபரம் கிடைத்தது",
    "si-Latn": "Tracking wisthara hambuna",
    "ta-Latn": "Tracking viberam kidaithathu"
  },
  "Delivery update pending": {
    "si": "ඩිලිවරි අප්ඩේට් එක එනකන් බලන් ඉන්නවා",
    "ta": "டெலிவரி அப்டேட் இன்னும் வரவில்லை",
    "si-Latn": "Delivery update eka enakan balan innawa",
    "ta-Latn": "Delivery update innum varavillai"
  },
  "Tracking update": {
    "si": "ට්‍රැකින් අප්ඩේට් එක",
    "ta": "டிராக்கிங் அப்டேட்",
    "si-Latn": "Tracking update eka",
    "ta-Latn": "Tracking update"
  },
  "No items in cart": {
    "si": "කාර්ට් එකේ කිසිම දෙයක් නැහැ",
    "ta": "கார்டில் பொருட்கள் இல்லை",
    "si-Latn": "Cart eke kisima deyak naha",
    "ta-Latn": "Cart-il porutkal illai"
  },
  "Start shopping to build a gift bundle.": {
    "si": "ගිෆ්ට් බන්ඩල් එකක් හදන්න ශොපින් පටන් ගමු.",
    "ta": "கிஃப்ட் பண்டில் ஒன்றை உருவாக்க ஷாப்பிங்கைத் தொடங்குங்கள்.",
    "si-Latn": "Gift bundle ekak hadanna shopping patan gamu.",
    "ta-Latn": "Gift bundle onrai uruvaakka shopping-ai thodangungal."
  },
  "Proceed to Secure Kapruka Checkout": {
    "si": "ආරක්‍ෂිත Kapruka චෙක්අවුට් එකට යන්න",
    "ta": "பாதுகாப்பான கப்ரூக செக்அவுட்டிற்குச் செல்லவும்",
    "si-Latn": "Arakshitha Kapruka checkout ekata yanna",
    "ta-Latn": "Paadhukaappana Kapruka checkout-ukku chellavum"
  },
  "Search by image": {
    "si": "පොටෝ එකකින් සර්ච් කරන්න",
    "ta": "படம் மூலம் தேடவும்",
    "si-Latn": "Photo ekakin search karanna",
    "ta-Latn": "Padam moolam thedavum"
  },
  "Upload a photo": {
    "si": "පොටෝ එකක් අප්ලෝඩ් කරන්න",
    "ta": "போட்டோ அப்லோட் செய்யவும்",
    "si-Latn": "Photo ekak upload karanna",
    "ta-Latn": "Photo upload seiyavum"
  },
  "Take a photo": {
    "si": "පොටෝ එකක් ගන්න",
    "ta": "போட்டோ எடுக்கவும்",
    "si-Latn": "Photo ekak ganna",
    "ta-Latn": "Photo edukkavum"
  },
  "Image ready": {
    "si": "පොටෝ එක ලෑස්තියි",
    "ta": "படம் தயார்",
    "si-Latn": "Image eka lasthiyi",
    "ta-Latn": "Padam thayar"
  },
  "Add a message with the image if you want.": {
    "si": "ඕනෙ නම් පොටෝ එකත් එක්ක මැසේජ් එකක් ලියන්න.",
    "ta": "தேவைப்பட்டால் படத்துடன் மெசேஜ் ஒன்றையும் சேர்க்கலாம்.",
    "si-Latn": "One nam photo ekath ekka message ekak liyanna.",
    "ta-Latn": "Thevaippaddal padaththudan message onrayum serkkalaam."
  },
  "Find something like this": {
    "si": "මේ වගේ එකක් හොයන්න",
    "ta": "இது போன்ற ஒன்றை தேடவும்",
    "si-Latn": "Me wage ekak hoyanna",
    "ta-Latn": "Idhu pondra onrai thedavum"
  },
  "Analyzing image...": {
    "si": "පොටෝ එක පරීක්ෂා කරනවා...",
    "ta": "படம் ஆராயப்படுகிறது...",
    "si-Latn": "Photo eka pareeksha karanawa...",
    "ta-Latn": "Padam aarayappadugirathu..."
  },
  "Found some matches!": {
    "si": "ගැලපෙන ඒවා ටිකක් හම්බුණා!",
    "ta": "சில பொருத்தமான பொருட்கள் கிடைத்துள்ளன!",
    "si-Latn": "Galapena ewa tikak hambuna!",
    "ta-Latn": "Sila poruththamana porutkal kidaithullana!"
  },
  "Uploaded product search": {
    "si": "අප්ලෝඩ් කරපු පොටෝ එකෙන් සර්ච් කරනවා",
    "ta": "அப்லோட் செய்த தயாரிப்பு தேடல்",
    "si-Latn": "Upload karapu photo eken search karanawa",
    "ta-Latn": "Upload seidha thayarippu thedal"
  },
  "Aiyo, image search failed. Try another photo?": {
    "si": "අයියෝ, ඉමේජ් සර්ච් එක හරියට වුණේ නැහැ. වෙන පොටෝ එකක් බලමුද?",
    "ta": "அய்யோ, இமேஜ் சர்ச் தோல்வியடைந்தது. வேறு போட்டோ ட்ரை பண்ணலாமா?",
    "si-Latn": "Aiyo, image search eka hariyata wune naha. Wena photo ekak balamuda?",
    "ta-Latn": "Aiyyo, image search tholviyadainthathu. Vera photo try pannalaama?"
  },
  "I'm having trouble connecting right now. Please try again in a moment!": {
    "si": "දැනට කනෙක්ට් කරගන්න පොඩි ප්‍රශ්නයක් තියෙනවා. පොඩ්ඩකින් ආයෙත් බලන්න!",
    "ta": "இணைப்பதில் சற்று சிரமம் உள்ளது. தயவுசெய்து சிறிது நேரம் கழித்து முயலவும்!",
    "si-Latn": "Danata connect karaganna podi prashnayak thiyenawa. Poddakin ayeth balanna!",
    "ta-Latn": "Inaippathil satru siramam ullathu. Thayavuseithu siridhu neram kaliththu muyalavum!"
  },
  "Aiyo, ekka busy wela - try again in a moment!": {
    "si": "අයියෝ, ඒක බිසී වෙලා වගේ - පොඩ්ඩකින් ආයෙත් ට්‍රයි කරන්න!",
    "ta": "அய்யோ, சிஸ்டம் பிஸியா இருக்கு - கொஞ்சம் கழிச்சு ட்ரை பண்ணுங்க!",
    "si-Latn": "Aiyo, eka busy wela wage - poddakin ayeth try karanna!",
    "ta-Latn": "Aiyyo, system busy-aa iruku - konjam kalichchu try pannunga!"
  },
  "Something went wrong": {
    "si": "මොකක් හරි අවුලක් වුණා",
    "ta": "ஏதோ தவறு நடந்துவிட்டது",
    "si-Latn": "Mokak hari awulak una",
    "ta-Latn": "Aetho thavari nadandhuvittathu"
  },
  "Aiyo, something went wrong": {
    "si": "අයියෝ, මොකක් හරි වැරදීමක් වුණානේ",
    "ta": "அய்யோ, ஏதோ தப்பாயிடுச்சு",
    "si-Latn": "Aiyo, mokak hari waradeemak unane",
    "ta-Latn": "Aiyyo, aetho thappaayiduchchu"
  },
  "Could not check delivery.": {
    "si": "ඩිලිවරි චෙක් කරන්න බැරි වුණා.",
    "ta": "டெலிவரியை சரிபார்க்க முடியவில்லை.",
    "si-Latn": "Delivery check karanna bari una.",
    "ta-Latn": "Delivery-ai sari paarkka mudiyavillai."
  },
  "Could not fill order field.": {
    "si": "ඕඩර් එකේ විස්තර පුරවන්න බැරි වුණා.",
    "ta": "ஆர்டர் விபரத்தை நிரப்ப முடியவில்லை.",
    "si-Latn": "Order eke wisthara purawanna bari una.",
    "ta-Latn": "Order viberaththai nirappa mudiyavillai."
  },
  "Could not correct order field.": {
    "si": "ඕඩර් එකේ විස්තර වෙනස් කරන්න බැරි වුණා.",
    "ta": "ஆர்டர் விபரத்தை திருத்த முடியவில்லை.",
    "si-Latn": "Order eke wisthara wenas karanna bari una.",
    "ta-Latn": "Order viberaththai thirutha mudiyavillai."
  },
  "Could not mark order ready.": {
    "si": "ඕඩර් එක ලෑස්තියි කියලා මාර්ක් කරන්න බැරි වුණා.",
    "ta": "ஆர்டர் தயார் என்று குறிக்க முடியவில்லை.",
    "si-Latn": "Order eka lasthiyi kiyala mark karanna bari una.",
    "ta-Latn": "Order thayar endru kurikka mudiyavillai."
  },
  "Could not place order.": {
    "si": "ඕඩර් එක දාන්න බැරි වුණා.",
    "ta": "ஆர்டர் செய்ய முடியவில்லை.",
    "si-Latn": "Order eka danna bari una.",
    "ta-Latn": "Order seiya mudiyavillai."
  },
  "Could not start checkout.": {
    "si": "චෙක්අවුට් එක පටන් ගන්න බැරි වුණා.",
    "ta": "செக்அவுட்டை ஆரம்பிக்க முடியவில்லை.",
    "si-Latn": "Checkout eka patan ganna bari una.",
    "ta-Latn": "Checkout-ai aarambikka mudiyavillai."
  },
  "Could not update checkout details.": {
    "si": "චෙක්අවුට් විස්තර අප්ඩේට් කරන්න බැරි වුණා.",
    "ta": "செக்அவுட் விபரங்களை அப்டேட் செய்ய முடியவில்லை.",
    "si-Latn": "Checkout wisthara update karanna bari una.",
    "ta-Latn": "Checkout viberangalai update seiya mudiyavillai."
  },
  "Could not add item to cart.": {
    "si": "භාණ්ඩය කාර්ට් එකට දාන්න බැරි වුණා.",
    "ta": "பொருளை கார்டில் சேர்க்க முடியவில்லை.",
    "si-Latn": "Bhandaya cart ekata danna bari una.",
    "ta-Latn": "Porulai cart-il serkka mudiyavillai."
  },
  "Missing search query. Ask the user one short clarifying question.": {
    "si": "සර්ච් කරන්න ඕනෙ දේ පැහැදිලි නැහැ. පරිශීලකයාගෙන් කෙටි ප්‍රශ්නයක් අහන්න.",
    "ta": "தேடல் விபரம் போதாது. பயனரிடம் ஒரு சிறிய தெளிவுபடுத்தும் கேள்வியைக் கேட்கவும்.",
    "si-Latn": "Search karanna one de pahadili naha. User gen keti prashnayak ahanna.",
    "ta-Latn": "Thedal viberam podhadhu. Payanidam oru siriya thelivupaduththum kelviyaik ketkavum."
  },
  "Cart is empty. Ask the user to add an item first.": {
    "si": "කාර්ට් එක හිස්. ඉස්සෙල්ලාම බඩුවක් ඇඩ් කරගන්න කියලා කියන්න.",
    "ta": "கார்ட் காலியாக உள்ளது. முதலில் ஒரு பொருளை சேர்க்குமாறு பயனரிடம் கேட்கவும்.",
    "si-Latn": "Cart eka his. Issellama baduwak add karaganna kiyala kiyanna.",
    "ta-Latn": "Cart kaaliyaaga ullathu. Mudhalil oru porulai serkkumaaru payanidam ketkavum."
  },
  "No visible products to add.": {
    "si": "ඇඩ් කරන්න කිසිම ප්‍රොඩක්ට් එකක් පේන්න නැහැ.",
    "ta": "சேர்ப்பதற்கு எந்த தயாரிப்பும் தெரியவில்லை.",
    "si-Latn": "Add karanna kisima product ekak penna naha.",
    "ta-Latn": "Serppadharku endha thayarippum thariyavillai."
  },
  "No order form is active.": {
    "si": "කිසිම ඕඩර් ෆෝම් එකක් දැනට ක්‍රියාත්මක නැහැ.",
    "ta": "ஆர்டர் ஃபார்ம் எதுவும் ஆக்டிவாக இல்லை.",
    "si-Latn": "Kisima order form ekak danata kriyaathmaka naha.",
    "ta-Latn": "Endha order form-um ippodhu active-aa illai."
  },
  "No order form is ready.": {
    "si": "කිසිම ඕඩර් ෆෝම් එකක් තවම ලෑස්ති නැහැ.",
    "ta": "ஆர்டர் ஃபார்ம் எதுவும் தயாராக இல்லை.",
    "si-Latn": "Kisima order form ekak thama lasthi naha.",
    "ta-Latn": "Endha order form-um innum thayaraaga illai."
  },
  "Details accepted.": {
    "si": "විස්තර පිළිගන්නා ලදී.",
    "ta": "விபரங்கள் ஏற்றுக்கொள்ளப்பட்டன.",
    "si-Latn": "Wisthara piliganna ladi.",
    "ta-Latn": "Viberangal aertrukkollappaddana."
  },
  "Start fresh": {
    "si": "මුල ඉඳන්ම පටන් ගන්න",
    "ta": "முதலில் இருந்து ஆரம்பிக்கவும்",
    "si-Latn": "Mula idanma patan ganna",
    "ta-Latn": "Mudhalil irundhu aarambikkavum"
  },
  "Yes, continue": {
    "si": "ඔව්, ඉස්සරහට යන්න",
    "ta": "ஆம், தொடரவும்",
    "si-Latn": "Ow, issarahata yanna",
    "ta-Latn": "Aam, thodaravum"
  }
} as const;

export function uiText(english: string, language: UiLanguage = "en", values?: Record<string, string | number | undefined | null>) {
  let text = language === "en" ? english : UI_TRANSLATIONS[english]?.[language] || english;
  if (values) {
    for (const [key, value] of Object.entries(values)) {
      text = text.replaceAll(`{${key}}`, String(value ?? ""));
    }
  }
  return text;
}

export function modelLanguage(language: UiLanguage = "en"): "en" | "si" | "ta" {
  if (language === "si-Latn") return "si";
  if (language === "ta-Latn") return "ta";
  return language;
}
