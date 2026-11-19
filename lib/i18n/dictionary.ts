import type { LanguageCode } from "@/lib/types";

// Tamil is the primary language; English is the required second language.
// Hindi and Telugu are stretch goals and are intentionally partial right now —
// any missing key falls back to English, never to a blank string, so the
// app stays usable while those dictionaries are filled in over time.

export type DictKey = keyof typeof en;

const en = {
  app_name: "Vayal Thunai",
  app_tagline: "Farming advisory for Tamil Nadu",
  nav_home: "Home",
  nav_weather: "Weather",
  nav_prices: "Prices",
  nav_calendar: "Calendar",
  nav_diary: "Diary",
  nav_assistant: "Ask",
  nav_schemes: "Schemes",
  nav_settings: "Settings",

  onboarding_welcome: "Welcome",
  onboarding_choose_language: "Choose your language",
  onboarding_farmer_name: "Your name",
  onboarding_add_plot: "Add a plot of land",
  onboarding_plot_name: "Plot name",
  onboarding_location: "Village / location",
  onboarding_area: "Land size (acres)",
  onboarding_soil_type: "Soil type",
  onboarding_irrigation: "Irrigation source",
  onboarding_crop: "Crop",
  onboarding_sowing_date: "Sowing / planting date",
  onboarding_finish: "Start using the app",
  onboarding_use_gps: "Use my current location",
  onboarding_search_location: "Search for your village",

  common_save: "Save",
  common_cancel: "Cancel",
  common_add: "Add",
  common_delete: "Delete",
  common_edit: "Edit",
  common_back: "Back",
  common_loading: "Loading…",
  common_offline: "You are offline. Showing last saved data.",
  common_source: "Source",
  common_as_of: "As of",
  common_retrieved: "Checked",
  common_data_gap: "No reliable data available",
  common_confirm_locally: "Please confirm locally before acting on this.",
  common_listen: "Listen",
  common_listen_again: "Listen again",
  common_explain_simply: "Explain more simply",
  common_speak_question: "Hold to speak",

  weather_title: "Weather",
  weather_attribution: "Weather data: Open-Meteo.com (CC BY 4.0)",
  weather_forecast: "Forecast",
  weather_last_updated: "Last updated",
  weather_stale_warning: "This forecast is old. Connect to the internet to refresh.",
  weather_rain_chance: "Chance of rain",
  weather_temp: "Temperature",
  weather_wind: "Wind",
  weather_humidity: "Humidity",
  weather_et0: "Reference evapotranspiration (ET0)",
  weather_soil_moisture: "Soil moisture",
  weather_soil_temp: "Soil temperature",
  weather_official_warning: "Official IMD warning",
  weather_informational_notice:
    "Weather information is for guidance only, not a guarantee.",

  alert_no_spray_rain: "Do not spray — rain expected soon",
  alert_no_spray_wind: "Do not spray — wind is too strong",
  alert_irrigate_now: "Irrigation recommended",
  alert_irrigate_skip: "Skip irrigation — recent rain is enough",
  alert_heat_stress: "Heat stress risk for this crop stage",
  alert_cold_stress: "Cold stress risk for this crop stage",
  alert_flood_risk: "Heavy rain / flood risk",
  alert_harvest_window_good: "Good window for harvest and drying",
  alert_harvest_window_bad: "Poor window for harvest / drying — rain expected",

  price_title: "Mandi Prices",
  price_wholesale_disclaimer:
    "These are wholesale market prices. Your price may differ by variety and grade. Please confirm locally before travelling.",
  price_modal: "Modal price",
  price_min: "Minimum",
  price_max: "Maximum",
  price_arrival: "Arrivals",
  price_markets_reporting: "Markets reporting",
  price_above_average: "Above recent average",
  price_below_average: "Below recent average",
  price_near_average: "Near recent average",
  price_set_alert: "Set a price alert",
  price_official_link: "Official source: Agmarknet / UPAg",
  price_transport_calc: "Transport cost calculator",

  calendar_title: "Crop Calendar",
  calendar_stage: "Stage",
  calendar_task: "Task",
  calendar_due: "Due",
  calendar_done: "Done",
  calendar_source: "Based on",

  diary_title: "Farm Diary",
  diary_add_entry: "Add entry",
  diary_expense: "Expense",
  diary_input: "Input used",
  diary_labor: "Labor",
  diary_yield: "Yield",
  diary_sale: "Sale",
  diary_note: "Note",
  diary_profit_summary: "Profit summary",
  diary_voice_note: "Record voice note",
  diary_export: "Export diary",

  assistant_title: "Ask Vayal Thunai",
  assistant_placeholder: "Ask about weather, prices, crops or schemes…",
  assistant_thinking: "Checking approved sources…",
  assistant_no_answer:
    "I don't have a reliable answer for that. Please ask your local Agriculture Officer or Krishi Vigyan Kendra (KVK).",
  assistant_kcc_line: "Kisan Call Centre (toll-free): 1800-180-1551",
  assistant_dosage_refusal:
    "I can't recommend doses or mixing ratios. Here is the relevant text from an approved source. Always confirm with your local Agriculture Officer or KVK before use.",
  assistant_confirm_officer:
    "Confirm with your local agriculture officer or KVK before use.",
  assistant_source_label: "Source",
  assistant_untrusted_notice:
    "This answer only uses information retrieved from approved documents, not general knowledge.",

  schemes_title: "Government Schemes",
  schemes_last_verified: "Last verified",
  schemes_official_link: "Official portal",
  schemes_disclaimer:
    "This is a summary only. It is not an eligibility decision. Apply only on the official portal.",

  photo_help_title: "Photo help (pest / disease)",
  photo_help_disclaimer:
    "This gives possible causes only, not a diagnosis. It can be wrong. Please confirm with your Agriculture Officer or KVK.",
  photo_help_take_photo: "Take a photo",
  photo_help_leaf_top: "Photo of leaf (top side)",
  photo_help_leaf_bottom: "Photo of leaf (underside)",
  photo_help_whole_plant: "Photo of whole plant",
  photo_help_confidence: "Confidence",
  photo_help_low_confidence_notice:
    "Confidence is low. Please add more photos or ask an expert.",

  privacy_title: "Your privacy",
  privacy_body:
    "Your farm, location and diary data stay on this device. We round your location before sending it for weather. We never send your name or exact address to outside services. You can export or delete your data anytime.",
  privacy_export: "Export my data",
  privacy_delete: "Delete my data",

  settings_title: "Settings",
  settings_language: "Language",
  settings_low_data_mode: "Low data mode",
  settings_backup: "Encrypted backup",
  settings_about: "About & sources",
} as const;

