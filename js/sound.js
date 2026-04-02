import { $ } from './utils.js';

export const sm = {
    audioCtx: null,
    soundEnabled: true,
    vibroEnabled: true,
    theme: 'sport',

    init() {
        // Загрузка настроек
        this.soundEnabled = localStorage.getItem('app_sound') !== 'false';
        this.vibroEnabled = localStorage.getItem('app_vibro') !== 'false';
        this.theme = localStorage.getItem('app_sound_theme') || 'sport';

        // Привязка UI
        const soundToggle = $('toggle-sound');
        if (soundToggle) {
            soundToggle.checked = this.soundEnabled;
            soundToggle.addEventListener('change', (e) => {
                this.soundEnabled = e.target.checked;
                localStorage.setItem('app_sound', this.soundEnabled);
                if (this.soundEnabled) this.initAudio();
            });
        }

        const vibroToggle = $('toggle-vibro');
        if (vibroToggle) {
            vibroToggle.checked = this.vibroEnabled;
            vibroToggle.addEventListener('change', (e) => {
                this.vibroEnabled = e.target.checked;
                localStorage.setItem('app_vibro', this.vibroEnabled);
                if (this.vibroEnabled) this.vibrate(50);
            });
        }

        const themeSelect = $('soundThemeSelect');
        if (themeSelect) {
            themeSelect.value = this.theme;
            themeSelect.addEventListener('change', (e) => {
                this.theme = e.target.value;
                localStorage.setItem('app_sound_theme', this.theme);
                this.play('click');
            });
        }

        // Инициализация аудиоконтекста по первому клику пользователя (политика браузеров)
        document.addEventListener('click', () => this.initAudio(), { once: true });
    },

    initAudio() {
        if (this.soundEnabled && !this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
    },

    vibrate(pattern) {
        if (this.vibroEnabled && navigator.vibrate) {
            try { navigator.vibrate(pattern); } catch (e) { /* Игнорируем ошибки на старых iOS */ }
        }
    },

    play(type) {
        if (!this.soundEnabled || !this.audioCtx) return;
        
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        const now = this.audioCtx.currentTime;

        // Настройка частот в зависимости от типа звука
        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(this.theme === 'sport' ? 800 : 600, now);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } 
        else if (type === 'tick') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(1000, now);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        }
        else if (type === 'start' || type === 'rest') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(type === 'start' ? 1200 : 800, now);
            osc.frequency.exponentialRampToValueAtTime(type === 'start' ? 1600 : 600, now + 0.2);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        }
        else if (type === 'complete') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.setValueAtTime(1000, now + 0.1);
            osc.frequency.setValueAtTime(1200, now + 0.2);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
            osc.start(now);
            osc.stop(now + 0.6);
        }
    }
};