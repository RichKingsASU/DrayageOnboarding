import React, { useState, useEffect } from 'react';
import { Account, PipelineStage } from '../types';
import { computeAccountStage, initializeChecklist } from '../onboardingRules';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  MapPin, 
  AlertTriangle, 
  ArrowRight,
  Sparkles,
  Building2,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  PhoneCall,
  FileText,
  Printer,
  Download,
  CheckCircle2,
  UserCheck,
  ClipboardCheck,
  Check,
  X,
  FileCode,
  Info
} from 'lucide-react';

interface KanbanBoardProps {
  accounts: Account[];
  onUpdateAccountStage: (accountId: string, newStage: PipelineStage) => void;
  onSelectAccount: (accountId: string) => void;
  onAddAccount: (name: string, billToCode: string) => void;
  onUpdateAccount?: (updatedAccount: Account) => void;
}

const STAGES: { key: PipelineStage; label: string; color: string; desc: string; icon: any }[] = [
  { 
    key: 'CustomerInquiry', 
    label: 'Customer Inquiry', 
    color: 'bg-blue-50/70 border-blue-200 text-blue-700 hover:bg-blue-100/40', 
    desc: 'New leads & pricing requests',
    icon: PhoneCall
  },
  { 
    key: 'Agreement', 
    label: 'Agreement / Credit App', 
    color: 'bg-teal-50/70 border-teal-200 text-teal-800 hover:bg-teal-100/40', 
    desc: 'Credit check & contract prep',
    icon: FileCheck2
  },
  { 
    key: 'AccountSetup', 
    label: 'Account Setup', 
    color: 'bg-slate-50/80 border-slate-205 text-slate-700 hover:bg-slate-100/40', 
    desc: 'SOP mapping & document audit',
    icon: Layers
  },
  { 
    key: 'OperationalKickoff', 
    label: 'Operational Kickoff', 
    color: 'bg-indigo-50/70 border-indigo-200 text-indigo-700 hover:bg-indigo-100/40', 
    desc: 'First dispatch & pilot lanes',
    icon: Sparkles
  },
  { 
    key: 'OngoingSupport', 
    label: 'Active & Ongoing Support', 
    color: 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100/40', 
    desc: 'Regular billing & dispatch',
    icon: TrendingUp
  }
];

