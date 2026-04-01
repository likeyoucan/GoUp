import { $, showToast, pad, updateText, updateTitle, vibrate, requestWakeLock, releaseWakeLock } from './utils.js';
import { t } from './i18n.js';

export const tm = {
    totalDuration: 0, targetTime: 0, remainingAtPause: 0, isRunning: false, isPaused: false, rAF: null, lastRender: 0, els: {},
    
    init() {
        this.els = {
            inputs: $('tm-inputs'), resetBtn: $('tm-resetBtn'), circleBtn: $('tm-circleBtn'),
            status: $('tm-statusText'), display: $('tm-mainDisplay'), ring: $('tm-progressRing'),
            h: $('tm-h'), m: $('tm-m'), s: $('tm-s'),
        };
        this.els.circleBtn?.addEventListener('click', () => this.toggle());
        this.els.resetBtn?.addEventListener('click', () => this.reset());
        
        [this.els.m, this.els.s].forEach(i => {
            if(!i) return;
            i.addEventListener('input', () => { 
                i.value = i.value.replace(/\D/g, '').slice(0, 2); 
                if (parseInt(i.value, 10) > 59) i.value = '59'; 
            });
        });
        if(this.els.h) {
            this.els.h.addEventListener('input', () => { 
                this.els.h.value = this.els.h.value.replace(/\D/g, '').slice(0, 2); 
            });
        }
    },
    
    toggle() {
        vibrate(50);
        if (this.isRunning) {
            this.isRunning = false; this.isPaused = true; 
            this.remainingAtPause = Math.max(0, this.targetTime - performance.now());
            cancelAnimationFrame(this.rAF); 
            releaseWakeLock();
            updateTitle('');
            this.updateUIState();
        } else {
            if (!this.isPaused) {
                const h = parseInt(this.els.h.value, 10) || 0;
                const m = parseInt(this.els.m.value, 10) || 0;
                const s = parseInt(this.els.s.value, 10) || 0;
                this.totalDuration = (h * 3600 + m * 60 + s) * 1000;
                if (this.totalDuration === 0) return;
                this.targetTime = performance.now() + this.totalDuration;
            } else { 
                this.targetTime = performance.now() + this.remainingAtPause; 
            }
            this.isRunning = true; this.isPaused = false; 
            requestWakeLock();
            this.updateUIState(); this.tick();
        }
    },
    
    reset() {
        vibrate(30);
        this.isRunning = false; this.isPaused = false; 
        cancelAnimationFrame(this.rAF);
        releaseWakeLock();
        updateTitle('');
        this.els.h.value = ''; this.els.m.value = ''; this.els.s.value = '';
        this.updateUIState(); 
        this.els.ring.style.strokeDashoffset = 282.74;
        updateText(this.els.display, 'GO'); 
        this.els.display.classList.add('is-go');
    },

    updateUIState() {
        if (this.isRunning) {
            this.els.inputs.classList.add('hidden', 'opacity-0'); this.els.resetBtn.classList.add('hidden'); this.els.status.classList.add('hidden'); 
            this.els.display.classList.remove('is-go');
        } else if (this.isPaused) {
            this.els.inputs.classList.add('hidden', 'opacity-0'); this.els.resetBtn.classList.remove('hidden'); this.els.status.classList.remove('hidden'); 
            updateText(this.els.status, t('pause')); 
        } else {
            this.els.inputs.classList.remove('hidden', 'opacity-0'); this.els.resetBtn.classList.add('hidden'); this.els.status.classList.add('hidden'); 
            this.els.display.classList.add('is-go'); updateText(this.els.display, 'GO');
        }
    },

    tick() {
        if (!this.isRunning) return;
        const now = performance.now();
        const remaining = Math.max(0, this.targetTime - now);
        
        if (now - this.lastRender >= 16) { 
            this.updateDisplay(remaining); 
            this.lastRender = now; 
        }
        
        if (remaining <= 0) {
            this.isRunning = false;
            vibrate([200, 100, 200, 100, 400]); // Длинная вибрация при завершении
            requestAnimationFrame(() => { showToast(t('timer_finished')); this.reset(); }); 
            return;
        }
        this.rAF = requestAnimationFrame(() => this.tick());
    },
    
    updateDisplay(rem) {
        const sTotal = Math.ceil(rem / 1000);
        const h = Math.floor(sTotal / 3600);
        const m = Math.floor((sTotal % 3600) / 60);
        const s = sTotal % 60;
        
        const hInput = parseInt(this.els.h.value, 10) || 0;
        const mInput = parseInt(this.els.m.value, 10) || 0;

        let timeStr = "";
        if (hInput > 0) timeStr = `${pad(h)}:${pad(m)}:${pad(s)}`;
        else if (mInput > 0 || m > 0) timeStr = `${pad(m)}:${pad(s)}`;
        else timeStr = `${s}`;

        updateText(this.els.display, timeStr);
        updateTitle(timeStr);
        this.els.ring.style.strokeDashoffset = 282.74 - ((Math.max(0, this.totalDuration - rem) / this.totalDuration) * 282.74);
    }
};