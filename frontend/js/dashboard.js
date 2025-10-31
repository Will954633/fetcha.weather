// Dashboard JavaScript functionality
let projects = [];
let userStats = {
  totalRequests: 0,
  activeProjects: 0,
  thisMonth: 0
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  if (!requireAuth()) return;
  
  // Initialize UI
  initializeUserInterface();
  initializeEventListeners();
  
  // Load data
  await loadUserData();
  await loadProjects();
  
  // Check for pending demo data and create first project if needed
  await handleDemoDataTransfer();
});

function initializeUserInterface() {
  const user = getUser();
  try {
    if (!user) {
      console.debug('initializeUserInterface: no user in localStorage');
      return;
    }

    const email = (typeof user.email === 'string') ? user.email : (user.email || '');
    const displayName = (user.full_name || user.name || (email ? email.split('@')[0] : '')) || '';
    const firstName = String(displayName).split(' ')[0] || '';

    const userNameEl = el('userName');
    const userNameFullEl = el('userNameFull');
    const userEmailEl = el('userEmail');

    if (userNameEl) userNameEl.textContent = firstName;
    if (userNameFullEl) userNameFullEl.textContent = displayName;
    if (userEmailEl) userEmailEl.textContent = email || '';
  } catch (err) {
    console.error('Error in initializeUserInterface:', err);
  }
}

function initializeEventListeners() {
  // User menu toggle
  const userMenuBtn = el('userMenuBtn');
  const userDropdown = el('userDropdown');
  
  userMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('hidden');
  });
  
  // Close dropdown when clicking outside
  onClickOutside(userDropdown, () => {
    userDropdown.classList.add('hidden');
  });
  
  // Logout button
  el('logoutBtn').addEventListener('click', logout);
  
  // New project buttons
  el('newProjectBtn').addEventListener('click', createNewProject);
  el('createFirstProjectBtn').addEventListener('click', createNewProject);
}

async function loadUserData() {
  try {
    // Check if we're in dev mode
    const isDevMode = localStorage.getItem('camoufox_dev_mode') === 'true';
    
    if (isDevMode) {
      // Load mock user data from localStorage
      const userData = JSON.parse(localStorage.getItem('camoufox_user') || '{}');
      
      userStats = {
        totalRequests: userData.stats?.total_requests || 0,
        activeProjects: userData.stats?.active_projects || 0,
        thisMonth: userData.stats?.monthly_requests || 0
      };
      
      updateStatsDisplay();
    } else {
      // Production mode - make API call
      const response = await apiRequest('/auth/me');
      if (response && response.ok) {
        const userData = await response.json();
        
        // Update user stats
        userStats = {
          totalRequests: userData.usage?.total_requests || 0,
          activeProjects: userData.project_count || 0,
          thisMonth: userData.usage?.monthly_requests || 0
        };
        
        updateStatsDisplay();
      }
    }
  } catch (error) {
    console.error('Failed to load user data:', error);
  }
}

async function loadProjects() {
  try {
    showProjectsLoading();
    
    // Call MongoDB-backed API endpoint
    const response = await apiRequest('/api/projects');
    if (response && response.ok) {
      const data = await response.json();
      projects = data.projects || [];
      
      // Update active projects count
      userStats.activeProjects = projects.length;
      updateStatsDisplay();
      
      displayProjects();
    } else {
      showProjectsError();
    }
  } catch (error) {
    console.error('Failed to load projects:', error);
    showProjectsError();
  }
}

function showProjectsLoading() {
  el('projectsLoading').classList.remove('hidden');
  el('emptyState').classList.add('hidden');
  el('projectsGrid').classList.add('hidden');
}

function showProjectsError() {
  el('projectsLoading').classList.add('hidden');
  el('emptyState').classList.add('hidden');
  el('projectsGrid').classList.add('hidden');
  showStatus('Failed to load projects. Please refresh the page.', 'error');
}

