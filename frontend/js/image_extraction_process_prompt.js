/**
 * Image Extraction Process Prompt
 * 
 * This module defines the process prompt for extracting image links from raw HTML.
 * It is designed to be used by the GPT 4.1 mini LLM to scan raw HTML and find photo links,
 * which are then passed to the Anthropic LLM responsible for generating parsing code.
 * 
 * The Anthropic LLM cannot extract images from cleaned HTML, so it delegates this task
 * to GPT 4.1 mini, which has access to raw HTML.
 * 
 * Usage:
 * 1. Anthropic LLM requests image extraction.
 * 2. This prompt is sent to GPT 4.1 mini with the raw HTML.
 * 3. GPT 4.1 mini extracts all photo links and related metadata.
 * 4. Extracted data is returned to Anthropic LLM for parsing code generation.
 */

const imageExtractionProcessPrompt = `
You are GPT 4.1 mini, specialized in extracting detailed information from raw HTML.

Task:
Scan the provided raw HTML content and extract all image URLs and related information.
Focus on all <img> tags, background images in inline styles, and any other image references.

Output:
Return a JSON array of objects with the following structure:
[
  {
    "src": "image URL",
    "alt": "alt text if available",
    "context": "brief description of surrounding HTML or element context"
  },
  ...
]

Only include image URLs found in the raw HTML. Do not attempt to extract from cleaned HTML.

Important:
- Do NOT extract from cleaned HTML.
- Only extract from the RAW HTML provided.
- Return JSON array ONLY, no extra text.

Example:
[
  {
    "src": "https://example.com/image1.jpg",
    "alt": "Front view of the property",
    "context": "<div class='property-image'>"
  },
  {
    "src": "https://example.com/background.png",
    "alt": "",
    "context": "background-image style on <section id='hero'>"
  }
]

Please provide the JSON output only, no additional text.
`;

export default imageExtractionProcessPrompt;
