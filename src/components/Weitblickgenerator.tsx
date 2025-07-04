import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Eye, Compass, Target, Lightbulb } from 'lucide-react';

interface Analysis {
  phase: number;
  question: string;
  answer?: string;
  perspectives?: string[];
  risks?: string[];
  opportunities?: string[];
}

const PHASES = [
  {
    title: "Kernhypothese",
    description: "Das Axiom der Revolution",
    icon: Lightbulb,
    question: "Was ist die eine fundamentale Eigenschaft oder das Prinzip, das Ihre Idee zur Grundlage macht? Welche etablierte Annahme wird dadurch in Frage gestellt?"
  },
  {
    title: "Direkte Problemlösung", 
    description: "Kausale Ebene 1",
    icon: Target,
    question: "Welches spezifische Problem löst Ihre Hypothese unmittelbar? Was funktioniert dadurch plötzlich, was vorher nicht funktionierte?"
  },
  {
    title: "Kaskade der Möglichkeiten",
    description: "Kausale Ebenen 2-N", 
    icon: Eye,
    question: "Wenn das Problem gelöst ist - welche völlig neuen Möglichkeiten entstehen dadurch? Was wird dadurch erst denkbar?"
  },
  {
    title: "Resilienz-Prüfung",
    description: "Der Advocatus Diaboli",
    icon: AlertTriangle,
    question: "Welche neuen Risiken entstehen? Was ist das größte Missbrauchspotenzial? Welches ethische Prinzip muss im Kern verankert sein?"
  }
];

const PERSPECTIVES = [
  { name: "Kant", color: "kant", description: "Erkenntnisbedingungen" },
  { name: "Heidegger", color: "heidegger", description: "Existenzielle Verwurzelung" },
  { name: "Hegel", color: "hegel", description: "Dialektische Synthese" },
  { name: "Nagarjuna", color: "nagarjuna", description: "Ontologische Dekonstruktion" },
  { name: "Wissenschaft", color: "science", description: "Empirische Korrelationen" }
];

