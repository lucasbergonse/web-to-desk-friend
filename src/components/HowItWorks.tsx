import { motion } from "framer-motion";
import { Globe, ArrowRight, Settings, Download } from "lucide-react";
const steps = [{
  number: "01",
  icon: Globe,
  title: "Informe a URL",
  description: "Cole a URL do seu app web ou o link do repositório GitHub."
}, {
  number: "02",
  icon: Settings,
  title: "Configure",
  description: "Escolha o sistema operacional, framework e faça upload do ícone."
}, {
  number: "03",
  icon: Download,
  title: "Baixe o instalador",
  description: "Receba o instalador pronto para distribuir aos seus usuários."
}];
export const HowItWorks = () => {
  return <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(186_100%_50%/0.03)_0%,transparent_50%)]" />

      <div className="container relative z-10 px-4">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Simples como <span className="gradient-text">1, 2, 3</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Em poucos minutos, seu app web se torna um app desktop nativo.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection line - desktop only */}
            <div className="hidden md:block absolute top-24 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

            {steps.map((step, index) => <motion.div key={step.number} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.2
          }} className="relative text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 relative z-10">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  
                </div>

                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>

                {index < steps.length - 1 && <ArrowRight className="hidden md:block absolute top-24 -right-4 w-8 h-8 text-primary/30 transform translate-x-1/2" />}
              </motion.div>)}
          </div>
        </div>
      </div>
    </section>;
};