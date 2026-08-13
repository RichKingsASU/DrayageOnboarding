from rest_framework import viewsets
from .models import Account, ChecklistState, CustomerAlert, OnboardingDocument, Contact, Lane, AccessorialSOP
from .serializers import (
    AccountSerializer, ChecklistStateSerializer, CustomerAlertSerializer,
    OnboardingDocumentSerializer, ContactSerializer, LaneSerializer, AccessorialSOPSerializer
)
from rest_framework.permissions import IsAuthenticated

class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated]

class ChecklistStateViewSet(viewsets.ModelViewSet):
    queryset = ChecklistState.objects.all()
    serializer_class = ChecklistStateSerializer
    permission_classes = [IsAuthenticated]

class CustomerAlertViewSet(viewsets.ModelViewSet):
    queryset = CustomerAlert.objects.all()
    serializer_class = CustomerAlertSerializer
    permission_classes = [IsAuthenticated]

from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse, FileResponse
from django.core.exceptions import ValidationError
from .services.storage import handle_upload, get_document_content
from django.conf import settings
import os

class OnboardingDocumentViewSet(viewsets.ModelViewSet):
    queryset = OnboardingDocument.objects.all()
    serializer_class = OnboardingDocumentSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def upload(self, request):
        account_id = request.data.get('account')
        if not account_id:
            return Response({'error': 'account is required'}, status=400)
            
        try:
            account = Account.objects.get(id=account_id)
        except Account.DoesNotExist:
            return Response({'error': 'Account not found'}, status=404)
            
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=400)
            
        file_obj = request.FILES['file']
        
        # Max size validation (e.g. 15MB)
        max_bytes = getattr(settings, 'DOCUMENT_MAX_UPLOAD_BYTES', 15 * 1024 * 1024)
        if file_obj.size > max_bytes:
            return Response({'error': 'File too large'}, status=400)
            
        # Extension validation
        allowed_extensions = ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg']
        ext = os.path.splitext(file_obj.name)[1].lower()
        if ext not in allowed_extensions:
            return Response({'error': 'File type not allowed'}, status=400)
            
        doc_type = request.data.get('type', 'Other')
        description = request.data.get('description', '')
        
        try:
            doc = handle_upload(
                account=account,
                file_obj=file_obj,
                document_type=doc_type,
                description=description,
                uploaded_by=request.user.username if request.user.is_authenticated else 'System'
            )
            serializer = self.get_serializer(doc)
            return Response(serializer.data, status=201)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=True, methods=['get'])
    def content(self, request, pk=None):
        doc = self.get_object()
        file_handle = get_document_content(doc)
        if not file_handle:
            return Response({'error': 'File not found'}, status=404)
            
        # Determine content type based on extension
        ext = os.path.splitext(doc.name)[1].lower()
        content_type = 'application/octet-stream'
        if ext == '.pdf':
            content_type = 'application/pdf'
        elif ext in ['.jpg', '.jpeg']:
            content_type = 'image/jpeg'
        elif ext == '.png':
            content_type = 'image/png'
            
        response = FileResponse(file_handle, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{doc.name}"'
        return response

class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [IsAuthenticated]

class LaneViewSet(viewsets.ModelViewSet):
    queryset = Lane.objects.all()
    serializer_class = LaneSerializer
    permission_classes = [IsAuthenticated]

class AccessorialSOPViewSet(viewsets.ModelViewSet):
    queryset = AccessorialSOP.objects.all()
    serializer_class = AccessorialSOPSerializer
    permission_classes = [IsAuthenticated]
