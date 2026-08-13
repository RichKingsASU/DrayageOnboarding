import hashlib
import uuid
import os
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings

def generate_safe_filename(original_name, account_id):
    # Generates a random safe name to prevent path traversal and duplicates
    ext = os.path.splitext(original_name)[1].lower()
    return f"ondray/{account_id}/{uuid.uuid4().hex}{ext}"

def handle_upload(account, file_obj, document_type, description, uploaded_by):
    # Read content
    content = file_obj.read()
    
    # Calculate sha256
    hasher = hashlib.sha256()
    hasher.update(content)
    checksum = hasher.hexdigest()

    # Generate safe name
    safe_name = generate_safe_filename(file_obj.name, account.id)

    # Save to storage
    storage_path = default_storage.save(safe_name, ContentFile(content))

    from ondray.models import OnboardingDocument
    doc = OnboardingDocument.objects.create(
        account=account,
        name=file_obj.name,
        type=document_type,
        size=str(file_obj.size),
        storage_path=storage_path,
        content_key=storage_path,
        uploaded_by=uploaded_by,
        description=description,
        checksum=checksum
    )
    return doc

def get_document_content(document):
    if not document.storage_path or not default_storage.exists(document.storage_path):
        return None
    return default_storage.open(document.storage_path, 'rb')
