export const $ = (id) => document.getElementById(id);

export const escapeHTML = (str) => str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));

// Оптимизация DOM: Обновляем textContent только если текст реально изменился
export const updateText = (el, text) => {
    if (el && el.textContent !== String(text)) el.textContent = text;
};

// Динамический заголовок вкладки
export const updateTitle = (text) => {
    document.title = text ? `${text} - Stopwatch Pro` : 'Stopwatch Pro';
};

// Виброотклик (работает только на мобильных)
export const vibrate = (ms = 50) => {
    if (navigator.vibrate) navigator.vibrate(ms);
};

// Wake Lock API (Удержание экрана включенным)
let wakeLock = null;
export const requestWakeLock = async () => {
    if ('wakeLock' in navigator && !wakeLock) {
        try { wakeLock = await navigator.wakeLock.request('screen'); } 
        catch (err) { console.warn('Wake Lock error:', err); }
    }
};
export const releaseWakeLock = () => {
    if (wakeLock !== null) {
        wakeLock.release().then(() => { wakeLock = null; });
    }
};
// Восстановление Wake Lock при возврате на вкладку
document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        wakeLock = await navigator.wakeLock.request('screen');
    }
});

let toastTimeout = null;
export const showToast = (message) => {
    const toast = $('toast');
    $('toast-msg').textContent = message;
    toast.classList.remove('opacity-0', '-translate-y-4');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.add('opacity-0', '-translate-y-4');
    }, 3000);
};

export const adjustVal = (id, delta) => {
    const el = $(id);
    if (el) el.value = Math.max(1, (parseInt(el.value) || 0) + delta);
};

export const pad = (num) => String(num).padStart(2, '0');

export const formatTimeStr = (totalSeconds, showHoursIfZero = false) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    if (h > 0 || showHoursIfZero) return `${pad(h)}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
};

export const formatMsTime = (ms, showMs = true) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const milli = Math.floor((ms % 1000) / 10);
    let str = `${pad(m)}:${pad(s)}`;
    if (showMs) str += `.${pad(milli)}`;
    return str;
};