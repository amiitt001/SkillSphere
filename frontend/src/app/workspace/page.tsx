'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { auth } from '@/lib/firebase';
import type { ConnectedAccount, WorkspaceWorkflow, CalendarEvent, SyncLog } from '@/services/integrations/types';

export default function WorkspacePage() {
  return (
    <ProtectedRoute>
      <WorkspaceDashboardContent />
    </ProtectedRoute>
  );
}

function WorkspaceDashboardContent() {
  // Accounts
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Syncing
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [syncing, setSyncing] = useState(false);

  // Calendar
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [preppingEventId, setPreppingEventId] = useState<string | null>(null);

  // Workflows
  const [workflows, setWorkflows] = useState<WorkspaceWorkflow[]>([]);
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowTrigger, setNewFlowTrigger] = useState('git_repository_pushed');
  const [newFlowAction, setNewFlowAction] = useState<'refresh_portfolio' | 'increase_dsa_score' | 'run_ats_analysis' | 'generate_interview_plan'>('refresh_portfolio');
  const [savingFlow, setSavingFlow] = useState(false);

  // OAuth Simulator Modal state
  const [oauthModalAccount, setOauthModalAccount] = useState<ConnectedAccount | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'workspace' | 'marketplace' | 'workflows'>('workspace');

  useEffect(() => {
    loadAccounts();
    loadSyncLogs();
    loadCalendarEvents();
    loadWorkflows();
  }, []);

  const loadAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};

      const res = await fetch('/api/integrations/connect', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setAccounts(d.accounts);
      }
    } catch (err) {
      console.error('Error loading accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const loadSyncLogs = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};
      const res = await fetch('/api/integrations/logs', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setSyncLogs(d.logs);
      }
    } catch (err) {
      console.error('Error loading sync logs:', err);
    }
  };

  const loadCalendarEvents = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};
      const res = await fetch('/api/integrations/calendar', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setCalendarEvents(d.events);
      }
    } catch (err) {
      console.error('Error loading calendar events:', err);
    }
  };

  const loadWorkflows = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};
      const res = await fetch('/api/integrations/workflows', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setWorkflows(d.workflows);
      }
    } catch (err) {
      console.error('Error loading workflows:', err);
    }
  };

  const handleRunManualSync = async () => {
    setSyncing(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};
      const res = await fetch('/api/integrations/sync', {
        method: 'POST',
        headers
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setSyncLogs((prev) => [...d.logs, ...prev]);
          // Refresh calendar events
          loadCalendarEvents();
        }
      }
    } catch (err) {
      console.error('Error executing manual sync:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleConnectIntegration = async (integrationId: string) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers,
        body: JSON.stringify({ integrationId, connect: true })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setAccounts(d.accounts);
          setOauthModalAccount(null);
        }
      }
    } catch (err) {
      console.error('Error connecting account:', err);
    }
  };

  const handleDisconnectIntegration = async (integrationId: string) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers,
        body: JSON.stringify({ integrationId, connect: false })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setAccounts(d.accounts);
        }
      }
    } catch (err) {
      console.error('Error disconnecting account:', err);
    }
  };

  const handleGeneratePrepChecklist = async (event: CalendarEvent) => {
    setPreppingEventId(event.id);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/integrations/calendar', {
        method: 'POST',
        headers,
        body: JSON.stringify({ event })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setCalendarEvents((prev) => 
            prev.map((e) => e.id === event.id ? { ...e, aiPrepChecklist: d.checklist } : e)
          );
        }
      }
    } catch (err) {
      console.error('Error compiling checklist:', err);
    } finally {
      setPreppingEventId(null);
    }
  };

  const handleToggleWorkflow = async (rule: WorkspaceWorkflow) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const updatedRule = { ...rule, enabled: !rule.enabled };
      const res = await fetch('/api/integrations/workflows', {
        method: 'POST',
        headers,
        body: JSON.stringify(updatedRule)
      });

      if (res.ok) {
        setWorkflows((prev) => prev.map((w) => w.id === rule.id ? updatedRule : w));
      }
    } catch (err) {
      console.error('Error toggling rule:', err);
    }
  };

  const handleCreateWorkflow = async () => {
    if (!newFlowName.trim()) return;
    setSavingFlow(true);
    const flowId = `flow_${Math.random().toString(36).substring(7)}`;
    const newFlow: WorkspaceWorkflow = {
      id: flowId,
      name: newFlowName,
      triggerEvent: newFlowTrigger,
      actionType: newFlowAction,
      enabled: true
    };

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/integrations/workflows', {
        method: 'POST',
        headers,
        body: JSON.stringify(newFlow)
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setWorkflows((prev) => [...prev, d.workflow]);
          setNewFlowName('');
        }
      }
    } catch (err) {
      console.error('Error saving new workflow rule:', err);
    } finally {
      setSavingFlow(false);
    }
  };

  const connectedCount = accounts.filter(a => a.connected).length;

  return (
    <div className="page-container" style={{ paddingBottom: '3rem' }}>
      
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div className="section-eyebrow" style={{ textTransform: 'uppercase', tracking: '0.1em', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-clay)' }}>Connected Workspaces</div>
        <h1 className="page-title" style={{ fontSize: '2.25rem', color: 'var(--text-primary)', margin: '0.5rem 0' }}>Workspace & Connectors</h1>
        <p className="page-subtitle" style={{ color: 'var(--text-muted)' }}>
          Sync external developer profiles, verify credentials health, check upcoming calendar events, and build AI automation flows.
        </p>
      </div>

      {/* Tabs */}
      <div className="difficulty-selector" style={{ marginBottom: '2rem', background: 'rgba(25, 23, 21, 0.65)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '0.25rem' }}>
        <button className={`difficulty-option ${activeTab === 'workspace' ? 'active' : ''}`} onClick={() => setActiveTab('workspace')} style={{ flex: 1 }}>🖥 Workspace Dashboard</button>
        <button className={`difficulty-option ${activeTab === 'marketplace' ? 'active' : ''}`} onClick={() => setActiveTab('marketplace')} style={{ flex: 1 }}>🛒 Integration Marketplace ({connectedCount} linked)</button>
        <button className={`difficulty-option ${activeTab === 'workflows' ? 'active' : ''}`} onClick={() => setActiveTab('workflows')} style={{ flex: 1 }}>⚡ Workspace Automations</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Main Workspace Frame */}
        <div>

          {/* TAB 1: WORKSPACE DASHBOARD */}
          {activeTab === 'workspace' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Sync Trigger card */}
              <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>Synchronize developer accounts</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Pull commits and LeetCode problems solved delta changes directly into your active dashboard metrics.</p>
                  </div>
                  <button 
                    onClick={handleRunManualSync}
                    disabled={syncing || connectedCount === 0}
                    style={{ background: 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', padding: '0.5rem 1.5rem', fontWeight: 600 }}
                  >
                    {syncing ? 'Syncing...' : 'Sync All Accounts'}
                  </button>
                </div>
              </div>

              {/* Calendar Intelligence Panel */}
              <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, borderBottom: '1px solid rgba(212, 163, 115, 0.1)', paddingBottom: '0.5rem', marginBottom: '1.25rem', color: 'var(--accent-clay)' }}>Google Calendar Intel</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {calendarEvents.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Connect Google Calendar inside the Integration Marketplace tab to display upcoming interviews and exam deadlines.</p>
                  ) : (
                    calendarEvents.map((evt) => (
                      <div key={evt.id} style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(212,163,115,0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                          <div>
                            <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{evt.title}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{new Date(evt.dateTime).toLocaleString()} • Event Category: {evt.type}</div>
                          </div>
                          {!evt.aiPrepChecklist && (
                            <button 
                              onClick={() => handleGeneratePrepChecklist(evt)}
                              disabled={preppingEventId === evt.id}
                              style={{ background: 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', padding: '0.25rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                            >
                              {preppingEventId === evt.id ? 'Compiling Plan...' : 'Generate Prep Checklist'}
                            </button>
                          )}
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{evt.description}</p>
                        
                        {/* Renders AI prep checklist */}
                        {evt.aiPrepChecklist && (
                          <div style={{ marginTop: '1rem', background: 'rgba(212,163,115,0.03)', border: '1px solid rgba(212,163,115,0.08)', padding: '0.75rem', borderRadius: '4px' }}>
                            <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>🤖 AI Preparation Checklist:</strong>
                            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              {evt.aiPrepChecklist.map((step, i) => <li key={i}>{step}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: INTEGRATION MARKETPLACE */}
          {activeTab === 'marketplace' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {accounts.map((account) => (
                <div className="quiz-card" key={account.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '170px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', background: 'rgba(212, 163, 115, 0.1)', color: 'var(--accent-clay)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>{account.category}</span>
                      <span style={{ fontSize: '0.7rem', color: account.healthStatus === 'healthy' ? '#10b981' : 'var(--text-muted)' }}>● {account.healthStatus}</span>
                    </div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>{account.name}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {account.connected ? `Successfully connected. Last synced at ${new Date(account.lastSyncedAt!).toLocaleTimeString()}` : 'Connect account to import stats, repositories, and deadlines.'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    {account.connected ? (
                      <button 
                        onClick={() => handleDisconnectIntegration(account.id)} 
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '0.35rem 1rem', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button 
                        onClick={() => setOauthModalAccount(account)} 
                        style={{ background: 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', padding: '0.35rem 1rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Connect account
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: WORKSPACE AUTOMATIONS */}
          {activeTab === 'workflows' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Rules list */}
              <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Workspace Integration Workflows</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Automate workspace adjustments. Triggered when third-party sync operations return updates.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {workflows.map((flow) => (
                    <div key={flow.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '0.75rem 1rem', borderRadius: '4px', borderLeft: flow.enabled ? '3px solid var(--accent-clay)' : '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: flow.enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>{flow.name}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Trigger event: {flow.triggerEvent} • Action mapping: {flow.actionType}</div>
                      </div>
                      <button 
                        onClick={() => handleToggleWorkflow(flow)} 
                        className={`difficulty-option ${flow.enabled ? 'active' : ''}`}
                        style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
                      >
                        {flow.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add custom workflow rule */}
              <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Create Integration Automation Flow</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Workflow Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. When Git commits update..." 
                      value={newFlowName} 
                      onChange={(e) => setNewFlowName(e.target.value)}
                      style={{ width: '100%', padding: '0.35rem', marginTop: '0.15rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>When Sync Event Occurs</label>
                    <select 
                      value={newFlowTrigger} 
                      onChange={(e) => setNewFlowTrigger(e.target.value)}
                      style={{ width: '100%', padding: '0.35rem', marginTop: '0.15rem', background: 'rgba(25,23,21,0.95)', color: 'var(--text-primary)' }}
                    >
                      <option value="git_repository_pushed">GitHub Commit Received</option>
                      <option value="leetcode_milestone">LeetCode solved milestone</option>
                      <option value="interview_tomorrow">Google Calendar interview tomorrow</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Execute System Action</label>
                    <select 
                      value={newFlowAction} 
                      onChange={(e) => setNewFlowAction(e.target.value as any)}
                      style={{ width: '100%', padding: '0.35rem', marginTop: '0.15rem', background: 'rgba(25,23,21,0.95)', color: 'var(--text-primary)' }}
                    >
                      <option value="refresh_portfolio">Refresh Portfolio Quality</option>
                      <option value="increase_dsa_score">Increase DSA score deltas</option>
                      <option value="run_ats_analysis">Trigger resume ATS reviews</option>
                      <option value="generate_interview_plan">Generate Interview Prep plan</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={handleCreateWorkflow} 
                    disabled={savingFlow || !newFlowName.trim()}
                    style={{ background: 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', padding: '0.4rem 1.5rem', fontWeight: 600 }}
                  >
                    {savingFlow ? 'Creating...' : 'Create Workflow'}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Column: Sync Logs & Connected accounts health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Sync logs history summary */}
          <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.45)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>Recent Sync logs</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
              {syncLogs.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No sync cycles recorded yet.</p>
              ) : (
                syncLogs.slice(0, 8).map((log) => (
                  <div key={log.id} style={{ fontSize: '0.7rem', padding: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <span style={{ color: log.status === 'success' ? '#10b981' : '#ef4444' }}>●</span> <strong>{log.integrationId}</strong>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{log.message}</p>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ══ OAUTH SIMULATOR DIALOG POPUP ══ */}
      {oauthModalAccount && (
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
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '1.5rem', margin: '0.5rem 0', color: 'var(--accent-clay)' }}>🔒 OAuth Authorization Gateway</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>SkillSphere requests permissions to access your external {oauthModalAccount.name} profile settings.</p>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" defaultChecked disabled />
                <span>Read basic user info and email address</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" defaultChecked disabled />
                <span>Synchronize activity details and completed roadmaps</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setOauthModalAccount(null)}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '0.4rem 1.25rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleConnectIntegration(oauthModalAccount.id)}
                style={{ background: 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', padding: '0.4rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}
              >
                Grant Access
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
