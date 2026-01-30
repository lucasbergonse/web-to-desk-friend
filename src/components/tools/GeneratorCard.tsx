import { useState } from "react";
import { motion } from "framer-motion";
import { LucideIcon, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CodePreview } from "./CodePreview";
import { useCodeGenerator } from "@/hooks/useCodeGenerator";

type GenerationType = "button" | "image" | "logo" | "effect";

interface GeneratorCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  type: GenerationType;
  placeholder: string;
  examples: string[];
}

export const GeneratorCard = ({
  title,
  description,
  icon: Icon,
  type,
  placeholder,
  examples,
}: GeneratorCardProps) => {
  const [prompt, setPrompt] = useState("");
  const { generate, isLoading, generatedCode, reset, updateCode } = useCodeGenerator();

  const handleGenerate = () => {
    generate(prompt, type);
  };

  const handleExample = (example: string) => {
    setPrompt(example);
  };

  const handleReset = () => {
    setPrompt("");
    reset();
  };

  const handleCodeChange = (newCode: string) => {
    updateCode(newCode);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-card border-border/50 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Textarea
              placeholder={placeholder}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-24 bg-secondary/30 border-border/50 resize-none"
            />

            {/* Example Chips */}
            <div className="flex flex-wrap gap-2">
              {examples.map((example) => (
                <button
                  key={example}
                  onClick={() => handleExample(example)}
                  className="text-xs px-3 py-1.5 rounded-full bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="hero"
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="flex-1 gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isLoading ? "Gerando..." : "Gerar Código"}
            </Button>
            {generatedCode && (
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Limpar
              </Button>
            )}
          </div>

          {/* Code Preview with Edit functionality */}
          <CodePreview 
            code={generatedCode} 
            isLoading={isLoading} 
            onCodeChange={handleCodeChange}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};
