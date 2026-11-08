(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ───────── Navbar opacity on scroll ───────── */

  const nav = document.getElementById("nav");
  const updateNav = () => nav.classList.toggle("is-scrolled", window.scrollY > 16);
  updateNav();
  window.addEventListener("scroll", updateNav, { passive: true });

  /* ───────── Footer year ───────── */

  document.getElementById("year").textContent = String(new Date().getFullYear());

  /* ───────── Fade in on scroll ───────── */

  const revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ───────── Pricing toggle ───────── */

  const PRICES = {
    monthly: { amount: "$8", period: "/month", note: "Billed monthly" },
    yearly: { amount: "$72", period: "/year", note: "$6/month, billed yearly" },
  };

  const billingSwitch = document.getElementById("billing-switch");
  const proAmount = document.getElementById("pro-amount");
  const proPeriod = document.getElementById("pro-period");
  const proNote = document.getElementById("pro-note");
  const periodLabels = document.querySelectorAll("[data-period-label]");

  billingSwitch.addEventListener("click", () => {
    const yearly = billingSwitch.getAttribute("aria-checked") !== "true";
    const period = yearly ? "yearly" : "monthly";
    const price = PRICES[period];

    billingSwitch.setAttribute("aria-checked", String(yearly));
    proAmount.textContent = price.amount;
    proPeriod.textContent = price.period;
    proNote.textContent = price.note;
    periodLabels.forEach((label) =>
      label.classList.toggle("is-active", label.dataset.periodLabel === period),
    );
  });

  /* ───────── Chaos icons ───────── */

  const chaos = document.getElementById("chaos");
  const iconEls = Array.from(chaos.querySelectorAll(".chaos__icon"));

  const ICON_SIZE = 56;
  const MAX_SPEED = 1.1; // px per frame at 60fps
  const REPEL_RADIUS = 110;
  const REPEL_FORCE = 0.9;
  const FRICTION = 0.985;

  let bounds = { width: 0, height: 0 };
  const mouse = { x: 0, y: 0, active: false };

  const random = (min, max) => min + Math.random() * (max - min);

  const measure = () => {
    bounds = { width: chaos.clientWidth, height: chaos.clientHeight };
  };
  measure();

  const icons = iconEls.map((el) => {
    const angle = random(0, Math.PI * 2);
    const speed = random(0.35, 0.8);
    return {
      el,
      x: random(0, Math.max(0, bounds.width - ICON_SIZE)),
      y: random(0, Math.max(0, bounds.height - ICON_SIZE)),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      baseSpeed: speed,
      phase: random(0, Math.PI * 2),
      rotateAmp: random(6, 14),
      pulseSpeed: random(0.0012, 0.0022),
    };
  });

  const render = (icon, time) => {
    const rotation = Math.sin(time * icon.pulseSpeed + icon.phase) * icon.rotateAmp;
    const scale = 1 + Math.sin(time * icon.pulseSpeed * 1.6 + icon.phase) * 0.06;
    icon.el.style.transform =
      `translate3d(${icon.x}px, ${icon.y}px, 0) rotate(${rotation}deg) scale(${scale})`;
  };

  const step = (icon, dt) => {
    if (mouse.active) {
      const dx = icon.x + ICON_SIZE / 2 - mouse.x;
      const dy = icon.y + ICON_SIZE / 2 - mouse.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < REPEL_RADIUS) {
        const push = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_FORCE;
        icon.vx += (dx / dist) * push;
        icon.vy += (dy / dist) * push;
      }
    }

    // Ease back toward a gentle drift after being pushed.
    const speed = Math.hypot(icon.vx, icon.vy) || 1;
    if (speed > icon.baseSpeed) {
      icon.vx *= FRICTION;
      icon.vy *= FRICTION;
    }
    const limit = MAX_SPEED * 4;
    if (speed > limit) {
      icon.vx = (icon.vx / speed) * limit;
      icon.vy = (icon.vy / speed) * limit;
    }

    icon.x += icon.vx * dt;
    icon.y += icon.vy * dt;

    const maxX = bounds.width - ICON_SIZE;
    const maxY = bounds.height - ICON_SIZE;
    if (icon.x <= 0 || icon.x >= maxX) {
      icon.x = Math.min(Math.max(icon.x, 0), maxX);
      icon.vx *= -1;
    }
    if (icon.y <= 0 || icon.y >= maxY) {
      icon.y = Math.min(Math.max(icon.y, 0), maxY);
      icon.vy *= -1;
    }
  };

  let rafId = null;
  let lastTime = 0;

  const tick = (time) => {
    const dt = lastTime ? Math.min((time - lastTime) / 16.67, 3) : 1;
    lastTime = time;
    for (const icon of icons) {
      step(icon, dt);
      render(icon, time);
    }
    rafId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (rafId === null) {
      lastTime = 0;
      rafId = requestAnimationFrame(tick);
    }
  };

  const stop = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  icons.forEach((icon) => render(icon, 0));

  if (!prefersReducedMotion) {
    chaos.addEventListener("pointermove", (event) => {
      const rect = chaos.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
      mouse.active = true;
    });
    chaos.addEventListener("pointerleave", () => {
      mouse.active = false;
    });

    // Only animate while the hero is on screen and the tab is visible.
    let onScreen = true;
    const sync = () => {
      if (onScreen && !document.hidden) start();
      else stop();
    };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      }).observe(chaos);
    }
    document.addEventListener("visibilitychange", sync);

    start();
  }

  window.addEventListener("resize", () => {
    measure();
    for (const icon of icons) {
      icon.x = Math.min(icon.x, Math.max(0, bounds.width - ICON_SIZE));
      icon.y = Math.min(icon.y, Math.max(0, bounds.height - ICON_SIZE));
      render(icon, performance.now());
    }
  });
})();
