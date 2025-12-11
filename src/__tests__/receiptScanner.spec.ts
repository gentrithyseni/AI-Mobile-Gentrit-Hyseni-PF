import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReceiptScannerService } from '../services/receiptScannerLogic';

// Mock global fetch
const globalFetch = global.fetch = vi.fn();

describe('ReceiptScannerService', () => {
  const mockApiKey = 'test-api-key';
  
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.EXPO_PUBLIC_GROQ_API_KEY = mockApiKey;
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_GROQ_API_KEY;
  });

  // --- Hapi A: Happy Path ---
  it('should successfully parse a valid receipt from AI', async () => {
    const mockResponseData = {
      choices: [{
        message: {
          content: JSON.stringify({
            merchantName: "Spar",
            date: "2023-10-27T10:00:00.000Z",
            totalAmount: 15.50,
            currency: "EUR",
            category: "Ushqim",
            items: [{ description: "Milk", quantity: 1, unitPrice: 1.50, total: 1.50 }],
            confidence: 0.95
          })
        }
      }]
    };

    globalFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponseData
    } as Response);

    const result = await ReceiptScannerService.scanReceipt('base64image');

    expect(result.merchantName).toBe('Spar');
    expect(result.totalAmount).toBe(15.50);
    expect(result.category).toBe('Ushqim');
    expect(globalFetch).toHaveBeenCalledTimes(1);
  });

  // --- Hapi B: Edge Cases (Sulmi Kibernetik) ---

  it('should handle AI returning invalid JSON (Hallucination)', async () => {
    const mockResponseData = {
      choices: [{
        message: {
          content: "Sorry, I cannot read this image." // Not JSON
        }
      }]
    };

    globalFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponseData
    } as Response);

    await expect(ReceiptScannerService.scanReceipt('base64image'))
      .rejects
      .toThrow("Parsing Error: Failed to parse AI response as JSON.");
  });

  it('should handle AI returning JSON wrapped in markdown', async () => {
    const jsonContent = JSON.stringify({
        merchantName: "Tech Store",
        date: "2023-10-27T10:00:00.000Z",
        totalAmount: 100,
        currency: "EUR",
        category: "Tjetër",
        confidence: 0.9
    });

    const mockResponseData = {
      choices: [{
        message: {
          content: `Here is the data: \`\`\`json\n${jsonContent}\n\`\`\``
        }
      }]
    };

    globalFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponseData
    } as Response);

    const result = await ReceiptScannerService.scanReceipt('base64image');
    expect(result.merchantName).toBe('Tech Store');
  });

  it('should throw validation error for negative amounts (Zod Schema Check)', async () => {
    const mockResponseData = {
      choices: [{
        message: {
          content: JSON.stringify({
            merchantName: "Bad Store",
            date: "2023-10-27T10:00:00.000Z",
            totalAmount: -50, // Invalid!
            currency: "EUR",
            category: "Ushqim",
            confidence: 0.9
          })
        }
      }]
    };

    globalFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponseData
    } as Response);

    await expect(ReceiptScannerService.scanReceipt('base64image'))
      .rejects
      .toThrow(/Validation Error/);
  });

  it('should handle API 500 errors gracefully', async () => {
    globalFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error"
    } as Response);

    await expect(ReceiptScannerService.scanReceipt('base64image'))
      .rejects
      .toThrow("API Error: 500 Internal Server Error");
  });

  it('should throw error if API Key is missing', async () => {
    delete process.env.EXPO_PUBLIC_GROQ_API_KEY;
    
    await expect(ReceiptScannerService.scanReceipt('base64image'))
      .rejects
      .toThrow("Configuration Error: GROQ_API_KEY is missing.");
  });
});
