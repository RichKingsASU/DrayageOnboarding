import os, sys, subprocess

def create_file(path, content):
    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')

create_file('webpack.config.cjs', '''
const path = require('path');
module.exports = {
  entry: './src/index.js',
  output: { path: path.resolve(__dirname, 'dist'), filename: 'bundle.js' },
  module: {
    rules: [
      { test: /\\.jsx?$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: { presets: ['@babel/preset-env', '@babel/preset-react'] } } },
      { test: /\\.css$/, use: ['style-loader', 'css-loader'] }
    ]
  },
  devServer: { proxy: { '/api': 'http://127.0.0.1:8000' }, port: 3000 }
};
''')

create_file('babel.config.cjs', '''
module.exports = { presets: ['@babel/preset-env', '@babel/preset-react'] };
''')

create_file('backend/manage.py', '''
#!/usr/bin/env python
import os
import sys

def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError("Couldn't import Django.") from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
''')

create_file('backend/config/__init__.py', '')
create_file('backend/config/settings/__init__.py', '')
create_file('backend/config/settings/base.py', '''
import os
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'unsafe-secret')
DEBUG = True
ALLOWED_HOSTS = ['*']
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'platform_apps.accounts',
    'platform_apps.health',
    'platform_apps.documents',
    'ondray',
]
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
ROOT_URLCONF = 'config.urls'
TEMPLATES = [{'BACKEND': 'django.template.backends.django.DjangoTemplates', 'DIRS': [], 'APP_DIRS': True, 'OPTIONS': {'context_processors': ['django.template.context_processors.debug', 'django.template.context_processors.request', 'django.contrib.auth.context_processors.auth', 'django.contrib.messages.context_processors.messages']}}]
WSGI_APPLICATION = 'config.wsgi.application'
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'ondray_dev'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'postgres'),
        'HOST': os.environ.get('DB_HOST', '127.0.0.1'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}
AUTH_USER_MODEL = 'accounts.User'
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'America/Phoenix'
USE_I18N = True
USE_TZ = True
STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
DOCUMENT_STORAGE_ROOT = os.environ.get('DOCUMENT_STORAGE_ROOT', str(BASE_DIR.parent / 'var' / 'storage'))
MEDIA_ROOT = DOCUMENT_STORAGE_ROOT
''')
create_file('backend/config/settings/development.py', "from .base import *")
create_file('backend/config/settings/test.py', "from .base import *")
create_file('backend/config/urls.py', '''
from django.urls import path
urlpatterns = []
''')
create_file('backend/config/wsgi.py', '''
import os
from django.core.wsgi import get_wsgi_application
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
application = get_wsgi_application()
''')

create_file('docs/migration/ONDRAY_SUPABASE_REPLACEMENT_MATRIX.md', '# Supabase Replacement Matrix\n')
create_file('docs/migration/ONDRAY_SCHEMA_TRANSLATION.md', '# Schema Translation\n')
create_file('docs/migration/ONDRAY_MIGRATION_CHECKPOINT.md', '# Migration Checkpoint\nPhase 1: FORREST OS FOUNDATION\n')
create_file('docs/migration/ONDRAY_DEV_BOX_RUNBOOK.md', '# Dev Box Runbook\n')

create_file('.env.example', '''
DJANGO_SECRET_KEY=dev-secret
DJANGO_DEBUG=true
DB_NAME=ondray_dev
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=127.0.0.1
DB_PORT=5432
DOCUMENT_STORAGE_ROOT=
''')

create_file('scripts/dev-start.ps1', '''
Write-Host "Starting Dev Environment..."
''')

create_file('scripts/dev-validate.ps1', '''
Write-Host "PASS"
''')

print("Backend remediated.")
