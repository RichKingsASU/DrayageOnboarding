from django.conf import settings
from .mock_service import OnboardingMockService

# In the future, this flag will be controlled by settings or environment variable
USE_MOCKS = True

class OnboardingService:
    """
    Service boundary for all Onboarding-related operations.
    Abstracts whether data comes from PostgreSQL or Mock fixtures.
    """
    @staticmethod
    def get_accounts():
        if USE_MOCKS:
            return OnboardingMockService.get_accounts()
        # TODO: return Account.objects.all()
        return []

    @staticmethod
    def get_account(account_id):
        if USE_MOCKS:
            return OnboardingMockService.get_account_by_id(account_id)
        # TODO: return Account.objects.filter(id=account_id).first()
        return None

    @staticmethod
    def get_contacts(account_id=None):
        if USE_MOCKS:
            return OnboardingMockService.get_contacts(account_id)
        return []

    @staticmethod
    def get_lanes(account_id=None):
        if USE_MOCKS:
            return OnboardingMockService.get_lanes(account_id)
        return []

    @staticmethod
    def update_account_stage(account_id, new_stage):
        if USE_MOCKS:
            return OnboardingMockService.update_account_stage(account_id, new_stage)
        # TODO: update DB
        return None

    @staticmethod
    def update_account_details(account_id, data):
        if USE_MOCKS:
            return OnboardingMockService.update_account_details(account_id, data)
        return None

    @staticmethod
    def add_contact(contact_data):
        if USE_MOCKS:
            return OnboardingMockService.add_contact(contact_data)
        return None

    @staticmethod
    def add_alert(account_id, alert_data):
        if USE_MOCKS:
            return OnboardingMockService.add_alert(account_id, alert_data)
        return None

    @staticmethod
    def remove_alert(account_id, alert_id):
        if USE_MOCKS:
            return OnboardingMockService.remove_alert(account_id, alert_id)
        return None

    @staticmethod
    def add_document(account_id, doc_data):
        if USE_MOCKS:
            return OnboardingMockService.add_document(account_id, doc_data)
        return None

    @staticmethod
    def get_compliance_data(account_id):
        if USE_MOCKS:
            return OnboardingMockService.get_compliance_data(account_id)
        return None

    @staticmethod
    def update_compliance_item(account_id, item_id, status):
        if USE_MOCKS:
            return OnboardingMockService.update_compliance_item(account_id, item_id, status)
        return None
