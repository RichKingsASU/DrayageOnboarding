with open('src/components/KanbanBoard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'import { computeAccountStage' in l:
        print('Imports:', i)
    if '<div className="grid grid-cols-1 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">' in l:
        print('KanbanStart:', i)
    if '        {/* Kanban Board Columns */}' in l:
        print('KanbanComment:', i)
    if '<div className="p-6 md:p-8 bg-slate-100/50 flex justify-center min-h-[460px]">' in l:
        print('FormStart:', i)
    if 'registers this physical compliant checklist form directly in the customer profile documents for auditing' in l:
        print('FormEndish:', i)

with open('src/components/CustomerDashboard.tsx', 'r', encoding='utf-8') as f:
    dlines = f.readlines()

for i, l in enumerate(dlines):
    if '<div className="space-y-3.5">' in l and 'Onboarding Document Status Checklist' in dlines[i+1]:
        print('AuditStart:', i)
    if 'currentAccount.auditChecklistCompleted ? \'Completed\' : \'Pending\'}' in l:
        print('AuditEndish:', i)
    if '<div className="space-y-3 md:col-span-2">' in l and 'Uploaded Files & Audit Logs' in dlines[i+1]:
        print('VaultStart:', i)
    if '</AnimatePresence>' in l:
        print('VaultEndish:', i)

