/**
 * Barkhausen Dynamics | Quantum Magnetism Portal
 * Integrated Audio & Interaction Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initGlitchEffect();
    initBarkhausenAudio(); // The New Audio Protocol
    initDataCounters();
    initParallaxHeader();
});

/**
 * 1. Barkhausen Audio Protocol
 * Generates procedural "clicks" using the Web Audio API to simulate
 * magnetic domains snapping.
 */
/**
 * BARKHAUSEN EFFECT AUDIO HANDLER
 * Ensures the emoji/icon-box triggers the magnetic flip sounds
 */  
/**
 * Barkhausen Audio Generator
 * Creates crackling clicks using Web Audio API
 */
/**
 * Barkhausen Audio Generator
 * Generates crackling magnetic domain sounds
 */
function initBarkhausenAudio(){

    const trigger = document.querySelector(".audio-trigger");

    if(!trigger){
        console.log("trigger not found");
        return;
    }

    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    trigger.addEventListener("click", async ()=>{

        if(ctx.state === "suspended"){
            await ctx.resume();
        }

        for(let i=0;i<25;i++){

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "square";
            osc.frequency.value = 900 + Math.random()*1500;

            gain.gain.setValueAtTime(0.8, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

            osc.connect(gain);
            gain.connect(ctx.destination);

            let t = ctx.currentTime + Math.random()*0.8; // random timing

            osc.start(t);
            osc.stop(t + 0.03);

        }

    });

}

/**
 * 2. Scroll Animations
 */
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.info-block, .glass-panel, .card-dark').forEach(el => {
        observer.observe(el);
    });
}

/**
 * 3. Glitch Effect Logic
 */
function initGlitchEffect() {
    const text = document.querySelector('.glitch-text');
    if (!text) return;

    setInterval(() => {
        if (Math.random() > 0.98) {
            text.style.textShadow = '2px 0 #ff00c1, -2px 0 #00fff9';
            setTimeout(() => text.style.textShadow = '', 150);
        }
    }, 100);
}

/**
 * 4. Temperature/Stat Counters
 */
function initDataCounters() {
    const stats = document.querySelectorAll('.temp-fill');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const finalWidth = entry.target.style.width;
                entry.target.style.width = '0%';
                setTimeout(() => {
                    entry.target.style.transition = 'width 2s ease-out';
                    entry.target.style.width = finalWidth;
                }, 200);
            }
        });
    }, { threshold: 1 });
    stats.forEach(s => observer.observe(s));
}

/**
 * 5. Parallax Logic
 */
function initParallaxHeader() {
    window.addEventListener('scroll', () => {
        const offset = window.pageYOffset;
        const header = document.querySelector('.main-header');
        if (header) {
            header.style.backgroundPositionY = offset * 0.7 + 'px';
        }
    });
}