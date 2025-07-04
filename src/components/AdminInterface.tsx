import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Key, ExternalLink, Check, X } from 'lucide-react';

interface AdminInterfaceProps {
  onApiKeysUpdate: (apiKeys: ApiKeys) => void;
  currentApiKeys?: Partial<ApiKeys>;
}

export interface ApiKeys {
  gemini: string;
  openai: string;
  anthropic: string;
  deepseek: string;
}

export function AdminInterface({ onApiKeysUpdate, currentApiKeys = {} }: AdminInterfaceProps) {
  const [apiKeys, setApiKeys] = useState<Partial<ApiKeys>>(currentApiKeys);
  const [validations, setValidations] = useState<Record<string, boolean>>({});

  const validateApiKey = (provider: string, key: string): boolean => {
    const patterns = {
      gemini: /^AIza[\w-]{35,}$/,
      openai: /^sk-[\w-]{48,}$/,
      anthropic: /^sk-ant-[\w-]{95,}$/,
      deepseek: /^sk-[\w-]{32,}$/
    };
    
    return patterns[provider as keyof typeof patterns]?.test(key) || false;
  };

  const handleApiKeyChange = (provider: string, value: string) => {
    const newKeys = { ...apiKeys, [provider]: value };
    setApiKeys(newKeys);
    
    const isValid = validateApiKey(provider, value);
    setValidations({ ...validations, [provider]: isValid });
    
    if (isValid) {
      localStorage.setItem(`${provider}_api_key`, value);
      onApiKeysUpdate(newKeys as ApiKeys);
    }
  };

  const removeApiKey = (provider: string) => {
    const newKeys = { ...apiKeys };
    delete newKeys[provider as keyof ApiKeys];
    setApiKeys(newKeys);
    localStorage.removeItem(`${provider}_api_key`);
    onApiKeysUpdate(newKeys as ApiKeys);
  };

  const apiProviders = [
    {
      name: 'gemini',
      label: 'Google Gemini',
      placeholder: 'AIza...',
      description: 'Google AI API-Schlüssel für Gemini Pro',
      docUrl: 'https://makersuite.google.com/app/apikey'
    },
    {
      name: 'openai',
      label: 'OpenAI ChatGPT',
      placeholder: 'sk-...',
      description: 'OpenAI API-Schlüssel für GPT-4',
      docUrl: 'https://platform.openai.com/api-keys'
    },
    {
      name: 'anthropic',
      label: 'Anthropic Claude',
      placeholder: 'sk-ant-...',
      description: 'Anthropic API-Schlüssel für Claude',
      docUrl: 'https://console.anthropic.com/account/keys'
    },
    {
      name: 'deepseek',
      label: 'DeepSeek',
      placeholder: 'sk-...',
      description: 'DeepSeek API-Schlüssel',
      docUrl: 'https://platform.deepseek.com/api_keys'
    }
  ];

  return (
    <Card className="border-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          API Administration
        </CardTitle>
        <CardDescription>
          Verwalten Sie Ihre KI-API Zugänge für erweiterte Analysen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="api-keys" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="api-keys">API Schlüssel</TabsTrigger>
            <TabsTrigger value="settings">Einstellungen</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api-keys" className="space-y-4">
            {apiProviders.map((provider) => {
              const currentKey = apiKeys[provider.name as keyof ApiKeys];
              const isValid = validations[provider.name];
              const hasKey = currentKey && currentKey.length > 0;
              
              return (
                <div key={provider.name} className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`${provider.name}-key`} className="text-base font-medium">
                      {provider.label}
                    </Label>
                    {hasKey && (
                      <div className="flex items-center gap-2">
                        {isValid ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-red-600" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeApiKey(provider.name)}
                        >
                          Entfernen
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <Input
                    id={`${provider.name}-key`}
                    type="password"
                    placeholder={provider.placeholder}
                    value={currentKey || ''}
                    onChange={(e) => handleApiKeyChange(provider.name, e.target.value)}
                  />
                  
                  <p className="text-xs text-muted-foreground">
                    {provider.description}
                  </p>
                  
                  <a 
                    href={provider.docUrl}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    API-Schlüssel erstellen <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              );
            })}
            
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                Alle API-Schlüssel werden lokal in Ihrem Browser gespeichert und niemals an externe Server übertragen.
              </AlertDescription>
            </Alert>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Aktive APIs</h3>
                  <p className="text-sm text-muted-foreground">
                    {Object.keys(apiKeys).length} von {apiProviders.length} APIs konfiguriert
                  </p>
                </div>
                <div className="text-right">
                  {Object.entries(apiKeys).map(([provider, key]) => (
                    <div key={provider} className="text-sm">
                      {provider}: {validations[provider] ? '✓' : '⚠️'}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Erweiterte Einstellungen</h3>
                <p className="text-sm text-muted-foreground">
                  Weitere Konfigurationsoptionen werden in zukünftigen Versionen verfügbar sein.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}