const escapeHTML = (str) => {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
};

const showToast = (message) => {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = message;
    toast.classList.remove('opacity-0', 'translate-y-[-20px]');
    setTimeout(() => toast.classList.add('opacity-0', 'translate-y-[-20px]'), 3000);
};

const translations = {
    en: {
        stopwatch: "Stopwatch", timer: "Timer", tabata: "Tabata", settings: "Settings",
        pause: "PAUSE", lap: "Lap", reset: "Reset", laps_history: "Laps History",
        no_laps: "No laps recorded", countdown: "Countdown", hr: "HR", min: "MIN", sec: "SEC",
        tabata_interval: "Tabata Interval", my_workouts: "My Workouts", create_new: "+ New",
        round: "ROUND", stop: "STOP", create_workout: "Create Workout", name: "Name",
        work: "Work", rest: "Rest", rounds: "Rounds", count: "COUNT", save: "Save Workout",
        appearance: "Appearance", language: "Language", theme: "Theme", accent_color: "Accent Color",
        bg_color: "Background Color", interface: "Interface", font_size: "Font Size",
        timer_finished: "Timer Finished!", tabata_complete: "Tabata Complete!",
        get_ready: "Get Ready", cannot_delete: "Cannot delete last workout", lap_text: "Lap"
    },
    ru: {
        stopwatch: "Секундомер", timer: "Таймер", tabata: "Табата", settings: "Настройки",
        pause: "ПАУЗА", lap: "Круг", reset: "Сброс", laps_history: "История кругов",
        no_laps: "Нет записей", countdown: "Таймер", hr: "Ч", min: "МИН", sec: "СЕК",
        tabata_interval: "Интервалы", my_workouts: "Мои тренировки", create_new: "+ Своя",
        round: "РАУНД", stop: "СТОП", create_workout: "Создать", name: "Название",
        work: "Работа", rest: "Отдых", rounds: "Раунды", count: "СЧЕТ", save: "Сохранить",
        appearance: "Внешний вид", language: "Язык", theme: "Тема", accent_color: "Цвет акцента",
        bg_color: "Цвет фона", interface: "Интерфейс", font_size: "Размер шрифта",
        timer_finished: "Таймер завершен!", tabata_complete: "Тренировка завершена!",
        get_ready: "Приготовьтесь", cannot_delete: "Нельзя удалить последнюю тренировку", lap_text: "Круг"
    }
};

const t = (key) => translations[langManager.current][key] || key;

function switchView(viewId) {
    ['stopwatch', 'timer', 'tabata', 'settings'].forEach(id => {
        const el = document.getElementById(`view-${id}`);
        if (id === viewId) {
            el.classList.remove('opacity-0', 'pointer-events-none');
            el.classList.add('z-10');
            el.removeAttribute('aria-hidden');
            el.removeAttribute('inert');
        } else {
            el.classList.add('opacity-0', 'pointer-events-none');
            el.classList.remove('z-10');
            el.setAttribute('aria-hidden', 'true');
            el.setAttribute('inert', '');
        }
    });
    updateIcons(viewId);
}

function updateIcons(activeId) {
    ['stopwatch', 'timer', 'tabata', 'settings'].forEach(id => {
        const isActive = id === activeId;
        const iconDiv = document.getElementById(`nav-icon-${id}`);
        const textSpan = iconDiv.nextElementSibling;
        const iconSvg = iconDiv.querySelector('svg');

        if (isActive) {
            iconDiv.classList.remove('text-gray-400');
            iconDiv.classList.add('primary-text');
            textSpan.classList.remove('text-gray-400');
            textSpan.classList.add('primary-text');
            if (iconSvg) iconSvg.classList.add('stroke-2');
        } else {
            iconDiv.classList.add('text-gray-400');
            iconDiv.classList.remove('primary-text');
            textSpan.classList.add('text-gray-400');
            textSpan.classList.remove('primary-text');
            if (iconSvg) iconSvg.classList.remove('stroke-2');
        }
    });
}