export default function Weitblickgenerator() {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [initialIdea, setInitialIdea] = useState('');
  const [hasStarted, setHasStarted] = useState(false);

  const analyzeWithPerspectives = useCallback((answer: string, phase: number) => {
    // Simulierte Analyse durch die 5 Instanzen
    const perspectives = [];
    const risks = [];
    const opportunities = [];

    switch (phase) {
      case 0: // Kernhypothese
        perspectives.push(`Kant: Prüfung der Erkenntnisbedingungen dieser Hypothese`);
        perspectives.push(`Heidegger: Existenzielle Verwurzelung im Dasein`);
        perspectives.push(`Hegel: Dialektisches Potenzial für Synthese`);
        perspectives.push(`Nagarjuna: Dekonstruktion fixierter Annahmen`);
        perspectives.push(`Wissenschaft: Empirische Überprüfbarkeit`);
        break;
      case 1: // Problemlösung
        opportunities.push("Neue Forschungsfelder werden möglich");
        opportunities.push("Bestehende Grenzen werden überwunden");
        risks.push("Mögliche unvorhergesehene Nebenwirkungen");
        break;
      case 2: // Kaskade
        opportunities.push("Gesellschaftliche Transformation");
        opportunities.push("Wissenschaftliche Revolution");
        opportunities.push("Neue Technologien");
        risks.push("Systemische Instabilität");
        break;
      case 3: // Resilienz
        risks.push("Ethische Dilemmata");
        risks.push("Missbrauchspotenzial");
        risks.push("Unerwünschte Konsequenzen");
        break;
    }

    return { perspectives, risks, opportunities };
  }, []);

  const handleStartAnalysis = () => {
    if (!initialIdea.trim()) return;
    setHasStarted(true);
    setCurrentPhase(0);
  };

  const handleNextPhase = async () => {
    if (!currentAnswer.trim()) return;
    
    setIsAnalyzing(true);
    
    // Simuliere Analyseprozess
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const analysis = analyzeWithPerspectives(currentAnswer, currentPhase);
    
    const newAnalysis: Analysis = {
      phase: currentPhase,
      question: PHASES[currentPhase].question,
      answer: currentAnswer,
      ...analysis
    };
    
    setAnalyses(prev => [...prev, newAnalysis]);
    setCurrentAnswer('');
    setIsAnalyzing(false);
    
    if (currentPhase < PHASES.length - 1) {
      setCurrentPhase(prev => prev + 1);
    }
  };

  const resetGenerator = () => {
    setHasStarted(false);
    setCurrentPhase(0);
    setAnalyses([]);
    setCurrentAnswer('');
    setInitialIdea('');
    setIsAnalyzing(false);
  };

  const progress = ((currentPhase + (currentAnswer ? 0.5 : 0)) / PHASES.length) * 100;

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
              Ein interaktives System zur Analyse und Navigation visionärer Ideen durch die Perspektiven von Kant, Heidegger, Hegel, Nagarjuna und der modernen Wissenschaft.
            </p>
          </div>

          <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-primary/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Ihre revolutionäre Idee
              </CardTitle>
              <CardDescription>
                Beschreiben Sie Ihre Hypothese, Vision oder Ihren Lösungsansatz. Der Generator wird Sie durch einen strukturierten Analyseprozess führen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Textarea
                placeholder="Z.B. 'Bewusstsein ist fundamental relational - es entsteht nicht in Gehirnen, sondern zwischen Systemen in Beziehung...'"
                value={initialIdea}
                onChange={(e) => setInitialIdea(e.target.value)}
                className="min-h-24 text-base"
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
                disabled={!initialIdea.trim()}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                <Compass className="h-4 w-4 mr-2" />
                Analyse starten
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentPhaseData = PHASES[currentPhase];
  const IconComponent = currentPhaseData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header mit Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Compass className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Weitblickgenerator</h1>
            </div>
            <Button variant="outline" onClick={resetGenerator}>
              Neu starten
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Phase {currentPhase + 1} von {PHASES.length} • {Math.round(progress)}% abgeschlossen
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Hauptbereich - Aktuelle Phase */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconComponent className="h-5 w-5 text-primary" />
                  {currentPhaseData.title}
                </CardTitle>
                <CardDescription>{currentPhaseData.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                  <p className="font-medium">{currentPhaseData.question}</p>
                </div>
                
                <Textarea
                  placeholder="Ihre Antwort..."
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className="min-h-32"
                  disabled={isAnalyzing}
                />

                <Button 
                  onClick={handleNextPhase}
                  disabled={!currentAnswer.trim() || isAnalyzing}
                  className="w-full"
                  size="lg"
                >
                  {isAnalyzing ? 'Analysiere...' : 
                   currentPhase === PHASES.length - 1 ? 'Analyse abschließen' : 'Weiter zur nächsten Phase'}
                </Button>
              </CardContent>
            </Card>

            {/* Bisherige Analysen */}
            {analyses.map((analysis, index) => (
              <Card key={index} className="bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {React.createElement(PHASES[analysis.phase].icon, { className: "h-4 w-4" })}
                    {PHASES[analysis.phase].title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-muted/30 rounded border-l-2 border-primary/50">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Ihre Antwort:</p>
                    <p>{analysis.answer}</p>
                  </div>
                  
                  {analysis.perspectives && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Perspektiven-Analyse
                      </h4>
                      <div className="space-y-1">
                        {analysis.perspectives.map((perspective, i) => (
                          <div key={i} className="text-sm p-2 bg-muted/20 rounded">
                            {perspective}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analysis.opportunities && analysis.opportunities.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-green-700">Möglichkeiten</h4>
                      <div className="space-y-1">
                        {analysis.opportunities.map((opp, i) => (
                          <Badge key={i} variant="outline" className="mr-2 mb-1 bg-green-50 border-green-200">
                            {opp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analysis.risks && analysis.risks.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        Riffe & Untiefen
                      </h4>
                      <div className="space-y-1">
                        {analysis.risks.map((risk, i) => (
                          <Badge key={i} variant="outline" className="mr-2 mb-1 bg-amber-50 border-amber-200">
                            {risk}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sidebar - Kompass */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-card to-accent/5 border-accent/20">
              <CardHeader>
                <CardTitle className="text-lg">Kompass-Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {PHASES.map((phase, index) => {
                    const isCompleted = index < currentPhase;
                    const isCurrent = index === currentPhase;
                    const IconComp = phase.icon;
                    
                    return (
                      <div 
                        key={index}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                          isCurrent ? 'bg-primary/10 border border-primary/20' :
                          isCompleted ? 'bg-green-50 border border-green-200' :
                          'bg-muted/30'
                        }`}
                      >
                        <IconComp className={`h-4 w-4 ${
                          isCurrent ? 'text-primary' :
                          isCompleted ? 'text-green-600' :
                          'text-muted-foreground'
                        }`} />
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            isCurrent ? 'text-primary' :
                            isCompleted ? 'text-green-700' :
                            'text-muted-foreground'
                          }`}>
                            {phase.title}
                          </p>
                        </div>
                        {isCompleted && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                        {isCurrent && <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />}
                      </div>
                    );
                  })}
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