export const $ = (id) => document.getElementById(id);

export const escapeHTML = (str) => str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));

let toastTimeout = null;

export const showToast = (message) => {
    const toast = $('toast');
    $('toast-msg').textContent = message;
    toast.classList.remove('opacity-0', 'translate-y-[-20px]');
    
    if (toastTimeout) clearTimeout(toastTimeout);
    
    toastTimeout = setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-[-20px]');
    }, 3000);
};

export const adjustVal = (id, delta) => {
    const el = $(id);
    el.value = Math.max(1, (parseInt(el.value) || 0) + delta);
};