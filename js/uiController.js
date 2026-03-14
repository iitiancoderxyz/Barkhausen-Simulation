/**
 * UI CONTROLLER - INTERACTION LAYER
 * ---------------------------------
 * Manages DOM events, slider mapping, and automatic sweep generators.
 */

export default class UIController {
    constructor(parent) {
        this.parent = parent;
        
        // Cache DOM Elements
        this.slider = document.getElementById('fieldSlider');
        this.fieldDisplay = document.getElementById('fieldVal');
        this.gainSlider = document.getElementById('gainSlider');
        this.sweepSelect = document.getElementById('sweepMode');
        this.resetBtn = document.getElementById('resetLab');
        
        // Auto-sweep State
        this.autoPhase = 0;
        
        this.initListeners();
    }

    initListeners() {
        // 1. MANUAL FIELD CONTROL
        this.slider.addEventListener('input', (e) => {
            if (this.sweepSelect.value === 'manual') {
                this.updateField(parseFloat(e.target.value));
            }
        });

        // 2. GAIN ADJUSTMENT (Real-time update to Oscilloscope)
        this.gainSlider.addEventListener('input', (e) => {
            this.parent.state.gain = parseInt(e.target.value);
        });

        // 3. SWEEP MODE SELECTION
        this.sweepSelect.addEventListener('change', (e) => {
            if (e.target.value !== 'manual') {
                this.slider.disabled = true;
                this.slider.style.opacity = "0.5";
            } else {
                this.slider.disabled = false;
                this.slider.style.opacity = "1";
            }
        });

        // 4. SYSTEM RESET
        this.resetBtn.addEventListener('click', () => {
            this.parent.state.currentH = 0;
            this.parent.state.magnetization = 0;
            this.slider.value = 0;
            this.parent.components.hys.clear();
            this.parent.components.stats.reset();
            this.fieldDisplay.innerText = "0.00";
        });
    }

    /**
     * Called by the main loop in main.js to handle automatic sweeps.
     */
    handleAutoSweep(dt) {
        const mode = this.sweepSelect.value;
        if (mode === 'manual') return;

        const amplitude = 200; // Max Oe
        const frequency = 0.0005; // 0.5Hz converted for dt (ms)
        
        this.autoPhase += dt * frequency;

        let newH = 0;
        if (mode === 'sine') {
            newH = Math.sin(this.autoPhase * Math.PI * 2) * amplitude;
        } else if (mode === 'triangle') {
            // Triangle wave formula: 2/pi * arcsin(sin(2pi * f * t))
            newH = (amplitude * 2 / Math.PI) * Math.asin(Math.sin(this.autoPhase * Math.PI * 2));
        }

        this.updateField(newH);
        this.slider.value = newH; // Visually update the slider
    }

    /**
     * Coordinates the field update across the entire system.
     */
    updateField(val) {
        this.parent.state.currentH = val;
        this.fieldDisplay.innerText = val.toFixed(2);
        
        // Dynamic color shifting for the readout based on field strength
        const intensity = Math.abs(val) / 250;
        this.fieldDisplay.style.color = `rgb(${255 * intensity}, ${212 + (43 * (1-intensity))}, 255)`;
    }
}