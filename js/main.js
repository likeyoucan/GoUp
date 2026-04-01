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
        this.modal.classList.add('flex');
        this.modal.removeAttribute('inert');
        this.modal.removeAttribute('aria-hidden');
        
        requestAnimationFrame(() => {
            this.modal.classList.remove('opacity-0');
            this.content.classList.remove('opacity-0', 'translate-y-16');
        });
    },
    close() {
        this.modal.classList.add('opacity-0');
        this.content.classList.add('opacity-0', 'translate-y-16');
        
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.modal.classList.remove('flex');
            this.modal.setAttribute('inert', '');
            this.modal.setAttribute('aria-hidden', 'true');
        }, 300);
    },
    confirm() {
        localStorage.removeItem('theme_mode'); 
        localStorage.removeItem('theme_color');
        localStorage.removeItem('theme_bg_color'); 
        localStorage.removeItem('font_size');
        localStorage.removeItem('app_lang'); 
        localStorage.removeItem('app_show_ms');
        location.reload();
    }
};

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
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

        const view = navigation.activeView;
        
        if (e.code === 'Space') {
            e.preventDefault(); 
            if (view === 'stopwatch') sw.toggle();
            else if (view === 'timer') tm.toggle();
            else if (view === 'tabata') tb.toggle();
        } 
        else if (e.key.toLowerCase() === 'l' && view === 'stopwatch') {
            sw.recordLapOrReset();
        } 
        else if (e.key.toLowerCase() === 'r') {
            if (view === 'timer') tm.reset();
            else if (view === 'tabata') tb.stop();
        }
    });
});