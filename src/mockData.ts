/**
 * File: mockData.ts
 * Purpose: Provides seed/demo onboarding accounts, contacts, and accessorial SOP records for local fallback use.
 * Dependencies: Shared TypeScript domain types from types.ts.
 * Maintainer note: Data reflects business scenarios and should not be treated as production customer records.
 */
import { Account, Contact, Lane, AccessorialSOP, ChecklistState } from './types';
import { buildDefaultChecklist, ChecklistDefaultsInput } from './onboardingRules';

const DEMO_ACCOUNTS: Account[] = [
  {
    id: 'act_1',
    name: 'Chalas Supply Inc.',
    billToCode: 'CHALAS01',
    creditTerms: 'Net 15',
    invoiceDocsRequired: ['Signed POD', 'Interchange Outgate Receipt', 'Chassis Manifest PDF'],
    acceptSequenceBills: false,
    commodity: 'Electronics & High-Value Consumer Goods',
    equipmentType: 'Dry',
    loadType: 'Palletized',
    expectedWeight: '38,500 lbs avg',
    isBonded: true,
    hazmatClass: 'N/A',
    cargoValue: 250000,
    prefCommMethod: 'SMS',
    needsApiEdi: true,
    stage: 'OperationalKickoff',
    alerts: [
      {
        id: 'al_chalas_1',
        type: 'danger',
        message: 'Strict Delivery Timing: 6:00 AM or 7:00 AM ONLY. No delays acceptable. Customer will refuse driver if over 5 minutes late.'
      },
      {
        id: 'al_chalas_2',
        type: 'warning',
        message: 'Pre-Pull Required: All container movements must undergo pre-pull to the local yard 24 hrs prior to delivery to avoid pier storage.'
      }
    ],
    documents: [
      {
        id: 'doc_chalas_1',
        name: 'Chalas_Credit_App_Signed.pdf',
        type: 'Credit Application',
        uploadedAt: '2026-05-10',
        size: '820 KB'
      },
      {
        id: 'doc_chalas_2',
        name: 'Liability_Agreement_Chalas_2026.pdf',
        type: 'Liability Agreement',
        uploadedAt: '2026-05-12',
        size: '1.4 MB'
      },
      {
        id: 'doc_chalas_3',
        name: 'Chalas_Supply_Standard_SOP_v4.pdf',
        type: 'SOP Document',
        uploadedAt: '2026-05-20',
        size: '2.8 MB'
      }
    ]
  },
  {
    id: 'act_2',
    name: "Al's Plastics Corp",
    billToCode: 'ALSPLAS',
    creditTerms: 'Net 30',
    invoiceDocsRequired: ['Signed POD', 'Equipment Interchange Receipt'],
    acceptSequenceBills: true,
    commodity: 'Plastic Regrind & Extruded Film Rolls',
    equipmentType: 'Dry',
    loadType: 'Both',
    expectedWeight: '44,000 lbs max',
    isBonded: false,
    hazmatClass: 'N/A',
    cargoValue: 75000,
    prefCommMethod: 'Email',
    needsApiEdi: false,
    stage: 'OngoingSupport',
    alerts: [
      {
        id: 'al_als_1',
        type: 'warning',
        message: 'Overweight Load Warning: Weight consistently approaches 44,000 lbs. Ensure driver uses an active 4-axle / tri-axle chassis for all 20ft loads.'
      }
    ],
    documents: [
      {
        id: 'doc_als_1',
        name: 'AlsPlastics_Signed_CreditApp.pdf',
        type: 'Credit Application',
        uploadedAt: '2026-03-20',
        size: '1.1 MB'
      },
      {
        id: 'doc_als_2',
        name: 'AlsPlastics_SOP_v2.pdf',
        type: 'SOP Document',
        uploadedAt: '2026-03-24',
        size: '3.1 MB'
      }
    ]
  },
  {
    id: 'act_3',
    name: 'Pacific Fresh Growers',
    billToCode: 'PACFRESH',
    creditTerms: 'Prepaid',
    invoiceDocsRequired: ['Clean Signed POD', 'Reefer Temp Logs Printout'],
    acceptSequenceBills: false,
    commodity: 'Frozen Organic Fruits & Purees',
    equipmentType: 'Reefer',
    loadType: 'Palletized',
    expectedWeight: '41,200 lbs',
    isBonded: false,
    hazmatClass: 'N/A',
    cargoValue: 140000,
    prefCommMethod: 'Email',
    needsApiEdi: false,
    stage: 'CustomerInquiry',
    alerts: [
      {
        id: 'al_fresh_1',
        type: 'info',
        message: 'Required Continuous Run: Set reefer temperature to continuous -10°F. Ensure reefer tank is fully fueled near port gate before long transport.'
      }
    ],
    documents: [
      {
        id: 'doc_fresh_1',
        name: 'PACFRESH_Price_Proposal_Inquiry.pdf',
        type: 'Other',
        uploadedAt: '2026-06-15',
        size: '640 KB'
      }
    ]
  },
  {
    id: 'act_4',
    name: 'Apex Chemical Logistics',
    billToCode: 'APEXCHEM',
    creditTerms: 'Special (Net 45)',
    invoiceDocsRequired: ['Signed POD with Clean Seal Details', 'Dangerous Goods Manifest', 'Scale Tickets'],
    acceptSequenceBills: true,
    commodity: 'Industrial Polymer Resins (Flammables)',
    equipmentType: 'Dry',
    loadType: 'Floor Loaded',
    expectedWeight: '39,800 lbs',
    isBonded: true,
    hazmatClass: 'Class 3 (Flammable Liquid) - UN1263',
    cargoValue: 320000,
    prefCommMethod: 'EDI',
    needsApiEdi: true,
    stage: 'Agreement',
    alerts: [
      {
        id: 'al_apex_1',
        type: 'danger',
        message: 'HAZMAT CREDENTIALS REQUIRED: All drivers dispatched MUST have Hazmat Endorsements. Containers must be placarded with UN1263 Class 3 before exiting terminal.'
      }
    ],
    documents: [
      {
        id: 'doc_apex_1',
        name: 'Apex_Signed_Bilateral_Contract_2026.pdf',
        type: 'Liability Agreement',
        uploadedAt: '2026-06-01',
        size: '4.5 MB'
      },
      {
        id: 'doc_apex_2',
        name: 'Apex_Emergency_Response_Protocols.pdf',
        type: 'SOP Document',
        uploadedAt: '2026-06-01',
        size: '1.8 MB'
      }
    ]
  },
  {
    id: 'act_5',
    name: 'Tri-State Import Group',
    billToCode: 'TRISTATE05',
    creditTerms: 'Net 30',
    invoiceDocsRequired: ['Signed POD', 'Steamship Line Devanning Confirmation'],
    acceptSequenceBills: false,
    commodity: 'Flatpack Furniture & Kitchenware',
    equipmentType: 'Dry',
    loadType: 'Floor Loaded',
    expectedWeight: '35,000 lbs',
    isBonded: false,
    hazmatClass: 'N/A',
    cargoValue: 95000,
    prefCommMethod: 'Email',
    needsApiEdi: false,
    stage: 'AccountSetup',
    alerts: [],
    documents: [
      {
        id: 'doc_tristate_1',
        name: 'TriState_Credit_App_Submitted.pdf',
        type: 'Credit Application',
        uploadedAt: '2026-06-12',
        size: '1.2 MB'
      }
    ]
  },
  {
    id: 'act_amazon',
    name: 'Amazon Logistics, Inc.',
    billToCode: 'AMAZON01',
    creditTerms: 'Net 30',
    invoiceDocsRequired: ['Signed POD', 'Equipment Interchange Outgate Receipt'],
    acceptSequenceBills: true,
    commodity: 'Fulfillment & general retail distribution',
    equipmentType: 'Dry',
    loadType: 'Palletized',
    expectedWeight: '28,500 lbs avg',
    isBonded: false,
    hazmatClass: 'N/A',
    cargoValue: 180000,
    prefCommMethod: 'EDI',
    needsApiEdi: true,
    stage: 'OngoingSupport',
    alerts: [
      {
        id: 'al_amazon_1',
        type: 'info',
        message: 'Portal Routing Rule: Standard out-gate receipts must verify destination warehouse match via Carrier Portal within 4 hrs of departure.'
      }
    ],
    documents: [
      {
        id: 'doc_amazon_1',
        name: 'Amazon_Master_Rate_Tariff_Distorted_2026.pdf',
        type: 'Liability Agreement',
        uploadedAt: '2026-06-19',
        size: '1.9 MB'
      },
      {
        id: 'doc_amazon_2',
        name: 'Amazon_Onboarding_Compliance_Receipt.pdf',
        type: 'Credit Application',
        uploadedAt: '2026-06-19',
        size: '144 KB'
      }
    ]
  }
];

