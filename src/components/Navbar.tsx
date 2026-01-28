import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Menu, X, Wand2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface NavbarProps {
  onGetStarted: () => void;
}

export const Navbar = ({ onGetStarted }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50"
    >
      <div className="container px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="font-bold text-sm text-primary-foreground">W2D</span>
            </div>
            <span className="font-semibold text-lg hidden sm:inline">Web2Desktop</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Funcionalidades
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Como Funciona
            </a>
            <Link to="/tools" className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1">
              <Wand2 className="w-3.5 h-3.5" />
              Ferramentas IA
            </Link>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Preços
            </a>
          </div>

          {/* CTA */}
          <div className="hidden md:block">
            <Button variant="hero" size="sm" onClick={onGetStarted}>
              Começar
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="md:hidden py-4 border-t border-border"
          >
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Funcionalidades
              </a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                Como Funciona
              </a>
              <Link to="/tools" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <Wand2 className="w-4 h-4" />
                Ferramentas IA
              </Link>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Preços
              </a>
              <Button variant="hero" size="sm" onClick={onGetStarted}>
                Começar
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};
