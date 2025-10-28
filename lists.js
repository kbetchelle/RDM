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
    // Check if elements exist
    if (!newTaskInput) {
        console.error('Task input element not found!');
        return;
    }
    if (!tasksList) {
        console.error('Tasks list element not found!');
        return;
    }
    if (!listsNav) {
        console.error('Lists nav element not found!');
        return;
    }

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
            // Normalize tasks to ensure all have required fields
            lists.forEach(list => {
                list.tasks = list.tasks.map(task => normalizeTask(task));
            });
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

// Ensure all tasks have required fields (backward compatibility)
function normalizeTask(task) {
    return {
        id: task.id,
        text: task.text,
        completed: task.completed !== undefined ? task.completed : false,
        createdDate: task.createdDate || new Date().toISOString(),
        dueDate: task.dueDate || null,
        tags: task.tags || [],
        project: task.project || null,
        category: task.category || null,
        movedToBottom: task.movedToBottom || false,
        movedToBottomTime: task.movedToBottomTime || null,
        assignedListId: task.assignedListId || null,
        completedTime: task.completedTime || null
    };
}

function saveData() {
    localStorage.setItem('rdm_lists_simple', JSON.stringify(lists));
}

function initializeSampleData() {
    lists = [
        {
            id: generateId(),
            name: "Tasks",
            tasks: []
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
        listItem.setAttribute('data-drop-list-id', list.id);

        if (currentListId === list.id) {
            listItem.classList.add('active');
        }

        listItem.onclick = () => selectList(list.id);

        // Right-click to delete
        listItem.oncontextmenu = (e) => {
            e.preventDefault();
            deleteList(list.id);
        };

        // Make list item a drop zone
        listItem.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            listItem.classList.add('drag-over');
        });

        listItem.addEventListener('dragleave', () => {
            listItem.classList.remove('drag-over');
        });

        listItem.addEventListener('drop', (e) => {
            e.preventDefault();
            listItem.classList.remove('drag-over');

            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const { taskId, listId: sourceListId } = data;

            console.log('Dropping task', taskId, 'from list', sourceListId, 'to list', list.id);

            // Move task from source list to target list
            moveTaskToList(taskId, sourceListId, list.id);
        });

        listsNav.appendChild(listItem);
    });
}

// Move task from one list to another
function moveTaskToList(taskId, sourceListId, targetListId) {
    // Find source list
    const sourceList = lists.find(l => l.id === sourceListId);
    if (!sourceList) {
        console.error('Source list not found');
        return;
    }

    // Find task in source list
    const taskIndex = sourceList.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
        console.error('Task not found in source list');
        return;
    }

    // Find target list
    const targetList = lists.find(l => l.id === targetListId);
    if (!targetList) {
        console.error('Target list not found');
        return;
    }

    // Remove task from source list
    const task = sourceList.tasks.splice(taskIndex, 1)[0];

    // Update task's assignedListId
    task.assignedListId = targetListId;

    // Add task to target list
    targetList.tasks.unshift(task);

    console.log('Moved task:', task.text, 'to list:', targetList.name);

    // Save and re-render
    saveData();
    renderTasks();
}

// ===== TASK MANAGEMENT =====
function addTask() {
    console.log('addTask called');
    console.log('newTaskInput:', newTaskInput);
    console.log('newTaskInput.value:', newTaskInput.value);

    const text = newTaskInput.value.trim();
    console.log('Trimmed text:', text);

    if (!text) {
        console.log('No text entered, returning');
        return;
    }

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
            dueDate: null,
            tags: [],
            project: null,
            category: null,
            assignedListId: lists[0].id
        };

        lists[0].tasks.unshift(newTask); // Add to beginning of array
    } else {
        // Add to specific list
        const list = lists.find(l => l.id === currentListId);
        if (list) {
            const newTask = {
                id: generateId(),
                text: text,
                completed: false,
                createdDate: new Date().toISOString(),
                dueDate: null,
                tags: [],
                project: null,
                category: null,
                assignedListId: list.id
            };

            list.tasks.unshift(newTask); // Add to beginning of array
        }
    }

    console.log('Saving data...');
    saveData();
    console.log('Rendering tasks...');
    renderTasks();
    console.log('Clearing input...');
    newTaskInput.value = '';
    newTaskInput.focus();
    console.log('Task added successfully!');
}

