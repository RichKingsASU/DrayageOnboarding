import React from 'react';
import { Account } from '../../types';
import { AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { motion } from 'motion/react';

interface PipelineCardProps {
  account: Account;
  isFormActive: boolean;
  onSelectAccount: (accountId: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onSetFormAccount: (accountId: string) => void;
}

export default function PipelineCard({
  account,
  isFormActive,
  onSelectAccount,
  onDragStart,
  onSetFormAccount
}: PipelineCardProps) {
  const dangerAlerts = account.alerts?.filter(a => a.type === 'danger') || [];
  const hazardAlert = dangerAlerts.length > 0;
  const alertTooltip = dangerAlerts.length > 0
    ? dangerAlerts.map(a => a.message || 'Strict delivery terms alert!').join(' • ')
    : 'Strict delivery terms alert!';

  const typeDisplay = account.equipmentType && account.loadType
    ? `${account.equipmentType} (${account.loadType})`
    : (account.equipmentType || account.loadType || 'Not set');

  return (
    <motion.div
      layoutId={`account-card-${account.id}`}
      draggable
      onDragStart={(e: any) => onDragStart(e, account.id)}
      className={`position-relative bg-white border rounded p-3 shadow-sm transition-all ${
        isFormActive ? 'border-primary' : 'border-secondary-subtle'
      }`}
      style={{ cursor: 'grab', style: isFormActive ? { boxShadow: '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' } : {} } as any}
    >
      {hazardAlert && (
        <div 
          className="position-absolute text-danger" 
          style={{ top: '10px', right: '10px', cursor: 'help' }}
          title={`Red Flag SOP Alert: ${alertTooltip}`}
          aria-label={`Red Flag SOP Alert: ${alertTooltip}`}
        >
          <AlertTriangle className="w-4 h-4" style={{ animation: 'spinner-grow 2s linear infinite' }} />
        </div>
      )}

      <div className="d-flex flex-column gap-2">
        <div>
          <span className="badge bg-light text-secondary border px-2 py-1 mb-1">
            {account.billToCode || 'No Bill-To Code'}
          </span>
          <h6 
            onClick={(e) => {
              e.stopPropagation();
              onSelectAccount(account.id);
            }}
            className="fw-bold text-dark mb-0 text-decoration-none"
            style={{ cursor: 'pointer' }}
            title={`Open Customer 360-View for ${account.name}`}
          >
            <span className="text-dark hover-primary">{account.name}</span>
          </h6>
        </div>

        <div className="d-flex flex-column gap-1 small text-secondary fw-medium">
          <div className="d-flex align-items-center gap-1">
            <span>Terms:</span>
            <span className="fw-bold text-dark">{account.creditTerms || 'Not set'}</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <span>Type:</span>
            <span className="fw-bold text-dark">{typeDisplay}</span>
          </div>
        </div>

        <div className="pt-2 border-top d-flex flex-column gap-2">
          <div className="d-flex align-items-center justify-content-between text-muted" style={{ fontSize: '10px' }}>
            <span>{account.documents.length} Files in Vault</span>
            <button
              onClick={() => onSelectAccount(account.id)}
              className="btn btn-link btn-sm p-0 text-decoration-none fw-bold"
              style={{ fontSize: '10px' }}
            >
              Details &rarr;
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetFormAccount(account.id);
              setTimeout(() => {
                const target = document.getElementById('interactive_onboarding_workspace');
                if (target) target.scrollIntoView({ behavior: 'smooth' });
              }, 150);
            }}
            className={`btn btn-sm d-flex align-items-center justify-content-center gap-1 fw-bold ${
              isFormActive ? 'btn-primary' : 'btn-light border text-secondary'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Onboarding Tracker
          </button>
        </div>
      </div>
    </motion.div>
  );
}
