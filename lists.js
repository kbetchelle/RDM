// ===== DATA STRUCTURE =====
let lists = [];
let currentListId = 'all'; // 'all' or specific list ID

// ===== DOM ELEMENTS =====
const listsNav = document.getElementById('lists-nav');
const addListBtn = document.getElementById('add-list-btn');
const currentListTitle = document.getElementById('current-list-title');
const newTaskInput = document.getElementById('new-task-input');
const tasksList = document.getElementById('tasks-list');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderListsNav();
    renderTasks();
});

// ===== NAVIGATION =====
function navigateToPage(url) {
    if (url) {
        window.location.href = url;
    }
}

// ===== DATA PERSISTENCE =====
function loadData() {
    const savedLists = localStorage.getItem('rdm_lists_simple');

    if (savedLists) {
        try {
            lists = JSON.parse(savedLists);
        } catch (e) {
            console.error('Error loading lists:', e);
            lists = [];
        }
    }

    // Initialize with sample data if empty
    if (lists.length === 0) {
        initializeSampleData();
    }
}

function saveData() {
    localStorage.setItem('rdm_lists_simple', JSON.stringify(lists));
}

function initializeSampleData() {
    const now = new Date().toISOString();
    lists = [
        {
            id: generateId(),
            name: "Work",
            tasks: [
                { id: generateId(), text: "Complete project documentation", completed: false, createdDate: now, dueDate: null },
                { id: generateId() + 1, text: "Review team code submissions", completed: false, createdDate: now, dueDate: null }
            ]
        },
        {
            id: generateId() + 2,
            name: "Personal",
            tasks: [
                { id: generateId() + 3, text: "Buy groceries", completed: false, createdDate: now, dueDate: null },
                { id: generateId() + 4, text: "Call dentist", completed: true, createdDate: now, dueDate: null }
            ]
        }
    ];
    saveData();
}

function generateId() {
    return Date.now() + Math.floor(Math.random() * 10000);
}

// ===== LIST MANAGEMENT =====
function addList() {
    const name = prompt('Enter list name:');

    if (name && name.trim()) {
        const newList = {
            id: generateId(),
            name: name.trim(),
            tasks: []
        };

        lists.unshift(newList); // Add to beginning
        saveData();
        renderListsNav();
        selectList(newList.id);
    }
}

function deleteList(listId) {
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    const confirmDelete = confirm(`Delete list "${list.name}" and all its tasks?`);

    if (confirmDelete) {
        lists = lists.filter(l => l.id !== listId);
        saveData();
        renderListsNav();

        // Switch to "All Tasks" view
        selectList('all');
    }
}

function selectList(listId) {
    currentListId = listId;

    // Update title
    if (listId === 'all') {
        currentListTitle.textContent = 'All Tasks';
    } else {
        const list = lists.find(l => l.id === listId);
        if (list) {
            currentListTitle.textContent = list.name;
        }
    }

    renderListsNav();
    renderTasks();
}

function renderListsNav() {
    listsNav.innerHTML = '';

    // "All Tasks" item (always first)
    const allTasksItem = document.createElement('button');
    allTasksItem.className = 'list-nav-item';
    allTasksItem.textContent = 'All';
    if (currentListId === 'all') {
        allTasksItem.classList.add('active');
    }
    allTasksItem.onclick = () => selectList('all');
    listsNav.appendChild(allTasksItem);

    // Individual lists
    lists.forEach(list => {
        const listItem = document.createElement('button');
        listItem.className = 'list-nav-item';
        listItem.textContent = list.name;

        if (currentListId === list.id) {
            listItem.classList.add('active');
        }

        listItem.onclick = () => selectList(list.id);

        // Right-click to delete
        listItem.oncontextmenu = (e) => {
            e.preventDefault();
            deleteList(list.id);
        };

        listsNav.appendChild(listItem);
    });
}

// ===== TASK MANAGEMENT =====
function addTask() {
    const text = newTaskInput.value.trim();

    if (!text) return;

    if (currentListId === 'all') {
        // If viewing "All Tasks", add to first list or create a new one
        if (lists.length === 0) {
            lists.push({
                id: generateId(),
                name: "Tasks",
                tasks: []
            });
        }

        const newTask = {
            id: generateId(),
            text: text,
            completed: false,
            createdDate: new Date().toISOString(),
            dueDate: null
        };

        lists[0].tasks.push(newTask);
    } else {
        // Add to specific list
        const list = lists.find(l => l.id === currentListId);
        if (list) {
            const newTask = {
                id: generateId(),
                text: text,
                completed: false,
                createdDate: new Date().toISOString(),
                dueDate: null
            };

            list.tasks.push(newTask);
        }
    }

    saveData();
    renderTasks();
    newTaskInput.value = '';
    newTaskInput.focus();
}

function toggleTask(listId, taskId) {
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    const task = list.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    saveData();
    renderTasks();
}

function renderTasks() {
    tasksList.innerHTML = '';

    let allTasks = [];

    if (currentListId === 'all') {
        // Gather all tasks from all lists
        lists.forEach(list => {
            list.tasks.forEach(task => {
                if (!task.completed) { // Only show active tasks in "All Tasks"
                    allTasks.push({ task, listId: list.id });
                }
            });
        });
    } else {
        // Get tasks from specific list
        const list = lists.find(l => l.id === currentListId);
        if (list) {
            list.tasks.forEach(task => {
                allTasks.push({ task, listId: list.id });
            });
        }
    }

    // Render tasks
    allTasks.forEach(({ task, listId }) => {
        const taskItem = createTaskElement(task, listId);
        tasksList.appendChild(taskItem);
    });
}