setInterval(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('clock').textContent = now.getSeconds() % 2 === 0 ? timeStr : timeStr.replace(':', ' ');
}, 1000);

const langManager = {
    current: 'en',
    init() {
        const stored = localStorage.getItem('app_lang');
        if (stored && stored !== 'auto') this.setLang(stored);
        else {
            const sys = navigator.language.startsWith('ru') ? 'ru' : 'en';
            this.setLang(sys, true);
            document.getElementById('langSelect').value = 'auto';
        }

        document.getElementById('langSelect').addEventListener('change', (e) => {
            if (e.target.value === 'auto') {
                const sys = navigator.language.startsWith('ru') ? 'ru' : 'en';
                this.setLang(sys, true);
                localStorage.setItem('app_lang', 'auto');
            } else {
                this.setLang(e.target.value);
            }
        });
    },
    setLang(lang, isAuto = false) {
        this.current = lang;
        if (!isAuto) localStorage.setItem('app_lang', lang);
        document.getElementById('langSelect').value = isAuto ? 'auto' : lang;
        document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.getAttribute('data-i18n')));
    }
};

const themeManager = {
    currentMode: 'system',
    currentBg: 'default',
    init() {
        this.setMode(localStorage.getItem('theme_mode') || 'system');
        this.setColor(localStorage.getItem('theme_color') || '#22c55e');
        this.setBgColor(localStorage.getItem('theme_bg_color') || 'default');
        this.setFontSize(localStorage.getItem('font_size') || 16);

        document.getElementById('fontSlider').addEventListener('input', (e) => this.setFontSize(e.target.value));
    },
    setMode(mode) {
        this.currentMode = mode;
        localStorage.setItem('theme_mode', mode);

        document.querySelectorAll('[id^="theme-"]').forEach(b => {
            b.classList.remove('app-surface', 'shadow-sm', 'app-text');
            b.classList.add('app-text-sec');
        });

        const activeBtn = document.getElementById(`theme-${mode}`);
        activeBtn.classList.remove('app-text-sec');
        activeBtn.classList.add('app-surface', 'shadow-sm', 'app-text');

        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = mode === 'dark' || (mode === 'system' && isSystemDark);

        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');

        this.applyBgTheme(this.currentBg, isDark);
    },
    setColor(hex) {
        localStorage.setItem('theme_color', hex);
        document.documentElement.style.setProperty('--primary-color', hex);

        let found = false;
        // ИСПРАВЛЕНИЕ: добавлены галочки для кнопок акцентного цвета для единообразия
        document.querySelectorAll('.color-btn').forEach(b => {
            b.classList.remove('ring-2', 'ring-offset-2', 'ring-offset-white', 'dark:ring-offset-gray-900', 'border-gray-500');
            b.classList.add('border-transparent');

            if (b.getAttribute('data-color') === hex) {
                b.classList.remove('border-transparent');
                b.classList.add('ring-2', 'ring-offset-2', 'ring-offset-white', 'dark:ring-offset-gray-900');
                b.innerHTML = '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>';
                found = true;
            } else {
                b.innerHTML = '';
            }
        });

        const picker = document.getElementById('customColorBtn');
        picker.classList.remove('ring-2', 'ring-offset-2', 'ring-offset-white', 'dark:ring-offset-gray-900', 'border-white');
        if (!found) {
            picker.classList.add('ring-2', 'ring-offset-2', 'ring-offset-white', 'dark:ring-offset-gray-900');
            picker.classList.replace('border-transparent', 'border-white');
        } else {
            picker.classList.replace('border-white', 'border-transparent');
        }
    },
    setBgColor(hex) {
        this.currentBg = hex;
        localStorage.setItem('theme_bg_color', hex);
        const isDark = document.documentElement.classList.contains('dark');
        this.applyBgTheme(hex, isDark);

        let found = false;
        document.querySelectorAll('.bg-btn').forEach(b => {
            b.classList.remove('ring-2', 'ring-offset-2', 'ring-offset-white', 'dark:ring-offset-gray-900', 'border-gray-500');
            b.classList.add('border-transparent');

            if (b.getAttribute('data-bg') === hex) {
                b.classList.remove('border-transparent');
                b.classList.add('ring-2', 'ring-offset-2', 'ring-offset-white', 'dark:ring-offset-gray-900');

                // ИСПРАВЛЕНИЕ: Использование var(--text-color) для мгновенного и надежного переключения белого/черного
                if (hex === 'default') {
                    b.innerHTML = '<svg class="w-5 h-5" style="color: var(--text-color);" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>';
                } else {
                    b.innerHTML = '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>';
                }
                found = true;
            } else {
                b.innerHTML = '';
            }
        });

        const picker = document.getElementById('customBgBtn');
        picker.classList.remove('ring-2', 'ring-offset-2', 'ring-offset-white', 'dark:ring-offset-gray-900', 'border-white');
        if (!found && hex !== 'default') {
            picker.classList.add('ring-2', 'ring-offset-2', 'ring-offset-white', 'dark:ring-offset-gray-900');
            picker.classList.replace('border-transparent', 'border-white');
        } else {
            picker.classList.replace('border-white', 'border-transparent');
        }
    },
    applyBgTheme(hex, isDark) {
        const root = document.documentElement;
        if (hex === 'default') {
            root.style.removeProperty('--bg-color');
            root.style.removeProperty('--surface-color');
            return;
        }

        const { h, s, l } = this.hexToHSL(hex);
        if (isDark) {
            const adjS = Math.min(s, 45);
            root.style.setProperty('--bg-color', `hsl(${h}, ${adjS}%, 8%)`);
            root.style.setProperty('--surface-color', `hsl(${h}, ${adjS}%, 14%)`);
        } else {
            root.style.setProperty('--bg-color', `hsl(${h}, ${s}%, ${l}%)`);
            root.style.setProperty('--surface-color', `hsl(${h}, ${s}%, ${Math.min(100, l + 15)}%)`);
        }
    },
    hexToHSL(H) {
        let r = 0, g = 0, b = 0;
        if (H.length == 4) {
            r = "0x" + H[1] + H[1];
            g = "0x" + H[2] + H[2];
            b = "0x" + H[3] + H[3];
        } else if (H.length == 7) {
            r = "0x" + H[1] + H[2];
            g = "0x" + H[3] + H[4];
            b = "0x" + H[5] + H[6];
        }
        r /= 255; g /= 255; b /= 255;
        let cmin = Math.min(r, g, b),
            cmax = Math.max(r, g, b),
            delta = cmax - cmin;
        let h = 0, s = 0, l = (cmax + cmin) / 2;

        if (delta != 0) {
            if (cmax == r) h = ((g - b) / delta) % 6;
            else if (cmax == g) h = (b - r) / delta + 2;
            else h = (r - g) / delta + 4;
            s = delta / (1 - Math.abs(2 * l - 1));
        }
        h = Math.round(h * 60);
        if (h < 0) h += 360;
        return { h, s: +(s * 100).toFixed(1), l: +(l * 100).toFixed(1) };
    },
    setFontSize(size) {
        document.documentElement.style.setProperty('--font-size-base', size + 'px');
        document.getElementById('fontSizeDisplay').textContent = size + ' px';
        document.getElementById('fontSlider').value = size;
        localStorage.setItem('font_size', size);
    }
};

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (themeManager.currentMode === 'system') themeManager.setMode('system');
});

