import React, { useState, useEffect } from 'react';
import { Account, Contact, AccessorialSOP, PipelineStage, UserProfile } from './types';
import { 
  INITIAL_ACCOUNTS, 
  INITIAL_CONTACTS, 
  INITIAL_ACCESSORIALS 
} from './mockData';
import { accountUpdatePayload, isAzureConfigured } from './lib/azureClient';
import { useAccounts } from './hooks/useAccounts';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './components/Login';
import { createBlankOnboardingAccount } from './onboardingWorkflow';
import KanbanBoard from './components/KanbanBoard';
import CustomerDashboard from './components/CustomerDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { 
  Building2, 
  UserSquare2, 
  Layers, 
  RefreshCw,
  Star,
  Loader2,
  AlertOctagon,
  WifiOff,
  Wifi,
  FlaskConical,
  UserCheck,
  LogOut
} from 'lucide-react';

const BUILD_COMMIT = process.env.COMMIT_SHA || 'dev';
const BUILD_TIME = process.env.BUILD_TIME || new Date().toISOString();
const APP_ENV = process.env.APP_ENV || 'development';
const AUTH_MODE = process.env.AUTH_MODE || 'required';
const SUPABASE_REF = (process.env.SUPABASE_URL || '').replace('https://', '').split('.')[0] || 'unknown';

export const PROFILES: UserProfile[] = [
  {
    id: 'usr_rk',
    name: 'Rich Kings',
    email: 'rich.kings@forrestlogistics.com',
    role: 'vp_it_compliance',
    initials: 'Rk',
    title: 'VP of IT & Compliance Officer'
  },
  {
    id: 'usr_tw',
    name: 'Tanya Wahl',
    email: 'tanya.wahl@forrestlogistics.com',
    role: 'onboarding_specialist',
    initials: 'TW',
    title: 'Customer Onboarding Lead'
  },
  {
    id: 'usr_ar',
    name: 'Alex Rivera',
    email: 'alex.rivera@forrestlogistics.com',
    role: 'billing_ops',
    initials: 'AR',
    title: 'Billing & Operations Lead'
  }
];

function getInitialRoute(): { tab: 'kanban' | 'dashboard'; accountId: string } {
  if (typeof window === 'undefined') return { tab: 'kanban', accountId: 'act_1' };
  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get('tab');
  const accountParam = params.get('account') || params.get('accountId');
  const tab = (tabParam === 'dashboard' || tabParam === '360') ? 'dashboard' : 'kanban';
  const accountId = accountParam || 'act_1';
  return { tab, accountId };
}