function displayProjects() {
  el('projectsLoading').classList.add('hidden');
  
  // Update project count
  el('projectCount').textContent = projects.length;
  
  if (projects.length === 0) {
    el('emptyState').classList.remove('hidden');
    el('projectsGrid').classList.add('hidden');
  } else {
    el('emptyState').classList.add('hidden');
    el('projectsGrid').classList.remove('hidden');
    
    // Render project cards
    const projectsGrid = el('projectsGrid');
    projectsGrid.innerHTML = '';
    
    projects.forEach(project => {
      const projectCard = createProjectCard(project);
      projectsGrid.appendChild(projectCard);
    });
  }
}

function createProjectCard(project) {
  const card = document.createElement('div');
  card.className = 'project-card';
  card.dataset.projectId = project.id || project._id;
  
  // Truncate description for display
  const description = project.description || 'No description available';
  const truncatedDescription = truncateText(description, 100);
  
  // Format dates
  const createdDate = formatDate(project.created_at);
  const lastUsed = project.last_used ? timeAgo(project.last_used) : 'Never';
  
  // Truncate API key for display
  const apiKeyDisplay = project.api_key ? 
    `${project.api_key.substring(0, 8)}...${project.api_key.substring(-4)}` : 
    'No API key';
  
  // Check if extraction results exist
  const hasResults = project.extraction_results && project.extraction_results.data;
  const itemCount = hasResults ? project.extraction_results.metadata?.item_count || 0 : 0;
  const extractedAt = hasResults ? formatDate(project.extraction_results.extracted_at) : null;
  
  card.innerHTML = `
    <div class="project-header">
      <div class="project-info">
        <h4>${project.name}</h4>
        <p>${truncatedDescription}</p>
      </div>
      <div class="project-menu">
        <button class="project-menu-btn" onclick="toggleProjectMenu('${project.id || project._id}', event)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="12" cy="5" r="1"></circle>
            <circle cx="12" cy="19" r="1"></circle>
          </svg>
        </button>
      </div>
    </div>
    
    ${(project.url || project.settings?.url) ? `
      <div class="project-url">${project.url || project.settings.url}</div>
    ` : ''}
    
    <div class="project-meta">
      <span>Created ${createdDate}</span>
      <span>Last used ${lastUsed}</span>
    </div>
    
    <!-- Extraction Status -->
    <div class="extraction-status">
      ${hasResults ? `
        <span class="status-badge success">
          ✅ Data Available (${itemCount} items)
        </span>
        <small>Last extracted: ${extractedAt}</small>
      ` : `
        <span class="status-badge pending">
          ⏳ No extraction yet
        </span>
      `}
    </div>
    
    <!-- Export Methods -->
    <div class="export-methods">
      <h4>📊 Export Data:</h4>
      <div class="export-buttons">
        <button 
          class="btn-export btn-csv"
          onclick="event.stopPropagation(); exportCSV('${project._id}', '${project.api_key}')"
          ${!hasResults ? 'disabled' : ''}>
          📄 CSV
        </button>
        
        <button 
          class="btn-export btn-json"
          onclick="event.stopPropagation(); exportJSON('${project._id}', '${project.api_key}')"
          ${!hasResults ? 'disabled' : ''}>
          📦 JSON
        </button>
        
        <button 
          class="btn-export btn-sheets"
          onclick="event.stopPropagation(); exportSheets('${project._id}', '${project.api_key}')"
          ${!hasResults ? 'disabled' : ''}>
          📊 Google Sheets
        </button>
      </div>
    </div>
    
    <!-- Run Extraction Button -->
    <button 
      class="btn-run-extraction"
      onclick="event.stopPropagation(); runExtraction('${project._id}')">
      ${hasResults ? '🔄 Re-run Extraction' : '▶️ Run First Extraction'}
    </button>
    
    <div class="project-api-key">
      <span class="api-key-text">${apiKeyDisplay}</span>
      <button class="copy-btn" onclick="copyApiKey('${project.api_key}')" title="Copy API key">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    </div>
  `;
  
  // Add click handler to open project details
  card.addEventListener('click', (e) => {
    // Don't navigate if clicking on menu, copy button, export, or extraction buttons
    if (e.target.closest('.project-menu-btn') || 
        e.target.closest('.copy-btn') ||
        e.target.closest('.btn-export') ||
        e.target.closest('.btn-run-extraction')) {
      return;
    }
    openProjectDetails(project._id);
  });
  
  return card;
}

