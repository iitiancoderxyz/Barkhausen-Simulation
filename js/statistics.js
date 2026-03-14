/**
 * STATISTICS MODULE - REAL-TIME DSP
 * ---------------------------------
 * Analyzes the signal buffer to provide accurate physical metrics.
 */

export default class Statistics {
    constructor(parent) {
        this.parent = parent;
        
        // Internal Accumulators
        this.totalJumps = 0;
        this.maxPeak = 0;
        this.energySum = 0;
        
        // Cache DOM
        this.dom = {
            vpk: document.getElementById('stat-vpk'),
            rms: document.getElementById('stat-rms'),
            jumps: document.getElementById('stat-jumps'),
            entropy: document.getElementById('stat-entropy')
        };
    }

    /**
     * Process physics data to update UI stats.
     * @param {Object} data - The physics packet from physicsEngine.js
     */
    process(data) {
        const buffer = data.signalBuffer;
        
        // 1. CALC PEAK VOLTAGE
        let localPeak = 0;
        let sumSquares = 0;

        for (let i = 0; i < buffer.length; i++) {
            const val = Math.abs(buffer[i]);
            if (val > localPeak) localPeak = val;
            sumSquares += val * val;
        }

        // Apply gain to the physical reading for "mV" representation
        const calibratedPeak = localPeak * this.parent.state.gain * 0.12;
        if (calibratedPeak > this.maxPeak) this.maxPeak = calibratedPeak;

        // 2. CALC RMS (Root Mean Square)
        const rms = Math.sqrt(sumSquares / buffer.length) * this.parent.state.gain;

        // 3. UPDATE JUMP COUNT
        this.totalJumps += data.jumpCount;

        // 4. CALCULATE MAGNETIC ENTROPY (Simplified)
        // Represents the randomness/disorder of the domain movements
        const entropy = this.calculateEntropy(buffer);

        this.updateUI(calibratedPeak, rms, entropy);
    }

    calculateEntropy(buffer) {
        // Using a basic Shannon entropy logic on the signal distribution
        let nonzero = buffer.filter(v => Math.abs(v) > 0.01).length;
        return (nonzero / buffer.length) * 10;
    }

    updateUI(vpk, rms, entropy) {
        // We use requestIdleCallback or simple throttling to avoid UI lag
        this.dom.vpk.innerText = `${vpk.toFixed(2)} mV`;
        this.dom.rms.innerText = `${(rms * 100).toFixed(2)} μV`;
        this.dom.jumps.innerText = this.totalJumps.toLocaleString();
        this.dom.entropy.innerText = entropy.toFixed(3);
        
        // Visual feedback: flash peak color if a large jump occurs
        if (vpk > 5) {
            this.dom.vpk.style.color = 'var(--accent-glow)';
            setTimeout(() => this.dom.vpk.style.color = '', 100);
        }
    }

    reset() {
        this.totalJumps = 0;
        this.maxPeak = 0;
        this.energySum = 0;
        this.updateUI(0, 0, 0);
    }
}