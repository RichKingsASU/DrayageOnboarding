from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from ondray.models import Account
import json

User = get_user_model()

class ApiFoundationTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.account = Account.objects.create(name='Test Account', stage=Account.PipelineStage.CUSTOMER_INQUIRY)

    def test_unauthenticated_api_denied(self):
        response = self.client.get('/api/v1/ondray/accounts/')
        self.assertEqual(response.status_code, 401)  # Or 403 depending on DRF configuration

    def test_session_info_unauthenticated(self):
        response = self.client.get('/api/v1/session/')
        self.assertEqual(response.status_code, 401)
        
    def test_session_info_authenticated(self):
        self.client.login(username='testuser', password='testpassword')
        response = self.client.get('/api/v1/session/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['authenticated'])
        self.assertEqual(data['user']['display_name'], 'testuser')

    def test_logout(self):
        self.client.login(username='testuser', password='testpassword')
        response = self.client.post('/api/v1/session/logout/')
        # Should succeed even without CSRF in test client if we don't enforce it strictly in test setup,
        # but let's check it redirects or returns 200 depending on implementation.
        self.assertEqual(response.status_code, 200)
        # Verify session is gone
        resp_info = self.client.get('/api/v1/session/')
        self.assertEqual(resp_info.status_code, 401)

    def test_account_list_authenticated(self):
        self.client.login(username='testuser', password='testpassword')
        response = self.client.get('/api/v1/ondray/accounts/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        
        # Verify serializer explicit fields (e.g. migration_source shouldn't be exposed)
        account_data = data[0]
        self.assertNotIn('migration_source', account_data)
        self.assertIn('name', account_data)

    def test_dev_login(self):
        # We need CSRF for POST, client handles it or we can pass it if enforced
        response = self.client.post('/api/v1/session/login/', json.dumps({
            'username': 'testuser',
            'password': 'testpassword'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
