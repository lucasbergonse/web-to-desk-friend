import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GeneratorCard } from "@/components/tools/GeneratorCard";
import { MousePointerClick, ImageIcon, Hexagon, Wand2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const generators = [
  {
    title: "Gerador de Botões",
    description: "Crie botões personalizados com HTML/CSS",
    icon: MousePointerClick,
    type: "button" as const,
    placeholder: "Descreva o botão que deseja criar...\nEx: Um botão azul com gradiente, bordas arredondadas e efeito hover",
    examples: [
      "Botão neon com efeito glow",
      "Botão minimalista flat",
      "Botão 3D com sombra",
      "Botão com ícone animado",
    ],
  },
  {
    title: "Componentes de Imagem",
    description: "Gere galerias, cards e layouts para imagens",
    icon: ImageIcon,
    type: "image" as const,
    placeholder: "Descreva o componente de imagem...\nEx: Uma galeria de 3 colunas com hover zoom",
    examples: [
      "Galeria masonry responsiva",
      "Card de produto com imagem",
      "Hero section com imagem de fundo",
      "Carrossel de imagens simples",
    ],
  },
  {
    title: "Gerador de Logos SVG",
    description: "Crie logos vetoriais escaláveis",
    icon: Hexagon,
    type: "logo" as const,
    placeholder: "Descreva o logo que deseja criar...\nEx: Um logo minimalista para uma empresa de tecnologia",
    examples: [
      "Logo geométrico abstrato",
      "Monograma com iniciais AB",
      "Ícone de nuvem moderno",
      "Logo circular com texto",
    ],
  },
  {
    title: "Efeitos e Animações",
    description: "Gere animações CSS e efeitos visuais",
    icon: Wand2,
    type: "effect" as const,
    placeholder: "Descreva o efeito ou animação...\nEx: Uma animação de loading com 3 pontos pulsando",
    examples: [
      "Loading spinner moderno",
      "Efeito de digitação",
      "Partículas flutuantes CSS",
      "Transição de página fade",
    ],
  },
];

const Tools = () => {
  const scrollToForm = () => {
    window.location.href = "/#form";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onGetStarted={scrollToForm} />

      <main className="pt-24 pb-20">
        <div className="container px-4">
          {/* Back Button */}
          <Link to="/">
            <Button variant="ghost" className="mb-8 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6">
              <Wand2 className="w-4 h-4" />
              Ferramentas de IA
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Gere Código com{" "}
              <span className="gradient-text">Inteligência Artificial</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Use IA para gerar código de botões, imagens, logos e efeitos CSS.
              Descreva o que precisa e receba código pronto para usar.
            </p>
          </motion.div>

          {/* Generator Cards Grid */}
          <div className="grid gap-8 lg:grid-cols-2">
            {generators.map((generator) => (
              <GeneratorCard
                key={generator.type}
                {...generator}
              />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Tools;