function updateStatsDisplay() {
  el('totalRequests').textContent = userStats.totalRequests.toLocaleString();
  el('activeProjects').textContent = userStats.activeProjects.toLocaleString();
  el('thisMonth').textContent = userStats.thisMonth.toLocaleString();
}

async function handleDemoDataTransfer() {
  const demoData = getDemoData();
  if (demoData && demoData.url) {
    try {
      // Create project from demo data
      const projectData = {
        name: generateProjectName(demoData.url),
        description: `Data extraction project for ${extractDomain(demoData.url)}`,
        settings: {
          url: demoData.url,
          extracted_data: demoData.extractedData ? JSON.parse(demoData.extractedData) : null,
          parser_code: demoData.parserCode || '',
          html_content: demoData.htmlContent || ''
        }
      };
      
      const response = await apiRequest('/projects/', {
        method: 'POST',
        body: JSON.stringify(projectData)
      });
      
      if (response && response.ok) {
        const newProject = await response.json();
        showStatus('Your demo project has been saved!', 'success');
        
        // Clear demo data
        clearDemoData();
        
        // Reload projects to show the new one
        await loadProjects();
        
        // Update stats
        userStats.activeProjects++;
        updateStatsDisplay();
      }
    } catch (error) {
      console.error('Failed to create project from demo data:', error);
    }
  }
}

function createNewProject() {
  // Clear any existing demo data to ensure clean state
  localStorage.removeItem('camoufox_pending_project');
  
  // Add debug logging
  console.log('Dashboard: createNewProject called - redirecting to new-project-rebuild/new-project-v2.html');
  
  // Navigate to new project page
  window.location.href = 'new-project-rebuild/new-project-v2.html';
}

function openProjectDetails(projectId) {
  // Navigate to project detail page
  window.location.href = `project-detail.html?id=${projectId}`;
}

async function copyApiKey(apiKey) {
  if (apiKey) {
    await copyToClipboard(apiKey);
  }
}

// State to track currently open menu
let currentOpenMenu = null;

function toggleProjectMenu(projectId, event) {
  event.stopPropagation();
  
  // Close any existing menu
  if (currentOpenMenu && currentOpenMenu !== projectId) {
    closeProjectMenu(currentOpenMenu);
  }
  
  // Check if menu already exists
  const existingMenu = document.getElementById(`project-menu-${projectId}`);
  if (existingMenu) {
    closeProjectMenu(projectId);
    return;
  }
  
  // Find the project data
  const project = projects.find(p => (p.id || p._id) === projectId);
  if (!project) {
    console.error('Project not found:', projectId);
    return;
  }
  
  // Create dropdown menu
  const menu = document.createElement('div');
  menu.id = `project-menu-${projectId}`;
  menu.className = 'project-dropdown-menu';
  menu.innerHTML = `
    <button class="menu-item" data-action="edit">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
      Edit Project
    </button>
    <div class="menu-divider"></div>
    <button class="menu-item danger" data-action="delete">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
      Delete Project
    </button>
  `;
  
  // Add click handlers
  menu.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = item.dataset.action;
      closeProjectMenu(projectId);
      
      switch(action) {
        case 'edit':
          showEditProjectModal(project);
          break;
        case 'delete':
          showDeleteConfirmation(project);
          break;
      }
    });
  });
  
  // Find the project menu button container
  const projectCard = document.querySelector(`[data-project-id="${projectId}"]`);
  const menuContainer = projectCard?.querySelector('.project-menu');
  
  if (menuContainer) {
    menuContainer.appendChild(menu);
    currentOpenMenu = projectId;
    
    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', function closeOnOutside() {
        closeProjectMenu(projectId);
        document.removeEventListener('click', closeOnOutside);
      });
    }, 0);
  }
}

