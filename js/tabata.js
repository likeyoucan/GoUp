import { $, escapeHTML, showToast, formatTimeStr, adjustVal, updateText, updateTitle, requestWakeLock, releaseWakeLock } from './utils.js';
import { sm } from './sound.js';
import { t } from './i18n.js';

export const tb = {
    workouts: [], selectedId: null, work: 20, rest: 10, rounds: 8, currentRound: 1,
    status: 'STOPPED', phaseDuration: 0, phaseEndTime: 0, remainingAtPause: 0, rAF: null, lastRender: 0, paused: false, els: {},
    lastBeepSec: 0,
    
    init() {
        this.els = {
            listSection: $('tb-list-section'), runningControls: $('tb-runningControls'), modal: $('tb-modal'), list: $('tb-workoutsList'),
            startBtn: $('tb-startBtn'), stopBtn: $('tb-stopBtn'), ring: $('tb-progressRing'), status: $('tb-statusText'), timer: $('tb-mainTimer'),
            activeName: $('tb-activeName'), activeDetail: $('tb-activeDetail'), roundDisplay: $('tb-currentRound'), totalRoundsDisplay: $('tb-totalRounds'),
            editName: $('tb-edit-name'), editWork: $('tb-edit-work'), editRest: $('tb-edit-rest'), editRounds: $('tb-edit-rounds'),
            nameError: $('tb-name-error')
        };

        try {
            const stored = localStorage.getItem('tb_workouts');
            if (stored) {
                this.workouts = JSON.parse(stored);
                if (!Array.isArray(this.workouts) || this.workouts.length === 0) throw new Error("Invalid data");
            } else throw new Error("No data");
        } catch (e) {
            this.workouts = [{ id: 1, name: "Tabata 1", work: 20, rest: 10, rounds: 8 }];
            localStorage.setItem('tb_workouts', JSON.stringify(this.workouts));
        }
        
        this.selectWorkout(this.workouts[0].id); this.renderList();
        
        this.els.startBtn?.addEventListener('click', () => this.toggle()); 
        this.els.stopBtn?.addEventListener('click', () => this.stop());
        
        $('tb-openModalBtn')?.addEventListener('click', () => this.openModal());
        $('tb-closeModalBtn')?.addEventListener('click', () => this.closeModal());
        $('tb-saveModalBtn')?.addEventListener('click', () => this.saveWorkout());

        this.els.editName?.addEventListener('input', () => this.els.nameError?.classList.add('hidden'));

        document.querySelectorAll('[data-tb-adj]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const [id, delta] = e.currentTarget.getAttribute('data-tb-adj').split(',');
                adjustVal(id, parseInt(delta));
            });
        });

        this.els.list?.addEventListener('click', (e) => {
            const delBtn = e.target.closest('.tb-del-btn');
            const row = e.target.closest('.tb-workout-row');
            if (delBtn) {
                e.stopPropagation();
                this.deleteWorkout(Number(delBtn.dataset.id));
            } else if (row) {
                this.selectWorkout(Number(row.dataset.id));
            }
        });
        
        this.els.list?.addEventListener('keydown', (e) => {
            const row = e.target.closest('.tb-workout-row');
            if (e.key === 'Enter' && row) this.selectWorkout(Number(row.dataset.id));
        });
    },

    getUniqueName(baseName) {
        let name = baseName;
        let counter = 1;
        const exists = (n) => this.workouts.some(w => w.name.toLowerCase() === n.toLowerCase());
        while (exists(name)) { name = `${baseName} ${counter}`; counter++; }
        return name;
    },
    
    openModal() {
        this.els.nameError?.classList.add('hidden');
        this.els.modal.classList.remove('hidden'); 
        this.els.modal.classList.add('flex');
        this.els.modal.removeAttribute('inert'); 
        this.els.modal.removeAttribute('aria-hidden');
        
        requestAnimationFrame(() => {
            this.els.modal.classList.remove('opacity-0', 'translate-y-16');
        });

        this.els.editName.value = this.getUniqueName(t('tabata')); 
        this.els.editWork.value = 20; this.els.editRest.value = 10; this.els.editRounds.value = 8;
        setTimeout(() => this.els.editName.focus(), 100);
    },
    
    closeModal() {
        this.els.modal.classList.add('opacity-0', 'translate-y-16');
        setTimeout(() => {
            this.els.modal.classList.add('hidden'); 
            this.els.modal.classList.remove('flex');
            this.els.modal.setAttribute('inert', ''); 
            this.els.modal.setAttribute('aria-hidden', 'true'); 
        }, 300);
    },
    
    saveWorkout() {
        let finalName = this.els.editName.value.trim();
        if (!finalName) finalName = this.getUniqueName(t('tabata'));

        const exists = this.workouts.some(w => w.name.toLowerCase() === finalName.toLowerCase());
        if (exists) {
            this.els.nameError?.classList.remove('hidden');
            this.els.editName.classList.add('animate-shake');
            setTimeout(() => this.els.editName.classList.remove('animate-shake'), 300);
            return;
        }

        const w = Math.max(1, parseInt(this.els.editWork.value) || 20);
        const r = Math.max(1, parseInt(this.els.editRest.value) || 10);
        const rnd = Math.max(1, parseInt(this.els.editRounds.value) || 8);
        const newW = { id: Date.now(), name: finalName, work: w, rest: r, rounds: rnd };
        
        this.workouts.push(newW); localStorage.setItem('tb_workouts', JSON.stringify(this.workouts));
        this.renderList(); this.selectWorkout(newW.id); this.closeModal();
    },

    deleteWorkout(id) {
        if (this.status !== 'STOPPED') { showToast(t('active_timer')); return; }
        if (this.workouts.length <= 1) { showToast(t('cannot_delete')); return; }
        this.workouts = this.workouts.filter(w => w.id !== id); 
        localStorage.setItem('tb_workouts', JSON.stringify(this.workouts));
        if (this.selectedId === id) this.selectWorkout(this.workouts[0].id);
        this.renderList();
    },

    selectWorkout(id) {
        if (this.status !== 'STOPPED') return;
        const w = this.workouts.find(k => k.id === id); if (!w) return;
        this.selectedId = id; this.work = w.work * 1000; this.rest = w.rest * 1000; this.rounds = w.rounds;
        updateText(this.els.activeName, w.name); 
        updateText(this.els.activeDetail, `${w.work/1000}s / ${w.rest/1000}s • ${w.rounds} Rounds`);
        this.renderList();
    },

    renderList() {
        if (!this.els.list) return;
        this.els.list.innerHTML = "";
        const fragment = document.createDocumentFragment();

        this.workouts.forEach(w => {
            const div = document.createElement('div');
            const isAct = w.id === this.selectedId;
            div.tabIndex = 0; 
            div.className = `tb-workout-row p-4 rounded-xl flex justify-between items-center transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] ${isAct ? 'app-surface border-2 border-[var(--primary-color)]' : 'app-surface border border-transparent'}`;
            div.dataset.id = w.id;
            
            div.innerHTML = `<div><div class="font-bold app-text ${isAct ? 'primary-text' : ''}">${escapeHTML(w.name)}</div><div class="text-xs app-text-sec">${w.work}s/${w.rest}s • ${w.rounds} Rds</div></div>
                <button data-id="${w.id}" class="tb-del-btn text-red-500 opacity-50 hover:opacity-100 p-2 focus:outline-none focus-visible:underline">✕</button>`;
            
            fragment.appendChild(div);
        });
        this.els.list.appendChild(fragment);
    },
    
    toggle() { 
        sm.vibrate(50); sm.play('click');
        if (this.status === 'STOPPED') this.start(); 
        else if (this.paused) this.resume(); 
        else this.pause(); 
    },
    
    start() {
        this.currentRound = 1; this.status = "READY"; this.phaseDuration = 5000; 
        this.phaseEndTime = performance.now() + this.phaseDuration; this.paused = false;
        this.lastBeepSec = 0;
        this.els.listSection.classList.add('hidden'); this.els.runningControls.classList.replace('hidden', 'flex');
        updateText(this.els.totalRoundsDisplay, this.rounds); 
        this.els.status.classList.remove('hidden'); 
        this.els.timer.classList.remove('is-go');
        requestWakeLock();
        this.updatePhaseStyles(); this.tick();
    },
    
    pause() { 
        this.paused = true; cancelAnimationFrame(this.rAF); 
        this.remainingAtPause = this.phaseEndTime - performance.now(); 
        updateText(this.els.status, t('pause')); 
        releaseWakeLock();
        updateTitle('');
    },
    
    resume() { 
        this.paused = false; 
        this.phaseEndTime = performance.now() + this.remainingAtPause; 
        this.lastBeepSec = 0;
        requestWakeLock();
        this.tick(); this.updatePhaseStyles(); 
    },
    
    stop() {
        sm.vibrate(30); sm.play('click');
        cancelAnimationFrame(this.rAF); this.status = "STOPPED"; this.paused = false;
        releaseWakeLock();
        updateTitle('');
        this.els.listSection.classList.remove('hidden'); this.els.runningControls.classList.replace('flex', 'hidden');
        this.els.status.classList.add('hidden'); 
        updateText(this.els.timer, 'GO'); 
        this.els.timer.classList.add('is-go');
        this.els.ring.style.strokeDashoffset = 282.74;
    },
    
    tick() {
        if (this.status === 'STOPPED' || this.paused) return;
        const now = performance.now(), rem = this.phaseEndTime - now;
        if (rem <= 0) { this.nextPhase(); return; }
        if (now - this.lastRender >= 16) { this.render(rem); this.lastRender = now; }
        this.rAF = requestAnimationFrame(() => this.tick());
    },
    
    nextPhase() {
        sm.vibrate([100, 50, 100]); 
        this.lastBeepSec = 0;

        if (this.status === "READY") { 
            this.status = "WORK"; this.phaseDuration = this.work; sm.play('start'); 
        } 
        else if (this.status === "WORK") { 
            this.status = "REST"; this.phaseDuration = this.rest; sm.play('rest'); 
        } 
        else if (this.status === "REST") {
            if (this.currentRound >= this.rounds) { 
                sm.vibrate([200, 100, 200, 100, 400]); 
                sm.play('complete');
                requestAnimationFrame(() => { showToast(t('tabata_complete')); this.stop(); }); 
                return; 
            }
            this.currentRound++; this.status = "WORK"; this.phaseDuration = this.work;
            sm.play('start');
        }
        this.phaseEndTime = performance.now() + this.phaseDuration; this.updatePhaseStyles(); this.tick();
    },
    
    updatePhaseStyles() {
        updateText(this.els.roundDisplay, this.currentRound); 
        this.els.ring.classList.remove('primary-stroke', 'text-blue-500', 'text-gray-500'); this.els.ring.style.stroke = "";
        
        if (this.status === "WORK") { 
            updateText(this.els.status, t('work')); 
            this.els.status.className = "text-xl font-bold uppercase tracking-widest mb-1 primary-text"; 
            this.els.ring.classList.add('primary-stroke'); 
        } else if (this.status === "REST") { 
            updateText(this.els.status, t('rest')); 
            this.els.status.className = "text-xl font-bold uppercase tracking-widest mb-1 text-blue-500"; 
            this.els.ring.style.stroke = "#3b82f6"; 
        } else { 
            updateText(this.els.status, t('get_ready')); 
            this.els.status.className = "text-xl font-bold uppercase tracking-widest mb-1 app-text-sec"; 
            this.els.ring.classList.add('primary-stroke'); 
        }
    },
    
    render(rem) {
        const sTotal = Math.max(0, Math.ceil(rem / 1000));
        
        if (sTotal <= 3 && sTotal > 0 && this.lastBeepSec !== sTotal) {
            sm.play('tick');
            this.lastBeepSec = sTotal;
        }

        const timeStr = formatTimeStr(sTotal, false);
        updateText(this.els.timer, timeStr);
        updateTitle(`${this.status}: ${timeStr}`);
        this.els.ring.style.strokeDashoffset = 282.74 - ((Math.max(0, this.phaseDuration - rem) / this.phaseDuration) * 282.74);
    }
};