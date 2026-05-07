/**
 * hero-particles.ts — Tiny brand-colored particle network on the hero
 * canvas, used on home / toolkit / impact pages.
 *
 * Exports `initHeroParticles(canvas)` so each page can opt in. Skips
 * entirely when prefers-reduced-motion is set.
 */

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;
    color: { r: number; g: number; b: number };
}

const COLORS = [
    { r: 59, g: 130, b: 246 }, // blue
    { r: 34, g: 211, b: 238 }, // cyan
    { r: 236, g: 72, b: 153 }, // pink
    { r: 168, g: 85, b: 247 }, // purple
];

const PARTICLE_COUNT = 50;
const CONNECTION_DIST = 140;
const SPEED = 0.3;

export function initHeroParticles(canvas: HTMLCanvasElement): void {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let animId: number | null = null;

    function resize(): void {
        const parent = canvas.parentElement;
        if (!parent) return;
        width = canvas.width = parent.offsetWidth;
        height = canvas.height = parent.offsetHeight;
    }

    function createParticles(): void {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const color = COLORS[Math.floor(Math.random() * COLORS.length)];
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * SPEED,
                vy: (Math.random() - 0.5) * SPEED,
                r: Math.random() * 2 + 1,
                color,
            });
        }
    }

    function draw(): void {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);

        // Connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONNECTION_DIST) {
                    const alpha = (1 - dist / CONNECTION_DIST) * 0.3;
                    const c = particles[i].color;
                    ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        // Particles
        for (const p of particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.6)`;
            ctx.fill();
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;
        }

        animId = requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();

    window.addEventListener("resize", () => {
        resize();
        createParticles();
    });

    // Pause when hero is offscreen — keeps the rest of the page snappy.
    const parent = canvas.parentElement;
    if (parent && "IntersectionObserver" in window) {
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    if (!animId) draw();
                } else if (animId !== null) {
                    cancelAnimationFrame(animId);
                    animId = null;
                }
            },
            { threshold: 0 },
        );
        obs.observe(parent);
    }
}