function closeProjectMenu(projectId) {
  const menu = document.getElementById(`project-menu-${projectId}`);
  if (menu) {
    menu.remove();
  }
  if (currentOpenMenu === projectId) {
    currentOpenMenu = null;
  }
}

function showEditProjectModal(project) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'edit-project-modal';
  
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>Edit Project</h3>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="edit-project-name">Project Name</label>
          <input type="text" id="edit-project-name" value="${project.name || ''}" />
        </div>
        <div class="form-group">
          <label for="edit-project-description">Description (optional)</label>
          <textarea id="edit-project-description" rows="3">${project.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="edit-project-url">Target URL</label>
          <input type="text" id="edit-project-url" value="${project.target_url || project.url || ''}" class="readonly" readonly />
        </div>
      </div>
      <div class="modal-footer">
        <button class="modal-btn modal-btn-secondary" data-action="cancel">Cancel</button>
        <button class="modal-btn modal-btn-primary" data-action="save">Save Changes</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Focus on name input
  setTimeout(() => {
    document.getElementById('edit-project-name').focus();
  }, 100);
  
  // Handle actions
  overlay.addEventListener('click', async (e) => {
    if (e.target === overlay || e.target.closest('[data-action="cancel"]')) {
      overlay.remove();
    } else if (e.target.closest('[data-action="save"]')) {
      await handleEditProject(project._id || project.id);
    }
  });
}

async function handleEditProject(projectId) {
  const name = document.getElementById('edit-project-name').value.trim();
  const description = document.getElementById('edit-project-description').value.trim();
  
  if (!name) {
    showStatus('Project name is required', 'error');
    return;
  }
  
  try {
    const response = await apiRequest(`/api/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description })
    });
    
    if (response && response.ok) {
      // Close modal
      document.getElementById('edit-project-modal').remove();
      
      // Show success message
      showStatus('Project updated successfully', 'success');
      
      // Reload projects
      await loadProjects();
    } else {
      const error = await response.text();
      showStatus(`Failed to update project: ${error}`, 'error');
    }
  } catch (error) {
    console.error('Failed to update project:', error);
    showStatus('Failed to update project. Please try again.', 'error');
  }
}

function showDeleteConfirmation(project) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'delete-project-modal';
  
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>Delete Project</h3>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to delete <strong>"${project.name}"</strong>?</p>
        <p class="warning">This action cannot be undone. All project data and settings will be permanently deleted.</p>
      </div>
      <div class="modal-footer">
        <button class="modal-btn modal-btn-secondary" data-action="cancel">Cancel</button>
        <button class="modal-btn modal-btn-danger" data-action="delete">Delete Project</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Handle actions
  overlay.addEventListener('click', async (e) => {
    if (e.target === overlay || e.target.closest('[data-action="cancel"]')) {
      overlay.remove();
    } else if (e.target.closest('[data-action="delete"]')) {
      await handleDeleteProject(project._id || project.id);
    }
  });
}

async function handleDeleteProject(projectId) {
  try {
    const response = await apiRequest(`/api/projects/${projectId}`, {
      method: 'DELETE'
    });
    
    if (response && response.ok) {
      // Close modal
      document.getElementById('delete-project-modal').remove();
      
      // Show success message
      showStatus('Project deleted successfully', 'success');
      
      // Reload projects
      await loadProjects();
      
      // Update stats
      userStats.activeProjects--;
      updateStatsDisplay();
    } else {
      const error = await response.text();
      showStatus(`Failed to delete project: ${error}`, 'error');
    }
  } catch (error) {
    console.error('Failed to delete project:', error);
    showStatus('Failed to delete project. Please try again.', 'error');
  }
}

// ========== EXTRACTION FUNCTIONS ==========

let currentJobId = null;
let currentProjectId = null;
let extractionWebSocket = null;
let timerInterval = null;
let startTime = null;
let targetDomain = '';
let isModalMinimized = false;

async function runExtraction(projectId) {
  try {
    currentProjectId = projectId;
    
    // Show progress modal
    showExtractionProgressModal();
    
    // Reset progress
    updateExtractionProgress(1, 0, 'Initializing extraction...');
    clearProgressLog();
    
    console.log('🚀 Starting extraction for project:', projectId);
    
    // Use production API endpoint (port 8000 - main.py backend)
    const url = `http://127.0.0.1:8000/api/new-project/projects/${projectId}/run-extraction`;
    console.log('📡 Calling endpoint:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Server error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText || 'Server error'}`);
    }
    
    const result = await response.json();
    const job_id = result.job_id;
    currentJobId = job_id;
    
    console.log('✅ Extraction started:', job_id);
    
    // Start timer
    startExtractionTimer();
    
    // Connect WebSocket for progress updates
    connectProgressWebSocket(job_id);
    
  } catch (error) {
    console.error('❌ Failed to start extraction:', error);
    
    let errorMessage = error.message;
    
    // Check if it's a network error (server not running)
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      errorMessage = 'Cannot connect to extraction server. Please ensure:\n\n' +
                    '1. Production API server is running on port 8080\n' +
                    '2. Run: python production_api.py\n\n' +
                    'Original error: ' + error.message;
    }
    
    alert('Failed to start extraction:\n\n' + errorMessage);
    closeProgressModal();
  }
}

