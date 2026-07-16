export interface CheckoutSessionDetails {
  planId: string;
  provider: 'stripe' | 'razorpay' | 'paddle';
  couponCode?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

/**
 * Validates a discount coupon code and calculates subtotals.
 */
export function calculateCheckoutPricing(
  planId: string,
  priceMonthly: number,
  couponCode?: string
): CheckoutSessionDetails {
  let discount = 0;
  const normalized = couponCode?.toUpperCase().trim() || '';

  if (normalized === 'SAVE20') {
    discount = Number((priceMonthly * 0.2).toFixed(2));
  } else if (normalized === 'FREEPRO') {
    discount = priceMonthly;
  }

  const subtotal = priceMonthly;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Number((taxableAmount * 0.18).toFixed(2)); // 18% standard SaaS tax
  const total = Number((taxableAmount + tax).toFixed(2));

  return {
    planId,
    provider: 'stripe',
    couponCode: normalized || undefined,
    subtotal,
    discount,
    tax,
    total
  };
}

/**
 * Simulates executing payment confirmation tokens from Stripe/Razorpay.
 */
export async function executeMockCharge(
  details: CheckoutSessionDetails,
  paymentDetails: { cardNumber: string; cvc: string }
): Promise<{ success: boolean; transactionId: string; error?: string }> {
  // Simulates gateway network hop latency
  await new Promise(resolve => setTimeout(resolve, 600));

  if (!paymentDetails.cardNumber || paymentDetails.cardNumber.length < 16) {
    return { success: false, transactionId: '', error: 'Card validation failed. Check your digit count.' };
  }

  return {
    success: true,
    transactionId: `ch_${details.provider}_${Math.random().toString(36).substring(5)}`
  };
}
