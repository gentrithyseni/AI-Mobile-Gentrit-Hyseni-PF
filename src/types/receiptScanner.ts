import { z } from 'zod';

// 1. Define the Core Data Schema (The "Truth")
export const ReceiptItemSchema = z.object({
  description: z.string().min(1, "Item description is required"),
  quantity: z.number().min(0).optional().default(1),
  unitPrice: z.number().min(0).optional(),
  total: z.number().min(0),
});

export const ReceiptSchema = z.object({
  merchantName: z.string().min(1, "Merchant name is missing").describe("The name of the store or vendor"),
  date: z.string().datetime().describe("ISO 8601 date string of the transaction"),
  totalAmount: z.number().positive("Total amount must be positive"),
  currency: z.enum(['EUR', 'USD', 'ALL']).default('EUR'),
  category: z.enum([
    'Ushqim', 
    'Transport', 
    'Argëtim', 
    'Shërbime', 
    'Tjetër'
  ]).describe("Inferred category based on items"),
  items: z.array(ReceiptItemSchema).optional().describe("List of line items found on the receipt"),
  confidence: z.number().min(0).max(1).describe("AI confidence score for the extraction"),
});

// 2. Export TypeScript Types derived from Zod
export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;
export type ReceiptData = z.infer<typeof ReceiptSchema>;

// 3. Define the Module Interface (The "Contract")
export interface IReceiptScannerService {
  /**
   * Processes an image and extracts receipt data.
   * @param imageBase64 - The base64 encoded string of the receipt image.
   * @returns A promise that resolves to the validated ReceiptData.
   * @throws {ZodError} If validation fails.
   * @throws {Error} If AI processing fails.
   */
  scanReceipt(imageBase64: string): Promise<ReceiptData>;

  /**
   * Validates if the raw AI response matches our schema.
   * @param rawData - The raw JSON object from the AI.
   */
  validateReceipt(rawData: unknown): ReceiptData;
}
