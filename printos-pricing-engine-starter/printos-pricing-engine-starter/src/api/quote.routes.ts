import express from 'express';
import { z } from 'zod';
import { calculateQuote, toCustomerQuote } from '../pricing/index';
import { pricingContext } from '../db/in-memory-data';

const router = express.Router();

const baseSchema = z.object({
  productType: z.enum(['quick_paper', 'offset']),
  role: z.enum(['admin', 'sale', 'customer']).default('admin'),
}).passthrough();

router.post('/quotes/calculate', (req, res) => {
  try {
    const parsed = baseSchema.parse(req.body);
    const result = calculateQuote(parsed as any, pricingContext);
    if (parsed.role === 'customer') return res.json(toCustomerQuote(result));
    return res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi tính giá không xác định';
    return res.status(400).json({ error: message });
  }
});

export default router;
