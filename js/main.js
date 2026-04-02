import { $ } from './utils.js';
import { langManager } from './i18n.js';
import { themeManager } from './theme.js';
import { navigation } from './navigation.js';
import { sw } from './stopwatch.js';
import { tm } from './timer.js';
import { tb } from './tabata.js';
import { sm } from './sound.js';

const resetModal = {
    modal: $('reset-modal'),
    content: $('reset-modal-content'),
    
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
        // Безопасная очистка: удаляем только ключи НАШЕГО приложения
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('app_') || key.startsWith('sw_') || key.startsWith('tb_') || key.startsWith('theme_') || key.startsWith('font_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        location.reload();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    sm.init();
    sw.init(); tm.init(); tb.init(); navigation.init();
    themeManager.init(); langManager.init();

    document.querySelectorAll('[data-nav]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const viewId = e.currentTarget.getAttribute('data-nav');
            navigation.switchView(viewId);
        });
    });

    $('btn-open-reset')?.addEventListener('click', () => resetModal.open());
    $('reset-cancel')?.addEventListener('click', () => resetModal.close());
    $('reset-confirm')?.addEventListener('click', () => resetModal.confirm());

    // Глобальные горячие клавиши
    document.addEventListener('keydown', (e) => {
        // Добавлен 'BUTTON', чтобы пробел не вызывал двойной клик на сфокусированных кнопках
        if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(e.target.tagName)) return;

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