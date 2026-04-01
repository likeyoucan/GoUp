import { $, escapeHTML, showToast } from './utils.js';
import { t } from './i18n.js';

export const tb = {
    workouts: [], selectedId: null, work: 20, rest: 10, rounds: 8, currentRound: 1,
    status: 'STOPPED', phaseDuration: 0, phaseEndTime: 0, remainingAtPause: 0, rAF: null, lastRender: 0, paused: false, els: {},
    
    init() {
        this.els = {
            listSection: $('tb-list-section'), runningControls: $('tb-runningControls'), modal: $('tb-modal'), list: $('tb-workoutsList'),
            startBtn: $('tb-startBtn'), stopBtn: $('tb-stopBtn'), ring: $('tb-progressRing'), status: $('tb-statusText'), timer: $('tb-mainTimer'),
            activeName: $('tb-activeName'), activeDetail: $('tb-activeDetail'), roundDisplay: $('tb-currentRound'), totalRoundsDisplay: $('tb-totalRounds'),
            editName: $('tb-edit-name'), editWork: $('tb-edit-work'), editRest: $('tb-edit-rest'), editRounds: $('tb-edit-rounds'),
        };
        const stored = localStorage.getItem('tb_workouts');
        if (stored) this.workouts = JSON.parse(stored);
        else { this.workouts = [{ id: 1, name: "Standard Tabata", work: 20, rest: 10, rounds: 8 }]; localStorage.setItem('tb_workouts', JSON.stringify(this.workouts)); }
        this.selectWorkout(this.workouts[0].id); this.renderList();
        this.els.startBtn.addEventListener('click', () => this.toggle()); this.els.stopBtn.addEventListener('click', () => this.stop());
    },
    
    openModal() {
        this.els.modal.classList.remove('hidden'); 
        this.els.modal.removeAttribute('inert'); 
        this.els.modal.removeAttribute('aria-hidden');
        
        void this.els.modal.offsetWidth;
        
        this.els.modal.classList.remove('opacity-0', 'translate-y-12');
        this.els.modal.classList.add('opacity-100', 'translate-y-0');

        this.els.editName.value = ""; 
        this.els.editWork.value = 20; 
        this.els.editRest.value = 10; 
        this.els.editRounds.value = 8;
        setTimeout(() => this.els.editName.focus(), 100);
    },
    
    closeModal() {
        this.els.modal.classList.remove('opacity-100', 'translate-y-0');
        this.els.modal.classList.add('opacity-0', 'translate-y-12');
        
        setTimeout(() => {
            this.els.modal.classList.add('hidden'); 
            this.els.modal.setAttribute('inert', ''); 
            this.els.modal.setAttribute('aria-hidden', 'true'); 
        }, 500);
    },
    
    saveWorkout() {
        const w = Math.max(1, parseInt(this.els.editWork.value) || 20), r = Math.max(1, parseInt(this.els.editRest.value) || 10), rnd = Math.max(1, parseInt(this.els.editRounds.value) || 8);
        const newW = { id: Date.now(), name: this.els.editName.value.trim() || "Tabata", work: w, rest: r, rounds: rnd };
        this.workouts.push(newW); localStorage.setItem('tb_workouts', JSON.stringify(this.workouts));
        this.renderList(); this.selectWorkout(newW.id); this.closeModal();
    },
    deleteWorkout(id) {
        if (this.status !== 'STOPPED') { showToast(t('active_timer')); return; }
        if (this.workouts.length <= 1) { showToast(t('cannot_delete')); return; }
        this.workouts = this.workouts.filter(w => w.id !== id); localStorage.setItem('tb_workouts', JSON.stringify(this.workouts));
        if (this.selectedId === id) this.selectWorkout(this.workouts[0].id);
        this.renderList();
    },
    selectWorkout(id) {
        if (this.status !== 'STOPPED') return;
        const w = this.workouts.find(k => k.id === id); if (!w) return;
        this.selectedId = id; this.work = w.work * 1000; this.rest = w.rest * 1000; this.rounds = w.rounds;
        this.els.activeName.textContent = w.name; this.els.activeDetail.textContent = `${w.work/1000}s / ${w.rest/1000}s • ${w.rounds} Rounds`;
        this.renderList();
    },
    renderList() {
        this.els.list.innerHTML = "";
        this.workouts.forEach(w => {
            const div = document.createElement('div'), isAct = w.id === this.selectedId;
            div.tabIndex = 0; div.className = `p-4 rounded-xl flex justify-between items-center transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] ${isAct ? 'app-surface border-2 border-[var(--primary-color)]' : 'app-surface border border-transparent'}`;
            div.onclick = () => this.selectWorkout(w.id); div.onkeydown = (e) => { if (e.key === 'Enter') this.selectWorkout(w.id); };
            div.innerHTML = `<div><div class="font-bold app-text ${isAct ? 'primary-text' : ''}">${escapeHTML(w.name)}</div><div class="text-xs app-text-sec">${w.work}s/${w.rest}s • ${w.rounds} Rds</div></div>
                <button class="text-red-500 opacity-50 hover:opacity-100 p-2 focus:outline-none focus-visible:underline" onclick="(function(e){ e.stopPropagation(); tb.deleteWorkout(${w.id}); })(event)">✕</button>`;
            this.els.list.appendChild(div);
        });
    },
    
    toggle() { if (this.status === 'STOPPED') this.start(); else if (this.paused) this.resume(); else this.pause(); },
    start() {
        this.currentRound = 1; this.status = "READY"; this.phaseDuration = 5000; this.phaseEndTime = Date.now() + this.phaseDuration; this.paused = false;
        this.els.listSection.classList.add('hidden'); this.els.runningControls.classList.replace('hidden', 'flex');
        this.els.totalRoundsDisplay.textContent = this.rounds; this.els.status.classList.remove('hidden'); 
        this.els.timer.classList.remove('is-go');
        this.updatePhaseStyles(); this.tick();
    },
    pause() { this.paused = true; cancelAnimationFrame(this.rAF); this.remainingAtPause = this.phaseEndTime - Date.now(); this.els.status.textContent = t('pause'); },
    resume() { this.paused = false; this.phaseEndTime = Date.now() + this.remainingAtPause; this.tick(); this.updatePhaseStyles(); },
    stop() {
        cancelAnimationFrame(this.rAF); this.status = "STOPPED"; this.paused = false;
        this.els.listSection.classList.remove('hidden'); this.els.runningControls.classList.replace('flex', 'hidden');
        this.els.status.classList.add('hidden'); 
        this.els.timer.textContent = "GO"; this.els.timer.classList.add('is-go');
        this.els.ring.style.strokeDashoffset = 282.74;
    },
    
    tick() {
        if (this.status === 'STOPPED' || this.paused) return;
        const now = Date.now(), rem = this.phaseEndTime - now;
        if (rem <= 0) { this.nextPhase(); return; }
        if (now - this.lastRender >= 16) { this.render(rem); this.lastRender = now; }
        this.rAF = requestAnimationFrame(() => this.tick());
    },
    
    nextPhase() {
        if (this.status === "READY") { this.status = "WORK"; this.phaseDuration = this.work; } 
        else if (this.status === "WORK") { this.status = "REST"; this.phaseDuration = this.rest; } 
        else if (this.status === "REST") {
            if (this.currentRound >= this.rounds) { requestAnimationFrame(() => { showToast(t('tabata_complete')); this.stop(); }); return; }
            this.currentRound++; this.status = "WORK"; this.phaseDuration = this.work;
        }
        this.phaseEndTime = Date.now() + this.phaseDuration; this.updatePhaseStyles(); this.tick();
    },
    
    updatePhaseStyles() {
        this.els.roundDisplay.textContent = this.currentRound; this.els.ring.classList.remove('primary-stroke', 'text-blue-500', 'text-gray-500'); this.els.ring.style.stroke = "";
        if (this.status === "WORK") { this.els.status.textContent = t('work'); this.els.status.className = "text-xl font-bold uppercase tracking-widest mb-1 primary-text"; this.els.ring.classList.add('primary-stroke'); } 
        else if (this.status === "REST") { this.els.status.textContent = t('rest'); this.els.status.className = "text-xl font-bold uppercase tracking-widest mb-1 text-blue-500"; this.els.ring.style.stroke = "#3b82f6"; } 
        else { this.els.status.textContent = t('get_ready'); this.els.status.className = "text-xl font-bold uppercase tracking-widest mb-1 app-text-sec"; this.els.ring.classList.add('primary-stroke'); }
    },
    
    render(rem) {
        const sTotal = Math.max(0, Math.ceil(rem / 1000)), min = Math.floor(sTotal / 60), sec = sTotal % 60;
        this.els.timer.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
        this.els.ring.style.strokeDashoffset = 282.74 - ((Math.max(0, this.phaseDuration - rem) / this.phaseDuration) * 282.74);
    }
};