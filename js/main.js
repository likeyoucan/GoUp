import { langManager } from './i18n.js';
import { themeManager } from './theme.js';
import { navigation } from './navigation.js';
import { sw } from './stopwatch.js';
import { tm } from './timer.js';
import { tb } from './tabata.js';

const resetModal = {
    modal: document.getElementById('reset-modal'),
    content: document.getElementById('reset-modal-content'),
    open() {
        this.modal.classList.remove('hidden');
        this.modal.removeAttribute('inert');
        this.modal.removeAttribute('aria-hidden');
        void this.modal.offsetWidth;
        this.modal.classList.replace('opacity-0', 'opacity-100');
        this.content.classList.remove('opacity-0', 'translate-y-[70px]');
        this.content.classList.add('opacity-100', 'translate-y-0');
    },
    close() {
        this.modal.classList.replace('opacity-100', 'opacity-0');
        this.content.classList.remove('opacity-100', 'translate-y-0');
        this.content.classList.add('opacity-0', 'translate-y-[70px]');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.modal.setAttribute('inert', '');
            this.modal.setAttribute('aria-hidden', 'true');
        }, 500);
    },
    confirm() {
        localStorage.removeItem('theme_mode'); localStorage.removeItem('theme_color');
        localStorage.removeItem('theme_bg_color'); localStorage.removeItem('font_size');
        localStorage.removeItem('app_lang'); localStorage.removeItem('app_show_ms');
        location.reload();
    }
};

window.sw = sw; 
window.tb = tb;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Инициализация UI-компонентов
    sw.init(); tm.init(); tb.init(); navigation.init();
    // 2. Инициализация темы и языка
    themeManager.init(); langManager.init();

    // 3. Биндинг навигации
    document.querySelectorAll('[data-nav]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const viewId = e.currentTarget.getAttribute('data-nav');
            navigation.switchView(viewId);
        });
    });

    // 4. Модалка сброса
    document.getElementById('btn-open-reset')?.addEventListener('click', () => resetModal.open());
    document.getElementById('reset-cancel')?.addEventListener('click', () => resetModal.close());
    document.getElementById('reset-confirm')?.addEventListener('click', () => resetModal.confirm());

    // 5. ГЛОБАЛЬНЫЕ ГОРЯЧИЕ КЛАВИШИ (Desktop UX)
    document.addEventListener('keydown', (e) => {
        // Блокируем клавиши, если пользователь печатает в инпут (например, имя сессии)
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

        const view = navigation.activeView;
        
        // Пробел - Play/Pause
        if (e.code === 'Space') {
            e.preventDefault(); // Запрет прокрутки страницы пробелом
            if (view === 'stopwatch') sw.toggle();
            else if (view === 'timer') tm.toggle();
            else if (view === 'tabata') tb.toggle();
        } 
        // Клавиша L - Lap (Только для секундомера)
        else if (e.key.toLowerCase() === 'l' && view === 'stopwatch') {
            sw.recordLapOrReset();
        } 
        // Клавиша R - Reset/Stop
        else if (e.key.toLowerCase() === 'r') {
            if (view === 'timer') tm.reset();
            else if (view === 'tabata') tb.stop();
        }
    });
});