import React from 'react';
import { Account } from '../../types';

interface OnboardingFormProps {
  currentAcc: Account;
  activeFormTab: 'checklist' | 'external' | 'internal';
  checklistState: any;
  setChecklistState: React.Dispatch<React.SetStateAction<any>>;
  handleChecklistChange: (field: string, checked: boolean) => void;
  externalMeetingState: any;
  setExternalMeetingState: React.Dispatch<React.SetStateAction<any>>;
  internalMeetingState: any;
  setInternalMeetingState: React.Dispatch<React.SetStateAction<any>>;
}

export default function OnboardingForm({
  currentAcc,
  activeFormTab,
  checklistState,
  setChecklistState,
  handleChecklistChange,
  externalMeetingState,
  setExternalMeetingState,
  internalMeetingState,
  setInternalMeetingState
}: OnboardingFormProps) {
  return (
    <div className="card shadow-sm border-0 p-4 w-100 position-relative" style={{ minHeight: '400px' }}>
      <span className="position-absolute text-muted small fw-bold text-uppercase" style={{ top: '10px', right: '15px', fontSize: '9px' }}>
        Forrest Transportation • Rev 4/18/25
      </span>

      <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between border-bottom pb-3 mb-4 gap-3">
        <div className="d-flex align-items-center gap-2">
          <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: '36px', height: '36px', fontSize: '18px' }}>
            F
          </div>
          <div>
            <h5 className="fw-bolder text-primary mb-0 text-uppercase" style={{ fontSize: '16px' }}>FORREST TRANSPORTATION</h5>
            <p className="text-muted fw-bold mb-0 text-uppercase" style={{ fontSize: '10px' }}>PORT & RAIL CONTAINER DRAYAGE PORTAL</p>
          </div>
        </div>
        <div className="text-center text-sm-end">
          <h6 className="fw-black text-dark mb-0 text-uppercase">
            {activeFormTab === 'checklist' && 'Customer Onboarding Checklist'}
            {activeFormTab === 'external' && 'External New Customer Meeting'}
            {activeFormTab === 'internal' && 'Internal New Customer Meeting'}
          </h6>
          <p className="text-muted fw-medium mb-0" style={{ fontSize: '10px' }}>Standard Operating Compliance Rev 4/18/25</p>
        </div>
      </div>

      <div className="row g-2 bg-light p-2 rounded border text-muted small fw-bold mb-4">
        <div className="col-12 col-sm-4 d-flex align-items-center gap-2">
          <span>Customer Name:</span>
          <span className="text-dark fw-black">{currentAcc.name}</span>
        </div>
        <div className="col-12 col-sm-4 d-flex align-items-center gap-2">
          <span>Bill-to Code:</span>
          <span className="text-dark fw-black font-monospace bg-secondary bg-opacity-25 px-1 rounded">{currentAcc.billToCode}</span>
        </div>
        <div className="col-12 col-sm-4 d-flex align-items-center gap-2">
          <span>Audit Status:</span>
          <span className="text-primary fw-black bg-primary bg-opacity-10 px-1 rounded text-capitalize">{currentAcc.stage === 'OngoingSupport' ? 'Active' : 'Pipeline'}</span>
        </div>
      </div>

      {activeFormTab === 'checklist' && (
        <div className="d-flex flex-column gap-3">
          <h6 className="fw-black text-primary text-uppercase border-bottom pb-1" style={{ fontSize: '12px' }}>
            Are the following completed?
          </h6>

          <div className="row g-2">
            <div className="col-12 col-sm-6">
              <label className="d-flex align-items-center gap-2 p-2 bg-light border rounded" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={checklistState.creditApp} onChange={(e) => handleChecklistChange('creditApp', e.target.checked)} className="form-check-input mt-0" />
                <div className="d-flex flex-column">
                  <span className="fw-bold text-dark small">Credit App Signed</span>
                  <span className="text-muted" style={{ fontSize: '10px' }}>Approved Net Terms verification</span>
                </div>
              </label>
            </div>
            
            <div className="col-12 col-sm-6">
              <label className="d-flex align-items-center gap-2 p-2 bg-light border rounded" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={checklistState.db} onChange={(e) => handleChecklistChange('db', e.target.checked)} className="form-check-input mt-0" />
                <div className="d-flex flex-column">
                  <span className="fw-bold text-dark small">D&B Verification Check</span>
                  <span className="text-muted" style={{ fontSize: '10px' }}>Credit score assessment logged</span>
                </div>
              </label>
            </div>

            <div className="col-12 col-sm-6">
              <label className="d-flex align-items-center gap-2 p-2 bg-light border rounded" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={checklistState.contract} onChange={(e) => handleChecklistChange('contract', e.target.checked)} className="form-check-input mt-0" />
                <div className="d-flex flex-column">
                  <span className="fw-bold text-dark small">Contract / Bilateral Agreement</span>
                  <span className="text-muted" style={{ fontSize: '10px' }}>Signed liability files and insurance</span>
                </div>
              </label>
            </div>

            <div className="col-12 col-sm-6">
              <label className="d-flex align-items-center gap-2 p-2 bg-light border rounded" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={checklistState.fuelAgreement} onChange={(e) => handleChecklistChange('fuelAgreement', e.target.checked)} className="form-check-input mt-0" />
                <div className="d-flex flex-column">
                  <span className="fw-bold text-dark small">Fuel Matrix Agreement Set</span>
                  <span className="text-muted" style={{ fontSize: '10px' }}>DOE FSC index program loaded</span>
                </div>
              </label>
            </div>

            <div className="col-12 col-sm-6">
              <label className="d-flex align-items-center gap-2 p-2 bg-light border rounded" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={checklistState.accessorialAgreement} onChange={(e) => handleChecklistChange('accessorialAgreement', e.target.checked)} className="form-check-input mt-0" />
                <div className="d-flex flex-column">
                  <span className="fw-bold text-dark small">Accessorial Schedule Settled</span>
                  <span className="text-muted" style={{ fontSize: '10px' }}>Chassis split, demurrage and pre-pull SOP</span>
                </div>
              </label>
            </div>

            <div className="col-12 col-sm-6">
              <label className="d-flex align-items-center gap-2 p-2 bg-success bg-opacity-10 border border-success border-opacity-25 rounded" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={!!checklistState.workOrderReceived} onChange={(e) => handleChecklistChange('workOrderReceived', e.target.checked)} className="form-check-input mt-0" />
                <div className="d-flex flex-column">
                  <span className="fw-bold text-success small">Work Order Received</span>
                  <span className="text-success" style={{ fontSize: '10px' }}>Official work order document received and logged</span>
                </div>
              </label>
            </div>

            <div className="col-12 col-sm-6">
              <label className="d-flex align-items-center gap-2 p-2 bg-success bg-opacity-10 border border-success border-opacity-25 rounded" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={!!checklistState.onboardingCallCompleted} onChange={(e) => handleChecklistChange('onboardingCallCompleted', e.target.checked)} className="form-check-input mt-0" />
                <div className="d-flex flex-column">
                  <span className="fw-bold text-success small">Customer Onboarding Call</span>
                  <span className="text-success" style={{ fontSize: '10px' }}>Onboarding call completed & requirements logged</span>
                </div>
              </label>
            </div>

            <div className="col-12 col-sm-6">
              <label className="d-flex align-items-center gap-2 p-2 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={!!checklistState.auditCompleted} onChange={(e) => handleChecklistChange('auditCompleted', e.target.checked)} className="form-check-input mt-0" />
                <div className="d-flex flex-column">
                  <span className="fw-bold text-primary small">Audit Checklist Completed</span>
                  <span className="text-primary" style={{ fontSize: '10px' }}>Official form sign-off and compliance validation</span>
                </div>
              </label>
            </div>
          </div>

          <div className="row g-2 mt-2">
            <div className="col-12 col-sm-4">
              <label className="form-label text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>Established Rate Agreement</label>
              <select value={checklistState.rateAgreement} onChange={(e: any) => setChecklistState((prev: any) => ({ ...prev, rateAgreement: e.target.value }))} className="form-select form-select-sm bg-light">
                <option value="Spot">Spot Rate matrix</option>
                <option value="Contract">Bilateral Contract Rate</option>
                <option value="Tariff">Standard published Tariff</option>
              </select>
            </div>
            <div className="col-12 col-sm-4">
              <label className="form-label text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>Schedule Internal Pre-Call</label>
              <input type="datetime-local" value={checklistState.internalMeetingDate} onChange={(e) => setChecklistState((prev: any) => ({ ...prev, internalMeetingDate: e.target.value }))} className="form-control form-control-sm bg-light" />
            </div>
            <div className="col-12 col-sm-4">
              <label className="form-label text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>Schedule External Customer Call</label>
              <input type="datetime-local" value={checklistState.externalMeetingDate} onChange={(e) => setChecklistState((prev: any) => ({ ...prev, externalMeetingDate: e.target.value }))} className="form-control form-control-sm bg-light" />
            </div>
          </div>

          <div className="mt-2">
            <label className="form-label text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>Onboarding Checklist Notes</label>
            <textarea rows={2} value={checklistState.notes} onChange={(e) => setChecklistState((prev: any) => ({ ...prev, notes: e.target.value }))} placeholder="Type notes..." className="form-control form-control-sm bg-light resize-none" />
          </div>
        </div>
      )}

      {activeFormTab === 'external' && (
        <div className="d-flex flex-column gap-3">
          <h6 className="fw-black text-primary text-uppercase border-bottom pb-1" style={{ fontSize: '12px' }}>
            External Customer Questionnaire (Rev 4/18/25)
          </h6>
          <div className="row g-3">
            <div className="col-12 col-md-6 d-flex flex-column gap-2">
              <div>
                <label className="form-label text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>1. Operational dispatcher contact</label>
                <input type="text" value={externalMeetingState.opsContact} onChange={(e) => setExternalMeetingState((prev: any) => ({ ...prev, opsContact: e.target.value }))} className="form-control form-control-sm bg-light" />
              </div>
              <div>
                <label className="form-label text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>2. Volume Expectations & Cadence</label>
                <input type="text" value={externalMeetingState.expectedVolume} onChange={(e) => setExternalMeetingState((prev: any) => ({ ...prev, expectedVolume: e.target.value }))} className="form-control form-control-sm bg-light" />
              </div>
              <div>
                <label className="form-label text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>3. Is volume seasonal or steady?</label>
                <select value={externalMeetingState.seasonality} onChange={(e) => setExternalMeetingState((prev: any) => ({ ...prev, seasonality: e.target.value }))} className="form-select form-select-sm bg-light">
                  <option value="Steady">Steady Volume year-round</option>
                  <option value="Seasonal">Seasonal Peaks / Pulses</option>
                </select>
              </div>
              <div>
                <label className="form-label text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>4. Delivery Mode flow</label>
                <select value={externalMeetingState.unhookType} onChange={(e) => setExternalMeetingState((prev: any) => ({ ...prev, unhookType: e.target.value }))} className="form-select form-select-sm bg-light">
                  <option value="Live Unload">Live Unload (Drivers wait on site)</option>
                  <option value="Drop and Hook">Drop and Hook (Chassis stay in yard)</option>
                </select>
              </div>
              <div>
                <label className="form-label text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>5. Primary Shipping Markets</label>
                <input type="text" value={externalMeetingState.markets} onChange={(e) => setExternalMeetingState((prev: any) => ({ ...prev, markets: e.target.value }))} placeholder="e.g. LA/LB ports to Phoenix" className="form-control form-control-sm bg-light" />
              </div>
            </div>
            
            <div className="col-12 col-md-6 d-flex flex-column gap-2">
              <div>
                <label className="form-label text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>6. Customer Portal (Details)</label>
                <input type="text" value={externalMeetingState.portalCode} onChange={(e) => setExternalMeetingState((prev: any) => ({ ...prev, portalCode: e.target.value }))} className="form-control form-control-sm bg-light" />
              </div>
              <div>
                <label className="form-label text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>7. EDI / API Integration requirement</label>
                <input type="text" value={externalMeetingState.ediIntegration} onChange={(e) => setExternalMeetingState((prev: any) => ({ ...prev, ediIntegration: e.target.value }))} className="form-control form-control-sm bg-light" />
              </div>
              <div>
                <label className="form-label text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>8. Chassis Agreement (Extended Free-Time?)</label>
                <input type="text" value={externalMeetingState.chassisAgreement} onChange={(e) => setExternalMeetingState((prev: any) => ({ ...prev, chassisAgreement: e.target.value }))} className="form-control form-control-sm bg-light" />
              </div>
              <div>
                <label className="form-label text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>9. Unloading hours & Appt conditions</label>
                <input type="text" value={externalMeetingState.hoursUnloading} onChange={(e) => setExternalMeetingState((prev: any) => ({ ...prev, hoursUnloading: e.target.value }))} placeholder="e.g. 06:00 AM - 15:00 PM, appt required" className="form-control form-control-sm bg-light" />
              </div>
              
              <div className="row g-2 pt-2 small fw-bold">
                <div className="col-6">
                  <label className="d-flex align-items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={externalMeetingState.agreementsSigned} onChange={(e) => setExternalMeetingState((prev: any) => ({ ...prev, agreementsSigned: e.target.checked }))} className="form-check-input mt-0" />
                    <span>Agreements Signed</span>
                  </label>
                </div>
                <div className="col-6">
                  <label className="d-flex align-items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={externalMeetingState.opsReport} onChange={(e) => setExternalMeetingState((prev: any) => ({ ...prev, opsReport: e.target.checked }))} className="form-check-input mt-0" />
                    <span>Daily Ops Report</span>
                  </label>
                </div>
                <div className="col-12">
                  <label className="d-flex align-items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={externalMeetingState.getApQuestionnaire} onChange={(e) => setExternalMeetingState((prev: any) => ({ ...prev, getApQuestionnaire: e.target.checked }))} className="form-check-input mt-0" />
                    <span className="text-primary fw-black">***GET AP QUESTIONAIRE***</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className="form-label text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>Other Service requirements & Notes</label>
            <textarea rows={2} value={externalMeetingState.notes} onChange={(e) => setExternalMeetingState((prev: any) => ({ ...prev, notes: e.target.value }))} placeholder="Write notes..." className="form-control form-control-sm bg-light resize-none" />
          </div>
        </div>
      )}

      {activeFormTab === 'internal' && (
        <div className="d-flex flex-column gap-3">
          <h6 className="fw-black text-primary text-uppercase border-bottom pb-1" style={{ fontSize: '12px' }}>
            Internal Team Meeting Roles & Check-offs (Rev 4/18/25)
          </h6>
          <div className="row g-3 small fw-medium">
            <div className="col-12 col-md-4">
              <label className="form-label text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>Pricing Contact Specialist</label>
              <input type="text" disabled value={internalMeetingState.pricingContact} className="form-control form-control-sm bg-secondary bg-opacity-10 fw-bold text-muted" />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>SW Account Manager</label>
              <input type="text" value={internalMeetingState.swAccountManager} onChange={(e) => setInternalMeetingState((prev: any) => ({ ...prev, swAccountManager: e.target.value }))} className="form-control form-control-sm bg-light" />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>East Account Manager</label>
              <input type="text" value={internalMeetingState.eastAccountManager} onChange={(e) => setInternalMeetingState((prev: any) => ({ ...prev, eastAccountManager: e.target.value }))} className="form-control form-control-sm bg-light" />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>PNW Account Manager</label>
              <input type="text" value={internalMeetingState.pnwAccountManager} onChange={(e) => setInternalMeetingState((prev: any) => ({ ...prev, pnwAccountManager: e.target.value }))} className="form-control form-control-sm bg-light" />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>Sales Team Lead</label>
              <input type="text" value={internalMeetingState.salesContact} onChange={(e) => setInternalMeetingState((prev: any) => ({ ...prev, salesContact: e.target.value }))} className="form-control form-control-sm bg-light" />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>EDI / IT Contact Engineer</label>
              <input type="text" value={internalMeetingState.ediContact} onChange={(e) => setInternalMeetingState((prev: any) => ({ ...prev, ediContact: e.target.value }))} className="form-control form-control-sm bg-light" />
            </div>
          </div>
          
          <div className="p-3 bg-light border rounded">
            <h6 className="fw-bold text-muted text-uppercase mb-2" style={{ fontSize: '10px' }}>We sent the team the following drayage guidelines:</h6>
            <div className="d-flex flex-wrap gap-3 small fw-bold text-dark">
              <label className="d-flex align-items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={internalMeetingState.ratesSent} onChange={(e) => setInternalMeetingState((prev: any) => ({ ...prev, ratesSent: e.target.checked }))} className="form-check-input mt-0" />
                <span>✔ Customer Linehaul Rates Sent</span>
              </label>
              <label className="d-flex align-items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={internalMeetingState.fuelSent} onChange={(e) => setInternalMeetingState((prev: any) => ({ ...prev, fuelSent: e.target.checked }))} className="form-check-input mt-0" />
                <span>✔ DOE Fuel Matrix Sent</span>
              </label>
              <label className="d-flex align-items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={internalMeetingState.accessorialsSent} onChange={(e) => setInternalMeetingState((prev: any) => ({ ...prev, accessorialsSent: e.target.checked }))} className="form-check-input mt-0" />
                <span>✔ Demurrage & Split Accessorials SOP Sent</span>
              </label>
            </div>
          </div>

          <div>
            <label className="form-label text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '10px' }}>Internal Meeting Notes (Agenda discussions)</label>
            <textarea rows={2} value={internalMeetingState.notes} onChange={(e) => setInternalMeetingState((prev: any) => ({ ...prev, notes: e.target.value }))} placeholder="Setup meeting comments..." className="form-control form-control-sm bg-light resize-none" />
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-top row g-2 small text-muted user-select-none">
        <div className="col-12 col-sm-4 d-flex align-items-center gap-2">
          <span className="fw-bold">Completed by:</span>
          <span className="fw-bolder text-dark text-decoration-underline" style={{ textDecorationStyle: 'dotted' }}>Tanya Wahl</span>
        </div>
        <div className="col-12 col-sm-4 d-flex align-items-center gap-2">
          <span className="fw-bold">Title:</span>
          <span className="fw-bold text-secondary">Pricing & Onboarding Specialist</span>
        </div>
        <div className="col-12 col-sm-4 d-flex align-items-center gap-2 justify-content-sm-end">
          <span className="fw-bold">Sign Date:</span>
          <span className="fw-black text-dark">{checklistState.completedDate}</span>
        </div>
      </div>
    </div>
  );
}
