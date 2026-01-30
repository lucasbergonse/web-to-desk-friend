import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Code2, Eye, Pencil, RotateCcw, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface CodePreviewProps {
  code: string;
  isLoading?: boolean;
  onCodeChange?: (newCode: string) => void;
}

export const CodePreview = ({ code, isLoading, onCodeChange }: CodePreviewProps) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("code");
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState(code);

  // Sync edited code when code prop changes (and not editing)
  useEffect(() => {
    if (!isEditing) {
      setEditedCode(code);
    }
  }, [code, isEditing]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editedCode || code);
      setCopied(true);
      toast.success("Código copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar código");
    }
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedCode(code);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    if (onCodeChange) {
      onCodeChange(editedCode);
    }
    toast.success("Código atualizado com sucesso!");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedCode(code);
  };

  const handleResetCode = () => {
    setEditedCode(code);
    toast.info("Código restaurado ao original");
  };

  // Extract HTML for preview
  const extractHtml = () => {
    const displayCode = editedCode || code;
    const htmlMatch = displayCode.match(/```html\n([\s\S]*?)```/);
    const cssMatch = displayCode.match(/```css\n([\s\S]*?)```/);
    const svgMatch = displayCode.match(/```svg\n([\s\S]*?)```/) || displayCode.match(/<svg[\s\S]*?<\/svg>/);

    let html = htmlMatch ? htmlMatch[1] : "";
    const css = cssMatch ? cssMatch[1] : "";
    const svg = svgMatch ? (typeof svgMatch === "string" ? svgMatch : svgMatch[1] || svgMatch[0]) : "";

    if (svg && !html) {
      html = svg;
    }

    if (css) {
      html = `<style>${css}</style>${html}`;
    }

    return html;
  };

  if (!code && !isLoading) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-lg">
        <p>O código gerado aparecerá aqui</p>
      </div>
    );
  }

  const displayCode = editedCode || code;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-lg overflow-hidden bg-card"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/30">
          <TabsList className="bg-transparent">
            <TabsTrigger value="code" className="gap-2">
              <Code2 className="w-4 h-4" />
              Código
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                {onCodeChange && code && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStartEdit}
                    className="gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  disabled={!code}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetCode}
                  className="gap-2 text-muted-foreground"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restaurar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveEdit}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </Button>
              </>
            )}
          </div>
        </div>

        <TabsContent value="code" className="m-0">
          <div className="relative">
            {isLoading && !code && (
              <div className="absolute inset-0 flex items-center justify-center bg-card">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span>Gerando código...</span>
                </div>
              </div>
            )}
            
            {isEditing ? (
              <Textarea
                value={editedCode}
                onChange={(e) => setEditedCode(e.target.value)}
                className="min-h-96 font-mono text-sm bg-transparent border-0 rounded-none focus-visible:ring-0 resize-none"
                placeholder="Edite o código aqui..."
              />
            ) : (
              <pre className="p-4 overflow-auto max-h-96 text-sm font-mono text-foreground">
                <code>{displayCode || " "}</code>
              </pre>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div className="p-6 min-h-48 bg-background flex items-center justify-center">
            {displayCode ? (
              <div
                className="w-full"
                dangerouslySetInnerHTML={{ __html: extractHtml() }}
              />
            ) : (
              <p className="text-muted-foreground">Gerando preview...</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
