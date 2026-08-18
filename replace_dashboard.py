with open('src/components/CustomerDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports if missing
if 'import AuditChecklist' not in content:
    content = content.replace('import SecureDocumentUploader', "import AuditChecklist from './kanban/AuditChecklist';\nimport DocumentVault from './kanban/DocumentVault';\nimport SecureDocumentUploader")

lines = content.split('\n')
start1 = -1
end1 = -1
for i, l in enumerate(lines):
    if '<div className="space-y-3.5">' in l and 'Onboarding Document Status Checklist' in lines[i+1]:
        start1 = i
    if start1 != -1 and "currentAccount.auditChecklistCompleted ? 'Completed' : 'Pending'}" in l:
        end1 = i + 3
        break

if start1 != -1 and end1 != -1:
    lines = lines[:start1] + ['<AuditChecklist currentAccount={currentAccount} onUpdateAccount={onUpdateAccount} DOCUMENT_TYPES={DOCUMENT_TYPES} initializeChecklist={initializeChecklist} computeAccountStage={computeAccountStage} />'] + lines[end1+1:]

start2 = -1
end2 = -1
for i, l in enumerate(lines):
    if '<div className="space-y-3 md:col-span-2">' in l and 'Uploaded Files & Audit Logs' in lines[i+1]:
        start2 = i
    if start2 != -1 and '</AnimatePresence>' in l:
        end2 = i
        break

if start2 != -1 and end2 != -1:
    lines = lines[:start2] + ['<DocumentVault currentAccount={currentAccount} handleDownloadPackage={handleDownloadPackage} handleDeleteDoc={handleDeleteDoc} handleAddDoc={handleAddDoc} selectedPreviewDoc={selectedPreviewDoc} setSelectedPreviewDoc={setSelectedPreviewDoc} />'] + lines[end2+1:]

with open('src/components/CustomerDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print('CustomerDashboard modified')
