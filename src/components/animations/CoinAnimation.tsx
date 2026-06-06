import { useEffect, useState } from 'react';

interface CoinParticle {
  id: number;
  x: number;
  y: number;
}

interface CoinAnimationProps {
  trigger: boolean;
  onComplete?: () => void;
}

export default function CoinAnimation({ trigger, onComplete }: CoinAnimationProps) {
  const [particles, setParticles] = useState<CoinParticle[]>([]);

  useEffect(() => {
    if (!trigger) return;

    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
      y: window.innerHeight / 2 + (Math.random() - 0.5) * 100,
    }));

    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 1000);

    return () => clearTimeout(timer);
  }, [trigger, onComplete]);

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="coin-particle"
          style={{ left: p.x, top: p.y }}
        >
          ⭐
        </div>
      ))}
    </>
  );
}
