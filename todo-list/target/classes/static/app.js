// Globals
let allTasks = [];
let allLists = [];
let currentFilter = { type: 'smart', value: 'all' };
let currentListName = 'All Tasks';
let selectedTaskId = null;
let currentUser = null; // { id, username }
let allHabits = [];

const API = {
    lists: '/api/lists',
    todos: '/api/todos',
    users: '/api/users',
    habits: '/api/habits',
    rankings: '/api/rankings'
};

// Timer State
let timerInterval = null;
let currentSeconds = 0;
let isTimerRunning = false;
let currentLeaderboardCategory = 'overall';

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

async function checkAuth() {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
        currentUser = JSON.parse(stored);
        try {
            const res = await fetch(`${API.users}/verify/${currentUser.id}`);
            const isValid = await res.json();
            if (isValid) {
                initApp();
            } else {
                logout();
            }
        } catch (e) {
            console.error("Auth check failed", e);
            logout();
        }
    } else {
        window.location.href = 'login.html';
    }
}

function initApp() {
    loadLists();
    loadTasks();
    loadHabits();
    setupEventListeners();
    updateUserProfile();

    const debugToggle = document.getElementById('debugToggle');
    if (debugToggle) {
        debugToggle.checked = localStorage.getItem('debugMode') === 'true';
    }
}

function toggleDebug(enabled) {
    localStorage.setItem('debugMode', enabled);
}

function updateUserProfile() {
    const profileEl = document.querySelector('.username');
    if (profileEl && currentUser) {
        profileEl.innerText = currentUser.username;
    }
}

// --- AUTH ---
let isLoginMode = true;

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('authTitle').innerText = isLoginMode ? 'Welcome Back' : 'Create Account';
    document.getElementById('switchText').innerText = isLoginMode ? 'New here? ' : 'Already have an account? ';
    document.getElementById('switchAction').innerText = isLoginMode ? 'Sign Up' : 'Login';
    document.querySelector('.auth-btn').innerText = isLoginMode ? 'Login' : 'Sign Up';
}

async function handleAuth() {
    const user = document.getElementById('usernameInput').value;
    const pass = document.getElementById('passwordInput').value;

    if (!user || !pass) {
        alert("Please fill all fields");
        return;
    }

    const endpoint = isLoginMode ? '/login' : '/register';

    try {
        const res = await fetch(`${API.users}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });

        if (!res.ok) throw new Error("Auth failed");

        const data = await res.json();
        if (data && data.id) {
            currentUser = data;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            window.location.href = 'index.html';
        } else {
            alert("Login failed");
        }
    } catch (e) {
        alert(e.message);
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// --- LOADERS ---
// --- LOADERS ---
async function loadLists() {
    if (!currentUser) return;
    const res = await fetch(`${API.lists}?userId=${currentUser.id}`);
    allLists = await res.json();
    renderLists();
    populateListSelect();
}

async function loadTasks() {
    if (!currentUser) return;
    const res = await fetch(`${API.todos}?userId=${currentUser.id}`);
    allTasks = await res.json();
    renderTasks();
}

// ... (renderLeaderboard)
// ... (renderLeaderboard removed)

async function loadHabits() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API.habits}?userId=${currentUser.id}`);
        if (res.ok) {
            allHabits = await res.json();
            renderHabits();
        }
    } catch (e) {
        console.error("Failed to load habits", e);
    }
}

// --- RENDERERS ---
function renderHabits() {
    const container = document.getElementById('mainHabitGrid');
    if (!container) return;
    container.innerHTML = '';

    allHabits.forEach(h => {
        const card = document.createElement('div');
        card.className = 'habit-card';
        // Extract emoji from name if present (simple heuristic) or default
        // For now just use the name as is
        card.innerHTML = `
            <div class="habit-emoji">✨</div>
            <div class="habit-title">${h.name}</div>
            <div class="habit-streak">🔥 ${h.streak} day streak</div>
            <button class="check-btn-large" onclick="incrementHabit(${h.id})">
                <ion-icon name="checkmark-circle-outline" style="font-size:18px; vertical-align:middle;"></ion-icon> Check In
            </button>
        `;
        container.appendChild(card);
    });
}

function renderLists() {
    const container = document.getElementById('customLists');
    if (!container) return;
    container.innerHTML = '';

    allLists.forEach(list => {
        const div = document.createElement('div');
        div.className = 'nav-item';
        if (currentFilter.type === 'list' && currentFilter.value === list.id) {
            div.classList.add('active');
        }
        // Using a generic list icon with the list's color
        div.innerHTML = `<ion-icon name="list-outline" class="icon" style="color:${list.color || '#6366f1'}"></ion-icon> ${list.name}`;
        div.onclick = () => selectList(list.id, list.name);
        container.appendChild(div);
    });
}

