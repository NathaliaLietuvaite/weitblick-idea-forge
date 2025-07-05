import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Eye, Compass, Target, Lightbulb, Settings, ArrowLeft, ArrowRight, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { GeminiIntegration, GeminiService } from './GeminiIntegration';
import { AdminInterface, ApiKeys } from './AdminInterface';
import { AIApiService } from './AIApiService';

interface Thesis {
  id: string;
  type: 'thesis' | 'antithesis' | 'quintessence' | 'perspective';
  title: string;
  content: string;
  perspectives: string[];
  category: string;
  level: number;
  parentId?: string;
  children: string[];
  perspectiveName?: string; // For perspective-based theses
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

  const generatePerspectiveTheses = async (idea: string): Promise<Thesis[]> => {
    const category = categorizeIdea(idea);
    const level = detectSophisticationLevel(idea);
    const language = detectLanguage(idea);
    
    const perspectiveTheses: Thesis[] = [];
    
    // Generate comprehensive discourse between all perspectives
    if (Object.values(apiKeys).some(key => key)) {
      try {
        const aiService = new AIApiService(apiKeys as ApiKeys);
        const discoursePrompt = language === 'de'
          ? `Führe einen philosophischen Diskurs zwischen Kant, Heidegger, Hegel, Nagarjuna und der modernen Wissenschaft über diese Idee: "${idea}". 
             Jede Perspektive soll auf die anderen eingehen und einen echten Dialog entwickeln, nicht nur isolierte Meinungen.
             Format: KANT: [Position und Reaktion auf andere] | HEIDEGGER: [Position und Reaktion] | HEGEL: [Position und Reaktion] | NAGARJUNA: [Position und Reaktion] | WISSENSCHAFT: [Position und Reaktion]`
          : `Conduct a philosophical discourse between Kant, Heidegger, Hegel, Nagarjuna, and modern Science about this idea: "${idea}".
             Each perspective should respond to the others and develop a real dialogue, not just isolated opinions.
             Format: KANT: [Position and reaction to others] | HEIDEGGER: [Position and reaction] | HEGEL: [Position and reaction] | NAGARJUNA: [Position and reaction] | SCIENCE: [Position and reaction]`;
        
        const results = await aiService.analyzeWithMultipleAIs(discoursePrompt, 'Discourse', level, language);
        const availableResults = Object.entries(results).filter(([_, result]) => result && !result.includes('fehlgeschlagen'));
        
        if (availableResults.length > 0) {
          const discourse = availableResults[0][1];
          const parts = discourse.split('|').map(part => part.trim());
          
          if (parts.length >= 5) {
            PERSPECTIVES.forEach((perspective, index) => {
              if (parts[index]) {
                const content = parts[index].replace(new RegExp(`^${perspective.name.toUpperCase()}:`, 'i'), '').trim();
                const perspectiveThesis: Thesis = {
                  id: `perspective-${perspective.name.toLowerCase()}-${Date.now()}`,
                  type: 'perspective',
                  title: perspective.name,
                  content: content || `Fallback analysis for ${perspective.name}`,
                  perspectives: [],
                  category: category.name,
                  level: 0,
                  perspectiveName: perspective.name,
                  children: []
                };
                perspectiveTheses.push(perspectiveThesis);
              }
            });
          }
        }
      } catch (error) {
        console.error('AI discourse generation error:', error);
      }
    }
    
    // Fallback if AI discourse failed
    if (perspectiveTheses.length === 0) {
      for (const perspective of PERSPECTIVES) {
        let analysis = '';
        
        if (language === 'de') {
          switch (perspective.name) {
            case 'Kant':
              analysis = level === 'advanced' 
                ? `Diese Idee berührt die transzendentalen Bedingungen der Erkenntnis und fordert unsere apriorischen Anschauungsformen heraus. Sie zeigt auf, wie synthetische Urteile a priori neue Erkenntnisräume eröffnen können.`
                : `Die Idee zeigt neue Wege der Erkenntnis und erweitert unser Verständnis der Welt. Sie hilft uns zu verstehen, wie wir Wissen gewinnen.`;
              break;
            case 'Heidegger':
              analysis = level === 'advanced'
                ? `Das Dasein wird hier in seiner existenzialen Verfasstheit neu verstanden - ein authentisches In-der-Welt-sein. Die Idee enthüllt die ursprüngliche Zeitlichkeit des Seins.`
                : `Die Idee verändert unser Verständnis davon, was es bedeutet, Mensch zu sein. Sie zeigt uns neue Wege des Lebens auf.`;
              break;
            case 'Hegel':
              analysis = level === 'advanced'
                ? `Eine dialektische Bewegung zeigt sich - These und Antithese finden zu einer höheren Synthese. Der Weltgeist manifestiert sich in dieser neuen Erkenntnisstufe.`
                : `Die Idee bringt Gegensätze zusammen und schafft etwas völlig Neues. Sie zeigt, wie sich Widersprüche auflösen lassen.`;
              break;
            case 'Nagarjuna':
              analysis = level === 'advanced'
                ? `Die Sunyata wird sichtbar - die Leerheit fester Konzepte und die abhängige Entstehung aller Phänomene. Alle Dualitäten lösen sich in der Erkenntnis der Interdependenz auf.`
                : `Die Idee zeigt uns, dass alles miteinander verbunden ist. Nichts existiert unabhängig von allem anderen.`;
              break;
            case 'Wissenschaft':
              analysis = level === 'advanced'
                ? `Die Hypothese ist empirisch überprüfbar und eröffnet neue Forschungsmethodologien. Sie folgt dem Prinzip der Falsifizierbarkeit nach Popper.`
                : `Die Idee kann durch Experimente getestet werden. Sie öffnet neue Forschungsmöglichkeiten.`;
              break;
          }
        } else {
          analysis = `${perspective.name}: This idea reveals new dimensions of understanding and opens pathways for deeper exploration of reality.`;
        }
        
        const perspectiveThesis: Thesis = {
          id: `perspective-${perspective.name.toLowerCase()}-${Date.now()}`,
          type: 'perspective',
          title: perspective.name,
          content: analysis,
          perspectives: [],
          category: category.name,
          level: 0,
          perspectiveName: perspective.name,
          children: []
        };
        
        perspectiveTheses.push(perspectiveThesis);
      }
    }
    
    return perspectiveTheses;
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
      // Generate the 5 individual perspective theses instead of thesis/antithesis
      const perspectiveTheses = await generatePerspectiveTheses(initialIdea);
      
      setTheses(perspectiveTheses);
      setCurrentThesisId(perspectiveTheses[0]?.id || null);
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
      const currentLevelPerspectives = theses.filter(t => t.level === 0 && t.type === 'perspective');
      const quintessence = await generateQuintessence(currentLevelPerspectives);
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
      // Generate new perspective theses based on the selected thesis
      const newPerspectiveTheses = await generatePerspectiveTheses(fromThesis.content);
      
      const updatedTheses = newPerspectiveTheses.map(thesis => ({
        ...thesis,
        level: fromThesis.level + 1,
        parentId: fromThesis.id,
        id: `forward-${thesis.perspectiveName?.toLowerCase()}-${Date.now()}`
      }));
      
      setTheses(prev => [...prev, ...updatedTheses]);
      setCurrentThesisId(updatedTheses[0]?.id || null);
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

          {/* API Administration - Collapsible at bottom */}
          <div className="mt-8">
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between mb-4"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    API Administration
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
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
              </CollapsibleContent>
            </Collapsible>
          </div>
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

            {/* Aktuelle Perspektiven-Ebene */}
            {currentLevelTheses.map((thesis) => (
              <Card 
                key={thesis.id} 
                className={`cursor-pointer transition-all ${
                  thesis.id === currentThesisId 
                    ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-card' 
                    : 'bg-card/50 hover:bg-card'
                }`}
                onClick={() => setCurrentThesisId(thesis.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {thesis.type === 'perspective' && <Eye className="h-5 w-5 text-blue-600" />}
                    {thesis.type === 'quintessence' && <Lightbulb className="h-5 w-5 text-purple-600" />}
                    {thesis.title}
                    <Badge variant="outline" className="ml-auto text-xs">
                      Level {thesis.level}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-base leading-relaxed">{thesis.content}</p>

                  <div className="flex gap-2 pt-2">
                    {thesis.id === currentThesisId && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleThinkForward(thesis);
                        }}
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
            {currentLevelTheses.length >= 3 && 
             currentLevelTheses.some(t => t.type === 'perspective') && 
             !currentLevelTheses.some(t => t.type === 'quintessence') && (
              <Card className="border-dashed border-2 border-purple-300/50 bg-gradient-to-br from-purple-50/30 to-purple-100/30">
                <CardContent className="text-center py-8">
                  <Button
                    onClick={handleGenerateQuintessence}
                    disabled={isAnalyzing}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg"
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Quintessenz aus allen Perspektiven generieren
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Vereint alle {currentLevelTheses.filter(t => t.type === 'perspective').length} Perspektiven zu einer höheren Synthese
                  </p>
                </CardContent>
              </Card>
            )}

            {/* API Administration - Collapsible at bottom */}
            <div className="mt-8">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between mb-4"
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      API Administration
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
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
                </CollapsibleContent>
              </Collapsible>
            </div>
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
                       {thesis.type === 'perspective' && <Eye className="h-4 w-4 text-blue-600" />}
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