type DemoChecklistOverride = Omit<ChecklistDefaultsInput, 'account'>;

const DEMO_CHECKLIST_OVERRIDES: Record<string, DemoChecklistOverride> = {
  act_1: {
    fuelAgreement: true,
    accessorialAgreement: true,
    completedBy: 'Demo Pricing Specialist',
    completedDate: '2026-06-19',
    internalMeetingDate: '2026-06-19T09:30',
    externalMeetingDate: '2026-06-19T11:00',
  },
  act_2: {
    accessorialAgreement: true,
    completedBy: 'Demo Pricing Specialist',
    completedDate: '2026-06-19',
    internalMeetingDate: '2026-06-19T09:30',
    externalMeetingDate: '2026-06-19T11:00',
  },
  act_amazon: {
    rateAgreement: 'Tariff',
    fuelAgreement: true,
    accessorialAgreement: true,
    completedBy: 'Demo Pricing Specialist',
    completedDate: '2026-06-19',
    internalMeetingDate: '2026-06-19T09:30',
    externalMeetingDate: '2026-06-19T11:00',
  },
};

function demoChecklistState(account: Account): ChecklistState {
  return buildDefaultChecklist({ account, ...(DEMO_CHECKLIST_OVERRIDES[account.id] || {}) });
}

export const INITIAL_ACCOUNTS: Account[] = DEMO_ACCOUNTS.map((account) => ({
  ...account,
  checklistState: demoChecklistState(account),
}));


