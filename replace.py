import os

with open('src/components/CustomerDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'import AuditChecklist' not in content:
    content = content.replace("import SecureDocumentUploader from './SecureDocumentUploader';",
        "import SecureDocumentUploader from './SecureDocumentUploader';\nimport AuditChecklist from './kanban/AuditChecklist';\nimport DocumentVault from './kanban/DocumentVault';")

start_audit_str = '<div className="space-y-3.5">\n            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Onboarding Document Status Checklist</h5>'
end_audit_str = "currentAccount.auditChecklistCompleted ? 'Completed' : 'Pending'}\n                </span>\n              </label>\n            </div>\n          </div>"

start_audit = content.find(start_audit_str)
end_audit = content.find(end_audit_str)

if start_audit != -1 and end_audit != -1:
    content = content[:start_audit] + '<AuditChecklist currentAccount={currentAccount} onUpdateAccount={onUpdateAccount} DOCUMENT_TYPES={DOCUMENT_TYPES} initializeChecklist={initializeChecklist} computeAccountStage={computeAccountStage} />' + content[end_audit + len(end_audit_str):]
else:
    print("Audit block not found")

start_vault_str = '<div className="space-y-3 md:col-span-2">\n            <div className="flex items-center justify-between">\n              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Uploaded Files & Audit Logs</h5>'
end_vault_str = '</AnimatePresence>\n    </div>'

start_vault = content.find(start_vault_str)
end_vault = content.find(end_vault_str)

if start_vault != -1 and end_vault != -1:
    content = content[:start_vault] + '<DocumentVault currentAccount={currentAccount} handleDownloadPackage={handleDownloadPackage} handleDeleteDoc={handleDeleteDoc} handleAddDoc={handleAddDoc} selectedPreviewDoc={selectedPreviewDoc} setSelectedPreviewDoc={setSelectedPreviewDoc} />\n    </div>' + content[end_vault + len(end_vault_str):]
else:
    print("Vault block not found")

with open('src/components/CustomerDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done replacing.")
