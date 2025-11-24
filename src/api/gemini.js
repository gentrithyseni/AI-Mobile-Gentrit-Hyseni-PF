// src/api/gemini.js (Groq / Llama 3.3 Powered)

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

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

// --- 1. KËSHILLTARI I AVANCUAR ---
export async function getFinancialAdvice(income, expense, balance, recentTransactions) {
  if (!GROQ_API_KEY || GROQ_API_KEY.includes("VENDOS")) return getFallbackAdvice();

  try {
    // E bëjmë prompt-in më strikt dhe analitik
    const prompt = `
      Vepro si një ekspert i lartë finance. Analizo këto të dhëna:
      - Të hyra: €${income}
      - Shpenzime: €${expense}
      - Bilanci: €${balance}
      - 5 Transaksionet e fundit: ${JSON.stringify(recentTransactions.map(t => `${t.category}: ${t.amount}€`))}
      
      Detyra:
      1. Identifiko një trend negativ (p.sh. shumë shpenzime në një kategori).
      2. Jep një zgjidhje konkrete, jo gjenerike.
      3. Përdor ton motivues por serioz.
      4. Përgjigju në SHQIP, maksimumi 2-3 fjali. Përdor emoji.
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
        temperature: 0.6, 
        max_tokens: 150
      }),
    });

    const data = await response.json();
    if (data.error) return getFallbackAdvice();
    return data.choices?.[0]?.message?.content || getFallbackAdvice();

  } catch (error) {
    return getFallbackAdvice();
  }
}

// --- 2. TRURI I RI: CHAT TO TRANSACTION ---
export async function parseTransactionWithAI(userText) {
  if (!GROQ_API_KEY || GROQ_API_KEY.includes("VENDOS")) {
    throw new Error("Mungon API Key");
  }

  try {
    const prompt = `
      Detyra jote është të konvertosh tekstin natyral në të dhëna JSON për një aplikacion finance.
      Teksti i userit: "${userText}"
      
      Kategoritë e lejuara: 'Ushqim', 'Transport', 'Qira', 'Argëtim', 'Shëndet', 'Shopping', 'Fatura', 'Paga', 'Te Ardhura', 'Dhurata', 'Tjetër'.
      
      Rregullat:
      1. Gjej shumën (amount) si numër.
      2. Gjej kategorinë më të përshtatshme nga lista.
      3. Përcakto tipin ('income' ose 'expense').
      4. Krijo një përshkrim të shkurtër (notes).
      5. Kthe VETËM kodin JSON, pa asnjë tekst tjetër.
      
      Shembull Output:
      { "amount": 5.5, "category": "Ushqim", "type": "expense", "notes": "Sanduic dhe cola" }
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
        temperature: 0.1, // Shumë preciz, pak kreativitet
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Pastrim nëse AI kthen tekst shtesë (p.sh. ```json ... ```)
    const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("AI Parse Error:", error);
    return null;
  }
}