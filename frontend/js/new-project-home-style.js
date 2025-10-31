/*
New Project - Home Page Style JavaScript
Version: v1.0 • Updated: 2025-08-28 18:46 AEST (Brisbane)

This file replicates the exact functionality of the home page (index.html) but with 
authentication integration for the new-project page. It includes:
- Identical UI behavior and styling
- Same extraction workflow
- AI chat functionality
- HTML toggle feature
- Project saving with API key generation
*/

(function() {
  'use strict';

  // Global state variables (matching home page)
  let currentJobId = null;
  let rawHtmlContent = '';
  let cleanedHtmlContent = '';
  let currentHtmlType = 'cleaned';
  let gptCleaningResult = null;
  let chatHistory = [];
  let isProcessing = false;

  // API configuration
  const API_BASE = 'http://127.0.0.1:8000';

  // Utility functions
  const el = (id) => document.getElementById(id);
  
  const showStatus = (message, type = 'info') => {
    const status = el('status');
    if (status) {
      status.textContent = message;
      status.className = `status ${type}`;
      status.classList.remove('hidden');
      setTimeout(() => status.classList.add('hidden'), 5000);
    }
  };

  // Generate fingerprint hash (matching home page)
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

  // Submit demo job (matching home page)
  async function submitDemoJob(url, fingerprint) {
    const response = await fetch(`${API_BASE}/demo/try`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('camoufox_access_token')}`
      },
      body: JSON.stringify({
        url: url,
        fingerprint_hash: fingerprint
      })
    });

    if (!response.ok) {
      throw new Error(`Demo request failed: ${response.status}`);
    }

    return await response.json();
  }

  // Poll for results (using robust logic from demo.js)
  async function pollForResults(jobId, timeoutMs = 90000, pollInterval = 2500) {
    const cleanedUrl = `${API_BASE}/demo/results/${jobId}?gpt_cleaned=true`;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        const resp = await fetch(cleanedUrl, { cache: 'no-cache' });
        if (resp.ok) {
          try {
            const data = await resp.json();
            // Check if this is actual results or just status
            if (data.detail && data.detail.includes("Job status:")) {
              console.warn("pollForResults: received status response, continuing to poll...");
              // This is just a status response, continue polling
            } else if (data.cleaned_html || data.analysis || data.processing_method) {
              // This looks like actual results
              console.log("pollForResults: received actual results");
              
              // Also fetch raw HTML
              try {
                const rawUrl = `${API_BASE}/demo/results/${jobId}`;
                const rawResp = await fetch(rawUrl, { cache: 'no-cache' });
                const rawHtml = rawResp.ok ? await rawResp.text() : '';
                
                return {
                  cleaned: data,
                  raw: rawHtml
                };
              } catch (e) {
                console.warn('Failed to fetch raw HTML:', e);
                return {
                  cleaned: data,
                  raw: ''
                };
              }
            } else {
              console.warn("pollForResults: received unexpected response format", data);
            }
          } catch (e) {
            // Not JSON - skip
            console.warn("pollForResults: response not JSON yet");
          }
        } else if (resp.status === 202) {
          // still processing
          console.debug('pollForResults: 202 status, still processing');
        } else {
          // server returned non-202/non-200 - ignore and continue polling
          console.debug('pollForResults: non-ok status', resp.status);
        }
      } catch (err) {
        console.warn('pollForResults fetch error', err);
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    return null;
  }

  // Initialize HTML toggle functionality (matching home page)
  function initializeHtmlToggle() {
    const cleanedToggle = el('cleanedToggle');
    const rawToggle = el('rawToggle');
    const htmlContent = el('htmlContent');
    const htmlContentTitle = el('htmlContentTitle');
    const downloadBtn = el('downloadHtmlBtn');
    const downloadBtnText = el('downloadBtnText');

    if (!cleanedToggle || !rawToggle || !htmlContent) return;

    cleanedToggle.addEventListener('click', () => {
      currentHtmlType = 'cleaned';
      cleanedToggle.classList.add('active');
      cleanedToggle.style.background = '#007bff';
      cleanedToggle.style.color = 'white';
      rawToggle.classList.remove('active');
      rawToggle.style.background = 'transparent';
      rawToggle.style.color = '#666';
      
      htmlContent.value = cleanedHtmlContent || '(No cleaned HTML available)';
      htmlContentTitle.textContent = 'Cleaned HTML Content:';
      if (downloadBtnText) downloadBtnText.textContent = 'Download Cleaned HTML';
    });

    rawToggle.addEventListener('click', () => {
      currentHtmlType = 'raw';
      rawToggle.classList.add('active');
      rawToggle.style.background = '#007bff';
      rawToggle.style.color = 'white';
      cleanedToggle.classList.remove('active');
      cleanedToggle.style.background = 'transparent';
      cleanedToggle.style.color = '#666';
      
      htmlContent.value = rawHtmlContent || '(No raw HTML available)';
      htmlContentTitle.textContent = 'Raw HTML Content:';
      if (downloadBtnText) downloadBtnText.textContent = 'Download Raw HTML';
    });

    // Download functionality
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        const content = htmlContent.value;
        const filename = currentHtmlType === 'cleaned' ? 'cleaned.html' : 'raw.html';
        
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }
  }

  // Initialize AI chat functionality (matching home page)
  function initializeAIChat() {
    const chatInput = el('chatInput');
    const sendBtn = el('sendChatBtn');
    const chatMessages = el('chatMessages');

    if (!chatInput || !sendBtn || !chatMessages) return;

    // Send message function
    const sendMessage = async () => {
      const message = chatInput.value.trim();
      if (!message || isProcessing) return;

      isProcessing = true;
      sendBtn.disabled = true;
      chatInput.disabled = true;

      // Add user message to chat
      addChatMessage(message, 'user');
      chatHistory.push({ role: 'user', content: message });
      chatInput.value = '';

      try {
        // Send to AI chat stream endpoint
        const response = await fetch(`${API_BASE}/ai/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Authorization': `Bearer ${localStorage.getItem('camoufox_access_token')}`
          },
          body: JSON.stringify({
            history: chatHistory,
            html: cleanedHtmlContent || rawHtmlContent || '',
            url: el('url').value.trim()
          })
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
          buffer = lines.pop();

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'progress') {
                  updateChatStatus(data.message);
                } else if (data.type === 'complete') {
                  updateChatStatus('');
                  addChatMessage(data.response, 'assistant');
                  chatHistory.push({ role: 'assistant', content: data.response });
                  
                  // Update JSON display if response contains JSON
                  updateJsonFromResponse(data.response);
                } else if (data.type === 'error') {
                  updateChatStatus('');
                  addChatMessage(`Error: ${data.message}`, 'assistant');
                }
              } catch (e) {
                console.warn('Failed to parse SSE data:', line);
              }
            }
          }
        }

      } catch (error) {
        console.error('Chat error:', error);
        addChatMessage(`I encountered an error: ${error.message}. Please try again.`, 'assistant');
        updateChatStatus('');
      } finally {
        isProcessing = false;
        sendBtn.disabled = false;
        chatInput.disabled = false;
        chatInput.focus();
      }
    };

    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Add chat message (matching home page style)
  function addChatMessage(content, role) {
    const chatMessages = el('chatMessages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      margin-bottom: 16px;
      padding: 12px;
      border-radius: 8px;
      max-width: 85%;
      word-wrap: break-word;
      ${role === 'user' 
        ? 'background: #007bff; color: white; margin-left: auto; text-align: right;' 
        : 'background: #f1f3f4; color: #333; margin-right: auto;'
      }
    `;

    // Handle code blocks in content
    if (content.includes('```')) {
      messageDiv.innerHTML = formatMessageWithCodeBlocks(content);
    } else {
      messageDiv.textContent = content;
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Format message content with code blocks
  function formatMessageWithCodeBlocks(content) {
    return content
      .replace(/```json\s*([\s\S]*?)\s*```/g, '<pre style="background: rgba(0,0,0,0.1); padding: 8px; border-radius: 4px; margin: 8px 0; overflow-x: auto; font-size: 12px;">$1</pre>')
      .replace(/```python\s*([\s\S]*?)\s*```/g, '<pre style="background: rgba(0,0,0,0.1); padding: 8px; border-radius: 4px; margin: 8px 0; overflow-x: auto; font-size: 12px;">$1</pre>')
      .replace(/```\s*([\s\S]*?)\s*```/g, '<pre style="background: rgba(0,0,0,0.1); padding: 8px; border-radius: 4px; margin: 8px 0; overflow-x: auto; font-size: 12px;">$1</pre>')
      .replace(/\n/g, '<br>');
  }

  // Update chat status
  function updateChatStatus(message) {
    const chatStatus = el('chatStatus');
    if (chatStatus) {
      chatStatus.textContent = message;
    }
  }

  // Update JSON display from AI response
  function updateJsonFromResponse(response) {
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        const jsonDisplay = el('jsonDisplay');
        if (jsonDisplay) {
          jsonDisplay.textContent = JSON.stringify(jsonData, null, 2);
          
          // Update data summary
          updateDataSummary(jsonData);
          
          // Show extracted data section
          const extractedDataSection = el('extractedDataSection');
          if (extractedDataSection) {
            extractedDataSection.classList.remove('hidden');
          }
        }
      } catch (e) {
        console.warn('Failed to parse JSON from AI response:', e);
      }
    }
  }

  // Update data summary (matching home page)
  function updateDataSummary(data) {
    const completenessText = el('completenessText');
    const extractedCount = el('extractedCount');
    const extractedElements = el('extractedElements');

    if (!data || typeof data !== 'object') return;

    const fieldCount = Object.keys(data).length;
    const hasData = fieldCount > 0;

    if (completenessText) {
      completenessText.textContent = hasData ? 'Data extraction completed successfully' : 'No data extracted';
    }

    if (extractedCount) {
      extractedCount.textContent = `${fieldCount} fields extracted`;
    }

    if (extractedElements) {
      const elements = Object.keys(data).slice(0, 5).join(', ');
      extractedElements.textContent = fieldCount > 0 ? `Fields: ${elements}${fieldCount > 5 ? '...' : ''}` : 'No fields found';
    }
  }

  // Initialize download JSON functionality
  function initializeJsonDownload() {
    const downloadJsonBtn = el('downloadJsonBtn');
    if (!downloadJsonBtn) return;

    downloadJsonBtn.addEventListener('click', () => {
      const jsonDisplay = el('jsonDisplay');
      if (!jsonDisplay || !jsonDisplay.textContent.trim()) {
        alert('No JSON data to download');
        return;
      }

      const blob = new Blob([jsonDisplay.textContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'extracted-data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // Main extraction flow (matching home page exactly)
  async function performExtraction() {
    const urlInput = el('url');
    const tryBtn = el('tryBtn');
    const results = el('results');
    const aiChat = el('aiChat');

    if (!urlInput || !tryBtn) return;

    const url = urlInput.value.trim();
    if (!url) {
      showStatus('Please enter a valid URL', 'error');
      urlInput.focus();
      return;
    }

    // Disable button and show loading
    tryBtn.disabled = true;
    tryBtn.textContent = 'Processing...';
    showStatus('Starting extraction...');

    try {
      // Generate fingerprint
      const fingerprint = await generateFingerprint();
      showStatus('Submitting extraction job...');

      // Submit job
      const jobResult = await submitDemoJob(url, fingerprint);
      currentJobId = jobResult.job_id;
      
      showStatus('Processing page with AI...');

      // Poll for results
      const extractionResult = await pollForResults(currentJobId);
      
      if (!extractionResult) {
        throw new Error('Extraction timed out');
      }

      // Store results globally
      const cleaned = extractionResult.cleaned;
      rawHtmlContent = extractionResult.raw || '';
      cleanedHtmlContent = cleaned.cleaned_html || '';
      gptCleaningResult = cleaned;
      window.rawHtmlContent = rawHtmlContent;
      window.cleanedHtmlContent = cleanedHtmlContent;
      window.gptCleaningResult = gptCleaningResult;
      window.currentJobId = currentJobId;

      // Display results
      displayResults(cleaned);
      
      // Show results section
      if (results) {
        results.classList.remove('hidden');
        
        // Show with animation (matching home page)
        results.style.opacity = '0';
        results.style.transform = 'translateY(10px)';
        setTimeout(() => {
          results.style.transition = 'all 0.35s ease';
          results.style.opacity = '1';
          results.style.transform = 'translateY(0)';
        }, 10);
      }

      // Show AI chat
      if (aiChat) {
        setTimeout(() => {
          aiChat.classList.remove('hidden');
          addChatMessage("I've analyzed the website and extracted the initial data. You can now ask me to modify the extraction, add more fields, remove unwanted data, or focus on specific elements. What would you like me to change?", 'assistant');
          chatHistory.push({ 
            role: 'assistant', 
            content: "I've analyzed the website and extracted the initial data. You can now ask me to modify the extraction, add more fields, remove unwanted data, or focus on specific elements. What would you like me to change?" 
          });
        }, 500);
      }

      showStatus('✅ Extraction complete! Use AI chat below to modify results.', 'success');

    } catch (error) {
      console.error('Extraction error:', error);
      showStatus(`Extraction failed: ${error.message}`, 'error');
    } finally {
      // Re-enable button
      tryBtn.disabled = false;
      tryBtn.innerHTML = `
        Try free capture
        <svg class="button-lightning" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
        </svg>
      `;
    }
  }

  // Display extraction results (matching home page)
  function displayResults(cleaned) {
    const htmlContent = el('htmlContent');
    const jsonDisplay = el('jsonDisplay');
    const resultMessage = el('resultMessage');
    const parserFeatures = el('parserFeatures');

    // Display HTML content (default to cleaned)
    if (htmlContent) {
      htmlContent.value = cleanedHtmlContent || rawHtmlContent || '(No HTML content available)';
    }

    // Create initial JSON structure from cleaned data
    const initialData = {
      website_type: cleaned.intent || 'general data extraction',
      url: cleaned.url || el('url').value,
      processing_method: cleaned.processing_method || 'gpt-4.1-mini',
      analysis: cleaned.analysis || 'Initial analysis complete',
      relevant_links: cleaned.relevant_links || [],
      cleaned_html_length: cleanedHtmlContent.length,
      extraction_ready: true
    };

    // Display JSON
    if (jsonDisplay) {
      jsonDisplay.textContent = JSON.stringify(initialData, null, 2);
      updateDataSummary(initialData);
    }

    // Update result message
    if (resultMessage) {
      resultMessage.textContent = 'Website analyzed successfully. Use the AI chat below to specify what data you want to extract.';
    }

    // Update parser features
    if (parserFeatures) {
      parserFeatures.innerHTML = `
        <div>• GPT-4.1 mini HTML cleaning and analysis</div>
        <div>• Intelligent content structure detection</div>
        <div>• AI-powered data extraction capabilities</div>
        <div>• Real-time parser generation and iteration</div>
        <div>• Autonomous error correction and validation</div>
      `;
    }

    // Show extracted data section
    const extractedDataSection = el('extractedDataSection');
    if (extractedDataSection) {
      extractedDataSection.classList.remove('hidden');
    }
  }

  // Initialize main functionality
  function initialize() {
    console.log('Initializing new-project home-style functionality...');

    // Initialize HTML toggle
    initializeHtmlToggle();

    // Initialize AI chat
    initializeAIChat();

    // Initialize JSON download
    initializeJsonDownload();

    // Bind extraction button
    const tryBtn = el('tryBtn');
    if (tryBtn) {
      tryBtn.addEventListener('click', performExtraction);
    }

    console.log('New-project home-style functionality initialized');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Expose global functions for compatibility
  window.currentJobId = null;
  window.rawHtmlContent = '';
  window.cleanedHtmlContent = '';
  window.gptCleaningResult = null;
  window.currentHtmlType = 'cleaned';

})();
