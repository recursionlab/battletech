// Simple OpenRouter test - no special characters anywhere

async function testOpenRouter() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer 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`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:8002',
        'X-Title': 'TestApp'
      },
      body: JSON.stringify({
        model: 'openrouter/sonoma-dusk-alpha',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant.' },
          { role: 'user', content: 'Hello, can you respond?' }
        ],
        max_tokens: 100,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('Success:', data.choices[0].message.content);
  } catch (error) {
    console.log('Request error:', error.message);
  }
}

testOpenRouter();