function renderTasks() {
    const todoList = document.getElementById('todoList');
    const completedList = document.getElementById('completedList');
    const completedCount = document.getElementById('completedCount');

    if (!todoList) return;

    todoList.innerHTML = '';
    completedList.innerHTML = '';

    // Fix Date Logic: Use Local Time for YYYY-MM-DD
    const getLocalISOString = (date) => {
        const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
        const localTime = new Date(date.getTime() - offset);
        return localTime.toISOString().split('T')[0];
    };

    const todayDate = new Date();
    const todayStr = getLocalISOString(todayDate);

    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = getLocalISOString(tomorrowDate);

    const nextWeekDate = new Date();
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    const nextWeekStr = getLocalISOString(nextWeekDate);

    // Filter Logic
    let filteredTasks = allTasks.filter(t => {
        if (currentFilter.type === 'list') {
            return String(t.taskListId) === String(currentFilter.value);
        }
        if (currentFilter.type === 'smart') {
            if (!t.dueDate) {
                // For smart views (Time-based), if no due date, maybe exclude? 
                // Depends on logic. "All Tasks" includes everything.
                if (currentFilter.value === 'all') return true;
                return false; // Today/Tomorrow/Week require a date
            }

            if (currentFilter.value === 'today') {
                return t.dueDate === todayStr;
            }
            if (currentFilter.value === 'tomorrow') {
                return t.dueDate === tomorrowStr;
            }
            if (currentFilter.value === 'week') {
                return t.dueDate >= todayStr && t.dueDate <= nextWeekStr;
            }
            if (currentFilter.value === 'all') return true;
        }
        return true;
    });

    const completed = filteredTasks.filter(t => t.completed);
    const active = filteredTasks.filter(t => !t.completed);

    completedCount.innerText = completed.length;

    active.forEach(task => todoList.appendChild(createTaskElement(task)));
    completed.forEach(task => completedList.appendChild(createTaskElement(task)));

    if (selectedTaskId) {
        const el = document.querySelector(`li[data-id="${selectedTaskId}"]`);
        if (el) el.classList.add('active');
    }
}

function createTaskElement(task) {
    const div = document.createElement('div');
    div.dataset.id = task.id;
    div.className = 'task-item';
    if (task.completed) div.classList.add('completed');
    if (task.id === selectedTaskId) div.classList.add('active');

    // Priority Border/Indicator logic if needed, currently using chips
    // const priorityColor = task.priority === 'HIGH' ? 'var(--danger)' : task.priority === 'MEDIUM' ? 'var(--warning)' : 'var(--info)';
    // div.style.borderLeft = `4px solid ${priorityColor}`;

    div.onclick = () => selectTask(task);

    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const todayStr = new Date(today.getTime() - offset).toISOString().split('T')[0];

    let dateClass = '';
    if (task.dueDate) {
        if (task.dueDate < todayStr && !task.completed) dateClass = 'text-danger'; // Overdue
        else if (task.dueDate === todayStr) dateClass = 'text-warning'; // Due Today
    }

    const displayDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '';
    const priorityClass = `priority-${(task.priority || 'LOW').toLowerCase()}`;

    div.innerHTML = `
        <div class="checkbox ${task.completed ? 'checked' : ''}" 
             onclick="toggleTaskStatus(event, ${task.id}, ${!task.completed})"></div>
        <div class="task-info">
            <div class="task-text">${task.task}</div>
            <div class="task-meta">
                ${displayDate ? `<span><ion-icon name="calendar-outline" style="vertical-align:middle"></ion-icon> ${displayDate}</span>` : ''}
                <span class="meta-chip ${priorityClass}">${task.priority}</span>
                ${task.timeSpent > 0 ? `<span><ion-icon name="time-outline" style="vertical-align:middle"></ion-icon> ${formatTotalTime(task.timeSpent)}</span>` : ''}
            </div>
        </div>
    `;
    return div;
}

// --- ACTIONS ---
function selectList(id, name) {
    if (id === 'today' || id === 'all' || id === 'tomorrow' || id === 'week') {
        currentFilter = { type: 'smart', value: id };
    } else if (id === null) {
        currentFilter = { type: 'smart', value: 'all' };
    } else {
        currentFilter = { type: 'list', value: id };
    }

    document.getElementById('currentListName').innerText = name;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    // Highlight active nav item
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.innerText.includes(name)) item.classList.add('active');
    });

    showTasks();
    renderTasks();
}

