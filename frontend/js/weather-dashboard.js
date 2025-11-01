/**
 * Fetcha Weather - Dashboard JavaScript
 * Version: v1.0 • Updated: 2025-10-28 19:41 AEST (Brisbane)
 * 
 * Handles all dashboard functionality including:
 * - User session management
 * - API key management
 * - Weather queries
 * - Usage statistics
 * - UI interactions
 */

// ================================
// Global State
// ================================

let currentUser = null;
let currentApiKeys = [];
let currentStats = null;
let lastQueryResult = null;

// ================================
// Initialization
// ================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🌤️ Fetcha Weather Dashboard initializing...');
  
  // Check authentication
  const token = localStorage.getItem('jwt_token');
  if (!token) {
    console.log('No JWT token found, redirecting to login...');
    window.location.href = 'login.html';
    return;
  }
  
  // Initialize dashboard
  try {
    await loadCurrentUser();
    await loadUsageStats();
    await loadApiKeys();
    await loadRecentQueries();
    setupEventListeners();
    setupDefaultDates();
    console.log('✅ Dashboard initialized successfully');
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      showStatus('Session expired. Please login again.', 'error');
      setTimeout(() => {
        localStorage.removeItem('jwt_token');
        window.location.href = 'login.html';
      }, 2000);
    } else {
      showStatus('Failed to load dashboard. Please refresh the page.', 'error');
    }
  }
});

// ================================
// User Management
// ================================

async function loadCurrentUser() {
  console.log('Loading current user...');
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch(`${window.API_BASE}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to load user: ${response.status}`);
  }
  
  const data = await response.json();
  currentUser = data.user;
  
  // Update UI
  document.getElementById('userName').textContent = currentUser.full_name.split(' ')[0];
  document.getElementById('userNameFull').textContent = currentUser.full_name;
  document.getElementById('userEmail').textContent = currentUser.email;
  document.getElementById('userTier').textContent = `${currentUser.tier.charAt(0).toUpperCase() + currentUser.tier.slice(1)} Tier`;
  
  console.log('✅ User loaded:', currentUser.email);
}

async function loadUsageStats() {
  console.log('Loading usage statistics...');
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch(`${window.API_BASE}/usage/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    console.error('Failed to load stats');
    return;
  }
  
  const data = await response.json();
  currentStats = data;
  
  // Update UI
  document.getElementById('requestsThisMonth').textContent = data.total_requests || 0;
  document.getElementById('quotaRemaining').textContent = calculateQuotaRemaining(data);
  document.getElementById('avgResponseTime').textContent = Math.round(data.avg_response_time_ms || 0);
  
  console.log('✅ Stats loaded:', data.total_requests, 'requests this month');
}

function calculateQuotaRemaining(stats) {
  const quotas = {
    'free': 100,
    'pro': 5000,
    'enterprise': 999999
  };
  
  const monthlyQuota = quotas[currentUser?.tier || 'free'];
  const used = stats.total_requests || 0;
  return Math.max(0, monthlyQuota - used);
}

// ================================
// API Key Management
// ================================

async function loadApiKeys() {
  console.log('Loading API keys...');
  const token = localStorage.getItem('jwt_token');
  
  document.getElementById('keysLoading').classList.remove('hidden');
  document.getElementById('apiKeysList').classList.add('hidden');
  document.getElementById('keysEmptyState').classList.add('hidden');
  
  try {
    const response = await fetch(`${window.API_BASE}/keys`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load API keys');
    }
    
    const data = await response.json();
    currentApiKeys = data.api_keys || [];
    
    document.getElementById('keysLoading').classList.add('hidden');
    
    if (currentApiKeys.length === 0) {
      document.getElementById('keysEmptyState').classList.remove('hidden');
    } else {
      renderApiKeys();
      document.getElementById('apiKeysList').classList.remove('hidden');
    }
    
    console.log('✅ Loaded', currentApiKeys.length, 'API keys');
  } catch (error) {
    document.getElementById('keysLoading').classList.add('hidden');
    console.error('Error loading API keys:', error);
    showStatus('Failed to load API keys', 'error');
  }
}

function renderApiKeys() {
  const container = document.getElementById('apiKeysList');
  
  container.innerHTML = currentApiKeys.map(key => `
    <div class="api-key-card">
      <div class="api-key-header">
        <div>
          <div class="api-key-name">${key.name || 'Unnamed Key'}</div>
          <div class="api-key-id">ID: ${key.id}</div>
        </div>
        <div class="api-key-actions">
          <button class="btn-icon" onclick="copyApiKey('${key.key_value}')" title="Copy key">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="btn-icon btn-danger" onclick="deleteApiKey(${key.id})" title="Delete key">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="api-key-value-section">
        <code class="api-key-value">${key.key_value}</code>
        <button class="btn-icon" onclick="copyApiKey('${key.key_value}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
      
      <div class="api-key-meta">
        <div class="api-key-meta-item">
          <div class="api-key-meta-label">Created</div>
          <div class="api-key-meta-value">${formatDate(key.created_at)}</div>
        </div>
        <div class="api-key-meta-item">
          <div class="api-key-meta-label">Last Used</div>
          <div class="api-key-meta-value">${key.last_used ? formatDate(key.last_used) : 'Never'}</div>
        </div>
        <div class="api-key-meta-item">
          <div class="api-key-meta-label">Status</div>
          <div class="api-key-meta-value">${key.is_active ? '✅ Active' : '❌ Inactive'}</div>
        </div>
      </div>
    </div>
  `).join('');
}

async function copyApiKey(key) {
  try {
    await navigator.clipboard.writeText(key);
    showStatus('API key copied to clipboard!', 'success');
  } catch (error) {
    console.error('Copy failed:', error);
    showStatus('Failed to copy API key', 'error');
  }
}

async function deleteApiKey(keyId) {
  if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
    return;
  }
  
  const token = localStorage.getItem('jwt_token');
  
  try {
    const response = await fetch(`${window.API_BASE}/keys/${keyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete API key');
    }
    
    showStatus('API key deleted successfully', 'success');
    await loadApiKeys();
  } catch (error) {
    console.error('Delete error:', error);
    showStatus('Failed to delete API key', 'error');
  }
}

