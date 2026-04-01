import { langManager } from './i18n.js';
import { themeManager } from './theme.js';
import { navigation } from './navigation.js';
import { adjustVal } from './utils.js';
import { sw } from './stopwatch.js';
import { tm } from './timer.js';
import { tb } from './tabata.js';

window.switchView = (id) => navigation.switchView(id);
window.themeManager = themeManager;
window.tb = tb;
window.adjustVal = adjustVal;

window.resetSettings = () => {
    const msg = langManager.current === 'ru' 
        ? "Сбросить настройки? (Ваши тренировки сохранятся)" 
        : "Reset settings? (Your workouts will be saved)";
        
    if (confirm(msg)) {
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
    langManager.init();
    themeManager.init();
    navigation.init();
    sw.init();
    tm.init();
    tb.init();
});