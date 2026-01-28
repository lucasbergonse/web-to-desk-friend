import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Code2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface CodePreviewProps {
  code: string;
  isLoading?: boolean;
}

export const CodePreview = ({ code, isLoading }: CodePreviewProps) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("code");

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Código copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar código");
    }
  };

  // Extract HTML for preview
  const extractHtml = () => {
    const htmlMatch = code.match(/```html\n([\s\S]*?)```/);
    const cssMatch = code.match(/```css\n([\s\S]*?)```/);
    const svgMatch = code.match(/```svg\n([\s\S]*?)```/) || code.match(/<svg[\s\S]*?<\/svg>/);

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
            <pre className="p-4 overflow-auto max-h-96 text-sm font-mono text-foreground">
              <code>{code || " "}</code>
            </pre>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div className="p-6 min-h-48 bg-background flex items-center justify-center">
            {code ? (
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
