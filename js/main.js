/**
 * MAIN.JS - THE LABORATORY ORCHESTRATOR
 * Connects the Physics Engine to the Visualizers and UI safely.
 */

import UIController from './uiController.js';
import PhysicsEngine from './physicsEngine.js';
import Oscilloscope from './oscilloscope.js';
import Hysteresis from './hysteresis.js';
import Statistics from './statistics.js';
import DomainView from './domainView.js';
import SpectrumAnalyzer from './spectrumAnalyzer.js';

class BarkhausenLab {
    constructor() {
        this.state = {
            isRunning: false,
            currentH: 0,
            magnetization: 0,
            gain: 45,
            lastUpdateTime: null // Set to null to prevent first-frame lag spikes
        };

        this.components = {};

        // SAFETY CHECK: Wait for HTML to fully load before booting
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        console.log("%c[System] Booting Barkhausen Lab...", "color: #00d4ff; font-weight: bold;");
        
        try {
            // 1. Initialize Components
            this.components.ui = new UIController(this);
            this.components.physics = new PhysicsEngine(this);
            
            // 2. Initialize Visualizers
            this.components.osc = new Oscilloscope('oscCanvas', this);
            this.components.hys = new Hysteresis('hysCanvas', this);
            this.components.domain = new DomainView('domainCanvas', this);
            this.components.spec = new SpectrumAnalyzer('specCanvas', this);
            this.components.stats = new Statistics(this);

            // 3. Global Event Listeners
            this.setupGlobalListeners();

            // 4. Start the 60FPS Loop
            requestAnimationFrame((t) => this.masterLoop(t));
            
            console.log("%c[System] All modules loaded successfully.", "color: #238636; font-weight: bold;");
        } catch (error) {
            console.error("[System Error] Failed to initialize modules:", error);
            alert("Initialization Error. Ensure you are running this via a Local Web Server (like Live Server in VS Code) so the JS modules can load.");
        }
    }

    setupGlobalListeners() {
        const startBtn = document.getElementById('initSystem');
        
        if (!startBtn) {
            console.error("Could not find start button with ID 'initSystem'");
            return;
        }

        startBtn.addEventListener('click', async () => {
            if (!this.state.isRunning) {
                // Boot up audio and physics
                await this.components.physics.initializeAudio();
                this.state.isRunning = true;
                this.state.lastUpdateTime = performance.now(); // Reset timer perfectly
                
                startBtn.innerText = "SYSTEM ACTIVE";
                startBtn.classList.add('active');
            } else {
                // Pause system
                this.state.isRunning = false;
                startBtn.innerText = "RESUME SIMULATION";
                startBtn.classList.remove('active');
            }
        });

        // Handle window resizing without crashing canvases
        window.addEventListener('resize', () => {
            Object.values(this.components).forEach(c => {
                if(typeof c.resize === 'function') c.resize();
            });
        });
    }

    /**
     * The Heartbeat of the Lab - Runs 60 times per second
     */
    masterLoop(timestamp) {
        // Always request the next frame immediately to keep the loop alive
        requestAnimationFrame((t) => this.masterLoop(t));

        if (!this.state.isRunning) return;

        // CALCULATE DELTA TIME (dt) SAFELY
        if (!this.state.lastUpdateTime) this.state.lastUpdateTime = timestamp;
        let dt = timestamp - this.state.lastUpdateTime;
        this.state.lastUpdateTime = timestamp;

        // Cap 'dt' at 50ms. If the user switches tabs, we don't want a massive 
        // time jump to break the physics math when they come back.
        if (dt > 50) dt = 16; 

        try {
            // A. Update Field (Auto-sweep or Manual)
            this.components.ui.handleAutoSweep(dt);

            // B. Calculate Physics Jumps
            const physicsData = this.components.physics.update(dt);
            this.state.magnetization = physicsData.M;

            // C. Render Visuals
            this.components.osc.draw(physicsData.signalBuffer);
            this.components.hys.update(this.state.currentH, this.state.magnetization);
            this.components.domain.draw();
            this.components.spec.draw(physicsData.signalBuffer);

            // D. Update Calculations
            this.components.stats.process(physicsData);
            
        } catch (error) {
            console.error("[Render Loop Error] The system crashed during the animation frame:", error);
            this.state.isRunning = false; // Emergency stop to prevent infinite error loops
        }
    }
}

// Boot the Lab
window.lab = new BarkhausenLab();