function connectProgressWebSocket(jobId) {
  const wsUrl = `ws://127.0.0.1:8000/api/new-project/ws/${jobId}`;
  
  extractionWebSocket = new WebSocket(wsUrl);
  
  extractionWebSocket.onopen = () => {
    console.log('🔌 WebSocket connected');
    addToProgressLog('Connected to extraction server');
  };
  
  extractionWebSocket.onmessage = (event) => {
    const update = JSON.parse(event.data);
    handleProgressUpdate(update);
  };
  
  extractionWebSocket.onerror = (error) => {
    console.error('❌ WebSocket error:', error);
    addToProgressLog('Connection error', 'error');
  };
  
  extractionWebSocket.onclose = () => {
    console.log('🔌 WebSocket closed');
  };
}

function handleProgressUpdate(update) {
  console.log('📊 Progress update received:', JSON.stringify(update, null, 2));
  
  // Log what fields are present
  console.log('  - Has phase:', update.phase !== undefined);
  console.log('  - Has percentage:', update.percentage !== undefined);
  console.log('  - Has message:', !!update.message);
  console.log('  - Has stage:', !!update.stage);
  
  // Update phase and progress
  if (update.phase !== undefined && update.percentage !== undefined) {
    console.log(`  ➡️ Updating UI: Phase ${update.phase}, ${update.percentage}%`);
    updateExtractionProgress(update.phase, update.percentage, update.message || 'Processing...');
  }
  
  // Add to log
  if (update.message) {
    console.log(`  ➡️ Adding to log: ${update.message}`);
    addToProgressLog(update.message, update.percentage);
  }
  
  // Handle completion
  if (update.stage === 'saved_to_mongodb' || update.stage === 'complete') {
    console.log('  ✅ Extraction complete! Stopping timer...');
    stopExtractionTimer();
    handleExtractionComplete();
  }
  
  // Handle errors
  if (update.stage === 'error') {
    console.log('  ❌ Error detected:', update.message);
    stopExtractionTimer();
    addToProgressLog('❌ ' + update.message, 'error');
  }
}

function handleExtractionComplete() {
  addToProgressLog('✅ Extraction complete! Refreshing dashboard...', 100);
  
  // Close modal and refresh after 2 seconds
  setTimeout(() => {
    closeProgressModal();
    location.reload(); // Refresh to show new export buttons
  }, 2000);
}

// ========== EXPORT FUNCTIONS ==========

