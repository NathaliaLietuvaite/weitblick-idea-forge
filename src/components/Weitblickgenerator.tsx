import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Eye, Compass, Target, Lightbulb, Settings, ArrowLeft, ArrowRight, Brain } from 'lucide-react';
import { GeminiIntegration, GeminiService } from './GeminiIntegration';
import { AdminInterface, ApiKeys } from './AdminInterface';
import { AIApiService } from './AIApiService';

interface Thesis {
  id: string;
  type: 'thesis' | 'antithesis' | 'quintessence';
  title: string;
  content: string;
  perspectives: string[];
  category: string;
  level: number;
  parentId?: string;
  children: string[];
}

interface IdeaCategory {
  name: string;
  keywords: string[];
  icon: any;
}

const IDEA_CATEGORIES: IdeaCategory[] = [
  { name: 'Wissenschaft', keywords: ['hypothese', 'theorie', 'experiment', 'beweis', 'forschung'], icon: Target },
  { name: 'Technologie', keywords: ['ki', 'digital', 'automatisierung', 'innovation', 'software'], icon: Lightbulb },
  { name: 'Gesellschaft', keywords: ['politik', 'demokratie', 'gemeinschaft', 'kultur', 'soziologie'], icon: Eye },
  { name: 'Philosophie', keywords: ['bewusstsein', 'realität', 'wahrheit', 'existenz', 'ontologie'], icon: Compass },
  { name: 'Ökonomie', keywords: ['wirtschaft', 'markt', 'geld', 'wert', 'kapital'], icon: AlertTriangle }
];

const PERSPECTIVES = [
  { name: "Kant", color: "kant", description: "Erkenntnisbedingungen" },
  { name: "Heidegger", color: "heidegger", description: "Existenzielle Verwurzelung" },
  { name: "Hegel", color: "hegel", description: "Dialektische Synthese" },
  { name: "Nagarjuna", color: "nagarjuna", description: "Ontologische Dekonstruktion" },
  { name: "Wissenschaft", color: "science", description: "Empirische Korrelationen" }
];

