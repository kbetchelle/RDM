// Load global task management
const script = document.createElement('script');
script.src = 'globalTasks.js';
document.head.appendChild(script);

// ===== DOM ELEMENTS =====
const tasksListElement = document.getElementById('thisweek-tasks-list');

// ===== INITIALIZATION =====
script.onload = () => {
    renderThisWeekTasks();
};

// ===== RENDER FUNCTIONS =====
function renderThisWeekTasks() {
    tasksListElement.innerHTML = '';

    const thisWeekTasks = window.GlobalTasks.getThisWeekTasks();

    if (thisWeekTasks.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'No tasks created or due this week.';
        tasksListElement.appendChild(emptyMessage);
        return;
    }

    // Sort tasks: uncompleted first, then by created date (newest first)
    thisWeekTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        return new Date(b.createdDate) - new Date(a.createdDate);
    });

    thisWeekTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        tasksListElement.appendChild(taskElement);
    });
}

function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'task-item-thisweek';

    if (task.completed) {
        div.classList.add('completed');
    }

    // Bullet point (clickable)
    const bullet = document.createElement('span');
    bullet.className = 'task-bullet';
    bullet.onclick = () => toggleTask(task.listId, task.id);

    // Task text container
    const textContainer = document.createElement('div');
    textContainer.className = 'task-text-container';

    const textSpan = document.createElement('span');
    textSpan.className = 'task-text-simple';
    textSpan.textContent = task.text;

    // Add double-click to toggle completion
    textSpan.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        toggleTask(task.listId, task.id);
    });

    // Meta info (list name, created date, due date)
    const metaSpan = document.createElement('span');
    metaSpan.className = 'task-meta';

    let metaText = `${task.listName}`;

    if (task.createdDate) {
        const createdDate = new Date(task.createdDate);
        const isCreatedThisWeek = window.GlobalTasks.isThisWeek(task.createdDate);
        if (isCreatedThisWeek) {
            metaText += ` • Created ${formatDate(createdDate)}`;
        }
    }

    if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const isDueThisWeek = window.GlobalTasks.isThisWeek(task.dueDate);
        if (isDueThisWeek) {
            metaText += ` • Due ${formatDate(dueDate)}`;
        }
    }

    metaSpan.textContent = metaText;

    textContainer.appendChild(textSpan);
    textContainer.appendChild(metaSpan);

    // Task menu button
    const menuContainer = document.createElement('div');
    menuContainer.className = 'task-menu-container';

    const menuBtn = document.createElement('button');
    menuBtn.className = 'task-menu-btn';
    menuBtn.textContent = '⋮';

    const menuDropdown = document.createElement('div');
    menuDropdown.className = 'task-menu-dropdown';

    const viewListBtn = document.createElement('button');
    viewListBtn.className = 'task-menu-item';
    viewListBtn.textContent = 'View List';
    viewListBtn.onclick = (e) => {
        e.stopPropagation();
        window.location.href = `lists.html?list=${task.listId}`;
    };

    menuDropdown.appendChild(viewListBtn);

    menuContainer.appendChild(menuBtn);
    menuContainer.appendChild(menuDropdown);

    div.appendChild(bullet);
    div.appendChild(textContainer);
    div.appendChild(menuContainer);

    return div;
}

// ===== HELPER FUNCTIONS =====
function formatDate(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = targetDate - today;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'tomorrow';
    if (diffDays === -1) return 'yesterday';
    if (diffDays > 1 && diffDays <= 6) return `in ${diffDays} days`;
    if (diffDays < -1 && diffDays >= -6) return `${Math.abs(diffDays)} days ago`;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
}

function toggleTask(listId, taskId) {
    // Load lists from localStorage
    const savedLists = localStorage.getItem('rdm_lists_simple');
    if (!savedLists) return;

    let lists = JSON.parse(savedLists);
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    const task = list.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;

    // Save back to localStorage
    localStorage.setItem('rdm_lists_simple', JSON.stringify(lists));

    // Re-render
    renderThisWeekTasks();
}
