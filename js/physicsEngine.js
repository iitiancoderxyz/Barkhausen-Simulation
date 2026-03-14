/**
 * PHYSICS ENGINE - STOCHASTIC DOMAIN DYNAMICS
 * -------------------------------------------
 * Implements a simplified Monte Carlo model for domain wall pinning.
 * Handles the B-H state machine and the Web Audio pulse generator.
 */

export default class PhysicsEngine {
    constructor(parent) {
        this.parent = parent;
        this.audioCtx = null;
        
        // Physics State
        this.M = 0;              // Current Magnetization
        this.prevH = 0;          // Previous Applied Field
        this.saturation = 200;   // Magnetic Saturation Point
        this.coercivity = 35;    // Material Coercivity (Hc)
        
        // Signal Processing
        this.signalBuffer = new Float32Array(1024);
        this.bufferIndex = 0;
        
        // Stochastic Parameters
        this.pinningSites = this.generatePinningSites(5000);
        this.activeJumps = [];
    }

    /**
     * Initializes the Web Audio API. 
     * Must be called after a user gesture (Start Button).
     */
    async initializeAudio() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        console.log("Audio Engine: Online. Sample Rate:", this.audioCtx.sampleRate);
    }

    /**
     * Pre-calculates microscopic impurities that "pin" domain walls.
     */
    generatePinningSites(count) {
        const sites = [];
        for (let i = 0; i < count; i++) {
            sites.push({
                threshold: (Math.random() * 400) - 200, // Magnetic field required to break pinning
                magnitude: Math.random() * 2.5 + 0.5,   // Size of the domain jump
                isFlipped: false
            });
        }
        // Sort for faster lookup during sweep
        return sites.sort((a, b) => a.threshold - b.threshold);
    }

    /**
     * Main Physics Update Loop
     * @param {number} dt - Delta Time in milliseconds
     */
    update(dt) {
        const currentH = this.parent.state.currentH;
        const deltaH = currentH - this.prevH;
        let jumpEnergy = 0;
        let jumpsThisFrame = 0;

        // Reset signal buffer for this frame's visualization
        this.signalBuffer.fill(0);

        // STOCHASTIC JUMP LOGIC:
        // We check if the change in H has surpassed any pinning site thresholds
        if (Math.abs(deltaH) > 0.001) {
            this.pinningSites.forEach(site => {
                // Determine if a domain wall "snaps" based on direction and threshold
                const isPassingPositive = (this.prevH <= site.threshold && currentH > site.threshold);
                const isPassingNegative = (this.prevH >= site.threshold && currentH < site.threshold);

                if (isPassingPositive || isPassingNegative) {
                    const direction = currentH > this.prevH ? 1 : -1;
                    
                    // Update global magnetization M
                    const effect = site.magnitude * direction;
                    this.M += effect;
                    
                    // Record the jump for stats and audio
                    jumpEnergy += site.magnitude;
                    jumpsThisFrame++;
                    
                    // Generate a "Pulse" in the signal buffer
                    this.createVoltageSpike(site.magnitude);
                    
                    // Trigger the Audio "Click"
                    this.playDiscreteClick(site.magnitude);
                }
            });
        }

        // Apply a small "damping" or relaxation to M to keep it within saturation
        this.M = Math.max(-this.saturation, Math.min(this.saturation, this.M));
        
        this.prevH = currentH;

        return {
            M: this.M,
            signalBuffer: this.signalBuffer,
            energy: jumpEnergy,
            jumpCount: jumpsThisFrame
        };
    }

    /**
     * Creates a high-frequency spike representing induced voltage (V = -N dphi/dt)
     */
    createVoltageSpike(magnitude) {
        const center = Math.floor(Math.random() * 800) + 100;
        const width = 10;
        for (let i = -width; i <= width; i++) {
            const idx = center + i;
            if (idx >= 0 && idx < 1024) {
                // Gaussian-like pulse shape
                const val = magnitude * Math.exp(-(i * i) / 5);
                this.signalBuffer[idx] += val * (Math.random() > 0.5 ? 1 : -1);
            }
        }
    }

    /**
     * DISCRETE AUDIO SYNTHESIS
     * Solves the 'Continuous sound' bug by using short-lived oscillators.
     */
    playDiscreteClick(intensity) {
        if (!this.audioCtx || intensity < 0.1) return;

        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const filter = this.audioCtx.createBiquadFilter();
        const gain = this.audioCtx.createGain();

        // High-pass filter creates that "metallic crackle"
        filter.type = "highpass";
        filter.frequency.setValueAtTime(1200 + Math.random() * 3000, now);
        filter.Q.value = 10;

        osc.type = 'square';
        osc.frequency.setValueAtTime(Math.random() * 5000 + 500, now);

        // Extremely short envelope (The "Click")
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(intensity * 0.05, now + 0.001);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.01); // Kill oscillator after 10ms
    }

    /**
     * Mathematical model for the "Smooth" part of the B-H curve 
     * (Reversible magnetization)
     */
    getSmoothMagnetization(h) {
        // Sigmoid function representing the bulk material property
        return this.saturation * Math.tanh(h / this.coercivity);
    }
}