window.adjustVal = function (id, delta) {
    const el = document.getElementById(id);
    el.value = Math.max(1, (parseInt(el.value) || 0) + delta);
};

const sw = {
    startTime: 0,
    elapsedTime: 0,
    isRunning: false,
    laps: [],
    rAF: null,
    elements: {
        display: document.getElementById('sw-mainDisplay'),
        status: document.getElementById('sw-statusText'),
        btn: document.getElementById('sw-startStopBtn'),
        lapBtn: document.getElementById('sw-lapBtn'),
        lapsContainer: document.getElementById('sw-lapsContainer'),
        ring: document.getElementById('sw-progressRing'),
    },
    init() {
        this.elements.btn.addEventListener('click', () => this.toggle());
        this.elements.lapBtn.addEventListener('click', () => this.recordLapOrReset());
    },
    toggle() {
        if (this.isRunning) {
            this.isRunning = false;
            cancelAnimationFrame(this.rAF);
            this.elements.status.classList.remove('hidden');
            this.elements.display.classList.replace('text-6xl', 'text-5xl');
            this.elements.lapBtn.textContent = t('reset');
            this.elements.lapBtn.classList.replace('app-surface', 'bg-red-500');
            this.elements.lapBtn.classList.replace('app-text', 'text-white');
        } else {
            this.startTime = Date.now() - this.elapsedTime;
            this.isRunning = true;
            this.tick();
            this.elements.status.classList.add('hidden');
            this.elements.display.classList.replace('text-5xl', 'text-6xl');
            this.elements.lapBtn.classList.remove('hidden');
            this.elements.lapBtn.textContent = t('lap');
            this.elements.lapBtn.classList.replace('bg-red-500', 'app-surface');
            this.elements.lapBtn.classList.replace('text-white', 'app-text');
        }
    },
    tick() {
        if (!this.isRunning) return;
        this.elapsedTime = Date.now() - this.startTime;
        this.updateDisplay();
        this.rAF = requestAnimationFrame(() => this.tick());
    },
    updateDisplay() {
        const totalMs = this.elapsedTime;
        const m = Math.floor(totalMs / 60000),
            s = Math.floor((totalMs % 60000) / 1000),
            ms = Math.floor((totalMs % 1000) / 10);

        this.elements.display.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
        this.elements.ring.style.strokeDashoffset = 282.74 - ((totalMs % 60000) / 60000 * 282.74);
    },
    recordLapOrReset() {
        if (this.isRunning) {
            const diff = this.elapsedTime - (this.laps.length > 0 ? this.laps[0].total : 0);
            this.laps.unshift({ total: this.elapsedTime, diff: diff, index: this.laps.length + 1 });
            const m = Math.floor(diff / 60000),
                s = Math.floor((diff % 60000) / 1000),
                ms = Math.floor((diff % 1000) / 10);

            const div = document.createElement('div');
            div.className = "flex justify-between items-center py-3 border-b app-border px-4 animation-fade-in";
            div.innerHTML = `<span class="app-text-sec">${t('lap_text')} ${this.laps.length}</span><span class="font-mono font-bold app-text">${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}</span>`;

            if (this.laps.length === 1) this.elements.lapsContainer.innerHTML = '';
            this.elements.lapsContainer.prepend(div);
        } else if (this.elapsedTime > 0) {
            this.elapsedTime = 0;
            this.laps = [];
            this.elements.display.textContent = 'GO';
            this.elements.display.classList.replace('text-5xl', 'text-6xl');
            this.elements.status.classList.add('hidden');
            this.elements.ring.style.strokeDashoffset = 282.74;
            this.elements.lapBtn.classList.add('hidden');
            this.elements.lapsContainer.innerHTML = `<div class="text-center app-text-sec opacity-50 mt-4 text-sm" data-i18n="no_laps">${t('no_laps')}</div>`;
        }
    }
};

