import { Github, Twitter } from "lucide-react";
export const Footer = () => {
  return <footer className="py-12 border-t border-border">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="font-bold text-primary-foreground">W2</span>
            </div>
            <span className="font-semibold text-lg">Web2Desktop</span>
          </div>

          <p className="text-muted-foreground text-sm text-center">
            Transforme qualquer app web em desktop. Sem mágica, sem modificações.
          </p>

          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="GitHub">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Twitter">
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-muted-foreground text-xs">
            © 2024 Web2Desktop. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>;
};