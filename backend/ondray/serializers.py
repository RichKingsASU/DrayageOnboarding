from rest_framework import serializers
from .models import Account, ChecklistState, CustomerAlert, OnboardingDocument, Contact, Lane, AccessorialSOP

class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = (
            'id', 'name', 'bill_to_code', 'credit_terms', 'invoice_docs_required',
            'accept_sequence_bills', 'commodity', 'equipment_type', 'load_type',
            'expected_weight', 'is_bonded', 'hazmat_class', 'cargo_value',
            'pref_comm_method', 'needs_api_edi', 'stage', 'bill_to_code_created',
            'audit_checklist_completed', 'is_new_prospect', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

class ChecklistStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistState
        fields = (
            'id', 'account', 'credit_app', 'db', 'contract', 'rate_agreement',
            'fuel_agreement', 'accessorial_agreement', 'folder_created',
            'files_uploaded', 'internal_meeting_date', 'external_meeting_date',
            'summary_email_sent', 'audit_completed', 'work_order_received',
            'onboarding_call_completed', 'notes', 'completed_by', 'completed_date',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

class CustomerAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerAlert
        fields = ('id', 'account', 'type', 'message', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

class OnboardingDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnboardingDocument
        fields = (
            'id', 'account', 'name', 'type', 'uploaded_at', 'size',
            'uploaded_by', 'checklist_item_key', 'description', 'checksum',
            'created_at', 'updated_at'
        )
        # Explicitly omitting content_key, storage_path
        read_only_fields = ('id', 'created_at', 'updated_at')

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = (
            'id', 'account', 'name', 'title', 'email', 'phone', 'role', 'notes',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

class LaneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lane
        fields = (
            'id', 'account', 'origin_city', 'origin_state', 'dest_city',
            'dest_state', 'miles', 'movement_type', 'equipment_size',
            'linehaul_rate', 'billing_type', 'carrier_target_pay',
            'effective_date', 'termination_date', 'review_date',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

class AccessorialSOPSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccessorialSOP
        fields = (
            'id', 'account', 'chassis_fee', 'pre_pull_fee', 'storage_fee',
            'empty_storage_fee', 'detention_rate', 'detention_free_time',
            'chassis_split_fee', 'clean_truck_fee', 'appointment_type',
            'required_status_updates', 'has_yard_hostler', 'peel_piles_permitted',
            'private_chassis_permitted', 'free_time_days', 'delivery_rules',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
