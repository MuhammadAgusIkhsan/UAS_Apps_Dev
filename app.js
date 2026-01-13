// ==========================================
// 1. INISIALISASI VARIABEL & DATA
// ==========================================
let projects = JSON.parse(localStorage.getItem('unikama_projects')) || [];
let currentFilter = 0; 
let selectedId = null;
let deferredPrompt; // Untuk menyimpan event instalasi PWA

const installBtn = document.getElementById('installBtn');
const alarmSound = document.getElementById('alarmSound');

// ==========================================
// 2. REGISTRASI SERVICE WORKER
// ==========================================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
    .then(() => console.log("Service Worker: Terdaftar & Aktif"))
    .catch(err => console.error("Service Worker: Gagal", err));
}

// ==========================================
// 3. LOGIKA INSTALASI APLIKASI (PWA)
// ==========================================
window.addEventListener('beforeinstallprompt', (e) => {
    // Mencegah munculnya prompt otomatis dari browser
    e.preventDefault();
    // Simpan event agar bisa dipicu melalui tombol kita
    deferredPrompt = e;
    // Tampilkan tombol instal di UI
    if (installBtn) installBtn.style.display = 'block';
});

if (installBtn) {
    installBtn.addEventListener('click', () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User menginstal aplikasi');
                }
                installBtn.style.display = 'none';
                deferredPrompt = null;
            });
        }
    });
}

// ==========================================
// 4. MANAJEMEN ALARM & NOTIFIKASI
// ==========================================
window.onload = () => {
    // Meminta izin notifikasi saat pertama kali dibuka
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
    renderProjects();
};

function triggerAlarm(p) {
    // 1. Bunyikan Suara
    alarmSound.play().catch(e => console.log("Autoplay diblokir, butuh klik user"));

    // 2. Munculkan Notifikasi Sistem (Push)
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(reg => {
            reg.showNotification("⏰ DEADLINE DEKAT!", {
                body: `Tugas: ${p.task}\nMatkul: ${p.mk}\nKlik untuk buka aplikasi!`,
                icon: 'https://via.placeholder.com/192', // Ganti dengan path ikon aslimu
                badge: 'https://via.placeholder.com/192',
                vibrate: [200, 100, 200, 100, 200],
                tag: p.id,
                requireInteraction: true // Notifikasi menetap sampai diklik/ditutup
            });
        });
    }

    // 3. Munculkan Pesan di Dalam Aplikasi
    showMsg("⏰ Waktunya!", `Tugas: ${p.task}\nSegera selesaikan sebelum deadline!`);
}

// Cek waktu setiap 10 detik
setInterval(() => {
    const now = new Date().getTime();
    projects.forEach(p => {
        if (p.status === 'active' && !p.alarmFired) {
            const alarmTime = new Date(p.al).getTime();
            if (now >= alarmTime) {
                p.alarmFired = true;
                updateStorage();
                triggerAlarm(p);
            }
        }
    });
}, 10000);

// ==========================================
// 5. FUNGSI CRUD & UI
// ==========================================
function setMinAlarm() {
    const dlInput = document.getElementById('deadline').value;
    if(dlInput) {
        const dlDate = new Date(dlInput);
        const maxAlarmDate = new Date(dlDate.getTime() - (5 * 60000));
        
        const year = maxAlarmDate.getFullYear();
        const month = String(maxAlarmDate.getMonth() + 1).padStart(2, '0');
        const day = String(maxAlarmDate.getDate()).padStart(2, '0');
        const hours = String(maxAlarmDate.getHours()).padStart(2, '0');
        const mins = String(maxAlarmDate.getMinutes()).padStart(2, '0');
        
        document.getElementById('alarmTime').max = `${year}-${month}-${day}T${hours}:${mins}`;
    }
}

function saveProject() {
    const dl = document.getElementById('deadline').value;
    const al = document.getElementById('alarmTime').value;

    if (new Date(al).getTime() > (new Date(dl).getTime() - 300000)) {
        showMsg("Gagal", "Alarm minimal harus 5 menit sebelum deadline!");
        return;
    }

    const data = {
        mk: document.getElementById('mkName').value,
        task: document.getElementById('taskName').value,
        dl: dl,
        al: al,
        prog: document.getElementById('progress').value,
        note: document.getElementById('activity').value
    };

    if (selectedId) {
        const idx = projects.findIndex(p => p.id === selectedId);
        projects[idx] = { ...projects[idx], ...data, alarmFired: false };
    } else {
        projects.push({ ...data, id: Date.now(), status: 'active', alarmFired: false });
    }

    updateStorage();
    closeModal('formModal');
    renderProjects();
}

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
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${p.prog}%">${p.prog}%</div>
                </div>
                <div style="font-size:11px; color:var(--danger)">Deadline: ${new Date(p.dl).toLocaleString('id-ID')}</div>
            </div>`;
    });
}

// Fungsi Bantu
function updateStorage() { localStorage.setItem('unikama_projects', JSON.stringify(projects)); }
function showMsg(title, body) { 
    document.getElementById('msgTitle').innerText = title; 
    document.getElementById('msgBody').innerText = body; 
    document.getElementById('msgModal').style.display = 'flex'; 
}
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function openAddModal() { selectedId = null; document.getElementById('projectForm').reset(); document.getElementById('formModal').style.display = 'flex'; }
function openActionMenu(id) { 
    selectedId = id; 
    const p = projects.find(x => x.id === id); 
    document.getElementById('actionTargetName').innerText = p.task; 
    document.getElementById('actionModal').style.display = 'flex'; 
}
function markAsDone() { 
    const idx = projects.findIndex(p => p.id === selectedId); 
    projects[idx].status = 'completed'; 
    updateStorage(); 
    closeModal('actionModal'); 
    renderProjects(); 
}
function executeDelete() { 
    projects = projects.filter(p => p.id !== selectedId); 
    updateStorage(); 
    closeModal('deleteModal'); 
    renderProjects(); 
}
function openConfirmDelete() { closeModal('actionModal'); document.getElementById('deleteModal').style.display = 'flex'; }
function setFilter(val, btn) { 
    currentFilter = val; 
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active')); 
    btn.classList.add('active'); 
    renderProjects(); 
}
