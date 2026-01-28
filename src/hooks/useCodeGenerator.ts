import { useState } from "react";
import { toast } from "sonner";

type GenerationType = "button" | "image" | "logo" | "effect";

// Mock code generator - simulates AI code generation
const mockGeneratedCode: Record<GenerationType, string[]> = {
  button: [
    `\`\`\`html
<button class="neon-btn">
  Clique Aqui
</button>
\`\`\`

\`\`\`css
.neon-btn {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  color: #00f5ff;
  background: transparent;
  border: 2px solid #00f5ff;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.neon-btn:hover {
  color: #0a0a0a;
  background: #00f5ff;
  box-shadow: 0 0 20px #00f5ff,
              0 0 40px #00f5ff,
              0 0 60px #00f5ff;
}

.neon-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 245, 255, 0.4), transparent);
  transition: left 0.5s ease;
}

.neon-btn:hover::before {
  left: 100%;
}
\`\`\``,
  ],
  image: [
    `\`\`\`html
<div class="gallery-grid">
  <div class="gallery-item">
    <img src="https://picsum.photos/400/300?random=1" alt="Gallery 1">
    <div class="gallery-overlay">
      <span>Ver mais</span>
    </div>
  </div>
  <div class="gallery-item">
    <img src="https://picsum.photos/400/300?random=2" alt="Gallery 2">
    <div class="gallery-overlay">
      <span>Ver mais</span>
    </div>
  </div>
  <div class="gallery-item">
    <img src="https://picsum.photos/400/300?random=3" alt="Gallery 3">
    <div class="gallery-overlay">
      <span>Ver mais</span>
    </div>
  </div>
</div>
\`\`\`

\`\`\`css
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 20px;
}

.gallery-item {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  cursor: pointer;
}

.gallery-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.gallery-item:hover img {
  transform: scale(1.1);
}

.gallery-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.gallery-item:hover .gallery-overlay {
  opacity: 1;
}

.gallery-overlay span {
  color: white;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 16px;
  border: 2px solid white;
  border-radius: 4px;
}
\`\`\``,
  ],
  logo: [
    `\`\`\`svg
<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00f5ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0066ff;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="55" stroke="url(#grad1)" stroke-width="3" fill="none"/>
  <path d="M40 45 L60 35 L80 45 L80 75 L60 85 L40 75 Z" fill="url(#grad1)" opacity="0.8"/>
  <path d="M60 35 L60 85" stroke="white" stroke-width="2" opacity="0.6"/>
  <path d="M40 60 L80 60" stroke="white" stroke-width="2" opacity="0.6"/>
</svg>
\`\`\``,
  ],
  effect: [
    `\`\`\`html
<div class="loader">
  <span></span>
  <span></span>
  <span></span>
</div>
\`\`\`

\`\`\`css
.loader {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.loader span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #00f5ff;
  animation: pulse 1.4s ease-in-out infinite;
}

.loader span:nth-child(1) {
  animation-delay: 0s;
}

.loader span:nth-child(2) {
  animation-delay: 0.2s;
}

.loader span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
\`\`\``,
  ],
};

export const useCodeGenerator = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  const generate = async (prompt: string, type: GenerationType) => {
    if (!prompt.trim()) {
      toast.error("Por favor, descreva o que deseja gerar");
      return;
    }

    setIsLoading(true);
    setGeneratedCode("");

    try {
      // Simulate streaming response
      const mockCode = mockGeneratedCode[type][0];
      let currentIndex = 0;

      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (currentIndex < mockCode.length) {
            const chunkSize = Math.floor(Math.random() * 10) + 5;
            const chunk = mockCode.slice(currentIndex, currentIndex + chunkSize);
            setGeneratedCode((prev) => prev + chunk);
            currentIndex += chunkSize;
          } else {
            clearInterval(interval);
            resolve();
          }
        }, 30);
      });

      toast.success("Código gerado com sucesso!");
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao gerar código");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setGeneratedCode("");
  };

  return { generate, isLoading, generatedCode, reset };
};
