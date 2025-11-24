// src/api/groq.js (Groq / Llama 3.3 Powered)

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

// --- 1. KËSHILLTARI I AVANCUAR + ROAST MASTER ---
export async function getFinancialAdvice(income, expense, balance, recentTransactions) {
  if (!GROQ_API_KEY || GROQ_API_KEY.includes("VENDOS")) return getFallbackAdvice();

  try {
    // Prompt i përmirësuar për të hequr etiketat "Ofendon:"
    const prompt = `
      Vepro si një ekspert i lartë finance që ka edhe sens humori të zi. Analizo këto të dhëna:
      - Të hyra: €${income}
      - Shpenzime: €${expense}
      - Bilanci: €${balance}
      - Transaksionet e fundit: ${JSON.stringify(recentTransactions.map(t => `${t.category}: ${t.amount}€`))}
      
      Struktura e përgjigjes (Ndiqe fiks këtë strukturë):
      1. Jep një këshillë serioze dhe konkrete financiare (max 1 fjali). Përdor emoji.
      2. Menjëherë pas saj (në rresht të ri), bëj një koment "thumbues" (roast) për shpenzimet e mia.Nje ose dy emoji ne fund(Max 1 fjali)
      
      RREGULLAT E ARTË (STRIKTE):
      - MOS shkruaj fjalë si "Ofendim:", "Humor:", "Shaka:", "Roast:" në fillim të fjalisë.
      - Filloje shakanë direkt.
      - Përdor gjuhën SHQIP.
      - Bëhu pak i vrazhdë me humor ("mean comedian").
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
    if (data.error) return getFallbackAdvice();
    
    // Pastrim ekstra në rast se AI nuk bindet
    let content = data.choices?.[0]?.message?.content || getFallbackAdvice();
    content = content.replace(/^(Ofendim|Humor|Shaka|Roast):/i, "").trim();
    
    return content;

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
      Ti je një asistent që konverton tekstin natyral në JSON.
      Teksti i userit: "${userText}"
      
      Kategoritë e lejuara: 'Ushqim', 'Transport', 'Qira', 'Argëtim', 'Shëndet', 'Shopping', 'Fatura', 'Paga', 'Te Ardhura', 'Dhurata', 'Tjetër'.
      
      Rregullat:
      1. Gjej shumën (amount) si numër (p.sh. 5.5).
      2. Zgjidh kategorinë më të përshtatshme nga lista.
      3. Përcakto 'type': 'expense' (shpenzim) ose 'income' (të ardhura).
      4. Krijo një përshkrim të shkurtër (notes) nga teksti.
      5. Kthe VETËM objektin JSON, pa asnjë tekst shtesë.
      
      Shembull:
      User: "Bleva kafe 2 euro"
      Output: { "amount": 2, "category": "Ushqim", "type": "expense", "notes": "Kafe" }
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
        temperature: 0.1, // Shumë preciz
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Pastrim i përgjigjes nga AI (nganjëherë shton backticks)
    const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("AI Parse Error:", error);
    return null;
  }
}