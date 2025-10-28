// ===== DOM ELEMENTS =====
const archiveTasksList = document.getElementById('archive-tasks-list');
const displayOptions = document.getElementById('display-options');
const accountSectionTitle = document.getElementById('account-section-title');
const accountNav = document.getElementById('account-nav');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    showArchive();
});

// ===== ARCHIVE FUNCTIONS =====
function showArchive() {
    console.log('Loading archived tasks...');
    const archivedTasks = getArchivedTasks();

    archiveTasksList.innerHTML = '';

    if (archivedTasks.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'No archived tasks yet.';
        archiveTasksList.appendChild(emptyMessage);
        return;
    }

    // Sort by archived date (most recent first)
    archivedTasks.sort((a, b) => new Date(b.archivedDate) - new Date(a.archivedDate));

    archivedTasks.forEach(task => {
        const taskElement = createArchivedTaskElement(task);
        archiveTasksList.appendChild(taskElement);
    });

    console.log(`Loaded ${archivedTasks.length} archived tasks`);
}

function getArchivedTasks() {
    const savedArchive = localStorage.getItem('rdm_archive');
    if (savedArchive) {
        try {
            return JSON.parse(savedArchive);
        } catch (e) {
            console.error('Error loading archive:', e);
            return [];
        }
    }
    return [];
}

function createArchivedTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'task-item-simple archived-task';

    // Bullet point
    const bullet = document.createElement('span');
    bullet.className = 'task-bullet';
    bullet.style.backgroundColor = '#999';

    // Task text
    const textSpan = document.createElement('span');
    textSpan.className = 'task-text-simple';
    textSpan.textContent = task.text;
    textSpan.style.textDecoration = 'line-through';
    textSpan.style.color = '#666';

    // Metadata
    const metaSpan = document.createElement('span');
    metaSpan.className = 'task-meta';
    metaSpan.style.fontSize = '0.8em';
    metaSpan.style.color = '#999';
    metaSpan.style.marginLeft = 'auto';

    let metaText = `From: ${task.originalList || 'Unknown'}`;
    if (task.archivedDate) {
        const archivedDate = new Date(task.archivedDate);
        const formattedDate = archivedDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        metaText += ` • Archived: ${formattedDate}`;
    }
    metaSpan.textContent = metaText;

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-arrow-btn';
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Permanently delete';
    deleteBtn.onclick = () => {
        if (confirm('Permanently delete this task? This cannot be undone.')) {
            deleteArchivedTask(task.id);
        }
    };

    div.appendChild(bullet);
    div.appendChild(textSpan);
    div.appendChild(metaSpan);
    div.appendChild(deleteBtn);

    return div;
}

function deleteArchivedTask(taskId) {
    let archivedTasks = getArchivedTasks();
    archivedTasks = archivedTasks.filter(t => t.id !== taskId);
    localStorage.setItem('rdm_archive', JSON.stringify(archivedTasks));
    showArchive();
}

// ===== DISPLAY THEME FUNCTIONS =====
function showDisplay() {
    console.log('Showing display options...');

    // Update navigation active state
    const navItems = accountNav.querySelectorAll('.list-nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    navItems[0].classList.add('active'); // Display is first item

    // Show display options, hide archive
    displayOptions.style.display = 'block';
    archiveTasksList.style.display = 'none';
    accountSectionTitle.textContent = 'Display Settings';

    // Update active theme button
    const currentTheme = localStorage.getItem('rdm_theme') || 'lined';
    const themeBtns = document.querySelectorAll('.theme-btn');
    themeBtns.forEach(btn => {
        if (btn.getAttribute('data-theme') === currentTheme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function showArchive() {
    console.log('Loading archived tasks...');

    // Update navigation active state
    const navItems = accountNav.querySelectorAll('.list-nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    navItems[1].classList.add('active'); // Archive is second item

    // Hide display options, show archive
    displayOptions.style.display = 'none';
    archiveTasksList.style.display = 'block';
    accountSectionTitle.textContent = 'Archived Tasks';

    const archivedTasks = getArchivedTasks();

    archiveTasksList.innerHTML = '';

    if (archivedTasks.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'No archived tasks yet.';
        archiveTasksList.appendChild(emptyMessage);
        return;
    }

    // Sort by archived date (most recent first)
    archivedTasks.sort((a, b) => new Date(b.archivedDate) - new Date(a.archivedDate));

    archivedTasks.forEach(task => {
        const taskElement = createArchivedTaskElement(task);
        archiveTasksList.appendChild(taskElement);
    });

    console.log(`Loaded ${archivedTasks.length} archived tasks`);
}

function setTheme(themeName) {
    console.log('Setting theme to:', themeName);

    // Save to localStorage
    localStorage.setItem('rdm_theme', themeName);
    console.log('Saved to localStorage:', localStorage.getItem('rdm_theme'));

    // Apply theme to body
    document.body.setAttribute('data-theme', themeName);
    console.log('Body data-theme attribute:', document.body.getAttribute('data-theme'));

    // Update active button
    const themeBtns = document.querySelectorAll('.theme-btn');
    console.log('Found theme buttons:', themeBtns.length);
    themeBtns.forEach(btn => {
        if (btn.getAttribute('data-theme') === themeName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    console.log('Theme applied successfully');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('rdm_theme') || 'lined';
    document.body.setAttribute('data-theme', savedTheme);
    console.log('Loaded theme:', savedTheme);
}

// Make functions globally accessible for onclick handlers
window.showDisplay = showDisplay;
window.showArchive = showArchive;
window.setTheme = setTheme;
