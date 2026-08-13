from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AccountViewSet, ChecklistStateViewSet, CustomerAlertViewSet,
    OnboardingDocumentViewSet, ContactViewSet, LaneViewSet, AccessorialSOPViewSet
)

router = DefaultRouter()
router.register(r'accounts', AccountViewSet)
router.register(r'checklist-states', ChecklistStateViewSet)
router.register(r'customer-alerts', CustomerAlertViewSet)
router.register(r'onboarding-documents', OnboardingDocumentViewSet)
router.register(r'contacts', ContactViewSet)
router.register(r'lanes', LaneViewSet)
router.register(r'accessorial-sops', AccessorialSOPViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
