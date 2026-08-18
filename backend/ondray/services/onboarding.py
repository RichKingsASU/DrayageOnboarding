import os
from django.conf import settings
from ondray.models import Account, Contact, Lane, ChecklistState, CustomerAlert, OnboardingDocument

USE_MOCKS = False

def serialize_checklist(state):
    if not state:
        return {}
    return {
        "creditApp": state.credit_app,
        "db": state.db,
        "contract": state.contract,
        "rateAgreement": state.rate_agreement,
        "fuelAgreement": state.fuel_agreement,
        "accessorialAgreement": state.accessorial_agreement,
        "folderCreated": state.folder_created,
        "filesUploaded": state.files_uploaded,
        "internalMeetingDate": state.internal_meeting_date,
        "externalMeetingDate": state.external_meeting_date,
        "summaryEmailSent": state.summary_email_sent,
        "auditCompleted": state.audit_completed,
        "workOrderReceived": state.work_order_received,
        "onboardingCallCompleted": state.onboarding_call_completed,
        "notes": state.notes,
        "completedBy": state.completed_by,
        "completedDate": state.completed_date
    }

def serialize_account(account):
    return {
        "id": str(account.id),
        "name": account.name,
        "billToCode": account.bill_to_code,
        "creditTerms": account.credit_terms,
        "invoiceDocsRequired": account.invoice_docs_required if isinstance(account.invoice_docs_required, list) else [],
        "acceptSequenceBills": account.accept_sequence_bills,
        "commodity": account.commodity,
        "equipmentType": account.equipment_type,
        "loadType": account.load_type,
        "expectedWeight": account.expected_weight,
        "isBonded": account.is_bonded,
        "hazmatClass": account.hazmat_class,
        "cargoValue": float(account.cargo_value) if account.cargo_value else 0,
        "prefCommMethod": account.pref_comm_method,
        "needsApiEdi": account.needs_api_edi,
        "stage": account.stage,
        "alerts": [
            {
                "id": str(alert.id),
                "type": alert.type,
                "message": alert.message
            } for alert in account.alerts.all()
        ],
        "documents": [
            {
                "id": str(doc.id),
                "name": doc.name,
                "type": doc.type,
                "uploadedAt": doc.uploaded_at,
                "size": doc.size,
                "url": doc.storage_path or "",
            } for doc in account.documents.all()
        ],
        "checklistState": serialize_checklist(getattr(account, 'checklist_state', None))
    }

def serialize_contact(contact):
    return {
        "id": str(contact.id),
        "accountId": str(contact.account_id),
        "name": contact.name,
        "title": contact.title,
        "email": contact.email,
        "phone": contact.phone,
        "role": contact.role,
        "notes": contact.notes
    }

def serialize_lane(lane):
    return {
        "id": str(lane.id),
        "accountId": str(lane.account_id),
        "originCity": lane.origin_city,
        "originState": lane.origin_state,
        "destCity": lane.dest_city,
        "destState": lane.dest_state,
        "miles": lane.miles,
        "movementType": lane.movement_type,
        "equipmentSize": lane.equipment_size,
        "linehaulRate": float(lane.linehaul_rate) if lane.linehaul_rate else 0,
        "billingType": lane.billing_type,
        "carrierTargetPay": float(lane.carrier_target_pay) if lane.carrier_target_pay else 0,
        "effectiveDate": lane.effective_date,
        "terminationDate": lane.termination_date,
        "reviewDate": lane.review_date
    }

