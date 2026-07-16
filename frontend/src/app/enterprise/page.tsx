'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { auth } from '@/lib/firebase';
import type { 
  OrganizationDetails, 
  SubscriptionBilling, 
  DeveloperApiKey, 
  MarketplacePlugin, 
  ComplianceAuditLog 
} from '@/services/enterprise/types';
import { translate, Locale } from '@/services/enterprise/i18nEngine';

export default function EnterprisePlatformPage() {
  return (
    <ProtectedRoute>
      <EnterprisePlatformContent />
    </ProtectedRoute>
  );
}

function EnterprisePlatformContent() {
  // Locale translation
  const [locale, setLocale] = useState<Locale>('en');

  // Org states
  const [org, setOrg] = useState<OrganizationDetails | null>(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [addingDept, setAddingDept] = useState(false);

  // Billing states
  const [billing, setBilling] = useState<SubscriptionBilling | null>(null);
  const [upgradingPlan, setUpgradingPlan] = useState(false);

  // Developer API keys
  const [developerKeys, setDeveloperKeys] = useState<DeveloperApiKey[]>([]);
  const [newKeyDesc, setNewKeyDesc] = useState('');
  const [generatingKey, setGeneratingKey] = useState(false);

  // Marketplace plugins
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([]);
  const [loadingPlugins, setLoadingPlugins] = useState(true);

  // Unified search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Compliance
  const [auditLogs, setAuditLogs] = useState<ComplianceAuditLog[]>([]);
  const [exportData, setExportData] = useState<any | null>(null);
  const [exporting, setExporting] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'marketplace' | 'org' | 'billing' | 'developer' | 'search' | 'compliance'>('marketplace');

  useEffect(() => {
    loadOrgDetails();
    loadBillingInfo();
    loadDeveloperKeys();
    loadMarketplacePlugins();
    loadAuditLogs();
  }, []);

  const loadOrgDetails = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: HeadersInit = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};

      const res = await fetch('/api/enterprise/organization', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setOrg(d.organization);
      }
    } catch (err) {
      console.error('Error loading org details:', err);
    }
  };

  const loadBillingInfo = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: HeadersInit = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};

      const res = await fetch('/api/enterprise/billing', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setBilling(d.billing);
      }
    } catch (err) {
      console.error('Error loading billing:', err);
    }
  };

  const loadDeveloperKeys = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: HeadersInit = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};

      const res = await fetch('/api/enterprise/developer', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setDeveloperKeys(d.keys);
      }
    } catch (err) {
      console.error('Error loading API keys:', err);
    }
  };

  const loadMarketplacePlugins = async () => {
    setLoadingPlugins(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: HeadersInit = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};

      const res = await fetch('/api/enterprise/marketplace', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setPlugins(d.plugins);
      }
    } catch (err) {
      console.error('Error loading marketplace plugins:', err);
    } finally {
      setLoadingPlugins(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: HeadersInit = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};

      const res = await fetch('/api/enterprise/compliance', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setAuditLogs(d.logs);
      }
    } catch (err) {
      console.error('Error loading compliance audit logs:', err);
    }
  };

  const handleAddDepartment = async () => {
    if (!newDeptName.trim()) return;
    setAddingDept(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/enterprise/organization', {
        method: 'POST',
        headers,
        body: JSON.stringify({ department: newDeptName })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setOrg(d.organization);
          setNewDeptName('');
        }
      }
    } catch (err) {
      console.error('Error adding department:', err);
    } finally {
      setAddingDept(false);
    }
  };

  const handleUpgradePlan = async (tier: string) => {
    setUpgradingPlan(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/enterprise/billing', {
        method: 'POST',
        headers,
        body: JSON.stringify({ tier })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setBilling(d.billing);
          loadAuditLogs();
        }
      }
    } catch (err) {
      console.error('Error upgrading billing plan:', err);
    } finally {
      setUpgradingPlan(false);
    }
  };

  const handleInstallPlugin = async (pluginId: string, install: boolean) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/enterprise/marketplace', {
        method: 'POST',
        headers,
        body: JSON.stringify({ pluginId, install })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success) setPlugins(d.plugins);
      }
    } catch (err) {
      console.error('Error toggling plugin install:', err);
    }
  };

  const handleGenerateApiKey = async () => {
    if (!newKeyDesc.trim()) return;
    setGeneratingKey(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/enterprise/developer', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'generate', description: newKeyDesc })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setDeveloperKeys((prev) => [...prev, d.key]);
          setNewKeyDesc('');
          loadAuditLogs();
        }
      }
    } catch (err) {
      console.error('Error generating API Key:', err);
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/enterprise/developer', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'revoke', keyId })
      });

      if (res.ok) {
        setDeveloperKeys((prev) => prev.filter((k) => k.id !== keyId));
      }
    } catch (err) {
      console.error('Error revoking API key:', err);
    }
  };

  const handleGlobalSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: HeadersInit = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};

      const res = await fetch(`/api/enterprise/search?q=${searchQuery}`, { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setSearchResults(d.results);
      }
    } catch (err) {
      console.error('Error running search:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleGdprExport = async () => {
    setExporting(true);
    setExportData(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: HeadersInit = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};

      const res = await fetch('/api/enterprise/compliance?action=export', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setExportData(d.data);
          loadAuditLogs();
        }
      }
    } catch (err) {
      console.error('Error exporting data package:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: '3rem' }}>
      
      {/* Page Header with Translation locale switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <div className="section-eyebrow" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-clay)' }}>Global Scale Platform</div>
          <h1 className="page-title" style={{ fontSize: '2.25rem', color: 'var(--text-primary)', margin: '0.5rem 0' }}>Enterprise Workspace</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-muted)' }}>
            {translate('welcome', locale)}
          </p>
        </div>

        {/* Translation dropdown selector */}
        <div style={{ background: 'rgba(25,23,21,0.6)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>Language: </label>
          <select 
            value={locale} 
            onChange={(e) => setLocale(e.target.value as Locale)}
            style={{ padding: '0.15rem 0.5rem', background: 'rgba(0,0,0,0.8)', color: 'var(--text-primary)', border: 'none', fontSize: '0.8rem' }}
          >
            <option value="en">English (US)</option>
            <option value="es">Español (ES)</option>
            <option value="hi">हिंदी (IN)</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="difficulty-selector" style={{ marginBottom: '2rem', background: 'rgba(25, 23, 21, 0.65)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
        <button className={`difficulty-option ${activeTab === 'marketplace' ? 'active' : ''}`} onClick={() => setActiveTab('marketplace')} style={{ flex: 1 }}>🛒 Marketplace</button>
        <button className={`difficulty-option ${activeTab === 'org' ? 'active' : ''}`} onClick={() => setActiveTab('org')} style={{ flex: 1 }}>🏢 Organization</button>
        <button className={`difficulty-option ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')} style={{ flex: 1 }}>💳 Billing Plans</button>
        <button className={`difficulty-option ${activeTab === 'developer' ? 'active' : ''}`} onClick={() => setActiveTab('developer')} style={{ flex: 1 }}>🔑 Developer REST Keys</button>
        <button className={`difficulty-option ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')} style={{ flex: 1 }}>🔍 Global Search</button>
        <button className={`difficulty-option ${activeTab === 'compliance' ? 'active' : ''}`} onClick={() => setActiveTab('compliance')} style={{ flex: 1 }}>🔒 Compliance</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Main Panel grid content */}
        <div>

          {/* TAB 1: MARKETPLACE */}
          {activeTab === 'marketplace' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {plugins.map((plugin) => (
                <div className="quiz-card" key={plugin.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', background: 'rgba(212, 163, 115, 0.1)', color: 'var(--accent-clay)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>{plugin.category}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>v{plugin.version} • Author: {plugin.author}</span>
                    </div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{plugin.name}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{plugin.description}</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⭐ {plugin.rating} ({plugin.downloads} downloads)</span>
                    <button 
                      onClick={() => handleInstallPlugin(plugin.id, !plugin.installed)} 
                      style={{ background: plugin.installed ? 'rgba(16,185,129,0.08)' : 'var(--accent-clay)', border: plugin.installed ? '1px solid rgba(16,185,129,0.2)' : 'none', color: plugin.installed ? '#34d399' : 'var(--text-primary)', padding: '0.3rem 1rem', fontSize: '0.75rem', fontWeight: 600 }}
                    >
                      {plugin.installed ? translate('installed', locale) : translate('install', locale)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: ORGANIZATION CONSOLE */}
          {activeTab === 'org' && org && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>{org.name} details</h3>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(212,163,115,0.1)', color: 'var(--accent-clay)', padding: '0.25rem 0.75rem', borderRadius: '4px' }}>Tier: {org.plan}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <strong>User seat capacity counter:</strong>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-clay)', margin: '0.5rem 0' }}>{org.seatsUsed} / {org.seatsCapacity}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{translate('seatsUsed', locale)} inside Orion Placement Cell.</span>
                  </div>
                  <div>
                    <strong>Organization departments:</strong>
                    <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      {org.departments.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                </div>

                {/* Add new department */}
                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Register Academic Department</h4>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <input 
                      type="text" 
                      placeholder="e.g. Electrical Engineering department" 
                      value={newDeptName} 
                      onChange={(e) => setNewDeptName(e.target.value)}
                      style={{ flex: 1, padding: '0.35rem' }}
                    />
                    <button 
                      onClick={handleAddDepartment} 
                      disabled={addingDept || !newDeptName.trim()}
                      style={{ background: 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', padding: '0.35rem 1.25rem', fontWeight: 600 }}
                    >
                      {addingDept ? 'Adding...' : 'Register'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BILLING CONSOLE */}
          {activeTab === 'billing' && billing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Subscription plans settings</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div>
                    <strong>Active plan:</strong>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-clay)', margin: '0.25rem 0' }}>{billing.tier.toUpperCase()}</div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cycle ends at: {new Date(billing.cycleEndsAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <strong>Cycle cost:</strong>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', margin: '0.25rem 0' }}>${billing.amountUsd}/mo</div>
                  </div>
                </div>

                {/* Billing plans options grid */}
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Change subscription Tier:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
                  {['free', 'student-premium', 'professional', 'recruiter', 'university', 'enterprise'].map((plan) => (
                    <button 
                      key={plan}
                      onClick={() => handleUpgradePlan(plan)}
                      disabled={upgradingPlan || billing.tier === plan}
                      style={{ 
                        background: billing.tier === plan ? 'rgba(212,163,115,0.1)' : 'rgba(0,0,0,0.2)',
                        border: billing.tier === plan ? '1px solid var(--accent-clay)' : '1px solid rgba(255,255,255,0.05)',
                        color: billing.tier === plan ? 'var(--accent-clay)' : 'var(--text-primary)',
                        padding: '0.5rem',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      {plan.replace('-', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Invoices list */}
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginBottom: '0.75rem' }}>Invoice logs</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {billing.invoices.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No invoices recorded yet.</p>
                  ) : (
                    billing.invoices.map((inv) => (
                      <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.15)', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                        <span>Invoice: <strong>{inv.id}</strong> ({new Date(inv.date).toLocaleDateString()})</span>
                        <span style={{ color: '#10b981' }}>${inv.amount} USD Paid</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DEVELOPER KEYS */}
          {activeTab === 'developer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Developer API Platforms</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Generate OAuth keys and verify rate-limiting quotas to connect third-party plug-ins.</p>

                {/* Keys list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {developerKeys.map((key) => (
                    <div key={key.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{key.description}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Token: <code style={{ color: 'var(--accent-clay)' }}>{key.token}</code></div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Created at: {new Date(key.createdAt).toLocaleDateString()}</div>
                      </div>
                      <button 
                        onClick={() => handleRevokeApiKey(key.id)}
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>

                {/* Generate new key */}
                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Generate Developer API Token</h4>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <input 
                      type="text" 
                      placeholder="e.g. Production Analytics script connection key" 
                      value={newKeyDesc} 
                      onChange={(e) => setNewKeyDesc(e.target.value)}
                      style={{ flex: 1, padding: '0.35rem' }}
                    />
                    <button 
                      onClick={handleGenerateApiKey} 
                      disabled={generatingKey || !newKeyDesc.trim()}
                      style={{ background: 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', padding: '0.35rem 1.25rem', fontWeight: 600 }}
                    >
                      {generatingKey ? 'Generating...' : 'Create Key'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: UNIFIED GLOBAL SEARCH */}
          {activeTab === 'search' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Global Unified Search</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Search profiles, jobs, courses, companies, and skills indices globally.</p>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <input 
                    type="text" 
                    placeholder={translate('searchPlaceholder', locale)}
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()}
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                  <button 
                    onClick={handleGlobalSearch} 
                    disabled={searching || !searchQuery.trim()}
                    style={{ background: 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', padding: '0.5rem 1.5rem', fontWeight: 600 }}
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {/* Search outcomes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {searchResults.length === 0 ? (
                    searchQuery.trim() ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No results match your keyword query.</p> : null
                  ) : (
                    searchResults.map((res, idx) => (
                      <div key={idx} style={{ background: 'rgba(0,0,0,0.15)', padding: '0.75rem 1rem', borderRadius: '4px', borderLeft: '3px solid var(--accent-clay)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                          <span style={{ textTransform: 'uppercase', color: 'var(--accent-clay)', fontWeight: 600 }}>{res.category}</span>
                          {res.metadata && <span style={{ color: 'var(--text-muted)' }}>Tags: {res.metadata}</span>}
                        </div>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{res.title}</strong>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{res.subtitle}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: COMPLIANCE DASHBOARD */}
          {activeTab === 'compliance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Compliance & GDPR Dashboard</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Download data portability profiles or trigger account resets. Audit trails display SOC 2 actions.</p>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                  <button 
                    onClick={handleGdprExport} 
                    disabled={exporting}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '0.5rem 1.5rem', fontWeight: 600 }}
                  >
                    {exporting ? 'Exporting...' : 'GDPR Data portability Export'}
                  </button>

                  <button 
                    onClick={async () => {
                      if (confirm('Are you sure you want to permanently erase your data and account details? This action is irreversible.')) {
                        const idToken = await auth.currentUser?.getIdToken();
                        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                        if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
                        await fetch('/api/enterprise/compliance', {
                          method: 'POST',
                          headers,
                          body: JSON.stringify({ action: 'erase' })
                        });
                        alert('Account erased. Sign in again to reinitialize.');
                        window.location.reload();
                      }
                    }}
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '0.5rem 1.5rem', fontWeight: 600 }}
                  >
                    Erase My Account
                  </button>
                </div>

                {/* Render exported JSON */}
                {exportData && (
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '4px', marginBottom: '2rem' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>GDPR Data Export Packages JSON:</strong>
                    <pre style={{ overflowX: 'auto', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem', maxHeight: '180px' }}>
                      {JSON.stringify(exportData, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Audit logs listing */}
                <h4 style={{ fontSize: '1rem', fontWeight: 600, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginBottom: '0.75rem' }}>SOC 2 compliance Audit Trail Logs</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {auditLogs.map((log) => (
                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.15)', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                      <span>Actor: <strong>{log.actor}</strong> ({log.ipAddress}) • {log.action}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Platform Analytics Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Marketplace Stats */}
          <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.45)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.75rem', color: 'var(--accent-clay)' }}>Marketplace Analytics</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Extensions available:</span>
                <strong>4</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Installed by Org:</span>
                <strong>{plugins.filter(p => p.installed).length} installed</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>API Keys active:</span>
                <strong>{developerKeys.length} keys</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Org seat utilization:</span>
                <strong>{org ? `${Math.round((org.seatsUsed / org.seatsCapacity) * 100)}%` : '0%'}</strong>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