function toggleTask(listId, taskId) {
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    const taskIndex = list.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = list.tasks[taskIndex];

    // Toggle completion status
    task.completed = !task.completed;
    console.log('Task toggled:', task.text, 'Completed:', task.completed);

    // If task was just completed, schedule archive after 6 hours
    if (task.completed) {
        console.log('Task completed, will archive in 6 hours');
        task.completedTime = Date.now();

        // Schedule archive after 6 hours
        setTimeout(() => {
            const currentList = lists.find(l => l.id === listId);
            if (!currentList) return;

            const currentTaskIndex = currentList.tasks.findIndex(t => t.id === taskId);
            if (currentTaskIndex === -1) return;

            const taskToArchive = currentList.tasks[currentTaskIndex];

            // Only archive if still completed
            if (taskToArchive.completed) {
                console.log('6 hours passed, moving task to archive:', taskToArchive.text);

                // Remove from current list
                currentList.tasks.splice(currentTaskIndex, 1);

                // Move to archive
                moveTaskToArchive(taskToArchive, currentList.name);

                saveData();
                renderTasks();
            }
        }, 6 * 60 * 60 * 1000); // 6 hours
    } else {
        // If unmarking as completed, clear the completion time
        delete task.completedTime;
        console.log('Task unmarked as completed');
    }

    saveData();
    renderTasks();
}

// Move task to archive
function moveTaskToArchive(task, listName) {
    // Get archived tasks from localStorage
    let archivedTasks = [];
    const savedArchive = localStorage.getItem('rdm_archive');
    if (savedArchive) {
        try {
            archivedTasks = JSON.parse(savedArchive);
        } catch (e) {
            console.error('Error loading archive:', e);
        }
    }

    // Add task to archive with metadata
    archivedTasks.push({
        ...task,
        archivedDate: new Date().toISOString(),
        originalList: listName
    });

    // Save back to localStorage
    localStorage.setItem('rdm_archive', JSON.stringify(archivedTasks));
    console.log('Task archived successfully');
}

function renderTasks() {
    tasksList.innerHTML = '';

    let allTasks = [];

    if (currentListId === 'all') {
        // Gather all tasks from all lists (including completed)
        lists.forEach(list => {
            list.tasks.forEach(task => {
                allTasks.push({ task, listId: list.id });
            });
        });
    } else {
        // Get all tasks from specific list (including completed)
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
        console.log('Rendering completed task:', task.text, 'movedToBottom:', task.movedToBottom);
        // Add moved-to-bottom class if task has been moved
        if (task.movedToBottom) {
            div.classList.add('moved-to-bottom');
            console.log('Added moved-to-bottom class');
        }
    }

    // Bullet point (clickable)
    const bullet = document.createElement('span');
    bullet.className = 'task-bullet';
    bullet.onclick = () => toggleTask(listId, task.id);

    // Make task draggable (only if not completed)
    if (!task.completed) {
        div.draggable = true;
        div.setAttribute('data-task-id', task.id);
        div.setAttribute('data-list-id', listId);

        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', JSON.stringify({ taskId: task.id, listId: listId }));
            div.classList.add('dragging');
            console.log('Drag started for task:', task.text);
        });

        div.addEventListener('dragend', () => {
            div.classList.remove('dragging');
            console.log('Drag ended');
        });
    }

    // Task text
    const textSpan = document.createElement('span');
    textSpan.className = 'task-text-simple';
    textSpan.textContent = task.text;
    textSpan.setAttribute('data-original-text', task.text);

    // Single click to toggle completion (strike through)
    textSpan.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTask(listId, task.id);
    });

    // Double click to make editable inline
    textSpan.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        makeTaskEditable(textSpan, task, listId);
    });

    // Right arrow button to open details popup
    const arrowBtn = document.createElement('button');
    arrowBtn.className = 'task-arrow-btn';
    arrowBtn.textContent = '→';
    arrowBtn.onclick = (e) => {
        e.stopPropagation();
        openTaskDetailsPopup(task, listId, div);
    };

    div.appendChild(bullet);
    div.appendChild(textSpan);
    div.appendChild(arrowBtn);

    return div;
}