export const INITIAL_CONTACTS: Contact[] = [
  // Chalas Supply
  {
    id: 'con_1',
    accountId: 'act_1',
    name: 'Cindy Myers',
    email: 'cindy.m@chalassupply.com',
    phone: '(602) 555-0144',
    role: 'Billing',
    notes: 'Handles invoicing approvals. Prefers emails aggregated weekly.'
  },
  {
    id: 'con_2',
    accountId: 'act_1',
    name: 'Marcus Vance',
    email: 'marcus.vance@chalassupply.com',
    phone: '(602) 555-0199',
    role: 'After-hours/Escalation',
    notes: 'Text his cell for active gate delays or container holds.'
  },
  {
    id: 'con_3',
    accountId: 'act_1',
    name: 'Javier Gomez',
    email: 'j.gomez@chalaswarehousing.com',
    phone: '(623) 555-4848',
    role: 'Warehouse/Receiving',
    notes: 'Warehouse Receiving Lead. Strictly rejects containers arriving after 7:15 AM.'
  },

  // Al's Plastics
  {
    id: 'con_4',
    accountId: 'act_2',
    name: 'Bill Henderson',
    email: 'b.henderson@alsplastics.com',
    phone: '(510) 555-4521',
    role: 'Operations',
    notes: 'Primary dispatch communicator. Quick responder.'
  },
  {
    id: 'con_5',
    accountId: 'act_2',
    name: 'Fabian Cruz',
    email: 'fcruz@alsplastics.com',
    phone: '(510) 555-4522',
    role: 'Operations',
    notes: 'Night ops receiver planner. Handles afternoon spot containers.'
  },
  {
    id: 'con_6',
    accountId: 'act_2',
    name: 'Alex Mendrin',
    email: 'alex.mendrin@alsplastics.com',
    phone: '(510) 555-0102',
    role: 'Claims/Dispute Resolution',
    notes: 'Corporate logistics general manager. Contact if chassis splits or billing dispute arises.'
  },

  // Pacific Fresh
  {
    id: 'con_7',
    accountId: 'act_3',
    name: 'Dan Ross',
    email: 'dan@pacificfreshgrowers.com',
    phone: '(805) 555-0122',
    role: 'Operations',
    notes: 'Logistics coordinator for cold-storage warehousing.'
  },

  // Apex Chemical
  {
    id: 'con_8',
    accountId: 'act_4',
    name: 'Dr. Laura Finch',
    email: 'l.finch@apexchem.com',
    phone: '(713) 555-9081',
    role: 'Operations',
    notes: 'Dangerous Goods officer. Inspects safety parameters post-transport.'
  },
  {
    id: 'con_9',
    accountId: 'act_4',
    name: 'Hazmat Escalation Emergency',
    email: 'safety@apexchemsafety.com',
    phone: '(800) 555-1212',
    role: 'After-hours/Escalation',
    notes: '24/7 hotline to trigger standard Chemtrec responses.'
  },

  // Tri-State Group
  {
    id: 'con_10',
    accountId: 'act_5',
    name: 'Raymond Wu',
    email: 'rwu@tristateimports.com',
    phone: '(201) 555-6677',
    role: 'Billing',
    notes: 'Standard accounts payable manager.'
  }
];

