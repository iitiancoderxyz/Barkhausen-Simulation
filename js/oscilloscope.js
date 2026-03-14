/**
 * OSCILLOSCOPE MODULE - CRT EMULATION
 * -----------------------------------
 * Renders high-frequency voltage spikes with a simulated phosphor trail.
 */

export default class Oscilloscope {
    constructor(canvasId, parent) {
        this.parent = parent;
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Visual Style Constants
        this.colors = {
            trace: '#00ff41',      // Classic Matrix/CRT Green
            grid: '#003311',
            glow: 'rgba(0, 255, 65, 0.5)'
        };

        this.resize();
    }

    /**
     * Resizes the canvas while maintaining internal resolution.
     */
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.drawGrid();
    }

    /**
     * The Draw Loop - Called 60 times per second by main.js
     * @param {Float32Array} buffer - The signal from the Physics Engine
     */
    draw(buffer) {
        // 1. PHOSPHOR PERSISTENCE EFFECT:
        // Instead of clearRect, we draw a semi-transparent rectangle over the frame.
        // This keeps the previous frame's pixels slightly visible.
        this.ctx.fillStyle = 'rgba(5, 7, 10, 0.15)'; 
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGrid();

        // 2. RENDER TRACE
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.colors.trace;
        this.ctx.lineWidth = 2.5;
        this.ctx.lineJoin = 'round';
        
        // Add a "Bloom" effect to the signal
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = this.colors.glow;

        const sliceWidth = this.canvas.width / buffer.length;
        let x = 0;

        for (let i = 0; i < buffer.length; i++) {
            // Map the physics buffer (-1.0 to 1.0) to the canvas height
            // We use the 'gain' from the global state to amplify the visual
            const amplitude = buffer[i] * (this.parent.state.gain / 10);
            const y = (this.canvas.height / 2) - (amplitude * (this.canvas.height / 4));

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        this.ctx.stroke();
        
        // Reset shadow for next components
        this.ctx.shadowBlur = 0;
    }

    /**
     * Draws the background reticle (measurement grid).
     */
    drawGrid() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const step = 40; // Pixels per grid line

        this.ctx.save();
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= w; x += step) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, h);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= h; y += step) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(w, y);
            this.ctx.stroke();
        }

        // Center crosshair
        this.ctx.strokeStyle = '#006622';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(w/2, 0); this.ctx.lineTo(w/2, h);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(0, h/2); this.ctx.lineTo(w, h/2);
        this.ctx.stroke();

        this.ctx.restore();
    }
}