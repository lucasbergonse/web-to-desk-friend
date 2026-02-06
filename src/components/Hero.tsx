import { motion } from "framer-motion";
import { ArrowRight, Monitor, Globe, Zap } from "lucide-react";
import { Button } from "./ui/button";
interface HeroProps {
  onGetStarted: () => void;
}
export const Hero = ({
  onGetStarted
}: HeroProps) => {
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(186_100%_50%/0.1)_0%,transparent_50%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,hsl(186_100%_50%/0.05)_0%,transparent_70%)]" />

      {/* Floating elements */}
      <motion.div className="absolute top-20 left-[15%] w-16 h-16 rounded-2xl glass-card flex items-center justify-center" animate={{
      y: [0, -15, 0]
    }} transition={{
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut"
    }}>
        
      </motion.div>

      <motion.div className="absolute bottom-32 right-[20%] w-14 h-14 rounded-xl glass-card flex items-center justify-center" animate={{
      y: [0, 10, 0]
    }} transition={{
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 1
    }}>
        <Monitor className="w-6 h-6 text-primary" />
      </motion.div>

      <motion.div className="absolute top-40 right-[25%] w-12 h-12 rounded-lg glass-card flex items-center justify-center" animate={{
      y: [0, -12, 0]
    }} transition={{
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 2
    }}>
        <Zap className="w-5 h-5 text-primary" />
      </motion.div>

      <div className="container relative z-10 px-4 py-20">
        <motion.div initial={{
        opacity: 0,
        y: 30
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.8
      }} className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div initial={{
          opacity: 0,
          scale: 0.9
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          delay: 0.2
        }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">Sem modificar uma linha de código</span>
          </motion.div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            Transforme seu{" "}
            <span className="gradient-text">app web</span>
            <br />
            em um{" "}
            <span className="gradient-text">app desktop</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Encapsulamos seu aplicativo web em um container desktop nativo.
            Sem análise de código, sem modificações. Funcionalidade 100% preservada.
          </p>

          {/* CTA Buttons */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.5
        }} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="hero" size="xl" onClick={onGetStarted}>
              Começar Agora
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="glass" size="lg">
              Ver como funciona
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.8
        }} className="mt-16 flex flex-wrap justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary" />
              <span className="text-sm">Windows, macOS & Linux</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-sm">Build em minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <span className="text-sm">Qualquer app web</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>;
};