export const INITIAL_LANES: Lane[] = [
  // Chalas Supply Lanes
  {
    id: 'lane_1',
    accountId: 'act_1',
    originCity: 'Los Angeles Port / LB',
    originState: 'CA',
    destCity: 'Phoenix',
    destState: 'AZ',
    miles: 375,
    movementType: 'Import',
    equipmentSize: "40'HC",
    linehaulRate: 1700,
    billingType: 'Base + Fuel',
    carrierTargetPay: 1350,
    effectiveDate: '2026-01-01',
    terminationDate: '2026-12-31',
    reviewDate: '2026-10-01'
  },
  {
    id: 'lane_2',
    accountId: 'act_1',
    originCity: 'Los Angeles Port / LB',
    originState: 'CA',
    destCity: 'Las Vegas',
    destState: 'NV',
    miles: 270,
    movementType: 'Import',
    equipmentSize: "40'HC",
    linehaulRate: 1350,
    billingType: 'Base + Fuel',
    carrierTargetPay: 1050,
    effectiveDate: '2026-01-01',
    terminationDate: '2026-12-31',
    reviewDate: '2026-10-01'
  },
  {
    id: 'lane_3',
    accountId: 'act_1',
    originCity: 'Los Angeles Port / LB',
    originState: 'CA',
    destCity: 'Salt Lake City',
    destState: 'UT',
    miles: 690,
    movementType: 'Import',
    equipmentSize: "20'",
    linehaulRate: 2800,
    billingType: 'All-in',
    carrierTargetPay: 2200,
    effectiveDate: '2026-02-15',
    terminationDate: '2026-12-31',
    reviewDate: '2026-11-15'
  },

  // Al's Plastics Lanes
  {
    id: 'lane_4',
    accountId: 'act_2',
    originCity: 'Oakland Port',
    originState: 'CA',
    destCity: 'Tracy',
    destState: 'CA',
    miles: 65,
    movementType: 'Import',
    equipmentSize: "20'",
    linehaulRate: 650,
    billingType: 'All-in',
    carrierTargetPay: 480,
    effectiveDate: '2026-03-01',
    terminationDate: '2027-03-01',
    reviewDate: '2027-01-15'
  },
  {
    id: 'lane_5',
    accountId: 'act_2',
    originCity: 'Oakland Port',
    originState: 'CA',
    destCity: 'Fresno',
    destState: 'CA',
    miles: 160,
    movementType: 'Export',
    equipmentSize: "40'",
    linehaulRate: 980,
    billingType: 'Base + Fuel',
    carrierTargetPay: 780,
    effectiveDate: '2026-03-01',
    terminationDate: '2027-03-01',
    reviewDate: '2027-01-15'
  },
  {
    id: 'lane_6',
    accountId: 'act_2',
    originCity: 'Oakland Port',
    originState: 'CA',
    destCity: 'Phoenix',
    destState: 'AZ',
    miles: 752,
    movementType: 'Import',
    equipmentSize: "40\'HC",
    linehaulRate: 2150,
    billingType: 'All-in',
    carrierTargetPay: 1700,
    effectiveDate: '2026-04-10',
    terminationDate: '2027-04-10',
    reviewDate: '2027-02-10'
  },

  // Pacific Fresh Lanes
  {
    id: 'lane_7',
    accountId: 'act_3',
    originCity: 'Port of Hueneme',
    originState: 'CA',
    destCity: 'Oxnard',
    destState: 'CA',
    miles: 15,
    movementType: 'Import',
    equipmentSize: "40\'HC",
    linehaulRate: 420,
    billingType: 'All-in',
    carrierTargetPay: 310,
    effectiveDate: '2026-06-12',
    terminationDate: '2026-12-31',
    reviewDate: '2026-11-01'
  },

  // Apex Chemical Lanes
  {
    id: 'lane_8',
    accountId: 'act_4',
    originCity: 'Port of Barbours Cut (Houston)',
    originState: 'TX',
    destCity: 'Dallas',
    destState: 'TX',
    miles: 245,
    movementType: 'Import',
    equipmentSize: "20'",
    linehaulRate: 1250,
    billingType: 'Base + Fuel',
    carrierTargetPay: 950,
    effectiveDate: '2026-06-05',
    terminationDate: '2027-06-05',
    reviewDate: '2027-04-01'
  },

  // Tri-State Lanes
  {
    id: 'lane_9',
    accountId: 'act_5',
    originCity: 'Port of Newark',
    originState: 'NJ',
    destCity: 'Allentown',
    destState: 'PA',
    miles: 92,
    movementType: 'Import',
    equipmentSize: "40\'HC",
    linehaulRate: 780,
    billingType: 'All-in',
    carrierTargetPay: 575,
    effectiveDate: '2026-06-14',
    terminationDate: '2026-12-31',
    reviewDate: '2026-10-15'
  },
  
  // ==========================================
  // DISTORTED AMAZON LOGISTICS, INC. LANES
  // (Pseudo-random offsets applied to real tariff rates for prototype safety)
  // ==========================================
  {
    id: 'lane_am_1',
    accountId: 'act_amazon',
    originCity: 'BALTIMORE',
    originState: 'MD',
    destCity: 'GREENCASTLE',
    destState: 'PA',
    miles: 114,
    movementType: 'Import',
    equipmentSize: "40'HC",
    linehaulRate: 595, // real: 575
    billingType: 'Base + Fuel',
    carrierTargetPay: 485,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  },
  {
    id: 'lane_am_2',
    accountId: 'act_amazon',
    originCity: 'BALTIMORE',
    originState: 'MD',
    destCity: 'HAGERSTOWN',
    destState: 'MD',
    miles: 76,
    movementType: 'Import',
    equipmentSize: "40'HC",
    linehaulRate: 520, // real: 500
    billingType: 'Base + Fuel',
    carrierTargetPay: 410,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  },
  {
    id: 'lane_am_3',
    accountId: 'act_amazon',
    originCity: 'BALTIMORE',
    originState: 'MD',
    destCity: 'CLEAR BROOK',
    destState: 'VA',
    miles: 98,
    movementType: 'Import',
    equipmentSize: "40\'HC",
    linehaulRate: 670, // real: 650
    billingType: 'Base + Fuel',
    carrierTargetPay: 545,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  },
  {
    id: 'lane_am_4',
    accountId: 'act_amazon',
    originCity: 'BALTIMORE',
    originState: 'MD',
    destCity: 'CARLISLE',
    destState: 'PA',
    miles: 106,
    movementType: 'Import',
    equipmentSize: "40\'HC",
    linehaulRate: 630, // real: 600
    billingType: 'Base + Fuel',
    carrierTargetPay: 520,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  },
  {
    id: 'lane_am_5',
    accountId: 'act_amazon',
    originCity: 'BALTIMORE',
    originState: 'MD',
    destCity: 'MIDDLETOWN (HIA1)',
    destState: 'PA',
    miles: 98,
    movementType: 'Import',
    equipmentSize: "40\'",
    linehaulRate: 625, // real: 600
    billingType: 'Base + Fuel',
    carrierTargetPay: 505,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  },
  {
    id: 'lane_am_6',
    accountId: 'act_amazon',
    originCity: 'BALTIMORE',
    originState: 'MD',
    destCity: 'MIDDLETOWN (MDT1)',
    destState: 'PA',
    miles: 98,
    movementType: 'Import',
    equipmentSize: "40\'HC",
    linehaulRate: 675, // real: 650
    billingType: 'Base + Fuel',
    carrierTargetPay: 555,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  },
  {
    id: 'lane_am_7',
    accountId: 'act_amazon',
    originCity: 'BALTIMORE',
    originState: 'MD',
    destCity: 'NORTH EAST',
    destState: 'MD',
    miles: 52,
    movementType: 'Import',
    equipmentSize: "40\'HC",
    linehaulRate: 465, // real: 450
    billingType: 'Base + Fuel',
    carrierTargetPay: 380,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  },
  {
    id: 'lane_am_8',
    accountId: 'act_amazon',
    originCity: 'BALTIMORE',
    originState: 'MD',
    destCity: 'PENNS GROVE',
    destState: 'NJ',
    miles: 82,
    movementType: 'Import',
    equipmentSize: "40\'",
    linehaulRate: 570, // real: 550
    billingType: 'Base + Fuel',
    carrierTargetPay: 460,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  },
  {
    id: 'lane_am_9',
    accountId: 'act_amazon',
    originCity: 'BALTIMORE',
    originState: 'MD',
    destCity: 'FREDERICKSBURG',
    destState: 'VA',
    miles: 92,
    movementType: 'Import',
    equipmentSize: "40\'HC",
    linehaulRate: 590, // real: 575
    billingType: 'Base + Fuel',
    carrierTargetPay: 475,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  },
  {
    id: 'lane_am_10',
    accountId: 'act_amazon',
    originCity: 'LA/LB',
    originState: 'CA',
    destCity: 'HAWTHORNE',
    destState: 'CA',
    miles: 25,
    movementType: 'Import',
    equipmentSize: "40\'HC",
    linehaulRate: 465, // real: 450
    billingType: 'Base + Fuel',
    carrierTargetPay: 385,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  },
  {
    id: 'lane_am_11',
    accountId: 'act_amazon',
    originCity: 'LA/LB',
    originState: 'CA',
    destCity: 'HESPERIA',
    destState: 'CA',
    miles: 85,
    movementType: 'Import',
    equipmentSize: "40\'HC",
    linehaulRate: 575, // real: 550
    billingType: 'Base + Fuel',
    carrierTargetPay: 460,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  },
  {
    id: 'lane_am_12',
    accountId: 'act_amazon',
    originCity: 'LA/LB',
    originState: 'CA',
    destCity: 'JURUPA VALLEY (POC3)',
    destState: 'CA',
    miles: 55,
    movementType: 'Import',
    equipmentSize: "40\'HC",
    linehaulRate: 440, // real: 420
    billingType: 'Base + Fuel',
    carrierTargetPay: 350,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  },
  {
    id: 'lane_am_13',
    accountId: 'act_amazon',
    originCity: 'LA/LB',
    originState: 'CA',
    destCity: 'PERRIS',
    destState: 'CA',
    miles: 72,
    movementType: 'Import',
    equipmentSize: "40\'HC",
    linehaulRate: 635, // real: 600
    billingType: 'Base + Fuel',
    carrierTargetPay: 515,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  },
  {
    id: 'lane_am_14',
    accountId: 'act_amazon',
    originCity: 'LA/LB',
    originState: 'CA',
    destCity: 'BUCKEYE (GEU3)',
    destState: 'AZ',
    miles: 340,
    movementType: 'Import',
    equipmentSize: "40\'HC",
    linehaulRate: 1640, // real: 1600
    billingType: 'Base + Fuel',
    carrierTargetPay: 1320,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  },
  {
    id: 'lane_am_15',
    accountId: 'act_amazon',
    originCity: 'LA/LB',
    originState: 'CA',
    destCity: 'ONTARIO (ONT8)',
    destState: 'CA',
    miles: 52,
    movementType: 'Import',
    equipmentSize: "40\'",
    linehaulRate: 520, // real: 500
    billingType: 'Base + Fuel',
    carrierTargetPay: 415,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  },
  {
    id: 'lane_am_16',
    accountId: 'act_amazon',
    originCity: 'LA/LB',
    originState: 'CA',
    destCity: 'LAS VEGAS (LAS1)',
    destState: 'NV',
    miles: 285,
    movementType: 'Import',
    equipmentSize: "40\'HC",
    linehaulRate: 1380, // real: 1330
    billingType: 'Base + Fuel',
    carrierTargetPay: 1120,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  },
  {
    id: 'lane_am_17',
    accountId: 'act_amazon',
    originCity: 'LA/LB',
    originState: 'CA',
    destCity: 'BEAUMONT',
    destState: 'CA',
    miles: 80,
    movementType: 'Import',
    equipmentSize: "40\'HC",
    linehaulRate: 505, // real: 480
    billingType: 'Base + Fuel',
    carrierTargetPay: 410,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  },
  {
    id: 'lane_am_18',
    accountId: 'act_amazon',
    originCity: 'LA/LB',
    originState: 'CA',
    destCity: 'EASTVALE (XLA4)',
    destState: 'CA',
    miles: 48,
    movementType: 'Import',
    equipmentSize: "20\'",
    linehaulRate: 300, // real: 285
    billingType: 'Base + Fuel',
    carrierTargetPay: 230,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  },
  {
    id: 'lane_am_19',
    accountId: 'act_amazon',
    originCity: 'LA/LB',
    originState: 'CA',
    destCity: 'FONTANA (POC1)',
    destState: 'CA',
    miles: 55,
    movementType: 'Import',
    equipmentSize: "40\'HC",
    linehaulRate: 460, // real: 440
    billingType: 'Base + Fuel',
    carrierTargetPay: 370,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  },
  {
    id: 'lane_am_20',
    accountId: 'act_amazon',
    originCity: 'LA/LB',
    originState: 'CA',
    destCity: 'GOODYEAR (GEU5)',
    destState: 'AZ',
    miles: 335,
    movementType: 'Import',
    equipmentSize: "40\'HC",
    linehaulRate: 1650, // real: 1600
    billingType: 'Base + Fuel',
    carrierTargetPay: 1335,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  },
  {
    id: 'lane_am_21',
    accountId: 'act_amazon',
    originCity: 'LA/LB',
    originState: 'CA',
    destCity: 'GOODYEAR (GYR2)',
    destState: 'AZ',
    miles: 335,
    movementType: 'Import',
    equipmentSize: "40\'HC",
    linehaulRate: 1425, // real: 1385
    billingType: 'Base + Fuel',
    carrierTargetPay: 1145,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  },
  {
    id: 'lane_am_22',
    accountId: 'act_amazon',
    originCity: 'LA/LB',
    originState: 'CA',
    destCity: 'ONTARIO (POC2)',
    destState: 'CA',
    miles: 52,
    movementType: 'Import',
    equipmentSize: "40\'HC",
    linehaulRate: 510, // real: 480
    billingType: 'Base + Fuel',
    carrierTargetPay: 410,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  },
  {
    id: 'lane_am_23',
    accountId: 'act_amazon',
    originCity: 'LA/LB',
    originState: 'CA',
    destCity: 'PALM SPRINGS (PSP3)',
    destState: 'CA',
    miles: 112,
    movementType: 'Import',
    equipmentSize: "40\'HC",
    linehaulRate: 715, // real: 690
    billingType: 'Base + Fuel',
    carrierTargetPay: 575,
    effectiveDate: '2025-06-01',
    terminationDate: '2026-06-30',
    reviewDate: '2026-04-30'
  }
];

