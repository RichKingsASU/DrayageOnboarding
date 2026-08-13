import json
import logging
from django.core.management.base import BaseCommand
from django.db import transaction
from ondray.models import Account, ChecklistState, CustomerAlert, OnboardingDocument, Contact, Lane, AccessorialSOP

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Migrate legacy OnDray data to Django domain models'

    def add_arguments(self, parser):
        parser.add_argument('--source', type=str, required=True, help='Path to the JSON fixture')
        parser.add_argument('--dry-run', action='store_true', help='Perform migration without saving to database')

    def handle(self, *args, **options):
        source_path = options['source']
        dry_run = options['dry_run']
        
        self.stdout.write(f"Starting migration from {source_path} (dry_run={dry_run})")
        
        try:
            with open(source_path, 'r') as f:
                data = json.load(f)
        except Exception as e:
            self.stderr.write(f"Error reading source file: {e}")
            return
            
        stats = {
            'source_records': len(data.get('accounts', [])) + len(data.get('contacts', [])) + len(data.get('lanes', [])) + len(data.get('sops', [])),
            'eligible': 0,
            'migrated': 0,
            'existing': 0,
            'rejected': 0,
            'unresolved': 0,
        }
        
        with transaction.atomic():
            self._migrate_accounts(data.get('accounts', []), stats)
            self._migrate_contacts(data.get('contacts', []), stats)
            self._migrate_lanes(data.get('lanes', []), stats)
            self._migrate_sops(data.get('sops', []), stats)
            
            if dry_run:
                self.stdout.write(self.style.WARNING("DRY RUN: Rolling back transaction."))
                transaction.set_rollback(True)
                
        self._print_report(stats)
        
    def _migrate_accounts(self, accounts_data, stats):
        for acc_data in accounts_data:
            stats['eligible'] += 1
            legacy_id = acc_data.get('id')
            if not legacy_id:
                stats['rejected'] += 1
                continue
                
            if Account.objects.filter(legacy_record_id=legacy_id).exists():
                stats['existing'] += 1
                continue
                
            try:
                acc = Account(
                    legacy_record_id=legacy_id,
                    migration_source='supabase',
                    migration_version='ondray-supabase-export-v1',
                    name=acc_data.get('name', ''),
                    bill_to_code=acc_data.get('billToCode', ''),
                    credit_terms=acc_data.get('creditTerms', ''),
                    invoice_docs_required=acc_data.get('invoiceDocsRequired', []),
                    accept_sequence_bills=acc_data.get('acceptSequenceBills', False),
                    commodity=acc_data.get('commodity', ''),
                    equipment_type=acc_data.get('equipmentType', ''),
                    load_type=acc_data.get('loadType', ''),
                    expected_weight=acc_data.get('expectedWeight', ''),
                    is_bonded=acc_data.get('isBonded', False),
                    hazmat_class=acc_data.get('hazmatClass', ''),
                    cargo_value=acc_data.get('cargoValue') or None,
                    pref_comm_method=acc_data.get('prefCommMethod', ''),
                    needs_api_edi=acc_data.get('needsApiEdi', False),
                    stage=acc_data.get('stage', Account.PipelineStage.CUSTOMER_INQUIRY),
                )
                acc.save()
                stats['migrated'] += 1
                
                # Migrate embedded objects
                for alert_data in acc_data.get('alerts', []):
                    CustomerAlert.objects.create(
                        account=acc,
                        legacy_record_id=alert_data.get('id'),
                        type=alert_data.get('type'),
                        message=alert_data.get('message')
                    )
                
                for doc_data in acc_data.get('documents', []):
                    OnboardingDocument.objects.create(
                        account=acc,
                        legacy_record_id=doc_data.get('id'),
                        name=doc_data.get('name'),
                        type=doc_data.get('type'),
                        uploaded_at=doc_data.get('uploadedAt', ''),
                        size=doc_data.get('size', '')
                    )
                    
                checklist_data = acc_data.get('checklistState', {})
                if checklist_data:
                    ChecklistState.objects.create(
                        account=acc,
                        credit_app=checklist_data.get('creditApp', False),
                        db=checklist_data.get('db', False),
                        contract=checklist_data.get('contract', False),
                        rate_agreement=checklist_data.get('rateAgreement', ''),
                        fuel_agreement=checklist_data.get('fuelAgreement', False),
                        accessorial_agreement=checklist_data.get('accessorialAgreement', False),
                        folder_created=checklist_data.get('folderCreated', False),
                        files_uploaded=checklist_data.get('filesUploaded', False),
                        internal_meeting_date=checklist_data.get('internalMeetingDate', ''),
                        external_meeting_date=checklist_data.get('externalMeetingDate', ''),
                        summary_email_sent=checklist_data.get('summaryEmailSent', False),
                        audit_completed=checklist_data.get('auditCompleted', False),
                        work_order_received=checklist_data.get('workOrderReceived', False),
                        onboarding_call_completed=checklist_data.get('onboardingCallCompleted', False),
                        notes=checklist_data.get('notes', ''),
                        completed_by=checklist_data.get('completedBy', ''),
                        completed_date=checklist_data.get('completedDate', '')
                    )
            except Exception as e:
                self.stderr.write(f"Error migrating account {legacy_id}: {e}")
                stats['rejected'] += 1

    def _migrate_contacts(self, contacts_data, stats):
        for contact_data in contacts_data:
            stats['eligible'] += 1
            legacy_id = contact_data.get('id')
            account_legacy_id = contact_data.get('accountId')
            
            if not legacy_id:
                stats['rejected'] += 1
                continue
                
            if Contact.objects.filter(legacy_record_id=legacy_id).exists():
                stats['existing'] += 1
                continue
                
            account = Account.objects.filter(legacy_record_id=account_legacy_id).first()
            if not account:
                stats['unresolved'] += 1
                continue
                
            try:
                Contact.objects.create(
                    account=account,
                    legacy_record_id=legacy_id,
                    name=contact_data.get('name', ''),
                    title=contact_data.get('title', ''),
                    email=contact_data.get('email', ''),
                    phone=contact_data.get('phone', ''),
                    role=contact_data.get('role', ''),
                    notes=contact_data.get('notes', '')
                )
                stats['migrated'] += 1
            except Exception as e:
                self.stderr.write(f"Error migrating contact {legacy_id}: {e}")
                stats['rejected'] += 1

    def _migrate_lanes(self, lanes_data, stats):
        for lane_data in lanes_data:
            stats['eligible'] += 1
            legacy_id = lane_data.get('id')
            account_legacy_id = lane_data.get('accountId')
            
            if not legacy_id:
                stats['rejected'] += 1
                continue
                
            if Lane.objects.filter(legacy_record_id=legacy_id).exists():
                stats['existing'] += 1
                continue
                
            account = Account.objects.filter(legacy_record_id=account_legacy_id).first()
            if not account:
                stats['unresolved'] += 1
                continue
                
            try:
                Lane.objects.create(
                    account=account,
                    legacy_record_id=legacy_id,
                    origin_city=lane_data.get('originCity', ''),
                    origin_state=lane_data.get('originState', ''),
                    dest_city=lane_data.get('destCity', ''),
                    dest_state=lane_data.get('destState', ''),
                    miles=lane_data.get('miles', 0),
                    movement_type=lane_data.get('movementType', ''),
                    equipment_size=lane_data.get('equipmentSize', ''),
                    linehaul_rate=lane_data.get('linehaulRate', 0),
                    billing_type=lane_data.get('billingType', ''),
                    carrier_target_pay=lane_data.get('carrierTargetPay', 0),
                    effective_date=lane_data.get('effectiveDate', ''),
                    termination_date=lane_data.get('terminationDate', ''),
                    review_date=lane_data.get('reviewDate', '')
                )
                stats['migrated'] += 1
            except Exception as e:
                self.stderr.write(f"Error migrating lane {legacy_id}: {e}")
                stats['rejected'] += 1
                
    def _migrate_sops(self, sops_data, stats):
        for sop_data in sops_data:
            stats['eligible'] += 1
            legacy_id = sop_data.get('id')
            account_legacy_id = sop_data.get('accountId')
            
            if not legacy_id:
                stats['rejected'] += 1
                continue
                
            if AccessorialSOP.objects.filter(legacy_record_id=legacy_id).exists():
                stats['existing'] += 1
                continue
                
            account = Account.objects.filter(legacy_record_id=account_legacy_id).first()
            if not account:
                stats['unresolved'] += 1
                continue
                
            try:
                AccessorialSOP.objects.create(
                    account=account,
                    legacy_record_id=legacy_id,
                    chassis_fee=sop_data.get('chassisFee', 0),
                    pre_pull_fee=sop_data.get('prePullFee', 0),
                    storage_fee=sop_data.get('storageFee', 0),
                    empty_storage_fee=sop_data.get('emptyStorageFee', 0),
                    detention_rate=sop_data.get('detentionRate', 0),
                    detention_free_time=sop_data.get('detentionFreeTime', 0),
                    chassis_split_fee=sop_data.get('chassisSplitFee', 0),
                    clean_truck_fee=sop_data.get('cleanTruckFee', 0),
                    appointment_type=sop_data.get('appointmentType', ''),
                    required_status_updates=sop_data.get('requiredStatusUpdates', []),
                    has_yard_hostler=sop_data.get('hasYardHostler', False),
                    peel_piles_permitted=sop_data.get('peelPilesPermitted', False),
                    private_chassis_permitted=sop_data.get('privateChassisPermitted', False),
                    free_time_days=sop_data.get('freeTimeDays', 0),
                    delivery_rules=sop_data.get('deliveryRules', '')
                )
                stats['migrated'] += 1
            except Exception as e:
                self.stderr.write(f"Error migrating sop {legacy_id}: {e}")
                stats['rejected'] += 1

    def _print_report(self, stats):
        self.stdout.write("\n=== RECONCILIATION REPORT ===")
        self.stdout.write(f"Source records: {stats['source_records']}")
        self.stdout.write(f"Eligible: {stats['eligible']}")
        self.stdout.write(f"Migrated: {stats['migrated']}")
        self.stdout.write(f"Existing: {stats['existing']}")
        self.stdout.write(f"Rejected: {stats['rejected']}")
        self.stdout.write(f"Unresolved: {stats['unresolved']}")
        self.stdout.write("==============================\n")