let activeTimerTaskId = null; // Track which task has the running timer

function selectTask(task) {
    // User requested NOT to stop timer on switch.
    // So we just switch the view.
    selectedTaskId = task.id;
    renderTasks();
    loadTaskDetails(task);
}

function loadTaskDetails(task) {
    const panel = document.getElementById('detailsPanel');
    if (!task) {
        panel.style.visibility = 'hidden';
        return;
    }
    panel.style.visibility = 'visible';

    document.getElementById('detailTitle').value = task.task;
    document.getElementById('detailDueDate').value = task.dueDate || '';
    document.getElementById('detailPriority').value = task.priority || 'LOW';
    document.getElementById('detailDescription').value = task.description || '';
    const listSelect = document.getElementById('detailListSelect');
    if (listSelect) listSelect.value = task.taskListId || '';

    // Timer UI Update
    updateTimerUI(task);
}

function updateTimerUI(task) {
    if (!task) return;
    const isThisTaskRunning = activeTimerTaskId === task.id;

    document.getElementById('timerBtn').innerText = isThisTaskRunning ? "■" : "▶";

    // If this task is running, currentSeconds is live. 
    // If not, we should show its stored timeSpent.
    // BUT wait, if we switch AWAY and back, currentSeconds is correct for the RUNNING task.
    // If we view a NON-RUNNING task, we show its stored timeSpent.

    if (isThisTaskRunning) {
        document.getElementById('timerText').innerText = formatTime(currentSeconds);
    } else {
        document.getElementById('timerText').innerText = "00:00:00"; // Or show static time? 
        // Usually a timer is for a session. Total time is separate.
    }
    document.getElementById('totalTimeText').innerText = formatTotalTime(task.timeSpent || 0);
}

// --- TIMER LOGIC ---
function toggleTimer() {
    const btn = document.getElementById('timerBtn');

    if (activeTimerTaskId === selectedTaskId) {
        // Stop current
        saveTimer();
    } else {
        // Start new (or switch)
        if (activeTimerTaskId !== null) {
            // Stop previous running task first
            saveTimer(activeTimerTaskId); // Need to handle saving a task that isn't selected
        }
        startTimerFor(selectedTaskId);
    }
}

function startTimerFor(taskId) {
    activeTimerTaskId = taskId;
    isTimerRunning = true;
    currentSeconds = 0;

    // UI update
    document.getElementById('timerBtn').innerText = "■";

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        currentSeconds++;
        // Identify which task is being timed
        // Only update UI if we are LOOKING at that task
        if (selectedTaskId === activeTimerTaskId) {
            document.getElementById('timerText').innerText = formatTime(currentSeconds);
            // We could also live-update total time? Maybe overkill/complex
        }
    }, 1000);
}

