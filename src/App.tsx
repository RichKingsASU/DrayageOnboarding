/**
 * File: App.tsx
 * Purpose: Coordinates the top-level onboarding CRM experience and shared account state.
 * Dependencies: React state/effects, Supabase persistence, local storage fallback data, and dashboard/Kanban components.
 * Maintainer note: UI state is hydrated from Supabase first, with mock/local data retained as a fallback path.
 */
import React, { useState, useEffect } from 'react';
import { Account, Contact, AccessorialSOP, PipelineStage } from './types';
import { 
  INITIAL_ACCOUNTS, 
  INITIAL_CONTACTS, 
  INITIAL_ACCESSORIALS 
} from './mockData';
import { accountUpdatePayload, supabase, isSuabaseConfigured } from './lib/supabaseClient';
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
  FlaskConical
} from 'lucide-react';

const BUILD_COMMIT = import.meta.env.VITE_COMMIT_SHA || 'dev';
const BUILD_TIME = import.meta.env.VITE_BUILD_TIME || new Date().toISOString();
const APP_ENV = import.meta.env.VITE_APP_ENV || 'development';
const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || 'required';
const SUPABASE_REF = (import.meta.env.VITE_SUPABASE_URL || '').replace('https://', '').split('.')[0] || 'unknown';

/**
 * Renders the primary onboarding CRM shell and wires account selection, persistence, and tab navigation.
 */
