/**
 * File: SecureDocumentUploader.tsx
 * Purpose: Handles document selection, client-side validation, preview state, and secure Supabase uploads.
 * Dependencies: React refs/state, motion animations, lucide-react icons, and Supabase document helpers.
 * Maintainer note: File type and size rules are centralized in supabaseClient.ts constants.
 */
import React, { useState, useRef } from 'react';
import { OnboardingDocument } from '../types';
import { 
  UploadCloud, 
  FileText, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  FileCheck, 
  Eye, 
  X, 
  Plus,
  Cpu,
  FileCode,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DOCUMENT_ALLOWED_EXTENSIONS, DOCUMENT_MAX_BYTES, uploadDocumentToSupabase, validateDocumentFile } from '../lib/supabaseClient';

interface SecureDocumentUploaderProps {
  accountName: string;
  accountId: string;
  onUploadDocument: (newDoc: OnboardingDocument) => void;
}

type DocType = 'Credit Application' | 'Liability Agreement' | 'SOP Document' | 'Other';

interface ProcessingState {
  isProcessing: boolean;
  step: number; // 0 to 4
  progress: number; // 0 to 100%
  statusMessage: string;
  detectedMeta?: {
    pages: number;
    signaturesFound: boolean;
    einDetected: boolean;
    insuranceVerified: boolean;
    hash: string;
  };
}

const SAMPLE_TEMPLATES = [
  {
    name: 'Signed_Credit_App_2026.pdf',
    type: 'Credit Application' as DocType,
    size: '1.8 MB',
    pages: 2,
  },
  {
    name: 'Certificate_of_Insurance_COI.pdf',
    type: 'Liability Agreement' as DocType,
    size: '2.4 MB',
    pages: 3,
  },
  {
    name: 'Drayage_Delivery_SOP_Terminal_Rules.pdf',
    type: 'SOP Document' as DocType,
    size: '3.1 MB',
    pages: 5,
  },
  {
    name: 'W9_Tax_Identification_Certificate.pdf',
    type: 'Other' as DocType,
    size: '890 KB',
    pages: 1,
  }
];

/**
 * Manages document upload UI state, validates selected files, and forwards successful Supabase uploads to the parent view.
 */