// Overloaded saveTimer to allow saving a background task
async function saveTimer(taskIdOverride = null) {
    const targetId = taskIdOverride || selectedTaskId;
    if (!targetId) return;

    // Use currentSeconds
    const secondsToAdd = currentSeconds;

    // Reset State
    isTimerRunning = false;
    activeTimerTaskId = null;
    currentSeconds = 0;
    if (timerInterval) clearInterval(timerInterval);

    // If we are looking at the task we just stopped
    if (selectedTaskId === targetId) {
        document.getElementById('timerBtn').innerText = "▶";
        document.getElementById('timerText').innerText = "00:00:00";
    }

    const task = allTasks.find(t => t.id === targetId);
    if (task) {
        task.timeSpent = (task.timeSpent || 0) + secondsToAdd;

        // Update Total Time UI if we are looking at it
        if (selectedTaskId === targetId) {
            document.getElementById('totalTimeText').innerText = formatTotalTime(task.timeSpent);
        }

        renderTasks(); // Update list view (if we have time indicators there)

        // Persist
        await fetch(`${API.todos}/${targetId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...task, timeSpent: task.timeSpent }) // minimal update? no send full object
        });
    }
}

function resetTimer() {
    // Only reset if we are looking at the active timer?
    if (selectedTaskId === activeTimerTaskId) {
        isTimerRunning = false;
        activeTimerTaskId = null;
        if (timerInterval) clearInterval(timerInterval);
        currentSeconds = 0;
        document.getElementById('timerText').innerText = "00:00:00";
        document.getElementById('timerBtn').innerText = "▶";
    }
}

function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map(v => v < 10 ? "0" + v : v).join(":");
}

function formatTotalTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}h ${m}m`;
}

async function saveTaskDetail(field, value) {
    if (!selectedTaskId) return;
    const task = allTasks.find(t => t.id === selectedTaskId);
    if (!task) return;

    const updates = { ...task, [field]: value };
    Object.assign(task, updates);
    renderTasks();

    await fetch(`${API.todos}/${selectedTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
}

async function toggleTaskStatus(e, id, status) {
    e.stopPropagation();
    const task = allTasks.find(t => t.id === id);
    if (task) {
        task.completed = status;
        renderTasks();
        await fetch(`${API.todos}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
    }
}

async function quickAddTask() {
    const input = document.getElementById('taskInput');
    const priority = document.getElementById('priorityInput').value;
    const dueDateInput = document.getElementById('dueDateInput');
    const title = input.value.trim();

    if (!title) return;

    let listId = currentFilter.type === 'list' ? currentFilter.value : (allLists[0]?.id || 1);
    let dueDate = dueDateInput.value;
    if (currentFilter.value === 'today' && !dueDate) {
        dueDate = new Date().toISOString().split('T')[0];
    }

    const task = {
        task: title,
        priority: priority,
        dueDate: dueDate || null,
        completed: false,
        taskListId: listId,
        description: '',
        userId: currentUser.id,
        timeSpent: 0
    };

    try {
        const res = await fetch(API.todos, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        const saved = await res.json();
        allTasks.unshift(saved);
        renderTasks();
        input.value = '';

        const firstItem = document.querySelector('#todoList .task-item');
        if (firstItem) firstItem.style.animation = 'slideUp 0.5s ease forwards'; // force animation restart or logic
    } catch (e) {
        console.error("Failed to add task", e);
    }
}

async function deleteCurrentTask() {
    if (!selectedTaskId) return;
    if (!confirm("Delete task?")) return;

    await fetch(`${API.todos}/${selectedTaskId}`, { method: 'DELETE' });
    allTasks = allTasks.filter(t => t.id !== selectedTaskId);
    selectedTaskId = null;
    renderTasks();
}

async function incrementHabit(id) {
    const isDebug = localStorage.getItem('debugMode') === 'true';
    const res = await fetch(`${API.habits}/${id}/increment?debug=${isDebug}`, { method: 'PUT' });
    const updated = await res.json();
    const idx = allHabits.findIndex(h => h.id === id);
    if (idx !== -1) allHabits[idx] = updated;
    renderHabits();
}

async function createList() {
    const name = prompt("List Name:");
    if (!name) return;
    const color = prompt("Color (hex or name, e.g. #ff0000):", "#3d5afe");

    try {
        const res = await fetch(API.lists, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, color, userId: currentUser.id })
        });
        const newList = await res.json();
        allLists.push(newList);
        renderLists();
        populateListSelect();
    } catch (e) {
        console.error("Failed to create list", e);
    }
}

async function createHabit() {
    const name = prompt("Habit Name:");
    if (!name) return;
    try {
        const res = await fetch(API.habits, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, userId: currentUser.id, isCommon: false })
        });
        const habit = await res.json();
        allHabits.push(habit);
        renderHabits();
        closeHabitLibrary();
    } catch (e) {
        console.error("Failed to create habit", e);
    }
}

// --- VIEWS ---
function showTasks() {
    document.getElementById('taskView').style.display = 'flex';
    document.getElementById('habitView').style.display = 'none';
    document.getElementById('leaderboardView').style.display = 'none';
    document.getElementById('detailsPanel').style.visibility = selectedTaskId ? 'visible' : 'hidden';
}

function showHabitView() {
    document.getElementById('taskView').style.display = 'none';
    document.getElementById('habitView').style.display = 'flex';
    document.getElementById('leaderboardView').style.display = 'none';
    document.getElementById('detailsPanel').style.visibility = 'hidden';
    renderHabits();
}

function showLeaderboard() {
    document.getElementById('taskView').style.display = 'none';
    document.getElementById('habitView').style.display = 'none';
    document.getElementById('leaderboardView').style.display = 'flex';
    document.getElementById('detailsPanel').style.visibility = 'hidden';
    loadRankings('week');
}