sw.init();

const tm = {
    totalDuration: 0,
    targetTime: 0,
    remainingAtPause: 0,
    isRunning: false,
    isPaused: false,
    rAF: null,
    els: {
        inputs: document.getElementById('tm-inputs'),
        resetBtn: document.getElementById('tm-resetBtn'),
        circleBtn: document.getElementById('tm-circleBtn'),
        status: document.getElementById('tm-statusText'),
        display: document.getElementById('tm-mainDisplay'),
        ring: document.getElementById('tm-progressRing'),
        h: document.getElementById('tm-h'),
        m: document.getElementById('tm-m'),
        s: document.getElementById('tm-s'),
    },
    init() {
        this.els.circleBtn.addEventListener('click', () => this.toggle());
        this.els.resetBtn.addEventListener('click', () => this.reset());

        [this.els.m, this.els.s].forEach(i => i.addEventListener('input', () => {
            if (i.value.length > 2) i.value = i.value.slice(0, 2);
            if (parseInt(i.value) > 59) i.value = '59';
        }));

        this.els.h.addEventListener('input', () => {
            if (this.els.h.value.length > 2) this.els.h.value = this.els.h.value.slice(0, 2);
        });
    },
    toggle() {
        if (this.isRunning) {
            this.isRunning = false;
            this.isPaused = true;
            this.remainingAtPause = this.targetTime - Date.now();
            cancelAnimationFrame(this.rAF);
            this.updateUIState();
        } else {
            if (!this.isPaused) {
                const h = parseInt(this.els.h.value) || 0,
                    m = parseInt(this.els.m.value) || 0,
                    s = parseInt(this.els.s.value) || 0;
                this.totalDuration = (h * 3600 + m * 60 + s) * 1000;
                if (this.totalDuration === 0) return;
                this.targetTime = Date.now() + this.totalDuration;
            } else {
                this.targetTime = Date.now() + this.remainingAtPause;
            }
            this.isRunning = true;
            this.isPaused = false;
            this.updateUIState();
            this.tick();
        }
    },
    tick() {
        if (!this.isRunning) return;
        const remaining = Math.max(0, this.targetTime - Date.now());
        this.updateDisplay(remaining);

        if (remaining <= 0) {
            this.isRunning = false;
            requestAnimationFrame(() => {
                showToast(t('timer_finished'));
                this.reset();
            });
            return;
        }
        this.rAF = requestAnimationFrame(() => this.tick());
    },
    reset() {
        this.isRunning = false;
        this.isPaused = false;
        cancelAnimationFrame(this.rAF);
        this.els.h.value = '';
        this.els.m.value = '';
        this.els.s.value = '';
        this.updateUIState();
        this.els.ring.style.strokeDashoffset = 282.74;
        this.els.display.textContent = 'GO';
        this.els.display.classList.replace('text-5xl', 'text-6xl');
    },
    updateUIState() {
        if (this.isRunning) {
            this.els.inputs.classList.add('hidden', 'opacity-0');
            this.els.resetBtn.classList.add('hidden');
            this.els.status.classList.add('hidden');
            this.els.display.classList.replace('text-6xl', 'text-5xl');
        } else if (this.isPaused) {
            this.els.inputs.classList.add('hidden', 'opacity-0');
            this.els.resetBtn.classList.remove('hidden');
            this.els.status.classList.remove('hidden');
            this.els.status.textContent = t('pause');
            this.els.display.classList.replace('text-6xl', 'text-5xl');
        } else {
            this.els.inputs.classList.remove('hidden', 'opacity-0');
            this.els.resetBtn.classList.add('hidden');
            this.els.status.classList.add('hidden');
            this.els.display.classList.replace('text-5xl', 'text-6xl');
            this.els.display.textContent = 'GO';
        }
    },
    updateDisplay(rem) {
        const sTotal = Math.ceil(rem / 1000);
        const h = Math.floor(sTotal / 3600),
            m = Math.floor((sTotal % 3600) / 60),
            s = sTotal % 60;
        this.els.display.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        this.els.ring.style.strokeDashoffset = 282.74 - ((Math.max(0, this.totalDuration - rem) / this.totalDuration) * 282.74);
    }
};

