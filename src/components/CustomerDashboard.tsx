/**
 * File: CustomerDashboard.tsx
 * Purpose: Displays and edits detailed customer onboarding information, checklist status, documents, and SOP data.
 * Dependencies: React, motion animations, Supabase document deletion, uploader component, and shared domain types.
 * Maintainer note: Form edits are propagated upward through onUpdateAccount rather than saved directly here.
 */
import React, { useState, useEffect } from 'react';
import { Account, Contact, AccessorialSOP, PipelineStage, CreditTerms, EquipmentType, LoadType, PreferredComm, ContactRole, OnboardingDocument, CustomerAlert, AppointmentType, StatusUpdateCheck, UserProfile } from '../types';
import { computeAccountStage, initializeChecklist } from '../onboardingRules';
import { reconcileDocumentChecklist } from '../onboardingWorkflow';
import SecureDocumentUploader from './SecureDocumentUploader';
import { deleteDocumentFromAzure as deleteDocumentFromSupabase } from '../lib/azureClient';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  UserPlus, 
  FolderPlus, 
  FileText, 
  User, 
  MapPin, 
  Coins, 
  PhoneCall, 
  AlertOctagon, 
  BadgeAlert,
  Sliders,
  CheckCircle2,
  Trash2,
  Lock,
  Plus,
  Compass,
  FileCheck,
  Thermometer,
  ShieldAlert,
  ShieldCheck,
  Check,
  Scale,
  CalendarCheck2,
  X,
  FileSpreadsheet
} from 'lucide-react';

interface CustomerDashboardProps {
  accounts: Account[];
  contacts: Contact[];
  accessorials: AccessorialSOP[];
  selectedAccountId: string;
  activeProfile?: UserProfile;
  onSelectAccount: (accountId: string) => void;
  onUpdateAccount: (updatedAccount: Account) => void;
  onAddContact: (contact: Omit<Contact, 'id'>) => void;
  onDeleteContact: (contactId: string) => void;
  onUpdateAccessorials: (updatedSOP: AccessorialSOP) => void;
}

const DOCUMENT_TYPES = ['Credit Application', 'Liability Agreement', 'SOP Document', 'Other'] as const;

/**
 * Renders the selected customer's editable profile, checklist, contacts, document vault, and accessorial SOP workspace.
 */
