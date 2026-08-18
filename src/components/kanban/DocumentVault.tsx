import React from 'react';
import { Account } from '../../types';
import { FileText, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SecureDocumentUploader from '../SecureDocumentUploader';

export default function DocumentVault({
  currentAccount,
  handleDownloadPackage,
  handleDeleteDoc,
  handleAddDoc,
  selectedPreviewDoc,
  setSelectedPreviewDoc
}: {
  currentAccount: Account;
  handleDownloadPackage: any;
  handleDeleteDoc: any;
  handleAddDoc: any;
  selectedPreviewDoc: any;
  setSelectedPreviewDoc: any;
}) {
  return (
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
                <button
                  onClick={() => setSelectedPreviewDoc(doc)}
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

      <div className="pt-2">
        <SecureDocumentUploader
          accountName={currentAccount.name}
          accountId={currentAccount.id}
          onUploadDocument={handleAddDoc}
        />
      </div>

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
              onClick={(e: any) => e.stopPropagation()}
              className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col p-6 relative text-slate-800 font-sans cursor-default"
            >
              <button
                onClick={() => setSelectedPreviewDoc(null)}
                className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                title="Close lightbox"
              >
                <X className="w-4 h-4" />
              </button>
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

              <div className="space-y-6 flex-1 min-h-[250px] border border-dashed rounded-xl p-5 bg-slate-50/20">
                {selectedPreviewDoc.contentKey ? (
                  (() => {
                    try {
                      const formObj = JSON.parse(selectedPreviewDoc.contentKey);
                      if (formObj.type === 'checklist') {
                        const d = formObj.data;
                        return (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center bg-blue-50/50 p-2 border rounded-lg text-xs">
                              <span className="font-bold text-blue-900">FORM: CUSTOMER ONBOARDING CHECKLIST</span>
                              <span className="font-mono text-slate-500 text-[10px]">Doc Class: Credit Application</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {Object.entries(d).map(([k, v]) => (
                                <div key={k} className="p-2 border rounded bg-white flex justify-between">
                                  <span className="font-bold text-slate-600 uppercase text-[10px]">{k}</span>
                                  <span className="font-black text-slate-800">{String(v)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      if (formObj.type === 'external') {
                        const d = formObj.data;
                        return (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center bg-blue-50/50 p-2 border rounded-lg text-xs">
                              <span className="font-bold text-blue-900">FORM: EXTERNAL CUSTOMER QUESTIONNAIRE</span>
                              <span className="font-mono text-slate-500 text-[10px]">Doc Class: SOP Document</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2 text-xs">
                              {Object.entries(d).map(([k, v]) => (
                                <div key={k} className="p-2 border rounded bg-white flex justify-between items-center">
                                  <span className="font-bold text-slate-600 uppercase text-[10px]">{k}</span>
                                  <span className="font-black text-slate-800">{String(v)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(formObj, null, 2)}</pre>;
                    } catch (e) {
                      return <p className="text-sm font-mono text-slate-700 whitespace-pre-wrap">{selectedPreviewDoc.contentKey}</p>;
                    }
                  })()
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-10">
                    <FileText className="w-12 h-12 text-slate-300" />
                    <p className="text-xs font-bold uppercase tracking-widest text-center">Standard Encrypted Document<br/><span className="text-[10px] font-normal lowercase">(Non-interactive preview)</span></p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