export default function Weitblickgenerator() {
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [currentThesisId, setCurrentThesisId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [initialIdea, setInitialIdea] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [apiKeys, setApiKeys] = useState<Partial<ApiKeys>>(() => {
    return {
      gemini: localStorage.getItem('gemini_api_key') || '',
      openai: localStorage.getItem('openai_api_key') || '',
      anthropic: localStorage.getItem('anthropic_api_key') || '',
      deepseek: localStorage.getItem('deepseek_api_key') || ''
    };
  });
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setApiKeys(prev => ({ ...prev, gemini: savedApiKey }));
      setGeminiService(new GeminiService(savedApiKey));
    }
  }, []);

  const handleApiKeysUpdate = (newApiKeys: Partial<ApiKeys>) => {
    setApiKeys(newApiKeys);
    if (newApiKeys.gemini) {
      setGeminiService(new GeminiService(newApiKeys.gemini));
    }
  };

  const detectSophisticationLevel = (text: string): 'basic' | 'intermediate' | 'advanced' => {
    const academicTerms = ['epistemologie', 'ontologie', 'paradigma', 'empirisch', 'relational', 'dialektisch', 'axiom'];
    const complexSentences = text.split('.').filter(s => s.split(' ').length > 15).length;
    const academicTermCount = academicTerms.filter(term => text.toLowerCase().includes(term)).length;
    
    if (academicTermCount >= 3 || complexSentences >= 2) return 'advanced';
    if (academicTermCount >= 1 || complexSentences >= 1) return 'intermediate';
    return 'basic';
  };

  const detectLanguage = (text: string): 'de' | 'en' => {
    const germanWords = ['und', 'der', 'die', 'das', 'ist', 'aber', 'wenn', 'durch'];
    const germanCount = germanWords.filter(word => text.toLowerCase().includes(word)).length;
    return germanCount >= 2 ? 'de' : 'en';
  };

  const categorizeIdea = (idea: string): IdeaCategory => {
    const lowerIdea = idea.toLowerCase();
    
    for (const category of IDEA_CATEGORIES) {
      const matchCount = category.keywords.filter(keyword => 
        lowerIdea.includes(keyword)
      ).length;
      
      if (matchCount > 0) {
        return category;
      }
    }
    
    return IDEA_CATEGORIES[3]; // Default to Philosophy
  };

  const generateThesesFromIdea = async (idea: string): Promise<{ thesis: Thesis; antithesis: Thesis }> => {
    const category = categorizeIdea(idea);
    const level = detectSophisticationLevel(idea);
    const language = detectLanguage(idea);
    
    const thesisId = `thesis-${Date.now()}`;
    const antithesisId = `antithesis-${Date.now()}`;
    
    let thesisContent = '';
    let antithesisContent = '';
    let perspectives: string[] = [];

    // Try AI APIs first
    if (Object.values(apiKeys).some(key => key)) {
      try {
        const aiService = new AIApiService(apiKeys as ApiKeys);
        const analysisPrompt = language === 'de' 
          ? `Analysiere diese Idee: "${idea}". Generiere eine These und eine Antithese. Antworte in diesem Format: THESE: [These] | ANTITHESE: [Antithese]`
          : `Analyze this idea: "${idea}". Generate a thesis and antithesis. Respond in this format: THESIS: [thesis] | ANTITHESIS: [antithesis]`;
          
        const results = await aiService.analyzeWithMultipleAIs(analysisPrompt, 'Generator', level, language);
        const availableResults = Object.entries(results).filter(([_, result]) => result && !result.includes('fehlgeschlagen'));
        
        if (availableResults.length > 0) {
          const result = availableResults[0][1];
          const parts = result.split('|');
          if (parts.length >= 2) {
            thesisContent = parts[0].replace(/^(THESE:|THESIS:)/i, '').trim();
            antithesisContent = parts[1].replace(/^(ANTITHESE:|ANTITHESIS:)/i, '').trim();
          }
        }
      } catch (error) {
        console.error('AI API error:', error);
      }
    }

    // Fallback analysis
    if (!thesisContent || !antithesisContent) {
      if (language === 'de') {
        thesisContent = `These: ${idea} - Diese Idee eröffnet revolutionäre Möglichkeiten durch ihre innovative Herangehensweise.`;
        antithesisContent = `Antithese: Kritische Betrachtung von "${idea}" - Diese Idee birgt potenzielle Risiken und ungelöste Widersprüche.`;
      } else {
        thesisContent = `Thesis: ${idea} - This idea opens revolutionary possibilities through its innovative approach.`;
        antithesisContent = `Antithesis: Critical view of "${idea}" - This idea harbors potential risks and unresolved contradictions.`;
      }
    }

    // Generate perspectives
    perspectives = await generatePerspectivesForIdea(idea, level, language);

    const thesis: Thesis = {
      id: thesisId,
      type: 'thesis',
      title: language === 'de' ? 'These' : 'Thesis',
      content: thesisContent,
      perspectives: perspectives.slice(0, 3),
      category: category.name,
      level: 0,
      children: [antithesisId]
    };

    const antithesis: Thesis = {
      id: antithesisId,
      type: 'antithesis', 
      title: language === 'de' ? 'Antithese' : 'Antithesis',
      content: antithesisContent,
      perspectives: perspectives.slice(2, 5),
      category: category.name,
      level: 0,
      parentId: thesisId,
      children: []
    };

    return { thesis, antithesis };
  };

  const generatePerspectivesForIdea = async (idea: string, level: string, language: string): Promise<string[]> => {
    const perspectives = [];
    
    // Generate perspective analysis for each of the 5 systems
    for (const perspective of PERSPECTIVES) {
      let analysis = '';
      
      if (language === 'de') {
        switch (perspective.name) {
          case 'Kant':
            analysis = level === 'advanced' 
              ? `${perspective.name}: Diese Idee berührt die transzendentalen Bedingungen der Erkenntnis und fordert unsere apriorischen Anschauungsformen heraus.`
              : `${perspective.name}: Die Idee zeigt neue Wege der Erkenntnis und erweitert unser Verständnis der Welt.`;
            break;
          case 'Heidegger':
            analysis = level === 'advanced'
              ? `${perspective.name}: Das Dasein wird hier in seiner existenzialen Verfasstheit neu verstanden - ein authentisches In-der-Welt-sein.`
              : `${perspective.name}: Die Idee verändert unser Verständnis davon, was es bedeutet, Mensch zu sein.`;
            break;
          case 'Hegel':
            analysis = level === 'advanced'
              ? `${perspective.name}: Eine dialektische Bewegung zeigt sich - These und Antithese finden zu einer höheren Synthese.`
              : `${perspective.name}: Die Idee bringt Gegensätze zusammen und schafft etwas völlig Neues.`;
            break;
          case 'Nagarjuna':
            analysis = level === 'advanced'
              ? `${perspective.name}: Die Sunyata wird sichtbar - die Leerheit fester Konzepte und die abhängige Entstehung aller Phänomene.`
              : `${perspective.name}: Die Idee zeigt uns, dass alles miteinander verbunden ist.`;
            break;
          case 'Wissenschaft':
            analysis = level === 'advanced'
              ? `${perspective.name}: Die Hypothese ist empirisch überprüfbar und eröffnet neue Forschungsmethodologien.`
              : `${perspective.name}: Die Idee kann durch Experimente getestet werden.`;
            break;
        }
      } else {
        analysis = `${perspective.name}: This idea reveals new dimensions of understanding...`;
      }
      
      perspectives.push(analysis);
    }
    
    return perspectives;
  };

  const generateQuintessence = async (parentTheses: Thesis[]): Promise<Thesis> => {
    const language = detectLanguage(initialIdea);
    const level = detectSophisticationLevel(initialIdea);
    
    const quintessenceId = `quintessence-${Date.now()}`;
    
    let content = '';
    
    if (language === 'de') {
      content = level === 'advanced'
        ? `Quintessenz: Die dialektische Spannung zwischen These und Antithese führt zu einer höheren Synthese, die beide Pole in sich aufhebt und transzendiert. Eine neue Wahrheitsebene wird erreicht.`
        : `Quintessenz: Aus dem Spannungsfeld zwischen These und Antithese entsteht eine neue, umfassendere Sichtweise, die beide Perspektiven vereint.`;
    } else {
      content = `Quintessence: The dialectical tension between thesis and antithesis leads to a higher synthesis that transcends both poles.`;
    }

    // Generate combined perspectives
    const allPerspectives = parentTheses.flatMap(t => t.perspectives);
    const uniquePerspectives = [...new Set(allPerspectives)];

    return {
      id: quintessenceId,
      type: 'quintessence',
      title: language === 'de' ? 'Quintessenz' : 'Quintessence',
      content,
      perspectives: uniquePerspectives.slice(0, 5),
      category: parentTheses[0]?.category || 'Philosophie',
      level: (parentTheses[0]?.level || 0) + 1,
      parentId: parentTheses[0]?.id,
      children: []
    };
  };

  const handleStartAnalysis = async () => {
    if (!initialIdea.trim()) return;
    
    setIsAnalyzing(true);
    setHasStarted(true);
    
    try {
      const { thesis, antithesis } = await generateThesesFromIdea(initialIdea);
      const newTheses = [thesis, antithesis];
      
      setTheses(newTheses);
      setCurrentThesisId(thesis.id);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateQuintessence = async () => {
    if (theses.length < 2) return;
    
    setIsAnalyzing(true);
    
    try {
      const quintessence = await generateQuintessence(theses.filter(t => t.level === 0));
      setTheses(prev => [...prev, quintessence]);
      setCurrentThesisId(quintessence.id);
    } catch (error) {
      console.error('Quintessence generation error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleThinkForward = async (fromThesis: Thesis) => {
    setIsAnalyzing(true);
    
    try {
      const { thesis, antithesis } = await generateThesesFromIdea(fromThesis.content);
      
      const newThesis = {
        ...thesis,
        level: fromThesis.level + 1,
        parentId: fromThesis.id,
        id: `forward-thesis-${Date.now()}`
      };
      
      const newAntithesis = {
        ...antithesis,
        level: fromThesis.level + 1,
        parentId: fromThesis.id,
        id: `forward-antithesis-${Date.now()}`
      };
      
      setTheses(prev => [...prev, newThesis, newAntithesis]);
      setCurrentThesisId(newThesis.id);
    } catch (error) {
      console.error('Forward thinking error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetGenerator = () => {
    setHasStarted(false);
    setTheses([]);
    setCurrentThesisId(null);
    setInitialIdea('');
    setIsAnalyzing(false);
  };

  const currentThesis = theses.find(t => t.id === currentThesisId);
  const currentLevelTheses = theses.filter(t => t.level === (currentThesis?.level || 0));

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-6">
              <Compass className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Weitblickgenerator
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ein interaktives System zur automatischen Generierung gegensätzlicher Thesen und deren Quintessenz durch die Perspektiven von Kant, Heidegger, Hegel, Nagarjuna und der modernen Wissenschaft.
            </p>
          </div>

          {showSettings && (
            <div className="mb-6">
              <Tabs defaultValue="admin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="admin">Administration</TabsTrigger>
                  <TabsTrigger value="integration">Gemini Legacy</TabsTrigger>
                </TabsList>
                
                <TabsContent value="admin">
                  <AdminInterface 
                    onApiKeysUpdate={handleApiKeysUpdate}
                    currentApiKeys={apiKeys}
                  />
                </TabsContent>
                
                <TabsContent value="integration">
                  <GeminiIntegration 
                    onApiKeySet={(key) => handleApiKeysUpdate({ ...apiKeys, gemini: key })}
                    currentApiKey={apiKeys.gemini}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}

          <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-primary/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Ihre revolutionäre Idee
              </CardTitle>
              <CardDescription>
                Beschreiben Sie Ihre Hypothese oder Vision. Das System erkennt automatisch die Kategorie und generiert gegensätzliche Thesen mit anschließender Quintessenz.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Textarea
                placeholder="Z.B. 'Bewusstsein ist fundamental relational - es entsteht nicht in Gehirnen, sondern zwischen Systemen in Beziehung...'"
                value={initialIdea}
                onChange={(e) => setInitialIdea(e.target.value)}
                className="min-h-24 text-base"
                disabled={isAnalyzing}
              />
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Analysiert durch:</span>
                {PERSPECTIVES.map((perspective) => (
                  <Badge 
                    key={perspective.name}
                    variant="outline" 
                    className={`bg-${perspective.color}/10 border-${perspective.color}/30 text-${perspective.color}`}
                  >
                    {perspective.name}
                  </Badge>
                ))}
              </div>

              <Button 
                onClick={handleStartAnalysis}
                disabled={!initialIdea.trim() || isAnalyzing}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-pulse" />
                    Analysiere...
                  </>
                ) : (
                  <>
                    <Compass className="h-4 w-4 mr-2" />
                    Thesen-Generierung starten
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Compass className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Weitblickgenerator</h1>
              {apiKeys.gemini && (
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                  Gemini Pro
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={resetGenerator}>
                Neu starten
              </Button>
            </div>
          </div>
        </div>

        {showSettings && (
          <div className="mb-6">
            <Tabs defaultValue="admin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="admin">Administration</TabsTrigger>
                <TabsTrigger value="integration">Gemini Legacy</TabsTrigger>
              </TabsList>
              
              <TabsContent value="admin">
                <AdminInterface 
                  onApiKeysUpdate={handleApiKeysUpdate}
                  currentApiKeys={apiKeys}
                />
              </TabsContent>
              
              <TabsContent value="integration">
                <GeminiIntegration 
                  onApiKeySet={(key) => handleApiKeysUpdate({ ...apiKeys, gemini: key })}
                  currentApiKey={apiKeys.gemini}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Hauptbereich - Aktuelle Thesen */}
          <div className="lg:col-span-2 space-y-6">
            {/* Original Idee */}
            <Card className="bg-gradient-to-br from-card to-muted/5 border-muted/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-muted-foreground" />
                  Ursprungsidee
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground italic">{initialIdea}</p>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    Kategorie: {currentThesis?.category || 'Unbekannt'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Aktuelle Thesen-Ebene */}
            {currentLevelTheses.map((thesis) => (
              <Card key={thesis.id} className={`${
                thesis.id === currentThesisId ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-card' : 'bg-card/50'
              }`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {thesis.type === 'thesis' && <Target className="h-5 w-5 text-green-600" />}
                    {thesis.type === 'antithesis' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                    {thesis.type === 'quintessence' && <Lightbulb className="h-5 w-5 text-purple-600" />}
                    {thesis.title}
                    <Badge variant="outline" className="ml-auto text-xs">
                      Level {thesis.level}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-base">{thesis.content}</p>
                  
                  {thesis.perspectives && thesis.perspectives.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Perspektiven-Analyse
                      </h4>
                      <div className="space-y-1">
                        {thesis.perspectives.map((perspective, i) => (
                          <div key={i} className="text-sm p-2 bg-muted/20 rounded">
                            {perspective}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {thesis.id === currentThesisId && (
                      <Button
                        onClick={() => handleThinkForward(thesis)}
                        disabled={isAnalyzing}
                        variant="outline"
                        size="sm"
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        Weiterdenken
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Quintessenz Generator */}
            {currentLevelTheses.length >= 2 && !currentLevelTheses.some(t => t.type === 'quintessence') && (
              <Card className="border-dashed border-2 border-purple-200 bg-purple-50/50">
                <CardContent className="text-center py-8">
                  <Button
                    onClick={handleGenerateQuintessence}
                    disabled={isAnalyzing}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Quintessenz generieren
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Vereint These und Antithese zu einer höheren Synthese
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Navigation */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-card to-accent/5 border-accent/20">
              <CardHeader>
                <CardTitle className="text-lg">Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {theses.map((thesis) => (
                    <div 
                      key={thesis.id}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer ${
                        thesis.id === currentThesisId ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30 hover:bg-muted/50'
                      }`}
                      onClick={() => setCurrentThesisId(thesis.id)}
                    >
                      {thesis.type === 'thesis' && <Target className="h-4 w-4 text-green-600" />}
                      {thesis.type === 'antithesis' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                      {thesis.type === 'quintessence' && <Lightbulb className="h-4 w-4 text-purple-600" />}
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          thesis.id === currentThesisId ? 'text-primary' : 'text-foreground'
                        }`}>
                          {thesis.title}
                        </p>
                        <p className="text-xs text-muted-foreground">Level {thesis.level}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Referenzsysteme</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {PERSPECTIVES.map((perspective) => (
                    <div key={perspective.name} className="flex items-center gap-2 p-2">
                      <div className={`w-3 h-3 rounded-full bg-${perspective.color}`} />
                      <div>
                        <p className="font-medium text-sm">{perspective.name}</p>
                        <p className="text-xs text-muted-foreground">{perspective.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}