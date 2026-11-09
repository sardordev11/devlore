import { useCallback, useEffect, useRef } from "react";

const ICON_SIZE = 56;
const MAX_SPEED = 4.4; // px per frame at 60fps
const REPEL_RADIUS = 110;
const REPEL_FORCE = 0.9;
const FRICTION = 0.985;
const FRAME_MS = 1000 / 60;

interface ChaosIcon {
  el: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseSpeed: number;
  phase: number;
  rotateAmp: number;
  pulseSpeed: number;
}

const random = (min: number, max: number) => min + Math.random() * (max - min);

function createIcon(el: HTMLElement, width: number, height: number): ChaosIcon {
  const angle = random(0, Math.PI * 2);
  const speed = random(0.35, 0.8);
  return {
    el,
    x: random(0, Math.max(0, width - ICON_SIZE)),
    y: random(0, Math.max(0, height - ICON_SIZE)),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    baseSpeed: speed,
    phase: random(0, Math.PI * 2),
    rotateAmp: random(6, 14),
    pulseSpeed: random(0.0012, 0.0022),
  };
}

function render(icon: ChaosIcon, time: number) {
  const rotation = Math.sin(time * icon.pulseSpeed + icon.phase) * icon.rotateAmp;
  const scale = 1 + Math.sin(time * icon.pulseSpeed * 1.6 + icon.phase) * 0.06;
  icon.el.style.transform = `translate3d(${icon.x}px, ${icon.y}px, 0) rotate(${rotation}deg) scale(${scale})`;
}

function repel(icon: ChaosIcon, pointer: { x: number; y: number }) {
  const dx = icon.x + ICON_SIZE / 2 - pointer.x;
  const dy = icon.y + ICON_SIZE / 2 - pointer.y;
  const dist = Math.hypot(dx, dy) || 1;
  if (dist >= REPEL_RADIUS) return;
  const push = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_FORCE;
  icon.vx += (dx / dist) * push;
  icon.vy += (dy / dist) * push;
}

function move(icon: ChaosIcon, dt: number, width: number, height: number) {
  // Ease back toward a gentle drift after being pushed, with a speed cap.
  const speed = Math.hypot(icon.vx, icon.vy) || 1;
  if (speed > icon.baseSpeed) {
    icon.vx *= FRICTION;
    icon.vy *= FRICTION;
  }
  if (speed > MAX_SPEED) {
    icon.vx = (icon.vx / speed) * MAX_SPEED;
    icon.vy = (icon.vy / speed) * MAX_SPEED;
  }

  icon.x += icon.vx * dt;
  icon.y += icon.vy * dt;

  const maxX = Math.max(0, width - ICON_SIZE);
  const maxY = Math.max(0, height - ICON_SIZE);
  if (icon.x <= 0 || icon.x >= maxX) {
    icon.x = Math.min(Math.max(icon.x, 0), maxX);
    icon.vx *= -1;
  }
  if (icon.y <= 0 || icon.y >= maxY) {
    icon.y = Math.min(Math.max(icon.y, 0), maxY);
    icon.vy *= -1;
  }
}

// Floating icons inside a box: drift, wall bounces, rotation/scale pulse and
// cursor repulsion. Transforms are written straight to the DOM, not React state.
// Under prefers-reduced-motion the icons are placed once and stay still.
export function useChaosAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconEls = useRef<(HTMLElement | null)[]>([]);

  const setIconRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      iconEls.current[index] = el;
    },
    [],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth;
    let height = container.clientHeight;
    const icons = iconEls.current
      .filter((el): el is HTMLElement => el !== null)
      .map((el) => createIcon(el, width, height));
    icons.forEach((icon) => render(icon, 0));
    container.dataset.ready = "true";

    const resizeObserver = new ResizeObserver(() => {
      width = container.clientWidth;
      height = container.clientHeight;
      for (const icon of icons) {
        icon.x = Math.min(icon.x, Math.max(0, width - ICON_SIZE));
        icon.y = Math.min(icon.y, Math.max(0, height - ICON_SIZE));
        render(icon, performance.now());
      }
    });
    resizeObserver.observe(container);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => resizeObserver.disconnect();
    }

    const pointer = { x: 0, y: 0, active: false };
    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };

    let frameId: number | null = null;
    let lastTime = 0;
    const tick = (time: number) => {
      const dt = lastTime ? Math.min((time - lastTime) / FRAME_MS, 3) : 1;
      lastTime = time;
      for (const icon of icons) {
        if (pointer.active) repel(icon, pointer);
        move(icon, dt, width, height);
        render(icon, time);
      }
      frameId = requestAnimationFrame(tick);
    };

    // Only animate while the box is on screen and the tab is visible.
    let onScreen = true;
    const sync = () => {
      if (onScreen && !document.hidden) {
        if (frameId === null) {
          lastTime = 0;
          frameId = requestAnimationFrame(tick);
        }
      } else if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    };
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    intersectionObserver.observe(container);

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", sync);
    sync();

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return { containerRef, setIconRef };
}
