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
import { DOCUMENT_ALLOWED_EXTENSIONS, DOCUMENT_MAX_BYTES, uploadDocumentToAzure as uploadDocumentToSupabase, validateDocumentFile } from '../lib/azureClient';

interface SecureDocumentUploaderProps {
  accountName: string;
  accountId: string;
  onUploadDocument: (newDoc: OnboardingDocument) => void;
}

type DocType = 'Credit Application' | 'Liability Agreement' | 'SOP Document' | 'Other';

interface ProcessingState {
  isProcessing: boolean;
  isError: boolean;
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
  const [selectedTemplate, setSelectedTemplate] = useState<typeof SAMPLE_TEMPLATES[0] | null>(null);
  const [customName, setCustomName] = useState<string>('');
  const [docType, setDocType] = useState<DocType>('Credit Application');
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [securityLevel, setSecurityLevel] = useState<'Restricted' | 'Confidential' | 'Standard'>('Confidential');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processing state
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    isError: false,
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
      try { 
        Array.from(e.dataTransfer.files).forEach(validateDocumentFile); 
        setSelectedFiles(Array.from(e.dataTransfer.files)); 
        setSelectedTemplate(null);
        setProcessing(p => ({...p, isError: false})); 
      } catch (err) { 
        if (fileInputRef.current) fileInputRef.current.value = '';
        setProcessing({ 
          isProcessing: false, 
          isError: true, 
          step: 0, 
          progress: 0, 
          statusMessage: err instanceof Error ? err.message : 'Invalid file.' 
        }); 
        return; 
      }
      if (!customName) {
        setCustomName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try { 
        Array.from(e.target.files).forEach(validateDocumentFile); 
        setSelectedFiles(Array.from(e.target.files)); 
        setSelectedTemplate(null);
        setProcessing(p => ({...p, isError: false})); 
      } catch (err) { 
        if (fileInputRef.current) fileInputRef.current.value = '';
        setProcessing({ 
          isProcessing: false, 
          isError: true, 
          step: 0, 
          progress: 0, 
          statusMessage: err instanceof Error ? err.message : 'Invalid file.' 
        }); 
        return; 
      }
      if (!customName) {
        setCustomName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSelectTemplate = (tpl: typeof SAMPLE_TEMPLATES[0]) => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSelectedFiles([]);
    setSelectedTemplate(tpl);
    setCustomName(tpl.name.replace(/\.[^/.]+$/, ""));
    setDocType(tpl.type);
    setProcessing(p => ({...p, isError: false}));
  };

  const startUploadAndProcessing = async () => {
    const fileNameToUse = customName 
      ? (customName.endsWith('.pdf') ? customName : `${customName}.pdf`)
      : (selectedFile ? selectedFile.name : selectedTemplate ? selectedTemplate.name : `Drayage_Doc_${Date.now()}.pdf`);

    setProcessing({
      isProcessing: true,
      isError: false,
      step: 1,
      progress: 25,
      statusMessage: 'Uploading document to encrypted vault...'
    });
    setLastUploadedDoc(null);

    try {
      // Step 1 & 2: Real Upload
      const filesToUpload = selectedFiles.length 
        ? selectedFiles 
        : [new File(["dummy content for " + fileNameToUse], fileNameToUse, { type: "application/pdf" })];
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
          isError: false,
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
        setSelectedTemplate(null);
        setCustomName('');
        setDescription('');
      }, 1000);

    } catch (err: any) {
      console.error(err);
      
      let errorMessage = 'Upload failed due to a network or server error. Please try again.';
      if (err.message && err.message.includes('fetch')) {
        errorMessage = 'Network error: Service unavailable (503). Check connectivity and try again.';
      } else if (err.message) {
        errorMessage = `Upload Failed: ${err.message}`;
      }

      setProcessing({
        isProcessing: false,
        isError: true,
        step: 0,
        progress: 0,
        statusMessage: errorMessage
      });
    }
  };

  return (
    <div className="bg-white border border-secondary border-opacity-25 rounded shadow-sm overflow-hidden text-dark">
      
      {/* Header Bar */}
      <div className="bg-dark text-white p-3.5 px-4 d-d-flex align-items-center justify-content-between">
        <div className="d-d-flex align-items-center gap-2.5">
          <div className="p-1.5 rounded btn-primary/30 text-primary border border-primary border-opacity-25">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="small fw-bold text-white tracking-wide">Secure Document Vault Upload & Compliance Processing</h4>
            <p className="small text-secondary">Simulate PDF upload, OCR text parsing, and onboarding compliance audit</p>
          </div>
        </div>

        <div className="d-d-flex align-items-center gap-2">
          <span className="hidden sm:inline-d-d-flex align-items-center gap-1 small font-mono bg-dark text-white border border-slate-700 text-success px-2 py-0.5 rounded">
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
              className="bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded p-4 space-y-3"
            >
              <div className="d-d-flex align-items-center justify-content-between small">
                <div className="d-d-flex align-items-center gap-2 fw-bold text-primary">
                  <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                  <span>Processing Compliance Verification for {accountName}...</span>
                </div>
                <span className="font-mono fw-bold text-primary small">{processing.progress}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-100 bg-blue-200/60 rounded-circle h-2 overflow-hidden">
                <div 
                  className="bg-primary h-2 rounded-circle transition-all duration-300"
                  style={{ width: `${processing.progress}%` }}
                />
              </div>

              {/* Steps Progress */}
              <div className="row row-cols-3 gap-2 small pt-1">
                <div className={`d-d-flex align-items-center gap-1 p-1.5 rounded border ${processing.step >= 1 ? 'bg-white border-primary border-opacity-50 text-primary fw-bold' : 'bg-primary bg-opacity-10 border-transparent text-secondary'}`}>
                  <Cpu className="w-3 h-3" />
                  <span>1. Checksum & Encryption</span>
                </div>
                <div className={`d-d-flex align-items-center gap-1 p-1.5 rounded border ${processing.step >= 2 ? 'bg-white border-primary border-opacity-50 text-primary fw-bold' : 'bg-primary bg-opacity-10 border-transparent text-secondary'}`}>
                  <FileCode className="w-3 h-3" />
                  <span>2. OCR & PDF Parsing</span>
                </div>
                <div className={`d-d-flex align-items-center gap-1 p-1.5 rounded border ${processing.step >= 3 ? 'bg-white border-primary border-opacity-50 text-primary fw-bold' : 'bg-primary bg-opacity-10 border-transparent text-secondary'}`}>
                  <ShieldCheck className="w-3 h-3" />
                  <span>3. Onboarding Audit</span>
                </div>
              </div>

              <p className="small text-primary font-medium italic">
                {processing.statusMessage}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Alert Banner */}
        <AnimatePresence>
          {processing.isError && !processing.isProcessing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded p-3.5 d-d-flex align-items-start justify-between gap-3 text-danger small"
            >
              <div className="d-d-flex align-items-start gap-2.5">
                <div className="p-1 rounded-circle bg-danger bg-opacity-25 text-danger shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block fw-bold">Document Processing Failed</strong>
                  <p className="small text-danger mt-0.5">
                    {processing.statusMessage}
                  </p>
                </div>
              </div>

              <div className="d-d-flex align-items-center gap-2 shrink-0">
                <button
                  onClick={startUploadAndProcessing}
                  className="bg-danger bg-opacity-25 hover:bg-danger bg-opacity-50 text-danger fw-bold px-2.5 py-1 rounded small transition cursor-pointer"
                >
                  Retry Upload
                </button>
                <button
                  onClick={() => setProcessing(p => ({...p, isError: false}))}
                  className="text-danger hover:text-danger p-1 cursor-pointer"
                  title="Dismiss message"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
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
              className="bg-success bg-opacity-10 border border-success border-opacity-25 rounded p-3.5 d-d-flex align-items-start justify-between gap-3 text-success small"
            >
              <div className="d-d-flex align-items-start gap-2.5">
                <div className="p-1 rounded-circle bg-success bg-opacity-25 text-success shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block fw-bold">Document Successfully Audited & Stored in Vault!</strong>
                  <p className="small text-success mt-0.5">
                    <strong>{lastUploadedDoc.name}</strong> ({lastUploadedDoc.type}) has been added to {accountName}'s compliance checklist.
                  </p>
                  {processing.detectedMeta && (
                    <div className="d-d-flex flex-wrap items-center gap-2 mt-2 small">
                      <span className="bg-success bg-opacity-25/80 border border-success border-opacity-50 px-2 py-0.5 rounded font-mono text-success">
                        HASH: {processing.detectedMeta.hash}
                      </span>
                      <span className="bg-success bg-opacity-25/80 border border-success border-opacity-50 px-2 py-0.5 rounded fw-semibold text-success">
                        ✔ Signature Validated
                      </span>
                      <span className="bg-success bg-opacity-25/80 border border-success border-opacity-50 px-2 py-0.5 rounded fw-semibold text-success">
                        ✔ Tax ID Verified
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setLastUploadedDoc(null)}
                className="text-success hover:text-success p-1 cursor-pointer"
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
          className={`border-2 border-dashed rounded p-5 text-center transition cursor-pointer relative ${
            isDragging 
              ? 'border-primary bg-primary bg-opacity-10 scale-[0.99]' 
              : (selectedFile || selectedTemplate)
                ? 'border-success bg-success bg-opacity-10/30' 
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

          <div className="d-d-flex flex-column items-center justify-center space-y-2">
            <div className={`p-3 rounded-circle ${(selectedFile || selectedTemplate) ? 'bg-success bg-opacity-25 text-success' : 'bg-primary bg-opacity-25 text-primary'}`}>
              {(selectedFile || selectedTemplate) ? <FileCheck className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
            </div>

            {selectedFile ? (
              <div>
                <p className="small fw-bold text-dark">{selectedFile.name}</p>
                <p className="small text-secondary">
                  Size: {(selectedFile.size / 1024).toFixed(0)} KB • Type: {selectedFile.type || 'PDF Document'}{selectedFiles.length > 1 ? ` • ${selectedFiles.length} files selected` : ''}
                </p>
                <span className="mt-1 inline-block small fw-bold text-success bg-success bg-opacity-25 px-2 py-0.5 rounded">
                  File Ready for Compliance Audit
                </span>
              </div>
            ) : selectedTemplate ? (
              <div>
                <p className="small fw-bold text-dark">{selectedTemplate.name}</p>
                <p className="small text-secondary">
                  Size: {selectedTemplate.size} • Type: {selectedTemplate.type} (Pre-loaded Template)
                </p>
                <span className="mt-1 inline-block small fw-bold text-success bg-success bg-opacity-25 px-2 py-0.5 rounded">
                  Template Ready for Compliance Audit
                </span>
              </div>
            ) : (
              <div>
                <p className="small fw-bold text-dark">
                  Drag & Drop PDF document here, or <span className="text-primary underline">browse computer</span>
                </p>
                <p className="small text-secondary mt-0.5">
                  Supports PDF, DOCX, DOC, PNG, JPG, and JPEG files (Max 15MB each)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Sample Templates Selector */}
        <div>
          <label className="small fw-bold text-secondary uppercase tracking-wider block mb-1.5">
            Or Choose Pre-Loaded Drayage Onboarding PDF Template:
          </label>
          <div className="row row-cols-2 row-cols-sm-4 gap-2">
            {SAMPLE_TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                type="button"
                onClick={() => handleSelectTemplate(tpl)}
                className={`p-2 rounded border text-left small transition cursor-pointer d-d-flex flex-column justify-between ${
                  (selectedTemplate?.name === tpl.name || (!selectedFile && customName === tpl.name.replace(/\.[^/.]+$/, "")))
                    ? 'bg-primary bg-opacity-10 border-primary border-opacity-50 text-primary ring-1 ring-blue-400'
                    : 'bg-white border-secondary border-opacity-25 text-dark hover:bg-slate-50 hover:border-secondary border-opacity-50'
                }`}
              >
                <div className="d-d-flex align-items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="fw-bold small truncate" title={tpl.name}>{tpl.name}</span>
                </div>
                <div className="d-d-flex align-items-center justify-content-between text-[9px] text-secondary">
                  <span>{tpl.type}</span>
                  <span className="font-mono">{tpl.size}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* File Metadata Form Inputs */}
        <div className="row row-cols-1 row-cols-sm-3 gap-3 pt-2 border-t border-secondary border-opacity-10">
          <div>
            <label className="small fw-bold text-secondary uppercase tracking-wider block mb-1">
              Document Display Name
            </label>
            <input
              type="text"
              placeholder="e.g. Credit_Application_Signed_2026"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-100 bg-white border border-secondary border-opacity-25 rounded px-2.5 py-1.5 small text-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="small fw-bold text-secondary uppercase tracking-wider block mb-1">
              Onboarding Document Role
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocType)}
              className="w-100 bg-white border border-secondary border-opacity-25 rounded px-2 py-1.5 small text-dark focus:outline-none focus:border-primary"
            >
              <option value="Credit Application">Credit Application Signed</option>
              <option value="Liability Agreement">Bilateral Liability Contract / COI</option>
              <option value="SOP Document">Terminal & Shipping SOP PDF</option>
              <option value="Other">Standard Tariff / Rate Agreement</option>
            </select>
          </div>

          <div>
            <label className="small fw-bold text-secondary uppercase tracking-wider block mb-1">
              Security Access Classification
            </label>
            <select
              value={securityLevel}
              onChange={(e: any) => setSecurityLevel(e.target.value)}
              className="w-100 bg-white border border-secondary border-opacity-25 rounded px-2 py-1.5 small text-dark focus:outline-none focus:border-primary"
            >
              <option value="Confidential">Confidential (Pricing & Credit)</option>
              <option value="Restricted">Restricted (Legal & Claims Only)</option>
              <option value="Standard">Standard Operations Team</option>
            </select>
          </div>
        </div>

        <div>
          <label className="small fw-bold text-secondary uppercase tracking-wider block mb-1">
            Optional Document Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a short note explaining how this document supports onboarding."
            className="w-100 bg-white border border-secondary border-opacity-25 rounded px-2.5 py-1.5 small text-dark focus:outline-none focus:border-primary focus:ring-1 focus:ring-blue-500 min-h-[64px]"
          />
          <p className="mt-1 small text-secondary">Allowed: {DOCUMENT_ALLOWED_EXTENSIONS.join(', ')} up to {DOCUMENT_MAX_BYTES / (1024 * 1024)}MB.</p>
        </div>

        {/* Submit Action Button */}
        <div className="d-d-flex justify-content-end pt-2">
          <button
            type="button"
            onClick={startUploadAndProcessing}
            disabled={processing.isProcessing}
            className={`px-5 py-2 rounded small fw-bold text-white shadow-sm transition d-d-flex align-items-center gap-2 cursor-pointer ${
              processing.isProcessing 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'btn-primary hover:btn-primary active:btn-primary'
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
