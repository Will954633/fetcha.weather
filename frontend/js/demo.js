/*
Demo flow (refactor)
Version: v1.1 • Updated: 2025-08-25 13:58 AEST (Brisbane)

Notes:
- This file is a streamlined, robust implementation of the demo/new-project flow.
- It:
  - Binds to the element IDs used in new-project.html (urlInput, extractBtn, progressSection, resultsSection, extractedData, generatedCode, sourceHtml, saveProjectBtn)
  - Uses shared helper functions (apiRequest, showStatus, el, setLoading) when available
  - Gracefully falls back to fetch/local helpers if shared utilities aren't loaded
  - Autosaves demo data to localStorage and exposes window.saveProject for the inline wrapper in new-project.html
- All timestamps and logs use local timezone; UI messages use showStatus where possible.
*/

(function () {
  // Safe helpers - prefer shared.js utilities when available
  const _el = (id) => (window.el ? window.el(id) : document.getElementById(id));
  const _apiRequest = (endpoint, opts = {}) => {
    if (window.apiRequest) {
      return window.apiRequest(endpoint, opts);
    } else {
      // Fallback direct fetch with proper headers
      const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      const mergedOpts = {
        ...opts,
        headers: {
          ...defaultHeaders,
          ...(opts.headers || {})
        }
      };
      return fetch((window.CAMOUFOX_API_BASE || 'http://127.0.0.1:8001') + endpoint, mergedOpts);
    }
  };
  const _showStatus = (msg, type = 'info', duration = 5000) => {
    if (typeof window.showStatus === 'function') return window.showStatus(msg, type, duration);
    // fallback simple status element
    let s = document.getElementById('statusMessage');
    if (!s) {
      s = document.createElement('div');
      s.id = 'statusMessage';
      s.className = 'status-message';
      document.body.appendChild(s);
    }
    s.textContent = msg;
    s.className = 'status-message ' + type;
    if (duration > 0) setTimeout(() => s.classList.add('hidden'), duration);
  };
  const _setLoading = (el, isLoading, originalText = '') => {
    if (!el) return;
    if (window.setLoading) return window.setLoading(el, isLoading, originalText);
    if (isLoading) {
      el.disabled = true;
      el.classList.add('loading');
      if (originalText) {
        el.dataset.originalText = el.textContent;
        el.textContent = originalText;
      }
    } else {
      el.disabled = false;
      el.classList.remove('loading');
      if (el.dataset.originalText) {
        el.textContent = el.dataset.originalText;
        delete el.dataset.originalText;
      }
    }
  };

  // Determine API base (FORCE port 8001 for demo endpoint)
  const DEMO_API_BASE = "http://127.0.0.1:8001";

  // Hash utilities
  async function sha256hex(input) {
    const enc = new TextEncoder();
    const data = enc.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  async function fingerprintHash() {
    const components = [
      navigator.userAgent || "",
      navigator.language || "",
      (screen && (screen.width + "x" + screen.height)) || "",
      screen?.colorDepth || "",
      Intl.DateTimeFormat().resolvedOptions().timeZone || ""
    ].join("||");
    try {
      return await sha256hex(components);
    } catch (err) {
      console.warn("fingerprintHash failed, falling back to timestamp hash:", err);
      return (Date.now() + "_" + Math.random().toString(36).slice(2, 10));
    }
  }

  // Small sleep helper
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Post demo job using new enhanced orchestrator system
  async function postDemo(url, fp) {
    try {
      const body = { url: url, fingerprint_hash: fp };
      console.log("🔄 POST Request:", `${DEMO_API_BASE}/demo/simple-try`, body);
      
      // FORCE direct fetch to bypass any issues with window.apiRequest
      const resp = await fetch(`${DEMO_API_BASE}/demo/simple-try`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      console.log("✅ POST Response Status:", resp.status, resp.statusText);
      return resp;
    } catch (err) {
      console.error("❌ postDemo error:", err);
      return null;
    }
  }

  // Poll for complete results (waits for full pipeline including parser generation)
  async function pollCompleteResults(jobId, timeoutMs = 360000, pollInterval = 3000) {
    const resultsUrl = `${DEMO_API_BASE}/demo/results/${jobId}?gpt_cleaned=true`;
    const deadline = Date.now() + timeoutMs;
    let lastStatus = '';

    _showStatus("Waiting for HTML cleaning and parser generation...", 'info');

    while (Date.now() < deadline) {
      try {
        const resp = await fetch(resultsUrl, { cache: 'no-cache' });
        if (resp.ok) {
          try {
            const data = await resp.json();
            
            // Check if this is just a status response
            if (data.detail && data.detail.includes("Job status:")) {
              const status = data.detail.replace("Job status: ", "");
              if (status !== lastStatus) {
                lastStatus = status;
                if (status === 'running') {
                  _showStatus("🔄 Processing: HTML cleaning and parser generation in progress...", 'info');
                } else if (status === 'queued') {
                  _showStatus("⏳ Queued: Waiting for worker to start processing...", 'info');
                }
              }
              continue; // Continue polling
            }
            
            // Check for completed results
            if (data.status === 'completed' && data.results) {
              const results = data.results;
              
              // CRITICAL: Only return when we have intelligent extraction results
              if (results.intelligent_extraction && results.extracted_json_uri) {
                console.log("✅ Complete pipeline finished - intelligent extraction available");
                _showStatus("✅ Parser generation complete! Displaying intelligent extraction results...", 'success');
                return { cleaned: results, rawStatus: resp.status, complete: true };
              } else if (results.extracted_data) {
                console.log("⚠️  Basic extraction available, but waiting for parser generation...");
                _showStatus("🔄 HTML cleaned, generating intelligent parser...", 'info');
                continue; // Continue waiting for intelligent extraction
              } else {
                console.log("⚠️  Results available but no extraction data, continuing to poll...");
                _showStatus("🔄 Processing: Generating data extraction parser...", 'info');
                continue;
              }
            }
            
            // Handle old format for backward compatibility
            if (data.cleaned_html || data.analysis || data.processing_method) {
              // Only return if we have intelligent extraction
              if (data.intelligent_extraction && data.extracted_json_uri) {
                console.log("✅ Complete pipeline finished (old format)");
                return { cleaned: data, rawStatus: resp.status, complete: true };
              } else {
                console.log("⚠️  HTML cleaning done, waiting for parser generation...");
                _showStatus("🔄 HTML cleaned, generating intelligent parser with Claude Sonnet...", 'info');
                continue;
              }
            }
            
            console.warn("Unexpected response format:", data);
          } catch (e) {
            console.warn("Response not JSON yet:", e);
          }
        } else if (resp.status === 202) {
          _showStatus("🔄 Processing: HTML extraction and cleaning in progress...", 'info');
        } else {
          console.debug('Non-ok status:', resp.status);
        }
      } catch (err) {
        console.warn('Polling error:', err);
      }
      await sleep(pollInterval);
    }
    
    // Timeout - return partial results if available
    console.warn("⏰ Timeout reached, attempting to get partial results...");
    try {
      const resp = await fetch(resultsUrl, { cache: 'no-cache' });
      if (resp.ok) {
        const data = await resp.json();
        if (data.status === 'completed' || data.cleaned_html) {
          _showStatus("⚠️ Parser generation timed out, showing basic extraction results", 'warning');
          return { cleaned: data.results || data, rawStatus: resp.status, complete: false };
        }
      }
    } catch (e) {
      console.error("Failed to get partial results:", e);
    }
    
    return null;
  }

  // Fetch raw HTML (text) - updated for simple pipeline endpoints
  async function fetchRawHtml(jobId) {
    try {
      // Try new simple pipeline endpoint first
      const simpleRawUrl = `${DEMO_API_BASE}/demo/simple/raw/${jobId}`;
      const resp = await fetch(simpleRawUrl, { cache: 'no-cache' });
      if (resp.ok) {
        return await resp.text();
      }
      
      // Fallback to old endpoint for backward compatibility
      const oldRawUrl = `${DEMO_API_BASE}/demo/raw/${jobId}`;
      const oldResp = await fetch(oldRawUrl, { cache: 'no-cache' });
      if (oldResp.ok) {
        return await oldResp.text();
      }
      
      return null;
    } catch (err) {
      console.warn('fetchRawHtml error', err);
      return null;
    }
  }

  // UI wiring and main flow
  async function initDemoBindings() {
    const urlInput = _el('urlInput') || _el('url') || _el('inputUrl');
    const queryInput = _el('queryInput') || _el('query') || null;
    const extractBtn = _el('extractBtn') || _el('tryBtn');
    const progressSection = _el('progressSection');
    const resultsSection = _el('resultsSection');
    const extractedDataPre = _el('extractedData'); // <pre> for JSON output
    const generatedCodePre = _el('generatedCode');
    const sourceHtmlPre = _el('sourceHtml');
    const saveProjectBtn = _el('saveProjectBtn');
    const tryAnotherBtn = _el('tryAnotherBtn');

    if (!urlInput || !extractBtn) {
      console.warn('Demo bindings: required elements not found (urlInput or extractBtn). Aborting binding.');
      return;
    }

    // Extract button handler
    extractBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const url = (urlInput.value || '').trim();
      if (!url) {
        _showStatus("Please enter a valid URL", 'error');
        urlInput.focus();
        return;
      }

      // Visual state
      _setLoading(extractBtn, true, 'Processing...');
      _showStatus("Computing fingerprint...", 'info');

      try {
        const fp = await fingerprintHash();
        _showStatus("Requesting demo job...", 'info');

        const resp = await postDemo(url, fp);
        if (!resp) {
          _showStatus("Network error sending demo request", 'error');
          return;
        }

        if (resp.status === 200) {
          // New orchestrator system - synchronous response
          const json = await resp.json();
          
          if (json.status === 'completed') {
            _showStatus("✅ Enhanced pipeline completed successfully!", 'success');
            if (progressSection) progressSection.classList.remove('hidden');
            
            const cleaned = json.results || {};
            const jobId = json.job_id;
            
            // Store job ID for accessing full content endpoints
            window.currentJobId = jobId;
            
            let cleanedHtml = cleaned.cleaned_html || '';

            // If backend provided a cleaned_html_uri, fetch it (local filesystem artifact)
            if (!cleanedHtml && cleaned.cleaned_html_uri) {
              try {
                const uri = cleaned.cleaned_html_uri.startsWith('http')
                  ? cleaned.cleaned_html_uri
                  : `${DEMO_API_BASE}${cleaned.cleaned_html_uri}`;
                const resp2 = await fetch(uri, { cache: 'no-cache' });
                if (resp2.ok) {
                  cleanedHtml = await resp2.text();
                }
              } catch (e) {
                console.warn('Failed to fetch cleaned_html_uri:', e);
              }
            }
            const processingMethod = cleaned.processing_method || 'No processing';

            // Fetch raw HTML (best-effort)
            const rawHtml = await fetchRawHtml(jobId) || '';

            // PROGRESSIVE DISPLAY: Show cleaned HTML immediately after Stage 2
            console.log('🔄 PROGRESSIVE DISPLAY: Showing cleaned HTML immediately');
            const htmlContent = _el('htmlContent');
            if (sourceHtmlPre) {
              sourceHtmlPre.textContent = rawHtml || '(No raw HTML available)';
            } else if (htmlContent) {
              console.log('Setting htmlContent with cleaned HTML from enhanced pipeline');
              console.log('Cleaned HTML length:', cleanedHtml ? cleanedHtml.length : 0);
              console.log('Cleaned HTML preview:', cleanedHtml ? cleanedHtml.substring(0, 200) : 'None');
              htmlContent.value = cleanedHtml || rawHtml || '(No HTML available)';
              
              // Show results section immediately after cleaning is done
              if (resultsSection) {
                resultsSection.classList.remove('hidden');
                resultsSection.style.opacity = '0';
                resultsSection.style.transform = 'translateY(10px)';
                setTimeout(() => {
                  resultsSection.style.transition = 'all 0.35s ease';
                  resultsSection.style.opacity = '1';
                  resultsSection.style.transform = 'translateY(0)';
                }, 10);
                
                // Update status to show cleaning is complete but parser generation continues
                _showStatus("✅ HTML cleaning complete! Parser generation continues in background...", 'success');
              }
            }
          
          // Fetch parser code if available
          if (generatedCodePre && cleaned.parser_code_uri) {
            try {
              const parserUri = cleaned.parser_code_uri.startsWith('http')
                ? cleaned.parser_code_uri
                : `${DEMO_API_BASE}${cleaned.parser_code_uri}`;
              const parserResp = await fetch(parserUri, { cache: 'no-cache' });
              if (parserResp.ok) {
                const parserCode = await parserResp.text();
                generatedCodePre.textContent = parserCode;
                console.log('Displaying parser code from Claude Sonnet');
              } else {
                generatedCodePre.textContent = processingMethod || 'Parser code not available';
              }
            } catch (e) {
              console.warn('Failed to fetch parser code:', e);
              generatedCodePre.textContent = processingMethod || 'Parser code not available';
            }
          } else if (generatedCodePre) {
            // Fallback to old method
            generatedCodePre.textContent = cleaned.parser_code || processingMethod || '';
          }

          // Handle JSON display for both page types - prioritize intelligent extraction
          const jsonDisplay = _el('jsonDisplay');
          
          // Fetch extracted JSON if available from Claude
          if (cleaned.extracted_json_uri && cleaned.intelligent_extraction) {
            try {
              const jsonUri = cleaned.extracted_json_uri.startsWith('http')
                ? cleaned.extracted_json_uri
                : `${DEMO_API_BASE}${cleaned.extracted_json_uri}`;
              const jsonResp = await fetch(jsonUri, { cache: 'no-cache' });
              if (jsonResp.ok) {
                const extractedJson = await jsonResp.json();
                const jsonText = JSON.stringify(extractedJson, null, 2);
                if (extractedDataPre) extractedDataPre.textContent = jsonText;
                if (jsonDisplay) jsonDisplay.textContent = jsonText;
                console.log('Displaying intelligent extraction results from Claude Sonnet parser');
              } else {
                // Fallback to extracted_data if JSON endpoint fails
                const jsonText = JSON.stringify(cleaned.extracted_data || {}, null, 2);
                if (extractedDataPre) extractedDataPre.textContent = jsonText;
                if (jsonDisplay) jsonDisplay.textContent = jsonText;
                console.log('JSON endpoint failed, using fallback data');
              }
            } catch (e) {
              console.warn('Failed to fetch extracted JSON:', e);
              const jsonText = JSON.stringify(cleaned.extracted_data || {}, null, 2);
              if (extractedDataPre) extractedDataPre.textContent = jsonText;
              if (jsonDisplay) jsonDisplay.textContent = jsonText;
            }
          } else if (cleaned.extracted_data) {
            // Display regular extraction results
            try {
              const jsonText = JSON.stringify(cleaned.extracted_data, null, 2);
              if (extractedDataPre) extractedDataPre.textContent = jsonText;
              if (jsonDisplay) jsonDisplay.textContent = jsonText;
            } catch (e) {
              const fallbackText = String(cleaned.extracted_data);
              if (extractedDataPre) extractedDataPre.textContent = fallbackText;
              if (jsonDisplay) jsonDisplay.textContent = fallbackText;
            }
          } else {
            // Fallback to basic cleaning results (old format)
            let jsonText = '';
            if (cleaned.json_output) {
              try {
                jsonText = JSON.stringify(cleaned.json_output, null, 2);
              } catch (e) {
                jsonText = String(cleaned.json_output);
              }
            } else {
              jsonText = JSON.stringify(cleaned || {}, null, 2);
            }
            if (extractedDataPre) extractedDataPre.textContent = jsonText;
            if (jsonDisplay) jsonDisplay.textContent = jsonText;
            console.log('Displaying fallback cleaning results (no intelligent extraction)');
          }

          // Store results for in-page features
          window.currentJobId = jobId;
          window.rawHtmlContent = rawHtml;
          window.cleanedHtmlContent = cleanedHtml;
          window.gptCleaningResult = cleaned;
          window.currentHtmlType = 'cleaned';

          // Initialize HTML toggle functionality for new-project page
          initializeHtmlToggle();

          // Show results area
          if (resultsSection) {
            resultsSection.classList.remove('hidden');
            // Small reveal animation
            resultsSection.style.opacity = '0';
            resultsSection.style.transform = 'translateY(10px)';
            setTimeout(() => {
              resultsSection.style.transition = 'all 0.35s ease';
              resultsSection.style.opacity = '1';
              resultsSection.style.transform = 'translateY(0)';
            }, 10);
          }

          // Show AI chat section (for new-project page)
          const aiChat = document.getElementById('aiChat');
          const extractedDataSection = document.getElementById('extractedDataSection');
          if (aiChat) {
            setTimeout(() => {
              aiChat.classList.remove('hidden');
              // Initialize AI chat if not already done
              if (!window.aiChatInitialized) {
                initializeAIChat();
                window.aiChatInitialized = true;
              }
            }, 500);
          }
          if (extractedDataSection) {
            setTimeout(() => {
              extractedDataSection.classList.remove('hidden');
              // Update the JSON display with initial data
              updateJsonDisplay(cleaned);
            }, 300);
          }

          // Autostore demo project so it can be transferred after login
          try {
            autosaveDemoProject(JSON.parse(extractedDataPre.textContent || '{}'));
          } catch (e) {
            autosaveDemoProject(null);
          }

          _showStatus("✅ Extraction and cleaning complete — results available below.", 'success', 7000);
          // Mark Save as Project button visually
          if (saveProjectBtn) {
            saveProjectBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
            saveProjectBtn.style.boxShadow = '0 2px 8px rgba(40, 167, 69, 0.2)';
          }
          } else {
            const txt = await resp.text().catch(() => '');
            _showStatus("Demo request failed: " + resp.status + " - " + txt, 'error', 8000);
          }
        } else {
          const txt = await resp.text().catch(() => '');
          _showStatus("Demo request failed: " + resp.status + " - " + txt, 'error', 8000);
        }
      } catch (err) {
        console.error('Extract flow error:', err);
        _showStatus("Network error: " + (err.message || err), 'error');
      } finally {
        _setLoading(extractBtn, false);
      }
    });

    // Try another button
    if (tryAnotherBtn) {
      tryAnotherBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Clear result panes and show form again
        if (resultsSection) resultsSection.classList.add('hidden');
        if (progressSection) progressSection.classList.add('hidden');
        if (extractedDataPre) extractedDataPre.textContent = '';
        if (generatedCodePre) generatedCodePre.textContent = '';
        if (sourceHtmlPre) sourceHtmlPre.textContent = '';
        _showStatus('Ready for new URL', 'info', 3000);
      });
    }

    // Note: saveProject function is now handled in new-project.html inline script
    // This allows for proper modal flow and name suggestion functionality

    // Autosave demo project to localStorage
    function autosaveDemoProject(extractedData) {
      const url = (urlInput.value || '').trim();
      const htmlContent = window.cleanedHtmlContent || window.rawHtmlContent || (sourceHtmlPre ? sourceHtmlPre.textContent : '');
      if (!url) {
        console.log('Autosave skipped: missing url');
        return;
      }
      const demoData = {
        url: url,
        extractedData: extractedData ? JSON.stringify(extractedData) : (extractedDataPre ? extractedDataPre.textContent : ''),
        parserCode: window.gptCleaningResult?.parser_code || '',
        htmlContent: htmlContent || '',
        timestamp: new Date().toISOString(),
        sessionId: generateSessionId(),
        autoSaved: true
      };
      localStorage.setItem('camoufox_pending_project', JSON.stringify(demoData));
      console.log('Demo project autosaved to localStorage (camoufox_pending_project)');
    }

    function generateSessionId() {
      return 'demo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  }

  // AI Chat functionality for new-project page
  function initializeAIChat() {
    const chatInput = _el('chatInput');
    const sendBtn = _el('sendChatBtn');
    const chatMessages = _el('chatMessages');

    if (!chatInput || !sendBtn || !chatMessages) return;

    let chatHistory = [];
    let isProcessing = false;

    // Add initial AI message
    addChatMessage("I've analyzed the website and extracted the initial data. You can now ask me to modify the extraction, add more fields, remove unwanted data, or focus on specific elements. What would you like me to change?", 'assistant');
    chatHistory.push({ 
      role: 'assistant', 
      content: "I've analyzed the website and extracted the initial data. You can now ask me to modify the extraction, add more fields, remove unwanted data, or focus on specific elements. What would you like me to change?" 
    });

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
        const response = await fetch(`${DEMO_API_BASE}/ai/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Authorization': `Bearer ${localStorage.getItem('camoufox_access_token')}`
          },
          body: JSON.stringify({
            history: chatHistory,
            html: window.cleanedHtmlContent || window.rawHtmlContent || '',
            url: _el('url').value.trim()
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

  // Add chat message
  function addChatMessage(content, role) {
    const chatMessages = _el('chatMessages');
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
    const chatStatus = _el('chatStatus');
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
        const jsonDisplay = _el('jsonDisplay');
        if (jsonDisplay) {
          jsonDisplay.textContent = JSON.stringify(jsonData, null, 2);
          updateDataSummary(jsonData);
        }
      } catch (e) {
        console.warn('Failed to parse JSON from AI response:', e);
      }
    }
  }

  // Update JSON display with initial data - prioritize intelligent extraction
  function updateJsonDisplay(cleaned) {
    const jsonDisplay = _el('jsonDisplay');
    if (!jsonDisplay) return;

    // PRIORITY 1: Use intelligent extraction data if available
    if (cleaned.extracted_data && cleaned.intelligent_extraction) {
      console.log('Using intelligent extraction data from Claude Sonnet parser');
      jsonDisplay.textContent = JSON.stringify(cleaned.extracted_data, null, 2);
      updateDataSummary(cleaned.extracted_data);
      return;
    }

    // PRIORITY 2: Use any extracted_data field
    if (cleaned.extracted_data) {
      console.log('Using extracted_data field');
      jsonDisplay.textContent = JSON.stringify(cleaned.extracted_data, null, 2);
      updateDataSummary(cleaned.extracted_data);
      return;
    }

    // PRIORITY 3: Fallback to basic structure (old behavior)
    console.log('Using fallback basic structure');
    const initialData = {
      website_type: cleaned.intent || 'general data extraction',
      url: cleaned.url || _el('url').value,
      processing_method: cleaned.processing_method || 'gpt-4.1-mini',
      analysis: cleaned.analysis || 'Initial analysis complete',
      relevant_links: cleaned.relevant_links || [],
      cleaned_html_length: (window.cleanedHtmlContent || '').length,
      extraction_ready: true
    };

    jsonDisplay.textContent = JSON.stringify(initialData, null, 2);
    updateDataSummary(initialData);
  }

  // Update data summary
  function updateDataSummary(data) {
    const completenessText = _el('completenessText');
    const extractedCount = _el('extractedCount');
    const extractedElements = _el('extractedElements');

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

  // Initialize HTML toggle functionality
  function initializeHtmlToggle() {
    const cleanedToggle = _el('cleanedToggle');
    const rawToggle = _el('rawToggle');
    const htmlContent = _el('htmlContent');
    const htmlContentTitle = _el('htmlContentTitle');
    const downloadBtnText = _el('downloadBtnText');

    if (!cleanedToggle || !rawToggle || !htmlContent) return;

    // Avoid duplicate event listeners
    if (cleanedToggle.dataset.initialized) return;
    cleanedToggle.dataset.initialized = 'true';

    cleanedToggle.addEventListener('click', () => {
      window.currentHtmlType = 'cleaned';
      cleanedToggle.classList.add('active');
      cleanedToggle.style.background = '#007bff';
      cleanedToggle.style.color = 'white';
      rawToggle.classList.remove('active');
      rawToggle.style.background = 'transparent';
      rawToggle.style.color = '#666';
      
      htmlContent.value = window.cleanedHtmlContent || '(No cleaned HTML available)';
      if (htmlContentTitle) htmlContentTitle.textContent = 'Cleaned HTML Content:';
      if (downloadBtnText) downloadBtnText.textContent = 'Download Cleaned HTML';
    });

    rawToggle.addEventListener('click', () => {
      window.currentHtmlType = 'raw';
      rawToggle.classList.add('active');
      rawToggle.style.background = '#007bff';
      rawToggle.style.color = 'white';
      cleanedToggle.classList.remove('active');
      cleanedToggle.style.background = 'transparent';
      cleanedToggle.style.color = '#666';
      
      htmlContent.value = window.rawHtmlContent || '(No raw HTML available)';
      if (htmlContentTitle) htmlContentTitle.textContent = 'Raw HTML Content:';
      if (downloadBtnText) downloadBtnText.textContent = 'Download Raw HTML';
    });

    // Initialize download functionality
    const downloadBtn = _el('downloadHtmlBtn');
    if (downloadBtn && !downloadBtn.dataset.initialized) {
      downloadBtn.dataset.initialized = 'true';
      downloadBtn.addEventListener('click', () => {
        const content = htmlContent.value;
        const filename = window.currentHtmlType === 'cleaned' ? 'cleaned.html' : 'raw.html';
        
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

    // Initialize JSON download functionality
    const downloadJsonBtn = _el('downloadJsonBtn');
    if (downloadJsonBtn && !downloadJsonBtn.dataset.initialized) {
      downloadJsonBtn.dataset.initialized = 'true';
      downloadJsonBtn.addEventListener('click', () => {
        const jsonDisplay = _el('jsonDisplay');
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
  }

  // Initialize bindings when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDemoBindings);
  } else {
    initDemoBindings();
  }

  // ========================================================================
  // NEW WEBSOCKET DEMO FUNCTIONALITY (for demo homepage)
  // Version: v1.0 • Updated: 2025-01-07 09:16 AEST (Brisbane)
  // ========================================================================

  let currentWebSocketJobId = null;
  let progressWebSocket = null;
  
  // Timer variables for elapsed time display
  let timerInterval = null;
  let startTime = null;

  // Start the extraction timer
  function startExtractionTimer() {
    // Clear any existing timer
    stopExtractionTimer();
    
    // Set start time
    startTime = Date.now();
    
    // Update timer immediately
    updateTimerDisplay();
    
    // Update timer every second
    timerInterval = setInterval(updateTimerDisplay, 1000);
    
    console.log('Extraction timer started');
  }

  // Stop the extraction timer
  function stopExtractionTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      console.log('Extraction timer stopped');
    }
  }

  // Update the timer display
  function updateTimerDisplay() {
    const elapsedTimer = _el('elapsedTimer');
    if (!elapsedTimer || !startTime) return;
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    // Format as M:SS (e.g., "1:05" or "12:30")
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    elapsedTimer.textContent = formattedTime;
  }

  // Start demo extraction with WebSocket progress
  window.startWebSocketDemo = async function() {
    const urlInput = _el('url');
    if (!urlInput) return;

    const url = urlInput.value.trim();
    if (!url || !isValidUrl(url)) {
      _showStatus('Please enter a valid URL', 'error');
      return;
    }

    // Disable button and start lightning animation
    const tryBtn = _el('tryBtn');
    const lightningIcon = document.querySelector('.button-lightning');
    if (tryBtn) tryBtn.disabled = true;
    if (lightningIcon) lightningIcon.classList.add('lightning-processing');

    // Show progress section instead of status
    const progressSection = _el('progressSection');
    if (progressSection) {
      progressSection.classList.remove('hidden');
      // Clear previous log
      const progressLog = _el('progressLog');
      if (progressLog) progressLog.innerHTML = '';
    }

    try {
      // Start job
      _showStatus('Starting extraction...', 'info');
      
      const response = await fetch('http://localhost:8080/api/demo/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      currentWebSocketJobId = data.job_id;

      _showStatus(`Job started: ${data.job_id}`, 'success');

      // Start the extraction timer
      startExtractionTimer();

      // Connect to progress WebSocket
      connectProgressWebSocket(data.job_id);

    } catch (error) {
      console.error('Demo start error:', error);
      _showStatus(`Failed to start extraction: ${error.message}`, 'error');
      resetDemoUI();
    }
  };

  // Connect to progress WebSocket
  function connectProgressWebSocket(jobId) {
    const wsUrl = `ws://localhost:8080/ws/progress/${jobId}`;
    
    try {
      progressWebSocket = new WebSocket(wsUrl);

      progressWebSocket.onopen = () => {
        console.log('WebSocket connected for job:', jobId);
        _showStatus('Connected to progress stream...', 'info');
      };

      progressWebSocket.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          console.log('Progress update:', update);

          // Update progress bar
          const progressFill = _el('progressFill');
          const progressText = _el('progressText');
          if (progressFill && update.percentage !== undefined) {
            progressFill.style.width = `${update.percentage}%`;
          }
          if (progressText && update.percentage !== undefined) {
            progressText.textContent = `${update.percentage}%`;
          }

          // Update status message
          const statusMessage = _el('statusMessage');
          if (statusMessage && update.message) {
            statusMessage.textContent = update.message;
          }

          // Add to progress log
          const progressLog = _el('progressLog');
          if (progressLog && update.message) {
            const timestamp = new Date().toLocaleTimeString('en-AU', { hour12: false });
            const logEntry = document.createElement('div');
            logEntry.style.cssText = 'margin-bottom: 4px; color: #495057;';
            logEntry.innerHTML = `<span style="color: #6c757d;">[${timestamp}]</span> ${update.message} <span style="color: #007bff; font-weight: 600;">(${update.percentage}%)</span>`;
            progressLog.appendChild(logEntry);
            // Auto-scroll to bottom
            progressLog.scrollTop = progressLog.scrollHeight;
          }

          // Handle completion
          if (update.type === 'complete' || update.stage === 'complete') {
            handleExtractionComplete(jobId);
          }

          // Handle errors
          if (update.type === 'error' || update.stage === 'error') {
            _showStatus(`Error: ${update.message}`, 'error');
            resetDemoUI();
          }

        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      progressWebSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        _showStatus('Connection error. Please try again.', 'error');
        resetDemoUI();
      };

      progressWebSocket.onclose = () => {
        console.log('WebSocket closed for job:', jobId);
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
      _showStatus('Failed to connect to progress stream', 'error');
      resetDemoUI();
    }
  }

  // Handle extraction completion
  async function handleExtractionComplete(jobId) {
    // Stop the timer
    stopExtractionTimer();
    
    // Stop lightning animation
    const lightningIcon = document.querySelector('.button-lightning');
    if (lightningIcon) lightningIcon.classList.remove('lightning-processing');

    _showStatus('Extraction complete! Fetching results...', 'success');

    try {
      // Fetch result
      const response = await fetch(`http://localhost:8080/api/demo/result/${jobId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Extraction result:', data);
      console.log('Result structure:', JSON.stringify(data, null, 2));

      // Show JSON results section (NOT the HTML section!)
      const extractedDataSection = _el('extractedDataSection');
      if (extractedDataSection) {
        extractedDataSection.classList.remove('hidden');
        console.log('JSON results section shown');
      }
      
      // Hide HTML results section if it's visible
      const htmlResultsSection = _el('results');
      if (htmlResultsSection) {
        htmlResultsSection.classList.add('hidden');
      }

      // Display JSON - handle both data.result and data.result.extraction_results
      const jsonDisplay = _el('jsonDisplay');
      if (jsonDisplay) {
        let displayData = null;
        
        // Check different possible data structures
        if (data.result && data.result.extraction_results) {
          // File has metadata wrapper
          displayData = data.result;
          console.log('Using data.result (with metadata)');
        } else if (data.result) {
          // Direct result
          displayData = data.result;
          console.log('Using data.result (direct)');
        } else {
          console.warn('No result data found in response');
        }
        
        if (displayData) {
          const jsonText = JSON.stringify(displayData, null, 2);
          jsonDisplay.textContent = jsonText;
          console.log(`JSON displayed: ${jsonText.length} characters`);
          
          // Enable download button
          const downloadJsonBtn = _el('downloadJsonBtn');
          if (downloadJsonBtn) {
            downloadJsonBtn.onclick = () => downloadDemoJSON(displayData, jobId);
            downloadJsonBtn.disabled = false;
            console.log('Download button enabled');
          }
        }
      } else {
        console.error('jsonDisplay element not found!');
      }

      _showStatus('Extraction completed successfully!', 'success');

    } catch (error) {
      console.error('Failed to fetch results:', error);
      _showStatus(`Failed to fetch results: ${error.message}`, 'error');
    } finally {
      // Re-enable try button
      const tryBtn = _el('tryBtn');
      if (tryBtn) tryBtn.disabled = false;
    }
  }

  // Download JSON result
  function downloadDemoJSON(result, jobId) {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demo_result_${jobId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Reset demo UI
  function resetDemoUI() {
    // Stop the timer
    stopExtractionTimer();
    
    const tryBtn = _el('tryBtn');
    const lightningIcon = document.querySelector('.button-lightning');
    
    if (tryBtn) tryBtn.disabled = false;
    if (lightningIcon) lightningIcon.classList.remove('lightning-processing');
    
    if (progressWebSocket) {
      progressWebSocket.close();
      progressWebSocket = null;
    }
  }

  // Validate URL
  function isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  // Bind WebSocket demo to try button if it exists
  const tryBtn = _el('tryBtn');
  if (tryBtn && !tryBtn.dataset.websocketBound) {
    tryBtn.dataset.websocketBound = 'true';
    // Override existing click handler for WebSocket demo
    tryBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.startWebSocketDemo();
    }, true); // Use capture phase to override existing handlers
  }

})();