// ================================
// Generate API Key
// ================================

function openGenerateKeyModal() {
  document.getElementById('generateKeyModal').classList.remove('hidden');
  document.getElementById('keyName').value = '';
  document.getElementById('keyName').focus();
}

function closeGenerateKeyModal() {
  document.getElementById('generateKeyModal').classList.add('hidden');
}

async function generateApiKey() {
  const keyName = document.getElementById('keyName').value.trim();
  const token = localStorage.getItem('jwt_token');
  
  try {
    const response = await fetch(`${window.API_BASE}/keys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: keyName || 'Untitled Key'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate API key');
    }
    
    const data = await response.json();
    const newKey = data.key_value;  // Backend returns key_value, not api_key.key
    
    closeGenerateKeyModal();
    showNewApiKey(newKey);
    await loadApiKeys();
    
  } catch (error) {
    console.error('Generate key error:', error);
    showStatus(error.message, 'error');
  }
}

function showNewApiKey(key) {
  document.getElementById('newApiKeyValue').textContent = key;
  document.getElementById('showKeyModal').classList.remove('hidden');
}

function closeShowKeyModal() {
  document.getElementById('showKeyModal').classList.add('hidden');
}

async function copyNewKey() {
  const key = document.getElementById('newApiKeyValue').textContent;
  await copyApiKey(key);
}

// ================================
// Weather Query
// ================================

function setupDefaultDates() {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  document.getElementById('queryDateFrom').valueAsDate = weekAgo;
  document.getElementById('queryDateTo').valueAsDate = today;
}

async function runWeatherQuery() {
  const location = document.getElementById('queryLocation').value.trim();
  const state = document.getElementById('queryState').value;
  const dateFrom = document.getElementById('queryDateFrom').value;
  const dateTo = document.getElementById('queryDateTo').value;
  
  // Validation
  if (!location) {
    showStatus('Please enter a location', 'error');
    return;
  }
  
  if (!state) {
    showStatus('Please select a state', 'error');
    return;
  }
  
  if (!dateFrom || !dateTo) {
    showStatus('Please select date range', 'error');
    return;
  }
  
  // Get the first API key
  if (currentApiKeys.length === 0) {
    showStatus('Please generate an API key first', 'error');
    return;
  }
  
  const apiKey = currentApiKeys[0].key_value;
  
  // Show loading state
  const testBtn = document.getElementById('testQueryBtn');
  const originalText = testBtn.innerHTML;
  testBtn.disabled = true;
  testBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="loading-spinner">
      <circle cx="12" cy="12" r="10"></circle>
    </svg>
    Querying...
  `;
  
  try {
    const params = new URLSearchParams({
      location: location,
      state: state,
      date_from: dateFrom,
      date_to: dateTo
    });
    
    const response = await fetch(`${window.API_BASE}/weather/location?${params}`, {
      headers: {
        'X-API-Key': apiKey
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Query failed');
    }
    
    lastQueryResult = data;
    displayQueryResults(data);
    await loadUsageStats(); // Refresh stats
    await loadRecentQueries(); // Refresh recent queries
    
    showStatus('Weather data retrieved successfully!', 'success');
    
  } catch (error) {
    console.error('Query error:', error);
    showStatus(error.message, 'error');
  } finally {
    testBtn.disabled = false;
    testBtn.innerHTML = originalText;
  }
}

function displayQueryResults(data) {
  const resultsDiv = document.getElementById('queryResults');
  const contentDiv = document.getElementById('queryResultsContent');
  
  // Update metadata
  document.getElementById('resultStation').textContent = data.station_id || 'Unknown';
  document.getElementById('resultCount').textContent = data.data.length;
  document.getElementById('resultTime').textContent = data.meta.response_time_ms + 'ms';
  
  if (data.cached) {
    document.getElementById('resultCached').classList.remove('hidden');
  } else {
    document.getElementById('resultCached').classList.add('hidden');
  }
  
  // Format data as table
  if (data.data && data.data.length > 0) {
    const firstRecord = data.data[0];
    const headers = Object.keys(firstRecord);
    
    let tableHTML = `
      <table class="weather-data-table">
        <thead>
          <tr>${headers.map(h => `<th>${formatHeader(h)}</th>`).join('')}</tr>
        </thead>
        <tbody>
    `;
    
    data.data.forEach(record => {
      tableHTML += '<tr>';
      headers.forEach(header => {
        const value = record[header] || '-';
        tableHTML += `<td>${value}</td>`;
      });
      tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody></table>';
    contentDiv.innerHTML = tableHTML;
  } else {
    contentDiv.innerHTML = '<p class="text-muted">No data available for the selected dates.</p>';
  }
  
  resultsDiv.classList.remove('hidden');
  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function formatHeader(str) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function clearQueryForm() {
  document.getElementById('queryLocation').value = '';
  document.getElementById('queryState').value = '';
  setupDefaultDates();
  document.getElementById('queryResults').classList.add('hidden');
}

async function copyResults() {
  if (!lastQueryResult) return;
  
  try {
    const jsonStr = JSON.stringify(lastQueryResult, null, 2);
    await navigator.clipboard.writeText(jsonStr);
    showStatus('Results copied to clipboard!', 'success');
  } catch (error) {
    console.error('Copy failed:', error);
    showStatus('Failed to copy results', 'error');
  }
}

function downloadResults(format = 'json') {
  if (!lastQueryResult) return;
  
  const timestamp = new Date().toISOString().split('T')[0];
  const location = lastQueryResult.location || 'weather-data';
  const filename = `${location.replace(/[^a-z0-9]/gi, '_')}_${timestamp}`;
  
  let content, mimeType, extension;
  
  switch(format) {
    case 'csv':
      content = convertToCSV(lastQueryResult.data);
      mimeType = 'text/csv';
      extension = 'csv';
      break;
    case 'excel':
      content = convertToExcel(lastQueryResult.data);
      mimeType = 'application/vnd.ms-excel';
      extension = 'xls';
      break;
    case 'json':
    default:
      content = JSON.stringify(lastQueryResult, null, 2);
      mimeType = 'application/json';
      extension = 'json';
  }
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showStatus(`Data downloaded as ${extension.toUpperCase()}!`, 'success');
}

function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const csv = [headers.join(',')];
  
  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in values
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csv.push(values.join(','));
  });
  
  return csv.join('\n');
}

function convertToExcel(data) {
  if (!data || data.length === 0) return '';
  
  // Create simple HTML table format (opens in Excel)
  const headers = Object.keys(data[0]);
  
  let html = '<table border="1">\n';
  html += '<thead><tr>';
  headers.forEach(h => {
    html += `<th>${formatHeader(h)}</th>`;
  });
  html += '</tr></thead>\n<tbody>\n';
  
  data.forEach(row => {
    html += '<tr>';
    headers.forEach(header => {
      const value = row[header] || '';
      html += `<td>${value}</td>`;
    });
    html += '</tr>\n';
  });
  
  html += '</tbody>\n</table>';
  return html;
}

// ================================
// Recent Queries
// ================================

async function loadRecentQueries() {
  console.log('Loading recent queries...');
  const token = localStorage.getItem('jwt_token');
  
  document.getElementById('recentLoading').classList.remove('hidden');
  document.getElementById('recentQueriesTable').classList.add('hidden');
  document.getElementById('recentEmptyState').classList.add('hidden');
  
  try {
    const response = await fetch(`${window.API_BASE}/usage/recent?limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load recent queries');
    }
    
    const data = await response.json();
    const queries = data.recent_requests || [];
    
    document.getElementById('recentLoading').classList.add('hidden');
    
    if (queries.length === 0) {
      document.getElementById('recentEmptyState').classList.remove('hidden');
    } else {
      renderRecentQueries(queries);
      document.getElementById('recentQueriesTable').classList.remove('hidden');
    }
    
    console.log('✅ Loaded', queries.length, 'recent queries');
  } catch (error) {
    document.getElementById('recentLoading').classList.add('hidden');
    console.error('Error loading recent queries:', error);
  }
}

function renderRecentQueries(queries) {
  const tbody = document.getElementById('recentQueriesBody');
  
  tbody.innerHTML = queries.map(query => `
    <tr>
      <td>${query.location || '-'}, ${query.state || '-'}</td>
      <td>${query.date_from || '-'} to ${query.date_to || '-'}</td>
      <td>-</td>
      <td>${query.response_time_ms || '-'}ms</td>
      <td>
        <span class="status-badge ${query.status_code === 200 ? 'status-success' : 'status-error'}">
          ${query.status_code === 200 ? 'Success' : 'Error'}
        </span>
      </td>
      <td>${formatDateTime(query.timestamp)}</td>
    </tr>
  `).join('');
}

// ================================
// Event Listeners
// ================================

function setupEventListeners() {
  // User menu
  document.getElementById('userMenuBtn').addEventListener('click', toggleUserMenu);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  
  // API Key generation
  document.getElementById('generateKeyBtn').addEventListener('click', openGenerateKeyModal);
  document.getElementById('generateFirstKeyBtn').addEventListener('click', openGenerateKeyModal);
  document.getElementById('confirmGenerateKeyBtn').addEventListener('click', generateApiKey);
  document.getElementById('copyNewKeyBtn').addEventListener('click', copyNewKey);
  document.getElementById('closeShowKeyBtn').addEventListener('click', closeShowKeyModal);
  
  // Weather query
  document.getElementById('testQueryBtn').addEventListener('click', runWeatherQuery);
  document.getElementById('clearQueryBtn').addEventListener('click', clearQueryForm);
  document.getElementById('copyResultsBtn').addEventListener('click', copyResults);
  document.getElementById('downloadResultsBtn').addEventListener('click', downloadResults);
  
  // Click outside to close dropdowns
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
      document.getElementById('userDropdown').classList.add('hidden');
    }
  });
}

function toggleUserMenu() {
  document.getElementById('userDropdown').classList.toggle('hidden');
}

function handleLogout() {
  localStorage.removeItem('jwt_token');
  showStatus('Logged out successfully', 'success');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 1000);
}

// ================================
// Utility Functions
// ================================

function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('statusMessage');
  statusDiv.textContent = message;
  statusDiv.className = `status-message status-${type}`;
  statusDiv.classList.remove('hidden');
  
  setTimeout(() => {
    statusDiv.classList.add('hidden');
  }, 5000);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('en-AU', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ================================
// Export for global access
// ================================

window.copyApiKey = copyApiKey;
window.deleteApiKey = deleteApiKey;
window.closeGenerateKeyModal = closeGenerateKeyModal;
window.closeShowKeyModal = closeShowKeyModal;
