export interface ApiKeys {
  gemini?: string;
  openai?: string;
  anthropic?: string;
  deepseek?: string;
}

export class AIApiService {
  private apiKeys: ApiKeys;

  constructor(apiKeys: ApiKeys) {
    this.apiKeys = apiKeys;
  }

  async analyzeWithMultipleAIs(
    text: string, 
    perspective: string, 
    sophisticationLevel: string, 
    language: string = 'de'
  ): Promise<{ [provider: string]: string }> {
    const results: { [provider: string]: string } = {};
    const providers = ['gemini', 'openai', 'anthropic', 'deepseek'];
    
    const analysisPromises = providers.map(async (provider) => {
      if (this.apiKeys[provider as keyof ApiKeys]) {
        try {
          const result = await this.analyzeWithProvider(provider, text, perspective, sophisticationLevel, language);
          results[provider] = result;
        } catch (error) {
          console.error(`${provider} analysis failed:`, error);
          results[provider] = `Analyse mit ${provider} fehlgeschlagen: ${error}`;
        }
      }
    });

    await Promise.all(analysisPromises);
    return results;
  }

  private async analyzeWithProvider(
    provider: string,
    text: string,
    perspective: string,
    sophisticationLevel: string,
    language: string
  ): Promise<string> {
    const prompt = this.buildPrompt(text, perspective, sophisticationLevel, language);
    
    switch (provider) {
      case 'gemini':
        return this.callGeminiAPI(prompt);
      case 'openai':
        return this.callOpenAIAPI(prompt);
      case 'anthropic':
        return this.callAnthropicAPI(prompt);
      case 'deepseek':
        return this.callDeepSeekAPI(prompt);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    const apiKey = this.apiKeys.gemini;
    if (!apiKey) throw new Error('Gemini API key not configured');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || 'Analyse nicht verfügbar';
  }

  private async callOpenAIAPI(prompt: string): Promise<string> {
    const apiKey = this.apiKeys.openai;
    if (!apiKey) throw new Error('OpenAI API key not configured');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
    const data = await response.json();
    return data.choices[0]?.message?.content || 'Analyse nicht verfügbar';
  }

  private async callAnthropicAPI(prompt: string): Promise<string> {
    const apiKey = this.apiKeys.anthropic;
    if (!apiKey) throw new Error('Anthropic API key not configured');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);
    const data = await response.json();
    return data.content[0]?.text || 'Analyse nicht verfügbar';
  }

  private async callDeepSeekAPI(prompt: string): Promise<string> {
    const apiKey = this.apiKeys.deepseek;
    if (!apiKey) throw new Error('DeepSeek API key not configured');

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) throw new Error(`DeepSeek API error: ${response.status}`);
    const data = await response.json();
    return data.choices[0]?.message?.content || 'Analyse nicht verfügbar';
  }

  private buildPrompt(text: string, perspective: string, sophisticationLevel: string, language: string): string {
    const languageInstruction = language === 'de' 
      ? 'Antworte auf Deutsch in einem akademischen aber verständlichen Stil.'
      : 'Respond in English in an academic but understandable style.';

    const levelInstruction = {
      'basic': language === 'de' 
        ? 'Erkläre es einfach und verständlich, ohne zu viele Fachbegriffe.'
        : 'Explain it simply and clearly, without too many technical terms.',
      'intermediate': language === 'de'
        ? 'Verwende eine durchdachte Analyse mit einigen philosophischen Begriffen.'
        : 'Use a thoughtful analysis with some philosophical terms.',
      'advanced': language === 'de'
        ? 'Führe eine tiefgreifende philosophische Analyse durch, verwende Fachterminologie präzise.'
        : 'Conduct a deep philosophical analysis, use terminology precisely.'
    }[sophisticationLevel];

    const perspectiveInstructions = {
      'Kant': language === 'de'
        ? 'Analysiere aus Kants erkenntnistheoretischer Perspektive: Erkenntnisbedingungen, transzendentale Kategorien, Grenzen der Vernunft.'
        : 'Analyze from Kant\'s epistemological perspective: conditions of knowledge, transcendental categories, limits of reason.',
      'Heidegger': language === 'de'
        ? 'Analysiere aus Heideggers existenzial-ontologischer Perspektive: Dasein, In-der-Welt-sein, Geworfenheit, existenziale Verfasstheit.'
        : 'Analyze from Heidegger\'s existential-ontological perspective: Dasein, Being-in-the-world, thrownness, existential constitution.',
      'Hegel': language === 'de'
        ? 'Analysiere aus Hegels dialektischer Perspektive: These-Antithese-Synthese, Weltgeist, Aufhebung von Widersprüchen.'
        : 'Analyze from Hegel\'s dialectical perspective: thesis-antithesis-synthesis, world spirit, resolution of contradictions.',
      'Nagarjuna': language === 'de'
        ? 'Analysiere aus Nagarjunas Perspektive der Madhyamaka-Philosophie: Sunyata (Leerheit), abhängige Entstehung (Pratityasamutpada), Dekonstruktion fester Begriffe.'
        : 'Analyze from Nagarjuna\'s Madhyamaka perspective: Sunyata (emptiness), dependent origination (Pratityasamutpada), deconstruction of fixed concepts.',
      'Wissenschaft': language === 'de'
        ? 'Analysiere aus wissenschaftlicher Perspektive: Empirische Überprüfbarkeit, Falsifizierbarkeit, messbare Korrelationen, Forschungsmethodik.'
        : 'Analyze from a scientific perspective: empirical testability, falsifiability, measurable correlations, research methodology.'
    }[perspective];

    return `${languageInstruction}

${levelInstruction}

${perspectiveInstructions}

Analysiere folgenden Text:
"${text}"

Beginne deine Antwort mit "${perspective}:" und gib eine strukturierte, ${sophisticationLevel === 'advanced' ? 'tiefgreifende' : sophisticationLevel === 'intermediate' ? 'durchdachte' : 'verständliche'} Analyse aus dieser Perspektive.`;
  }
}