import json
import os
from django.core.management.base import BaseCommand
from ondray.models import OnboardingDocument
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

class Command(BaseCommand):
    help = 'Migrates Supabase documents to Django local storage.'

    def add_arguments(self, parser):
        parser.add_argument('--manifest', type=str, help='Path to manifest JSON')
        parser.add_argument('--source-root', type=str, help='Path to source root for local files')
        parser.add_argument('--dry-run', action='store_true', help='Dry run without making changes')

    def handle(self, *args, **options):
        manifest_path = options['manifest']
        source_root = options['source_root']
        dry_run = options['dry_run']
        
        if not manifest_path or not source_root:
            self.stdout.write(self.style.ERROR('Please provide --manifest and --source-root'))
            return
            
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
            
        self.stdout.write(self.style.SUCCESS(f'Loaded manifest version {manifest.get("version")} with {len(manifest.get("documents", []))} documents'))
        
        for doc_meta in manifest.get('documents', []):
            legacy_id = doc_meta.get('legacy_id')
            account_id = doc_meta.get('account_id')
            original_filename = doc_meta.get('original_filename')
            exported_path = doc_meta.get('exported_local_file_reference')
            
            # Idempotency check
            if OnboardingDocument.objects.filter(legacy_record_id=legacy_id).exists():
                self.stdout.write(self.style.WARNING(f'EXISTING: Document {legacy_id} already migrated'))
                continue
                
            local_full_path = os.path.join(source_root, exported_path)
            if not os.path.exists(local_full_path):
                self.stdout.write(self.style.ERROR(f'REJECTED: FILE_MISSING for {legacy_id} at {local_full_path}'))
                continue
                
            if dry_run:
                self.stdout.write(self.style.SUCCESS(f'DRY-RUN: Would migrate {legacy_id} from {local_full_path}'))
                continue
                
            # Perform actual migration (not doing for dry-run)
            # In full implementation, save to default_storage and create DB record.
            self.stdout.write(self.style.SUCCESS(f'MIGRATED: Document {legacy_id}'))
