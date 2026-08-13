from django.db import models
import uuid

class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class LegacyMigrationModel(models.Model):
    legacy_record_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    migration_source = models.CharField(max_length=255, null=True, blank=True)
    migration_version = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        abstract = True

class Account(TimestampedModel, LegacyMigrationModel):
    class CreditTerms(models.TextChoices):
        PREPAID = 'Prepaid', 'Prepaid'
        NET_15 = 'Net 15', 'Net 15'
        NET_30 = 'Net 30', 'Net 30'
        SPECIAL_NET_45 = 'Special (Net 45)', 'Special (Net 45)'
        SPECIAL_NET_60 = 'Special (Net 60)', 'Special (Net 60)'
        NONE = '', 'None'
    
    class EquipmentType(models.TextChoices):
        DRY = 'Dry', 'Dry'
        REEFER = 'Reefer', 'Reefer'
        NONE = '', 'None'

    class LoadType(models.TextChoices):
        PALLETIZED = 'Palletized', 'Palletized'
        FLOOR_LOADED = 'Floor Loaded', 'Floor Loaded'
        BOTH = 'Both', 'Both'
        NONE = '', 'None'

    class PreferredComm(models.TextChoices):
        EMAIL = 'Email', 'Email'
        PHONE = 'Phone', 'Phone'
        SMS = 'SMS', 'SMS'
        EDI = 'EDI', 'EDI'
        CUSTOMER_PORTAL = 'Customer Portal', 'Customer Portal'
        NONE = '', 'None'

    class PipelineStage(models.TextChoices):
        CUSTOMER_INQUIRY = 'CustomerInquiry', 'CustomerInquiry'
        AGREEMENT = 'Agreement', 'Agreement'
        ACCOUNT_SETUP = 'AccountSetup', 'AccountSetup'
        OPERATIONAL_KICKOFF = 'OperationalKickoff', 'OperationalKickoff'
        ONGOING_SUPPORT = 'OngoingSupport', 'OngoingSupport'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    bill_to_code = models.CharField(max_length=100, blank=True)
    credit_terms = models.CharField(max_length=50, choices=CreditTerms.choices, blank=True)
    
    # Needs to store strings like ['Signed POD', 'Interchange Outgate Receipt']
    invoice_docs_required = models.JSONField(default=list, blank=True)
    accept_sequence_bills = models.BooleanField(default=False)
    
    commodity = models.CharField(max_length=255, blank=True)
    equipment_type = models.CharField(max_length=50, choices=EquipmentType.choices, blank=True)
    load_type = models.CharField(max_length=50, choices=LoadType.choices, blank=True)
    expected_weight = models.CharField(max_length=100, blank=True)
    is_bonded = models.BooleanField(default=False)
    hazmat_class = models.CharField(max_length=100, blank=True)
    cargo_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    pref_comm_method = models.CharField(max_length=50, choices=PreferredComm.choices, blank=True)
    needs_api_edi = models.BooleanField(default=False)
    stage = models.CharField(max_length=50, choices=PipelineStage.choices, default=PipelineStage.CUSTOMER_INQUIRY)
    
    bill_to_code_created = models.BooleanField(default=False)
    audit_checklist_completed = models.BooleanField(default=False)
    is_new_prospect = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class ChecklistState(TimestampedModel, LegacyMigrationModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.OneToOneField(Account, on_delete=models.CASCADE, related_name='checklist_state')
    
    credit_app = models.BooleanField(default=False)
    db = models.BooleanField(default=False)
    contract = models.BooleanField(default=False)
    rate_agreement = models.CharField(max_length=100, blank=True)
    fuel_agreement = models.BooleanField(default=False)
    accessorial_agreement = models.BooleanField(default=False)
    folder_created = models.BooleanField(default=False)
    files_uploaded = models.BooleanField(default=False)
    
    internal_meeting_date = models.CharField(max_length=100, blank=True)
    external_meeting_date = models.CharField(max_length=100, blank=True)
    
    summary_email_sent = models.BooleanField(default=False)
    audit_completed = models.BooleanField(default=False)
    work_order_received = models.BooleanField(default=False)
    onboarding_call_completed = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    completed_by = models.CharField(max_length=100, blank=True)
    completed_date = models.CharField(max_length=100, blank=True)

class CustomerAlert(TimestampedModel, LegacyMigrationModel):
    class AlertType(models.TextChoices):
        DANGER = 'danger', 'danger'
        WARNING = 'warning', 'warning'
        INFO = 'info', 'info'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='alerts')
    type = models.CharField(max_length=20, choices=AlertType.choices)
    message = models.TextField()

