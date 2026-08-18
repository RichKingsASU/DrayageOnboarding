from django import forms
import re

class AccountEditForm(forms.Form):
    name = forms.CharField(max_length=255, required=True, label="Company Legal Name")
    billToCode = forms.CharField(max_length=50, required=False, label="Bill-To Code")
    creditTerms = forms.CharField(max_length=100, required=False, label="Credit Approval Terms")
    commodity = forms.CharField(max_length=255, required=False, label="Commodity Profile")
    equipmentType = forms.CharField(max_length=100, required=False, label="Equipment Setting")
    loadType = forms.CharField(max_length=100, required=False, label="Load Layout")
    expectedWeight = forms.CharField(max_length=100, required=False, label="Expected Max Cargo Weight")
    isBonded = forms.BooleanField(required=False, label="Customs Bonded Carrier needed")
    hazmatClass = forms.CharField(max_length=100, required=False, label="Hazmat Class UN#")
    cargoValue = forms.FloatField(required=False, label="Cargo Max Valuation ($)")
    prefCommMethod = forms.CharField(max_length=100, required=False, label="Communication Channel")
    needsApiEdi = forms.BooleanField(required=False, label="Requires API / EDI integrations")
    invoiceDocsRequired = forms.CharField(max_length=255, required=False, label="Invoicing Target Docs (Comma Sep)")
    acceptSequenceBills = forms.BooleanField(required=False, label="Accepts Sequence Bills")

    def clean_invoiceDocsRequired(self):
        data = self.cleaned_data.get('invoiceDocsRequired', '')
        if data:
            return [d.strip() for d in data.split(',') if d.strip()]
        return []

class AlertForm(forms.Form):
    type = forms.ChoiceField(choices=[
        ('danger', 'Critical'),
        ('warning', 'Warning'),
        ('info', 'Info')
    ], required=True)
    message = forms.CharField(max_length=500, required=True)

class DocumentUploadForm(forms.Form):
    file = forms.FileField(required=True)
    document_type = forms.CharField(max_length=100, required=True)

    def clean_file(self):
        file = self.cleaned_data.get('file')
        if file:
            if not file.name.lower().endswith('.pdf'):
                raise forms.ValidationError("Only PDF files are allowed.")
            if file.size > 10 * 1024 * 1024:
                raise forms.ValidationError("File size must be under 10MB.")
        return file

class ContactForm(forms.Form):
    name = forms.CharField(max_length=255, required=True, label="Full Name")
    role = forms.CharField(max_length=100, required=True, label="Role / Title")
    email = forms.EmailField(required=True, label="Email Address")
    phone = forms.CharField(max_length=50, required=False, label="Phone Number")

class LaneForm(forms.Form):
    origin = forms.CharField(max_length=255, required=True, label="Origin Port/Ramp")
    destination = forms.CharField(max_length=255, required=True, label="Destination Facility")
    volume = forms.CharField(max_length=100, required=True, label="Expected Volume (Monthly)")
    equipment = forms.CharField(max_length=100, required=True, label="Equipment Required")