// ===== TASK ACTIONS =====
// Make task text editable inline
function makeTaskEditable(textSpan, task, listId) {
    const originalText = textSpan.textContent;

    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    input.className = 'task-text-edit-input';
    input.style.width = '100%';
    input.style.font = 'inherit';
    input.style.border = 'none';
    input.style.background = 'transparent';
    input.style.outline = 'none';
    input.style.padding = '0';

    // Replace span with input
    textSpan.textContent = '';
    textSpan.appendChild(input);
    input.focus();
    input.select();

    // Save on Enter
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newText = input.value.trim();
            if (newText && newText !== originalText) {
                task.text = newText;
                saveData();
            }
            textSpan.textContent = task.text;
            textSpan.setAttribute('data-original-text', task.text);
        } else if (e.key === 'Escape') {
            // Cancel on Escape
            textSpan.textContent = originalText;
        }
    });

    // Save on blur (clicking outside)
    input.addEventListener('blur', () => {
        const newText = input.value.trim();
        if (newText && newText !== originalText) {
            task.text = newText;
            saveData();
        }
        textSpan.textContent = task.text;
        textSpan.setAttribute('data-original-text', task.text);
    });
}

// Open task details popup
function openTaskDetailsPopup(task, listId, taskElement) {
    // Remove any existing popup
    const existingPopup = document.querySelector('.task-details-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    // Create popup overlay
    const popup = document.createElement('div');
    popup.className = 'task-details-popup';

    // Create popup content
    const popupContent = document.createElement('div');
    popupContent.className = 'task-details-content';

    // Close button (X)
    const closeBtn = document.createElement('button');
    closeBtn.className = 'task-details-close';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => {
        popup.classList.remove('active');
        setTimeout(() => popup.remove(), 300);
    };

    // Title
    const title = document.createElement('h3');
    title.textContent = 'Task Details';
    title.style.marginBottom = '20px';

    // Task name field
    const nameLabel = document.createElement('label');
    nameLabel.className = 'task-detail-label';
    nameLabel.textContent = 'Task Name:';
    const nameInput = document.createElement('input');
    nameInput.className = 'task-detail-input';
    nameInput.type = 'text';
    nameInput.value = task.text;

    // Tags field
    const tagsLabel = document.createElement('label');
    tagsLabel.className = 'task-detail-label';
    tagsLabel.textContent = 'Tags (comma-separated):';
    const tagsInput = document.createElement('input');
    tagsInput.className = 'task-detail-input';
    tagsInput.type = 'text';
    tagsInput.value = task.tags ? task.tags.join(', ') : '';

    // Project field
    const projectLabel = document.createElement('label');
    projectLabel.className = 'task-detail-label';
    projectLabel.textContent = 'Project:';
    const projectInput = document.createElement('input');
    projectInput.className = 'task-detail-input';
    projectInput.type = 'text';
    projectInput.value = task.project || '';

    // Category field
    const categoryLabel = document.createElement('label');
    categoryLabel.className = 'task-detail-label';
    categoryLabel.textContent = 'Category:';
    const categoryInput = document.createElement('input');
    categoryInput.className = 'task-detail-input';
    categoryInput.type = 'text';
    categoryInput.value = task.category || '';

    // Due date field
    const dueDateLabel = document.createElement('label');
    dueDateLabel.className = 'task-detail-label';
    dueDateLabel.textContent = 'Due Date:';
    const dueDateInput = document.createElement('input');
    dueDateInput.className = 'task-detail-input';
    dueDateInput.type = 'date';
    if (task.dueDate) {
        dueDateInput.value = task.dueDate.split('T')[0];
    }

    // Save button (right arrow)
    const saveBtn = document.createElement('button');
    saveBtn.className = 'task-details-save';
    saveBtn.textContent = '→';
    saveBtn.onclick = () => {
        // Save all changes
        task.text = nameInput.value.trim();
        task.tags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t);
        task.project = projectInput.value.trim() || null;
        task.category = categoryInput.value.trim() || null;
        task.dueDate = dueDateInput.value ? new Date(dueDateInput.value).toISOString() : null;

        saveData();
        renderTasks();

        popup.classList.remove('active');
        setTimeout(() => popup.remove(), 300);
    };

    // Assemble popup
    popupContent.appendChild(closeBtn);
    popupContent.appendChild(title);
    popupContent.appendChild(nameLabel);
    popupContent.appendChild(nameInput);
    popupContent.appendChild(tagsLabel);
    popupContent.appendChild(tagsInput);
    popupContent.appendChild(projectLabel);
    popupContent.appendChild(projectInput);
    popupContent.appendChild(categoryLabel);
    popupContent.appendChild(categoryInput);
    popupContent.appendChild(dueDateLabel);
    popupContent.appendChild(dueDateInput);
    popupContent.appendChild(saveBtn);

    popup.appendChild(popupContent);
    document.body.appendChild(popup);

    // Trigger animation
    setTimeout(() => popup.classList.add('active'), 10);
}

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

