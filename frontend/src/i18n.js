// ============================================================
// RentPro i18n — 13 language translation system
// Auto-detects from browser locale, saves preference to localStorage
// Usage: const t = useT(); t('key')
// ============================================================
import React, { createContext, useContext, useState, useEffect } from 'react';

export const LANGUAGES = [
  { code:'en',  name:'English',    native:'English',      flag:'🇬🇧', dir:'ltr' },
  { code:'hi',  name:'Hindi',      native:'हिन्दी',        flag:'🇮🇳', dir:'ltr' },
  { code:'te',  name:'Telugu',     native:'తెలుగు',        flag:'🇮🇳', dir:'ltr' },
  { code:'ta',  name:'Tamil',      native:'தமிழ்',         flag:'🇮🇳', dir:'ltr' },
  { code:'kn',  name:'Kannada',    native:'ಕನ್ನಡ',         flag:'🇮🇳', dir:'ltr' },
  { code:'mr',  name:'Marathi',    native:'मराठी',         flag:'🇮🇳', dir:'ltr' },
  { code:'ml',  name:'Malayalam',  native:'മലയാളം',        flag:'🇮🇳', dir:'ltr' },
  { code:'bn',  name:'Bengali',    native:'বাংলা',         flag:'🇮🇳', dir:'ltr' },
  { code:'ar',  name:'Arabic',     native:'العربية',       flag:'🇸🇦', dir:'rtl' },
  { code:'fr',  name:'French',     native:'Français',     flag:'🇫🇷', dir:'ltr' },
  { code:'es',  name:'Spanish',    native:'Español',      flag:'🇪🇸', dir:'ltr' },
  { code:'de',  name:'German',     native:'Deutsch',      flag:'🇩🇪', dir:'ltr' },
  { code:'ja',  name:'Japanese',   native:'日本語',         flag:'🇯🇵', dir:'ltr' },
  { code:'zh',  name:'Chinese',    native:'中文',           flag:'🇨🇳', dir:'ltr' },
];

// ── Detect language from browser ─────────────────────────────
export function detectLanguage() {
  const saved = localStorage.getItem('rp_lang');
  if (saved && LANGUAGES.find(l => l.code === saved)) return saved;
  const prefix = (navigator.language || 'en').toLowerCase().split('-')[0];
  return LANGUAGES.find(l => l.code === prefix)?.code || 'en';
}