async function loadRankings(timeframe) {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(b => {
        b.classList.toggle('active', b.innerText.toLowerCase().includes(timeframe));
    });

    try {
        let url = `${API.rankings}/${timeframe}`;
        if (currentLeaderboardCategory !== 'overall') {
            url = `${API.rankings}/habit/${currentLeaderboardCategory}?timeframe=${timeframe}`;
        }
        const res = await fetch(url);
        const rankings = await res.json();
        renderLeaderboard(rankings);
    } catch (e) {
        console.error("Rankings error", e);
    }
}

function changeLeaderboardCategory(val) {
    currentLeaderboardCategory = val;
    // Find which tab is active and reload
    const activeTab = document.querySelector('.tab-btn.active');
    const timeframe = activeTab ? activeTab.innerText.toLowerCase() : 'week';
    loadRankings(timeframe);
}

// --- LEADERBOARD RENDER ---
// --- LEADERBOARD RENDER ---
function renderLeaderboard(rankings) {
    const podiumEl = document.getElementById('podium');
    const listEl = document.getElementById('rankList');
    podiumEl.innerHTML = '';

    // Header for table
    listEl.innerHTML = `
        <div class="leaderboard-header">
            <span style="width:40px; text-align:center;">#</span>
            <span style="flex:1; padding-left:16px;">User</span>
            <span style="width:80px; text-align:right;">Score</span>
        </div>
        <div class="leaderboard-body" id="leaderboardBody"></div>
    `;
    const bodyEl = document.getElementById('leaderboardBody');

    const top3 = rankings.slice(0, 3);
    // Use ALL rankings for the table list as requested, not just 'rest'
    const fullList = rankings;

    const podiumOrder = [top3[1], top3[0], top3[2]].filter(u => u);
    const medals = ['🥈', '🥇', '🥉'];
    const ranks = [2, 1, 3];

    podiumOrder.forEach((u, idx) => {
        // Correct rank mapping: if current is top3[1] (2nd place), rank is 2.
        // top3[0] is 1st. top3[2] is 3rd.
        // We need to find the actual rank of 'u' in 'top3'.
        const realRank = top3.indexOf(u) + 1;

        const div = document.createElement('div');
        div.className = `podium-step podium-rank-${realRank}`;
        div.innerHTML = `
            <div class="podium-top-label">TOP ${realRank}</div>
            <div class="podium-avatar">${u.username.charAt(0).toUpperCase()}</div>
            <div class="podium-name" title="${u.username}">${u.username}</div>
            <div class="podium-bar">
                <span>${u.score}</span>
            </div>
        `;
        podiumEl.appendChild(div);
    });

    // Table Logic: Show ALL users
    fullList.forEach((u, i) => {
        const row = document.createElement('div');
        row.className = 'leaderboard-row';
        if (i < 3) {
            row.style.background = '#fff8e1'; // Highlight top 3 slightly in table
        }
        row.innerHTML = `
            <span class="rank-idx" style="width:40px; text-align:center;">${i + 1}</span>
            <span class="rank-user" style="flex:1; padding-left:16px;">
                ${u.username} ${i < 3 ? '🏆' : ''}
            </span>
            <span class="rank-score" style="width:80px; text-align:right;">${u.score}</span>
        `;
        bodyEl.appendChild(row);
    });
}

function openHabitLibrary() {
    document.getElementById('habitModal').style.display = 'block';
}

function closeHabitLibrary() {
    document.getElementById('habitModal').style.display = 'none';
}

async function addCommonHabit(name) {
    const res = await fetch(API.habits, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, userId: currentUser.id, isCommon: true })
    });
    const habit = await res.json();
    allHabits.push(habit);
    renderHabits();
    closeHabitLibrary();
}

// --- SETUP ---
function setupEventListeners() {
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') quickAddTask();
    });

    const inputs = [
        { id: 'detailTitle', field: 'task' },
        { id: 'detailDueDate', field: 'dueDate' },
        { id: 'detailPriority', field: 'priority' },
        { id: 'detailDescription', field: 'description' },
        { id: 'detailListSelect', field: 'taskListId' }
    ];

    inputs.forEach(item => {
        const el = document.getElementById(item.id);
        if (el) {
            el.addEventListener('change', (e) => {
                let val = e.target.value;
                if (item.field === 'taskListId') val = parseInt(val);
                saveTaskDetail(item.field, val);
            });
        }
    });
}

function populateListSelect() {
    const sel = document.getElementById('detailListSelect');
    if (!sel) return;
    sel.innerHTML = '';
    allLists.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l.id;
        opt.innerText = l.name;
        sel.appendChild(opt);
    });
}

function toggleCompleted() {
    const list = document.getElementById('completedList');
    list.style.display = list.style.display === 'none' ? 'block' : 'none';
}