function MainApp() {
  const initialRoute = getInitialRoute();
  const [activeTab, setActiveTabState] = useState<'kanban' | 'dashboard'>(initialRoute.tab);
  const [selectedAccountId, setSelectedAccountIdState] = useState<string>(initialRoute.accountId);
  const [activeProfile, setActiveProfile] = useState<UserProfile>(PROFILES[0]);

  const { accounts, accessorials: syncedAccessorials, loading, error: accountsError, isRealtimeConnected, retry: retryAccounts, setAccounts, setAccessorials: setSyncedAccessorials } = useAccounts();
  const { session, signOut } = useAuth();

  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [localAccessorials, setLocalAccessorials] = useState<AccessorialSOP[]>(INITIAL_ACCESSORIALS);
  const accessorials = syncedAccessorials.length ? syncedAccessorials : localAccessorials;
  const setAccessorials = syncedAccessorials.length ? setSyncedAccessorials : setLocalAccessorials;

  const [showWalkthrough, setShowWalkthrough] = useState(true);

  const navigateTo = (tab: 'kanban' | 'dashboard', accountId?: string, pushHistory = true) => {
    const nextTab = tab;
    const nextAccountId = accountId || selectedAccountId;
    setActiveTabState(nextTab);
    if (accountId) setSelectedAccountIdState(accountId);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (nextTab === 'dashboard') {
        url.searchParams.set('tab', 'dashboard');
        url.searchParams.set('account', nextAccountId);
      } else {
        url.searchParams.delete('tab');
        url.searchParams.delete('account');
      }

      if (pushHistory) {
        window.history.pushState({ tab: nextTab, accountId: nextAccountId }, '', url.toString());
      } else {
        window.history.replaceState({ tab: nextTab, accountId: nextAccountId }, '', url.toString());
      }
    }
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.tab) {
        setActiveTabState(e.state.tab);
        if (e.state.accountId) setSelectedAccountIdState(e.state.accountId);
      } else {
        const route = getInitialRoute();
        setActiveTabState(route.tab);
        setSelectedAccountIdState(route.accountId);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleResetDemoData = () => {
    if (confirm('Verify: Reset to initial factory-fresh Drayage Customer Onboarding demo datasets? This clears any modifications.')) {
      setAccounts(INITIAL_ACCOUNTS);
      setContacts(INITIAL_CONTACTS);
      setAccessorials(INITIAL_ACCESSORIALS);
      navigateTo('kanban', 'act_1');
    }
  };

  const handleUpdateAccountStage = async (accountId: string, newStage: PipelineStage) => {
    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, stage: newStage } : a));
    await fetch(`/api/Account/id/${accountId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage })
    }).catch(err => console.error('Failed to update stage in Azure:', err));
  };

  const handleSelectAccount = (accountId: string) => {
    navigateTo('dashboard', accountId);
  };

  const handleUpdateAccount = async (updatedAccount: Account) => {
    setAccounts(prev => prev.map(a => a.id === updatedAccount.id ? updatedAccount : a));
    if (!updatedAccount.id.startsWith('act_')) {
      try {
        const res = await fetch(`/api/Account/id/${updatedAccount.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(accountUpdatePayload(updatedAccount))
        });
        if (!res.ok) console.error('Failed to persist account update to Azure:', await res.text());
      } catch (error) {
        console.error('Failed to persist account update to Azure:', error);
      }
    }
  };

  const handleAddAccount = (name: string, billToCode = '') => {
    const newId = 'act_' + Date.now();
    const newAct = createBlankOnboardingAccount(newId, name, billToCode);
    const newSOP: AccessorialSOP = {
      id: 'acc_' + Date.now(),
      accountId: newId,
      chassisFee: 0,
      prePullFee: 0,
      storageFee: 0,
      emptyStorageFee: 0,
      detentionRate: 0,
      detentionFreeTime: 0,
      chassisSplitFee: 0,
      cleanTruckFee: 0,
      appointmentType: 'Live Unload',
      requiredStatusUpdates: [],
      hasYardHostler: false,
      peelPilesPermitted: false,
      privateChassisPermitted: false,
      freeTimeDays: 0,
      deliveryRules: ''
    };
    setAccounts(prev => [...prev, newAct]);
    setAccessorials(prev => [...prev, newSOP]);
    navigateTo('dashboard', newId);
  };

  const handleAddContact = (contactDetails: Omit<Contact, 'id'>) => {
    const newContact: Contact = {
      ...contactDetails,
      id: 'con_' + Date.now()
    };
    setContacts(prev => [...prev, newContact]);
  };

  const handleDeleteContact = (contactId: string) => {
    setContacts(prev => prev.filter(c => c.id !== contactId));
  };

  const handleUpdateAccessorials = async (updatedSOP: AccessorialSOP) => {
    setAccessorials(prev => prev.map(s => s.accountId === updatedSOP.accountId ? updatedSOP : s));
    if (!updatedSOP.id.startsWith('acc_')) {
      const payload = {
        chassis_fee: updatedSOP.chassisFee,
        pre_pull_fee: updatedSOP.prePullFee,
        storage_fee: updatedSOP.storageFee,
        empty_storage_fee: updatedSOP.emptyStorageFee,
        detention_rate: updatedSOP.detentionRate,
        detention_free_time: updatedSOP.detentionFreeTime,
        chassis_split_fee: updatedSOP.chassisSplitFee,
        clean_truck_fee: updatedSOP.cleanTruckFee,
        appointment_type: updatedSOP.appointmentType,
        required_status_updates: updatedSOP.requiredStatusUpdates,
        has_yard_hostler: updatedSOP.hasYardHostler,
        peel_piles_permitted: updatedSOP.peelPilesPermitted,
        private_chassis_permitted: updatedSOP.privateChassisPermitted,
        free_time_days: updatedSOP.freeTimeDays,
        delivery_rules: updatedSOP.deliveryRules,
        updated_at: new Date().toISOString()
      };
      try {
        const res = await fetch(`/api/AccessorialSOP/id/${updatedSOP.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) console.error('Failed to persist SOP update to Azure:', await res.text());
      } catch (error) {
        console.error('Failed to persist SOP update to Azure:', error);
      }
    }
  };

  return (
    <div className="vh-100 bg-light d-flex flex-column font-sans user-select-none antialiased">
      <header className="bg-dark text-white border-bottom sticky-top shadow-sm flex-shrink-0" style={{ zIndex: 1050 }}>
        <div className="container-fluid h-100 d-flex align-items-center justify-content-between py-2 px-3">
          
          <div className="d-flex align-items-center gap-3">
            <div className="p-2 rounded bg-primary text-white d-flex align-items-center justify-content-center shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold tracking-tight fs-6">Forrest Logistics</span>
                <span className="badge bg-primary bg-opacity-25 text-primary border border-primary px-2 py-1 rounded">
                  CUSTOMER ONBOARDING CRM
                </span>
              </div>
              <p className="small text-secondary mb-0 font-monospace">Port & Rail Drayage Customer Qualification & Compliance Suite</p>
            </div>
          </div>

          <div className="d-none d-md-flex align-items-center gap-1 bg-secondary bg-opacity-25 p-1 rounded border">
            <button
              onClick={() => navigateTo('kanban')}
              className={`btn btn-sm d-flex align-items-center gap-2 fw-bold ${
                activeTab === 'kanban' 
                  ? 'btn-primary shadow-sm' 
                  : 'btn-outline-secondary text-light border-0'
              }`}
            >
              <Layers className="w-4 h-4" />
              Onboarding Pipeline & Forms
            </button>
            <button
              onClick={() => navigateTo('dashboard')}
              className={`btn btn-sm d-flex align-items-center gap-2 fw-bold ${
                activeTab === 'dashboard' 
                  ? 'btn-primary shadow-sm' 
                  : 'btn-outline-secondary text-light border-0'
              }`}
            >
              <UserSquare2 className="w-4 h-4" />
              Customer 360-View & Audit
            </button>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              onClick={handleResetDemoData}
              className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
              title="Reset Database to Default Mock Datasets"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Demo
            </button>
            
            <div className="vr text-secondary mx-2 d-none d-md-block"></div>
            
            <div className="d-flex align-items-center gap-2 bg-secondary bg-opacity-25 border rounded px-2 py-1">
              <div 
                className="rounded bg-primary fw-bold text-white small d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
                style={{ width: '30px', height: '30px' }}
                title={`Active Profile: ${activeProfile.name} (${activeProfile.initials}) - Role: ${activeProfile.role}`}
              >
                ({activeProfile.initials})
              </div>
              <div className="d-flex flex-column text-start">
                <div className="d-flex align-items-center gap-1">
                  <span className="small text-secondary fw-bold d-none d-md-inline" style={{ fontSize: '10px' }}>SPECIALIST:</span>
                  <select
                    value={activeProfile.id}
                    onChange={(e) => {
                      const selected = PROFILES.find(p => p.id === e.target.value);
                      if (selected) setActiveProfile(selected);
                    }}
                    className="form-select form-select-sm bg-transparent text-white fw-bold border-0 p-0 shadow-none text-uppercase"
                    style={{ fontSize: '11px', minWidth: '120px' }}
                  >
                    {PROFILES.map(p => (
                      <option key={p.id} value={p.id} className="bg-dark text-white text-capitalize">
                        {p.name} ({p.initials})
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-primary fw-semibold d-block text-truncate" style={{ fontSize: '10px', maxWidth: '150px' }}>
                  {activeProfile.title}
                </span>
              </div>
            </div>

            {session && (
              <button
                onClick={() => signOut()}
                className="btn btn-sm btn-outline-danger"
                title={`Sign out (${session.user?.email || 'User'})`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="d-md-none bg-dark border-bottom px-2 py-2 d-flex overflow-auto gap-1 text-white">
        <button
          onClick={() => navigateTo('kanban')}
          className={`flex-fill btn btn-sm fw-bold ${
            activeTab === 'kanban' ? 'btn-primary shadow-sm' : 'btn-outline-secondary text-light border-0'
          }`}
        >
          Pipeline & Forms
        </button>
        <button
          onClick={() => navigateTo('dashboard')}
          className={`flex-fill btn btn-sm fw-bold ${
            activeTab === 'dashboard' ? 'btn-primary shadow-sm' : 'btn-outline-secondary text-light border-0'
          }`}
        >
          Customer 360-View
        </button>
      </div>

      {(accountsError || !isRealtimeConnected) && (
        <div className="alert alert-warning rounded-0 border-start-0 border-end-0 mb-0 px-4 py-2">
          <div className="container-fluid d-flex flex-wrap gap-3 align-items-center small fw-medium">
            {accountsError && (
              <span className="d-flex align-items-center gap-2">
                <AlertOctagon className="w-4 h-4" />
                Customer data temporarily unavailable.
                <button onClick={retryAccounts} className="btn btn-link btn-sm p-0">Retry</button>
              </span>
            )}
            {!isRealtimeConnected && !loading && (
              <span className="d-flex align-items-center gap-2">
                <WifiOff className="w-4 h-4" />
                Live updates temporarily unavailable. Refresh to see latest changes.
              </span>
            )}
          </div>
        </div>
      )}

      {showWalkthrough && (
        <section className="bg-primary bg-opacity-10 border-bottom px-4 py-3 text-dark shadow-sm">
          <div className="container-fluid d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
            <div className="d-flex gap-3 align-items-start">
              <div className="p-1 rounded bg-primary text-white shadow-sm">
                <Star className="w-5 h-5 fill-current" />
              </div>
              <div>
                <p className="small fw-bold mb-1">
                  Drayage Customer Onboarding CRM — Specialized Workflow Guide
                </p>
                <p className="small text-secondary mb-0 fw-semibold">
                  Pre-loaded with drayage customer profiles, credit audit logic, document vaults, and SOP compliance rules. Use these 4 quick anchors to present:
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowWalkthrough(false)}
              className="btn btn-sm btn-outline-secondary fw-bold w-100 w-md-auto"
            >
              Hide Guide
            </button>
          </div>

          <div className="container-fluid mt-3">
            <div className="row g-2">
              <div className="col-12 col-md-3">
                <button
                  onClick={() => navigateTo('kanban')}
                  className="btn btn-light w-100 text-start shadow-sm border h-100 p-2"
                >
                  <strong className="d-block text-dark small mb-1">1. 5-Stage Onboarding Kanban</strong>
                  <span className="small text-secondary" style={{ fontSize: '11px' }}>"Drag & drop customer accounts through Inquiry, Credit Agreement, Account Setup, Kickoff, and Active Operations."</span>
                </button>
              </div>
              <div className="col-12 col-md-3">
                <button
                  onClick={() => {
                    navigateTo('kanban');
                    setTimeout(() => {
                      const target = document.getElementById('interactive_onboarding_workspace');
                      if (target) target.scrollIntoView({ behavior: 'smooth' });
                    }, 150);
                  }}
                  className="btn btn-light w-100 text-start shadow-sm border h-100 p-2"
                >
                  <strong className="d-block text-dark small mb-1">2. Interactive Forms & Vault Export</strong>
                  <span className="small text-secondary" style={{ fontSize: '11px' }}>"Fill Onboarding Checklists, External Customer Questionnaires, or Internal Agendas and sign-off directly into Document Vault."</span>
                </button>
              </div>
              <div className="col-12 col-md-3">
                <button
                  onClick={() => navigateTo('dashboard', 'act_1')}
                  className="btn btn-light w-100 text-start shadow-sm border h-100 p-2"
                >
                  <strong className="d-block text-dark small mb-1">3. Document Vault & Upload Preview</strong>
                  <span className="small text-secondary" style={{ fontSize: '11px' }}>"Select Chalas profile. Preview signed credit applications, contracts, and SOP files with live lightbox viewer."</span>
                </button>
              </div>
              <div className="col-12 col-md-3">
                <button
                  onClick={() => navigateTo('dashboard', 'act_1')}
                  className="btn btn-light w-100 text-start shadow-sm border h-100 p-2"
                >
                  <strong className="d-block text-dark small mb-1">4. Red Flag Alarms & Accessorial SOPs</strong>
                  <span className="small text-secondary" style={{ fontSize: '11px' }}>"Inspect critical early-morning delivery alarms, pre-pull rules, chassis split fees, and contact role escalation directory."</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <main className="container-fluid px-4 py-4 flex-grow-1 h-100 overflow-auto">
        <div style={{ minHeight: '500px' }}>
          {activeTab === 'kanban' && (
            <KanbanBoard
              accounts={accounts}
              onUpdateAccountStage={handleUpdateAccountStage}
              onSelectAccount={handleSelectAccount}
              onAddAccount={handleAddAccount}
              onUpdateAccount={handleUpdateAccount}
            />
          )}

          {activeTab === 'dashboard' && (
            <ErrorBoundary fallbackTitle="Customer 360 could not be displayed">
              <CustomerDashboard
                accounts={accounts}
                contacts={contacts}
                accessorials={accessorials}
                selectedAccountId={selectedAccountId}
                activeProfile={activeProfile}
                onSelectAccount={(accId) => navigateTo('dashboard', accId)}
                onUpdateAccount={handleUpdateAccount}
                onAddContact={handleAddContact}
                onDeleteContact={handleDeleteContact}
                onUpdateAccessorials={handleUpdateAccessorials}
              />
            </ErrorBoundary>
          )}
        </div>
      </main>

      <footer className="bg-white border-top py-4 mt-4 flex-shrink-0">
        <div className="container-fluid d-flex flex-column flex-md-row align-items-center justify-content-between small text-secondary fw-medium gap-3">
          <p className="mb-0">© 2026 Forrest Logistics Drayage Customer Onboarding CRM. Managed by Tanya Wahl.</p>
          <div className="d-flex gap-3 align-items-center flex-wrap">
            <span className="text-decoration-underline" style={{ cursor: 'pointer' }}>Security &amp; Credit Audit Protocol</span>
            <span>•</span>
            <span className="text-decoration-underline" style={{ cursor: 'pointer' }}>Terminal SOP Rules</span>
            <span>•</span>
            <span className="text-decoration-underline" style={{ cursor: 'pointer' }} onClick={() => setShowWalkthrough(true)}>Show Demonstration Guide</span>
          </div>
        </div>
        {APP_ENV === 'development' && (
          <div className="container-fluid mt-2 d-flex flex-wrap gap-3 small text-muted font-monospace" style={{ fontSize: '10px' }}>
            <span>ENV: {APP_ENV}</span>
            <span>·</span>
            <span>AUTH: {AUTH_MODE}</span>
            <span>·</span>
            <span>PROJECT: {SUPABASE_REF}</span>
            <span>·</span>
            <span>COMMIT: {BUILD_COMMIT.slice(0, 8)}</span>
            <span>·</span>
            <span>BUILT: {BUILD_TIME.split('T')[0]}</span>
            <span>·</span>
            <span className={`d-flex align-items-center gap-1 ${isRealtimeConnected ? 'text-success' : 'text-muted'}`}>
              {isRealtimeConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              Realtime
            </span>
          </div>
        )}
      </footer>

    </div>
  );
}

function ConfigErrorScreen() {
  return (
    <div className="vh-100 bg-light d-flex align-items-center justify-content-center p-4">
      <div className="card shadow-sm border-danger" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="card-body text-center p-5">
          <AlertOctagon className="mx-auto mb-3 text-danger w-25 h-25" />
          <h1 className="h4 fw-bold text-dark">Supabase configuration required</h1>
          <p className="mt-3 small text-secondary">
            Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the frontend environment before starting the onboarding CRM.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  if (!isAzureConfigured) {
    return <ConfigErrorScreen />;
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isInitializing, isAutoAuthenticating, authMode, error, retry } = useAuth();

  if (isInitializing) {
    return (
      <div className="vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="d-flex flex-column align-items-center gap-3 text-secondary">
          <Loader2 className="w-8 h-8 text-primary" style={{ animation: 'spinner-border .75s linear infinite' }} />
          <p className="small fw-medium mb-0">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (isAutoAuthenticating) {
    return (
      <div className="vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="d-flex flex-column align-items-center gap-3 text-secondary">
          <Loader2 className="w-8 h-8 text-primary" style={{ animation: 'spinner-border .75s linear infinite' }} />
          <p className="small fw-medium mb-0">Preparing the OnDray staging workspace…</p>
          <p className="small text-muted mb-0">Creating secure demo workspace...</p>
        </div>
      </div>
    );
  }

  if (error && authMode === 'auto_demo') {
    return (
      <div className="vh-100 bg-light d-flex align-items-center justify-content-center p-3">
        <div className="card shadow-sm border w-100 text-center p-4" style={{ maxWidth: '400px' }}>
          <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '48px', height: '48px' }}>
            <AlertOctagon className="w-6 h-6" />
          </div>
          <h2 className="h5 fw-semibold text-dark">Unable to prepare the staging workspace</h2>
          <p className="small text-secondary">{error.message}</p>
          <button 
            onClick={retry}
            className="btn btn-dark fw-medium w-100 mt-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authMode === 'auto_demo') {
      return (
        <div className="vh-100 bg-light d-flex align-items-center justify-content-center p-3">
          <div className="text-center">
             <p className="text-secondary mb-3">Failed to establish demo session.</p>
             <button onClick={retry} className="btn btn-primary">Retry</button>
          </div>
        </div>
      );
    }
    return <Login />;
  }

  return (
    <ErrorBoundary fallbackTitle="Application error — please reload">
      {authMode === 'auto_demo' && (
        <div className="bg-warning text-dark small fw-bold text-center py-2 d-flex align-items-center justify-content-center gap-2 m-0 border-bottom border-warning-subtle">
          <FlaskConical className="w-4 h-4" />
          Staging Demo — Synthetic Data Only — Not for Production Use
        </div>
      )}
      <MainApp />
    </ErrorBoundary>
  );
}