// ── All translation strings ───────────────────────────────────
const T = {
  appName: {
    en:'RentPro',hi:'रेंटप्रो',te:'రెంట్‌ప్రో',ta:'ரெண்ட்புரோ',kn:'ರೆಂಟ್‌ಪ್ರೋ',
    mr:'रेंटप्रो',ml:'റെന്റ്‌പ്രോ',bn:'রেন্টপ্রো',ar:'رينت برو',
    fr:'RentPro',es:'RentPro',de:'RentPro',ja:'レントプロ',zh:'租房宝',
  },
  appTagline: {
    en:'Property Management Platform',hi:'संपत्ति प्रबंधन प्लेटफ़ॉर्म',
    te:'ఆస్తి నిర్వహణ వేదిక',ta:'சொத்து மேலாண்மை தளம்',kn:'ಆಸ್ತಿ ನಿರ್ವಹಣೆ ವೇದಿಕೆ',
    mr:'मालमत्ता व्यवस्थापन व्यासपीठ',ml:'സ്വത്ത് മാനേജ്‌മെന്റ് പ്ലാറ്റ്‌ഫോം',
    bn:'সম্পত্তি ব্যবস্থাপনা প্ল্যাটফর্ম',ar:'منصة إدارة العقارات',
    fr:'Plateforme de gestion immobilière',es:'Plataforma de gestión inmobiliaria',
    de:'Immobilienverwaltungsplattform',ja:'不動産管理プラットフォーム',zh:'房产管理平台',
  },
  welcomeTo: {
    en:'Welcome to RentPro',hi:'रेंटप्रो में आपका स्वागत है',te:'రెంట్‌ప్రోకి స్వాగతం',
    ta:'RentPro-க்கு வரவேற்கிறோம்',kn:'RentPro ಗೆ ಸ್ವಾಗತ',mr:'RentPro मध्ये स्वागत आहे',
    ml:'RentPro-ലേക്ക് സ്വാഗതം',bn:'RentPro-তে স্বাগতম',ar:'مرحباً بك في رينت برو',
    fr:'Bienvenue sur RentPro',es:'Bienvenido a RentPro',de:'Willkommen bei RentPro',
    ja:'RentProへようこそ',zh:'欢迎使用租房宝',
  },
  landingDesc: {
    en:'Everything you need to manage properties, collect rent and find your next home — all in one place.',
    hi:'संपत्तियों को प्रबंधित करने, किराया एकत्र करने और अपना अगला घर खोजने के लिए सब कुछ — एक ही जगह।',
    te:'ఆస్తులను నిర్వహించడానికి, అద్దె వసూలు చేయడానికి మరియు మీ తదుపరి ఇంటిని కనుగొనడానికి అన్నీ — ఒకే చోట.',
    ta:'சொத்துக்களை நிர்வகிக்க, வாடகை வசூலிக்க, அடுத்த வீடு தேட — எல்லாம் ஒரே இடத்தில்.',
    kn:'ಆಸ್ತಿ ನಿರ್ವಹಿಸಲು, ಬಾಡಿಗೆ ಸಂಗ್ರಹಿಸಲು, ಮುಂದಿನ ಮನೆ ಹುಡುಕಲು — ಎಲ್ಲವೂ ಒಂದೇ ಕಡೆ.',
    mr:'मालमत्ता व्यवस्थापन, भाडे संकलन आणि पुढील घर शोधण्यासाठी — एकाच ठिकाणी.',
    ml:'സ്വത്ത് കൈകാര്യം, വാടക ശേഖരണം, ഭവനം കണ്ടെത്തൽ — ഒറ്റ ഇടത്ത്.',
    bn:'সম্পত্তি পরিচালনা, ভাড়া সংগ্রহ এবং বাড়ি খোঁজার জন্য — এক জায়গায়।',
    ar:'كل ما تحتاجه لإدارة العقارات وتحصيل الإيجار والعثور على منزلك — في مكان واحد.',
    fr:'Tout pour gérer vos biens, percevoir les loyers et trouver votre logement — en un seul endroit.',
    es:'Todo para gestionar propiedades, cobrar alquileres y encontrar tu hogar — en un solo lugar.',
    de:'Alles für Immobilienverwaltung, Mieteinzug und Wohnungssuche — an einem Ort.',
    ja:'物件管理、家賃集金、次の住まい探しに必要なすべてが — 一か所に。',
    zh:'管理房产、收取租金、找到下一个家 — 一站式解决。',
  },
  landlord: {
    en:'Landlord',hi:'मकान मालिक',te:'యజమాని',ta:'வீட்டுடைமையாளர்',
    kn:'ಮಾಲೀಕ',mr:'मालक',ml:'ഭൂവുടമ',bn:'বাড়িওয়ালা',
    ar:'المالك',fr:'Propriétaire',es:'Propietario',de:'Vermieter',ja:'家主',zh:'房东',
  },
  landlordDesc: {
    en:'Manage properties, track rent collection and monitor tenant leases',
    hi:'संपत्तियों का प्रबंधन, किराया ट्रैकिंग और किरायेदार अनुबंध निगरानी',
    te:'ఆస్తులను నిర్వహించండి, అద్దె ట్రాక్ చేయండి మరియు అద్దెదారు ఒప్పందాలను పర్యవేక్షించండి',
    ta:'சொத்துக்களை நிர்வகி, வாடகை கண்காணி, குத்தகை பார்வையிடு',
    kn:'ಆಸ್ತಿ ನಿರ್ವಹಿಸಿ, ಬಾಡಿಗೆ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ, ಗುತ್ತಿಗೆ ಮೇಲ್ವಿಚಾರಣೆ',
    mr:'मालमत्ता व्यवस्थापन, भाडे ट्रॅकिंग, भाडेकरू करार निरीक्षण',
    ml:'സ്വത്ത് നിയന്ത്രിക്കുക, വാടക ട്രാക്ക് ചെയ്യുക, ഭൂ-ഉടമ കരാർ നിരീക്ഷിക്കുക',
    bn:'সম্পত্তি পরিচালনা, ভাড়া ট্র্যাকিং, ভাড়াটিয়া চুক্তি পর্যবেক্ষণ',
    ar:'إدارة العقارات وتتبع الإيجار ومراقبة العقود',
    fr:'Gérez vos biens, suivez les loyers et surveillez les baux',
    es:'Gestiona propiedades, controla alquileres y supervisa contratos',
    de:'Immobilien verwalten, Miete verfolgen, Verträge überwachen',
    ja:'物件管理、家賃追跡、テナント契約の監視',
    zh:'管理房产、追踪租金收取、监控租约',
  },
  tenant: {
    en:'Tenant',hi:'किरायेदार',te:'అద్దెదారుడు',ta:'குத்தகைதாரர்',
    kn:'ಬಾಡಿಗೆದಾರ',mr:'भाडेकरू',ml:'വാടകക്കാരൻ',bn:'ভাড়াটিয়া',
    ar:'المستأجر',fr:'Locataire',es:'Inquilino',de:'Mieter',ja:'借主',zh:'租客',
  },
  tenantDesc: {
    en:'View rent status, pay online and access your lease details',
    hi:'किराया स्थिति देखें, ऑनलाइन भुगतान करें और पट्टे का विवरण देखें',
    te:'అద్దె స్థితి చూడండి, ఆన్‌లైన్‌లో చెల్లించండి మరియు లీజు వివరాలు చూడండి',
    ta:'வாடகை நிலை பார், ஆன்லைனில் செலுத்து, குத்தகை விவரம் பார்',
    kn:'ಬಾಡಿಗೆ ಸ್ಥಿತಿ ನೋಡಿ, ಆನ್‌ಲೈನ್ ಪಾವತಿ, ಗುತ್ತಿಗೆ ವಿವರ',
    mr:'भाडे स्थिती पहा, ऑनलाइन पेमेंट करा, करार तपशील पहा',
    ml:'വാടക നില കാണുക, ഓൺലൈൻ പേ, ലീസ് വിവരങ്ങൾ',
    bn:'ভাড়ার অবস্থা দেখুন, অনলাইনে পেমেন্ট করুন, লিজের বিবরণ দেখুন',
    ar:'عرض حالة الإيجار والدفع أونلاين وتفاصيل العقد',
    fr:'Consultez votre loyer, payez en ligne et accédez à votre bail',
    es:'Ver estado del alquiler, pagar online y acceder al contrato',
    de:'Mietstatus anzeigen, online zahlen, Mietdetails einsehen',
    ja:'家賃状況確認、オンライン支払い、賃貸詳細へのアクセス',
    zh:'查看租金状态、在线支付、查看租约详情',
  },
  findProperty: {
    en:'Find a Property',hi:'संपत्ति खोजें',te:'ఆస్తిని కనుగొనండి',ta:'சொத்து தேடு',
    kn:'ಆಸ್ತಿ ಹುಡುಕಿ',mr:'मालमत्ता शोधा',ml:'സ്വത്ത് കണ്ടെത്തുക',bn:'সম্পত্তি খুঁজুন',
    ar:'ابحث عن عقار',fr:'Trouver un logement',es:'Buscar propiedad',de:'Immobilie suchen',
    ja:'物件を探す',zh:'找房',
  },
  findPropertyDesc: {
    en:'Browse verified listings and find your perfect rental home',
    hi:'सत्यापित लिस्टिंग ब्राउज़ करें और अपना आदर्श किराये का घर खोजें',
    te:'ధృవీకరించిన జాబితాలు చూడండి మరియు మీ అద్దె ఇంటిని కనుగొనండి',
    ta:'சரிபார்க்கப்பட்ட பட்டியல்களை உலாவி உங்கள் வாடகை வீடு தேடு',
    kn:'ಪರಿಶೀಲಿತ ಪಟ್ಟಿಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡಿ ನಿಮ್ಮ ಬಾಡಿಗೆ ಮನೆ ಹುಡುಕಿ',
    mr:'सत्यापित यादी पहा आणि तुमचे भाड्याचे घर शोधा',
    ml:'പരിശോധിത ലിസ്റ്റിംഗ് ബ്രൗസ് ചെയ്ത് ഭവനം കണ്ടെത്തുക',
    bn:'যাচাইকৃত তালিকা দেখুন এবং আপনার ভাড়ার বাড়ি খুঁজুন',
    ar:'تصفح القوائم الموثقة وابحث عن منزلك المثالي',
    fr:'Parcourez les annonces vérifiées et trouvez votre logement idéal',
    es:'Explora anuncios verificados y encuentra tu hogar de alquiler ideal',
    de:'Verifizierte Angebote durchsuchen und Ihr Mietdomizil finden',
    ja:'認証済み物件を探して理想の賃貸住宅を見つけよう',
    zh:'浏览经过验证的房源，找到您理想的出租房',
  },
  getStarted: {
    en:'Get started',hi:'शुरू करें',te:'ప్రారంభించండి',ta:'தொடங்கு',
    kn:'ಪ್ರಾರಂಭಿಸಿ',mr:'सुरुवात करा',ml:'ആരംഭിക്കുക',bn:'শুরু করুন',
    ar:'ابدأ',fr:'Commencer',es:'Comenzar',de:'Loslegen',ja:'始める',zh:'开始',
  },
  browseProperties: {
    en:'Browse properties',hi:'संपत्तियां देखें',te:'ఆస్తులు చూడండి',ta:'சொத்துக்கள் காண்',
    kn:'ಆಸ್ತಿ ನೋಡಿ',mr:'मालमत्ता पहा',ml:'പ്രോപ്പർടി ബ്രൗസ്',bn:'সম্পত্তি দেখুন',
    ar:'تصفح العقارات',fr:'Parcourir les biens',es:'Ver propiedades',de:'Objekte ansehen',
    ja:'物件を見る',zh:'浏览房源',
  },
  adminPortal: {
    en:'Admin portal',hi:'एडमिन पोर्टल',te:'అడ్మిన్ పోర్టల్',ta:'நிர்வாக போர்டல்',
    kn:'ನಿರ್ವಾಹಕ ಪೋರ್ಟಲ್',mr:'प्रशासन पोर्टल',ml:'അഡ്മിൻ പോർടൽ',bn:'অ্যাডমিন পোর্টাল',
    ar:'بوابة الإدارة',fr:'Portail admin',es:'Portal administración',de:'Admin-Portal',
    ja:'管理ポータル',zh:'管理门户',
  },
  bankSecurity: {
    en:'Bank-grade security',hi:'बैंक स्तरीय सुरक्षा',te:'బ్యాంక్-స్థాయి భద్రత',ta:'வங்கி-நிலை பாதுகாப்பு',
    kn:'ಬ್ಯಾಂಕ್-ಮಟ್ಟದ ಭದ್ರತೆ',mr:'बँक-दर्जाची सुरक्षितता',ml:'ബാങ്ക്-ഗ്രേഡ് സുരക്ഷ',bn:'ব্যাংক-মানের নিরাপত্তা',
    ar:'أمان بمستوى البنوك',fr:'Sécurité bancaire',es:'Seguridad bancaria',de:'Banksicherheit',
    ja:'銀行レベルのセキュリティ',zh:'银行级安全',
  },
  mobileFriendly: {
    en:'Mobile friendly',hi:'मोबाइल फ्रेंडली',te:'మొబైల్ ఫ్రెండ్లీ',ta:'மொபைல் நட்பு',
    kn:'ಮೊಬೈಲ್ ಸ್ನೇಹಿ',mr:'मोबाइल फ्रेंडली',ml:'മൊബൈൽ ഫ്രണ്ട്ലി',bn:'মোবাইল বান্ধব',
    ar:'متوافق مع الجوال',fr:'Compatible mobile',es:'Apto para móvil',de:'Mobilfreundlich',
    ja:'モバイル対応',zh:'移动友好',
  },
  realTimeUpdates: {
    en:'Real-time updates',hi:'रियल-टाइम अपडेट',te:'రియల్-టైమ్ అప్‌డేట్లు',ta:'நிகழ்நேர புதுப்பிப்புகள்',
    kn:'ರಿಯಲ್-ಟೈಮ್ ಅಪ್‌ಡೇಟ್‌ಗಳು',mr:'रिअल-टाइम अपडेट',ml:'റിയൽ-ടൈം അപ്ഡേറ്റ്',bn:'রিয়েল-টাইম আপডেট',
    ar:'تحديثات فورية',fr:'Mises à jour en temps réel',es:'Actualizaciones en tiempo real',de:'Echtzeit-Updates',
    ja:'リアルタイム更新',zh:'实时更新',
  },
  language: {
    en:'Language',hi:'भाषा',te:'భాష',ta:'மொழி',kn:'ಭಾಷೆ',mr:'भाषा',ml:'ഭാഷ',bn:'ভাষা',
    ar:'اللغة',fr:'Langue',es:'Idioma',de:'Sprache',ja:'言語',zh:'语言',
  },
  new: {
    en:'New',hi:'नया',te:'కొత్త',ta:'புது',kn:'ಹೊಸ',mr:'नवीन',ml:'പുതിയ',bn:'নতুন',
    ar:'جديد',fr:'Nouveau',es:'Nuevo',de:'Neu',ja:'新しい',zh:'新',
  },
  // Auth
  signIn: {
    en:'Sign in',hi:'साइन इन करें',te:'సైన్ ఇన్',ta:'உள்நுழைக',kn:'ಸೈನ್ ಇನ್',
    mr:'साइन इन करा',ml:'സൈൻ ഇൻ',bn:'সাইন ইন',ar:'تسجيل الدخول',fr:'Se connecter',
    es:'Iniciar sesión',de:'Anmelden',ja:'サインイン',zh:'登录',
  },
  signOut: {
    en:'Sign out',hi:'साइन आउट',te:'సైన్ అవుట్',ta:'வெளியேறு',kn:'ಸೈನ್ ಔಟ್',
    mr:'साइन आउट',ml:'സൈൻ ഔട്ട്',bn:'সাইন আউট',ar:'تسجيل الخروج',fr:'Se déconnecter',
    es:'Cerrar sesión',de:'Abmelden',ja:'サインアウト',zh:'退出',
  },
  register: {
    en:'Register',hi:'पंजीकरण',te:'నమోదు',ta:'பதிவு செய்',kn:'ನೋಂದಾಯಿಸಿ',
    mr:'नोंदणी करा',ml:'രജിസ്‌ടർ',bn:'নিবন্ধন',ar:'تسجيل',fr:"S'inscrire",
    es:'Registrarse',de:'Registrieren',ja:'登録',zh:'注册',
  },
  // Marketplace
  findYourNextHome: {
    en:'Find your next home',hi:'अपना अगला घर खोजें',te:'మీ తదుపరి ఇంటిని కనుగొనండి',
    ta:'உங்கள் அடுத்த வீடு',kn:'ನಿಮ್ಮ ಮುಂದಿನ ಮನೆ',mr:'तुमचे पुढील घर',
    ml:'നിങ്ങളുടെ അടുത്ത ഭവനം',bn:'আপনার পরবর্তী বাড়ি',ar:'ابحث عن منزلك التالي',
    fr:'Trouvez votre prochain logement',es:'Encuentra tu próximo hogar',de:'Ihr nächstes Zuhause',
    ja:'次の住まいを見つける',zh:'找到您的下一个家',
  },
  searchCity: {
    en:'Search city or area…',hi:'शहर या क्षेत्र खोजें…',te:'నగరం లేదా ప్రాంతం…',
    ta:'நகரம் அல்லது பகுதி…',kn:'ನಗರ ಅಥವಾ ಪ್ರದೇಶ…',mr:'शहर किंवा परिसर…',
    ml:'നഗരം അല്ലെങ്കിൽ പ്രദേശം…',bn:'শহর বা এলাকা…',ar:'ابحث في المدينة…',
    fr:'Ville ou quartier…',es:'Ciudad o zona…',de:'Stadt oder Gebiet…',
    ja:'都市またはエリアを検索…',zh:'搜索城市或区域…',
  },
  viewDetails: {
    en:'View details →',hi:'विवरण देखें →',te:'వివరాలు చూడండి →',ta:'விவரங்கள் →',
    kn:'ವಿವರ ನೋಡಿ →',mr:'तपशील पहा →',ml:'വിശദാംശങ്ങൾ →',bn:'বিস্তারিত →',
    ar:'← عرض التفاصيل',fr:'Voir détails →',es:'Ver detalles →',de:'Details →',
    ja:'詳細を見る →',zh:'查看详情 →',
  },
  imInterested: {
    en:"I'm interested →",hi:'मुझे रुचि है →',te:'నాకు ఆసక్తి ఉంది →',ta:'என் ஆர்வம் →',
    kn:'ನನಗೆ ಆಸಕ್ತಿ →',mr:'मला स्वारस्य →',ml:'എനിക്ക് താൽപ്പര്യം →',bn:'আমি আগ্রহী →',
    ar:'← أنا مهتم',fr:'Je suis intéressé(e) →',es:'Estoy interesado →',de:'Interessiert →',
    ja:'興味があります →',zh:'我感兴趣 →',
  },
  perMonth: {
    en:'per month',hi:'प्रति माह',te:'నెలకు',ta:'மாதம்',kn:'ತಿಂಗಳಿಗೆ',
    mr:'महिना',ml:'പ്രതി മാസം',bn:'প্রতি মাসে',ar:'شهرياً',fr:'par mois',
    es:'al mes',de:'pro Monat',ja:'月額',zh:'每月',
  },
  noProperties: {
    en:'No properties listed yet',hi:'अभी कोई संपत्ति सूचीबद्ध नहीं',te:'ఇంకా ఆస్తులు జాబితా చేయబడలేదు',
    ta:'இன்னும் சொத்துக்கள் பட்டியலிடப்படவில்லை',kn:'ಇನ್ನು ಆಸ್ತಿ ಪಟ್ಟಿ ಮಾಡಿಲ್ಲ',
    mr:'अद्याप कोणतीही मालमत्ता यादी केलेली नाही',ml:'ഇതുവരെ സ്വത്ത് ലിസ്‌ട് ചെയ്തിട്ടില്ല',
    bn:'এখনও কোনো সম্পত্তি তালিকাভুক্ত নেই',ar:'لا توجد عقارات مدرجة بعد',
    fr:'Aucun bien listé pour l\'instant',es:'No hay propiedades listadas aún',de:'Noch keine Objekte',
    ja:'まだ物件が登録されていません',zh:'暂无房源',
  },
  // Dashboard
  dashboard: {
    en:'Dashboard',hi:'डैशबोर्ड',te:'డాష్‌బోర్డ్',ta:'டாஷ்போர்டு',kn:'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    mr:'डॅशबोर्ड',ml:'ഡാഷ്‌ബോർഡ്',bn:'ড্যাশবোর্ড',ar:'لوحة التحكم',fr:'Tableau de bord',
    es:'Panel',de:'Dashboard',ja:'ダッシュボード',zh:'仪表盘',
  },
  properties: {
    en:'Properties',hi:'संपत्तियां',te:'ఆస్తులు',ta:'சொத்துக்கள்',kn:'ಆಸ್ತಿಗಳು',
    mr:'मालमत्ता',ml:'സ്വത്തുക്കൾ',bn:'সম্পত্তিসমূহ',ar:'العقارات',fr:'Propriétés',
    es:'Propiedades',de:'Immobilien',ja:'物件',zh:'房产',
  },
  tenants: {
    en:'Tenants',hi:'किरायेदार',te:'అద్దెదారులు',ta:'குத்தகைதாரர்கள்',kn:'ಬಾಡಿಗೆದಾರರು',
    mr:'भाडेकरू',ml:'വാടകക്കാർ',bn:'ভাড়াটিয়াগণ',ar:'المستأجرون',fr:'Locataires',
    es:'Inquilinos',de:'Mieter',ja:'テナント',zh:'租客',
  },
  payments: {
    en:'Payments',hi:'भुगतान',te:'చెల్లింపులు',ta:'கட்டணங்கள்',kn:'ಪಾವತಿಗಳು',
    mr:'देयके',ml:'പേമെന്റുകൾ',bn:'পেমেন্ট',ar:'المدفوعات',fr:'Paiements',
    es:'Pagos',de:'Zahlungen',ja:'支払い',zh:'支付',
  },
  notifications: {
    en:'Notifications',hi:'सूचनाएं',te:'నోటిఫికేషన్లు',ta:'அறிவிப்புகள்',kn:'ಅಧಿಸೂಚನೆಗಳು',
    mr:'सूचना',ml:'അറിയിപ്പുകൾ',bn:'বিজ্ঞপ্তি',ar:'الإشعارات',fr:'Notifications',
    es:'Notificaciones',de:'Benachrichtigungen',ja:'通知',zh:'通知',
  },
  viewProfile: {
    en:'View profile',hi:'प्रोफ़ाइल देखें',te:'ప్రొఫైల్ చూడండి',ta:'சுயவிவரம் காண்',
    kn:'ಪ್ರೊಫೈಲ್ ನೋಡಿ',mr:'प्रोफाइल पहा',ml:'പ്രൊഫൈൽ',bn:'প্রোফাইল দেখুন',
    ar:'الملف الشخصي',fr:'Voir le profil',es:'Ver perfil',de:'Profil',ja:'プロフィール',zh:'查看资料',
  },
  myHome: {
    en:'My home',hi:'मेरा घर',te:'నా ఇల్లు',ta:'என் வீடு',kn:'ನನ್ನ ಮನೆ',
    mr:'माझे घर',ml:'എന്റെ വീട്',bn:'আমার বাড়ি',ar:'منزلي',fr:'Mon logement',
    es:'Mi hogar',de:'Mein Zuhause',ja:'マイホーム',zh:'我的家',
  },
  payNow: {
    en:'Pay now',hi:'अभी भुगतान करें',te:'ఇప్పుడే చెల్లించండి',ta:'இப்போதே செலுத்து',
    kn:'ಈಗ ಪಾವತಿ',mr:'आता पेमेंट करा',ml:'ഇപ്പോൾ പേ',bn:'এখনই পেমেন্ট',
    ar:'ادفع الآن',fr:'Payer maintenant',es:'Pagar ahora',de:'Jetzt bezahlen',ja:'今すぐ支払う',zh:'立即支付',
  },
};

// ── Context ───────────────────────────────────────────────────
const LangCtx = createContext({ lang:'en', setLang:()=>{} });
export const useLang = () => useContext(LangCtx);

export const useT = () => {
  const { lang } = useLang();
  return (key) => {
    if (!T[key]) return key;
    return T[key][lang] || T[key]['en'] || key;
  };
};

// ── Provider ──────────────────────────────────────────────────
export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => detectLanguage());

  const setLang = (code) => {
    localStorage.setItem('rp_lang', code);
    setLangState(code);
  };

  useEffect(() => {
    const dir = LANGUAGES.find(l => l.code === lang)?.dir || 'ltr';
    document.documentElement.dir  = dir;
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LangCtx.Provider value={{ lang, setLang }}>
      {children}
    </LangCtx.Provider>
  );
}
