import { $ } from './utils.js';

export const translations = {
    en: {
        stopwatch: "Stopwatch", timer: "Timer", tabata: "Tabata", settings: "Settings",
        pause: "PAUSE", lap: "Lap", reset: "Reset", laps_history: "Laps History", no_laps: "No laps recorded",
        countdown: "Countdown", hr: "HR", min: "MIN", sec: "SEC", tabata_interval: "Tabata Interval",
        my_workouts: "My Workouts", create_new: "+ New", round: "ROUND", stop: "STOP",
        create_workout: "Create Workout", name: "Name", work: "Work", rest: "Rest", rounds: "Rounds",
        count: "COUNT", save: "Save", appearance: "Appearance", language: "Language", theme: "Theme",
        accent_color: "Accent", bg_color: "Background", interface: "General", font_size: "Font Size",
        timer_finished: "Timer Finished!", tabata_complete: "Tabata Complete!", get_ready: "Get Ready",
        cannot_delete: "Cannot delete active/last workout", lap_text: "Lap", active_timer: "Stop timer first!",
        show_ms: "Show Milliseconds", reset_settings: "Reset to Defaults"
    },
    ru: {
        stopwatch: "Секундомер", timer: "Таймер", tabata: "Табата", settings: "Настройки",
        pause: "ПАУЗА", lap: "Круг", reset: "Сброс", laps_history: "История кругов", no_laps: "Нет записей",
        countdown: "Таймер", hr: "Ч", min: "МИН", sec: "СЕК", tabata_interval: "Интервалы",
        my_workouts: "Мои тренировки", create_new: "+ Своя", round: "РАУНД", stop: "СТОП",
        create_workout: "Создать", name: "Название", work: "Работа", rest: "Отдых", rounds: "Раунды",
        count: "СЧЕТ", save: "Сохранить", appearance: "Внешний вид", language: "Язык", theme: "Тема",
        accent_color: "Цвет акцента", bg_color: "Цвет фона", interface: "Общие", font_size: "Размер шрифта",
        timer_finished: "Таймер завершен!", tabata_complete: "Тренировка завершена!", get_ready: "Приготовьтесь",
        cannot_delete: "Нельзя удалить активную/последнюю", lap_text: "Круг", active_timer: "Сначала остановите таймер!",
        show_ms: "Миллисекунды", reset_settings: "Сброс настроек"
    }
};

export const langManager = {
    current: 'en',
    init() {
        const stored = localStorage.getItem('app_lang');
        if (stored && stored !== 'auto') this.setLang(stored);
        else {
            const sys = navigator.language.startsWith('ru') ? 'ru' : 'en';
            this.setLang(sys, true);
            $('langSelect').value = 'auto';
        }
        $('langSelect').addEventListener('change', (e) => {
            if (e.target.value === 'auto') {
                const sys = navigator.language.startsWith('ru') ? 'ru' : 'en';
                this.setLang(sys, true);
                localStorage.setItem('app_lang', 'auto');
            } else { this.setLang(e.target.value); }
        });
    },
    setLang(lang, isAuto = false) {
        this.current = lang;
        if (!isAuto) localStorage.setItem('app_lang', lang);
        $('langSelect').value = isAuto ? 'auto' : lang;
        document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.getAttribute('data-i18n')));
    }
};
export const t = (key) => translations[langManager.current][key] || key;