function MainApp() {
  const [activeTab, setActiveTab] = useState<'kanban' | 'dashboard'>('kanban');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('act_1');

  const { accounts, accessorials: syncedAccessorials, loading, error: accountsError, isRealtimeConnected, retry: retryAccounts, setAccounts, setAccessorials: setSyncedAccessorials } = useAccounts();
  const { session, signOut } = useAuth();

  // For the demo, we still use local state for contacts and accessorials,
  // but they could be populated from the nested accounts data.
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [localAccessorials, setLocalAccessorials] = useState<AccessorialSOP[]>(INITIAL_ACCESSORIALS);
  const accessorials = syncedAccessorials.length ? syncedAccessorials : localAccessorials;
  const setAccessorials = syncedAccessorials.length ? setSyncedAccessorials : setLocalAccessorials;

  // Showcase assistant state
  const [showWalkthrough, setShowWalkthrough] = useState(true);

  // Synced with Supabase via useAccounts hook.

  // Reset entire state callback
  const handleResetDemoData = () => {
    if (confirm('Verify: Reset to initial factory-fresh Drayage Customer Onboarding demo datasets? This clears any modifications.')) {
      setAccounts(INITIAL_ACCOUNTS);
      setContacts(INITIAL_CONTACTS);
      setAccessorials(INITIAL_ACCESSORIALS);
      setSelectedAccountId('act_1');
      setActiveTab('kanban');
    }
  };

  const handleUpdateAccountStage = async (accountId: string, newStage: PipelineStage) => {
    // Optimistic UI update
    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, stage: newStage } : a));
    // Persist to Supabase
    await supabase.from('accounts').update({ stage: newStage }).eq('id', accountId);
  };

  const handleSelectAccount = (accountId: string) => {
    setSelectedAccountId(accountId);
    setActiveTab('dashboard');
  };

  const handleUpdateAccount = async (updatedAccount: Account) => {
    setAccounts(prev => prev.map(a => a.id === updatedAccount.id ? updatedAccount : a));
    if (!updatedAccount.id.startsWith('act_')) {
      const { error } = await supabase.from('accounts').update(accountUpdatePayload(updatedAccount)).eq('id', updatedAccount.id);
      if (error) console.error('Failed to persist account update:', error);
    }
  };

  const handleAddAccount = (name: string, billToCode = '') => {
    const newId = 'act_' + Date.now();
    
    // Create new Account - blanked out for onboarding. Bill-to code stays empty unless manually entered.
    const newAct = createBlankOnboardingAccount(newId, name, billToCode);

    // Create twin default Accessorial Object
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
    setSelectedAccountId(newId);
    setActiveTab('dashboard');
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
      const { error } = await supabase.from('accessorial_sops').update(payload).eq('id', updatedSOP.id);
      if (error) console.error('Failed to persist SOP update:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans select-none antialiased">
      
      {/* Upper Navigation Bar */}
      <header className="bg-[#0F172A] text-white border-b border-slate-750 sticky top-0 z-50 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-600 bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-md">
              <Building2 className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white tracking-tight text-base sm:text-lg">Forrest Logistics</span>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-black tracking-widest px-1.5 py-0.5 rounded">
                  CUSTOMER ONBOARDING CRM
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium font-mono">Port & Rail Drayage Customer Qualification & Compliance Suite</p>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'kanban' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              Onboarding Pipeline & Forms
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <UserSquare2 className="w-4 h-4" />
              Customer 360-View & Audit
            </button>
          </div>

          {/* Quick Resets & Presenter Info */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleResetDemoData}
              className="text-white hover:text-slate-200 py-1.5 px-3 border border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1 bg-slate-800 cursor-pointer"
              title="Reset Database to Default Mock Datasets"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Demo
            </button>
            
            <span className="text-slate-700 border-l h-5 hidden sm:block"></span>
            
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-[10px] text-slate-400 font-bold block">SPECIALIST:</span>
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">Tanya Wahl</span>
              <span className="text-[9px] text-blue-300 font-semibold block leading-tight">Customer Onboarding Lead</span>
            </div>
          </div>

        </div>
      </header>

      {/* Mobile Tab bar */}
      <div className="flex sm:hidden bg-slate-900 border-b border-slate-950 px-2 py-1.5 overflow-x-auto gap-1 text-white select-none">
        <button
          onClick={() => setActiveTab('kanban')}
          className={`flex-1 px-3 py-1.5 rounded text-xs font-bold text-center ${
            activeTab === 'kanban' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300'
          }`}
        >
          Pipeline & Forms
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 px-3 py-1.5 rounded text-xs font-bold text-center ${
            activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300'
          }`}
        >
          Customer 360-View
        </button>
      </div>

      {/* Service Status Bar */}
      {(accountsError || !isRealtimeConnected) && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-3 items-center text-xs font-medium text-amber-700">
            {accountsError && (
              <span className="flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5" />
                Customer data temporarily unavailable.
                <button onClick={retryAccounts} className="underline hover:no-underline">Retry</button>
              </span>
            )}
            {!isRealtimeConnected && !loading && (
              <span className="flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5" />
                Live updates temporarily unavailable. Refresh to see latest changes.
              </span>
            )}
          </div>
        </div>
      )}

      {/* PRESENTATION PLAYBOOK FLOATER PANEL */}
      {showWalkthrough && (
        <section className="bg-blue-50/80 border-b border-blue-200 px-4 py-3 text-slate-900 shadow-inner">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex gap-2.5 items-start">
              <div className="p-1 rounded bg-blue-600 text-white font-bold text-sm shrink-0 shadow-sm">
                <Star className="w-5 h-5 fill-current" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900">
                  Drayage Customer Onboarding CRM — Specialized Workflow Guide
                </p>
                <p className="text-[11px] text-slate-650 leading-relaxed font-semibold">
                  Pre-loaded with drayage customer profiles, credit audit logic, document vaults, and SOP compliance rules. Use these 4 quick anchors to present:
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowWalkthrough(false)}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-200/60 hover:bg-slate-200 px-2.5 py-1 rounded border border-slate-300 transition cursor-pointer self-stretch md:self-auto text-center"
            >
              Hide Guide
            </button>
          </div>

          {/* Quick Playbook Anchor shortcuts */}
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-4 gap-2.5 mt-2.5">
            <button
              onClick={() => {
                setActiveTab('kanban');
              }}
              className="bg-white hover:bg-slate-50 border border-slate-200 p-2 rounded-lg text-left text-[11px] font-medium text-slate-700 transition cursor-pointer hover:border-blue-400 group shadow-2xs"
            >
              <strong className="text-slate-900 block group-hover:text-blue-600 transition-colors">1. 5-Stage Onboarding Kanban</strong>
              "Drag & drop customer accounts through Inquiry, Credit Agreement, Account Setup, Kickoff, and Active Operations."
            </button>

            <button
              onClick={() => {
                setActiveTab('kanban');
                setTimeout(() => {
                  const target = document.getElementById('interactive_onboarding_workspace');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                }, 150);
              }}
              className="bg-white hover:bg-slate-50 border border-slate-200 p-2 rounded-lg text-left text-[11px] font-medium text-slate-700 transition cursor-pointer hover:border-blue-400 group shadow-2xs"
            >
              <strong className="text-slate-900 block group-hover:text-blue-600 transition-colors">2. Interactive Forms & Vault Export</strong>
              "Fill Onboarding Checklists, External Customer Questionnaires, or Internal Agendas and sign-off directly into Document Vault."
            </button>

            <button
              onClick={() => {
                setSelectedAccountId('act_1');
                setActiveTab('dashboard');
              }}
              className="bg-white hover:bg-slate-50 border border-slate-200 p-2 rounded-lg text-left text-[11px] font-medium text-slate-700 transition cursor-pointer hover:border-blue-400 group shadow-2xs"
            >
              <strong className="text-slate-900 block group-hover:text-blue-600 transition-colors">3. Document Vault & Upload Preview</strong>
              "Select Chalas profile. Preview signed credit applications, contracts, and SOP files with live lightbox viewer."
            </button>

            <button
              onClick={() => {
                setSelectedAccountId('act_1');
                setActiveTab('dashboard');
              }}
              className="bg-white hover:bg-slate-50 border border-slate-200 p-2 rounded-lg text-left text-[11px] font-medium text-slate-700 transition cursor-pointer hover:border-blue-400 group shadow-2xs"
            >
              <strong className="text-slate-900 block group-hover:text-blue-600 transition-colors">4. Red Flag Alarms & Accessorial SOPs</strong>
              "Inspect critical early-morning delivery alarms, pre-pull rules, chassis split fees, and contact role escalation directory."
            </button>
          </div>
        </section>
      )}

      {/* Primary Application Page Wrapper */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        
        {/* Render Active Tab */}
        <div className="min-h-[500px]">
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
                onSelectAccount={setSelectedAccountId}
                onUpdateAccount={handleUpdateAccount}
                onAddContact={handleAddContact}
                onDeleteContact={handleDeleteContact}
                onUpdateAccessorials={handleUpdateAccessorials}
              />
            </ErrorBoundary>
          )}
        </div>

      </main>

      {/* Layout Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium gap-4">
          <p>© 2026 Forrest Logistics Drayage Customer Onboarding CRM. Managed by Tanya Wahl.</p>
          <div className="flex gap-4 items-center flex-wrap">
            <span className="hover:underline cursor-pointer">Security &amp; Credit Audit Protocol</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Terminal SOP Rules</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer" onClick={() => setShowWalkthrough(true)}>Show Demonstration Guide</span>
          </div>
        </div>
        {/* Build diagnostics — only visible in local development */}
        {APP_ENV === 'development' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400 font-mono">
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
            <span className={`flex items-center gap-1 ${isRealtimeConnected ? 'text-green-500' : 'text-slate-400'}`}>
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-lg rounded-2xl border border-red-200 bg-white p-8 shadow-sm text-center">
        <AlertOctagon className="mx-auto mb-4 h-10 w-10 text-red-600" />
        <h1 className="text-xl font-bold text-slate-900">Supabase configuration required</h1>
        <p className="mt-3 text-sm text-slate-600">
          Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the frontend environment before starting the onboarding CRM.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  // Gate the entire app on Supabase configuration being present.
  if (!isSuabaseConfigured) {
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (isAutoAuthenticating) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium">Preparing the OnDray staging workspace…</p>
          <p className="text-xs text-slate-400">Creating secure demo workspace...</p>
        </div>
      </div>
    );
  }

  if (error && authMode === 'auto_demo') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Unable to prepare the staging workspace</h2>
          <p className="text-sm text-slate-500">{error.message}</p>
          <button 
            onClick={retry}
            className="w-full bg-slate-900 text-white font-medium py-2 rounded-lg hover:bg-slate-800 transition"
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="text-center space-y-4">
             <p className="text-slate-600">Failed to establish demo session.</p>
             <button onClick={retry} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Retry</button>
          </div>
        </div>
      );
    }
    return <Login />;
  }

  return (
    <ErrorBoundary fallbackTitle="Application error — please reload">
      {authMode === 'auto_demo' && (
        <div className="bg-amber-300 text-amber-900 text-xs font-bold text-center py-1.5 flex items-center justify-center gap-2">
          <FlaskConical className="w-3.5 h-3.5" />
          Staging Demo — Synthetic Data Only — Not for Production Use
        </div>
      )}
      <MainApp />
    </ErrorBoundary>
  );
}
