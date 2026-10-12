/**
 * Build the plain-language report prompt from deterministic report data.
 */
function buildSummaryPrompt(reportData) {
  if (!reportData || typeof reportData !== 'object') {
    throw new Error('Report data is required to build the Gemini prompt');
  }

  const instructions = `You are an expert digital marketing consultant writing a monthly
performance report for a non-technical client.

Write a clear, 3-section email update using plain English.
Avoid technical jargon (if you mention terms like "conversions" or
"bounce rate", explain what they actually mean for their business in
simple terms).

Structure the summary like this:
1. The Big Picture (TL;DR): 2-3 concise bullet points on how the site
   performed this month in casual language (e.g., "More people found
   you through Google Search, but social media traffic dipped").
2. What Is Working vs. What Needs Attention: Highlight 2 key wins and
   1-2 areas to improve. Focus on business impact (leads, sales,
   visitor intent).
3. Recommended Action Steps: Give 2 simple, actionable actions for next month.

Anchor numbers to real-world business outcomes. e.g.:
- Instead of "Organic sessions grew by 20%", edit the output to say: "20% more 
people found your website on Google without you paying for ads."
-  Instead of "Event count for file_download dropped", edit it to: "Fewer visitors 
downloaded your menu/brochure this month."

Explain analytics terms in plain English. Do not invent conclusions.
If there is no data, say so clearly and do not fabricate results.
Call out anomalous values rather than presenting them as certain trends.`;

  return instructions + '\n\nReport data:\n' +
    JSON.stringify(reportData, null, 2);
}

/**
 * Build the Gemini request body for the given prompt.
 */
function buildGeminiRequest(prompt) {
  if (typeof prompt !== 'string' || prompt.trim() === '') {
    throw new Error('Gemini prompt must be a non-empty string');
  }

  return {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ]
  };
}

/**
 * Call the Gemini API with the given prompt and configuration, returning the generated text.
 */
function callGemini(prompt, config) {
  if (!config || typeof config.geminiApiKey !== 'string' ||
      config.geminiApiKey.trim() === '') {
    throw new Error('Gemini configuration requires an API key');
  }

  const request = buildGeminiRequest(prompt);
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/' +
    'gemini-1.5-flash:generateContent';
  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-goog-api-key': config.geminiApiKey
    },
    payload: JSON.stringify(request),
    muteHttpExceptions: true
  });

  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (responseCode < 200 || responseCode >= 300) {
    throw new Error(
      'Gemini API request failed with status ' + responseCode
    );
  }

  let body;

  try {
    body = JSON.parse(responseText);
  } catch (error) {
    throw new Error('Gemini response was not valid JSON');
  }

  return parseGeminiResponse(body);
}

/**
 * Parse the Gemini response body and return the generated text.
 */
function parseGeminiResponse(body) {
  if (!body || !Array.isArray(body.candidates) ||
      !body.candidates[0] ||
      !body.candidates[0].content ||
      !Array.isArray(body.candidates[0].content.parts) ||
      !body.candidates[0].content.parts[0] ||
      typeof body.candidates[0].content.parts[0].text !== 'string' ||
      body.candidates[0].content.parts[0].text.trim() === '') {
    throw new Error('Gemini response did not contain generated text');
  }

  return body.candidates[0].content.parts[0].text;
}
