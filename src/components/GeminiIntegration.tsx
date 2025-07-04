import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, ExternalLink } from 'lucide-react';

interface GeminiIntegrationProps {
  onApiKeySet: (apiKey: string) => void;
  currentApiKey?: string;
}

export function GeminiIntegration({ onApiKeySet, currentApiKey }: GeminiIntegrationProps) {
  const [apiKey, setApiKey] = useState(currentApiKey || '');
  const [isValid, setIsValid] = useState(false);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    // Basic validation - Gemini API keys start with 'AIza'
    setIsValid(value.startsWith('AIza') && value.length > 20);
  };

  const handleSaveApiKey = () => {
    if (isValid) {
      localStorage.setItem('gemini_api_key', apiKey);
      onApiKeySet(apiKey);
    }
  };

  return (
    <Card className="border-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Google Gemini Integration
        </CardTitle>
        <CardDescription>
          Erweitern Sie den Weitblickgenerator mit Google Gemini Pro für noch tiefere Analysen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gemini-api-key">Gemini API Key</Label>
          <Input
            id="gemini-api-key"
            type="password"
            placeholder="AIza..."
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Ihr API-Schlüssel wird lokal in Ihrem Browser gespeichert.
          </p>
        </div>

        {!currentApiKey && (
          <Alert>
            <AlertDescription>
              Sie benötigen einen Google AI API-Schlüssel für erweiterte Analysen.
              <br />
              <a 
                href="https://makersuite.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline mt-1"
              >
                API-Schlüssel erstellen <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSaveApiKey}
          disabled={!isValid}
          className="w-full"
        >
          {currentApiKey ? 'API-Schlüssel aktualisieren' : 'API-Schlüssel speichern'}
        </Button>

        {currentApiKey && (
          <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
            ✓ Gemini Integration aktiv
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Gemini API Service
export class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeText(text: string, perspective: string, sophisticationLevel: string, language: string): Promise<string> {
    const prompt = this.buildPrompt(text, perspective, sophisticationLevel, language);
    
    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0]?.content?.parts[0]?.text || 'Analyse nicht verfügbar';
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
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