import { useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { ConversionForm } from "@/components/ConversionForm";
import { Footer } from "@/components/Footer";

const Index = () => {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onGetStarted={scrollToForm} />
      <Hero onGetStarted={scrollToForm} />
      <section id="features">
        <Features />
      </section>
      <section id="how-it-works">
        <HowItWorks />
      </section>
      <div ref={formRef}>
        <ConversionForm />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
