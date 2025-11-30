import { MotionValue, motionValue } from 'framer-motion';

// Global singleton state for mouse position
// We use MotionValues so components can useTransform/useSpring directly
export const globalMouseX = motionValue(0.5);
export const globalMouseY = motionValue(0.5);

type RafCallback = (time: number) => void;

class UnifiedRAF {
  private subscribers: Set<RafCallback> = new Set();
  private isRunning = false;
  private rafId: number | null = null;
  
  // Mouse tracking state
  private currentMouseX = 0;
  private currentMouseY = 0;
  private hasMouseListener = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.currentMouseX = window.innerWidth / 2;
      this.currentMouseY = window.innerHeight / 2;
    }
  }

  public subscribe(callback: RafCallback) {
    this.subscribers.add(callback);
    if (!this.isRunning) this.start();
    return () => this.unsubscribe(callback);
  }

  public unsubscribe(callback: RafCallback) {
    this.subscribers.delete(callback);
    // We don't auto-stop here because other components might rely on the loop
    // or we might want to keep mouse tracking active.
  }

  private onMouseMove = (e: MouseEvent) => {
    this.currentMouseX = e.clientX;
    this.currentMouseY = e.clientY;
  };

  private loop = (time: number) => {
    if (!this.isRunning) return;

    // 1. Update Mouse MotionValues
    if (typeof window !== 'undefined') {
        const w = window.innerWidth || 1;
        const h = window.innerHeight || 1;
        globalMouseX.set(this.currentMouseX / w);
        globalMouseY.set(this.currentMouseY / h);
    }

    // 2. Run subscribers (Lenis, etc)
    this.subscribers.forEach(cb => cb(time));

    this.rafId = requestAnimationFrame(this.loop);
  };

  public start() {
    if (this.isRunning || typeof window === 'undefined') return;
    
    this.isRunning = true;
    
    // Setup mouse listener only once
    if (!this.hasMouseListener) {
        window.addEventListener('mousemove', this.onMouseMove, { passive: true });
        this.hasMouseListener = true;
    }

    this.rafId = requestAnimationFrame(this.loop);
  }

  public stop() {
    this.isRunning = false;
    if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
    }
    if (this.hasMouseListener && typeof window !== 'undefined') {
        window.removeEventListener('mousemove', this.onMouseMove);
        this.hasMouseListener = false;
    }
  }
}

export const unifiedRaf = new UnifiedRAF();