// ===== EDIT LISTS POPUP =====
function openEditListsPopup() {
    // Remove any existing popup
    const existingPopup = document.querySelector('.edit-lists-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    // Create popup overlay
    const popup = document.createElement('div');
    popup.className = 'edit-lists-popup';

    // Create popup content
    const popupContent = document.createElement('div');
    popupContent.className = 'edit-lists-content';

    // Close button (X)
    const closeBtn = document.createElement('button');
    closeBtn.className = 'task-details-close';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => {
        popup.classList.remove('active');
        setTimeout(() => popup.remove(), 300);
    };

    // Title
    const title = document.createElement('h3');
    title.textContent = 'Edit Lists';
    title.style.marginBottom = '20px';

    // Lists container
    const listsContainer = document.createElement('div');
    listsContainer.className = 'edit-lists-container';
    listsContainer.style.marginBottom = '80px';

    // Render all lists
    lists.forEach(list => {
        const listItem = createEditListItem(list, popup);
        listsContainer.appendChild(listItem);
    });

    // Merge Lists Section
    const mergeSection = document.createElement('div');
    mergeSection.className = 'merge-lists-section';
    mergeSection.style.marginTop = '30px';
    mergeSection.style.paddingTop = '30px';
    mergeSection.style.borderTop = '1px dotted #ccc';

    const mergeTitle = document.createElement('h4');
    mergeTitle.textContent = 'Merge Lists';
    mergeTitle.style.marginBottom = '15px';

    const mergeLabel1 = document.createElement('label');
    mergeLabel1.className = 'task-detail-label';
    mergeLabel1.textContent = 'Select First List:';

    const mergeSelect1 = document.createElement('select');
    mergeSelect1.className = 'task-detail-input';
    mergeSelect1.id = 'merge-select-1';

    const mergeLabel2 = document.createElement('label');
    mergeLabel2.className = 'task-detail-label';
    mergeLabel2.textContent = 'Select Second List:';

    const mergeSelect2 = document.createElement('select');
    mergeSelect2.className = 'task-detail-input';
    mergeSelect2.id = 'merge-select-2';

    // Populate select dropdowns
    lists.forEach(list => {
        const option1 = document.createElement('option');
        option1.value = list.id;
        option1.textContent = list.name;
        mergeSelect1.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = list.id;
        option2.textContent = list.name;
        mergeSelect2.appendChild(option2);
    });

    const mergeBtn = document.createElement('button');
    mergeBtn.className = 'edit-modal-save';
    mergeBtn.textContent = 'Merge';
    mergeBtn.style.marginTop = '15px';
    mergeBtn.onclick = () => initiateMerge(mergeSelect1.value, mergeSelect2.value, popup);

    mergeSection.appendChild(mergeTitle);
    mergeSection.appendChild(mergeLabel1);
    mergeSection.appendChild(mergeSelect1);
    mergeSection.appendChild(mergeLabel2);
    mergeSection.appendChild(mergeSelect2);
    mergeSection.appendChild(mergeBtn);

    // Save button (right arrow)
    const saveBtn = document.createElement('button');
    saveBtn.className = 'task-details-save';
    saveBtn.textContent = '→';
    saveBtn.onclick = () => {
        saveData();
        renderListsNav();
        popup.classList.remove('active');
        setTimeout(() => popup.remove(), 300);
    };

    // Assemble popup
    popupContent.appendChild(closeBtn);
    popupContent.appendChild(title);
    popupContent.appendChild(listsContainer);
    popupContent.appendChild(mergeSection);
    popupContent.appendChild(saveBtn);

    popup.appendChild(popupContent);
    document.body.appendChild(popup);

    // Trigger animation
    setTimeout(() => popup.classList.add('active'), 10);
}

function createEditListItem(list, popup) {
    const div = document.createElement('div');
    div.className = 'edit-list-item';
    div.style.marginBottom = '20px';
    div.style.paddingBottom = '15px';
    div.style.borderBottom = '1px dotted #ccc';

    // List name (editable)
    const nameLabel = document.createElement('label');
    nameLabel.className = 'task-detail-label';
    nameLabel.textContent = 'List Name:';

    const nameInput = document.createElement('input');
    nameInput.className = 'task-detail-input';
    nameInput.type = 'text';
    nameInput.value = list.name;
    nameInput.onchange = () => {
        list.name = nameInput.value.trim();
    };

    // Category
    const categoryLabel = document.createElement('label');
    categoryLabel.className = 'task-detail-label';
    categoryLabel.textContent = 'Category:';

    const categoryInput = document.createElement('input');
    categoryInput.className = 'task-detail-input';
    categoryInput.type = 'text';
    categoryInput.value = list.category || '';
    categoryInput.onchange = () => {
        list.category = categoryInput.value.trim() || null;
    };

    // Associated Projects
    const projectsLabel = document.createElement('label');
    projectsLabel.className = 'task-detail-label';
    projectsLabel.textContent = 'Associated Projects (comma-separated):';

    const projectsInput = document.createElement('input');
    projectsInput.className = 'task-detail-input';
    projectsInput.type = 'text';
    projectsInput.value = list.projects ? list.projects.join(', ') : '';
    projectsInput.onchange = () => {
        list.projects = projectsInput.value.split(',').map(p => p.trim()).filter(p => p);
    };

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'edit-modal-save';
    deleteBtn.textContent = 'Delete List';
    deleteBtn.style.backgroundColor = '#f44336';
    deleteBtn.style.marginTop = '10px';
    deleteBtn.onclick = () => {
        if (confirm(`Delete list "${list.name}"? This will move it to the archive.`)) {
            deleteListToArchive(list.id);
            popup.classList.remove('active');
            setTimeout(() => popup.remove(), 300);
        }
    };

    div.appendChild(nameLabel);
    div.appendChild(nameInput);
    div.appendChild(categoryLabel);
    div.appendChild(categoryInput);
    div.appendChild(projectsLabel);
    div.appendChild(projectsInput);
    div.appendChild(deleteBtn);

    return div;
}

function deleteListToArchive(listId) {
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    // Get archived lists
    let archivedLists = [];
    const savedArchivedLists = localStorage.getItem('rdm_archived_lists');
    if (savedArchivedLists) {
        try {
            archivedLists = JSON.parse(savedArchivedLists);
        } catch (e) {
            console.error('Error loading archived lists:', e);
        }
    }

    // Add to archived lists
    archivedLists.push({
        ...list,
        archivedDate: new Date().toISOString()
    });

    localStorage.setItem('rdm_archived_lists', JSON.stringify(archivedLists));

    // Remove from active lists
    lists = lists.filter(l => l.id !== listId);
    saveData();
    renderListsNav();

    // If this was the current list, switch to "all"
    if (currentListId === listId) {
        selectList('all');
    }

    renderTasks();
}

function initiateMerge(list1Id, list2Id, popup) {
    const list1 = lists.find(l => l.id === parseInt(list1Id));
    const list2 = lists.find(l => l.id === parseInt(list2Id));

    if (!list1 || !list2) {
        alert('Please select two valid lists');
        return;
    }

    if (list1.id === list2.id) {
        alert('Please select two different lists');
        return;
    }

    // Show merge name input
    const mergeNameDiv = document.createElement('div');
    mergeNameDiv.style.marginTop = '20px';

    const mergeNameLabel = document.createElement('label');
    mergeNameLabel.className = 'task-detail-label';
    mergeNameLabel.textContent = 'New List Title:';

    const mergeNameInput = document.createElement('input');
    mergeNameInput.className = 'task-detail-input';
    mergeNameInput.type = 'text';
    mergeNameInput.value = `${list1.name} + ${list2.name}`;

    const confirmMergeBtn = document.createElement('button');
    confirmMergeBtn.className = 'edit-modal-save';
    confirmMergeBtn.textContent = 'Confirm Merge';
    confirmMergeBtn.style.marginTop = '10px';
    confirmMergeBtn.onclick = () => {
        const newName = mergeNameInput.value.trim();
        if (!newName) {
            alert('Please enter a name for the merged list');
            return;
        }

        performMerge(list1.id, list2.id, newName);
        popup.classList.remove('active');
        setTimeout(() => popup.remove(), 300);
    };

    mergeNameDiv.appendChild(mergeNameLabel);
    mergeNameDiv.appendChild(mergeNameInput);
    mergeNameDiv.appendChild(confirmMergeBtn);

    // Find merge section and append
    const mergeSection = popup.querySelector('.merge-lists-section');
    mergeSection.appendChild(mergeNameDiv);
}

function performMerge(list1Id, list2Id, newName) {
    const list1 = lists.find(l => l.id === list1Id);
    const list2 = lists.find(l => l.id === list2Id);

    if (!list1 || !list2) return;

    // Create new merged list
    const mergedList = {
        id: generateId(),
        name: newName,
        tasks: [...list1.tasks, ...list2.tasks],
        category: list1.category || list2.category || null,
        projects: [...(list1.projects || []), ...(list2.projects || [])]
    };

    // Update assignedListId for all tasks
    mergedList.tasks.forEach(task => {
        task.assignedListId = mergedList.id;
    });

    // Remove old lists and add new one
    lists = lists.filter(l => l.id !== list1Id && l.id !== list2Id);
    lists.unshift(mergedList);

    saveData();
    renderListsNav();
    selectList(mergedList.id);
    renderTasks();

    alert(`Successfully merged "${list1.name}" and "${list2.name}" into "${newName}"`);
}

// ===== EVENT LISTENERS =====
addListBtn.addEventListener('click', addList);

// Edit Lists button
const editListsBtn = document.getElementById('edit-lists-btn');
if (editListsBtn) {
    editListsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openEditListsPopup();
    });
}

// Add event listener only if element exists
if (newTaskInput) {
    console.log('Event listener attached to newTaskInput');

    newTaskInput.addEventListener('keypress', (e) => {
        console.log('Key pressed:', e.key);
        if (e.key === 'Enter') {
            console.log('Enter key detected, calling addTask');
            e.preventDefault();
            addTask();
        }
    });

    // Also add blur event to test
    newTaskInput.addEventListener('focus', () => {
        console.log('Input focused!');
    });
} else {
    console.error('newTaskInput element not found when setting up event listeners!');
}

// Export function for navigation
window.navigateToPage = navigateToPage;
