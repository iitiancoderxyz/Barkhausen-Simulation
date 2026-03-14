/**
 * HYSTERESIS MODULE - B-H CURVE TRACER
 * ------------------------------------
 * Tracks the relationship between Applied Field (H) and Magnetization (M).
 * Features high-precision coordinate mapping and stochastic jitter.
 */

export default class Hysteresis {
    constructor(canvasId, parent) {
        this.parent = parent;
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Data persistence
        this.pathHistory = [];
        this.maxPoints = 2000; // Limit memory usage
        
        // Scaling factors
        this.scaleH = 0;
        this.scaleM = 0;

        this.colors = {
            curve: '#00d4ff',
            axis: '#30363d',
            text: '#8b949e',
            point: '#ffffff'
        };

        this.resize();
    }

    /**
     * Calibrates the coordinate system based on the current window size.
     */
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        
        // Field range is -250 to 250, Saturation is -200 to 200
        this.scaleH = this.canvas.width / 500;
        this.scaleM = this.canvas.height / 450;
    }

    /**
     * Updates the curve data points.
     * @param {number} h - Current Magnetic Field
     * @param {number} m - Current Magnetization
     */
    update(h, m) {
        // Add current state to history
        this.pathHistory.push({ h, m });

        // Maintain buffer size
        if (this.pathHistory.length > this.maxPoints) {
            this.pathHistory.shift();
        }

        this.render();
    }

    render() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const ctx = this.ctx;

        // 1. CLEAR & DRAW BACKGROUND
        ctx.fillStyle = '#05070a';
        ctx.fillRect(0, 0, w, h);

        this.drawAxes(ctx, w, h);

        // 2. DRAW HISTORICAL PATH
        if (this.pathHistory.length < 2) return;

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        
        // Create a glow effect for the line
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.colors.curve;

        for (let i = 0; i < this.pathHistory.length; i++) {
            const p = this.pathHistory[i];
            
            // Map physics units to canvas coordinates
            // Center is (w/2, h/2)
            const x = (p.h * this.scaleH) + (w / 2);
            const y = (h / 2) - (p.m * this.scaleM);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        // Use a linear gradient to show the "direction" of the sweep
        const head = this.pathHistory[this.pathHistory.length - 1];
        const tail = this.pathHistory[0];
        const grad = ctx.createLinearGradient(
            (tail.h * this.scaleH) + (w/2), (h/2) - (tail.m * this.scaleM),
            (head.h * this.scaleH) + (w/2), (h/2) - (head.m * this.scaleM)
        );
        grad.addColorStop(0, 'rgba(0, 212, 255, 0.1)');
        grad.addColorStop(1, 'rgba(0, 212, 255, 1)');
        
        ctx.strokeStyle = grad;
        ctx.stroke();

        // 3. DRAW CURRENT STATE INDICATOR
        const last = this.pathHistory[this.pathHistory.length - 1];
        const currX = (last.h * this.scaleH) + (w / 2);
        const currY = (h / 2) - (last.m * this.scaleM);

        ctx.shadowBlur = 15;
        ctx.fillStyle = this.colors.point;
        ctx.beginPath();
        ctx.arc(currX, currY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }

    drawAxes(ctx, w, h) {
        ctx.strokeStyle = this.colors.axis;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]); // Dashed grid

        // H-Axis
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();

        // M-Axis
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w / 2, h);
        ctx.stroke();

        ctx.setLineDash([]); // Reset dash

        // Labels
        ctx.fillStyle = this.colors.text;
        ctx.font = '10px Fira Code';
        ctx.fillText('+H', w - 20, h / 2 - 10);
        ctx.fillText('-H', 10, h / 2 - 10);
        ctx.fillText('+B (Flux)', w / 2 + 10, 20);
        ctx.fillText('-B (Flux)', w / 2 + 10, h - 10);
    }

    /**
     * Clears the graph history (used for 'Reset Lab' button)
     */
    clear() {
        this.pathHistory = [];
    }
}