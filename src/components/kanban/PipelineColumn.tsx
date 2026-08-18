import React from 'react';
import { Account, PipelineStage } from '../../types';
import PipelineCard from './PipelineCard';

interface PipelineColumnProps {
  stage: { key: PipelineStage; label: string; color: string; desc: string; icon: any };
  accounts: Account[];
  selectedFormAccountId: string | null;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stage: PipelineStage) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onSelectAccount: (accountId: string) => void;
  onSetFormAccount: (accountId: string) => void;
}

export default function PipelineColumn({
  stage,
  accounts,
  selectedFormAccountId,
  onDragOver,
  onDrop,
  onDragStart,
  onSelectAccount,
  onSetFormAccount
}: PipelineColumnProps) {
  const StageIcon = stage.icon;

  return (
    <div
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage.key)}
      className="col bg-light border rounded p-3 d-flex flex-column"
      style={{ minWidth: '260px', minHeight: '480px' }}
    >
      <div className="mb-3">
        <div className="d-flex align-items-center justify-content-between mb-1">
          <div className="d-flex align-items-center gap-2">
            <div className="text-secondary">
              <StageIcon className="w-4 h-4" />
            </div>
            <h6 className="fw-bold mb-0 text-dark">{stage.label}</h6>
          </div>
          <span className="badge bg-secondary rounded-pill">
            {accounts.length}
          </span>
        </div>
        <p className="text-muted small mb-0" style={{ fontSize: '11px' }}>{stage.desc}</p>
      </div>

      <div className="flex-grow-1 overflow-auto pe-1 d-flex flex-column gap-2" style={{ maxHeight: '500px' }}>
        {accounts.length === 0 ? (
          <div className="border border-dashed rounded d-flex align-items-center justify-content-center p-4 text-center h-100">
            <p className="text-muted small mb-0">Drag accounts here to update status</p>
          </div>
        ) : (
          accounts.map((account) => (
            <PipelineCard
              key={account.id}
              account={account}
              isFormActive={selectedFormAccountId === account.id}
              onDragStart={onDragStart}
              onSelectAccount={onSelectAccount}
              onSetFormAccount={onSetFormAccount}
            />
          ))
        )}
      </div>
    </div>
  );
}
