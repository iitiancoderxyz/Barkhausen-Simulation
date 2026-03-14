/**
 * DOMAIN VIEW - MICROSCOPIC DYNAMICS
 * ----------------------------------
 * Renders a dynamic Voronoi tessellation representing magnetic grains.
 * Boundaries shift and "snap" based on the pinning logic.
 */

export default class DomainView {
    constructor(canvasId, parent) {
        this.parent = parent;
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.domains = [];
        this.gridSize = 8; // Number of domains across
        this.initDomains();
        this.resize();
    }

    initDomains() {
        this.domains = [];
        const w = this.canvas.width || 400;
        const h = this.canvas.height || 300;
        
        // Create a grid of domain seeds with random offsets (stochastic grains)
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                this.domains.push({
                    anchorX: (i + 0.5) * (w / this.gridSize),
                    anchorY: (j + 0.5) * (h / this.gridSize),
                    offsetX: 0,
                    offsetY: 0,
                    phase: Math.random() * Math.PI * 2,
                    stability: Math.random() // Resistance to moving
                });
            }
        }
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.initDomains(); // Re-seed on resize
    }

    /**
     * Renders the domain walls. 
     * The "Blackness" is fixed by using a dynamic lightness scale.
     */
    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const field = this.parent.state.currentH;

        ctx.fillStyle = '#05070a';
        ctx.fillRect(0, 0, w, h);

        // 1. CALCULATE WALL DISPLACEMENT
        // The field H pushes the domain walls. We add a "jitter" to represent pinning.
        this.domains.forEach(d => {
            const pressure = field * 0.2;
            const jitter = (Math.random() - 0.5) * (Math.abs(field) * 0.05);
            
            // Logic: Walls "stick" until pressure exceeds stability
            if (Math.abs(pressure) > d.stability * 20) {
                d.offsetX = pressure + jitter;
            }
        });

        // 2. RENDER CRYSTALLINE STRUCTURE
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#30363d';

        for (let i = 0; i < this.domains.length; i++) {
            const d = this.domains[i];
            
            // Fill color represents magnetic orientation (North vs South)
            // Fixes the "Too Black" issue by ensuring a base luminosity
            const hue = field > 0 ? 190 : 20; 
            const saturation = Math.min(80, Math.abs(field) * 0.5);
            const lightness = 15 + Math.abs(field) * 0.1;
            
            ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            
            // Draw a simplified domain boundary (Hexagonal grain)
            ctx.beginPath();
            this.drawGrain(ctx, d.anchorX + d.offsetX, d.anchorY, 25);
            ctx.fill();
            ctx.stroke();

            // 3. DRAW MAGNETIC VECTORS (The "Cool" arrows)
            this.drawVector(ctx, d.anchorX + d.offsetX, d.anchorY, field);
        }
    }

    drawGrain(ctx, x, y, size) {
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const px = x + size * Math.cos(angle);
            const py = y + size * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
    }

    drawVector(ctx, x, y, field) {
        const length = 15;
        const angle = field >= 0 ? 0 : Math.PI;
        const alpha = Math.min(1, Math.abs(field) / 50);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(-length/2, 0);
        ctx.lineTo(length/2, 0);
        ctx.lineTo(length/2 - 4, -4);
        ctx.moveTo(length/2, 0);
        ctx.lineTo(length/2 - 4, 4);
        ctx.stroke();
        ctx.restore();
    }
}