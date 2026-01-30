import { useRef } from "react";
import { Upload, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface IconUploaderProps {
  file: File | null;
  onChange: (file: File | null) => void;
}

export const IconUploader = ({ file, onChange }: IconUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        toast.error("Por favor, selecione um arquivo de imagem.");
        return;
      }
      onChange(selectedFile);
      toast.success("Ícone carregado com sucesso!");
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-foreground font-medium">Ícone do App (opcional)</label>
      
      {file ? (
        <div className="border border-border rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
              <img
                src={URL.createObjectURL(file)}
                alt="App icon preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-foreground font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
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
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleIconUpload}
            className="hidden"
          />
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
              <Image className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="text-muted-foreground text-sm">
                Clique para fazer upload
              </p>
              <p className="text-xs text-muted-foreground/70">
                PNG, ICO, ICNS (recomendado: 512x512)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
