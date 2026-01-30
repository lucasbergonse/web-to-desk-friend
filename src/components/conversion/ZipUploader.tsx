import { useRef } from "react";
import { FileArchive, Upload, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ZipUploaderProps {
  file: File | null;
  onChange: (file: File | null) => void;
}

export const ZipUploader = ({ file, onChange }: ZipUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".zip")) {
        toast.error("Por favor, selecione um arquivo .zip válido");
        return;
      }
      if (selectedFile.size > 500 * 1024 * 1024) {
        toast.error("O arquivo não pode exceder 500MB");
        return;
      }
      onChange(selectedFile);
      toast.success("Arquivo ZIP carregado com sucesso!");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2">
      <label className="text-foreground font-medium">Arquivo do Projeto *</label>
      
      {file ? (
        <div className="border border-primary/50 bg-primary/5 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <FileArchive className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-foreground font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange(null)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-foreground font-medium mb-1">
            Arraste seu arquivo .zip ou clique para selecionar
          </p>
          <p className="text-muted-foreground text-sm">
            Suporta projetos React, Vue, Angular, HTML/CSS/JS (máx. 500MB)
          </p>
        </div>
      )}
    </div>
  );
};
