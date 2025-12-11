import { IReceiptScannerService, ReceiptData, ReceiptSchema } from '../types/receiptScanner';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

export const ReceiptScannerService: IReceiptScannerService = {
  async scanReceipt(imageBase64: string): Promise<ReceiptData> {
    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error("Configuration Error: GROQ_API_KEY is missing.");
    }

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: VISION_MODEL,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this receipt image and extract the following data in strict JSON format matching this structure:
                  {
                    "merchantName": "string",
                    "date": "ISO 8601 date string (YYYY-MM-DDTHH:mm:ss.sssZ)",
                    "totalAmount": number,
                    "currency": "EUR" | "USD" | "ALL",
                    "category": "Ushqim" | "Transport" | "Argëtim" | "Shërbime" | "Tjetër",
                    "items": [{"description": "string", "quantity": number, "unitPrice": number, "total": number}],
                    "confidence": number (0-1)
                  }
                  Ensure the JSON is valid. Do not include markdown formatting like \`\`\`json.`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Groq API Error Body:", errorBody);
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("AI Error: Received empty response from Groq.");
      }

      let parsedJson;
      try {
        parsedJson = JSON.parse(content);
      } catch (e) {
        // Fallback: Try to extract JSON if it's wrapped in text
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            parsedJson = JSON.parse(jsonMatch[0]);
        } else {
            throw new Error("Parsing Error: Failed to parse AI response as JSON.");
        }
      }

      return this.validateReceipt(parsedJson);

    } catch (error: any) {
      // Re-throw known errors with context if needed, or just let them bubble up
      if (error.message.startsWith("Validation Error") || error.message.startsWith("Configuration Error") || error.message.startsWith("API Error") || error.message.startsWith("Parsing Error")) {
          throw error;
      }
      throw new Error(`Processing Error: ${error.message}`);
    }
  },

  validateReceipt(rawData: unknown): ReceiptData {
    const result = ReceiptSchema.safeParse(rawData);
    if (!result.success) {
        // Use 'issues' or cast to any if types are fighting us
        const issues = result.error.issues || (result.error as any).errors;
        const errorMessages = issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(", ");
        throw new Error(`Validation Error: ${errorMessages}`);
    }
    return result.data;
  }
};