async function exportCSV(projectId, apiKey) {
  try {
    const response = await fetch(`http://127.0.0.1:8000/api/export/projects/${projectId}/csv`, {
      headers: {
        'X-API-Key': apiKey
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Export failed');
    }
    
    const blob = await response.blob();
    downloadFile(blob, `export_${projectId}.csv`);
    
    console.log('✅ CSV downloaded');
    showStatus('CSV file downloaded successfully', 'success');
    
  } catch (error) {
    console.error('❌ CSV export failed:', error);
    showStatus('CSV export failed: ' + error.message, 'error');
  }
}

async function exportJSON(projectId, apiKey) {
  try {
    // Get extraction results from MongoDB via API
    const response = await fetch(`http://127.0.0.1:8000/api/projects/${projectId}`, {
      headers: {
        'X-API-Key': apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch results');
    }
    
    const projectData = await response.json();
    const results = projectData.extraction_results?.data || {};
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    downloadFile(blob, `export_${projectId}.json`);
    
    console.log('✅ JSON downloaded');
    showStatus('JSON file downloaded successfully', 'success');
    
  } catch (error) {
    console.error('❌ JSON export failed:', error);
    showStatus('JSON export failed: ' + error.message, 'error');
  }
}

async function exportSheets(projectId, apiKey) {
  try {
    const response = await fetch(`http://127.0.0.1:8000/api/export/projects/${projectId}/google-sheets`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      
      // Check if needs authorization
      if (response.status === 403) {
        const authResponse = await fetch(`http://127.0.0.1:8000/api/export/google-sheets/auth`);
        const authData = await authResponse.json();
        
        window.open(authData.auth_url, '_blank');
        showStatus('Please authorize Google Sheets access in the popup window, then try again.', 'error');
        return;
      }
      
      throw new Error(error.detail || 'Export failed');
    }
    
    const result = await response.json();
    
    // Open spreadsheet in new tab
    window.open(result.spreadsheet_url, '_blank');
    console.log('✅ Opened in Google Sheets');
    showStatus('Spreadsheet opened in Google Sheets', 'success');
    
  } catch (error) {
    console.error('❌ Google Sheets export failed:', error);
    showStatus('Google Sheets export failed: ' + error.message, 'error');
  }
}

// ========== UTILITY FUNCTIONS ==========

function showExtractionProgressModal() {
  document.getElementById('extractionProgressModal').classList.remove('hidden');
}

function closeProgressModal() {
  document.getElementById('extractionProgressModal').classList.add('hidden');
  
  // Clean up
  if (extractionWebSocket) {
    extractionWebSocket.close();
    extractionWebSocket = null;
  }
  
  stopExtractionTimer();
}

function updateExtractionProgress(phase, percentage, message) {
  document.getElementById('currentPhase').textContent = phase;
  document.getElementById('progressFill').style.width = percentage + '%';
  document.getElementById('progressPercentage').textContent = percentage + '%';
  
  const statusEl = document.querySelector('.status-message-modal');
  if (statusEl) {
    statusEl.textContent = message;
  }
}

function addToProgressLog(message, percentage) {
  const log = document.getElementById('progressLog');
  const timestamp = new Date().toLocaleTimeString();
  const percentText = percentage !== undefined ? ` (${percentage}%)` : '';
  
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = `[${timestamp}] ${message}${percentText}`;
  
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function clearProgressLog() {
  document.getElementById('progressLog').innerHTML = '';
}

function startExtractionTimer() {
  startTime = Date.now();
  updateExtractionTimer();
  timerInterval = setInterval(updateExtractionTimer, 1000);
}

function stopExtractionTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateExtractionTimer() {
  if (!startTime) return;
  
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  
  document.getElementById('elapsedTimer').textContent = 
    `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function downloadFile(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Global functions for inline event handlers
window.toggleProjectMenu = toggleProjectMenu;
window.copyApiKey = copyApiKey;
window.runExtraction = runExtraction;
window.exportCSV = exportCSV;
window.exportJSON = exportJSON;
window.exportSheets = exportSheets;
window.closeProgressModal = closeProgressModal;
