// Set ADORNMENT_API_BASE_URL before this script when the API is hosted on a
// separate origin. Same-origin deployments use /api through the web proxy.
window.API_BASE_URL = window.ADORNMENT_API_BASE_URL ||
  (['localhost', '127.0.0.1'].includes(location.hostname)
    ? 'http://localhost:4000/api'
    : `${location.origin}/api`);
