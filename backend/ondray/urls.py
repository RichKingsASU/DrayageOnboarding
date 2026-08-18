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

from . import ui_views
from .ui_views import kanban_view, dashboard_view
from . import session_views

urlpatterns = [
    path('', kanban_view, name='kanban'),
    path('dashboard/', dashboard_view, name='dashboard'),
    path('dashboard/<str:account_id>/', dashboard_view, name='dashboard_account'),
    path('dashboard/<str:account_id>/edit/', ui_views.dashboard_account_edit, name='dashboard_account_edit'),
    path('dashboard/<str:account_id>/contacts/add/', ui_views.account_add_contact, name='account_add_contact'),
    path('dashboard/<str:account_id>/lanes/add/', ui_views.account_add_lane, name='account_add_lane'),
    path('dashboard/<str:account_id>/alerts/add/', ui_views.account_add_alert, name='account_add_alert'),
    path('dashboard/<str:account_id>/alerts/<str:alert_id>/delete/', ui_views.account_delete_alert, name='account_delete_alert'),
    path('dashboard/<str:account_id>/documents/upload/', ui_views.document_upload, name='document_upload'),
    path('dashboard/<str:account_id>/documents/<str:doc_id>/delete/', ui_views.document_delete, name='document_delete'),
    path('dashboard/<str:account_id>/compliance/<str:item_id>/update/', ui_views.update_compliance_item, name='update_compliance_item'),
    path('dashboard/<str:account_id>/meetings/update/', ui_views.update_meetings, name='update_meetings'),
    
    path('api/v1/ondray/', include(router.urls)),
    path('api/v1/session/', session_views.session_info, name='session_info'),
    path('api/v1/session/logout/', session_views.session_logout, name='session_logout'),
    path('api/v1/session/login/', session_views.session_login_dev, name='session_login_dev'),
]