export default function KanbanBoard({ 
  accounts, 
  onUpdateAccountStage, 
  onSelectAccount, 
  onAddAccount, 
  onUpdateAccount 
}: KanbanBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');

  // Selected account for forms tracker workspace
  const [selectedFormAccountId, setSelectedFormAccountId] = useState<string | null>(accounts[0]?.id || null);
  const [activeFormTab, setActiveFormTab] = useState<'checklist' | 'external' | 'internal'>('checklist');
  const [successPublishMessage, setSuccessPublishMessage] = useState<string | null>(null);

  // Form states
  const [checklistState, setChecklistState] = useState({
    creditApp: false,
    db: false,
    contract: false,
    rateAgreement: 'Contract' as 'Spot' | 'Contract' | 'Tariff',
    fuelAgreement: false,
    accessorialAgreement: false,
    folderCreated: false,
    filesUploaded: false,
    internalMeetingDate: '',
    externalMeetingDate: '',
    summaryEmailSent: false,
    notes: '',
    completedBy: 'Tanya Wahl',
    completedDate: '2026-06-19'
  });

  const [externalMeetingState, setExternalMeetingState] = useState({
    agreementsSigned: false,
    opsContact: '',
    expectedVolume: '',
    seasonality: 'Steady',
    markets: '',
    otherContacts: '',
    unhookType: 'Live Unload',
    apptRequired: true,
    hoursUnloading: '',
    opsReport: false,
    getApQuestionnaire: false,
    portalCode: '',
    ediIntegration: '',
    chassisAgreement: '',
    otherService: '',
    notes: '',
    completedBy: 'Tanya Wahl',
    completedDate: '2026-06-19'
  });

  const [internalMeetingState, setInternalMeetingState] = useState({
    pricingContact: 'Tanya Wahl',
    swAccountManager: '',
    eastAccountManager: '',
    pnwAccountManager: '',
    salesContact: '',
    ediContact: '',
    ratesSent: false,
    fuelSent: false,
    accessorialsSent: false,
    notes: '',
    completedBy: 'Tanya Wahl',
    completedDate: '2026-06-19'
  });

  // Pre-fill on selected account change
  useEffect(() => {
    if (!selectedFormAccountId) return;
    const acc = accounts.find(a => a.id === selectedFormAccountId);
    if (!acc) return;

    // Load or generate checklist state using central helper rules
    const loadedChecklist = initializeChecklist(acc);
    setChecklistState(loadedChecklist);

    if (acc.isNewProspect) {
      setExternalMeetingState({
        agreementsSigned: false,
        opsContact: '',
        expectedVolume: '',
        seasonality: 'Steady',
        markets: '',
        otherContacts: '',
        unhookType: 'Live Unload',
        apptRequired: false,
        hoursUnloading: '',
        opsReport: false,
        getApQuestionnaire: false,
        portalCode: '',
        ediIntegration: '',
        chassisAgreement: '',
        otherService: '',
        notes: '',
        completedBy: 'Tanya Wahl',
        completedDate: '2026-06-19'
      });

      setInternalMeetingState({
        pricingContact: 'Tanya Wahl',
        swAccountManager: '',
        eastAccountManager: '',
        pnwAccountManager: '',
        salesContact: 'Tanya Wahl - Pricing & Onboarding Specialist',
        ediContact: '',
        ratesSent: false,
        fuelSent: false,
        accessorialsSent: false,
        notes: '',
        completedBy: 'Tanya Wahl',
        completedDate: '2026-06-19'
      });
    } else {
      setExternalMeetingState({
        agreementsSigned: acc.stage !== 'CustomerInquiry',
        opsContact: acc.id === 'act_amazon' ? 'Amazon Logistics Control Center' : acc.name.split(' ')[0] + ' Dispatch Support',
        expectedVolume: acc.id === 'act_1' ? '8-12 containers / week' : acc.id === 'act_amazon' ? '25-35 containers monthly' : '5 containers average',
        seasonality: acc.id === 'act_3' ? 'Seasonal' : 'Steady',
        markets: acc.id === 'act_amazon' ? 'West Coast ports & Greenpoint terminal' : 'East Coast ports & multi-modal hubs',
        otherContacts: acc.id === 'act_1' ? 'Cindy Myers (Billing)' : 'Escalation dispatch hotlines',
        unhookType: acc.id === 'act_2' || acc.id === 'act_amazon' ? 'Drop and Hook' : 'Live Unload',
        apptRequired: acc.id !== 'act_5',
        hoursUnloading: '07:00 AM - 16:00 PM',
        opsReport: acc.id === 'act_1' || acc.id === 'act_amazon',
        getApQuestionnaire: true,
        portalCode: acc.needsApiEdi ? 'Yes - Client Portal Integrated' : 'No - manual email lookup',
        ediIntegration: acc.needsApiEdi ? 'Yes - standard EDI 204/214 client feeds' : 'No - email drayage orders',
        chassisAgreement: acc.id === 'act_amazon' ? 'Amazon pool. Extend split lease fee $91' : 'Standard Forrest pool',
        otherService: 'Morning arrivals are time-essential.',
        notes: acc.alerts?.[0]?.message || 'No additional red flags.',
        completedBy: 'Tanya Wahl',
        completedDate: '2026-06-19'
      });

      setInternalMeetingState({
        pricingContact: 'Tanya Wahl',
        swAccountManager: acc.id === 'act_1' ? 'Sarah Myers' : acc.id === 'act_2' ? 'David Vance' : 'David Vance',
        eastAccountManager: acc.id === 'act_5' ? 'Bill Henderson' : 'None',
        pnwAccountManager: acc.id === 'act_2' ? 'Marcus Vance' : 'None',
        salesContact: 'Tanya Wahl - Pricing & Onboarding Specialist',
        ediContact: acc.needsApiEdi ? 'IT Support integrations' : 'None',
        ratesSent: true,
        fuelSent: true,
        accessorialsSent: true,
        notes: `Ready for pilot dispatch. Pricing rules established. Accessorial schedules saved.`,
        completedBy: 'Tanya Wahl',
        completedDate: '2026-06-19'
      });
    }

    // Clear previous success message when swapping accounts
    setSuccessPublishMessage(null);
  }, [selectedFormAccountId, accounts]);

  const handleChecklistChange = (field: string, checked: boolean) => {
    const next = { ...checklistState, [field]: checked };
    setChecklistState(next);

    if (selectedFormAccountId) {
      const acc = accounts.find(a => a.id === selectedFormAccountId);
      if (acc) {
        const isAuditCompleted = field === 'auditCompleted' ? checked : !!next.auditCompleted;
        
        const tempAcc: Account = {
          ...acc,
          checklistState: next,
          auditChecklistCompleted: isAuditCompleted
        };
        const targetStage = computeAccountStage(tempAcc);
        tempAcc.stage = targetStage;

        if (onUpdateAccount) {
          onUpdateAccount(tempAcc);
        } else if (targetStage !== acc.stage) {
          onUpdateAccountStage(selectedFormAccountId, targetStage);
        }
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault();
    const accountId = e.dataTransfer.getData('text/plain') || draggedId;
    if (accountId) {
      onUpdateAccountStage(accountId, targetStage);
    }
    setDraggedId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const computedCode = newCode.trim() || newName.trim().slice(0, 6).toUpperCase();
    onAddAccount(newName.trim(), computedCode);
    setNewName('');
    setNewCode('');
    setShowAddForm(false);
  };

  // Publish / Export Document to Vault callback
  const handlePublishToVault = () => {
    if (!selectedFormAccountId || !onUpdateAccount) return;
    const acc = accounts.find(a => a.id === selectedFormAccountId);
    if (!acc) return;

    let docName = '';
    let docType: 'Credit Application' | 'SOP Document' | 'Other' = 'Other';
    let contentStore: any = null;

    if (activeFormTab === 'checklist') {
      docName = `Forrest_Onboarding_Checklist_${acc.name.replace(/\s+/g, '_').replace(/,+/g, '')}.pdf`;
      docType = 'Credit Application';
      contentStore = { type: 'checklist', data: checklistState };
    } else if (activeFormTab === 'external') {
      docName = `External_Customer_Meeting_Form_${acc.name.replace(/\s+/g, '_').replace(/,+/g, '')}.pdf`;
      docType = 'Other';
      contentStore = { type: 'external', data: externalMeetingState };
    } else {
      docName = `Internal_Customer_Meeting_SOP_${acc.name.replace(/\s+/g, '_').replace(/,+/g, '')}.pdf`;
      docType = 'SOP Document';
      contentStore = { type: 'internal', data: internalMeetingState };
    }

    const newDoc = {
      id: 'doc_auto_' + Date.now(),
      name: docName,
      type: docType,
      uploadedAt: new Date().toISOString().split('T')[0],
      size: '142 KB',
      contentKey: JSON.stringify(contentStore) // Hidden store to render beautiful layout inside file preview lightbox!
    };

    // Check if document already exists, if so filter it out to represent "overwriting/re-export"
    const updatedDocs = [
      ...acc.documents.filter(d => d.name !== docName),
      newDoc
    ];

    onUpdateAccount({
      ...acc,
      documents: updatedDocs
    });

    setSuccessPublishMessage(`SUCCESS: Onboarding Form "${docName}" has been signed off and successfully exported to the Document Vault. Go to "360-View" Audit block to preview and inspect compliant receipt!`);
    
    // Auto clear success message after 10 secs
    setTimeout(() => {
      setSuccessPublishMessage(null);
    }, 10000);
  };

  // Mock download function directly downloading descriptive text of the form
  const handleDirectDownloadTXT = () => {
    if (!selectedFormAccountId) return;
    const acc = accounts.find(a => a.id === selectedFormAccountId);
    if (!acc) return;

    let content = `======================================================================\n`;
    content += `         FORREST TRANSPORTATION PORT DRAYAGE ONBOARDING PIPELINE\n`;
    content += `======================================================================\n\n`;

    if (activeFormTab === 'checklist') {
      content += `FORM TEMPLATE: CUSTOMER ONBOARDING CHECKLIST (Rev 4/18/25)\n`;
      content += `Customer Name: ${acc.name}\n`;
      content += `Date: ${checklistState.completedDate}\n`;
      content += `Completed by: ${checklistState.completedBy}\n\n`;
      content += `[${checklistState.creditApp ? 'X' : ' '}] Credit App completed\n`;
      content += `[${checklistState.db ? 'X' : ' '}] D&B evaluation check\n`;
      content += `[${checklistState.contract ? 'X' : ' '}] Contract / Liability Agreement signed\n`;
      content += `Rate Agreement Level: ${checklistState.rateAgreement}\n`;
      content += `[${checklistState.fuelAgreement ? 'X' : ' '}] Fuel program agreement matched\n`;
      content += `[${checklistState.accessorialAgreement ? 'X' : ' '}] Accessorial SOP agreed\n`;
      content += `Internal Pre-Call Meeting Scheduled: ${checklistState.internalMeetingDate}\n`;
      content += `External Customer Call Scheduled: ${checklistState.externalMeetingDate}\n\n`;
      content += `Audit Notes:\n${checklistState.notes}\n`;
    } else if (activeFormTab === 'external') {
      content += `FORM TEMPLATE: EXTERNAL NEW CUSTOMER MEETING QUESTIONNAIRE (Rev 4/18/25)\n`;
      content += `Customer Name: ${acc.name}\n`;
      content += `Date: ${externalMeetingState.completedDate}\n`;
      content += `Completed by: ${externalMeetingState.completedBy}\n\n`;
      content += `1. Are all agreements signed and in place? ${externalMeetingState.agreementsSigned ? 'Yes' : 'No'}\n`;
      content += `2. Who is our operational contact? ${externalMeetingState.opsContact}\n`;
      content += `3. What kind of volume should we expect? ${externalMeetingState.expectedVolume}\n`;
      content += `4. Is it seasonal or steady? ${externalMeetingState.seasonality}\n`;
      content += `5. What markets do they ship in? ${externalMeetingState.markets}\n`;
      content += `6. Are there other contacts for other markets? ${externalMeetingState.otherContacts}\n`;
      content += `7. Live unloads / Drops? ${externalMeetingState.unhookType}\n`;
      content += `8. Appointment required? ${externalMeetingState.apptRequired ? 'Yes' : 'No'}\n`;
      content += `9. Hours of unloading: ${externalMeetingState.hoursUnloading}\n`;
      content += `10. Require daily operations email report? ${externalMeetingState.opsReport ? 'Yes' : 'No'}\n`;
      content += `11. GET AP QUESTIONNAIRE completed? ${externalMeetingState.getApQuestionnaire ? 'Yes' : 'No'}\n`;
      content += `12. Do they have a portal? ${externalMeetingState.portalCode}\n`;
      content += `13. Do they want to integrate via EDI? ${externalMeetingState.ediIntegration}\n`;
      content += `14. Chassis agreement & extended free-time: ${externalMeetingState.chassisAgreement}\n`;
      content += `Other Service Requirements:\n${externalMeetingState.otherService}\n\n`;
      content += `Notes & Comments:\n${externalMeetingState.notes}\n`;
    } else {
      content += `FORM TEMPLATE: INTERNAL NEW CUSTOMER MEETING AGENDA (Rev 4/18/25)\n`;
      content += `Customer Name: ${acc.name}\n`;
      content += `Date: ${internalMeetingState.completedDate}\n`;
      content += `Completed by: ${internalMeetingState.completedBy}\n\n`;
      content += `Pricing Contact: ${internalMeetingState.pricingContact}\n`;
      content += `SW Account Manager: ${internalMeetingState.swAccountManager}\n`;
      content += `East Account Manager: ${internalMeetingState.eastAccountManager}\n`;
      content += `PNW Account Manager: ${internalMeetingState.pnwAccountManager}\n`;
      content += `Sales Contact: ${internalMeetingState.salesContact}\n`;
      content += `EDI / IT Contact: ${internalMeetingState.ediContact}\n\n`;
      content += `Team Operations Check-off Status:\n`;
      content += ` - Rates sent to team: ${internalMeetingState.ratesSent ? 'YES' : 'NO'}\n`;
      content += ` - Fuel program sent: ${internalMeetingState.fuelSent ? 'YES' : 'NO'}\n`;
      content += ` - Accessorial SOP details sent: ${internalMeetingState.accessorialsSent ? 'YES' : 'NO'}\n\n`;
      content += `Agenda Notes:\n${internalMeetingState.notes}\n`;
    }

    content += `\nValidated by Tanya Wahl\nPricing Specialist and Customer Onboarding Team\nForrest Transportation Logistics (Rev 4/18/25)\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Formatted_Forrest_Form_${acc.name.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalOnboarded = accounts.filter(a => a.stage === 'OngoingSupport').length;
  const inPipeline = accounts.filter(a => a.stage !== 'OngoingSupport').length;

  return (
    <div id="onboarding_kanban_section" className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Total CRM Accounts</p>
            <h3 className="text-2xl font-bold text-slate-800">{accounts.length}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">In Onboarding</p>
            <h3 className="text-2xl font-bold text-slate-800">{inPipeline}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Fully Onboarded</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalOnboarded}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Avg. Deal Volume</p>
            <h3 className="text-2xl font-bold text-slate-800">
              ${(accounts.reduce((acc, current) => acc + (current.cargoValue || 0), 0) / accounts.length / 1000).toFixed(0)}K
            </h3>
          </div>
        </div>
      </div>

      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Customer Onboarding Pipeline</h2>
          <p className="text-sm text-slate-500">Drag & drop cards to progress stage, or manage their onboarding compliance templates below</p>
        </div>
        
        <div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 bg-slate-900 border border-slate-950 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:bg-slate-800 hover:-translate-y-0.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Prospect Account
          </button>
        </div>
      </div>

      {/* Add prospect inline form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-50 p-5 rounded-xl border border-slate-200"
          >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-650 uppercase tracking-widest mb-1.5">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Western Wood Products"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-455"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-650 uppercase tracking-widest mb-1.5">Bill-To Code (Optional)</label>
                <input
                  type="text"
                  maxLength={8}
                  placeholder="e.g. WESTWOOD"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-455"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-slate-800 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-slate-700 cursor-pointer text-center"
                >
                  Create & Drop in Pipeline
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-white border border-slate-200 text-slate-600 text-sm font-semibold py-2 px-3 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageAccounts = accounts.filter(a => a.stage === stage.key);
          const StageIcon = stage.icon;

          return (
            <div
              key={stage.key}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.key)}
              className="flex-1 min-w-[240px] bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80 flex flex-col min-h-[480px] transition-colors font-sans"
            >
              {/* Column Header */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="text-slate-500">
                      <StageIcon className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm tracking-tight">{stage.label}</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                    {stageAccounts.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">{stage.desc}</p>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[500px] pr-0.5">
                {stageAccounts.length === 0 ? (
                  <div className="h-28 border border-dashed border-slate-200 rounded-lg flex items-center justify-center p-3 text-center">
                    <p className="text-xs text-slate-400">Drag accounts here to update status</p>
                  </div>
                ) : (
                  stageAccounts.map((account) => {
                    const hazardAlert = account.alerts && account.alerts.some(a => a.type === 'danger');
                    const isFormActive = selectedFormAccountId === account.id;

                    return (
                      <motion.div
                        key={account.id}
                        layoutId={`account-card-${account.id}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, account.id)}
                        className={`group relative bg-white border rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing hover:-translate-y-0.5 ${
                          isFormActive ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'
                        }`}
                      >
                        {/* Red Flag indicator */}
                        {hazardAlert && (
                          <div className="absolute top-3.5 right-3 text-red-500" title="Strict delivery terms alert!">
                            <AlertTriangle className="w-4 h-4 animate-pulse" />
                          </div>
                        )}

                        <div className="space-y-2">
                          <div>
                            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-405 bg-slate-100 px-2 py-0.5 rounded">
                              {account.billToCode}
                            </span>
                            <h4 className="font-bold text-slate-800 text-sm mt-1.5 group-hover:text-blue-600 transition-colors">
                              {account.name}
                            </h4>
                          </div>

                          {/* Quick details */}
                          <div className="flex flex-col gap-1 text-[11px] text-slate-500 font-medium">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">Terms:</span>
                              <span className="font-semibold text-slate-700">{account.creditTerms}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">Type:</span>
                              <span className="font-semibold text-slate-700">{account.equipmentType} ({account.loadType})</span>
                            </div>
                          </div>

                          {/* Action Bar */}
                          <div className="pt-2.5 border-t border-slate-100/80 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                              <span>{account.documents.length} Files in Vault</span>
                              <button
                                onClick={() => onSelectAccount(account.id)}
                                className="inline-flex items-center gap-0.5 font-bold text-slate-700 hover:text-blue-600 transition-colors"
                              >
                                Details ➔
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFormAccountId(account.id);
                                setTimeout(() => {
                                  const target = document.getElementById('interactive_onboarding_workspace');
                                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                                }, 150);
                              }}
                              className={`w-full inline-flex items-center justify-center gap-1 text-xs font-bold py-1.5 rounded transition ${
                                isFormActive 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              } cursor-pointer`}
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              Onboarding Tracker
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================================== */}
      {/* ONBOARDING COMPLIANCE & MEETINGS WORKSPACE (REPLICATES NEW CUSTOMER TRACKER FORMS) */}
      {/* ========================================================================================== */}
      <AnimatePresence>
        {selectedFormAccountId && (
          (() => {
            const currentAcc = accounts.find(a => a.id === selectedFormAccountId);
            if (!currentAcc) return null;

            return (
              <motion.div
                id="interactive_onboarding_workspace"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="bg-white rounded-2xl border border-slate-205 shadow-md overflow-hidden font-sans"
              >
                {/* Header Banner */}
                <div className="bg-slate-900 border-b border-slate-950 p-4.5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-blue-600 text-white">
                      <FileText className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm tracking-tight">Onboarding Forms & Document Workspace</span>
                        <span className="bg-blue-500/20 border border-blue-500 text-blue-300 text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded uppercase font-mono">
                          Tanya Wahl Active
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Filling digital compliance checklists and meeting audits for customer: <strong className="text-white">{currentAcc.name}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto self-stretch select-none md:self-auto">
                    <span className="text-xs text-slate-400 font-medium hidden sm:inline">Swap Customer:</span>
                    <select
                      value={selectedFormAccountId}
                      onChange={(e) => setSelectedFormAccountId(e.target.value)}
                      className="bg-slate-800 text-white border border-slate-700 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold flex-1 md:flex-initial"
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.billToCode})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sub Tab selection */}
                <div className="border-b border-slate-200 bg-slate-50 px-4.5 py-2.5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setActiveFormTab('checklist')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                        activeFormTab === 'checklist'
                          ? 'bg-white border-slate-300 text-slate-850 shadow-sm'
                          : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <ClipboardCheck className={`w-4 h-4 ${activeFormTab === 'checklist' ? 'text-blue-550' : ''}`} />
                      Customer Onboarding Checklist (Rev 4/18/25)
                    </button>

                    <button
                      onClick={() => setActiveFormTab('external')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                        activeFormTab === 'external'
                          ? 'bg-white border-slate-300 text-slate-850 shadow-sm'
                          : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <PhoneCall className={`w-4 h-4 ${activeFormTab === 'external' ? 'text-blue-550' : ''}`} />
                      External New Customer Meeting Form
                    </button>

                    <button
                      onClick={() => setActiveFormTab('internal')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                        activeFormTab === 'internal'
                          ? 'bg-white border-slate-300 text-slate-850 shadow-sm'
                          : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <UserCheck className={`w-4 h-4 ${activeFormTab === 'internal' ? 'text-blue-550' : ''}`} />
                      Internal New Customer Meeting Agenda
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDirectDownloadTXT}
                      className="bg-white border border-slate-205 py-1.5 px-3 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1 transition cursor-pointer"
                      title="Download clean plain-text template file"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      Download Forms TXT
                    </button>

                    <button
                      onClick={handlePublishToVault}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-1.5 px-4 rounded-lg flex items-center gap-1 shadow-sm transition cursor-pointer border border-blue-500/20"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Sign & Publish to Vault
                    </button>
                  </div>
                </div>

                {/* Success Banner */}
                {successPublishMessage && (
                  <div className="m-4 mx-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-semibold flex items-start gap-2.5 animate-flash">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-900">Signed Document Exported Successfully</p>
                      <p className="font-medium text-emerald-700 mt-1">{successPublishMessage}</p>
                    </div>
                  </div>
                )}

                {/* FORM WORKSPACE PAPER GRID */}
                <div className="p-6 md:p-8 bg-slate-100/50 flex justify-center min-h-[460px]">
                  <div className="bg-white rounded-xl border border-slate-200 shadow p-6 max-w-4xl w-full min-h-[400px] flex flex-col justify-between text-slate-800 relative">
                    
                    {/* Background revision watermark */}
                    <span className="absolute top-2.5 right-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                      Forrest Transportation • Rev 4/18/25
                    </span>

                    <div className="space-y-6">
                      {/* Forrest branded header exactly as PDFs */}
                      <div className="flex flex-col sm:flex-row items-center justify-between border-b pb-4 gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-lg">
                            F
                          </div>
                          <div>
                            <h4 className="font-extrabold text-[#1E3A8A] text-lg tracking-tight uppercase">FORREST TRANSPORTATION</h4>
                            <p className="text-[10px] text-slate-450 tracking-wider font-bold">PORT & RAIL CONTAINER DRAYAGE PORTAL</p>
                          </div>
                        </div>
                        <div className="text-center sm:text-right">
                          <h3 className="font-black text-slate-800 text-base tracking-tight uppercase">
                            {activeFormTab === 'checklist' && 'Customer Onboarding Checklist'}
                            {activeFormTab === 'external' && 'External New Customer Meeting'}
                            {activeFormTab === 'internal' && 'Internal New Customer Meeting'}
                          </h3>
                          <p className="text-[10px] text-slate-450 font-medium">Standard Operating Compliance Rev 4/18/25</p>
                        </div>
                      </div>

                      {/* Header metadata row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border text-xs text-slate-705">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-400">Customer Name:</span>
                          <span className="font-black text-slate-800">{currentAcc.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-400">Bill-to Code:</span>
                          <span className="font-black text-slate-800 font-mono bg-slate-200 px-1.5 py-0.5 rounded text-[11px]">{currentAcc.billToCode}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-400">Audit Status:</span>
                          <span className="font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded capitalize">{currentAcc.stage === 'OngoingSupport' ? 'Active' : 'Pipeline'}</span>
                        </div>
                      </div>

                      {/* CONDITIONAL TAB RENDER : FORM 1 (ONBOARDING CHECKLIST) */}
                      {activeFormTab === 'checklist' && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black text-[#1E3A8A] uppercase tracking-wider border-b pb-1">
                            Are the following completed?
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="flex items-center gap-2.5 p-2 bg-slate-50/40 hover:bg-slate-50 rounded border transition-colors text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checklistState.creditApp}
                                onChange={(e) => handleChecklistChange('creditApp', e.target.checked)}
                                className="w-4 h-4 accent-blue-600 cursor-pointer"
                              />
                              <div>
                                <span className="font-bold block text-slate-800">Credit App Signed</span>
                                <span className="text-[10px] text-slate-400">Approved Net Terms verification</span>
                              </div>
                            </label>

                            <label className="flex items-center gap-2.5 p-2 bg-slate-50/40 hover:bg-slate-50 rounded border transition-colors text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checklistState.db}
                                onChange={(e) => handleChecklistChange('db', e.target.checked)}
                                className="w-4 h-4 accent-blue-600 cursor-pointer"
                              />
                              <div>
                                <span className="font-bold block text-slate-800">D&B Verification Check</span>
                                <span className="text-[10px] text-slate-400">Credit score assessment logged</span>
                              </div>
                            </label>

                            <label className="flex items-center gap-2.5 p-2 bg-slate-50/40 hover:bg-slate-50 rounded border transition-colors text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checklistState.contract}
                                onChange={(e) => handleChecklistChange('contract', e.target.checked)}
                                className="w-4 h-4 accent-blue-600 cursor-pointer"
                              />
                              <div>
                                <span className="font-bold block text-slate-800">Contract / Bilateral Agreement</span>
                                <span className="text-[10px] text-slate-400">Signed liability files and insurance</span>
                              </div>
                            </label>

                            <label className="flex items-center gap-2.5 p-2 bg-slate-50/40 hover:bg-slate-50 rounded border transition-colors text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checklistState.fuelAgreement}
                                onChange={(e) => handleChecklistChange('fuelAgreement', e.target.checked)}
                                className="w-4 h-4 accent-blue-600 cursor-pointer"
                              />
                              <div>
                                <span className="font-bold block text-slate-800">Fuel Matrix Agreement Set</span>
                                <span className="text-[10px] text-slate-400">DOE FSC index program loaded</span>
                              </div>
                            </label>

                            <label className="flex items-center gap-2.5 p-2 bg-slate-50/40 hover:bg-slate-50 rounded border transition-colors text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checklistState.accessorialAgreement}
                                onChange={(e) => handleChecklistChange('accessorialAgreement', e.target.checked)}
                                className="w-4 h-4 accent-blue-600 cursor-pointer"
                              />
                              <div>
                                <span className="font-bold block text-slate-800">Accessorial Schedule Settled</span>
                                <span className="text-[10px] text-slate-400">Chassis split, demurrage and pre-pull SOP</span>
                              </div>
                            </label>

                            <label className="flex items-center gap-2.5 p-2 bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50/50 rounded border transition-colors text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!checklistState.workOrderReceived}
                                onChange={(e) => handleChecklistChange('workOrderReceived', e.target.checked)}
                                className="w-4 h-4 accent-emerald-600 cursor-pointer"
                              />
                              <div>
                                <span className="font-bold block text-emerald-900">Work Order Received</span>
                                <span className="text-[10px] text-emerald-600">Official work order document received and logged</span>
                              </div>
                            </label>

                            <label className="flex items-center gap-2.5 p-2 bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50/50 rounded border transition-colors text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!checklistState.onboardingCallCompleted}
                                onChange={(e) => handleChecklistChange('onboardingCallCompleted', e.target.checked)}
                                className="w-4 h-4 accent-emerald-600 cursor-pointer"
                              />
                              <div>
                                <span className="font-bold block text-emerald-900">Customer Onboarding Call</span>
                                <span className="text-[10px] text-emerald-600">Onboarding call completed & requirements logged</span>
                              </div>
                            </label>

                            <label className="flex items-center gap-2.5 p-2 bg-blue-50/50 border-blue-200 hover:bg-blue-100/50 rounded border transition-colors text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!checklistState.auditCompleted}
                                onChange={(e) => handleChecklistChange('auditCompleted', e.target.checked)}
                                className="w-4 h-4 accent-blue-600 cursor-pointer"
                              />
                              <div>
                                <span className="font-bold block text-blue-900">Audit Checklist Completed</span>
                                <span className="text-[10px] text-blue-700">Official form sign-off and compliance validation</span>
                              </div>
                            </label>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Established Rate Agreement</label>
                              <select
                                value={checklistState.rateAgreement}
                                onChange={(e: any) => setChecklistState(prev => ({ ...prev, rateAgreement: e.target.value }))}
                                className="w-full bg-slate-50 border rounded p-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="Spot">Spot Rate matrix</option>
                                <option value="Contract">Bilateral Contract Rate</option>
                                <option value="Tariff">Standard published Tariff</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Schedule Internal Pre-Call</label>
                              <input
                                type="datetime-local"
                                value={checklistState.internalMeetingDate}
                                onChange={(e) => setChecklistState(prev => ({ ...prev, internalMeetingDate: e.target.value }))}
                                className="w-full bg-slate-50 border rounded p-1 text-xs text-slate-800 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Schedule External Customer Call</label>
                              <input
                                type="datetime-local"
                                value={checklistState.externalMeetingDate}
                                onChange={(e) => setChecklistState(prev => ({ ...prev, externalMeetingDate: e.target.value }))}
                                className="w-full bg-slate-50 border rounded p-1 text-xs text-slate-800 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Onboarding Checklist Notes</label>
                            <textarea
                              rows={2}
                              value={checklistState.notes}
                              onChange={(e) => setChecklistState(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="Type notes..."
                              className="w-full bg-slate-50 border rounded p-2 text-xs text-slate-800 focus:outline-none resize-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* CONDITIONAL TAB RENDER : FORM 2 (EXTERNAL MEETING QUESTIONS) */}
                      {activeFormTab === 'external' && (
                        <div className="space-y-3.5">
                          <h4 className="text-xs font-black text-[#1E3A8A] uppercase tracking-wider border-b pb-1">
                            External Customer Questionnaire (Rev 4/18/25)
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3.5">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">1. Operational dispatcher contact</label>
                                <input
                                  type="text"
                                  value={externalMeetingState.opsContact}
                                  onChange={(e) => setExternalMeetingState(prev => ({ ...prev, opsContact: e.target.value }))}
                                  className="w-full bg-slate-50 border rounded p-1.5 text-xs text-slate-850"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">2. Volume Expectations & Cadence</label>
                                <input
                                  type="text"
                                  value={externalMeetingState.expectedVolume}
                                  onChange={(e) => setExternalMeetingState(prev => ({ ...prev, expectedVolume: e.target.value }))}
                                  className="w-full bg-slate-50 border rounded p-1.5 text-xs text-slate-850"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-sans">3. Is volume seasonal or steady?</label>
                                <select
                                  value={externalMeetingState.seasonality}
                                  onChange={(e) => setExternalMeetingState(prev => ({ ...prev, seasonality: e.target.value }))}
                                  className="w-full bg-slate-50 border rounded p-1.5 text-xs text-slate-850 focus:outline-none"
                                >
                                  <option value="Steady">Steady Volume year-round</option>
                                  <option value="Seasonal">Seasonal Peaks / Pulses</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">4. Delivery Mode flow</label>
                                <select
                                  value={externalMeetingState.unhookType}
                                  onChange={(e) => setExternalMeetingState(prev => ({ ...prev, unhookType: e.target.value }))}
                                  className="w-full bg-slate-50 border rounded p-1.5 text-xs text-slate-850 focus:outline-none"
                                >
                                  <option value="Live Unload">Live Unload (Drivers wait on site)</option>
                                  <option value="Drop and Hook">Drop and Hook (Chassis stay in yard)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">5. Primary Shipping Markets</label>
                                <input
                                  type="text"
                                  value={externalMeetingState.markets}
                                  onChange={(e) => setExternalMeetingState(prev => ({ ...prev, markets: e.target.value }))}
                                  placeholder="e.g. LA/LB ports to Phoenix"
                                  className="w-full bg-slate-50 border rounded p-1.5 text-xs text-slate-850"
                                />
                              </div>
                            </div>

                            <div className="space-y-3.5">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">6. Customer Portal (Details)</label>
                                <input
                                  type="text"
                                  value={externalMeetingState.portalCode}
                                  onChange={(e) => setExternalMeetingState(prev => ({ ...prev, portalCode: e.target.value }))}
                                  className="w-full bg-slate-50 border rounded p-1.5 text-xs text-slate-850"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">7. EDI / API Integration requirement</label>
                                <input
                                  type="text"
                                  value={externalMeetingState.ediIntegration}
                                  onChange={(e) => setExternalMeetingState(prev => ({ ...prev, ediIntegration: e.target.value }))}
                                  className="w-full bg-slate-50 border rounded p-1.5 text-xs text-slate-850"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-sans">8. Chassis Agreement (Extended Free-Time?)</label>
                                <input
                                  type="text"
                                  value={externalMeetingState.chassisAgreement}
                                  onChange={(e) => setExternalMeetingState(prev => ({ ...prev, chassisAgreement: e.target.value }))}
                                  className="w-full bg-slate-50 border rounded p-1.5 text-xs text-slate-850"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">9. Unloading hours & Appt conditions</label>
                                <input
                                  type="text"
                                  value={externalMeetingState.hoursUnloading}
                                  onChange={(e) => setExternalMeetingState(prev => ({ ...prev, hoursUnloading: e.target.value }))}
                                  placeholder="e.g. 06:00 AM - 15:00 PM, appt required"
                                  className="w-full bg-slate-50 border rounded p-1.5 text-xs text-slate-850"
                                />
                              </div>

                              {/* Form checklist item integrations */}
                              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                                <label className="flex items-center gap-1.5 font-bold text-slate-705 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={externalMeetingState.agreementsSigned}
                                    onChange={(e) => setExternalMeetingState(prev => ({ ...prev, agreementsSigned: e.target.checked }))}
                                    className="w-4 h-4 accent-blue-600"
                                  />
                                  <span>Agreements Signed</span>
                                </label>

                                <label className="flex items-center gap-1.5 font-bold text-slate-705 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={externalMeetingState.opsReport}
                                    onChange={(e) => setExternalMeetingState(prev => ({ ...prev, opsReport: e.target.checked }))}
                                    className="w-4 h-4 accent-blue-600"
                                  />
                                  <span>Daily Ops Report</span>
                                </label>

                                <label className="flex items-center gap-1.5 font-bold text-slate-705 cursor-pointer col-span-2">
                                  <input
                                    type="checkbox"
                                    checked={externalMeetingState.getApQuestionnaire}
                                    onChange={(e) => setExternalMeetingState(prev => ({ ...prev, getApQuestionnaire: e.target.checked }))}
                                    className="w-4 h-4 accent-blue-600 animate-pulse"
                                  />
                                  <span className="text-blue-750 font-black">***GET AP QUESTIONAIRE***</span>
                                </label>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Other Service requirements & Notes</label>
                            <textarea
                              rows={2}
                              value={externalMeetingState.notes}
                              onChange={(e) => setExternalMeetingState(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="Write notes..."
                              className="w-full bg-slate-50 border rounded p-2 text-xs text-slate-800 focus:outline-none resize-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* CONDITIONAL TAB RENDER : FORM 3 (INTERNAL MEETING AGENDA) */}
                      {activeFormTab === 'internal' && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black text-[#1E3A8A] uppercase tracking-wider border-b pb-1">
                            Internal Team Meeting Roles & Check-offs (Rev 4/18/25)
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-455 mb-1 uppercase">Pricing Contact Specialist</label>
                              <input
                                type="text"
                                disabled
                                value={internalMeetingState.pricingContact}
                                className="w-full bg-slate-100 p-2 rounded border font-bold text-slate-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-455 mb-1 uppercase">SW Account Manager</label>
                              <input
                                type="text"
                                value={internalMeetingState.swAccountManager}
                                onChange={(e) => setInternalMeetingState(prev => ({ ...prev, swAccountManager: e.target.value }))}
                                className="w-full bg-slate-50 p-2 rounded border"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-455 mb-1 uppercase">East Account Manager</label>
                              <input
                                type="text"
                                value={internalMeetingState.eastAccountManager}
                                onChange={(e) => setInternalMeetingState(prev => ({ ...prev, eastAccountManager: e.target.value }))}
                                className="w-full bg-slate-50 p-2 rounded border"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-455 mb-1 uppercase">PNW Account Manager</label>
                              <input
                                type="text"
                                value={internalMeetingState.pnwAccountManager}
                                onChange={(e) => setInternalMeetingState(prev => ({ ...prev, pnwAccountManager: e.target.value }))}
                                className="w-full bg-slate-50 p-2 rounded border"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-455 mb-1 uppercase">Sales Team Lead</label>
                              <input
                                type="text"
                                value={internalMeetingState.salesContact}
                                onChange={(e) => setInternalMeetingState(prev => ({ ...prev, salesContact: e.target.value }))}
                                className="w-full bg-slate-50 p-2 rounded border"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-455 mb-1 uppercase">EDI / IT Contact Engineer</label>
                              <input
                                type="text"
                                value={internalMeetingState.ediContact}
                                onChange={(e) => setInternalMeetingState(prev => ({ ...prev, ediContact: e.target.value }))}
                                className="w-full bg-slate-50 p-2 rounded border"
                              />
                            </div>
                          </div>

                          <div className="p-3 bg-slate-50 border rounded-lg">
                            <h5 className="text-[10px] font-bold text-slate-455 uppercase mb-2">We sent the team the following drayage guidelines:</h5>
                            <div className="flex flex-wrap gap-6 text-xs font-bold text-slate-700">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={internalMeetingState.ratesSent}
                                  onChange={(e) => setInternalMeetingState(prev => ({ ...prev, ratesSent: e.target.checked }))}
                                  className="w-4 h-4 accent-blue-600"
                                />
                                <span>✔ Customer Linehaul Rates Sent</span>
                              </label>

                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={internalMeetingState.fuelSent}
                                  onChange={(e) => setInternalMeetingState(prev => ({ ...prev, fuelSent: e.target.checked }))}
                                  className="w-4 h-4 accent-blue-600"
                                />
                                <span>✔ DOE Fuel Matrix Sent</span>
                              </label>

                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={internalMeetingState.accessorialsSent}
                                  onChange={(e) => setInternalMeetingState(prev => ({ ...prev, accessorialsSent: e.target.checked }))}
                                  className="w-4 h-4 accent-blue-600"
                                />
                                <span>✔ Demurrage & Split Accessorials SOP Sent</span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Internal Meeting Notes (Agenda discussions)</label>
                            <textarea
                              rows={2}
                              value={internalMeetingState.notes}
                              onChange={(e) => setInternalMeetingState(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="Setup meeting comments..."
                              className="w-full bg-slate-50 border rounded p-2 text-xs text-slate-800 focus:outline-none resize-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Signature Sign-off footer block */}
                    <div className="mt-8 pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-505 select-none">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-400">Completed by:</span>
                        <span className="font-extrabold text-slate-850 underline decoration-dotted decoration-blue-500">Tanya Wahl</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-400">Title:</span>
                        <span className="font-bold text-slate-650">Pricing & Onboarding Specialist</span>
                      </div>
                      <div className="flex items-center gap-2 sm:justify-end">
                        <span className="font-bold text-slate-400">Sign Date:</span>
                        <span className="font-black text-slate-800">{checklistState.completedDate}</span>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="bg-slate-50 border-t p-4 px-6 text-slate-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Clicking <strong>"Sign & Publish to Vault"</strong> registers this physical compliant checklist form directly in the customer profile documents for auditing.</span>
                  </div>
                </div>

              </motion.div>
            );
          })()
        )}
      </AnimatePresence>
    </div>
  );
}
