/**
 * Elegant Audio Service
 * Uses Web Audio API to synthesize premium sounds without external assets
 */
const audioService = {
    ctx: null,

    init() {
        // AudioContext is initialized on first user interaction due to browser policies
        const initAudio = () => {
            if (!this.ctx) {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            }
            document.removeEventListener('mousedown', initAudio);
            document.removeEventListener('touchstart', initAudio);
            document.removeEventListener('keydown', initAudio);
        };
        document.addEventListener('mousedown', initAudio);
        document.addEventListener('touchstart', initAudio);
        document.addEventListener('keydown', initAudio);
    },

    /**
     * Refined S-Pen cursive stroke sound (Longer & Textured)
     */
    playClick() {
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const duration = 0.22; // Duración extendida para un trazo más natural

        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Textura con modulación de presión (simula un trazo rápido de firma)
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            // Modulación de amplitud para simular "dos trazos" rápidos en uno solo
            const pressure = (Math.random() * 2 - 1) * (0.6 + Math.sin(t * Math.PI * 2) * 0.4);
            data[i] = pressure * (0.7 + Math.sin(i * 0.08) * 0.3);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const highPass = this.ctx.createBiquadFilter();
        highPass.type = 'highpass';
        highPass.frequency.setValueAtTime(3500, now);

        const bandPass = this.ctx.createBiquadFilter();
        bandPass.type = 'bandpass';
        bandPass.frequency.setValueAtTime(7000, now);
        bandPass.Q.setValueAtTime(0.8, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.02); // Ataque suave
        gain.gain.linearRampToValueAtTime(0.02, now + duration * 0.5); // Caída media
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(highPass);
        highPass.connect(bandPass);
        bandPass.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + duration);
    },

    /**
     * Soft Success tone for payments
     */
    playSuccess() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const playTone = (freq, startTime, duration) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0.05, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        // Arpeggio effect
        playTone(523.25, now, 0.2); // C5
        playTone(659.25, now + 0.1, 0.2); // E5
        playTone(783.99, now + 0.2, 0.3); // G5
    },

    /**
     * Subtle "pop" for opening modals
     */
    playPop() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    },

    /**
     * Dissonant warning tone for errors
     */
    playError() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(150, now);
        osc1.frequency.linearRampToValueAtTime(100, now + 0.2);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(165, now); // Dissonant interval
        osc2.frequency.linearRampToValueAtTime(110, now + 0.2);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.2);
        osc2.stop(now + 0.2);
    }
};
