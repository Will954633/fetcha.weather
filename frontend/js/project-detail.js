// Project Detail Page JavaScript

class ProjectDetailManager {
  constructor() {
    this.projectId = null;
    this.projectData = null;
    this.currentTab = 'overview';
    this.init();
  }

  init() {
    this.projectId = this.getProjectIdFromUrl();
    this.setupEventListeners();
    this.loadProjectData();
    this.initializeTabs();
  }

  getProjectIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || 'demo-project-1';
  }

  setupEventListeners() {
    // Navigation
    document.getElementById('backBtn')?.addEventListener('click', () => {
      window.location.href = 'dashboard.html';
    });

    document.getElementById('backToDashboard')?.addEventListener('click', () => {
      window.location.href = 'dashboard.html';
    });

    // User menu
    document.getElementById('userMenuBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const dropdown = document.getElementById('userDropdown');
      dropdown?.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      const dropdown = document.getElementById('userDropdown');
      dropdown?.classList.add('hidden');
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      localStorage.removeItem('currentUser');
      window.location.href = 'login.html';
    });

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Project actions
    document.getElementById('testParserBtn')?.addEventListener('click', () => {
      this.showTestParserModal();
    });

    document.getElementById('runProjectBtn')?.addEventListener('click', () => {
      this.runProject();
    });

    document.getElementById('projectSettingsBtn')?.addEventListener('click', () => {
      this.switchTab('settings');
    });

    // Parser editor actions
    document.getElementById('saveParserBtn')?.addEventListener('click', () => {
      this.saveParser();
    });

    document.getElementById('formatCodeBtn')?.addEventListener('click', () => {
      this.formatParserCode();
    });

    // Copy buttons
    document.getElementById('copyApiKey')?.addEventListener('click', () => {
      this.copyToClipboard('apiKey');
    });

    document.getElementById('copyEndpoint')?.addEventListener('click', () => {
      this.copyToClipboard('apiEndpoint');
    });

    // Settings form
    document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('deleteProjectBtn')?.addEventListener('click', () => {
      this.deleteProject();
    });

    // Test parser modal
    document.getElementById('closeTestModal')?.addEventListener('click', () => {
      this.hideTestParserModal();
    });

    document.getElementById('cancelTestBtn')?.addEventListener('click', () => {
      this.hideTestParserModal();
    });

    document.getElementById('runTestBtn')?.addEventListener('click', () => {
      this.runParserTest();
    });

    // Results filter
    document.getElementById('resultsFilter')?.addEventListener('change', (e) => {
      this.filterResults(e.target.value);
    });

    document.getElementById('refreshResults')?.addEventListener('click', () => {
      this.loadResults();
    });
  }

  initializeTabs() {
    // Show overview tab by default
    this.switchTab('overview');
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      }
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });

    const targetTab = document.getElementById(`${tabName}Tab`);
    if (targetTab) {
      targetTab.classList.add('active');
      this.currentTab = tabName;

      // Load tab-specific data
      this.loadTabData(tabName);
    }
  }

  loadTabData(tabName) {
    switch (tabName) {
      case 'overview':
        this.loadOverviewData();
        break;
      case 'parser':
        this.loadParserCode();
        break;
      case 'cleaned-html':
        this.loadCleanedHtmlTab();
        break;
      case 'results':
        this.loadResults();
        break;
      case 'analytics':
        this.loadAnalytics();
        break;
      case 'settings':
        this.loadSettings();
        break;
    }
  }

  async loadProjectData() {
    try {
      // Load user data
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      this.updateUserInfo(currentUser);

      // Load project data (mock data for now)
      this.projectData = this.getMockProjectData();
      this.updateProjectHeader();
      this.loadOverviewData();

    } catch (error) {
      console.error('Error loading project data:', error);
      this.showStatusMessage('Error loading project data', 'error');
    }
  }

  getMockProjectData() {
    const projects = {
      'demo-project-1': {
        id: 'demo-project-1',
        name: 'E-commerce Product Scraper',
        description: 'Extract product information from e-commerce websites',
        url: 'https://example-store.com',
        status: 'Active',
        created: '2025-08-10T10:00:00Z',
        updated: '2025-08-14T14:00:00Z',
        apiKey: 'fch_live_1234567890abcdef',
        totalRuns: 156,
        successRate: 94.2,
        avgResponseTime: 1250,
        lastRun: '2025-08-14T12:30:00Z',
        parserCode: `def extract_product_data(html_content):
    """
    Extract product information from e-commerce page
    """
    from bs4 import BeautifulSoup
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Extract product title
    title_elem = soup.find('h1', class_='product-title')
    title = title_elem.get_text(strip=True) if title_elem else None
    
    # Extract price
    price_elem = soup.find('span', class_='price')
    price = price_elem.get_text(strip=True) if price_elem else None
    
    # Extract description
    desc_elem = soup.find('div', class_='product-description')
    description = desc_elem.get_text(strip=True) if desc_elem else None
    
    # Extract images
    img_elems = soup.find_all('img', class_='product-image')
    images = [img.get('src') for img in img_elems if img.get('src')]
    
    # Extract availability
    stock_elem = soup.find('span', class_='stock-status')
    in_stock = 'in-stock' in stock_elem.get('class', []) if stock_elem else False
    
    return {
        'title': title,
        'price': price,
        'description': description,
        'images': images,
        'in_stock': in_stock,
        'extracted_at': datetime.now().isoformat()
    }`,
        parserVersion: '2.1',
        parserModel: 'gpt-4.1-mini',
        timeout: 30
      }
    };

    return projects[this.projectId] || projects['demo-project-1'];
  }

  updateUserInfo(user) {
    const userName = document.getElementById('userName');
    const userNameFull = document.getElementById('userNameFull');
    const userEmail = document.getElementById('userEmail');

    if (userName) userName.textContent = user.name || 'User';
    if (userNameFull) userNameFull.textContent = user.name || 'Demo User';
    if (userEmail) userEmail.textContent = user.email || 'demo@example.com';
  }

  updateProjectHeader() {
    if (!this.projectData) return;

    const projectName = document.getElementById('projectName');
    const projectTitle = document.getElementById('projectTitle');
    const projectUrl = document.getElementById('projectUrl');
    const projectStatus = document.getElementById('projectStatus');

    if (projectName) projectName.textContent = this.projectData.name;
    if (projectTitle) projectTitle.textContent = this.projectData.name;
    if (projectUrl) projectUrl.textContent = this.projectData.url;
    if (projectStatus) {
      projectStatus.textContent = this.projectData.status;
      projectStatus.className = `project-status ${this.projectData.status.toLowerCase()}`;
    }
  }

  loadOverviewData() {
    if (!this.projectData) return;

    // Update statistics
    const totalRuns = document.getElementById('totalRuns');
    const successRate = document.getElementById('successRate');
    const avgResponseTime = document.getElementById('avgResponseTime');
    const lastRun = document.getElementById('lastRun');

    if (totalRuns) totalRuns.textContent = this.projectData.totalRuns.toLocaleString();
    if (successRate) successRate.textContent = `${this.projectData.successRate}%`;
    if (avgResponseTime) avgResponseTime.textContent = `${this.projectData.avgResponseTime}ms`;
    if (lastRun) lastRun.textContent = this.formatRelativeTime(this.projectData.lastRun);

    // Update API information
    const apiKey = document.getElementById('apiKey');
    const apiEndpoint = document.getElementById('apiEndpoint');

    if (apiKey) apiKey.textContent = this.projectData.apiKey;
    if (apiEndpoint) {
      apiEndpoint.textContent = `https://api.fetcha.io/v1/projects/${this.projectData.id}/run`;
    }

    // Load recent activity
    this.loadRecentActivity();
  }

  loadRecentActivity() {
    const activityList = document.getElementById('recentActivity');
    if (!activityList) return;

    const activities = [
      {
        type: 'success',
        title: 'Parser executed successfully',
        time: '2025-08-14T12:30:00Z'
      },
      {
        type: 'info',
        title: 'Parser code updated',
        time: '2025-08-14T10:15:00Z'
      },
      {
        type: 'success',
        title: 'Test run completed',
        time: '2025-08-14T09:45:00Z'
      }
    ];

    activityList.innerHTML = activities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon ${activity.type}">
          ${this.getActivityIcon(activity.type)}
        </div>
        <div class="activity-content">
          <div class="activity-title">${activity.title}</div>
          <div class="activity-time">${this.formatRelativeTime(activity.time)}</div>
        </div>
      </div>
    `).join('');
  }

  getActivityIcon(type) {
    const icons = {
      success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"></polyline></svg>',
      info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
      error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
    };
    return icons[type] || icons.info;
  }

  loadParserCode() {
    const parserCode = document.getElementById('parserCode');
    const parserVersion = document.getElementById('parserVersion');
    const parserModel = document.getElementById('parserModel');
    const parserUpdated = document.getElementById('parserUpdated');

    if (parserCode && this.projectData) {
      parserCode.value = this.projectData.parserCode;
    }

    if (parserVersion && this.projectData) {
      parserVersion.textContent = this.projectData.parserVersion;
    }

    if (parserModel && this.projectData) {
      parserModel.textContent = this.projectData.parserModel;
    }

    if (parserUpdated && this.projectData) {
      parserUpdated.textContent = this.formatRelativeTime(this.projectData.updated);
    }
  }

  loadResults() {
    const resultsList = document.getElementById('resultsList');
    if (!resultsList) return;

    const results = [
      {
        id: 'result-1',
        status: 'success',
        title: 'Successful extraction',
        time: '2025-08-14T12:30:00Z',
        duration: '1.2s',
        fields: 5
      },
      {
        id: 'result-2',
        status: 'success',
        title: 'Successful extraction',
        time: '2025-08-14T11:45:00Z',
        duration: '0.9s',
        fields: 5
      },
      {
        id: 'result-3',
        status: 'error',
        title: 'Parser timeout',
        time: '2025-08-14T10:30:00Z',
        duration: '30.0s',
        fields: 0
      }
    ];

    resultsList.innerHTML = results.map(result => `
      <div class="result-item">
        <div class="result-status ${result.status}">
          ${this.getActivityIcon(result.status)}
        </div>
        <div class="result-content">
          <div class="result-title">${result.title}</div>
          <div class="result-meta">
            <span class="result-time">${this.formatRelativeTime(result.time)}</span>
            <span class="result-duration">${result.duration}</span>
            <span class="result-fields">${result.fields} fields extracted</span>
          </div>
        </div>
        <button class="result-view-btn" onclick="projectDetail.viewResult('${result.id}')">View</button>
      </div>
    `).join('');
  }

  loadAnalytics() {
    // Placeholder for analytics charts
    // In a real implementation, this would load Chart.js charts
    console.log('Loading analytics for project:', this.projectId);
  }

  loadSettings() {
    if (!this.projectData) return;

    const projectNameInput = document.getElementById('projectNameInput');
    const projectDescInput = document.getElementById('projectDescInput');
    const projectUrlInput = document.getElementById('projectUrlInput');
    const parserTimeout = document.getElementById('parserTimeout');

    if (projectNameInput) projectNameInput.value = this.projectData.name;
    if (projectDescInput) projectDescInput.value = this.projectData.description;
    if (projectUrlInput) projectUrlInput.value = this.projectData.url;
    if (parserTimeout) parserTimeout.value = this.projectData.timeout;
  }

  async saveParser() {
    const parserCode = document.getElementById('parserCode');
    if (!parserCode) return;

    try {
      this.showStatusMessage('Saving parser...', 'info');

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.projectData.parserCode = parserCode.value;
      this.projectData.updated = new Date().toISOString();

      this.showStatusMessage('Parser saved successfully', 'success');
      this.loadParserCode(); // Refresh parser info

    } catch (error) {
      console.error('Error saving parser:', error);
      this.showStatusMessage('Error saving parser', 'error');
    }
  }

  formatParserCode() {
    const parserCode = document.getElementById('parserCode');
    if (!parserCode) return;

    try {
      // Simple formatting - in a real implementation, use a proper Python formatter
      let code = parserCode.value;
      
      // Basic indentation fix
      const lines = code.split('\n');
      let indentLevel = 0;
      const formattedLines = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed.endsWith(':')) {
          const formatted = '    '.repeat(indentLevel) + trimmed;
          indentLevel++;
          return formatted;
        } else if (trimmed.startsWith('return') || trimmed.startsWith('except') || trimmed.startsWith('finally')) {
          indentLevel = Math.max(0, indentLevel - 1);
          return '    '.repeat(indentLevel) + trimmed;
        } else if (trimmed) {
          return '    '.repeat(indentLevel) + trimmed;
        }
        return '';
      });

      parserCode.value = formattedLines.join('\n');
      this.showStatusMessage('Code formatted', 'success');

    } catch (error) {
      console.error('Error formatting code:', error);
      this.showStatusMessage('Error formatting code', 'error');
    }
  }

  async runProject() {
    try {
      this.showStatusMessage('Running project...', 'info');

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      this.showStatusMessage('Project run completed successfully', 'success');
      this.loadResults(); // Refresh results

    } catch (error) {
      console.error('Error running project:', error);
      this.showStatusMessage('Error running project', 'error');
    }
  }

  showTestParserModal() {
    const modal = document.getElementById('testParserModal');
    const testUrl = document.getElementById('testUrl');
    
    if (modal) {
      modal.classList.remove('hidden');
      if (testUrl && this.projectData) {
        testUrl.value = this.projectData.url;
      }
    }
  }

  hideTestParserModal() {
    const modal = document.getElementById('testParserModal');
    const testResults = document.getElementById('testResults');
    
    if (modal) modal.classList.add('hidden');
    if (testResults) testResults.style.display = 'none';
  }

  async runParserTest() {
    const testUrl = document.getElementById('testUrl');
    const testResults = document.getElementById('testResults');
    const testOutput = document.getElementById('testOutput');

    if (!testUrl || !testUrl.value) {
      this.showStatusMessage('Please enter a test URL', 'error');
      return;
    }

    try {
      this.showStatusMessage('Running parser test...', 'info');

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockResult = {
        title: 'Sample Product Title',
        price: '$29.99',
        description: 'This is a sample product description...',
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        in_stock: true,
        extracted_at: new Date().toISOString()
      };

      if (testResults && testOutput) {
        testOutput.textContent = JSON.stringify(mockResult, null, 2);
        testResults.style.display = 'block';
      }

      this.showStatusMessage('Parser test completed successfully', 'success');

    } catch (error) {
      console.error('Error running parser test:', error);
      this.showStatusMessage('Error running parser test', 'error');
    }
  }

  async saveSettings() {
    const projectNameInput = document.getElementById('projectNameInput');
    const projectDescInput = document.getElementById('projectDescInput');
    const projectUrlInput = document.getElementById('projectUrlInput');
    const parserTimeout = document.getElementById('parserTimeout');

    try {
      this.showStatusMessage('Saving settings...', 'info');

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update project data
      if (projectNameInput) this.projectData.name = projectNameInput.value;
      if (projectDescInput) this.projectData.description = projectDescInput.value;
      if (projectUrlInput) this.projectData.url = projectUrlInput.value;
      if (parserTimeout) this.projectData.timeout = parseInt(parserTimeout.value);

      this.updateProjectHeader();
      this.showStatusMessage('Settings saved successfully', 'success');

    } catch (error) {
      console.error('Error saving settings:', error);
      this.showStatusMessage('Error saving settings', 'error');
    }
  }

  async deleteProject() {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      this.showStatusMessage('Deleting project...', 'info');

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      this.showStatusMessage('Project deleted successfully', 'success');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);

    } catch (error) {
      console.error('Error deleting project:', error);
      this.showStatusMessage('Error deleting project', 'error');
    }
  }

  copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const text = element.textContent;
    navigator.clipboard.writeText(text).then(() => {
      this.showStatusMessage('Copied to clipboard', 'success');
    }).catch(err => {
      console.error('Error copying to clipboard:', err);
      this.showStatusMessage('Error copying to clipboard', 'error');
    });
  }

  filterResults(filter) {
    const resultItems = document.querySelectorAll('.result-item');
    
    resultItems.forEach(item => {
      const status = item.querySelector('.result-status');
      const isSuccess = status?.classList.contains('success');
      const isError = status?.classList.contains('error');

      let show = true;
      if (filter === 'success' && !isSuccess) show = false;
      if (filter === 'error' && !isError) show = false;

      item.style.display = show ? 'flex' : 'none';
    });
  }

  viewResult(resultId) {
    // In a real implementation, this would open a detailed result view
    this.showStatusMessage(`Viewing result: ${resultId}`, 'info');
  }

  formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  }

  showStatusMessage(message, type = 'info') {
    const statusMessage = document.getElementById('statusMessage');
    if (!statusMessage) return;

    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.classList.remove('hidden');

    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusMessage.classList.add('hidden');
    }, 3000);
  }

  // Cleaned HTML Tab Functions
  loadCleanedHtmlTab() {
    // Set up event listeners for cleaned HTML tab
    this.setupCleanedHtmlEventListeners();
    
    // Reset the tab to initial state
    this.resetCleanedHtmlTab();
  }

  setupCleanedHtmlEventListeners() {
    // Generate Cleaned HTML button
    document.getElementById('generateCleanedHtmlBtn')?.addEventListener('click', () => {
      this.generateCleanedHtml();
    });

    // Copy Cleaned HTML button
    document.getElementById('copyCleanedHtmlBtn')?.addEventListener('click', () => {
      this.copyCleanedHtml();
    });

    // Download Cleaned HTML button
    document.getElementById('downloadCleanedHtmlBtn')?.addEventListener('click', () => {
      this.downloadCleanedHtml();
    });

    // Generate Parser & Extract JSON button
    document.getElementById('generateParserBtn')?.addEventListener('click', () => {
      this.generateParserAndExtractJson();
    });

    // JSON results actions
    document.getElementById('copyJsonBtn')?.addEventListener('click', () => {
      this.copyJsonOutput();
    });

    document.getElementById('downloadJsonBtn')?.addEventListener('click', () => {
      this.downloadJsonOutput();
    });
  }

  resetCleanedHtmlTab() {
    // Reset all elements to initial state
    const analysisContent = document.getElementById('analysisContent');
    const intentInfo = document.getElementById('intentInfo');
    const relevantLinks = document.getElementById('relevantLinks');
    const cleanedHtmlContent = document.getElementById('cleanedHtmlContent');
    const htmlStats = document.getElementById('htmlStats');
    const cleaningStatus = document.getElementById('cleaningStatus');

    if (analysisContent) {
      analysisContent.innerHTML = '<p class="placeholder-text">Click "Generate Cleaned HTML" to analyze the website with GPT-4.1 mini and get intelligent HTML cleaning based on user intent.</p>';
    }

    if (intentInfo) intentInfo.style.display = 'none';
    if (relevantLinks) relevantLinks.style.display = 'none';
    if (htmlStats) htmlStats.style.display = 'none';
    if (cleaningStatus) cleaningStatus.style.display = 'none';
    
    if (cleanedHtmlContent) {
      cleanedHtmlContent.value = '';
      cleanedHtmlContent.placeholder = 'Cleaned HTML will appear here after processing...';
    }
  }

  async generateCleanedHtml() {
    if (!this.projectData || !this.projectData.url) {
      this.showStatusMessage('No project URL available for cleaning', 'error');
      return;
    }

    const cleaningStatus = document.getElementById('cleaningStatus');
    const cleaningStatusText = document.getElementById('cleaningStatusText');
    const generateBtn = document.getElementById('generateCleanedHtmlBtn');

    try {
      // Show loading state
      if (cleaningStatus) cleaningStatus.style.display = 'block';
      if (cleaningStatusText) cleaningStatusText.textContent = 'Fetching raw HTML...';
      if (generateBtn) generateBtn.disabled = true;

      // First, we need to get raw HTML - simulate a demo job for now
      const demoJobId = await this.createDemoJob(this.projectData.url);
      
      if (cleaningStatusText) cleaningStatusText.textContent = 'Processing with GPT-4.1 mini...';

      // Wait for job completion and get cleaned HTML
      const cleanedResult = await this.getCleanedHtmlResult(demoJobId);

      // Update the UI with results
      this.displayCleanedHtmlResults(cleanedResult);

      this.showStatusMessage('HTML cleaned successfully with GPT-4.1 mini', 'success');

    } catch (error) {
      console.error('Error generating cleaned HTML:', error);
      this.showStatusMessage('Error generating cleaned HTML: ' + error.message, 'error');
    } finally {
      // Hide loading state
      if (cleaningStatus) cleaningStatus.style.display = 'none';
      if (generateBtn) generateBtn.disabled = false;
    }
  }

  async createDemoJob(url) {
    // Create a demo job to get raw HTML
    const response = await fetch('/demo/try', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        collection: 'camoufox_results'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create demo job');
    }

    const result = await response.json();
    return result.job_id;
  }

  async getCleanedHtmlResult(jobId) {
    // Poll for job completion
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(`/demo/jobs/${jobId}/stream`);
      
      if (statusResponse.ok) {
        // Job is running, wait a bit more
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
        continue;
      }

      // Try to get the cleaned result
      try {
        const resultResponse = await fetch(`/demo/results/${jobId}?gpt_cleaned=true`);
        
        if (resultResponse.ok) {
          return await resultResponse.json();
        }
      } catch (error) {
        // Continue polling
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Timeout waiting for job completion');
  }

  displayCleanedHtmlResults(result) {
    // Update analysis content
    const analysisContent = document.getElementById('analysisContent');
    if (analysisContent && result.analysis) {
      analysisContent.innerHTML = `<p>${result.analysis}</p>`;
    }

    // Update intent information
    const intentInfo = document.getElementById('intentInfo');
    const websiteType = document.getElementById('websiteType');
    const userIntent = document.getElementById('userIntent');
    const processingMethod = document.getElementById('processingMethod');

    if (intentInfo) {
      intentInfo.style.display = 'block';
      if (websiteType) websiteType.textContent = this.extractWebsiteType(result.analysis) || 'General';
      if (userIntent) userIntent.textContent = result.intent || 'Data extraction';
      if (processingMethod) processingMethod.textContent = result.processing_method || 'gpt-4.1-mini';
    }

    // Update relevant links
    const relevantLinks = document.getElementById('relevantLinks');
    const linksList = document.getElementById('linksList');

    if (relevantLinks && linksList && result.relevant_links && result.relevant_links.length > 0) {
      relevantLinks.style.display = 'block';
      linksList.innerHTML = result.relevant_links.map(link => `
        <div class="link-item">
          <a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.url}</a>
          <span class="link-description">${link.description}</span>
        </div>
      `).join('');
    }

    // Update cleaned HTML content
    const cleanedHtmlContent = document.getElementById('cleanedHtmlContent');
    if (cleanedHtmlContent && result.cleaned_html) {
      cleanedHtmlContent.value = result.cleaned_html;
      
      // Show the "Generate Parser & Extract JSON" button now that we have cleaned HTML
      const generateParserBtn = document.getElementById('generateParserBtn');
      if (generateParserBtn) {
        generateParserBtn.style.display = 'inline-flex';
      }
    }

    // Update HTML stats
    const htmlStats = document.getElementById('htmlStats');
    const originalSize = document.getElementById('originalSize');
    const cleanedSize = document.getElementById('cleanedSize');
    const sizeReduction = document.getElementById('sizeReduction');

    if (htmlStats && result.cleaned_html) {
      htmlStats.style.display = 'block';
      
      const originalLength = 50000; // Estimate - in real implementation, get from raw HTML
      const cleanedLength = result.cleaned_html.length;
      const reduction = Math.round((1 - cleanedLength / originalLength) * 100);

      if (originalSize) originalSize.textContent = this.formatBytes(originalLength);
      if (cleanedSize) cleanedSize.textContent = this.formatBytes(cleanedLength);
      if (sizeReduction) sizeReduction.textContent = `${reduction}%`;
    }
  }

  extractWebsiteType(analysis) {
    if (!analysis) return null;
    
    const lowerAnalysis = analysis.toLowerCase();
    if (lowerAnalysis.includes('e-commerce') || lowerAnalysis.includes('product')) return 'E-commerce';
    if (lowerAnalysis.includes('real estate') || lowerAnalysis.includes('property')) return 'Real Estate';
    if (lowerAnalysis.includes('news') || lowerAnalysis.includes('article')) return 'News/Content';
    if (lowerAnalysis.includes('job') || lowerAnalysis.includes('career')) return 'Job Listings';
    
    return 'General';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  copyCleanedHtml() {
    const cleanedHtmlContent = document.getElementById('cleanedHtmlContent');
    if (!cleanedHtmlContent || !cleanedHtmlContent.value) {
      this.showStatusMessage('No cleaned HTML to copy', 'error');
      return;
    }

    navigator.clipboard.writeText(cleanedHtmlContent.value).then(() => {
      this.showStatusMessage('Cleaned HTML copied to clipboard', 'success');
    }).catch(err => {
      console.error('Error copying to clipboard:', err);
      this.showStatusMessage('Error copying to clipboard', 'error');
    });
  }

  downloadCleanedHtml() {
    const cleanedHtmlContent = document.getElementById('cleanedHtmlContent');
    if (!cleanedHtmlContent || !cleanedHtmlContent.value) {
      this.showStatusMessage('No cleaned HTML to download', 'error');
      return;
    }

    const blob = new Blob([cleanedHtmlContent.value], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.projectData.name || 'cleaned'}_cleaned.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    this.showStatusMessage('Cleaned HTML downloaded', 'success');
  }

  async generateParserAndExtractJson() {
    const cleanedHtmlContent = document.getElementById('cleanedHtmlContent');
    if (!cleanedHtmlContent || !cleanedHtmlContent.value) {
      this.showStatusMessage('No cleaned HTML available. Please generate cleaned HTML first.', 'error');
      return;
    }

    const generateParserBtn = document.getElementById('generateParserBtn');
    const cleaningStatus = document.getElementById('cleaningStatus');
    const cleaningStatusText = document.getElementById('cleaningStatusText');

    try {
      // Show loading state
      if (cleaningStatus) cleaningStatus.style.display = 'block';
      if (cleaningStatusText) cleaningStatusText.textContent = 'Generating parser with Fetcha AI...';
      if (generateParserBtn) generateParserBtn.disabled = true;

      // Use the existing Fetcha AI system with cleaned HTML
      const aiResponse = await this.callFetchaAIWithCleanedHtml(
        cleanedHtmlContent.value, 
        this.projectData.url
      );

      // Update the parser code tab with the generated code
      this.updateParserCodeFromAI(aiResponse);

      // Switch to parser tab to show the generated code
      this.switchTab('parser');

      this.showStatusMessage('Parser generated and JSON extracted successfully!', 'success');

    } catch (error) {
      console.error('Error generating parser and extracting JSON:', error);
      this.showStatusMessage('Error generating parser: ' + error.message, 'error');
    } finally {
      // Hide loading state
      if (cleaningStatus) cleaningStatus.style.display = 'none';
      if (generateParserBtn) generateParserBtn.disabled = false;
    }
  }

  async callFetchaAIWithCleanedHtml(cleanedHtml, url) {
    // Create a conversation history that requests parser generation
    const history = [
      {
        role: "user",
        content: `Please analyze this cleaned HTML from ${url} and generate a Python parser that extracts all important data into JSON format. The HTML has already been cleaned by GPT-4.1 mini to focus on the most relevant content for data extraction.`
      }
    ];

    // Use the existing AI chat stream endpoint with cleaned HTML
    const response = await fetch('/ai/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        history: history,
        html: cleanedHtml,
        url: url
      })
    });

    if (!response.ok) {
      throw new Error('Failed to call Fetcha AI system');
    }

    // Parse the streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let aiResponse = '';
    let isComplete = false;
    let hasError = false;
    let errorMessage = '';

    while (!isComplete) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'progress') {
              // Update progress status
              const cleaningStatusText = document.getElementById('cleaningStatusText');
              if (cleaningStatusText) {
                cleaningStatusText.textContent = data.message;
              }
            } else if (data.type === 'complete') {
              aiResponse = data.response;
              isComplete = true;
              break;
            } else if (data.type === 'error') {
              hasError = true;
              errorMessage = data.message;
              isComplete = true;
              break;
            } else if (data.type === 'timeout') {
              hasError = true;
              errorMessage = data.message;
              isComplete = true;
              break;
            }
          } catch (e) {
            // Skip invalid JSON lines
            console.warn('Failed to parse streaming data:', line, e);
            continue;
          }
        }
      }
    }

    if (hasError) {
      throw new Error(errorMessage);
    }

    return aiResponse;
  }

  updateParserCodeFromAI(aiResponse) {
    console.log('AI Response received:', aiResponse.substring(0, 500) + '...');
    
    // First, check if this is a structured JSON response (not Python code)
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const extractedJson = JSON.parse(jsonMatch[1]);
        console.log('Found structured JSON output:', extractedJson);
        
        // This is structured data output, not parser code
        // Display it in the results section instead of trying to extract Python code
        this.displayStructuredOutput(extractedJson, aiResponse);
        return;
      } catch (e) {
        console.warn('Failed to parse JSON from response:', e);
      }
    }
    
    // Extract Python code from the AI response (only if no JSON found)
    const codeMatch = aiResponse.match(/```python\n([\s\S]*?)\n```/) || 
                     aiResponse.match(/```\n([\s\S]*?)\n```/);
    
    let extractedCode = '';
    if (codeMatch) {
      extractedCode = codeMatch[1];
    } else {
      // If no code blocks found, look for function definitions
      const functionMatch = aiResponse.match(/def\s+\w+\([\s\S]*?\n(?=\n\w|\n$|$)/);
      if (functionMatch) {
        extractedCode = functionMatch[0];
      } else {
        // Use the entire response as code if it looks like Python
        if (aiResponse.includes('def ') || aiResponse.includes('import ')) {
          extractedCode = aiResponse;
        }
      }
    }

    // Update the parser code textarea only if we found actual Python code
    const parserCode = document.getElementById('parserCode');
    if (parserCode && extractedCode) {
      parserCode.value = extractedCode;
      
      // Update project data
      this.projectData.parserCode = extractedCode;
      this.projectData.updated = new Date().toISOString();
      this.projectData.parserVersion = (parseFloat(this.projectData.parserVersion) + 0.1).toFixed(1);
      
      console.log('Updated parser code with', extractedCode.length, 'characters');
    } else {
      console.log('No Python code found in response, treating as structured output');
    }

    // Also extract and display any JSON results if present
    this.extractAndDisplayJsonResults(aiResponse);
  }
  displayStructuredOutput(jsonData, fullResponse) {
    console.log('Displaying structured output:', jsonData);
    
    // Create a new result entry for the structured output
    const resultData = {
      status: 'success',
      title: 'Structured data extraction completed',
      time: new Date().toISOString(),
      duration: '2.1s',
      fields: Object.keys(jsonData).length,
      jsonOutput: JSON.stringify(jsonData, null, 2)
    };
    
    // Add to results list
    this.addNewResult(resultData);
    
    // Switch to results tab to show the output
    this.switchTab('results');
    
    // Show success message
    this.showStatusMessage('Structured data extracted successfully! Check the Results tab.', 'success');
    
    // Log the successful extraction
    console.log('Structured extraction completed:', {
      fields: Object.keys(jsonData).length,
      dataTypes: Object.keys(jsonData).map(key => typeof jsonData[key]),
      responseLength: fullResponse.length
    });
  }

  extractAndDisplayJsonResults(aiResponse) {
    // Look for JSON output in the AI response
    const jsonMatches = aiResponse.match(/\{[\s\S]*?\}/g);
    
    if (jsonMatches && jsonMatches.length > 0) {
      // Try to find the largest, most complete JSON object
      let bestJson = '';
      let maxLength = 0;
      
      for (const match of jsonMatches) {
        try {
          const parsed = JSON.parse(match);
          if (match.length > maxLength && Object.keys(parsed).length > 2) {
            bestJson = JSON.stringify(parsed, null, 2);
            maxLength = match.length;
          }
        } catch (e) {
          // Skip invalid JSON
          continue;
        }
      }
      
      if (bestJson) {
        // Add a new result to the results list
        this.addNewResult({
          status: 'success',
          title: 'JSON extraction from cleaned HTML',
          time: new Date().toISOString(),
          duration: '2.1s',
          fields: Object.keys(JSON.parse(bestJson)).length,
          jsonOutput: bestJson
        });
      }
    }
  }

  addNewResult(result) {
    const resultsList = document.getElementById('resultsList');
    if (!resultsList) return;

    const resultHtml = `
      <div class="result-item">
        <div class="result-status ${result.status}">
          ${this.getActivityIcon(result.status)}
        </div>
        <div class="result-content">
          <div class="result-title">${result.title}</div>
          <div class="result-meta">
            <span class="result-time">${this.formatRelativeTime(result.time)}</span>
            <span class="result-duration">${result.duration}</span>
            <span class="result-fields">${result.fields} fields extracted</span>
          </div>
        </div>
        <button class="result-view-btn" onclick="projectDetail.viewJsonResult('${result.jsonOutput || ''}')">View JSON</button>
      </div>
    `;

    // Add to the top of the results list
    resultsList.insertAdjacentHTML('afterbegin', resultHtml);
  }

  viewJsonResult(jsonOutput) {
    if (!jsonOutput) {
      this.showStatusMessage('No JSON output available', 'error');
      return;
    }

    // Create a modal or new window to display the JSON
    const jsonWindow = window.open('', '_blank', 'width=800,height=600');
    jsonWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Extracted JSON Data</title>
        <style>
          body { font-family: 'Courier New', monospace; margin: 20px; }
          pre { background: #f5f5f5; padding: 20px; border-radius: 5px; overflow: auto; }
          h1 { color: #2c3e50; }
        </style>
      </head>
      <body>
        <h1>Extracted JSON Data</h1>
        <pre>${jsonOutput}</pre>
      </body>
      </html>
    `);
    jsonWindow.document.close();
  }

  copyJsonOutput() {
    const jsonOutput = document.getElementById('jsonOutput');
    if (!jsonOutput || !jsonOutput.value) {
      this.showStatusMessage('No JSON output to copy', 'error');
      return;
    }

    navigator.clipboard.writeText(jsonOutput.value).then(() => {
      this.showStatusMessage('JSON output copied to clipboard', 'success');
    }).catch(err => {
      console.error('Error copying JSON to clipboard:', err);
      this.showStatusMessage('Error copying JSON to clipboard', 'error');
    });
  }

  downloadJsonOutput() {
    const jsonOutput = document.getElementById('jsonOutput');
    if (!jsonOutput || !jsonOutput.value) {
      this.showStatusMessage('No JSON output to download', 'error');
      return;
    }

    const blob = new Blob([jsonOutput.value], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.projectData.name || 'extracted'}_data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    this.showStatusMessage('JSON output downloaded', 'success');
  }
}

// Initialize the project detail manager when the page loads
let projectDetail;
document.addEventListener('DOMContentLoaded', () => {
  projectDetail = new ProjectDetailManager();
});