class OnboardingDocument(TimestampedModel, LegacyMigrationModel):
    class DocumentType(models.TextChoices):
        CREDIT_APP = 'Credit Application', 'Credit Application'
        LIABILITY_AGREEMENT = 'Liability Agreement', 'Liability Agreement'
        SOP_DOCUMENT = 'SOP Document', 'SOP Document'
        OTHER = 'Other', 'Other'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='documents')
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=DocumentType.choices)
    uploaded_at = models.CharField(max_length=50, blank=True)
    size = models.CharField(max_length=50, blank=True)
    content_key = models.CharField(max_length=255, null=True, blank=True)
    storage_path = models.CharField(max_length=255, null=True, blank=True)
    uploaded_by = models.CharField(max_length=255, null=True, blank=True)
    checklist_item_key = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    checksum = models.CharField(max_length=64, null=True, blank=True)

class Contact(TimestampedModel, LegacyMigrationModel):
    class ContactRole(models.TextChoices):
        OPERATIONS = 'Operations', 'Operations'
        AFTER_HOURS = 'After-hours/Escalation', 'After-hours/Escalation'
        BILLING = 'Billing', 'Billing'
        WAREHOUSE = 'Warehouse/Receiving', 'Warehouse/Receiving'
        CLAIMS = 'Claims/Dispute Resolution', 'Claims/Dispute Resolution'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='contacts')
    name = models.CharField(max_length=255)
    title = models.CharField(max_length=100, null=True, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    role = models.CharField(max_length=50, choices=ContactRole.choices)
    notes = models.TextField(null=True, blank=True)

class Lane(TimestampedModel, LegacyMigrationModel):
    class MovementType(models.TextChoices):
        IMPORT = 'Import', 'Import'
        EXPORT = 'Export', 'Export'
        STREET_TURN = 'Street Turn', 'Street Turn'

    class EquipmentSize(models.TextChoices):
        SIZE_20 = "20'", "20'"
        SIZE_40 = "40'", "40'"
        SIZE_40HC = "40'HC", "40'HC"
        SIZE_45 = "45'", "45'"

    class BillingType(models.TextChoices):
        BASE_FUEL = 'Base + Fuel', 'Base + Fuel'
        ALL_IN = 'All-in', 'All-in'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='lanes')
    origin_city = models.CharField(max_length=100)
    origin_state = models.CharField(max_length=50)
    dest_city = models.CharField(max_length=100)
    dest_state = models.CharField(max_length=50)
    miles = models.IntegerField()
    movement_type = models.CharField(max_length=50, choices=MovementType.choices)
    equipment_size = models.CharField(max_length=50, choices=EquipmentSize.choices)
    linehaul_rate = models.DecimalField(max_digits=10, decimal_places=2)
    billing_type = models.CharField(max_length=50, choices=BillingType.choices)
    carrier_target_pay = models.DecimalField(max_digits=10, decimal_places=2)
    effective_date = models.CharField(max_length=50)
    termination_date = models.CharField(max_length=50)
    review_date = models.CharField(max_length=50)

class AccessorialSOP(TimestampedModel, LegacyMigrationModel):
    class AppointmentType(models.TextChoices):
        DROP_AND_HOOK = 'Drop and Hook', 'Drop and Hook'
        LIVE_UNLOAD = 'Live Unload', 'Live Unload'
        BOTH = 'Both', 'Both'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='accessorial_sops')
    
    chassis_fee = models.DecimalField(max_digits=10, decimal_places=2)
    pre_pull_fee = models.DecimalField(max_digits=10, decimal_places=2)
    storage_fee = models.DecimalField(max_digits=10, decimal_places=2)
    empty_storage_fee = models.DecimalField(max_digits=10, decimal_places=2)
    detention_rate = models.DecimalField(max_digits=10, decimal_places=2)
    detention_free_time = models.DecimalField(max_digits=10, decimal_places=2)
    chassis_split_fee = models.DecimalField(max_digits=10, decimal_places=2)
    clean_truck_fee = models.DecimalField(max_digits=10, decimal_places=2)
    
    appointment_type = models.CharField(max_length=50, choices=AppointmentType.choices)
    required_status_updates = models.JSONField(default=list)
    has_yard_hostler = models.BooleanField(default=False)
    peel_piles_permitted = models.BooleanField(default=False)
    private_chassis_permitted = models.BooleanField(default=False)
    free_time_days = models.IntegerField()
    delivery_rules = models.TextField(blank=True)
