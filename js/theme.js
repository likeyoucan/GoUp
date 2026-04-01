import { $ } from './utils.js';

export const themeManager = {
    currentMode: 'system', currentBg: 'default', showMs: true,
    init() {
        this.setMode(localStorage.getItem('theme_mode') || 'system');
        this.setColor(localStorage.getItem('theme_color') || '#22c55e');
        this.setBgColor(localStorage.getItem('theme_bg_color') || 'default');
        
        this.setFontSize(localStorage.getItem('font_size') || 16); 

        this.showMs = localStorage.getItem('app_show_ms') !== 'false';
        const toggle = $('toggle-ms');
        if (toggle) {
            toggle.checked = this.showMs;
            toggle.addEventListener('change', (e) => {
                this.showMs = e.target.checked;
                localStorage.setItem('app_show_ms', this.showMs);
                if (window.sw && !window.sw.isRunning) window.sw.updateDisplay();
            });
        }

        $('fontSlider').addEventListener('input', (e) => this.setFontSize(e.target.value));
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (this.currentMode === 'system') this.setMode('system');
        });
    },
    setMode(mode) {
        this.currentMode = mode; localStorage.setItem('theme_mode', mode);
        document.querySelectorAll('[id^="theme-"]').forEach(b => { b.classList.remove('app-surface', 'shadow-sm', 'app-text'); b.classList.add('app-text-sec'); });
        const activeBtn = $(`theme-${mode}`);
        if(activeBtn) activeBtn.classList.add('app-surface', 'shadow-sm', 'app-text');
        const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
        this.applyBgTheme(this.currentBg, isDark);
    },
    setColor(hex) {
        localStorage.setItem('theme_color', hex); document.documentElement.style.setProperty('--primary-color', hex);
        this.updateButtons('.color-btn', hex, 'customColorBtn');
    },
    setBgColor(hex) {
        this.currentBg = hex; localStorage.setItem('theme_bg_color', hex);
        const isDark = document.documentElement.classList.contains('dark');
        this.applyBgTheme(hex, isDark);
        this.updateButtons('.bg-btn', hex, 'customBgBtn', true);
    },
    updateButtons(selector, hex, customId, isBg = false) {
        let found = false;
        document.querySelectorAll(selector).forEach(b => {
            b.classList.remove('ring-2', 'ring-offset-2', 'ring-offset-white', 'dark:ring-offset-gray-900', 'border-gray-500', 'border-transparent');
            const targetAttr = isBg ? b.getAttribute('data-bg') : b.getAttribute('data-color');
            if (targetAttr === hex) {
                b.classList.add('ring-2', 'ring-offset-2', 'ring-offset-white', 'dark:ring-offset-gray-900');
                const iconColor = (isBg && hex === 'default') ? 'var(--text-color)' : 'white';
                b.innerHTML = `<svg class="w-5 h-5" style="color: ${iconColor};" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>`;
                found = true;
            } else { b.classList.add('border-transparent'); b.innerHTML = ''; }
        });
        const picker = $(customId);
        picker.classList.remove('ring-2', 'ring-offset-2', 'ring-offset-white', 'dark:ring-offset-gray-900', 'border-white');
        if (!found && hex !== 'default') {
            picker.classList.add('ring-2', 'ring-offset-2', 'ring-offset-white', 'dark:ring-offset-gray-900');
            picker.classList.replace('border-transparent', 'border-white');
        } else { picker.classList.replace('border-white', 'border-transparent'); }
    },
    applyBgTheme(hex, isDark) {
        const root = document.documentElement;
        if (hex === 'default') { root.style.removeProperty('--bg-color'); root.style.removeProperty('--surface-color'); return; }
        const { h, s, l } = this.hexToHSL(hex);
        if (isDark) { root.style.setProperty('--bg-color', `hsl(${h}, ${Math.min(s, 40)}%, 8%)`); root.style.setProperty('--surface-color', `hsl(${h}, ${Math.min(s, 40)}%, 14%)`);
        } else { root.style.setProperty('--bg-color', `hsl(${h}, ${Math.max(s, 20)}%, 94%)`); root.style.setProperty('--surface-color', `hsl(${h}, ${Math.max(s, 20)}%, 98%)`); }
    },
    hexToHSL(H) {
        let r = 0, g = 0, b = 0;
        if (H.length == 4) { r = "0x" + H[1] + H[1]; g = "0x" + H[2] + H[2]; b = "0x" + H[3] + H[3]; }
        else if (H.length == 7) { r = "0x" + H[1] + H[2]; g = "0x" + H[3] + H[4]; b = "0x" + H[5] + H[6]; }
        r /= 255; g /= 255; b /= 255;
        let cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin;
        let h = 0, s = 0, l = (cmax + cmin) / 2;
        if (delta != 0) {
            if (cmax == r) h = ((g - b) / delta) % 6; else if (cmax == g) h = (b - r) / delta + 2; else h = (r - g) / delta + 4;
            s = delta / (1 - Math.abs(2 * l - 1));
        }
        h = Math.round(h * 60); if (h < 0) h += 360;
        return { h, s: +(s * 100).toFixed(1), l: +(l * 100).toFixed(1) };
    },
    setFontSize(size) {
        const scale = size / 16;
        document.documentElement.style.setProperty('--font-scale', scale);
        $('fontSizeDisplay').textContent = size + ' px'; 
        $('fontSlider').value = size; 
        localStorage.setItem('font_size', size);
    }
};