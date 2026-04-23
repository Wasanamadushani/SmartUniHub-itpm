const configuredApiBaseUrl =
  import.meta.env.VITE_NODE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5001/api';

const API_BASE_URL = configuredApiBaseUrl.replace(/\/$/, '');

console.log('API_BASE_URL:', API_BASE_URL);

export async function apiRequest(path, options = {}) {
  const fullUrl = `${API_BASE_URL}${path}`;
  console.log('Fetching:', fullUrl);
  
  const response = await fetch(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage = typeof payload === 'string' ? payload : payload.message || 'Request failed';
    throw new Error(errorMessage);
  }

  return payload;
}

export { API_BASE_URL };
