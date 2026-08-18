from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.urls import reverse
from django.core.files.storage import FileSystemStorage
from .services.onboarding import OnboardingService
from .forms import AccountEditForm, AlertForm, DocumentUploadForm
from datetime import datetime

def kanban_view(request):
    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'update_stage':
            account_id = request.POST.get('account_id')
            new_stage = request.POST.get('new_stage')
            if account_id and new_stage:
                OnboardingService.update_account_stage(account_id, new_stage)
            return JsonResponse({'status': 'ok'})
        elif action == 'create_account':
            pass
        return redirect('kanban')

    accounts = OnboardingService.get_accounts()
    
    stages = [
        {'id': 'CustomerInquiry', 'label': 'Inquiry'},
        {'id': 'Agreement', 'label': 'Agreement'},
        {'id': 'AccountSetup', 'label': 'Setup'},
        {'id': 'OperationalKickoff', 'label': 'Kickoff'},
        {'id': 'OngoingSupport', 'label': 'Operational'},
    ]
    
    board_data = []
    for stage in stages:
        stage_accounts = [a for a in accounts if a.get('stage') == stage['id']]
        board_data.append({
            'id': stage['id'],
            'label': stage['label'],
            'accounts': stage_accounts,
            'count': len(stage_accounts)
        })

    total_accounts = len(accounts)
    in_pipeline = sum(1 for a in accounts if a.get('stage') != 'OngoingSupport')
    fully_onboarded = sum(1 for a in accounts if a.get('stage') == 'OngoingSupport')
    total_cargo_value = sum(a.get('cargoValue', 0) for a in accounts)
    avg_deal_volume = (total_cargo_value / total_accounts / 1000) if total_accounts > 0 else 0

    context = {
        'active_tab': 'kanban',
        'board_data': board_data,
        'accounts_count': total_accounts,
        'in_pipeline': in_pipeline,
        'fully_onboarded': fully_onboarded,
        'avg_deal_volume': avg_deal_volume,
    }
    return render(request, 'kanban.html', context)

def dashboard_view(request, account_id=None):
    accounts = OnboardingService.get_accounts()
    
    if account_id:
        selected_account = OnboardingService.get_account(account_id)
    else:
        selected_account = accounts[0] if accounts else None
        if selected_account:
            return redirect('dashboard_account', account_id=selected_account['id'])
        
    contacts = OnboardingService.get_contacts(selected_account['id'] if selected_account else None)
    compliance_data = OnboardingService.get_compliance_data(selected_account['id'] if selected_account else None)
    
    # Check if we should show the edit form
    show_edit_form = request.GET.get('edit') == '1'
    edit_form = None
    if show_edit_form and selected_account:
        # Pre-fill form with comma-separated list for invoiceDocsRequired if needed
        initial_data = selected_account.copy()
        if 'invoiceDocsRequired' in initial_data and isinstance(initial_data['invoiceDocsRequired'], list):
            initial_data['invoiceDocsRequired'] = ', '.join(initial_data['invoiceDocsRequired'])
        edit_form = AccountEditForm(initial=initial_data)
        
    alert_form = AlertForm()
    doc_form = DocumentUploadForm()

    context = {
        'active_tab': 'dashboard',
        'accounts': accounts,
        'selected_account': selected_account,
        'contacts': contacts,
        'compliance_data': compliance_data,
        'edit_form': edit_form,
        'alert_form': alert_form,
        'doc_form': doc_form,
        'show_edit_form': show_edit_form
    }
    return render(request, 'dashboard.html', context)

def dashboard_account_edit(request, account_id):
    if request.method == 'POST':
        form = AccountEditForm(request.POST)
        if form.is_valid():
            OnboardingService.update_account_details(account_id, form.cleaned_data)
            return redirect('dashboard_account', account_id=account_id)
    return redirect('dashboard_account', account_id=account_id)

def account_add_alert(request, account_id):
    if request.method == 'POST':
        form = AlertForm(request.POST)
        if form.is_valid():
            OnboardingService.add_alert(account_id, form.cleaned_data)
    return redirect('dashboard_account', account_id=account_id)

def account_delete_alert(request, account_id, alert_id):
    if request.method == 'POST':
        OnboardingService.remove_alert(account_id, alert_id)
    return redirect('dashboard_account', account_id=account_id)

def document_upload(request, account_id):
    if request.method == 'POST':
        form = DocumentUploadForm(request.POST, request.FILES)
        if form.is_valid():
            f = form.cleaned_data['file']
            fs = FileSystemStorage()
            filename = fs.save(f.name, f)
            uploaded_file_url = fs.url(filename)
            
            doc_data = {
                'name': f.name,
                'type': form.cleaned_data['document_type'],
                'uploadedAt': datetime.now().strftime('%Y-%m-%d'),
                'size': f"{f.size / (1024*1024):.1f} MB",
                'url': uploaded_file_url,
                'path': fs.path(filename)
            }
            OnboardingService.add_document(account_id, doc_data)
    return redirect('dashboard_account', account_id=account_id)

def document_delete(request, account_id, doc_id):
    if request.method == 'POST':
        account = OnboardingService.get_account(account_id)
        if account:
            # Not physically deleting the file for mock, just remove from list
            account['documents'] = [d for d in account.get('documents', []) if d.get('id') != doc_id]
    return redirect('dashboard_account', account_id=account_id)

def update_compliance_item(request, account_id, item_id):
    if request.method == 'POST':
        status = request.POST.get('status')
        if status:
            OnboardingService.update_compliance_item(account_id, item_id, status)
    return redirect('dashboard_account', account_id=account_id)
