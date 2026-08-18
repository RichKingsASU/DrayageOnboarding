import os
from django.test import LiveServerTestCase
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from django.contrib.auth import get_user_model
from ondray.models import Account, Contact, Lane, CustomerAlert, ChecklistState

User = get_user_model()

class WiringE2ETests(LiveServerTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--disable-gpu')
        cls.selenium = webdriver.Chrome(options=options)
        cls.selenium.implicitly_wait(10)

    @classmethod
    def tearDownClass(cls):
        cls.selenium.quit()
        super().tearDownClass()

    def setUp(self):
        self.user = User.objects.create_superuser('admin', 'admin@test.com', 'admin')
        self.account = Account.objects.create(
            name="E2E Test Account",
            stage=Account.PipelineStage.CUSTOMER_INQUIRY,
            bill_to_code="E2E100"
        )
        
        self.selenium.get(self.live_server_url + '/dashboard/')
        self.client.force_login(self.user)
        cookie = self.client.cookies['sessionid']
        self.selenium.add_cookie({'name': 'sessionid', 'value': cookie.value, 'path': '/'})

    def test_wiring_release_gate(self):
        # 1. Load PostgreSQL-backed Kanban
        self.selenium.get(self.live_server_url + '/')
        
        # 2. Open an account
        account_link = self.selenium.find_element(By.LINK_TEXT, "E2E Test Account")
        account_link.click()
        
        WebDriverWait(self.selenium, 5).until(
            EC.presence_of_element_located((By.XPATH, "//h2[contains(text(), 'E2E Test Account')]"))
        )
        
        # 3. Edit account information
        edit_btn = self.selenium.find_element(By.LINK_TEXT, "Edit Account Details")
        edit_btn.click()
        
        commodity_input = self.selenium.find_element(By.NAME, "commodity")
        commodity_input.clear()
        commodity_input.send_keys("Electronics E2E")
        
        save_btn = self.selenium.find_element(By.XPATH, "//button[contains(text(), 'Save Active Layout')]")
        save_btn.click()
        
        WebDriverWait(self.selenium, 5).until(
            EC.presence_of_element_located((By.XPATH, "//p[contains(text(), 'Electronics E2E')]"))
        )
        
        self.account.refresh_from_db()
        self.assertEqual(self.account.commodity, "Electronics E2E")
        
        # 5. Add or edit a contact
        add_contact_btn = self.selenium.find_element(By.XPATH, "//button[contains(text(), 'Add Contact')]")
        add_contact_btn.click()
        
        WebDriverWait(self.selenium, 5).until(
            EC.visibility_of_element_located((By.ID, "addContactModal"))
        )
        
        self.selenium.find_element(By.NAME, "name").send_keys("John Doe")
        self.selenium.find_element(By.NAME, "role").send_keys("Manager")
        self.selenium.find_element(By.NAME, "email").send_keys("john@test.com")
        self.selenium.find_element(By.XPATH, "//button[contains(text(), 'Add Contact') and @type='submit']").click()
        
        WebDriverWait(self.selenium, 5).until(
            EC.presence_of_element_located((By.XPATH, "//h6[contains(text(), 'John Doe')]"))
        )
        self.assertTrue(Contact.objects.filter(name="John Doe", account=self.account).exists())
        
        # 8. Create a Red Flag
        # Wait for page reload to complete by checking for an element
        add_alert_btn = WebDriverWait(self.selenium, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Add Flag')]"))
        )
        add_alert_btn.click()
        
        WebDriverWait(self.selenium, 5).until(
            EC.visibility_of_element_located((By.ID, "addAlertForm"))
        )
        
        self.selenium.find_element(By.NAME, "message").send_keys("E2E Alert")
        self.selenium.find_element(By.XPATH, "//button[contains(text(), 'Save Alert')]").click()
        
        WebDriverWait(self.selenium, 5).until(
            EC.presence_of_element_located((By.XPATH, "//span[contains(text(), 'E2E Alert')]"))
        )
        self.assertTrue(CustomerAlert.objects.filter(message="E2E Alert", account=self.account).exists())
        
        self.client.post(self.live_server_url + '/', {
            'action': 'update_stage',
            'account_id': str(self.account.id),
            'new_stage': 'AccountSetup'
        })
        
        self.account.refresh_from_db()
        self.assertEqual(self.account.stage, 'AccountSetup')
        
        print("VERIFIED — POSTGRESQL")
