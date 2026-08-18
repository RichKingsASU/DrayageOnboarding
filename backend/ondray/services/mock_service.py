import json
import os
from django.conf import settings

def load_mock_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    fixture_path = os.path.join(base_dir, 'fixtures', 'mock_data.json')
    
    with open(fixture_path, 'r', encoding='utf-8') as f:
        return json.load(f)

MOCK_DATA = load_mock_data()

class OnboardingMockService:
    @staticmethod
    def get_accounts():
        return MOCK_DATA.get('accounts', [])

    @staticmethod
    def get_account_by_id(account_id):
        accounts = MOCK_DATA.get('accounts', [])
        return next((a for a in accounts if a['id'] == account_id), None)

    @staticmethod
    def get_contacts(account_id=None):
        contacts = MOCK_DATA.get('contacts', [])
        if account_id:
            return [c for c in contacts if c.get('accountId') == account_id]
        return contacts

    @staticmethod
    def get_lanes(account_id=None):
        lanes = MOCK_DATA.get('lanes', [])
        if account_id:
            return [l for l in lanes if l.get('accountId') == account_id]
        return lanes

    @staticmethod
    def update_account_stage(account_id, new_stage):
        accounts = MOCK_DATA.get('accounts', [])
        for a in accounts:
            if a['id'] == account_id:
                a['stage'] = new_stage
                return a
        return None

    @staticmethod
    def update_account_details(account_id, data):
        accounts = MOCK_DATA.get('accounts', [])
        for a in accounts:
            if a['id'] == account_id:
                a.update(data)
                return a
        return None

    @staticmethod
    def add_contact(contact_data):
        contacts = MOCK_DATA.setdefault('contacts', [])
        new_id = f"cont_{len(contacts) + 1}"
        contact_data['id'] = new_id
        contacts.append(contact_data)
        return contact_data

    @staticmethod
    def add_alert(account_id, alert_data):
        accounts = MOCK_DATA.get('accounts', [])
        for a in accounts:
            if a['id'] == account_id:
                if 'alerts' not in a:
                    a['alerts'] = []
                new_id = f"al_{len(a['alerts']) + 1}"
                alert_data['id'] = new_id
                a['alerts'].append(alert_data)
                return a
        return None

    @staticmethod
    def remove_alert(account_id, alert_id):
        accounts = MOCK_DATA.get('accounts', [])
        for a in accounts:
            if a['id'] == account_id:
                a['alerts'] = [al for al in a.get('alerts', []) if al.get('id') != alert_id]
                return a
        return None

    @staticmethod
    def add_document(account_id, doc_data):
        accounts = MOCK_DATA.get('accounts', [])
        for a in accounts:
            if a['id'] == account_id:
                if 'documents' not in a:
                    a['documents'] = []
                new_id = f"doc_{len(a['documents']) + 1}"
                doc_data['id'] = new_id
                a['documents'].append(doc_data)
                return a
        return None

    @staticmethod
    def get_compliance_data(account_id):
        compliance_list = MOCK_DATA.setdefault('compliance', [])
        for c in compliance_list:
            if c.get('accountId') == account_id:
                return c
        # Return default structure if missing
        default = {
            "accountId": account_id,
            "checklist": [
                {"id": "c1", "group": "Legal", "task": "Signed Agreement", "status": "Pending"},
                {"id": "c2", "group": "Finance", "task": "Credit Check", "status": "Pending"}
            ]
        }
        compliance_list.append(default)
        return default

    @staticmethod
    def update_compliance_item(account_id, item_id, status):
        comp = OnboardingMockService.get_compliance_data(account_id)
        for task in comp.get('checklist', []):
            if task['id'] == item_id:
                task['status'] = status
        return comp