function createTaskElement(task, listId) {
    const div = document.createElement('div');
    div.className = 'task-item-simple';

    if (task.completed) {
        div.classList.add('completed');
    }

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.onchange = () => toggleTask(listId, task.id);

    // Task text
    const textSpan = document.createElement('span');
    textSpan.className = 'task-text-simple';
    textSpan.textContent = task.text;

    // Task menu button
    const menuContainer = document.createElement('div');
    menuContainer.className = 'task-menu-container';

    const menuBtn = document.createElement('button');
    menuBtn.className = 'task-menu-btn';
    menuBtn.textContent = '⋮';

    const menuDropdown = document.createElement('div');
    menuDropdown.className = 'task-menu-dropdown';

    const editBtn = document.createElement('button');
    editBtn.className = 'task-menu-item';
    editBtn.textContent = 'Edit';
    editBtn.onclick = (e) => {
        e.stopPropagation();
        openEditModal(task, listId);
    };

    const archiveBtn = document.createElement('button');
    archiveBtn.className = 'task-menu-item';
    archiveBtn.textContent = 'Archive';
    archiveBtn.onclick = (e) => {
        e.stopPropagation();
        archiveTask(listId, task.id);
    };

    const abyssBtn = document.createElement('button');
    abyssBtn.className = 'task-menu-item';
    abyssBtn.textContent = 'Abyss';
    abyssBtn.onclick = (e) => {
        e.stopPropagation();
        sendToAbyss(listId, task.id);
    };

    menuDropdown.appendChild(editBtn);
    menuDropdown.appendChild(archiveBtn);
    menuDropdown.appendChild(abyssBtn);

    menuContainer.appendChild(menuBtn);
    menuContainer.appendChild(menuDropdown);

    div.appendChild(checkbox);
    div.appendChild(textSpan);
    div.appendChild(menuContainer);

    return div;
}

// ===== TASK ACTIONS =====
function openEditModal(task, listId) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'edit-modal-overlay';

    const modalContent = document.createElement('div');
    modalContent.className = 'edit-modal-content';

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'edit-modal-close';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => document.body.removeChild(modal);

    // Task text input
    const textLabel = document.createElement('label');
    textLabel.textContent = 'Task:';
    textLabel.className = 'edit-modal-label';

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.className = 'edit-modal-input';
    textInput.value = task.text;
    textInput.maxLength = 200;

    // Due date input
    const dateLabel = document.createElement('label');
    dateLabel.textContent = 'Due Date (optional):';
    dateLabel.className = 'edit-modal-label';

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.className = 'edit-modal-input';
    if (task.dueDate) {
        dateInput.value = task.dueDate.split('T')[0];
    }

    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'edit-modal-save';
    saveBtn.textContent = 'Save';
    saveBtn.onclick = () => {
        if (textInput.value.trim()) {
            task.text = textInput.value.trim();
            task.dueDate = dateInput.value ? new Date(dateInput.value).toISOString() : null;
            saveData();
            renderTasks();
            document.body.removeChild(modal);
        }
    };

    modalContent.appendChild(closeBtn);
    modalContent.appendChild(textLabel);
    modalContent.appendChild(textInput);
    modalContent.appendChild(dateLabel);
    modalContent.appendChild(dateInput);
    modalContent.appendChild(saveBtn);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Focus input
    textInput.focus();
    textInput.select();
}

function archiveTask(listId, taskId) {
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    const taskIndex = list.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = list.tasks[taskIndex];

    // Initialize archived tasks structure if it doesn't exist
    if (!window.archivedTasks) {
        const savedArchive = localStorage.getItem('rdm_archive');
        window.archivedTasks = savedArchive ? JSON.parse(savedArchive) : [];
    }

    // Add to archive
    window.archivedTasks.push({
        ...task,
        archivedDate: new Date().toISOString(),
        originalList: list.name
    });

    // Save to localStorage under Account/Archive
    localStorage.setItem('rdm_archive', JSON.stringify(window.archivedTasks));

    // Remove from original list
    list.tasks.splice(taskIndex, 1);
    saveData();
    renderTasks();
}

function sendToAbyss(listId, taskId) {
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    const taskIndex = list.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = list.tasks[taskIndex];

    // Initialize abyss structure if it doesn't exist
    if (!window.abyssTasks) {
        const savedAbyss = localStorage.getItem('rdm_abyss');
        window.abyssTasks = savedAbyss ? JSON.parse(savedAbyss) : [];
    }

    // Add to abyss
    window.abyssTasks.push({
        ...task,
        abyssDate: new Date().toISOString(),
        originalList: list.name
    });

    // Save to localStorage under Account/The Abyss
    localStorage.setItem('rdm_abyss', JSON.stringify(window.abyssTasks));

    // Remove from original list
    list.tasks.splice(taskIndex, 1);
    saveData();
    renderTasks();
}

// ===== EVENT LISTENERS =====
addListBtn.addEventListener('click', addList);

newTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Export function for navigation
window.navigateToPage = navigateToPage;
