import supabaseClient from '../config/supabase';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

// --- Cache System ---
let adviceCache = {
  key: '',
  data: '',
  timestamp: 0
};

// --- PLAN B: Nëse AI dështon ---
function getFallbackAdvice() {
  const tips = [
    "💡 Rregulli 50/30/20: 50% Nevoja, 30% Dëshira, 20% Kursime/Borxhe.",
    "📉 Shpenzimet e vogla ditore (si kafe/duhan) krijojnë shuma të mëdha mujore.",
    "🚀 Investo në vetvete: Librat dhe kurset kanë kthimin më të lartë.",
    "💰 Krijo një fond emergjence: Syno të kesh 3 rroga mënjanë.",
    "📊 Rishiko abonimet (Netflix, Spotify): A i përdor të gjitha?"
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

export async function saveAiFeedback(userId, adviceText, rating) {
  try {
    await supabaseClient.from('ai_feedback').insert([{
      user_id: userId,
      advice_text: adviceText,
      rating: rating
    }]);
  } catch (e) {
    console.error("Failed to save feedback", e);
  }
}

async function getFeedbackHistory(userId) {
  try {
    const { data } = await supabaseClient
      .from('ai_feedback')
      .select('advice_text, rating')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!data || data.length === 0) return "";

    const likes = data.filter(f => f.rating === 'like').map(f => f.advice_text).join(" | ");
    const dislikes = data.filter(f => f.rating === 'dislike').map(f => f.advice_text).join(" | ");

    let historyText = "";
    if (likes) historyText += `\nPërdoruesit i kanë pëlqyer këto këshilla në të kaluarën (përdor stil të ngjashëm): ${likes}`;
    if (dislikes) historyText += `\nPërdoruesit NUK i kanë pëlqyer këto këshilla (mos përdor këtë stil): ${dislikes}`;
    
    return historyText;
  } catch (e) {
    return "";
  }
}

// --- 1. KËSHILLTARI I AVANCUAR + ROAST MASTER ---
export async function getFinancialAdvice(income, expense, balance, recentTransactions, topCategories = [], userId = null) {
  if (!GROQ_API_KEY || GROQ_API_KEY.includes("VENDOS")) return getFallbackAdvice();

  // 1. Check Cache
  const cacheKey = JSON.stringify({ 
    income, 
    expense, 
    balance, 
    topCats: topCategories.map(c => c.category), // Only care about category names for cache key
    recentTxIds: recentTransactions.map(t => t.id) // Only care about IDs
  });
  
  const now = Date.now();
  const CACHE_DURATION = 60 * 1000; // 1 Minute Cache (Reduced from 15)

  if (adviceCache.key === cacheKey && (now - adviceCache.timestamp) < CACHE_DURATION) {
    console.log("Returning cached advice (saving API calls)");
    return adviceCache.data;
  }

  try {
    let feedbackContext = "";
    if (userId) {
      feedbackContext = await getFeedbackHistory(userId);
    }

    const styles = [
        "Fokusohu tek kursimet e vogla.",
        "Fokusohu tek investimet afatgjata.",
        "Bëhu shumë sarkastik për shpenzimet e panevojshme.",
        "Bëhu inkurajues dhe pozitiv.",
        "Përdor metafora nga futbolli ose sporti.",
        "Krahaso shpenzimet me gjëra qesharake.",
        "Fokusohu tek balanci mujor.",
        "Jep një këshillë filozofike për paranë."
    ];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];

    // Prompt i përmirësuar për të hequr etiketat "Ofendon:"
    const prompt = `
      Vepro si një ekspert dhe keshilltar i lartë financiar që ka edhe sens humori të zi. Analizo këto të dhëna:
      - Të hyra: €${income}
      - Shpenzime: €${expense}
      - Bilanci: €${balance}
      - Top Kategoritë e shpenzimeve: ${topCategories.map(c => `${c.category} (${c.amount}€)`).join(', ')}
      - Transaksionet e fundit: ${JSON.stringify(recentTransactions.map(t => `${t.category}: ${t.amount}€`))}
      
      ${feedbackContext}
      
      Stili i përgjigjes sot: ${randomStyle}

      Struktura e përgjigjes (Ndiqe fiks këtë strukturë):
      1. Jep një këshillë serioze dhe konkrete financiare (max 1 fjali). Përdor emoji. MOS i përsërit shifrat e mia, shko direkt tek thelbi.
      2. Menjëherë pas saj (në rresht të ri), bëj një koment "thumbues" por me humor (roast) për shpenzimet e mia. Mos u bëj ofendues apo i vrazhdë, por përdor sarkazëm inteligjente dhe qesharake. Qëllimi është të qeshim, jo të ofendohemi. (Max 1 fjali).
      
      RREGULLAT E ARTË (STRIKTE):
      - MOS shkruaj fjalë si "Ofendim:", "Humor:", "Shaka:", "Roast:" në fillim të fjalisë.
      - Filloje shakanë direkt.
      - Përdor gjuhën SHQIP.
      - Bëhu si një shok që bën shaka, jo si një gjykatës i ashpër.
    `;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", 
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7, // Pak më kreativ për humorin
        max_tokens: 200
      }),
    });

    const data = await response.json();
    if (data.error) {
        console.warn("Groq API Error (Advice):", data.error.message);
        return getFallbackAdvice();
    }
    
    // Pastrim ekstra në rast se AI nuk bindet
    let content = data.choices?.[0]?.message?.content || getFallbackAdvice();
    content = content.replace(/^(Ofendim|Humor|Shaka|Roast):/i, "").trim();
    
    // Update Cache
    adviceCache = {
        key: cacheKey,
        data: content,
        timestamp: Date.now()
    };

    return content;

  } catch (_error) {
    return getFallbackAdvice();
  }
}

