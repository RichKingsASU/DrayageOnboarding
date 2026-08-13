from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.views.decorators.http import require_http_methods
import json
from django.conf import settings

@ensure_csrf_cookie
@require_http_methods(["GET"])
def session_info(request):
    if request.user.is_authenticated:
        return JsonResponse({
            'authenticated': True,
            'user': {
                'id': str(request.user.id),
                'email': getattr(request.user, 'email', ''),
                'display_name': getattr(request.user, 'get_full_name', lambda: '')() or request.user.username,
                'permission_codes': list(request.user.get_all_permissions())
            }
        })
    return JsonResponse({'authenticated': False}, status=401)

@csrf_protect
@require_http_methods(["POST"])
def session_logout(request):
    logout(request)
    return JsonResponse({'success': True})

@csrf_protect
@require_http_methods(["POST"])
def session_login_dev(request):
    if not settings.DEBUG:
        return JsonResponse({'error': 'Not available in production'}, status=403)
    
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({'success': True})
        return JsonResponse({'error': 'Invalid credentials'}, status=401)
    except Exception:
        return JsonResponse({'error': 'Bad request'}, status=400)
