/*
Enhanced New Project JavaScript
Version: v1.0 • Updated: 2025-08-28 17:26 AEST (Brisbane)

This file provides the complete interactive functionality for the new-project page,
including AI chat, code iteration, HTML toggle, and full workflow parity with the home page.
*/

(function() {
  'use strict';

  // Global state management
  let currentJobId = null;
  let currentUrl = '';
  let rawHtmlContent = '';
  let cleanedHtmlContent = '';
  let currentHtmlType = 'cleaned';
  let chatHistory = [];
  let isProcessing = false;

  // Safe element selector
  const el = (id) => document.getElementById(id);

  // API request helper
  const apiRequest = async (endpoint, options = {}) => {
    const baseUrl = window.API_BASE || 'http://127.0.0.1:8000';
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Add authentication headers if user is logged in
    const token = localStorage.getItem('camoufox_access_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const mergedOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    };

    return fetch(baseUrl + endpoint, mergedOptions);
  };

  // Status message helper
  const showStatus = (message, type = 'info', duration = 5000) => {
    let statusEl = el('statusMessage');
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.id = 'statusMessage';
      statusEl.className = 'status-message';
      document.body.appendChild(statusEl);
    }

    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.classList.remove('hidden');

    if (duration > 0) {
      setTimeout(() => {
        statusEl.classList.add('hidden');
      }, duration);
    }
  };

  // Initialize tab functionality
  function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        
        // Update active tab button
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active tab pane
        tabPanes.forEach(pane => pane.classList.remove('active'));
        const targetPane = el(targetTab + 'Tab');
        if (targetPane) {
          targetPane.classList.add('active');
        }
      });
    });
  }

  // Initialize HTML toggle functionality
  function initializeHtmlToggle() {
    const cleanedToggle = el('cleanedToggle');
    const rawToggle = el('rawToggle');
    const sourceHtml = el('sourceHtml');
    const htmlContentTitle = el('htmlContentTitle');

    if (!cleanedToggle || !rawToggle || !sourceHtml) return;

    cleanedToggle.addEventListener('click', () => {
      currentHtmlType = 'cleaned';
      cleanedToggle.classList.add('active');
      rawToggle.classList.remove('active');
      sourceHtml.textContent = cleanedHtmlContent || '(No cleaned HTML available)';
      htmlContentTitle.textContent = 'Cleaned HTML Content:';
    });

    rawToggle.addEventListener('click', () => {
      currentHtmlType = 'raw';
      rawToggle.classList.add('active');
      cleanedToggle.classList.remove('active');
      sourceHtml.textContent = rawHtmlContent || '(No raw HTML available)';
      htmlContentTitle.textContent = 'Raw HTML Content:';
    });
  }

  // Update progress steps
  function updateProgressStep(stepNumber) {
    for (let i = 1; i <= 4; i++) {
      const step = el(`step${i}`);
      if (step) {
        if (i <= stepNumber) {
          step.classList.add('active');
        } else {
          step.classList.remove('active');
        }
      }
    }

    // Update progress bar
    const progressFill = el('progressFill');
    if (progressFill) {
      const percentage = (stepNumber / 4) * 100;
      progressFill.style.width = `${percentage}%`;
    }
  }

  // Update progress text
  function updateProgressText(text) {
    const progressText = el('progressText');
    if (progressText) {
      progressText.textContent = text;
    }
  }

  // Add chat message to the UI
  function addChatMessage(content, role = 'assistant') {
    const chatMessages = el('chatMessages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = `message-avatar ${role}`;
    avatar.textContent = role === 'user' ? 'U' : 'AI';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Handle markdown-style code blocks
    if (content.includes('```')) {
      messageContent.innerHTML = formatMessageContent(content);
    } else {
      messageContent.textContent = content;
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Format message content with code blocks
  function formatMessageContent(content) {
    // Simple markdown-style code block formatting
    return content
      .replace(/```json\s*([\s\S]*?)\s*```/g, '<pre>$1</pre>')
      .replace(/```python\s*([\s\S]*?)\s*```/g, '<pre>$1</pre>')
      .replace(/```\s*([\s\S]*?)\s*```/g, '<pre>$1</pre>')
      .replace(/\n/g, '<br>');
  }

  // Add progress message to chat
  function addProgressMessage(message) {
    const chatMessages = el('chatMessages');
    if (!chatMessages) return;

    // Remove any existing progress message
    const existingProgress = chatMessages.querySelector('.chat-progress');
    if (existingProgress) {
      existingProgress.remove();
    }

    const progressDiv = document.createElement('div');
    progressDiv.className = 'chat-progress';
    progressDiv.innerHTML = `
      <div class="chat-progress-spinner"></div>
      <div class="chat-progress-text">${message}</div>
    `;

    chatMessages.appendChild(progressDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Remove progress message from chat
  function removeProgressMessage() {
    const chatMessages = el('chatMessages');
    if (!chatMessages) return;

    const progressDiv = chatMessages.querySelector('.chat-progress');
    if (progressDiv) {
      progressDiv.remove();
    }
  }

  // Send chat message to AI
  async function sendChatMessage(message) {
    if (isProcessing || !message.trim()) return;

    isProcessing = true;
    const sendBtn = el('sendChatBtn');
    const chatInput = el('chatInput');
    
    // Disable input
    if (sendBtn) sendBtn.disabled = true;
    if (chatInput) chatInput.disabled = true;

    // Add user message to chat
    addChatMessage(message, 'user');
    chatHistory.push({ role: 'user', content: message });

    // Clear input
    if (chatInput) chatInput.value = '';

    try {
      // Prepare request data
      const requestData = {
        history: chatHistory,
        html: cleanedHtmlContent || rawHtmlContent || '',
        url: currentUrl
      };

      // Use streaming endpoint for real-time progress
      const response = await fetch(`${window.API_BASE || 'http://127.0.0.1:8000'}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(localStorage.getItem('camoufox_access_token') ? {
            'Authorization': `Bearer ${localStorage.getItem('camoufox_access_token')}`
          } : {})
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress') {
                addProgressMessage(data.message);
              } else if (data.type === 'complete') {
                removeProgressMessage();
                addChatMessage(data.response, 'assistant');
                chatHistory.push({ role: 'assistant', content: data.response });
                
                // Update extracted data if JSON is present in response
                updateExtractedDataFromResponse(data.response);
              } else if (data.type === 'error') {
                removeProgressMessage();
                addChatMessage(`Error: ${data.message}`, 'assistant');
                showStatus(`AI Error: ${data.message}`, 'error');
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', line);
            }
          }
        }
      }

    } catch (error) {
      removeProgressMessage();
      console.error('Chat error:', error);
      addChatMessage(`I encountered an error: ${error.message}. Please try again.`, 'assistant');
      showStatus(`Chat Error: ${error.message}`, 'error');
    } finally {
      isProcessing = false;
      if (sendBtn) sendBtn.disabled = false;
      if (chatInput) chatInput.disabled = false;
      if (chatInput) chatInput.focus();
    }
  }

  // Update extracted data from AI response
  function updateExtractedDataFromResponse(response) {
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        const extractedDataEl = el('extractedData');
        if (extractedDataEl) {
          extractedDataEl.textContent = JSON.stringify(jsonData, null, 2);
        }
        
        // Update global state
        window.gptCleaningResult = {
          ...window.gptCleaningResult,
          extracted_data: jsonData
        };
      } catch (e) {
        console.warn('Failed to parse JSON from AI response:', e);
      }
    }
  }

  // Initialize AI chat functionality
  function initializeAIChat() {
    const chatInput = el('chatInput');
    const sendBtn = el('sendChatBtn');

    if (!chatInput || !sendBtn) return;

    // Send message on button click
    sendBtn.addEventListener('click', () => {
      const message = chatInput.value.trim();
      if (message) {
        sendChatMessage(message);
      }
    });

    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (message) {
          sendChatMessage(message);
        }
      }
    });
  }

  // Show AI chat section after initial extraction
  function showAIChat() {
    const aiChatSection = el('aiChatSection');
    if (aiChatSection) {
      aiChatSection.classList.remove('hidden');
      
      // Add initial AI message if chat is empty
      if (chatHistory.length === 0) {
        const initialMessage = "I've completed the initial data extraction. You can now ask me to modify the extraction, add more fields, remove unwanted data, or focus on specific elements. What would you like me to change?";
        addChatMessage(initialMessage, 'assistant');
        chatHistory.push({ role: 'assistant', content: initialMessage });
      }
    }
  }

  // Enhanced extraction flow - integrate with existing demo.js
  function enhanceExistingExtraction() {
    // Don't override the existing extraction flow, just enhance it
    // The demo.js already handles the extraction properly
    console.log('Enhanced extraction integration ready');
  }

  // Generate browser fingerprint
  async function generateFingerprint() {
    const components = [
      navigator.userAgent || '',
      navigator.language || '',
      screen.width + 'x' + screen.height,
      screen.colorDepth || '',
      Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    ].join('||');

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(components);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (err) {
      console.warn('Fingerprint generation failed:', err);
      return Date.now() + '_' + Math.random().toString(36).slice(2, 10);
    }
  }

  // Poll for extraction results
  async function pollForResults(jobId, maxAttempts = 30, interval = 2000) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // First try to get GPT cleaned results
        const cleanedResponse = await fetch(`${window.API_BASE || 'http://127.0.0.1:8000'}/demo/results/${jobId}?gpt_cleaned=true`, {
          cache: 'no-cache'
        });

        if (cleanedResponse.ok) {
          const cleanedData = await cleanedResponse.json();
          
          // Check if this is actual results or just status
          if (cleanedData.detail && cleanedData.detail.includes('Job status:')) {
            // Still processing, continue polling
            updateProgressText('Processing with AI...');
          } else if (cleanedData.cleaned_html || cleanedData.analysis) {
            // Got actual results
            updateProgressStep(3);
            updateProgressText('Generating parser code...');

            // Also fetch raw HTML
            try {
              const rawResponse = await fetch(`${window.API_BASE || 'http://127.0.0.1:8000'}/demo/results/${jobId}`, {
                cache: 'no-cache'
              });
              const rawHtml = rawResponse.ok ? await rawResponse.text() : '';
              
              return {
                cleaned_html: cleanedData.cleaned_html || '',
                raw_html: rawHtml,
                analysis: cleanedData.analysis || '',
                relevant_links: cleanedData.relevant_links || [],
                processing_method: cleanedData.processing_method || 'gpt-4.1-mini',
                url: cleanedData.url || url
              };
            } catch (e) {
              console.warn('Failed to fetch raw HTML:', e);
              return {
                cleaned_html: cleanedData.cleaned_html || '',
                raw_html: '',
                analysis: cleanedData.analysis || '',
                relevant_links: cleanedData.relevant_links || [],
                processing_method: cleanedData.processing_method || 'gpt-4.1-mini',
                url: cleanedData.url || url
              };
            }
          }
        } else if (cleanedResponse.status === 202) {
          // Still processing
          updateProgressText('AI is analyzing the page...');
        }

      } catch (error) {
        console.warn(`Polling attempt ${attempt + 1} failed:`, error);
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    return null;
  }

  // Display extraction results
  function displayResults(results) {
    const resultsSection = el('resultsSection');
    const extractedData = el('extractedData');
    const generatedCode = el('generatedCode');
    const sourceHtml = el('sourceHtml');

    if (!resultsSection) return;

    // Show results section
    resultsSection.classList.remove('hidden');

    // Display extracted data (create initial JSON structure)
    const initialData = {
      website_type: results.analysis ? "Analyzed by GPT-4.1 mini" : "General website",
      url: results.url || currentUrl,
      processing_method: results.processing_method || 'gpt-4.1-mini',
      cleaned_html_length: results.cleaned_html ? results.cleaned_html.length : 0,
      relevant_links_found: results.relevant_links ? results.relevant_links.length : 0,
      analysis: results.analysis || 'No analysis available'
    };

    if (extractedData) {
      extractedData.textContent = JSON.stringify(initialData, null, 2);
    }

    // Display generated code (placeholder for now)
    if (generatedCode) {
      generatedCode.textContent = `# Generated Parser Code
# This will be populated by the AI chat system when you request specific extractions

def parse_website(html, url):
    """
    AI-generated parser for ${currentUrl}
    Processing method: ${results.processing_method || 'gpt-4.1-mini'}
    """
    # Parser code will be generated based on your specific requests
    # Use the AI chat below to specify what data you want to extract
    pass
`;
    }

    // Display HTML content (default to cleaned)
    if (sourceHtml) {
      sourceHtml.textContent = results.cleaned_html || results.raw_html || '(No HTML content available)';
    }

    // Store global state
    window.currentJobId = currentJobId;
    window.rawHtmlContent = results.raw_html || '';
    window.cleanedHtmlContent = results.cleaned_html || '';
    window.gptCleaningResult = results;

    // Hide progress section
    const progressSection = el('progressSection');
    if (progressSection) {
      setTimeout(() => {
        progressSection.classList.add('hidden');
      }, 1000);
    }
  }

  // Sync state with demo.js global variables
  function syncWithDemoState() {
    if (window.currentJobId) currentJobId = window.currentJobId;
    if (window.rawHtmlContent) rawHtmlContent = window.rawHtmlContent;
    if (window.cleanedHtmlContent) cleanedHtmlContent = window.cleanedHtmlContent;
    if (window.gptCleaningResult && window.gptCleaningResult.url) currentUrl = window.gptCleaningResult.url;
  }

  // Initialize the enhanced new project functionality
  function initializeEnhancedNewProject() {
    // Initialize tabs
    initializeTabs();

    // Initialize HTML toggle
    initializeHtmlToggle();

    // Initialize AI chat
    initializeAIChat();

    // Don't override extract button - let demo.js handle it
    // Just sync state when extraction completes
    
    // Enhanced try another button functionality
    const tryAnotherBtn = el('tryAnotherBtn');
    if (tryAnotherBtn) {
      // Add event listener that doesn't conflict with demo.js
      tryAnotherBtn.addEventListener('click', () => {
        // Reset enhanced state
        const aiChatSection = el('aiChatSection');
        if (aiChatSection) aiChatSection.classList.add('hidden');

        // Reset chat state
        const chatMessages = el('chatMessages');
        if (chatMessages) chatMessages.innerHTML = '';
        
        chatHistory = [];
        currentJobId = null;
        currentUrl = '';
        rawHtmlContent = '';
        cleanedHtmlContent = '';
      });
    }

    // Monitor for state changes from demo.js
    const observer = new MutationObserver(() => {
      syncWithDemoState();
    });

    // Watch for changes to results section
    const resultsSection = el('resultsSection');
    if (resultsSection) {
      observer.observe(resultsSection, { 
        attributes: true, 
        attributeFilter: ['class'] 
      });
    }

    console.log('Enhanced new project functionality initialized');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancedNewProject);
  } else {
    initializeEnhancedNewProject();
  }

  // Expose functions globally for compatibility
  window.enhancedNewProject = {
    sendChatMessage,
    showAIChat,
    addChatMessage,
    updateExtractedDataFromResponse
  };

})();