class OnboardingService:
    @staticmethod
    def get_accounts():
        accounts = Account.objects.all().prefetch_related('alerts', 'documents')
        return [serialize_account(a) for a in accounts]

    @staticmethod
    def get_account(account_id):
        account = Account.objects.filter(id=account_id).prefetch_related('alerts', 'documents').first()
        return serialize_account(account) if account else None

    @staticmethod
    def get_contacts(account_id=None):
        qs = Contact.objects.all()
        if account_id:
            qs = qs.filter(account_id=account_id)
        return [serialize_contact(c) for c in qs]

    @staticmethod
    def get_lanes(account_id=None):
        qs = Lane.objects.all()
        if account_id:
            qs = qs.filter(account_id=account_id)
        return [serialize_lane(l) for l in qs]

    @staticmethod
    def update_account_stage(account_id, new_stage):
        Account.objects.filter(id=account_id).update(stage=new_stage)
        return OnboardingService.get_account(account_id)

    @staticmethod
    def update_account_details(account_id, data):
        account = Account.objects.filter(id=account_id).first()
        if account:
            for key, value in data.items():
                if key == 'billToCode': account.bill_to_code = value
                elif key == 'creditTerms': account.credit_terms = value
                elif key == 'invoiceDocsRequired': 
                    if isinstance(value, str):
                        account.invoice_docs_required = [v.strip() for v in value.split(',') if v.strip()]
                    else:
                        account.invoice_docs_required = value
                elif key == 'acceptSequenceBills': account.accept_sequence_bills = value
                elif key == 'commodity': account.commodity = value
                elif key == 'equipmentType': account.equipment_type = value
                elif key == 'loadType': account.load_type = value
                elif key == 'expectedWeight': account.expected_weight = value
                elif key == 'isBonded': account.is_bonded = value
                elif key == 'hazmatClass': account.hazmat_class = value
                elif key == 'cargoValue': account.cargo_value = value
                elif key == 'prefCommMethod': account.pref_comm_method = value
                elif key == 'needsApiEdi': account.needs_api_edi = value
                elif key == 'stage': account.stage = value
                elif key == 'name': account.name = value
            account.save()
            return serialize_account(account)
        return None

    @staticmethod
    def add_contact(account_id, contact_data):
        contact = Contact.objects.create(
            account_id=account_id,
            name=contact_data.get('name'),
            title=contact_data.get('title'),
            email=contact_data.get('email'),
            phone=contact_data.get('phone'),
            role=contact_data.get('role'),
            notes=contact_data.get('notes', '')
        )
        return serialize_contact(contact)

    @staticmethod
    def add_lane(account_id, lane_data):
        lane = Lane.objects.create(
            account_id=account_id,
            origin_city=lane_data.get('origin', '').split(',')[0],
            origin_state='',
            dest_city=lane_data.get('destination', '').split(',')[0],
            dest_state='',
            equipment_size=lane_data.get('equipment', ''),
            billing_type=lane_data.get('volume', '')
        )
        return serialize_lane(lane)

    @staticmethod
    def add_alert(account_id, alert_data):
        CustomerAlert.objects.create(
            account_id=account_id,
            type=alert_data.get('type', 'info'),
            message=alert_data.get('message', '')
        )
        return OnboardingService.get_account(account_id)

    @staticmethod
    def remove_alert(account_id, alert_id):
        CustomerAlert.objects.filter(id=alert_id, account_id=account_id).delete()
        return OnboardingService.get_account(account_id)

    @staticmethod
    def add_document(account_id, doc_data):
        OnboardingDocument.objects.create(
            account_id=account_id,
            name=doc_data.get('name'),
            type=doc_data.get('type'),
            uploaded_at=doc_data.get('uploadedAt'),
            size=doc_data.get('size'),
            storage_path=doc_data.get('url'),
            checksum=doc_data.get('checksum', '')
        )
        return OnboardingService.get_account(account_id)

    @staticmethod
    def get_compliance_data(account_id):
        account = Account.objects.filter(id=account_id).first()
        if not account:
            return None
        state, _ = ChecklistState.objects.get_or_create(account=account)
        checklist = []
        def add_item(cid, group, task, field_name):
            status = "Completed" if getattr(state, field_name, False) else "Pending"
            checklist.append({
                "id": cid,
                "group": group,
                "task": task,
                "status": status,
                "fieldName": field_name
            })

        add_item("c1", "Legal", "Credit Application", "credit_app")
        add_item("c2", "Legal", "D&B Check", "db")
        add_item("c3", "Legal", "Signed Contract", "contract")
        add_item("c4", "Finance", "Fuel Agreement", "fuel_agreement")
        add_item("c5", "Finance", "Accessorial Agreement", "accessorial_agreement")
        add_item("c6", "Operations", "Folder Created", "folder_created")
        add_item("c7", "Operations", "Files Uploaded", "files_uploaded")
        add_item("c8", "Review", "Audit Completed", "audit_completed")
        add_item("c9", "Review", "Work Order Received", "work_order_received")
        add_item("c10", "Review", "Onboarding Call Completed", "onboarding_call_completed")
        add_item("c11", "Review", "Summary Email Sent", "summary_email_sent")

        return {
            "accountId": str(account.id),
            "checklist": checklist,
            "internalMeetingDate": state.internal_meeting_date if state.internal_meeting_date else "",
            "externalMeetingDate": state.external_meeting_date if state.external_meeting_date else "",
            "notes": state.notes if state.notes else ""
        }

    @staticmethod
    def update_compliance_item(account_id, item_id, status):
        mapping = {
            "c1": "credit_app", "c2": "db", "c3": "contract",
            "c4": "fuel_agreement", "c5": "accessorial_agreement",
            "c6": "folder_created", "c7": "files_uploaded",
            "c8": "audit_completed", "c9": "work_order_received",
            "c10": "onboarding_call_completed", "c11": "summary_email_sent"
        }
        field_name = mapping.get(item_id)
        if field_name:
            state = ChecklistState.objects.filter(account_id=account_id).first()
            if state:
                setattr(state, field_name, status == "Completed")
                state.save()
        return OnboardingService.get_compliance_data(account_id)

    @staticmethod
    def update_meetings(account_id, data):
        state = ChecklistState.objects.filter(account_id=account_id).first()
        if state:
            state.internal_meeting_date = data.get('internalMeetingDate', state.internal_meeting_date)
            state.external_meeting_date = data.get('externalMeetingDate', state.external_meeting_date)
            state.notes = data.get('notes', state.notes)
            state.save()
        return OnboardingService.get_compliance_data(account_id)