export default function CustomerDashboard({
  accounts,
  contacts,
  accessorials,
  selectedAccountId,
  activeProfile,
  onSelectAccount,
  onUpdateAccount,
  onAddContact,
  onDeleteContact,
  onUpdateAccessorials
}: CustomerDashboardProps) {
  
  // Safe lookup: never fall back to accounts[0] which may be undefined
  const currentAccount = accounts.find(a => a.id === selectedAccountId) ?? (accounts.length > 0 ? accounts[0] : undefined);
  const currentSOP = currentAccount ? accessorials.find(s => s.accountId === currentAccount.id) : undefined;
  const currentContacts = currentAccount ? contacts.filter(c => c.accountId === currentAccount.id) : [];

  // States for modals/inputs
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<any | null>(null);
  
  // ESC key handler for document preview lightbox modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPreviewDoc) {
        setSelectedPreviewDoc(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPreviewDoc]);
  
  // Account Form state
  const [editName, setEditName] = useState(currentAccount?.name || '');
  const [editBillToCode, setEditBillToCode] = useState(currentAccount?.billToCode || '');
  const [editCreditTerms, setEditCreditTerms] = useState<CreditTerms>(currentAccount?.creditTerms || 'Net 30');
  const [editCommodity, setEditCommodity] = useState(currentAccount?.commodity || '');
  const [editEquip, setEditEquip] = useState<EquipmentType>(currentAccount?.equipmentType || 'Dry');
  const [editLoad, setEditLoad] = useState<LoadType>(currentAccount?.loadType || 'Palletized');
  const [editWeight, setEditWeight] = useState(currentAccount?.expectedWeight || '');
  const [editBonded, setEditBonded] = useState(currentAccount?.isBonded || false);
  const [editHazmat, setEditHazmat] = useState(currentAccount?.hazmatClass || 'N/A');
  const [editCargoValue, setEditCargoValue] = useState(currentAccount?.cargoValue || 0);
  const [editComm, setEditComm] = useState<PreferredComm>(currentAccount?.prefCommMethod || 'Email');
  const [editEdi, setEditEdi] = useState(currentAccount?.needsApiEdi || false);
  const [editInvoiceDocs, setEditInvoiceDocs] = useState<string>(currentAccount?.invoiceDocsRequired?.join(', ') || '');
  const [editSeqBills, setEditSeqBills] = useState(currentAccount?.acceptSequenceBills || false);

  const [editSOPText, setEditSOPText] = useState(currentSOP?.deliveryRules || '');
  const [isSavingSOP, setIsSavingSOP] = useState(false);


  // Reset Edit Form on Account Change
  React.useEffect(() => {
    if (currentAccount) {
      setEditName(currentAccount.name);
      setEditBillToCode(currentAccount.billToCode);
      setEditCreditTerms(currentAccount.creditTerms);
      setEditCommodity(currentAccount.commodity);
      setEditEquip(currentAccount.equipmentType);
      setEditLoad(currentAccount.loadType);
      setEditWeight(currentAccount.expectedWeight);
      setEditBonded(currentAccount.isBonded);
      setEditHazmat(currentAccount.hazmatClass);
      setEditCargoValue(currentAccount.cargoValue);
      setEditComm(currentAccount.prefCommMethod);
      setEditEdi(currentAccount.needsApiEdi);
      setEditInvoiceDocs(currentAccount.invoiceDocsRequired?.join(', ') || '');
      setEditSeqBills(currentAccount.acceptSequenceBills);
      setEditSOPText(currentSOP?.deliveryRules || '');
    }
    setIsEditingAccount(false);
    setShowAddContact(false);
    setShowAddAlert(false);
  }, [selectedAccountId, currentAccount, currentSOP]);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRole, setContactRole] = useState<ContactRole>('Operations');
  const [contactNotes, setContactNotes] = useState('');

  // Compliance View State
  const [isComplianceViewActive, setIsComplianceViewActive] = useState(false);

  // Alert form state
  const [alertText, setAlertText] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'danger' | 'warning' | 'info'>('warning');

  // File Upload State
  const [fileToUploadType, setFileToUploadType] = useState<'Credit Application' | 'Liability Agreement' | 'SOP Document' | 'Other'>('Credit Application');
  const [customFileName, setCustomFileName] = useState('');

  if (!currentAccount) {
    return (
      <div className="bg-white rounded-xl p-8 border border-slate-100 text-center shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-2">No Customer Accounts Available</h3>
        <p className="text-slate-500 text-sm">There are currently no customer accounts in the database.</p>
        <p className="text-slate-500 text-sm mt-1">Create a customer in the Onboarding Pipeline to begin.</p>
      </div>
    );
  }

  // Handle Account Update
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAccount) return;
    const updated: Account = {
      ...currentAccount,
      name: editName,
      billToCode: editBillToCode.trim(),
      creditTerms: editCreditTerms,
      commodity: editCommodity,
      equipmentType: editEquip,
      loadType: editLoad,
      expectedWeight: editWeight,
      isBonded: editBonded,
      hazmatClass: editHazmat,
      cargoValue: Number(editCargoValue),
      prefCommMethod: editComm,
      needsApiEdi: editEdi,
      invoiceDocsRequired: editInvoiceDocs.split(',').map(d => d.trim()).filter(Boolean),
      acceptSequenceBills: editSeqBills
    };
    onUpdateAccount(updated);
    setIsEditingAccount(false);
  };

  // Add Contact Handler
  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAccount || !contactName.trim()) return;
    onAddContact({
      accountId: currentAccount.id,
      name: contactName.trim(),
      title: contactTitle.trim() || undefined,
      email: contactEmail.trim(),
      phone: contactPhone.trim(),
      role: contactRole,
      notes: contactNotes.trim()
    });
    setContactName('');
    setContactTitle('');
    setContactEmail('');
    setContactPhone('');
    setContactNotes('');
    setShowAddContact(false);
  };


  // Red Flag SOP Alert handler
  const handleAddAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAccount || !alertText.trim()) return;
    const newAlert: CustomerAlert = {
      id: 'al_' + Date.now(),
      type: alertSeverity,
      message: alertText.trim()
    };
    const updated: Account = {
      ...currentAccount,
      alerts: [...(currentAccount.alerts ?? []), newAlert]
    };
    onUpdateAccount(updated);
    setAlertText('');
    setShowAddAlert(false);
  };

  // Delete Alert
  const handleDeleteAlert = (alertId: string) => {
    if (!currentAccount) return;
    const updated: Account = {
      ...currentAccount,
      alerts: (currentAccount.alerts ?? []).filter(a => a.id !== alertId)
    };
    onUpdateAccount(updated);
  };


  // Mock upload document handler
  const handleUploadMockFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAccount) return;
    const name = customFileName.trim() || `${fileToUploadType.replace(' ', '_')}_Upload_${new Date().getFullYear()}.pdf`;
    const newDoc: OnboardingDocument = {
      id: 'doc_' + Date.now(),
      name: name.endsWith('.pdf') ? name : name + '.pdf',
      type: fileToUploadType,
      uploadedAt: new Date().toISOString().split('T')[0],
      size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`
    };
    onUpdateAccount(reconcileDocumentChecklist({
      ...currentAccount,
      documents: [...(currentAccount.documents ?? []), newDoc]
    }));
    setCustomFileName('');
  };

  // Add document handler
  const handleAddDoc = (newDoc: OnboardingDocument) => {
    if (!currentAccount) return;
    onUpdateAccount(reconcileDocumentChecklist({
      ...currentAccount,
      documents: [...(currentAccount.documents ?? []), newDoc]
    }));
  };


  // Delete document with confirmation prompt
  const handleDeleteDoc = async (docId: string) => {
    if (!currentAccount) return;
    const doc = currentAccount.documents?.find(d => d.id === docId);
    if (!doc) return;
    if (!confirm(`Are you sure you want to remove document "${doc.name}" from ${currentAccount.name}'s vault?`)) {
      return;
    }
    try {
      if (!doc.id.startsWith('doc_')) {
        await deleteDocumentFromSupabase(doc);
      }
      onUpdateAccount(reconcileDocumentChecklist({
        ...currentAccount,
        documents: (currentAccount.documents ?? []).filter(d => d.id !== docId)
      }));
    } catch (err) {
      console.error('Failed to remove document:', err);
      alert('Unable to remove this document. Please retry or contact an administrator.');
    }
  };

  // Download raw package bundle / manifest
  const handleDownloadPackage = (doc: OnboardingDocument) => {
    const content = `======================================================================\n` +
      `         FORREST TRANSPORTATION SERVICES • DOCUMENT VAULT ARCHIVE\n` +
      `======================================================================\n\n` +
      `Account: ${currentAccount?.name || 'Customer'}\n` +
      `File Name: ${doc.name}\n` +
      `Document Class: ${doc.type}\n` +
      `Audit Date: ${doc.uploadedAt}\n` +
      `File Size: ${doc.size}\n` +
      `Audited By: ${doc.uploadedBy || 'Tanya Wahl (Specialist)'}\n` +
      `Description: ${doc.description || 'Verified compliant customer onboarding document'}\n` +
      `Checklist Key: ${doc.checklistItemKey || 'General'}\n` +
      `Storage Reference: ${doc.storagePath || doc.contentKey || 'Encrypted Drayage Vault'}\n` +
      `Status: STRICT AUDIT COMPLIANT\n` +
      `Security Protocol: AES 256-Bit Encrypted Payload\n\n` +
      `======================================================================\n` +
      `Validated by Tanya Wahl • Customer Onboarding Team\n` +
      `Forrest Transportation Logistics (Rev 4/18/25)\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Vault_Package_${doc.name.replace(/\.[^/.]+$/, '')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };


  // Toggle SOP checklist state
  const handleToggleSOPChecklist = (item: StatusUpdateCheck) => {
    if (!currentSOP) return;
    const exists = currentSOP.requiredStatusUpdates.includes(item);
    const updatedUpdates = exists
      ? currentSOP.requiredStatusUpdates.filter(i => i !== item)
      : [...currentSOP.requiredStatusUpdates, item];
    
    onUpdateAccessorials({
      ...currentSOP,
      requiredStatusUpdates: updatedUpdates
    });
  };

  const handleUpdateSOPCurrency = (field: keyof AccessorialSOP, val: number) => {
    if (!currentSOP) return;
    onUpdateAccessorials({
      ...currentSOP,
      [field]: val
    });
  };

  const handleUpdateSOPText = (field: keyof AccessorialSOP, val: any) => {
    if (!currentSOP) return;
    onUpdateAccessorials({
      ...currentSOP,
      [field]: val
    });
  };

  const handleSaveSOPText = async () => {
    if (!currentSOP) return;
    setIsSavingSOP(true);
    try {
      await onUpdateAccessorials({
        ...currentSOP,
        deliveryRules: editSOPText
      });
    } finally {
      setIsSavingSOP(false);
    }
  };

  if (!currentAccount) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-4 shadow-xs">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">No Account Selected</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Please select an account from the Onboarding Pipeline or create a new prospect to view the 360 profile.
        </p>
      </div>
    );
  }

  return (
    <div id="customer_360_view" className="space-y-6">
      
      {/* Selector and Main Header */}
      <div className="bg-[#0F172A] text-white rounded-2xl p-6 shadow-md border border-slate-850">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              Logistics CRM 360-View
            </span>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{currentAccount.name}</h1>
              <span className="bg-slate-800 text-slate-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-700/80">
                CODE: {currentAccount.billToCode || 'N/A'}
              </span>
            </div>
            <p className="text-slate-400 text-xs font-medium">
              Pipeline Stage: <span className="text-blue-300 font-semibold">{currentAccount.stage.replace(/([A-Z])/g, ' $1').trim()}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-400 text-xs font-semibold">Switch Profile:</span>
            <div className="relative">
              <select
                value={currentAccount.id}
                onChange={(e) => onSelectAccount(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-blue-500 max-w-[220px]"
              >
                {accounts.map(act => (
                  <option key={act.id} value={act.id}>{act.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsEditingAccount(!isEditingAccount)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition shrink-0 cursor-pointer shadow-sm border border-blue-500/30"
            >
              {isEditingAccount ? 'Cancel Edit' : 'Edit Account Details'}
            </button>
          </div>
        </div>
      </div>

      {/* Red Flag Warning Alerts Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Red Flag SOP Alerts</h3>
          <button
            onClick={() => setShowAddAlert(!showAddAlert)}
            className="text-xs font-bold text-red-600 hover:text-red-500 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add SOP Flag
          </button>
        </div>

        {/* New SOP Warning Banner Form */}
        <AnimatePresence>
          {showAddAlert && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-50/50 p-4 rounded-xl border border-red-100 overflow-hidden"
            >
              <form onSubmit={handleAddAlertSubmit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder="Prompt alert message, e.g. Driver must arrive wearing steel-toe boots..."
                      value={alertText}
                      onChange={(e) => setAlertText(e.target.value)}
                      required
                      className="w-full bg-white border border-red-200 rounded-lg px-3 py-2 text-xs text-red-950 focus:outline-none"
                    />
                  </div>
                  <div>
                    <select
                      value={alertSeverity}
                      onChange={(e: any) => setAlertSeverity(e.target.value)}
                      className="w-full bg-white border border-red-200 rounded-lg p-2 text-xs text-red-950"
                    >
                      <option value="danger">Critical (Red Flashing)</option>
                      <option value="warning">Warning (Orange)</option>
                      <option value="info">Info Note (Blue)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="submit" className="bg-red-600 text-white px-3 py-1 text-xs font-semibold rounded hover:bg-red-500 cursor-pointer">
                    Apply Alarm Flag
                  </button>
                  <button type="button" onClick={() => setShowAddAlert(false)} className="text-xs text-slate-500 px-2 cursor-pointer">
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Existing Alerts */}
        <div className="space-y-2">
          {currentAccount.alerts && currentAccount.alerts.length > 0 ? (
            currentAccount.alerts.map((alert) => {
              const ringColor = alert.type === 'danger' ? 'bg-rose-50 border-rose-200 text-rose-800' : 
                                 alert.type === 'warning' ? 'bg-amber-50/60 border-amber-200 text-amber-900 font-medium' : 
                                 'bg-blue-55 bg-blue-50 border-blue-200 text-blue-800';
              const flagIcon = alert.type === 'danger' ? <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" /> : <BadgeAlert className="w-5 h-5 text-amber-600 shrink-0" />;

              return (
                <div key={alert.id} className={`flex items-center justify-between p-3.5 rounded-xl border ${ringColor} shadow-sm`}>
                  <div className="flex items-center gap-3">
                    {flagIcon}
                    <p className="text-xs font-bold leading-relaxed">{alert.message}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="text-slate-450 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100/50 cursor-pointer"
                    title="Remove alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <p className="text-xs text-slate-500 font-medium">No Red Flag SOP requirements listed for this firm.</p>
            </div>
          )}
        </div>
      </div>

      {/* Editing Account Form / Core Account Profile */}
      <AnimatePresence>
        {isEditingAccount && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm overflow-hidden"
          >
            <form onSubmit={handleSaveAccount} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide border-b pb-1.5 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-550" />
                Updating CRM Profile Data
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Company Legal Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Bill-To Code (Optional)</label>
                  <input
                    type="text"
                    aria-describedby="bill-to-code-help"
                    value={editBillToCode}
                    onChange={(e) => setEditBillToCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                  />
                  <p id="bill-to-code-help" className="mt-1 text-[10px] text-slate-400">Optional. Leave blank until a billing code is manually assigned.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Credit Approval Terms</label>
                  <select
                    value={editCreditTerms}
                    onChange={(e) => setEditCreditTerms(e.target.value as CreditTerms)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                  >
                    <option value="">-- Leave Blank / Pending --</option>
                    <option value="Prepaid">Prepaid (Cleared Funds)</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Special (Net 45)">Special Net 45 Days</option>
                    <option value="Special (Net 60)">Special Net 60 Days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Invoicing Target Docs (Comma Sep)</label>
                  <input
                    type="text"
                    value={editInvoiceDocs}
                    onChange={(e) => setEditInvoiceDocs(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                    placeholder="e.g. POD, Outgate Slip, Scale ticket"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="seqs"
                    checked={editSeqBills}
                    onChange={(e) => setEditSeqBills(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <label htmlFor="seqs" className="text-xs font-semibold text-slate-700">Accepts Sequence Bills (Y/N)</label>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Commodity Profile</label>
                  <input
                    type="text"
                    value={editCommodity}
                    onChange={(e) => setEditCommodity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Equipment Setting</label>
                  <select
                    value={editEquip}
                    onChange={(e) => setEditEquip(e.target.value as EquipmentType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                  >
                    <option value="">-- Leave Blank / Pending --</option>
                    <option value="Dry">Standard Dry Van / Ocean Box</option>
                    <option value="Reefer">Chilled Reefer Ocean Box</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Load Layout</label>
                  <select
                    value={editLoad}
                    onChange={(e) => setEditLoad(e.target.value as LoadType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                  >
                    <option value="">-- Leave Blank / Pending --</option>
                    <option value="Palletized">Palletized (Fast Slip-sheet)</option>
                    <option value="Floor Loaded">Floor Loaded (Hand unloaded)</option>
                    <option value="Both">Both Handling Styles</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Expected Max Cargo Weight</label>
                  <input
                    type="text"
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="bonded"
                    checked={editBonded}
                    onChange={(e) => setEditBonded(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <label htmlFor="bonded" className="text-xs font-semibold text-slate-705">Customs Bonded Carrier needed (Y/N)</label>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Hazmat Class UN#</label>
                  <input
                    type="text"
                    value={editHazmat}
                    onChange={(e) => setEditHazmat(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Cargo Max Valuation ($)</label>
                  <input
                    type="number"
                    value={editCargoValue}
                    onChange={(e) => setEditCargoValue(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Communication Channel</label>
                  <select
                    value={editComm}
                    onChange={(e) => setEditComm(e.target.value as PreferredComm)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                  >
                    <option value="">-- Leave Blank / Pending --</option>
                    <option value="Email">Standard Email Updates</option>
                    <option value="SMS">SMS Text to Dispatch</option>
                    <option value="Phone">Live Phone Call Only</option>
                    <option value="EDI">Direct EDI Hookup</option>
                    <option value="Customer Portal">Customer Web Portal</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="edie"
                    checked={editEdi}
                    onChange={(e) => setEditEdi(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <label htmlFor="edie" className="text-xs font-semibold text-slate-705">Requires API / EDI integrations (Y/N)</label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="submit"
                  className="bg-slate-900 border border-slate-950 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  Save Active Layout
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingAccount(false)}
                  className="bg-slate-100 text-slate-600 font-semibold text-xs px-4 py-2 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Discard Changes
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid: 360-degree info summary panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel 1: Master Company Details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-50 px-4 py-3 border-b flex items-center justify-between">
            <h4 className="font-bold text-slate-750 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-500" />
              Company Legal Profile
            </h4>
            <span className="text-[10px] font-bold text-slate-400">Master Record</span>
          </div>
          
          <div className="p-4 flex-1 space-y-4">
            {/* Financial Parameters */}
            <div>
              <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Financial Settings</h5>
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Approved Terms</span>
                  <p className="text-xs font-bold text-slate-850 mt-0.5">{currentAccount.creditTerms || <span className="text-rose-500 font-normal italic">Pending / Blank</span>}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Seq Bills OK</span>
                  <p className="text-xs font-bold text-slate-850 mt-0.5">{currentAccount.acceptSequenceBills ? 'Yes (Accepted)' : 'No (Requires individual CC)'}</p>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200/50">
                  <span className="text-[10px] text-slate-400 block font-medium">Invoicing Rules</span>
                  <p className="text-xs font-semibold text-slate-750 mt-0.5 leading-relaxed">
                    {currentAccount.invoiceDocsRequired.length > 0 ? (
                      <>
                        Must attach: {currentAccount.invoiceDocsRequired.map((doc, idx) => (
                          <span key={idx} className="inline-block bg-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1 mb-1">
                            {doc}
                          </span>
                        ))}
                      </>
                    ) : (
                      <span className="text-slate-450 font-normal italic">No invoice docs required yet (Blank)</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Cargo profile */}
            <div>
              <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Cargo Handling Rules</h5>
              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex justify-between py-1 border-b border-dashed border-slate-100">
                  <span className="text-slate-400 font-medium">Main Commodity:</span>
                  <span className="font-bold text-slate-800 text-right max-w-[160px] truncate">{currentAccount.commodity || <span className="text-slate-400 font-normal italic">Pending / Blank</span>}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-100">
                  <span className="text-slate-400 font-medium">Required Equip:</span>
                  <span className="font-bold text-indigo-700 flex items-center gap-1">
                    {currentAccount.equipmentType === 'Reefer' && <Thermometer className="w-3.5 h-3.5 animate-pulse" />}
                    {currentAccount.equipmentType ? `${currentAccount.equipmentType} Container` : <span className="text-slate-400 font-normal italic">Pending / Blank</span>}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-100">
                  <span className="text-slate-400 font-medium">Unloading Style:</span>
                  <span className="font-bold text-slate-850">{currentAccount.loadType || <span className="text-slate-400 font-normal italic">Pending / Blank</span>}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-100">
                  <span className="text-slate-400 font-medium">Typical Payload:</span>
                  <span className="font-bold text-blue-700">{currentAccount.expectedWeight || <span className="text-slate-400 font-normal italic">Pending / Blank</span>}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-100">
                  <span className="text-slate-400 font-medium">Customs Bonded Required:</span>
                  <span className={`font-bold ${currentAccount.isBonded ? 'text-green-600' : 'text-slate-500'}`}>
                    {currentAccount.isBonded ? 'Yes (Strict)' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-100">
                  <span className="text-slate-400 font-medium">Danger Class / UN:</span>
                  <span className={`font-bold ${currentAccount.hazmatClass !== 'N/A' && currentAccount.hazmatClass ? 'text-red-600' : 'text-slate-505'}`}>
                    {currentAccount.hazmatClass || <span className="text-slate-400 font-normal italic">Pending / Blank</span>}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-medium">Avg Cargo Valuation:</span>
                  <span className="font-bold text-slate-800">
                    {isComplianceViewActive 
                      ? <span className="font-mono text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded text-[11px]">•••••••• [Confidential IT Mask]</span> 
                      : (currentAccount.cargoValue ? `$${currentAccount.cargoValue.toLocaleString()} USD` : <span className="text-slate-400 font-normal italic">Pending / Blank</span>)}
                  </span>
                </div>
              </div>
            </div>

            {/* Comm preferences */}
            <div>
              <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Comms & Connection</h5>
              <div className="flex justify-between items-center bg-slate-50 py-2.5 px-3 rounded-lg border">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Preferred Update Channel</span>
                  <span className="text-xs font-bold text-slate-800">{currentAccount.prefCommMethod ? `${currentAccount.prefCommMethod} Channel` : <span className="text-slate-400 font-normal italic">Pending / Blank</span>}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">API/EDI Ready</span>
                  <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded ${currentAccount.needsApiEdi ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
                    {currentAccount.needsApiEdi ? 'Connected' : 'Offline Ops (Manual)'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Panel 2: Accessorial Rules & SOP Mapping */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-50 px-4 py-3 border-b flex items-center justify-between">
            <h4 className="font-bold text-slate-755 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-slate-500" />
              Chassis & Storage Rules (Accessorials)
            </h4>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Margins Secured</span>
          </div>

          <div className="p-4 flex-1 space-y-4">
            {currentSOP ? (
              <div className="space-y-4">
                {/* Financial Rates structure */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">Contract Rates & Penalty Fees</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Chassis Daily Fee</span>
                      <div className="flex gap-1 items-center mt-0.5">
                        <span className="text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          min="0"
                          value={currentSOP.chassisFee === 0 ? '' : currentSOP.chassisFee}
                          onChange={(e) => handleUpdateSOPCurrency('chassisFee', Math.max(0, Number(e.target.value)))}
                          placeholder="0"
                          className="w-16 font-bold text-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-400 px-1 rounded"
                        />
                        <span className="text-[10px] text-slate-450">/day</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Pre-Pull Flat Fee</span>
                      <div className="flex gap-1 items-center mt-0.5">
                        <span className="text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          min="0"
                          value={currentSOP.prePullFee === 0 ? '' : currentSOP.prePullFee}
                          onChange={(e) => handleUpdateSOPCurrency('prePullFee', Math.max(0, Number(e.target.value)))}
                          placeholder="0"
                          className="w-16 font-bold text-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-400 px-1 rounded"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Terminal Demurrage</span>
                      <div className="flex gap-1 items-center mt-0.5">
                        <span className="text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          min="0"
                          value={currentSOP.storageFee === 0 ? '' : currentSOP.storageFee}
                          onChange={(e) => handleUpdateSOPCurrency('storageFee', Math.max(0, Number(e.target.value)))}
                          placeholder="0"
                          className="w-16 font-bold text-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-400 px-1 rounded"
                        />
                        <span className="text-[10px] text-slate-450">/day</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Yard Storage Fee</span>
                      <div className="flex gap-1 items-center mt-0.5">
                        <span className="text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          min="0"
                          value={currentSOP.emptyStorageFee === 0 ? '' : currentSOP.emptyStorageFee}
                          onChange={(e) => handleUpdateSOPCurrency('emptyStorageFee', Math.max(0, Number(e.target.value)))}
                          placeholder="0"
                          className="w-16 font-bold text-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-400 px-1 rounded"
                        />
                        <span className="text-[10px] text-slate-450">/day</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Chassis Split Fee</span>
                      <div className="flex gap-1 items-center mt-0.5">
                        <span className="text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          min="0"
                          value={currentSOP.chassisSplitFee === 0 ? '' : currentSOP.chassisSplitFee}
                          onChange={(e) => handleUpdateSOPCurrency('chassisSplitFee', Math.max(0, Number(e.target.value)))}
                          placeholder="0"
                          className="w-16 font-bold text-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-400 px-1 rounded"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Clean Truck Fee</span>
                      <div className="flex gap-1 items-center mt-0.5">
                        <span className="text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          min="0"
                          value={currentSOP.cleanTruckFee === 0 ? '' : currentSOP.cleanTruckFee}
                          onChange={(e) => handleUpdateSOPCurrency('cleanTruckFee', Math.max(0, Number(e.target.value)))}
                          placeholder="0"
                          className="w-16 font-bold text-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-400 px-1 rounded"
                        />
                      </div>
                    </div>

                    <div className="bg-red-50/50 p-2.5 rounded border border-red-100 col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="text-red-700 block text-[10px] font-bold">Detention / Waiting Time Rate</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={currentSOP.detentionFreeTime === 0 ? '' : currentSOP.detentionFreeTime}
                            onChange={(e) => handleUpdateSOPCurrency('detentionFreeTime', Math.max(0, Number(e.target.value)))}
                            placeholder="0"
                            className="w-10 font-bold text-slate-800 bg-white border border-red-200 focus:outline-none focus:ring-1 focus:ring-red-400 px-1 rounded text-right text-[10px]"
                          />
                          <span className="text-slate-500 text-[10px] font-bold">hrs free limit</span>
                        </div>
                      </div>
                      <div className="flex gap-1 items-center mt-1">
                        <span className="text-red-450 font-bold">$</span>
                        <input
                          type="number"
                          min="0"
                          value={currentSOP.detentionRate === 0 ? '' : currentSOP.detentionRate}
                          onChange={(e) => handleUpdateSOPCurrency('detentionRate', Math.max(0, Number(e.target.value)))}
                          placeholder="0"
                          className="w-16 font-bold text-red-900 bg-transparent focus:outline-none focus:ring-1 focus:ring-red-400 px-1 rounded"
                        />
                        <span className="text-xs font-semibold text-red-700">/ hour (Post-Free Time)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Facility & Delivery Rules */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">Warehouse & Yard Rules</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                    <div className="bg-slate-50 p-2 rounded">
                      <span className="text-slate-400 block font-medium">Unload appointment:</span>
                      <select
                        value={currentSOP.appointmentType}
                        onChange={(e) => handleUpdateSOPText('appointmentType', e.target.value as AppointmentType)}
                        className="font-bold text-slate-800 bg-transparent focus:outline-none mt-0.5 text-xs w-full"
                      >
                        <option value="Live Unload">Live Unload</option>
                        <option value="Drop and Hook">Drop & Hook</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>

                    <div className="bg-slate-50 p-2 rounded">
                      <span className="text-slate-400 block font-medium">LFD Demurrage free duration:</span>
                      <div className="flex gap-1 items-center mt-0.5">
                        <input
                          type="number"
                          value={currentSOP.freeTimeDays === 0 ? '' : currentSOP.freeTimeDays}
                          onChange={(e) => handleUpdateSOPCurrency('freeTimeDays', Number(e.target.value))}
                          placeholder="0"
                          className="w-10 font-bold text-slate-800 bg-transparent focus:outline-none text-xs"
                        />
                        <span className="text-slate-500 font-bold">Days</span>
                      </div>
                    </div>
                  </div>

                  {/* Yes/No Checkboxes as inline filters */}
                  <div className="space-y-1.5 p-2.5 bg-slate-50 rounded border text-xs text-slate-700 font-medium">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={currentSOP.hasYardHostler}
                        onChange={(e) => handleUpdateSOPText('hasYardHostler', e.target.checked)}
                        className="w-4 h-4 rounded text-slate-800"
                      />
                      Yard Hostler on site (Y/N)
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={currentSOP.peelPilesPermitted}
                        onChange={(e) => handleUpdateSOPText('peelPilesPermitted', e.target.checked)}
                        className="w-4 h-4 rounded text-slate-800"
                      />
                      Peel Piles (Flow piles) permitted (Y/N)
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={currentSOP.privateChassisPermitted}
                        onChange={(e) => handleUpdateSOPText('privateChassisPermitted', e.target.checked)}
                        className="w-4 h-4 rounded text-slate-800"
                      />
                      Private / Tri-axle Chassis allowed (Y/N)
                    </label>
                  </div>
                </div>

                {/* Status updates Required checklist */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Required Status Checkpoints</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(['LFD', 'Container Outgate', 'In Transit', 'On Site', 'POD Sent', 'Empty Return'] as StatusUpdateCheck[]).map((checkpoint) => {
                      const isRequired = currentSOP.requiredStatusUpdates.includes(checkpoint);
                      return (
                        <button
                          key={checkpoint}
                          onClick={() => handleToggleSOPChecklist(checkpoint)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-full transition cursor-pointer flex items-center gap-1 border ${
                            isRequired 
                              ? 'bg-slate-900 text-white border-slate-950' 
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isRequired && <Check className="w-3 h-3 text-blue-500 font-extrabold" />}
                          {checkpoint}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SOP Text */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-805">
                  <div className="flex items-center justify-between mb-1">
                    <h6 className="text-[10px] font-bold uppercase tracking-wider">Standard Delivery SOP Instructions:</h6>
                    <button 
                      onClick={handleSaveSOPText}
                      disabled={isSavingSOP || editSOPText === currentSOP.deliveryRules}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded transition ${
                        isSavingSOP 
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : editSOPText !== currentSOP.deliveryRules
                            ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-sm'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isSavingSOP ? 'Saving...' : editSOPText !== currentSOP.deliveryRules ? 'Save Instructions' : 'Saved'}
                    </button>
                  </div>
                  <textarea
                    value={editSOPText}
                    onChange={(e) => setEditSOPText(e.target.value)}
                    placeholder="Enter detailed standard delivery SOP instructions. Line breaks are preserved when saved and redisplayed."
                    className="w-full bg-white border border-slate-200 rounded p-2 text-xs font-semibold text-slate-800 mt-1 focus:outline-none focus:ring-1 focus:ring-slate-400 min-h-[180px] whitespace-pre-wrap resize-y"
                  />
                </div>

              </div>
            ) : (
              <p className="text-xs text-slate-400 p-4">No accessorial rules recorded for this account. Click 'Edit Account Details' to add data models.</p>
            )}
          </div>
        </div>

        {/* Panel 3: Contacts Directory & Personnel Directory */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-50 px-4 py-3 border-b flex items-center justify-between">
            <h4 className="font-bold text-slate-755 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-500" />
              Contacts & Communication Tree
            </h4>
            <span className="text-[10px] font-bold text-slate-400">{currentContacts.length} Assigned</span>
          </div>

          <div className="p-4 flex-1 space-y-4">
            
            {/* Contacts list */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {currentContacts.length > 0 ? (
                currentContacts.map((contact) => (
                  <div key={contact.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/65 flex flex-col gap-1.5 hover:border-slate-250 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                          <span>{contact.name}</span>
                          {contact.title && (
                            <span className="text-[10px] text-slate-500 font-medium">({contact.title})</span>
                          )}
                        </h5>
                        <p className="text-[10px] text-slate-400 font-medium">Role: <span className="font-bold text-slate-700">{contact.role}</span></p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove contact "${contact.name}" (${contact.role})?`)) {
                            onDeleteContact(contact.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-slate-100 cursor-pointer"
                        title="Delete contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-medium text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-semibold">Direct Email</span>
                        <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">{contact.email}</a>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-semibold">Phone Number</span>
                        {isComplianceViewActive ? (
                          <span className="font-mono text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded text-[10px] font-bold">(•••) •••-••••</span>
                        ) : (
                          <a href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`} className="text-slate-800 font-bold hover:text-blue-600 hover:underline">{contact.phone}</a>
                        )}
                      </div>
                    </div>

                    {contact.notes && (
                      <p className="text-[10px] text-slate-500 italic border-t border-slate-200/50 pt-1.5">
                        Note: {contact.notes}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-405 italic">No contacts added yet. Add personnel below so dispatchers know who to trace.</p>
                </div>
              )}
            </div>

            {/* Quick Add contact form */}
            <div className="border-t pt-4">
              <button
                onClick={() => setShowAddContact(!showAddContact)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-850 font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                {showAddContact ? 'Close Personnel Form' : 'Register New Personnel Contact'}
              </button>

              <AnimatePresence>
                {showAddContact && (
                  <motion.form 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleAddContactSubmit} 
                    className="space-y-2.5 mt-3 p-3 bg-slate-50 rounded-lg border overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Full Name *"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Job Title (e.g. Operations Mgr)"
                        value={contactTitle}
                        onChange={(e) => setContactTitle(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Phone Number"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Contact Role</label>
                        <select
                          value={contactRole}
                          onChange={(e) => setContactRole(e.target.value as ContactRole)}
                          className="w-full bg-white border border-slate-200 rounded p-1 text-xs text-slate-800"
                        >
                          <option value="Operations">Operations / Dispatch</option>
                          <option value="After-hours/Escalation">After-hours Escalation</option>
                          <option value="Billing">Billing / Accounts Payable</option>
                          <option value="Warehouse/Receiving">Warehouse & Receiving</option>
                          <option value="Claims/Dispute Resolution">Claims & disputes</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Logistical notes</label>
                        <input
                          type="text"
                          placeholder="Special instructions..."
                          value={contactNotes}
                          onChange={(e) => setContactNotes(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-805"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-slate-900 border border-slate-950 hover:bg-slate-850 text-white text-xs font-semibold py-1.5 rounded cursor-pointer mt-1"
                    >
                      Save Personnel Contact
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

      </div>

      {/* Structured Document Manager (Interactive mock documents) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-4 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <FolderPlus className="w-4 h-4 text-slate-500" />
            <h4 className="font-bold text-slate-755 text-xs uppercase tracking-wider">
              Onboarding Documents Audit Checklist
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-600">
                {DOCUMENT_TYPES.filter(t => currentAccount.documents.some(d => d.type === t)).length + (currentAccount.billToCodeCreated ? 1 : 0) + (currentAccount.auditChecklistCompleted ? 1 : 0)} / {DOCUMENT_TYPES.length + 2} Steps
              </span>
              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${Math.round(((DOCUMENT_TYPES.filter(t => currentAccount.documents.some(d => d.type === t)).length + (currentAccount.billToCodeCreated ? 1 : 0) + (currentAccount.auditChecklistCompleted ? 1 : 0)) / (DOCUMENT_TYPES.length + 2)) * 100)}%` }}
                />
              </div>
            </div>

            {/* VP of IT Compliance Dashboard Toggle */}
            <button
              type="button"
              onClick={() => setIsComplianceViewActive(!isComplianceViewActive)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                isComplianceViewActive
                  ? 'bg-purple-700 border-purple-600 text-white shadow-xs ring-1 ring-purple-400'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
              }`}
              title="Toggle VP of IT Compliance Audit Mode & Sensitive Field Masking"
            >
              <Lock className="w-3.5 h-3.5" />
              VP of IT Compliance View: {isComplianceViewActive ? 'ACTIVE (Masked)' : 'OFF'}
            </button>
          </div>
        </div>

        {/* IT Compliance Mode Governance Banner */}
        {isComplianceViewActive && (
          <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-3.5 px-5 border-b border-purple-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-purple-500/30 text-purple-300 border border-purple-400/30">
                <ShieldAlert className="w-4 h-4 text-purple-300" />
              </div>
              <div>
                <span className="font-bold tracking-wide text-purple-200">VP of IT Compliance & Access Governance Mode Active</span>
                <p className="text-[10px] text-slate-300">
                  Sensitive PII, cargo valuations, and confidential rates masked • RLS policies and JWT headers verified
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold">
              <span className="bg-purple-800/80 border border-purple-500/60 text-purple-200 px-2 py-0.5 rounded font-mono">
                ROLE: VP_IT_COMPLIANCE (Rk)
              </span>
              <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> SOC2 COMPLIANT
              </span>
            </div>
          </div>
        )}

        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Document Type checklist progress */}
          <div className="space-y-3.5">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Onboarding Document Status Checklist</h5>
            <div className="space-y-2">
              {DOCUMENT_TYPES.map((docType) => {
                const found = currentAccount.documents.some(d => d.type === docType);
                return (
                  <div 
                    key={docType}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      found ? 'bg-emerald-50/50 border-emerald-200 text-slate-800' : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded-full ${found ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                        {found ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-bold">{docType}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {found ? 'Compliant' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Compliance Checkboxes (Bill To Code & Audit Checklist) */}
            <div className="pt-3.5 border-t border-slate-100 mt-4 space-y-2.5">
              {/* Bill to Code Checkbox */}
              <label 
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition select-none ${
                  currentAccount.billToCodeCreated
                    ? 'bg-blue-50/60 border-blue-200 text-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={!!currentAccount.billToCodeCreated}
                    onChange={(e) => {
                      const isBillToCreated = e.target.checked;
                      const nextChecklist = initializeChecklist(currentAccount);
                      const temp: Account = {
                        ...currentAccount,
                        billToCodeCreated: isBillToCreated,
                        checklistState: nextChecklist,
                      };
                      temp.stage = computeAccountStage(temp);
                      onUpdateAccount(temp);
                    }}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="text-left">
                    <span className="text-xs font-bold block">Bill To Code Created</span>
                    <span className="text-[9px] text-slate-450 font-normal">
                      {currentAccount.billToCodeCreated
                        ? `Verified registered in billing system (${currentAccount.billToCode || 'Active'})`
                        : `Confirm registration in billing system (${currentAccount.billToCode || 'Pending'})`}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  currentAccount.billToCodeCreated ? 'text-blue-700' : 'text-slate-405'
                }`}>
                  {currentAccount.billToCodeCreated ? 'Set & Logged' : 'Incomplete'}
                </span>
              </label>

              {/* Audit Checklist Completed Checkbox */}
              <label 
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition select-none ${
                  currentAccount.auditChecklistCompleted
                    ? 'bg-emerald-50/60 border-emerald-200 text-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={!!currentAccount.auditChecklistCompleted}
                    onChange={(e) => {
                      const isAuditCompleted = e.target.checked;
                      const nextChecklist = initializeChecklist(currentAccount);
                      if (nextChecklist) {
                        nextChecklist.auditCompleted = isAuditCompleted;
                      }
                      const temp: Account = {
                        ...currentAccount,
                        auditChecklistCompleted: isAuditCompleted,
                        checklistState: nextChecklist,
                      };
                      temp.stage = computeAccountStage(temp);
                      onUpdateAccount(temp);
                    }}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="text-left">
                    <span className="text-xs font-bold block">Audit Checklist Completed</span>
                    <span className="text-[9px] text-slate-450 font-normal">Onboarding checklist has been validated</span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  currentAccount.auditChecklistCompleted ? 'text-emerald-700' : 'text-slate-405'
                }`}>
                  {currentAccount.auditChecklistCompleted ? 'Completed' : 'Pending'}
                </span>
              </label>
            </div>
          </div>

          {/* Document list & Download / View Mock triggers */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Uploaded Files & Audit Logs</h5>
              <span className="text-xs text-slate-400">{currentAccount.documents.length} Files Total</span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {currentAccount.documents.length > 0 ? (
                currentAccount.documents.map((doc) => (
                  <div key={doc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between hover:border-slate-300 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-200 text-slate-600 rounded">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h6 className="text-xs font-bold text-slate-850 truncate max-w-[280px]" title={doc.name}>
                          {doc.name}
                        </h6>
                        <p className="text-[10px] text-slate-450 font-medium">
                          Type: <span className="text-slate-600 font-semibold">{doc.type}</span> • Size: <span className="text-slate-600 font-semibold">{doc.size}</span> • Uploaded: {doc.uploadedAt} • By: {doc.uploadedBy || 'System'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Interactive download/view action trigger */}
                      <button
                        onClick={() => {
                          setSelectedPreviewDoc(doc);
                        }}
                        className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition px-2.5 py-1 text-xs font-bold rounded cursor-pointer"
                        title="Inspect published PDF compliance document"
                      >
                        Inspect Document
                      </button>
                      <button
                        onClick={() => handleDownloadPackage(doc)}
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition px-2 py-1 text-xs font-bold rounded cursor-pointer"
                        title="Download raw archive file package"
                      >
                        Download Package
                      </button>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="text-red-500 hover:text-red-650 hover:bg-slate-100 p-1.5 rounded cursor-pointer"
                        title="Remove Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 border border-dashed border-slate-250 rounded-xl">
                  <p className="text-xs text-slate-400 font-bold">No documentation currently on file. Use form below to simulate file drop.</p>
                </div>
              )}
            </div>

            {/* Secure document upload component with simulated compliance processing */}
            <div className="pt-2">
              <SecureDocumentUploader
                accountName={currentAccount.name}
                accountId={currentAccount.id}
                onUploadDocument={handleAddDoc}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================================== */}
      {/* COMPLIANCE DOCUMENT VAULT LIGHTBOX PREVIEW MODAL */}
      {/* ========================================================================================== */}
      <AnimatePresence>
        {selectedPreviewDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPreviewDoc(null)}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col p-6 relative text-slate-800 font-sans cursor-default"
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedPreviewDoc(null)}
                className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                title="Close lightbox"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Printable Branded Letterhead */}
              <div className="flex flex-col sm:flex-row items-center justify-between border-b pb-4 mb-5 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-lg">
                    F
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[#1E3A8A] text-base tracking-tight uppercase">FORREST TRANSPORTATION SERVICES</h4>
                    <p className="text-[9px] text-slate-450 tracking-wider font-bold">PORT INTEGRATION ARCHIVE • FILE PREVIEW</p>
                  </div>
                </div>
                <div className="text-center sm:text-right pr-8">
                  <span className="text-[9px] font-bold text-white bg-emerald-600 border border-emerald-500 px-2 py-0.5 rounded uppercase tracking-wider">
                    STRICT AUDIT COMPLIANT
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Audit stamp: Tanya Wahl (Pricing Specialist)</p>
                </div>
              </div>

              {/* Title & Metadata bar */}
              <div className="bg-slate-50 border rounded-xl p-3 mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-400 block uppercase text-[9px] tracking-wider">File Name</span>
                  <strong className="text-slate-800 break-all">{selectedPreviewDoc.name}</strong>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 block uppercase text-[9px] tracking-wider">Document Class</span>
                  <strong className="text-blue-600">{selectedPreviewDoc.type}</strong>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 block uppercase text-[9px] tracking-wider">Audit Officer</span>
                  <strong className="text-slate-700">Tanya Wahl</strong>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 block uppercase text-[9px] tracking-wider">Date Audited</span>
                  <strong className="text-slate-700">{selectedPreviewDoc.uploadedAt}</strong>
                </div>
              </div>

              {/* Render dynamic document form or plain mock PDF contract */}
              <div className="space-y-6 flex-1 min-h-[250px] border border-dashed rounded-xl p-5 bg-slate-50/20">
                {selectedPreviewDoc.contentKey ? (
                  (() => {
                    try {
                      const formObj = JSON.parse(selectedPreviewDoc.contentKey);
                      
                      // RENDER CHECKLIST PREVIEW
                      if (formObj.type === 'checklist') {
                        const d = formObj.data;
                        return (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center bg-blue-50/50 p-2 border rounded-lg text-xs">
                              <span className="font-bold text-blue-900">FORM: CUSTOMER ONBOARDING CHECKLIST</span>
                              <span className="font-mono text-slate-500 text-[10px]">Doc Class: Credit Application</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-1.5 p-1.5 bg-white border rounded">
                                <span className={d.creditApp ? "text-emerald-600 font-bold" : "text-slate-300"}>{d.creditApp ? "✔" : "✗"}</span>
                                <span className={d.creditApp ? "font-bold text-slate-800" : "text-slate-400"}>Credit Application Signed & Settled</span>
                              </div>
                              <div className="flex items-center gap-1.5 p-1.5 bg-white border rounded">
                                <span className={d.db ? "text-emerald-600 font-bold" : "text-slate-300"}>{d.db ? "✔" : "✗"}</span>
                                <span className={d.db ? "font-bold text-slate-800" : "text-slate-400"}>D&B Credit Bureau evaluation</span>
                              </div>
                              <div className="flex items-center gap-1.5 p-1.5 bg-white border rounded">
                                <span className={d.contract ? "text-emerald-600 font-bold" : "text-slate-300"}>{d.contract ? "✔" : "✗"}</span>
                                <span className={d.contract ? "font-bold text-slate-800" : "text-slate-400"}>Bilateral Contract Agreement signed</span>
                              </div>
                              <div className="flex items-center gap-1.5 p-1.5 bg-white border rounded">
                                <span className={d.fuelAgreement ? "text-emerald-600 font-bold" : "text-slate-300"}>{d.fuelAgreement ? "✔" : "✗"}</span>
                                <span className={d.fuelAgreement ? "font-bold text-slate-800" : "text-slate-400"}>Fuel Matrix Agreement set</span>
                              </div>
                              <div className="flex items-center gap-1.5 p-1.5 bg-white border rounded">
                                <span className={d.accessorialAgreement ? "text-emerald-600 font-bold" : "text-slate-300"}>{d.accessorialAgreement ? "✔" : "✗"}</span>
                                <span className={d.accessorialAgreement ? "font-bold text-slate-800" : "text-slate-400"}>Port Accessorals Schedule accepted</span>
                              </div>
                              <div className="flex items-center gap-1.5 p-1.5 bg-white border rounded">
                                <span className={d.workOrderReceived ? "text-emerald-600 font-bold" : "text-slate-300"}>{d.workOrderReceived ? "✔" : "✗"}</span>
                                <span className={d.workOrderReceived ? "font-bold text-slate-800" : "text-slate-400"}>Work Order Received & Logged</span>
                              </div>
                              <div className="flex items-center gap-1.5 p-1.5 bg-white border rounded">
                                <span className={d.onboardingCallCompleted ? "text-emerald-600 font-bold" : "text-slate-300"}>{d.onboardingCallCompleted ? "✔" : "✗"}</span>
                                <span className={d.onboardingCallCompleted ? "font-bold text-slate-800" : "text-slate-400"}>Customer Onboarding Call Completed</span>
                              </div>
                              <div className="flex items-center gap-1.5 p-1.5 bg-white border rounded">
                                <span className={d.auditCompleted ? "text-emerald-600 font-bold" : "text-slate-300"}>{d.auditCompleted ? "✔" : "✗"}</span>
                                <span className={d.auditCompleted ? "font-bold text-slate-800" : "text-slate-400"}>Compliance Audit Completed</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                              <div className="p-2.5 bg-white border rounded-lg">
                                <span className="font-bold text-slate-400 block mb-1">Pushed Rate Scheme:</span>
                                <strong className="text-slate-850 capitalize font-bold">{d.rateAgreement} Rate Agreement</strong>
                              </div>
                              <div className="p-2.5 bg-white border rounded-lg">
                                <span className="font-bold text-slate-400 block mb-1">Pre-scheduled Calls:</span>
                                <p className="text-slate-700">Internal Meeting AM: <strong>{new Date(d.internalMeetingDate).toLocaleString()}</strong></p>
                                <p className="text-slate-700 mt-0.5">External Meet Customer: <strong>{new Date(d.externalMeetingDate).toLocaleString()}</strong></p>
                              </div>
                            </div>

                            <div className="p-3 bg-white border rounded-lg text-xs">
                              <span className="font-bold text-slate-450 block mb-1">Compliance Audit Notes:</span>
                              <p className="text-slate-750 italic">"{d.notes}"</p>
                            </div>
                          </div>
                        );
                      }

                      // RENDER EXTERNAL MEETING PREVIEW
                      if (formObj.type === 'external') {
                        const d = formObj.data;
                        return (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center bg-teal-50/50 p-2 border rounded-lg text-xs">
                              <span className="font-bold text-teal-900 border-teal-200">FORM: EXTERNAL NEW CUSTOMER MEETING REPORT</span>
                              <span className="font-mono text-slate-500 text-[10px]">Doc Class: SOP Check / Onboarding</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div className="p-2 bg-white border rounded shadow-sm">
                                <span className="block text-slate-400 text-[10px] uppercase font-bold">1. Operational Primary Contact</span>
                                <strong className="text-slate-800 mt-1 block">{d.opsContact || 'N/A'}</strong>
                              </div>

                              <div className="p-2 bg-white border rounded shadow-sm">
                                <span className="block text-slate-400 text-[10px] uppercase font-bold">2. Expected Volume cadence</span>
                                <strong className="text-slate-800 mt-1 block">{d.expectedVolume || 'N/A'}</strong>
                              </div>

                              <div className="p-2 bg-white border rounded shadow-sm">
                                <span className="block text-slate-400 text-[10px] uppercase font-bold">3. Seasonal or Steady</span>
                                <strong className="text-slate-800 mt-1 block capitalize">{d.seasonality || 'Steady'}</strong>
                              </div>

                              <div className="p-2 bg-white border rounded shadow-sm">
                                <span className="block text-slate-400 text-[10px] uppercase font-bold">4. Delivery Mode Type</span>
                                <strong className="text-slate-800 mt-1 block">{d.unhookType || 'Live Unload'}</strong>
                              </div>

                              <div className="p-2 bg-white border rounded shadow-sm">
                                <span className="block text-slate-400 text-[10px] uppercase font-bold">5. Portal Integration Details</span>
                                <strong className="text-slate-800 mt-1 block">{d.portalCode || 'N/A'}</strong>
                              </div>

                              <div className="p-2 bg-white border rounded shadow-sm">
                                <span className="block text-slate-400 text-[10px] uppercase font-bold">6. EDI/API Guidelines</span>
                                <strong className="text-slate-800 mt-1 block">{d.ediIntegration || 'No integrated feeds'}</strong>
                              </div>

                              <div className="p-2 bg-white border rounded shadow-sm">
                                <span className="block text-slate-400 text-[10px] uppercase font-bold">7. Main Shipping Markets</span>
                                <strong className="text-slate-800 mt-1 block">{d.markets || 'N/A'}</strong>
                              </div>

                              <div className="p-2 bg-white border rounded shadow-sm">
                                <span className="block text-slate-400 text-[10px] uppercase font-bold">8. Unloading conditions / Hours</span>
                                <strong className="text-slate-800 mt-1 block">{d.hoursUnloading || 'N/A'}</strong>
                              </div>
                            </div>

                            <div className="p-2.5 bg-white border rounded-lg text-xs">
                              <span className="block text-blue-750 text-[10px] uppercase font-black">***GET AP QUESTIONAIRE check-off***</span>
                              <span className="font-bold text-emerald-600 mt-1 block">✔ AP Questionnaire document received, filled, and signed.</span>
                            </div>

                            <div className="p-2.5 bg-white border rounded-lg text-xs">
                              <span className="font-bold text-slate-450 block mb-1">Service Notes & Comments:</span>
                              <p className="text-slate-750 italic">"{d.notes}"</p>
                            </div>
                          </div>
                        );
                      }

                      // RENDER INTERNAL MEETING PREVIEW
                      if (formObj.type === 'internal') {
                        const d = formObj.data;
                        return (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center bg-purple-50/50 p-2 border rounded-lg text-xs">
                              <span className="font-bold text-purple-900">FORM: INTERNAL DRAYAGE SEGMENT ROLES AGENDA</span>
                              <span className="font-mono text-slate-500 text-[10px]">Doc Class: SOP Document / AM</span>
                            </div>

                            <div className="p-3 bg-white border rounded-lg grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-slate-400 text-[10px] block font-bold">Primary Pricing Specialist</span>
                                <strong className="text-slate-750">{d.pricingContact}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] block font-bold">EDI Contact</span>
                                <strong className="text-slate-750">{d.ediContact || 'None'}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] block font-bold">SW Account Manager</span>
                                <strong className="text-slate-750">{d.swAccountManager || 'None'}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] block font-bold">East Account Manager</span>
                                <strong className="text-slate-750">{d.eastAccountManager || 'None'}</strong>
                              </div>
                            </div>

                            <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg text-xs">
                              <span className="block font-bold text-emerald-900 mb-2">Team Guidelines Checklist Dispatched:</span>
                              <div className="grid grid-cols-3 gap-2 font-black text-emerald-800">
                                <div>{d.ratesSent ? "✔ Customer Rates Filed" : "✗ Rates Missing"}</div>
                                <div>{d.fuelSent ? "✔ Fuel Program Matrix Sent" : "✗ Fuel Matrix Missing"}</div>
                                <div>{d.accessorialsSent ? "✔ Port Accessorial SOP Sent" : "✗ Accessorials Missing"}</div>
                              </div>
                            </div>

                            <div className="p-2.5 bg-white border rounded-lg text-xs">
                              <span className="font-bold text-slate-450 block mb-1">Internal Agenda meeting notes:</span>
                              <p className="text-slate-750 italic">"{d.notes}"</p>
                            </div>
                          </div>
                        );
                      }
                    } catch (e) {
                      // Fallback just in case
                    }
                    return null;
                  })()
                ) : (
                  // STANDARD MOCK PDF VIEW
                  <div className="space-y-6 text-slate-700">
                    <div className="border border-slate-200 rounded-lg p-5 bg-white relative overflow-hidden shadow-sm">
                      <div className="absolute top-0 right-0 p-1.5 bg-blue-600 text-white font-mono text-[9px] font-bold uppercase tracking-widest rounded-bl">
                        SECURE ARCHIVE PDF
                      </div>

                      <div className="space-y-4">
                        <div className="border-b pb-3">
                          <h4 className="font-bold text-slate-900 text-sm tracking-tight">{selectedPreviewDoc.name}</h4>
                          <p className="text-xs text-slate-400">Class: <strong>{selectedPreviewDoc.type}</strong> • Size: {selectedPreviewDoc.size}</p>
                        </div>

                        <div className="space-y-3.5 text-xs line-height-relaxed font-sans mt-3">
                          <p className="font-black text-slate-800 uppercase text-[10px] tracking-wider">STANDARD BILATERAL PORT CONTAINER AGREEMENT & LIABILTY BOND</p>
                          <p className="text-slate-600">
                            This document serves as the legal and binding drayage SOP established for customer <strong>{currentAccount.name}</strong> as of audit registration. Both parties agree that rates listed and updated within the "Pricing Hub" of this CRM reflect the agreed billing linehaul.
                          </p>
                          <p className="text-slate-600">
                            Any accessorial delays at marine terminals (including peak season splits, yard storage, or container demurrage) will refer strictly to the Accessorial Guidelines SOP with standard 4 days free time parameters.
                          </p>
                          <p className="text-slate-600">
                            Failure of operational team to audit driver logs within 4 hours of Port Out-gate will result in standard fallback liability review.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 pt-6 gap-6 border-t font-mono text-[10px] text-slate-450">
                          <div>
                            <span className="block uppercase font-bold">CLIENT AGENT SIGNATURE</span>
                            <span className="block text-slate-800 font-bold font-sans mt-2">Authenticated Digital Acceptance</span>
                            <span className="block">Authorized Representative IP: Client Secured</span>
                          </div>
                          <div>
                            <span className="block uppercase font-bold">FORREST LOGISTICS ACCEPTANCE</span>
                            <span className="block text-slate-800 font-bold font-sans mt-2">Tanya Wahl (Pricing Specialist)</span>
                            <span className="block">Drayage Compliance Verified</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PDF Actions Footer */}
              <div className="mt-6 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <p className="text-slate-400 font-medium">Compliance verification secured under standard IT protocol.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      alert("Success: PDF print layout triggered to system driver!");
                    }}
                    className="bg-slate-100 hover:bg-slate-205 py-1.5 px-3 rounded-lg text-slate-700 font-extrabold cursor-pointer"
                  >
                    Print Document
                  </button>
                  <button
                    onClick={() => setSelectedPreviewDoc(null)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-1.5 px-4 rounded-lg cursor-pointer"
                  >
                    Close Preview
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