const ta: Partial<Record<DictKey, string>> = {
  app_name: "வயல் துணை",
  app_tagline: "தமிழ்நாடு விவசாய ஆலோசனை",
  nav_home: "முகப்பு",
  nav_weather: "வானிலை",
  nav_prices: "சந்தை விலை",
  nav_calendar: "பயிர் நாட்காட்டி",
  nav_diary: "குறிப்பேடு",
  nav_assistant: "கேளுங்கள்",
  nav_schemes: "அரசு திட்டங்கள்",
  nav_settings: "அமைப்புகள்",

  onboarding_welcome: "வணக்கம்",
  onboarding_choose_language: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
  onboarding_farmer_name: "உங்கள் பெயர்",
  onboarding_add_plot: "நிலத்தை சேர்க்கவும்",
  onboarding_plot_name: "நிலத்தின் பெயர்",
  onboarding_location: "கிராமம் / ஊர்",
  onboarding_area: "நிலத்தின் அளவு (ஏக்கர்)",
  onboarding_soil_type: "மண் வகை",
  onboarding_irrigation: "நீர்ப்பாசன ஆதாரம்",
  onboarding_crop: "பயிர்",
  onboarding_sowing_date: "விதை விதைத்த தேதி",
  onboarding_finish: "தொடங்குங்கள்",
  onboarding_use_gps: "என் இருப்பிடத்தைப் பயன்படுத்து",
  onboarding_search_location: "உங்கள் கிராமத்தைத் தேடுங்கள்",

  common_save: "சேமி",
  common_cancel: "ரத்து செய்",
  common_add: "சேர்",
  common_delete: "நீக்கு",
  common_edit: "திருத்து",
  common_back: "பின்",
  common_loading: "ஏற்றுகிறது…",
  common_offline: "நீங்கள் ஆஃப்லைனில் உள்ளீர்கள். கடைசியாக சேமித்த தரவு காட்டப்படுகிறது.",
  common_source: "ஆதாரம்",
  common_as_of: "நிலவரம்",
  common_retrieved: "சரிபார்க்கப்பட்டது",
  common_data_gap: "நம்பகமான தரவு இல்லை",
  common_confirm_locally: "இதன் படி செயல்படும் முன் உள்ளூரில் உறுதி செய்யவும்.",
  common_listen: "கேளுங்கள்",
  common_listen_again: "மீண்டும் கேளுங்கள்",
  common_explain_simply: "எளிமையாக விளக்குங்கள்",
  common_speak_question: "பேச அழுத்தி பிடிக்கவும்",

  weather_title: "வானிலை",
  weather_attribution: "வானிலை தரவு: Open-Meteo.com (CC BY 4.0)",
  weather_forecast: "முன்னறிவிப்பு",
  weather_last_updated: "கடைசியாக புதுப்பிக்கப்பட்டது",
  weather_stale_warning: "இந்த முன்னறிவிப்பு பழையது. புதுப்பிக்க இணையத்தை இணைக்கவும்.",
  weather_rain_chance: "மழை வாய்ப்பு",
  weather_temp: "வெப்பநிலை",
  weather_wind: "காற்று",
  weather_humidity: "ஈரப்பதம்",
  weather_et0: "நீர் ஆவியாதல் அளவு (ET0)",
  weather_soil_moisture: "மண் ஈரப்பதம்",
  weather_soil_temp: "மண் வெப்பநிலை",
  weather_official_warning: "இந்திய வானிலை ஆய்வு மைய (IMD) எச்சரிக்கை",
  weather_informational_notice: "வானிலை தகவல் வழிகாட்டுதலுக்கு மட்டுமே, உத்தரவாதம் அல்ல.",

  alert_no_spray_rain: "மருந்து தெளிக்க வேண்டாம் — விரைவில் மழை வரலாம்",
  alert_no_spray_wind: "மருந்து தெளிக்க வேண்டாம் — காற்று அதிகமாக உள்ளது",
  alert_irrigate_now: "நீர்ப்பாசனம் தேவை",
  alert_irrigate_skip: "நீர்ப்பாசனம் தவிர்க்கலாம் — சமீபத்திய மழை போதுமானது",
  alert_heat_stress: "இந்த பயிர் நிலைக்கு வெப்ப அழுத்த ஆபத்து",
  alert_cold_stress: "இந்த பயிர் நிலைக்கு குளிர் அழுத்த ஆபத்து",
  alert_flood_risk: "அதிக மழை / வெள்ள ஆபத்து",
  alert_harvest_window_good: "அறுவடை மற்றும் உலர்த்த நல்ல நேரம்",
  alert_harvest_window_bad: "அறுவடைக்கு பொருத்தமற்ற நேரம் — மழை வரலாம்",

  price_title: "சந்தை விலை",
  price_wholesale_disclaimer:
    "இவை மொத்த விற்பனை சந்தை விலைகள். வகை மற்றும் தரத்தைப் பொறுத்து உங்கள் விலை வேறுபடலாம். பயணிக்கும் முன் உள்ளூரில் உறுதி செய்யவும்.",
  price_modal: "பொதுவான விலை",
  price_min: "குறைந்தபட்சம்",
  price_max: "அதிகபட்சம்",
  price_arrival: "வரத்து அளவு",
  price_markets_reporting: "தெரிவித்த சந்தைகள்",
  price_above_average: "சமீபத்திய சராசரியை விட அதிகம்",
  price_below_average: "சமீபத்திய சராசரியை விட குறைவு",
  price_near_average: "சராசரிக்கு அருகில்",
  price_set_alert: "விலை எச்சரிக்கை அமைக்கவும்",
  price_official_link: "அதிகாரபூர்வ ஆதாரம்: Agmarknet / UPAg",
  price_transport_calc: "போக்குவரத்து செலவு கணிப்பான்",

  calendar_title: "பயிர் நாட்காட்டி",
  calendar_stage: "நிலை",
  calendar_task: "பணி",
  calendar_due: "முடிவு தேதி",
  calendar_done: "முடிந்தது",
  calendar_source: "ஆதாரம்",

  diary_title: "விவசாய குறிப்பேடு",
  diary_add_entry: "பதிவு சேர்",
  diary_expense: "செலவு",
  diary_input: "பயன்படுத்திய பொருள்",
  diary_labor: "கூலி",
  diary_yield: "விளைச்சல்",
  diary_sale: "விற்பனை",
  diary_note: "குறிப்பு",
  diary_profit_summary: "லாப சுருக்கம்",
  diary_voice_note: "குரல் குறிப்பு பதிவு",
  diary_export: "குறிப்பேட்டை ஏற்றுமதி செய்",

  assistant_title: "வயல் துணையிடம் கேளுங்கள்",
  assistant_placeholder: "வானிலை, விலை, பயிர் அல்லது திட்டங்கள் பற்றி கேளுங்கள்…",
  assistant_thinking: "அங்கீகரிக்கப்பட்ட ஆதாரங்களை சரிபார்க்கிறது…",
  assistant_no_answer:
    "இதற்கு நம்பகமான பதில் என்னிடம் இல்லை. தயவுசெய்து உங்கள் உள்ளூர் வேளாண் அதிகாரி அல்லது கிருஷி விஞ்ஞான கேந்திரத்தை (KVK) கேளுங்கள்.",
  assistant_kcc_line: "கிசான் கால் சென்டர் (கட்டணமில்லா): 1800-180-1551",
  assistant_dosage_refusal:
    "நான் மருந்தளவு அல்லது கலவை விகிதத்தை பரிந்துரைக்க முடியாது. அங்கீகரிக்கப்பட்ட ஆதாரத்தின் வரிகள் இங்கே. பயன்படுத்தும் முன் உங்கள் உள்ளூர் வேளாண் அதிகாரி அல்லது KVK-வுடன் உறுதி செய்யவும்.",
  assistant_confirm_officer: "பயன்படுத்தும் முன் உங்கள் உள்ளூர் வேளாண் அதிகாரி அல்லது KVK-வுடன் உறுதி செய்யவும்.",
  assistant_source_label: "ஆதாரம்",
  assistant_untrusted_notice:
    "இந்த பதில் அங்கீகரிக்கப்பட்ட ஆவணங்களில் இருந்து மட்டுமே பெறப்பட்ட தகவலைப் பயன்படுத்துகிறது.",

  schemes_title: "அரசு திட்டங்கள்",
  schemes_last_verified: "கடைசியாக சரிபார்க்கப்பட்டது",
  schemes_official_link: "அதிகாரபூர்வ போர்டல்",
  schemes_disclaimer:
    "இது ஒரு சுருக்கம் மட்டுமே. இது தகுதி முடிவு அல்ல. அதிகாரபூர்வ போர்டலில் மட்டுமே விண்ணப்பிக்கவும்.",

  photo_help_title: "புகைப்பட உதவி (பூச்சி / நோய்)",
  photo_help_disclaimer:
    "இது சாத்தியமான காரணங்களை மட்டுமே தருகிறது, நோய் கண்டறிதல் அல்ல. இது தவறாக இருக்கலாம். உங்கள் வேளாண் அதிகாரி அல்லது KVK-வுடன் உறுதி செய்யவும்.",
  photo_help_take_photo: "புகைப்படம் எடுக்கவும்",
  photo_help_leaf_top: "இலையின் மேல்பக்கப் புகைப்படம்",
  photo_help_leaf_bottom: "இலையின் அடிப்பக்கப் புகைப்படம்",
  photo_help_whole_plant: "முழு செடியின் புகைப்படம்",
  photo_help_confidence: "நம்பகத்தன்மை",
  photo_help_low_confidence_notice: "நம்பகத்தன்மை குறைவு. மேலும் புகைப்படங்கள் சேர்க்கவும் அல்லது நிபுணரை கேளுங்கள்.",

  privacy_title: "உங்கள் தனியுரிமை",
  privacy_body:
    "உங்கள் நிலம், இருப்பிடம் மற்றும் குறிப்பேடு தரவு இந்த சாதனத்திலேயே இருக்கும். வானிலைக்கு அனுப்பும் முன் உங்கள் இருப்பிடத்தை தோராயமாக்குகிறோம். உங்கள் பெயர் அல்லது முழு முகவரியை வெளி சேவைகளுக்கு அனுப்ப மாட்டோம். எப்போது வேண்டுமானாலும் உங்கள் தரவை ஏற்றுமதி செய்யலாம் அல்லது நீக்கலாம்.",
  privacy_export: "என் தரவை ஏற்றுமதி செய்",
  privacy_delete: "என் தரவை நீக்கு",

  settings_title: "அமைப்புகள்",
  settings_language: "மொழி",
  settings_low_data_mode: "குறைந்த தரவு பயன்முறை",
  settings_backup: "பாதுகாப்பான காப்பு பிரதி",
  settings_about: "பற்றி & ஆதாரங்கள்",
};

