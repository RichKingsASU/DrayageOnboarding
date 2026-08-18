import os

with open('src/components/KanbanBoard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'import PipelineColumn' not in content:
    content = content.replace("import { motion, AnimatePresence } from 'motion/react';",
                              "import { motion, AnimatePresence } from 'motion/react';\nimport PipelineColumn from './kanban/PipelineColumn';\nimport OnboardingForm from './kanban/OnboardingForm';")

start1_str = """<div className="grid grid-cols-1 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">"""
end1_str = """      </div>

      {/* ========================================================================================== */}"""

replacement1 = """<div className="row flex-nowrap overflow-auto pb-4">
        {/* Kanban Board Columns */}
        {PIPELINE_STAGES.map((stage) => (
          <PipelineColumn
            key={stage.key}
            stage={stage}
            accounts={accounts.filter((a) => a.stage === stage.key)}
            selectedFormAccountId={selectedFormAccountId}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onSelectAccount={onSelectAccount}
            onSetFormAccount={handleOpenForm}
          />
        ))}
      </div>

      {/* ========================================================================================== */}"""

if start1_str in content and end1_str in content:
    start_idx = content.find(start1_str)
    end_idx = content.find(end1_str) + len(end1_str)
    content = content[:start_idx] + replacement1 + content[end_idx:]

start2_str = """<div className="p-6 md:p-8 bg-slate-100/50 flex justify-center min-h-[460px]">"""
end2_str = """Clicking <strong>"Sign & Publish to Vault"</strong> registers this physical compliant checklist form directly in the customer profile documents for auditing.</span>
                  </div>
                </div>

              </motion.div>"""

replacement2 = """<div className="p-4 bg-light d-flex justify-content-center" style={{ minHeight: '460px' }}>
              <OnboardingForm
                currentAcc={currentAcc}
                activeFormTab={activeFormTab}
                checklistState={checklistState}
                setChecklistState={setChecklistState}
                handleChecklistChange={handleChecklistChange}
                internalMeetingState={internalMeetingState}
                setInternalMeetingState={setInternalMeetingState}
                externalMeetingState={externalMeetingState}
                setExternalMeetingState={setExternalMeetingState}
              />
              </div>

              </motion.div>"""

if start2_str in content and end2_str in content:
    start_idx = content.find(start2_str)
    end_idx = content.find(end2_str) + len(end2_str)
    content = content[:start_idx] + replacement2 + content[end_idx:]

with open('src/components/KanbanBoard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("KanbanBoard correctly updated with accurate props")
