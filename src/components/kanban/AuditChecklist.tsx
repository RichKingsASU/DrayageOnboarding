import React from 'react';
import { Account } from '../../types';
import { Check, X } from 'lucide-react';

export default function AuditChecklist({
  currentAccount,
  onUpdateAccount,
  DOCUMENT_TYPES,
  initializeChecklist,
  computeAccountStage
}: {
  currentAccount: Account;
  onUpdateAccount: any;
  DOCUMENT_TYPES: readonly string[];
  initializeChecklist: any;
  computeAccountStage: any;
}) {
  return (
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

      <div className="pt-3.5 border-t border-slate-100 mt-4 space-y-2.5">
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
  );
}
