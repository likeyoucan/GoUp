import { $, showToast } from './utils.js';
import { t } from './i18n.js';

export const tm = {
    totalDuration: 0, targetTime: 0, remainingAtPause: 0, isRunning: false, isPaused: false, rAF: null, lastRender: 0, els: {},
    
    init() {
        this.els = {
            inputs: $('tm-inputs'), resetBtn: $('tm-resetBtn'), circleBtn: $('tm-circleBtn'),
            status: $('tm-statusText'), display: $('tm-mainDisplay'), ring: $('tm-progressRing'),
            h: $('tm-h'), m: $('tm-m'), s: $('tm-s'),
        };
        this.els.circleBtn.addEventListener('click', () => this.toggle());
        this.els.resetBtn.addEventListener('click', () => this.reset());
        [this.els.m, this.els.s].forEach(i => i.addEventListener('input', () => { if (i.value.length > 2) i.value = i.value.slice(0, 2); if (parseInt(i.value) > 59) i.value = '59'; }));
        this.els.h.addEventListener('input', () => { if (this.els.h.value.length > 2) this.els.h.value = this.els.h.value.slice(0, 2); });
    },
    
    toggle() {
        if (this.isRunning) {
            this.isRunning = false; this.isPaused = true; this.remainingAtPause = this.targetTime - Date.now();
            cancelAnimationFrame(this.rAF); this.updateUIState();
        } else {
            if (!this.isPaused) {
                const h = parseInt(this.els.h.value) || 0, m = parseInt(this.els.m.value) || 0, s = parseInt(this.els.s.value) || 0;
                this.totalDuration = (h * 3600 + m * 60 + s) * 1000;
                if (this.totalDuration === 0) return;
                this.targetTime = Date.now() + this.totalDuration;
            } else { this.targetTime = Date.now() + this.remainingAtPause; }
            this.isRunning = true; this.isPaused = false; this.updateUIState(); this.tick();
        }
    },
    
    reset() {
        this.isRunning = false; this.isPaused = false; cancelAnimationFrame(this.rAF);
        this.els.h.value = ''; this.els.m.value = ''; this.els.s.value = '';
        this.updateUIState(); this.els.ring.style.strokeDashoffset = 282.74;
        this.els.display.textContent = 'GO'; 
        this.els.display.classList.add('is-go');
    },

    updateUIState() {
        if (this.isRunning) {
            this.els.inputs.classList.add('hidden', 'opacity-0'); this.els.resetBtn.classList.add('hidden'); this.els.status.classList.add('hidden'); 
            this.els.display.classList.remove('is-go');
        } else if (this.isPaused) {
            this.els.inputs.classList.add('hidden', 'opacity-0'); this.els.resetBtn.classList.remove('hidden'); this.els.status.classList.remove('hidden'); this.els.status.textContent = t('pause'); 
        } else {
            this.els.inputs.classList.remove('hidden', 'opacity-0'); this.els.resetBtn.classList.add('hidden'); this.els.status.classList.add('hidden'); 
            this.els.display.classList.add('is-go'); this.els.display.textContent = 'GO';
        }
    },

    tick() {
        if (!this.isRunning) return;
        const now = Date.now(), remaining = Math.max(0, this.targetTime - now);
        if (now - this.lastRender >= 16) { this.updateDisplay(remaining); this.lastRender = now; }
        if (remaining <= 0) {
            this.isRunning = false;
            requestAnimationFrame(() => { showToast(t('timer_finished')); this.reset(); }); return;
        }
        this.rAF = requestAnimationFrame(() => this.tick());
    },
    
    updateDisplay(rem) {
        const sTotal = Math.ceil(rem / 1000);
        const h = Math.floor(sTotal / 3600), m = Math.floor((sTotal % 3600) / 60), s = sTotal % 60;
        const hInput = parseInt(this.els.h.value) || 0, mInput = parseInt(this.els.m.value) || 0;

        let timeStr = "";
        if (hInput > 0) timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        else if (mInput > 0) timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        else timeStr = `${String(s)}`;

        this.els.display.textContent = timeStr;
        this.els.ring.style.strokeDashoffset = 282.74 - ((Math.max(0, this.totalDuration - rem) / this.totalDuration) * 282.74);
    }
};