// Hindi / Telugu: stretch-goal dictionaries. Only a starter subset is filled;
// everything else falls back to English via `t()` below.
const hi: Partial<Record<DictKey, string>> = {
  app_name: "वायल तुणई",
  nav_home: "होम",
  nav_weather: "मौसम",
  nav_prices: "मंडी भाव",
  nav_calendar: "फसल कैलेंडर",
  nav_diary: "डायरी",
  nav_assistant: "पूछें",
  nav_schemes: "योजनाएं",
  nav_settings: "सेटिंग्स",
  common_save: "सहेजें",
  common_cancel: "रद्द करें",
};

const te: Partial<Record<DictKey, string>> = {
  app_name: "వయల్ తుణై",
  nav_home: "హోమ్",
  nav_weather: "వాతావరణం",
  nav_prices: "మార్కెట్ ధరలు",
  nav_calendar: "పంట క్యాలెండర్",
  nav_diary: "డైరీ",
  nav_assistant: "అడగండి",
  nav_schemes: "పథకాలు",
  nav_settings: "సెట్టింగ్‌లు",
  common_save: "సేవ్ చేయి",
  common_cancel: "రద్దు చేయి",
};

const dictionaries: Record<LanguageCode, Partial<Record<DictKey, string>>> = {
  en,
  ta,
  hi,
  te,
};

export function translate(lang: LanguageCode, key: DictKey): string {
  return dictionaries[lang]?.[key] ?? en[key] ?? key;
}

export const supportedLanguages: { code: LanguageCode; label: string; complete: boolean }[] = [
  { code: "ta", label: "தமிழ்", complete: true },
  { code: "en", label: "English", complete: true },
  { code: "hi", label: "हिन्दी", complete: false },
  { code: "te", label: "తెలుగు", complete: false },
];
