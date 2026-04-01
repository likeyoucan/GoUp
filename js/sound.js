import { $ } from './utils.js';

export const sm = {
    ctx: null,
    soundEnabled: true,
    vibroEnabled: true,
    theme: 'sport',

    init() {
        this.soundEnabled = localStorage.getItem('app_sound') !== 'false';
        this.vibroEnabled = localStorage.getItem('app_vibro') !== 'false';
        this.theme = localStorage.getItem('app_sound_theme') || 'sport';

        const tSound = $('toggle-sound');
        if (tSound) {
            tSound.checked = this.soundEnabled;
            tSound.addEventListener('change', (e) => {
                this.soundEnabled = e.target.checked;
                localStorage.setItem('app_sound', this.soundEnabled);
                if (this.soundEnabled) this.play('click');
            });
        }

        const tVibro = $('toggle-vibro');
        if (tVibro) {
            tVibro.checked = this.vibroEnabled;
            tVibro.addEventListener('change', (e) => {
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
                this.play('start'); // Демонстрируем звук при переключении
            });
        }

        // Разблокировка AudioContext
        const initCtx = () => {
            if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (this.ctx.state === 'suspended') this.ctx.resume();
            document.removeEventListener('click', initCtx);
            document.removeEventListener('touchstart', initCtx);
        };
        document.addEventListener('click', initCtx);
        document.addEventListener('touchstart', initCtx);
    },

    /**
     * Продвинутый синтезатор. Умеет играть "аккорды" и "гармоники" для дорогого звучания.
     * @param {Array} frequencies - Массив частот (для аккорда или сложного звука)
     * @param {String} type - 'sine', 'triangle', 'square'
     * @param {Number} attack - Время нарастания звука (сек)
     * @param {Number} decay - Время затухания звука (сек)
     * @param {Number} vol - Громкость (0.0 - 1.0)
     * @param {Number} delaySec - Отсрочка старта
     */
    playComplex(frequencies, type, attack, decay, vol = 0.5, delaySec = 0) {
        if (!this.soundEnabled || !this.ctx) return;
        
        const startTime = this.ctx.currentTime + delaySec;
        
        // Мастер-громкость для защиты от хрипения при наложении звуков
        const masterGain = this.ctx.createGain();
        masterGain.gain.value = vol / frequencies.length; 
        masterGain.connect(this.ctx.destination);

        frequencies.forEach(freq => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, startTime);

            // Мягкий фильтр: делает звук "матовым" и приятным
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(type === 'square' ? 1000 : 2000, startTime);

            // ADSR (Управление громкостью)
            gain.gain.setValueAtTime(0, startTime); // Старт с тишины
            // Атака (удар молоточка)
            gain.gain.linearRampToValueAtTime(1, startTime + attack); 
            // Затухание (эхо)
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + attack + decay);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);

            osc.start(startTime);
            osc.stop(startTime + attack + decay + 0.1);
        });
    },

    play(event) {
        if (!this.soundEnabled || !this.ctx) return;

        // Ноты: C5=523, E5=659, G5=784, A5=880, C6=1046
        switch (this.theme) {
            
            // 1. SPORT (Четкий, спортивный, как электронный секундомер)
            case 'sport':
                if (event === 'click') this.playComplex([800], 'triangle', 0.01, 0.05, 0.3);
                if (event === 'tick') this.playComplex([600], 'square', 0.01, 0.15, 0.2); // Короткий бип
                if (event === 'start') this.playComplex([800, 805], 'square', 0.02, 0.4, 0.3); // Двойной бип (громче)
                if (event === 'rest') this.playComplex([400, 403], 'square', 0.02, 0.4, 0.3); // Низкий бип
                if (event === 'complete') {
                    this.playComplex([600], 'square', 0.01, 0.2, 0.3, 0);
                    this.playComplex([600], 'square', 0.01, 0.2, 0.3, 0.25);
                    this.playComplex([800], 'square', 0.01, 0.6, 0.3, 0.5);
                }
                break;

            // 2. WORK (Рабочий, фокусировка. Звучит как маримба / стеклянный колокольчик)
            case 'work':
                if (event === 'click') this.playComplex([1046], 'sine', 0.01, 0.1, 0.2);
                if (event === 'tick') this.playComplex([523, 1046], 'sine', 0.01, 0.2, 0.4); // Легкий кап
                if (event === 'start') this.playComplex([659, 1318], 'sine', 0.01, 0.8, 0.5); // Светлый, долгий колокольчик
                if (event === 'rest') this.playComplex([523, 784], 'sine', 0.01, 0.6, 0.4); // Спокойный колокольчик
                if (event === 'complete') {
                    // Мелодия успешного завершения задачи
                    this.playComplex([523], 'sine', 0.01, 0.3, 0.5, 0);
                    this.playComplex([659], 'sine', 0.01, 0.3, 0.5, 0.2);
                    this.playComplex([784, 1567], 'sine', 0.01, 1.2, 0.5, 0.4);
                }
                break;

            // 3. LIFE (Дзен, Йога. Тибетская поющая чаша.)
            case 'life':
                if (event === 'click') this.playComplex([440], 'sine', 0.05, 0.2, 0.2);
                if (event === 'tick') this.playComplex([349], 'sine', 0.1, 0.4, 0.3); // Мягкий "бум"
                if (event === 'start') this.playComplex([440, 443, 220], 'sine', 0.3, 2.5, 0.8); // Медленный гонг (с вибрацией)
                if (event === 'rest') this.playComplex([349, 351, 174], 'sine', 0.3, 2.5, 0.7); // Низкий гонг
                if (event === 'complete') {
                    this.playComplex([440, 523, 659], 'sine', 0.5, 3.0, 0.7); // Долгий красивый аккорд
                }
                break;

            // 4. VIBE (Стильный, современный, Synthwave/Lo-Fi)
            case 'vibe':
                if (event === 'click') this.playComplex([700], 'triangle', 0.01, 0.1, 0.2);
                if (event === 'tick') this.playComplex([300, 450], 'triangle', 0.01, 0.1, 0.4); // Короткий плак (pluck)
                if (event === 'start') this.playComplex([440, 554, 659], 'triangle', 0.02, 0.5, 0.5); // Мажорный аккорд
                if (event === 'rest') this.playComplex([349, 440, 523], 'triangle', 0.02, 0.5, 0.4); // Минорный аккорд
                if (event === 'complete') {
                    // Арпеджио
                    this.playComplex([440], 'triangle', 0.01, 0.2, 0.4, 0);
                    this.playComplex([554], 'triangle', 0.01, 0.2, 0.4, 0.15);
                    this.playComplex([659], 'triangle', 0.01, 0.2, 0.4, 0.3);
                    this.playComplex([880, 440], 'triangle', 0.02, 1.0, 0.5, 0.45);
                }
                break;
        }
    },

    vibrate(pattern) {
        if (this.vibroEnabled && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }
};