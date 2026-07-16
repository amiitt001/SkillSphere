'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { auth } from '@/lib/firebase';
import type { 
  UserSubscription, 
  UsageQuotas, 
  BillingInvoice, 
  BusinessFinancials 
} from '@/services/billing/types';

export default function BillingPage() {
  return (
    <ProtectedRoute>
      <BillingDashboardContent />
    </ProtectedRoute>
  );
}

function BillingDashboardContent() {
  // Subscription info
  const [sub, setSub] = useState<UserSubscription | null>(null);
  const [quotas, setQuotas] = useState<UsageQuotas | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [loadingSub, setLoadingSub] = useState(true);

  // Financial aggregates
  const [financials, setFinancials] = useState<BusinessFinancials | null>(null);

  // checkout form states
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  const [coupon, setCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [checkoutDetails, setCheckoutDetails] = useState<any | null>(null);

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cvc, setCvc] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'checkout' | 'quotas' | 'financials'>('checkout');

  useEffect(() => {
    loadSubscriptionDetails();
    loadFinancials();
  }, []);

  const loadSubscriptionDetails = async () => {
    setLoadingSub(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};

      const [subRes, quotaRes, invoiceRes] = await Promise.all([
        fetch('/api/billing/subscription', {headers}),
        fetch('/api/billing/usage', {headers}),
        fetch('/api/billing/invoices', {headers})
      ]);

      if (subRes.ok) {
        const d = await subRes.json();
        if (d.success) setSub(d.subscription);
      }
      if (quotaRes.ok) {
        const d = await quotaRes.json();
        if (d.success) setQuotas(d.quotas);
      }
      if (invoiceRes.ok) {
        const d = await invoiceRes.json();
        if (d.success) setInvoices(d.invoices);
      }
    } catch (err) {
      console.error('Error loading subscription stats:', err);
    } finally {
      setLoadingSub(false);
    }
  };

  const loadFinancials = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};
      const res = await fetch('/api/billing/analytics', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setFinancials(d.financials);
      }
    } catch (err) {
      console.error('Error loading financials:', err);
    }
  };

  // Calculates subtotal / tax details from endpoint
  const handleOpenCheckout = async (planId: string, price: number) => {
    setSelectedPlanId(planId);
    setSelectedPrice(price);
    setCoupon('');
    setCouponError('');
    setPaymentError('');
    setCheckoutDetails(null);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/billing/payment-intent', {
        method: 'POST',
        headers,
        body: JSON.stringify({ planId, priceMonthly: price })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success) setCheckoutDetails(d.checkoutDetails);
      }
    } catch (err) {
      console.error('Error opening checkout intent:', err);
    }
  };

  const handleApplyCoupon = async () => {
    setCouponError('');
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/billing/payment-intent', {
        method: 'POST',
        headers,
        body: JSON.stringify({ planId: selectedPlanId, priceMonthly: selectedPrice, couponCode: coupon })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setCheckoutDetails(d.checkoutDetails);
          if (d.checkoutDetails.discount === 0 && coupon) {
            setCouponError('Invalid coupon code entered');
          }
        }
      }
    } catch (err) {
      console.error('Error applying coupon:', err);
    }
  };

  const handleConfirmCheckout = async () => {
    setPaymentError('');
    if (!cardNumber || cardNumber.length < 16) {
      setPaymentError('Card validation failed. Check your digit count.');
      return;
    }
    setPaying(true);

    try {
      // Simulate card charge latency
      await new Promise(resolve => setTimeout(resolve, 800));

      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers,
        body: JSON.stringify({ checkoutDetails })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setSub(d.subscription);
          setSelectedPlanId(null);
          setCardNumber('');
          setCvc('');
          // Refresh active usage counts and invoice feeds
          loadSubscriptionDetails();
          loadFinancials();
        }
      }
    } catch (err) {
      console.error('Error confirmation checking out:', err);
      setPaymentError('Network execution failure. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: '3rem' }}>
      
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div className="section-eyebrow" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-clay)' }}>Monetization & Billing</div>
        <h1 className="page-title" style={{ fontSize: '2.25rem', color: 'var(--text-primary)', margin: '0.5rem 0' }}>SaaS Subscription Workspace</h1>
        <p className="page-subtitle" style={{ color: 'var(--text-muted)' }}>
          Upgrade your plan tier, verify active usage quotas, and manage invoices details securely.
        </p>
      </div>

      {/* Tabs */}
      <div className="difficulty-selector" style={{ marginBottom: '2rem', background: 'rgba(25, 23, 21, 0.65)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '0.25rem' }}>
        <button className={`difficulty-option ${activeTab === 'checkout' ? 'active' : ''}`} onClick={() => setActiveTab('checkout')} style={{ flex: 1 }}>💳 Plans Pricing checkout</button>
        <button className={`difficulty-option ${activeTab === 'quotas' ? 'active' : ''}`} onClick={() => setActiveTab('quotas')} style={{ flex: 1 }}>📊 Quota usages tracking</button>
        <button className={`difficulty-option ${activeTab === 'financials' ? 'active' : ''}`} onClick={() => setActiveTab('financials')} style={{ flex: 1 }}>📈 Platform ARR/MRR Metrics</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left main pane */}
        <div>

          {/* TAB 1: PLANS PRICING CHECKOUT */}
          {activeTab === 'checkout' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {sub && (
                <div className="quiz-card animate-fade-up" style={{ background: 'rgba(212,163,115,0.03)', border: '1px solid rgba(212,163,115,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Your active Subscription Plan</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Cycle ends at: {new Date(sub.cycleEndsAt).toLocaleDateString()}</p>
                  </div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-clay)' }}>{sub.planId.toUpperCase()} tier</span>
                </div>
              )}

              {/* Pricing Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                
                {/* Plan 1: Free */}
                <div className="quiz-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '300px' }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>Free</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', margin: '0.5rem 0' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 800 }}>$0</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>/mo</span>
                    </div>
                    <ul style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <li>20 AI prompts limits</li>
                      <li>3 Resume scans analyses</li>
                      <li>Basic Career Advisor recommendations</li>
                    </ul>
                  </div>
                  <button 
                    disabled={sub?.planId === 'free'}
                    onClick={() => handleOpenCheckout('free', 0)}
                    style={{ width: '100%', padding: '0.4rem', background: sub?.planId === 'free' ? 'rgba(255,255,255,0.03)' : 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8rem' }}
                  >
                    {sub?.planId === 'free' ? 'Active' : 'Choose plan'}
                  </button>
                </div>

                {/* Plan 2: Pro */}
                <div className="quiz-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '300px', border: '1px solid var(--accent-clay)' }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', background: 'rgba(212,163,115,0.1)', color: 'var(--accent-clay)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>Pro</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', margin: '0.5rem 0' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 800 }}>$9</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>/mo</span>
                    </div>
                    <ul style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <li>1000 AI requests limits</li>
                      <li>100 Resume scans analyses</li>
                      <li>AI Interview preparations checklists</li>
                      <li>Priority LLM prompt processing</li>
                    </ul>
                  </div>
                  <button 
                    disabled={sub?.planId === 'pro'}
                    onClick={() => handleOpenCheckout('pro', 9)}
                    style={{ width: '100%', padding: '0.4rem', background: sub?.planId === 'pro' ? 'rgba(255,255,255,0.03)' : 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8rem' }}
                  >
                    {sub?.planId === 'pro' ? 'Active' : 'Choose plan'}
                  </button>
                </div>

                {/* Plan 3: Recruiter */}
                <div className="quiz-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '300px' }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>Recruiter</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', margin: '0.5rem 0' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 800 }}>$99</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>/mo</span>
                    </div>
                    <ul style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <li>5000 AI requests limits</li>
                      <li>500 Resume scans analyses</li>
                      <li>Search & Rank placements candidates</li>
                      <li>Recruiting analytical score feeds</li>
                    </ul>
                  </div>
                  <button 
                    disabled={sub?.planId === 'recruiter'}
                    onClick={() => handleOpenCheckout('recruiter', 99)}
                    style={{ width: '100%', padding: '0.4rem', background: sub?.planId === 'recruiter' ? 'rgba(255,255,255,0.03)' : 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8rem' }}
                  >
                    {sub?.planId === 'recruiter' ? 'Active' : 'Choose plan'}
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: QUOTA USAGES TRACKING */}
          {activeTab === 'quotas' && quotas && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--accent-clay)' }}>Active usage quotas</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span>AI prompt requests</span>
                      <strong>{quotas.aiRequests.used} / {quotas.aiRequests.limit}</strong>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                      <div style={{ width: `${Math.min(100, (quotas.aiRequests.used / quotas.aiRequests.limit) * 100)}%`, height: '100%', background: 'var(--accent-clay)', borderRadius: '3px' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span>Resume scans analyses</span>
                      <strong>{quotas.resumeScans.used} / {quotas.resumeScans.limit}</strong>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                      <div style={{ width: `${Math.min(100, (quotas.resumeScans.used / quotas.resumeScans.limit) * 100)}%`, height: '100%', background: 'var(--accent-clay)', borderRadius: '3px' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span>Mock interview practices</span>
                      <strong>{quotas.mockInterviews.used} / {quotas.mockInterviews.limit}</strong>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                      <div style={{ width: `${Math.min(100, (quotas.mockInterviews.used / quotas.mockInterviews.limit) * 100)}%`, height: '100%', background: 'var(--accent-clay)', borderRadius: '3px' }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: PLATFORM ARR/MRR METRICS */}
          {activeTab === 'financials' && financials && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                <div className="quiz-card" style={{ textAlign: 'center', background: 'rgba(25, 23, 21, 0.45)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monthly Recurring Revenue</span>
                  <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: '0.5rem' }}>${financials.mrr} MRR</h3>
                </div>
                <div className="quiz-card" style={{ textAlign: 'center', background: 'rgba(25, 23, 21, 0.45)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Annualized Run Rate</span>
                  <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: '0.5rem' }}>${financials.arr} ARR</h3>
                </div>
                <div className="quiz-card" style={{ textAlign: 'center', background: 'rgba(25, 23, 21, 0.45)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Profitability Margin</span>
                  <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-clay)', marginTop: '0.5rem' }}>{financials.profitabilityPct}%</h3>
                </div>
              </div>

              {/* Plan distribution details */}
              <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '1.25rem', color: 'var(--accent-clay)' }}>Plans user distributions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', textAlign: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Free plan</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{financials.planDistribution.free}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pro plan</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{financials.planDistribution.pro}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Recruiter</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{financials.planDistribution.recruiter}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>University</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{financials.planDistribution.university}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Enterprise</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{financials.planDistribution.enterprise}</div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Column: Invoices summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.45)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>Payment Invoices</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '340px', overflowY: 'auto' }}>
              {invoices.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No payment histories logged.</p>
              ) : (
                invoices.map((inv) => (
                  <div key={inv.id} style={{ fontSize: '0.7rem', padding: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <span>Invoice: <strong>{inv.id}</strong> ({new Date(inv.date).toLocaleDateString()})</span>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{inv.description}</p>
                    <span style={{ color: '#10b981' }}>${inv.amount} USD Paid</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ══ MOCK CHECKOUT GATEWAY MODAL ══ */}
      {selectedPlanId && checkoutDetails && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
          className="animate-fade-in"
        >
          <div className="quiz-card" style={{ width: '100%', maxWidth: '440px', background: 'rgba(25,23,21,0.98)', border: '1px solid var(--accent-clay)' }}>
            
            {/* Header */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 600 }}>🔒 Secure Checkout Portal</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Processing payment for {selectedPlanId.toUpperCase()} subscription</p>
            </div>

            {/* Calculations summaries */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>${checkoutDetails.subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                <span>Discount coupon:</span>
                <span>-${checkoutDetails.discount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>SaaS Tax (18% standard GST):</span>
                <span>+${checkoutDetails.tax}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.4rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                <span>Total:</span>
                <span>${checkoutDetails.total} USD</span>
              </div>
            </div>

            {/* Discount promo input */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                placeholder="Apply Promo code (SAVE20)" 
                value={coupon} 
                onChange={(e) => setCoupon(e.target.value)}
                style={{ flex: 1, padding: '0.3rem', fontSize: '0.8rem' }}
              />
              <button 
                onClick={handleApplyCoupon} 
                style={{ padding: '0.3rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Apply
              </button>
            </div>
            {couponError && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '-1.25rem', marginBottom: '1.25rem' }}>{couponError}</p>}

            {/* Card Form fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Credit Card digits</label>
                <input 
                  type="text" 
                  maxLength={16}
                  placeholder="4111 2222 3333 4444" 
                  value={cardNumber} 
                  onChange={(e) => setCardNumber(e.target.value)}
                  style={{ width: '100%', padding: '0.4rem', marginTop: '0.15rem', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Security CVV</label>
                <input 
                  type="password" 
                  maxLength={3}
                  placeholder="321" 
                  value={cvc} 
                  onChange={(e) => setCvc(e.target.value)}
                  style={{ width: '100%', padding: '0.4rem', marginTop: '0.15rem', fontSize: '0.85rem' }}
                />
              </div>
            </div>
            {paymentError && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '1rem' }}>{paymentError}</p>}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedPlanId(null)}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '0.4rem 1.25rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmCheckout} 
                disabled={paying}
                style={{ background: 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', padding: '0.4rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}
              >
                {paying ? 'Processing...' : 'Pay & Upgrade'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
