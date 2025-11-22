const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

function getFallbackAdvice() {
  const tips = [
    "💡 Mundohu të kursesh 20% të të ardhurave këtë muaj.",
    "📉 Shpenzimet po rriten. Shiko ku mund të shkurtosh.",
    "🚀 Bilanci duket mirë! Vazhdo kështu.",
    "💰 Konsidero të investosh tepricën.",
    "📊 Kategoria 'Ushqim' po zë pjesën më të madhe.",
    "🛡️ Krijo një fond emergjence për ditë të vështira."
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

export async function getFinancialAdvice(income, expense, balance, recentTransactions) {
  // Nëse nuk ka API key ose jemi në rajon të bllokuar, kthe direkt fallback
  if (!GEMINI_API_KEY || GEMINI_API_KEY.includes("VENDOS")) {
    return getFallbackAdvice();
  }

  try {
    const prompt = `
      Vepro si këshilltar financiar. 
      Të hyra: €${income}, Shpenzime: €${expense}, Bilanci: €${balance}.
      Jep 1 këshillë të shkurtër në Shqip (max 15 fjalë) me emoji.
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    const data = await response.json();
    
    // Nëse ka error nga Google (p.sh. Free Tier not available), kthe fallback
    if (data.error) {
      console.log("Gemini Error (Ignored):", data.error.message);
      return getFallbackAdvice();
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || getFallbackAdvice();

  } catch (error) {
    // Çdo error rrjeti kthen fallback
    return getFallbackAdvice();
  }
}