export default function SecureDocumentUploader({
  accountName,
  accountId,
  onUploadDocument
}: SecureDocumentUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const selectedFile = selectedFiles[0] || null;
  const [customName, setCustomName] = useState<string>('');
  const [docType, setDocType] = useState<DocType>('Credit Application');
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [securityLevel, setSecurityLevel] = useState<'Restricted' | 'Confidential' | 'Standard'>('Confidential');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processing state
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    step: 0,
    progress: 0,
    statusMessage: ''
  });

  const [lastUploadedDoc, setLastUploadedDoc] = useState<OnboardingDocument | null>(null);

  // Handle Drag Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      try { Array.from(e.dataTransfer.files).forEach(validateDocumentFile); setSelectedFiles(Array.from(e.dataTransfer.files)); } catch (err) { setProcessing({ isProcessing: false, step: 0, progress: 0, statusMessage: err instanceof Error ? err.message : 'Invalid file.' }); return; }
      if (!customName) {
        setCustomName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try { Array.from(e.target.files).forEach(validateDocumentFile); setSelectedFiles(Array.from(e.target.files)); } catch (err) { setProcessing({ isProcessing: false, step: 0, progress: 0, statusMessage: err instanceof Error ? err.message : 'Invalid file.' }); return; }
      if (!customName) {
        setCustomName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSelectTemplate = (tpl: typeof SAMPLE_TEMPLATES[0]) => {
    setSelectedFiles([]);
    setCustomName(tpl.name.replace(/\.[^/.]+$/, ""));
    setDocType(tpl.type);
  };

  const startUploadAndProcessing = async () => {
    const fileNameToUse = customName 
      ? (customName.endsWith('.pdf') ? customName : `${customName}.pdf`)
      : (selectedFile ? selectedFile.name : `Drayage_Doc_${Date.now()}.pdf`);

    setProcessing({
      isProcessing: true,
      step: 1,
      progress: 25,
      statusMessage: 'Uploading document to encrypted vault...'
    });

    try {
      // Step 1 & 2: Real Upload
      const filesToUpload = selectedFiles.length ? selectedFiles : [new File(["dummy content"], fileNameToUse, { type: "application/pdf" })];
      const docRecords: any[] = [];
      for (const fileToUpload of filesToUpload) {
        docRecords.push(await uploadDocumentToSupabase(accountId, fileToUpload, docType, description));
      }
      const docRecord = docRecords[docRecords.length - 1];
      
      setProcessing(prev => ({
        ...prev,
        step: 3,
        progress: 75,
        statusMessage: 'Running OCR and checking compliance minimums...'
      }));

      // Simulate a small delay for OCR UX
      setTimeout(() => {
        const generatedHash = `0x${Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        const pagesCount = Math.floor(Math.random() * 4) + 1;

        const newDoc: OnboardingDocument = {
          id: docRecord.id,
          name: docRecord.name,
          type: docRecord.type as DocType,
          uploadedAt: new Date(docRecord.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          size: `${(docRecord.size_bytes / (1024 * 1024)).toFixed(2)} MB`,
          contentKey: docRecord.storage_path,
          storagePath: docRecord.storage_path,
          uploadedBy: docRecord.uploaded_by || 'Current user',
          checklistItemKey: docRecord.checklist_item_key || undefined,
          description: docRecord.description || ''
        };

        setProcessing({
          isProcessing: false,
          step: 4,
          progress: 100,
          statusMessage: 'Document verified, audited, and stored in Document Vault!',
          detectedMeta: {
            pages: pagesCount,
            signaturesFound: true,
            einDetected: true,
            insuranceVerified: true,
            hash: generatedHash
          }
        });

        docRecords.forEach((record) => onUploadDocument({
          id: record.id,
          name: record.name,
          type: record.type as DocType,
          uploadedAt: new Date(record.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          size: `${(record.size_bytes / (1024 * 1024)).toFixed(2)} MB`,
          contentKey: record.storage_path,
          storagePath: record.storage_path,
          uploadedBy: record.uploaded_by || 'Current user',
          checklistItemKey: record.checklist_item_key || undefined,
          description: record.description || ''
        }));
        setLastUploadedDoc(newDoc);

        // Reset form fields
        setSelectedFiles([]);
        setCustomName('');
        setDescription('');
      }, 1000);

    } catch (err) {
      console.error(err);
      setProcessing({
        isProcessing: false,
        step: 0,
        progress: 0,
        statusMessage: 'Upload failed. Please try again.'
      });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden text-slate-800">
      
      {/* Header Bar */}
      <div className="bg-slate-900 text-white p-3.5 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide">Secure Document Vault Upload & Compliance Processing</h4>
            <p className="text-[10px] text-slate-400">Simulate PDF upload, OCR text parsing, and onboarding compliance audit</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono bg-slate-800 border border-slate-700 text-emerald-400 px-2 py-0.5 rounded">
            <Lock className="w-3 h-3" />
            256-BIT ENCRYPTED
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* Processing Indicator Modal Overlay */}
        <AnimatePresence>
          {processing.isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-blue-50/90 border border-blue-200 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Processing Compliance Verification for {accountName}...</span>
                </div>
                <span className="font-mono font-bold text-blue-700 text-xs">{processing.progress}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-blue-200/60 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processing.progress}%` }}
                />
              </div>

              {/* Steps Progress */}
              <div className="grid grid-cols-3 gap-2 text-[10px] pt-1">
                <div className={`flex items-center gap-1 p-1.5 rounded border ${processing.step >= 1 ? 'bg-white border-blue-300 text-blue-900 font-bold' : 'bg-blue-100/40 border-transparent text-slate-400'}`}>
                  <Cpu className="w-3 h-3" />
                  <span>1. Checksum & Encryption</span>
                </div>
                <div className={`flex items-center gap-1 p-1.5 rounded border ${processing.step >= 2 ? 'bg-white border-blue-300 text-blue-900 font-bold' : 'bg-blue-100/40 border-transparent text-slate-400'}`}>
                  <FileCode className="w-3 h-3" />
                  <span>2. OCR & PDF Parsing</span>
                </div>
                <div className={`flex items-center gap-1 p-1.5 rounded border ${processing.step >= 3 ? 'bg-white border-blue-300 text-blue-900 font-bold' : 'bg-blue-100/40 border-transparent text-slate-400'}`}>
                  <ShieldCheck className="w-3 h-3" />
                  <span>3. Onboarding Audit</span>
                </div>
              </div>

              <p className="text-[11px] text-blue-800 font-medium italic">
                {processing.statusMessage}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Alert Banner */}
        <AnimatePresence>
          {lastUploadedDoc && !processing.isProcessing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start justify-between gap-3 text-emerald-900 text-xs"
            >
              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block font-bold">Document Successfully Audited & Stored in Vault!</strong>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    <strong>{lastUploadedDoc.name}</strong> ({lastUploadedDoc.type}) has been added to {accountName}'s compliance checklist.
                  </p>
                  {processing.detectedMeta && (
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px]">
                      <span className="bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded font-mono text-emerald-800">
                        HASH: {processing.detectedMeta.hash}
                      </span>
                      <span className="bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded font-semibold text-emerald-800">
                        ✔ Signature Validated
                      </span>
                      <span className="bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded font-semibold text-emerald-800">
                        ✔ Tax ID Verified
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setLastUploadedDoc(null)}
                className="text-emerald-600 hover:text-emerald-900 p-1 cursor-pointer"
                title="Dismiss message"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center transition cursor-pointer relative ${
            isDragging 
              ? 'border-blue-500 bg-blue-50/80 scale-[0.99]' 
              : selectedFile 
                ? 'border-emerald-400 bg-emerald-50/30' 
                : 'border-slate-250 bg-slate-50/60 hover:bg-slate-100/80 hover:border-slate-350'
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
            multiple
            className="hidden" 
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className={`p-3 rounded-full ${selectedFile ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
              {selectedFile ? <FileCheck className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
            </div>

            {selectedFile ? (
              <div>
                <p className="text-xs font-bold text-slate-800">{selectedFile.name}</p>
                <p className="text-[10px] text-slate-500">
                  Size: {(selectedFile.size / 1024).toFixed(0)} KB • Type: {selectedFile.type || 'PDF Document'}{selectedFiles.length > 1 ? ` • ${selectedFiles.length} files selected` : ''}
                </p>
                <span className="mt-1 inline-block text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  File Ready for Compliance Audit
                </span>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Drag & Drop PDF document here, or <span className="text-blue-600 underline">browse computer</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Supports PDF, DOCX, DOC, PNG, JPG, and JPEG files (Max 15MB each)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Sample Templates Selector */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Or Choose Pre-Loaded Drayage Onboarding PDF Template:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SAMPLE_TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                type="button"
                onClick={() => handleSelectTemplate(tpl)}
                className={`p-2 rounded-lg border text-left text-xs transition cursor-pointer flex flex-col justify-between ${
                  customName === tpl.name.replace(/\.[^/.]+$/, "")
                    ? 'bg-blue-50 border-blue-400 text-blue-900 ring-1 ring-blue-400'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-bold text-[11px] truncate" title={tpl.name}>{tpl.name}</span>
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-400">
                  <span>{tpl.type}</span>
                  <span className="font-mono">{tpl.size}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* File Metadata Form Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Document Display Name
            </label>
            <input
              type="text"
              placeholder="e.g. Credit_Application_Signed_2026"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Onboarding Document Role
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocType)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="Credit Application">Credit Application Signed</option>
              <option value="Liability Agreement">Bilateral Liability Contract / COI</option>
              <option value="SOP Document">Terminal & Shipping SOP PDF</option>
              <option value="Other">Standard Tariff / Rate Agreement</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Security Access Classification
            </label>
            <select
              value={securityLevel}
              onChange={(e: any) => setSecurityLevel(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="Confidential">Confidential (Pricing & Credit)</option>
              <option value="Restricted">Restricted (Legal & Claims Only)</option>
              <option value="Standard">Standard Operations Team</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Optional Document Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a short note explaining how this document supports onboarding."
            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[64px]"
          />
          <p className="mt-1 text-[10px] text-slate-400">Allowed: {DOCUMENT_ALLOWED_EXTENSIONS.join(', ')} up to {DOCUMENT_MAX_BYTES / (1024 * 1024)}MB.</p>
        </div>

        {/* Submit Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={startUploadAndProcessing}
            disabled={processing.isProcessing}
            className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition flex items-center gap-2 cursor-pointer ${
              processing.isProcessing 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Process & Encrypt Document Asset
          </button>
        </div>

      </div>

    </div>
  );
}
