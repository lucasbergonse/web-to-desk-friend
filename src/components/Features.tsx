import { motion } from "framer-motion";
import { Shield, Code2, Rocket, Package, Lock, RefreshCw } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Zero Modificação de Código",
    description: "Seu app web é encapsulado via WebView. Nenhuma linha de código é alterada, analisada ou copiada.",
  },
  {
    icon: Code2,
    title: "Fidelidade Total",
    description: "O app desktop funciona exatamente como o app web original. Layout, funcionalidade e comportamento preservados.",
  },
  {
    icon: Rocket,
    title: "Build Automatizado",
    description: "Informe a URL ou repositório GitHub e receba o instalador pronto para distribuição.",
  },
  {
    icon: Package,
    title: "Electron ou Tauri",
    description: "Escolha entre Electron (mais compatível) ou Tauri (mais leve) como base do seu app desktop.",
  },
  {
    icon: Lock,
    title: "Ambiente Isolado",
    description: "Cada build é executado em container Docker isolado, garantindo segurança total.",
  },
  {
    icon: RefreshCw,
    title: "Atualizações Simples",
    description: "Como o app carrega via URL, atualizações no web são refletidas automaticamente no desktop.",
  },
];

export const Features = () => {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(186_100%_50%/0.05)_0%,transparent_60%)]" />

      <div className="container relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Como <span className="gradient-text">funciona</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Encapsulamento puro e simples. Seu app web vira desktop sem mágica obscura.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group glass-card rounded-2xl p-6 hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
