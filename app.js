let projects = JSON.parse(localStorage.getItem('unikama_projects')) || [];
let currentFilter = 0; 
let selectedId = null;
let deferredPrompt;

const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'block';
});
installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA install');
    } else {
        console.log('User dismissed PWA install');
    }
    deferredPrompt = null;
    installBtn.style.display = 'none';
});
window.addEventListener('appinstalled', () => {
    installBtn.style.display = 'none';
    console.log('PWA was installed');
});
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
    .then(() => console.log("Service Worker terdaftar!"))
    .catch(err => console.error("Gagal daftar SW", err));
}
window.onload = () => {
    Notification.requestPermission();
    renderProjects();
};
function setMinAlarm() {
    const now = new Date();
    const dl = new Date(document.getElementById('deadline').value);
    const alarmInput = document.getElementById('alarmTime');

    if (!dl) return;

    const minTime = now;
    const maxTime = new Date(dl.getTime() - 5 * 60000);

    alarmInput.min = toLocal(minTime);
    alarmInput.max = toLocal(maxTime);
}
function toLocal(date) {
    return date.toISOString().slice(0,16);
}
function saveProject() {
    const dl = document.getElementById('deadline').value;
    const al = document.getElementById('alarmTime').value;

    if (new Date(al).getTime() > (new Date(dl).getTime() - 300000)) {
        showMsg("Waktu Alarm Salah", "Alarm minimal harus 5 menit sebelum deadline!");
        return;
    }

    const data = {
        mk: document.getElementById('mkName').value,
        task: document.getElementById('taskName').value,
        dl: dl,
        al: al,
        prog: document.getElementById('progress').value,
        note: document.getElementById('activity').value,
        sem: "Ganjil 2025/2026"
    };
    if (selectedId) {
        const idx = projects.findIndex(p => p.id === selectedId);
        projects[idx] = { ...projects[idx], ...data, alarmFired: false };
    } else {
        projects.push({ ...data, id: Date.now(), status: 'active', alarmFired: false });
    }
    localStorage.setItem('unikama_projects', JSON.stringify(projects));
    closeModal('formModal');
    renderProjects();
}
function triggerAlarm(p) {
    const sound = document.getElementById('alarmSound');
    sound.play().catch(() => {});
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification("⏰ Waktunya Mengerjakan!", {
                body: `Tugas: ${p.task}\nMatkul: ${p.mk}`,
                icon: 'https://via.placeholder.com/128',
                vibrate: [200, 100, 200],
                tag: p.id,
                requireInteraction: true
            });
        });
    }
    showMsg("⏰ Waktunya!", `Tugas: ${p.task}\nSegera selesaikan sebelum deadline!`);
}
setInterval(() => {
    const now = new Date().getTime();
    projects.forEach(p => {
        if (p.status === 'active' && !p.alarmFired) {
            if (now >= new Date(p.al).getTime()) {
                p.alarmFired = true;
                localStorage.setItem('unikama_projects', JSON.stringify(projects));
                triggerAlarm(p);
            }
        }
    });
}, 10000);
function renderProjects() {
    const list = document.getElementById('projectList');
    const search = document.getElementById('searchInput').value.toLowerCase();
    list.innerHTML = "";
    const now = new Date();
    const filtered = projects.filter(p => {
        if (p.status === 'completed') return false;
        const matchesSearch = p.mk.toLowerCase().includes(search) || p.task.toLowerCase().includes(search);
        if (currentFilter === 'all') return matchesSearch;
        const diffDays = Math.ceil((new Date(p.dl) - now) / (1000 * 60 * 60 * 24));
        if (currentFilter === 0) return diffDays <= 0 && matchesSearch;
        return diffDays <= currentFilter && matchesSearch;
    });

    filtered.forEach(p => {
        list.innerHTML += `
            <div class="project-card" onclick="openActionMenu(${p.id})">
                <div class="card-header">
                    <span style="font-size:10px; color:var(--primary); font-weight:bold;">Tugas SI</span>
                    <div class="alarm-info">🔔 ${new Date(p.al).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
                <strong>${p.task}</strong>
                <div class="progress-container"><div class="progress-bar" style="width: ${p.prog}%">${p.prog}%</div></div>
                <div style="font-size:11px; color:var(--danger)">Deadline: ${new Date(p.dl).toLocaleString('id-ID')}</div>
            </div>`;
    });
}

function showMsg(title, body) {
    document.getElementById('msgTitle').innerText = title;
    document.getElementById('msgBody').innerText = body;
    document.getElementById('msgModal').style.display = 'flex';
}
function prepareEdit() {
    const p = projects.find(x => x.id === selectedId);
    if (!p) return;

    document.getElementById('mkName').value = p.mk;
    document.getElementById('taskName').value = p.task;
    document.getElementById('deadline').value = p.dl;
    document.getElementById('alarmTime').value = p.al;
    document.getElementById('progress').value = p.prog;
    document.getElementById('activity').value = p.note;

    closeModal('actionModal');
    document.getElementById('formModal').style.display = 'flex';
}
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function openAddModal() { selectedId = null; document.getElementById('projectForm').reset(); document.getElementById('formModal').style.display = 'flex'; }
function openActionMenu(id) { selectedId = id; const p = projects.find(x => x.id === id); document.getElementById('actionTargetName').innerText = p.task; document.getElementById('actionModal').style.display = 'flex'; }
function markAsDone() { const idx = projects.findIndex(p => p.id === selectedId); projects[idx].status = 'completed'; localStorage.setItem('unikama_projects', JSON.stringify(projects)); closeModal('actionModal'); renderProjects(); }
function executeDelete() { projects = projects.filter(p => p.id !== selectedId); localStorage.setItem('unikama_projects', JSON.stringify(projects)); closeModal('deleteModal'); renderProjects(); }
function openConfirmDelete() { closeModal('actionModal'); document.getElementById('deleteModal').style.display = 'flex'; }
function setFilter(val, btn) { currentFilter = val; document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderProjects(); }
