/**
 * Centralized Django API Client
 */

const API_BASE = '/api/v1';

function getCSRFToken() {
  const name = 'csrftoken=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase() || '')) {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers.set('X-CSRFToken', csrfToken);
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let err = 'API Error';
    try {
      const data = await response.json();
      err = data.error || data.detail || err;
    } catch (e) {
      // Ignore JSON parse error if response is not JSON
    }
    throw new Error(err);
  }

  // Handle 204 No Content
  if (response.status === 204) return null;

  return response.json();
}