// --- 2. TRURI I RI: CHAT TO TRANSACTION ---
export async function parseUserIntent(userText, existingGoals = []) {
  if (!GROQ_API_KEY || GROQ_API_KEY.includes("VENDOS")) {
    throw new Error("Mungon API Key");
  }

  try {
    const goalNames = existingGoals.map(g => g.title).join(", ");
    
    const prompt = `
      Ti je një asistent financiar inteligjent. Analizo kërkesën e përdoruesit: "${userText}"
      
      Qëllimet ekzistuese në databazë: [${goalNames}]
      
      Detyra jote është të kuptosh qëllimin e përdoruesit dhe të kthesh një JSON objekt me fushën "action".
      
      SKENARËT:
      
      1. KRIJIM I QËLLIMIT TË RI
      Fjalë kyçe: "krijo qellim", "synim i ri", "mbledh para per", "dua te blej".
      Output JSON: 
      { 
        "action": "create_goal", 
        "title": "Emri i Qëllimit (psh. Banesa e re)", 
        "target_amount": 25000, 
        "current_amount": 1200 (nëse përdoruesi thotë se i ka tashmë, përndryshe 0),
        "icon": "🏠" (zgjidh një ikonë emoji që përshtatet)
      }
      
      2. SHTIM PARASH NË QËLLIM EKZISTUES
      Fjalë kyçe: "shto tek qellimi", "kursej per", "për banesën".
      Output JSON:
      {
        "action": "add_to_goal",
        "goal_title": "Emri i Qëllimit (zgjidh nga lista e qëllimeve ekzistuese nëse përshtatet)",
        "amount": 100
      }
      
      3. TRANSAKSION NORMAL (SHPENZIM OSE TË ARDHURA)
      Fjalë kyçe: "bleva", "pagova", "shpenzova", "mora rrogën".
      Kategoritë e lejuara: 'Ushqim', 'Transport', 'Qira', 'Argëtim', 'Shëndet', 'Shopping', 'Fatura', 'Paga', 'Te Ardhura', 'Dhurata', 'Tjetër'.
      Output JSON:
      {
        "action": "transaction",
        "amount": 5.5,
        "category": "Ushqim",
        "type": "expense" (ose "income"),
        "notes": "Përshkrimi i shkurtër"
      }

      4. KOMBINIM / LLOGARITJE NETO (E RËNDËSISHME)
      Nëse përdoruesi përmend dy ose më shumë shuma (psh. "shpenzova 4.65 por fitova 5"):
      - Llogarit shumën NETO (Të hyra - Shpenzime).
      - Nëse del pozitive (+): type="income", category="Te Ardhura" (ose burimi kryesor), amount=Neto.
      - Nëse del negative (-): type="expense", category="Tjetër" (ose shpenzimi kryesor), amount=Neto (pozitive).
      - Tek "notes" shpjego llogaritjen (psh. "Fitova 5 - Kafe 4.65").
      
      RREGULL: Kthe VETËM objektin JSON, pa asnjë tekst tjetër.
    `;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", 
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1, // Shumë preciz për JSON
        max_tokens: 300
      }),
    });

    const data = await response.json();
    
    if (data.error) {
        console.error("Groq API Error (Intent):", data.error);
        return null;
    }

    let content = data.choices?.[0]?.message?.content;
    
    // Pastrim JSON nëse ka tekst shtesë
    const jsonMatch = content && content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        content = jsonMatch[0];
    }

    return content ? JSON.parse(content) : null;

  } catch (error) {
    console.error("Groq Error:", error);
    return null;
  }
}

export async function parseTransactionWithAI(userText) {
    // Legacy wrapper for backward compatibility if needed, or just redirect
    return parseUserIntent(userText, []);
}