tm.init();

const tb = {
    workouts: [],
    selectedId: null,
    work: 20, rest: 10, rounds: 8,
    currentRound: 1,
    status: 'STOPPED',
    phaseDuration: 0,
    phaseEndTime: 0,
    remainingAtPause: 0,
    rAF: null,
    paused: false,
    els: {
        listSection: document.getElementById('tb-list-section'),
        runningControls: document.getElementById('tb-runningControls'),
        modal: document.getElementById('tb-modal'),
        list: document.getElementById('tb-workoutsList'),
        startBtn: document.getElementById('tb-startBtn'),
        stopBtn: document.getElementById('tb-stopBtn'),
        ring: document.getElementById('tb-progressRing'),
        status: document.getElementById('tb-statusText'),
        timer: document.getElementById('tb-mainTimer'),
        activeName: document.getElementById('tb-activeName'),
        activeDetail: document.getElementById('tb-activeDetail'),
        roundDisplay: document.getElementById('tb-currentRound'),
        totalRoundsDisplay: document.getElementById('tb-totalRounds'),
        editName: document.getElementById('tb-edit-name'),
        editWork: document.getElementById('tb-edit-work'),
        editRest: document.getElementById('tb-edit-rest'),
        editRounds: document.getElementById('tb-edit-rounds'),
    },
    init() {
        const stored = localStorage.getItem('tb_workouts');
        if (stored) this.workouts = JSON.parse(stored);
        else {
            this.workouts = [{ id: 1, name: "Standard Tabata", work: 20, rest: 10, rounds: 8 }];
            localStorage.setItem('tb_workouts', JSON.stringify(this.workouts));
        }

        this.selectWorkout(this.workouts[0].id);
        this.renderList();

        this.els.startBtn.addEventListener('click', () => this.toggle());
        this.els.stopBtn.addEventListener('click', () => this.stop());
    },
    openModal() {
        this.els.modal.classList.remove('hidden');
        this.els.modal.removeAttribute('inert');
        this.els.modal.removeAttribute('aria-hidden');
        this.els.editName.value = "";
        this.els.editWork.value = 20;
        this.els.editRest.value = 10;
        this.els.editRounds.value = 8;
    },
    closeModal() {
        this.els.modal.classList.add('hidden');
        this.els.modal.setAttribute('inert', '');
        this.els.modal.setAttribute('aria-hidden', 'true');
    },
    saveWorkout() {
        const w = Math.max(1, parseInt(this.els.editWork.value) || 20),
            r = Math.max(1, parseInt(this.els.editRest.value) || 10),
            rnd = Math.max(1, parseInt(this.els.editRounds.value) || 8);

        const newW = {
            id: Date.now(),
            name: this.els.editName.value.trim() || "Tabata",
            work: w, rest: r, rounds: rnd
        };

        this.workouts.push(newW);
        localStorage.setItem('tb_workouts', JSON.stringify(this.workouts));
        this.renderList();
        this.selectWorkout(newW.id);
        this.closeModal();
    },
    deleteWorkout(id) {
        if (this.workouts.length <= 1) {
            showToast(t('cannot_delete'));
            return;
        }
        this.workouts = this.workouts.filter(w => w.id !== id);
        localStorage.setItem('tb_workouts', JSON.stringify(this.workouts));
        if (this.selectedId === id) this.selectWorkout(this.workouts[0].id);
        this.renderList();
    },
    selectWorkout(id) {
        const w = this.workouts.find(k => k.id === id);
        if (!w) return;
        this.selectedId = id;
        this.work = w.work * 1000;
        this.rest = w.rest * 1000;
        this.rounds = w.rounds;

        this.els.activeName.textContent = w.name;
        this.els.activeDetail.textContent = `${w.work}s / ${w.rest}s • ${w.rounds} Rounds`;
        this.renderList();
    },
    renderList() {
        this.els.list.innerHTML = "";
        this.workouts.forEach(w => {
            const div = document.createElement('div');
            const isAct = w.id === this.selectedId;
            div.tabIndex = 0;
            div.className = `p-4 rounded-xl flex justify-between items-center transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] ${isAct ? 'app-surface border-2 border-[var(--primary-color)]' : 'app-surface border border-transparent'}`;
            div.onclick = () => this.selectWorkout(w.id);
            div.onkeydown = (e) => {
                if (e.key === 'Enter') this.selectWorkout(w.id);
            };
            div.innerHTML = `
                <div>
                    <div class="font-bold app-text ${isAct ? 'primary-text' : ''}">${escapeHTML(w.name)}</div>
                    <div class="text-xs app-text-sec">${w.work}/${w.rest} • ${w.rounds} Rds</div>
                </div>
                <button class="text-red-500 opacity-50 hover:opacity-100 p-2 focus:outline-none focus-visible:underline" onclick="(function(e){ e.stopPropagation(); tb.deleteWorkout(${w.id}); })(event)">✕</button>
            `;
            this.els.list.appendChild(div);
        });
    },
    toggle() {
        if (this.status === 'STOPPED') this.start();
        else if (this.paused) this.resume();
        else this.pause();
    },
    start() {
        this.currentRound = 1;
        this.status = "READY";
        this.phaseDuration = 5000;
        this.phaseEndTime = Date.now() + this.phaseDuration;
        this.paused = false;

        this.els.listSection.classList.add('hidden');
        this.els.runningControls.classList.replace('hidden', 'flex');
        this.els.totalRoundsDisplay.textContent = this.rounds;
        this.els.status.classList.remove('hidden');
        this.els.timer.classList.replace('text-6xl', 'text-5xl');

        this.updatePhaseStyles();
        this.tick();
    },
    pause() {
        this.paused = true;
        cancelAnimationFrame(this.rAF);
        this.remainingAtPause = this.phaseEndTime - Date.now();
        this.els.status.textContent = t('pause');
    },
    resume() {
        this.paused = false;
        this.phaseEndTime = Date.now() + this.remainingAtPause;
        this.tick();
        this.updatePhaseStyles();
    },
    stop() {
        cancelAnimationFrame(this.rAF);
        this.status = "STOPPED";
        this.paused = false;
        this.els.listSection.classList.remove('hidden');
        this.els.runningControls.classList.replace('flex', 'hidden');
        this.els.status.classList.add('hidden');
        this.els.timer.textContent = "GO";
        this.els.timer.classList.replace('text-5xl', 'text-6xl');
        this.els.ring.style.strokeDashoffset = 282.74;
    },
    tick() {
        if (this.status === 'STOPPED' || this.paused) return;
        const rem = this.phaseEndTime - Date.now();

        if (rem <= 0) {
            this.nextPhase();
            return;
        }

        this.render(rem);
        this.rAF = requestAnimationFrame(() => this.tick());
    },
    nextPhase() {
        if (this.status === "READY") {
            this.status = "WORK";
            this.phaseDuration = this.work;
        } else if (this.status === "WORK") {
            this.status = "REST";
            this.phaseDuration = this.rest;
        } else if (this.status === "REST") {
            if (this.currentRound >= this.rounds) {
                requestAnimationFrame(() => {
                    showToast(t('tabata_complete'));
                    this.stop();
                });
                return;
            }
            this.currentRound++;
            this.status = "WORK";
            this.phaseDuration = this.work;
        }

        this.phaseEndTime = Date.now() + this.phaseDuration;
        this.updatePhaseStyles();
        this.tick();
    },
    updatePhaseStyles() {
        this.els.roundDisplay.textContent = this.currentRound;
        this.els.ring.classList.remove('primary-stroke', 'text-blue-500', 'text-gray-500');
        this.els.ring.style.stroke = "";

        if (this.status === "WORK") {
            this.els.status.textContent = t('work');
            this.els.status.className = "text-xl font-bold uppercase tracking-widest mb-1 primary-text";
            this.els.ring.classList.add('primary-stroke');
        } else if (this.status === "REST") {
            this.els.status.textContent = t('rest');
            this.els.status.className = "text-xl font-bold uppercase tracking-widest mb-1 text-blue-500";
            this.els.ring.style.stroke = "#3b82f6";
        } else {
            this.els.status.textContent = t('get_ready');
            this.els.status.className = "text-xl font-bold uppercase tracking-widest mb-1 app-text-sec";
            this.els.ring.classList.add('primary-stroke');
        }
    },
    render(rem) {
        const sTotal = Math.max(0, Math.ceil(rem / 1000));
        const min = Math.floor(sTotal / 60),
            sec = sTotal % 60;

        this.els.timer.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
        this.els.ring.style.strokeDashoffset = 282.74 - ((Math.max(0, this.phaseDuration - rem) / this.phaseDuration) * 282.74);
    }
};

tb.init();
langManager.init();
themeManager.init();