export const INITIAL_ACCESSORIALS: AccessorialSOP[] = [
  // Chalas Supply
  {
    id: 'acc_1',
    accountId: 'act_1',
    chassisFee: 45,
    prePullFee: 100,
    storageFee: 150,
    emptyStorageFee: 120,
    detentionRate: 80,
    detentionFreeTime: 2,
    chassisSplitFee: 75,
    cleanTruckFee: 50,
    appointmentType: 'Live Unload',
    requiredStatusUpdates: ['LFD', 'Container Outgate', 'In Transit', 'On Site', 'POD Sent', 'Empty Return'],
    hasYardHostler: false,
    peelPilesPermitted: false,
    privateChassisPermitted: false,
    freeTimeDays: 4,
    deliveryRules: 'Live unloading must be completed in under 2 hours. If delays are met, capture photos showing queue at warehouse doors. Always secure early morning carrier confirmation.'
  },
  // Al's Plastics
  {
    id: 'acc_2',
    accountId: 'act_2',
    chassisFee: 25,
    prePullFee: 80,
    storageFee: 120,
    emptyStorageFee: 95,
    detentionRate: 85,
    detentionFreeTime: 2,
    chassisSplitFee: 60,
    cleanTruckFee: 0,
    appointmentType: 'Drop and Hook',
    requiredStatusUpdates: ['Container Outgate', 'In Transit', 'On Site', 'Empty Return'],
    hasYardHostler: true,
    peelPilesPermitted: true,
    privateChassisPermitted: true,
    freeTimeDays: 7,
    deliveryRules: 'Drop loaded container in Row C, retrieve empty in Row X. Yard hostler is on sight 24/7. High weight risk - make sure to inspect gross vehicle weights at exit scale.'
  },
  // Pacific Fresh
  {
    id: 'acc_3',
    accountId: 'act_3',
    chassisFee: 35,
    prePullFee: 75,
    storageFee: 140,
    emptyStorageFee: 110,
    detentionRate: 90,
    detentionFreeTime: 2,
    chassisSplitFee: 50,
    cleanTruckFee: 75,
    appointmentType: 'Live Unload',
    requiredStatusUpdates: ['LFD', 'In Transit', 'On Site', 'POD Sent'],
    hasYardHostler: false,
    peelPilesPermitted: false,
    privateChassisPermitted: false,
    freeTimeDays: 3,
    deliveryRules: 'Direct delivery only. In-transit reefer checks are mandatory. POD must have clear temperature readings noted and signed by receiver.'
  },
  // Apex Chemical
  {
    id: 'acc_4',
    accountId: 'act_4',
    chassisFee: 30,
    prePullFee: 90,
    storageFee: 130,
    emptyStorageFee: 100,
    detentionRate: 95,
    detentionFreeTime: 2,
    chassisSplitFee: 80,
    cleanTruckFee: 150,
    appointmentType: 'Live Unload',
    requiredStatusUpdates: ['LFD', 'Container Outgate', 'In Transit', 'On Site', 'POD Sent', 'Empty Return'],
    hasYardHostler: false,
    peelPilesPermitted: false,
    privateChassisPermitted: true,
    freeTimeDays: 5,
    deliveryRules: 'Verify hazmat placards are attached prior to departure. Clean-truck compliance mandatory. Drivers must wear complete OSHA chemical-plant PPE during unloading.'
  },
  // Tri-State
  {
    id: 'acc_5',
    accountId: 'act_5',
    chassisFee: 28,
    prePullFee: 85,
    storageFee: 110,
    emptyStorageFee: 90,
    detentionRate: 75,
    detentionFreeTime: 2,
    chassisSplitFee: 55,
    cleanTruckFee: 0,
    appointmentType: 'Drop and Hook',
    requiredStatusUpdates: ['Container Outgate', 'In Transit', 'On Site', 'Empty Return'],
    hasYardHostler: true,
    peelPilesPermitted: true,
    privateChassisPermitted: false,
    freeTimeDays: 6,
    deliveryRules: 'No appointments needed for drop-offs but container must be logged with gate watchman within 30 minutes of entry.'
  },
  // Amazon Logistics, Inc.
  {
    id: 'acc_amazon',
    accountId: 'act_amazon',
    chassisFee: 32, // standard $32/day, as in screenshot
    prePullFee: 94, // standard $94, as in screenshot
    storageFee: 32, // standard $32/day, as in screenshot
    emptyStorageFee: 32,
    detentionRate: 80, // standard $80/hr, as in screenshot
    detentionFreeTime: 2,
    chassisSplitFee: 91, // standard $91, as in screenshot
    cleanTruckFee: 50,
    appointmentType: 'Drop and Hook',
    requiredStatusUpdates: ['Container Outgate', 'In Transit', 'On Site', 'POD Sent'],
    hasYardHostler: true,
    peelPilesPermitted: true,
    privateChassisPermitted: true,
    freeTimeDays: 4,
    deliveryRules: 'Amazon fulfillment center drop and hook flow. Ensure outgate and ingate receipts are logged via portal. Pre-Pull and chassis splits are pre-authorized for port drayage.'
  }
];
