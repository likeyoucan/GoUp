import { $ } from './utils.js';
import { t } from './i18n.js';
import { themeManager } from './theme.js';

export const sw = {
    startTime: 0, elapsedTime: 0, isRunning: false, laps: [], rAF: null, lastRender: 0, els: {},
    
    init() {
        this.els = {
            display: $('sw-mainDisplay'), status: $('sw-statusText'), btn: $('sw-startStopBtn'),
            lapBtn: $('sw-lapBtn'), lapsContainer: $('sw-lapsContainer'), ring: $('sw-progressRing'),
        };
        this.els.btn.addEventListener('click', () => this.toggle());
        this.els.lapBtn.addEventListener('click', () => this.recordLapOrReset());
        window.sw = this; 
    },
    
    toggle() {
        if (this.isRunning) {
            this.isRunning = false; cancelAnimationFrame(this.rAF);
            this.els.status.classList.remove('hidden'); 
            this.els.lapBtn.textContent = t('reset'); this.els.lapBtn.classList.replace('app-surface', 'bg-red-500'); this.els.lapBtn.classList.replace('app-text', 'text-white');
        } else {
            this.startTime = Date.now() - this.elapsedTime; this.isRunning = true; this.tick();
            this.els.status.classList.add('hidden'); 
            this.els.display.classList.remove('is-go'); // Убираем огромный GO
            this.els.lapBtn.classList.remove('hidden'); this.els.lapBtn.textContent = t('lap');
            this.els.lapBtn.classList.replace('bg-red-500', 'app-surface'); this.els.lapBtn.classList.replace('text-white', 'app-text');
        }
    },
    
    tick() {
        if (!this.isRunning) return;
        const now = Date.now();
        this.elapsedTime = now - this.startTime;
        if (now - this.lastRender >= 16) { this.updateDisplay(); this.lastRender = now; }
        this.rAF = requestAnimationFrame(() => this.tick());
    },
    
    updateDisplay() {
        const totalMs = this.elapsedTime;
        const m = Math.floor(totalMs / 60000), s = Math.floor((totalMs % 60000) / 1000), ms = Math.floor((totalMs % 1000) / 10);
        let timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        if (themeManager.showMs) timeStr += `.${String(ms).padStart(2, '0')}`;
        this.els.display.textContent = timeStr;
        this.els.ring.style.strokeDashoffset = 282.74 - ((totalMs % 60000) / 60000 * 282.74);
    },
    
    recordLapOrReset() {
        if (this.isRunning) {
            const diff = this.elapsedTime - (this.laps.length > 0 ? this.laps[0].total : 0);
            this.laps.unshift({ total: this.elapsedTime, diff: diff, index: this.laps.length + 1 });
            const m = Math.floor(diff / 60000), s = Math.floor((diff % 60000) / 1000), ms = Math.floor((diff % 1000) / 10);
            let lapStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            if (themeManager.showMs) lapStr += `.${String(ms).padStart(2, '0')}`;

            const div = document.createElement('div');
            div.className = "flex justify-between items-center py-3 border-b app-border px-4 animation-fade-in";
            div.innerHTML = `<span class="app-text-sec">${t('lap_text')} ${this.laps.length}</span><span class="font-mono font-bold app-text">${lapStr}</span>`;
            if (this.laps.length === 1) this.els.lapsContainer.innerHTML = '';
            this.els.lapsContainer.prepend(div);
        } else if (this.elapsedTime > 0) {
            this.elapsedTime = 0; this.laps = [];
            this.els.display.textContent = 'GO'; 
            this.els.display.classList.add('is-go'); // Возвращаем огромный GO
            this.els.status.classList.add('hidden'); this.els.ring.style.strokeDashoffset = 282.74;
            this.els.lapBtn.classList.add('hidden');
            this.els.lapsContainer.innerHTML = `<div class="text-center app-text-sec opacity-50 mt-4 text-sm" data-i18n="no_laps">${t('no_laps')}</div>`;
        }
    }
};