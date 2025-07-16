import React, { useEffect, useCallback } from 'react';
import './Fireworks.css';

const Fireworks = ({ show = false, duration = 3000, onComplete }) => {
  const createParticle = useCallback((x, y, color) => {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.backgroundColor = color;
    
    // Random direction
    const angle = Math.random() * Math.PI * 2;
    const velocity = 2 + Math.random() * 3;
    particle.style.setProperty('--angle', `${angle}rad`);
    particle.style.setProperty('--velocity', `${velocity}`);
    
    return particle;
  }, []);

  const createFirework = useCallback(() => {
    const firework = document.createElement('div');
    firework.className = 'firework';
    
    // Random position
    const x = Math.random() * window.innerWidth;
    firework.style.left = `${x}px`;
    
    // Random colors with more vibrant options
    const colors = [
      '#ff0000', '#00ff00', '#0000ff',  // Primary
      '#ffff00', '#ff00ff', '#00ffff',  // Secondary
      '#ffd700', '#ff69b4', '#7b68ee',  // Gold, Hot Pink, Medium Slate Blue
      '#ff4500', '#32cd32', '#00bfff'   // Orange Red, Lime Green, Deep Sky Blue
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    firework.style.backgroundColor = color;
    
    // Explosion handler
    firework.addEventListener('animationend', (e) => {
      if (e.animationName === 'shoot') {
        const rect = firework.getBoundingClientRect();
        
        // Create multiple particles
        for (let i = 0; i < 12; i++) {
          const particle = createParticle(rect.x, rect.y, color);
          firework.parentElement.appendChild(particle);
        }
        
        firework.remove();
      }
    });
    
    return firework;
  }, [createParticle]);

  useEffect(() => {
    if (!show) return;

    const container = document.createElement('div');
    container.className = 'fireworks-container';
    document.body.appendChild(container);

    let fireworksCount = 0;
    const maxFireworks = Math.floor(duration / 300); // Launch a firework every 300ms
    
    const interval = setInterval(() => {
      if (fireworksCount >= maxFireworks) {
        clearInterval(interval);
        setTimeout(() => {
          container.remove();
          onComplete?.();
        }, 2000); // Wait for last animations to finish
        return;
      }
      
      container.appendChild(createFirework());
      fireworksCount++;
    }, 300);

    return () => {
      clearInterval(interval);
      container.remove();
    };
  }, [show, duration, createFirework, onComplete]);

  return null;
};

export default Fireworks;
