/**
 * SPECTRUM ANALYZER - FREQUENCY DOMAIN
 * ------------------------------------
 * Visualizes the power distribution of the Barkhausen jumps.
 */

export default class SpectrumAnalyzer {
    constructor(canvasId, parent) {
        this.parent = parent;
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
    }

    /**
     * Renders the frequency bars based on signal activity.
     */
    draw(buffer) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Dark background with slight trail
        ctx.fillStyle = 'rgba(5, 7, 10, 0.2)';
        ctx.fillRect(0, 0, w, h);

        const barWidth = w / 64;
        const sensitivity = this.parent.state.gain * 2;

        for (let i = 0; i < 64; i++) {
            // We simulate frequency bins by sampling different parts of the signal buffer
            const sampleIdx = Math.floor((i / 64) * buffer.length);
            const magnitude = Math.abs(buffer[sampleIdx]) * sensitivity;
            
            // Logarithmic-style scaling for a "Pro" look
            const barHeight = Math.min(h, magnitude * (h / 20));
            
            // Gradient based on frequency (Low = Blue, High = Red)
            const hue = 180 + (i * 2);
            ctx.fillStyle = `hsla(${hue}, 80%, 50%, 0.8)`;
            
            // Draw the bar
            ctx.fillRect(i * barWidth, h - barHeight, barWidth - 2, barHeight);
            
            // Add a "peak" cap
            ctx.fillStyle = '#fff';
            ctx.fillRect(i * barWidth, h - barHeight - 2, barWidth - 2, 2);
        }
    }
}