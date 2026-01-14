let projects = JSON.parse(localStorage.getItem('unikama_projects')) || [];
let currentFilter = 'all';
let selectedId = null;

// Registrasi Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(() => console.log("SW Aktif"));
}

window.onload = () => {
    if (Notification.permission !== 'granted') Notification.requestPermission();
    renderProjects();
};

// --- PERBAIKAN VALIDASI WAKTU (ALARM MIN = NOW) ---
function setMinAlarm() {
    const now = new Date();
    const deadlineInput = document.getElementById('deadline').value;
    const alarmInput = document.getElementById('alarmTime');

    if (deadlineInput) {
        const dlDate = new Date(deadlineInput);
        
        // Format YYYY-MM-DDTHH:MM untuk input datetime-local
        const formatLocal = (date) => {
            const z = n => (n < 10 ? '0' : '') + n;
            return date.getFullYear() + '-' + z(date.getMonth() + 1) + '-' +
                   z(date.getDate()) + 'T' + z(date.getHours()) + ':' + z(date.getMinutes());
        };

        // Alarm minimal adalah saat ini (NOW)
        alarmInput.min = formatLocal(now);
        // Alarm maksimal adalah deadline minus 5 menit
        const maxAlarm = new Date(dlDate.getTime() - 5 * 60000);
        alarmInput.max = formatLocal(maxAlarm);
        
        // Jika isi alarm sebelumnya melanggar aturan, reset
        alarmInput.value = formatLocal(now); 
    }
}

// --- PERBAIKAN BUG EDIT (FUNGSI TERSEDIA SEKARANG) ---
function prepareEdit() {
    const p = projects.find(x => x.id === selectedId);
    if (!p) return;

    document.getElementById('mkName').value = p.mk;
    document.getElementById('taskName').value = p.task;
    document.getElementById('deadline').value = p.dl;
    document.getElementById('alarmTime').value = p.al;
    document.getElementById('progress').value = p.prog;
    document.getElementById('activity').value = p.note || "";

    closeModal('actionModal');
    document.getElementById('formModal').style.display = 'flex';
}

function saveProject() {
    const dl = document.getElementById('deadline').value;
    const al = document.getElementById('alarmTime').value;
    const now = new Date().getTime();

    // Validasi Akhir sebelum simpan
    if (new Date(al).getTime() < now) {
        showMsg("Gagal", "Waktu alarm sudah lewat!");
        return;
    }

    const data = {
        mk: document.getElementById('mkName').value,
        task: document.getElementById('taskName').value,
        dl: dl,
        al: al,
        prog: document.getElementById('progress').value,
        note: document.getElementById('activity').value,
        id: selectedId || Date.now(),
        status: 'active',
        alarmFired: false
    };

    if (selectedId) {
        const idx = projects.findIndex(p => p.id === selectedId);
        projects[idx] = data;
    } else {
        projects.push(data);
    }

    localStorage.setItem('unikama_projects', JSON.stringify(projects));
    closeModal('formModal');
    renderProjects();
    selectedId = null;
}

// Logika Alarm (Interval 10 detik)
setInterval(() => {
    const now = new Date().getTime();
    projects.forEach(p => {
        if (p.status === 'active' && !p.alarmFired) {
            if (now >= new Date(p.al).getTime()) {
                p.alarmFired = true;
                localStorage.setItem('unikama_projects', JSON.stringify(projects));
                triggerNotification(p);
            }
        }
    });
}, 10000);

function triggerNotification(p) {
    const sound = document.getElementById('alarmSound');
    sound.play().catch(() => console.log("User interaction required for audio"));

    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(reg => {
            reg.showNotification("⏰ Tugas: " + p.task, {
                body: "Matkul: " + p.mk + "\nSegera selesaikan!",
                icon: "https://via.placeholder.com/128",
                vibrate: [200, 100, 200],
                requireInteraction: true
            });
        });
    }
    showMsg("Alarm!", p.task + " harus segera dikerjakan.");
}

// --- Fungsi UI Pendukung ---
function renderProjects() {
    const list = document.getElementById('projectList');
    list.innerHTML = "";
    projects.filter(p => p.status === 'active').forEach(p => {
        list.innerHTML += `
            <div class="project-card" onclick="openActionMenu(${p.id})">
                <strong>${p.task}</strong>
                <div class="progress-container"><div class="progress-bar" style="width:${p.prog}%">${p.prog}%</div></div>
                <div style="font-size:11px; color:red">Deadline: ${new Date(p.dl).toLocaleString()}</div>
            </div>`;
    });
}

function openActionMenu(id) {
    selectedId = id;
    const p = projects.find(x => x.id === id);
    document.getElementById('actionTargetName').innerText = p.task;
    document.getElementById('actionModal').style.display = 'flex';
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function openAddModal() { selectedId = null; document.getElementById('projectForm').reset(); setMinAlarm(); document.getElementById('formModal').style.display = 'flex'; }
function markAsDone() { /* Logika status completed */ }
function openConfirmDelete() { closeModal('actionModal'); document.getElementById('deleteModal').style.display = 'flex'; }
function executeDelete() { projects = projects.filter(p => p.id !== selectedId); localStorage.setItem('unikama_projects', JSON.stringify(projects)); closeModal('deleteModal'); renderProjects(); }
function showMsg(t, b) { document.getElementById('msgTitle').innerText = t; document.getElementById('msgBody').innerText = b; document.getElementById('msgModal').style.display = 'flex'; }
