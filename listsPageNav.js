// ===== LISTS PAGE NAVIGATION CLASS =====
// Adds conditional navigation options only on the Lists page

class ListsPageNavigation {
    constructor() {
        this.menuDropdown = null;
        this.init();
    }

    init() {
        // Only initialize if we're on the lists page
        if (!this.isListsPage()) return;

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupNavigation());
        } else {
            this.setupNavigation();
        }
    }

    isListsPage() {
        return window.location.pathname.includes('lists.html');
    }

    setupNavigation() {
        this.menuDropdown = document.querySelector('.menu-dropdown');
        if (!this.menuDropdown) return;

        // Add Edit Lists option
        const editListsItem = document.createElement('a');
        editListsItem.href = '#';
        editListsItem.className = 'menu-item';
        editListsItem.textContent = 'Edit Lists';
        editListsItem.onclick = (e) => {
            e.preventDefault();
            this.openEditListsModal();
        };

        // Add Edit Tasks option
        const editTasksItem = document.createElement('a');
        editTasksItem.href = '#';
        editTasksItem.className = 'menu-item';
        editTasksItem.textContent = 'Edit Tasks';
        editTasksItem.onclick = (e) => {
            e.preventDefault();
            this.openEditTasksModal();
        };

        // Insert after the existing menu items
        this.menuDropdown.appendChild(editListsItem);
        this.menuDropdown.appendChild(editTasksItem);
    }

    // ===== EDIT LISTS MODAL =====
    openEditListsModal() {
        const modal = document.createElement('div');
        modal.className = 'edit-modal-overlay';

        const modalContent = document.createElement('div');
        modalContent.className = 'edit-lists-modal-content';

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'edit-modal-close';
        closeBtn.textContent = '×';
        closeBtn.onclick = () => document.body.removeChild(modal);

        // Title
        const title = document.createElement('h2');
        title.className = 'edit-lists-title';
        title.textContent = 'Edit Lists';

        // Lists container
        const listsContainer = document.createElement('div');
        listsContainer.className = 'edit-lists-container';
        listsContainer.id = 'edit-lists-container';

        // Add List button
        const addListBtn = document.createElement('button');
        addListBtn.className = 'edit-lists-add-btn';
        addListBtn.textContent = '+ Add New List';
        addListBtn.onclick = () => this.addNewList(listsContainer);

        modalContent.appendChild(closeBtn);
        modalContent.appendChild(title);
        modalContent.appendChild(listsContainer);
        modalContent.appendChild(addListBtn);

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        this.renderEditLists(listsContainer);
    }

    renderEditLists(container) {
        container.innerHTML = '';
        const lists = this.getLists();

        lists.forEach(list => {
            const listItem = document.createElement('div');
            listItem.className = 'edit-list-item';

            // List name input
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'edit-list-name-input';
            nameInput.value = list.name;
            nameInput.onchange = () => this.renameList(list.id, nameInput.value);

            // Action buttons container
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'edit-list-actions';

            // Merge button
            const mergeBtn = document.createElement('button');
            mergeBtn.className = 'edit-list-btn edit-list-merge-btn';
            mergeBtn.textContent = 'Merge';
            mergeBtn.onclick = () => this.openMergeDialog(list);

            // Remove button
            const removeBtn = document.createElement('button');
            removeBtn.className = 'edit-list-btn edit-list-remove-btn';
            removeBtn.textContent = 'Remove';
            removeBtn.onclick = () => this.removeList(list.id, container);

            actionsDiv.appendChild(mergeBtn);
            actionsDiv.appendChild(removeBtn);

            listItem.appendChild(nameInput);
            listItem.appendChild(actionsDiv);
            container.appendChild(listItem);
        });
    }

    addNewList(container) {
        const lists = this.getLists();
        const newList = {
            id: Date.now() + Math.floor(Math.random() * 10000),
            name: 'New List',
            tasks: []
        };

        lists.unshift(newList);
        this.saveLists(lists);
        this.renderEditLists(container);

        // Refresh the main lists page if renderListsNav exists
        if (typeof renderListsNav === 'function') {
            renderListsNav();
        }
    }

    renameList(listId, newName) {
        const lists = this.getLists();
        const list = lists.find(l => l.id === listId);
        if (list) {
            list.name = newName.trim() || 'Unnamed List';
            this.saveLists(lists);

            // Refresh the main lists page
            if (typeof renderListsNav === 'function') {
                renderListsNav();
            }
        }
    }

    removeList(listId, container) {
        const lists = this.getLists();
        const list = lists.find(l => l.id === listId);

        if (!list) return;

        const confirmDelete = confirm(`Delete list "${list.name}" and all its tasks?`);
        if (confirmDelete) {
            const updatedLists = lists.filter(l => l.id !== listId);
            this.saveLists(updatedLists);
            this.renderEditLists(container);

            // Refresh the main lists page
            if (typeof renderListsNav === 'function') {
                renderListsNav();
                if (typeof currentListId !== 'undefined' && currentListId === listId) {
                    selectList('all');
                }
            }
        }
    }

    openMergeDialog(sourceList) {
        const lists = this.getLists().filter(l => l.id !== sourceList.id);

        if (lists.length === 0) {
            alert('No other lists to merge with.');
            return;
        }

        const listNames = lists.map(l => l.name).join('\n');
        const targetName = prompt(`Merge "${sourceList.name}" into which list?\n\nAvailable lists:\n${listNames}\n\nEnter the list name:`);

        if (!targetName) return;

        const targetList = lists.find(l => l.name.toLowerCase() === targetName.toLowerCase());

        if (!targetList) {
            alert('List not found.');
            return;
        }

        this.mergeLists(sourceList.id, targetList.id);
    }

    mergeLists(sourceId, targetId) {
        const lists = this.getLists();
        const sourceList = lists.find(l => l.id === sourceId);
        const targetList = lists.find(l => l.id === targetId);

        if (!sourceList || !targetList) return;

        // Move all tasks from source to target
        targetList.tasks.push(...sourceList.tasks);

        // Remove source list
        const updatedLists = lists.filter(l => l.id !== sourceId);
        this.saveLists(updatedLists);

        // Close modal and refresh
        document.querySelector('.edit-modal-overlay').remove();

        if (typeof renderListsNav === 'function') {
            renderListsNav();
            selectList(targetId);
        }

        alert(`Merged "${sourceList.name}" into "${targetList.name}"`);
    }

    // ===== EDIT TASKS MODAL =====
    openEditTasksModal() {
        const modal = document.createElement('div');
        modal.className = 'edit-modal-overlay';

        const modalContent = document.createElement('div');
        modalContent.className = 'edit-tasks-modal-content';

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'edit-modal-close';
        closeBtn.textContent = '×';
        closeBtn.onclick = () => document.body.removeChild(modal);

        // Title
        const title = document.createElement('h2');
        title.className = 'edit-tasks-title';
        title.textContent = 'Edit All Tasks';

        // Tasks container
        const tasksContainer = document.createElement('div');
        tasksContainer.className = 'edit-tasks-container';

        modalContent.appendChild(closeBtn);
        modalContent.appendChild(title);
        modalContent.appendChild(tasksContainer);

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        this.renderEditTasks(tasksContainer);
    }

    renderEditTasks(container) {
        container.innerHTML = '';
        const lists = this.getLists();

        // Organize tasks by list, showing only incomplete tasks
        lists.forEach(list => {
            const incompleteTasks = list.tasks
                .filter(task => !task.completed)
                .sort((a, b) => a.text.localeCompare(b.text)); // Alphabetical order

            if (incompleteTasks.length === 0) return;

            // List header
            const listHeader = document.createElement('div');
            listHeader.className = 'edit-tasks-list-header';
            listHeader.textContent = list.name;
            container.appendChild(listHeader);

            // Tasks for this list
            incompleteTasks.forEach(task => {
                const taskItem = document.createElement('div');
                taskItem.className = 'edit-task-item';

                // Task text input
                const taskInput = document.createElement('input');
                taskInput.type = 'text';
                taskInput.className = 'edit-task-input';
                taskInput.value = task.text;
                taskInput.onchange = () => this.updateTaskText(list.id, task.id, taskInput.value);

                // Due date input
                const dateInput = document.createElement('input');
                dateInput.type = 'date';
                dateInput.className = 'edit-task-date-input';
                if (task.dueDate) {
                    dateInput.value = task.dueDate.split('T')[0];
                }
                dateInput.onchange = () => this.updateTaskDueDate(list.id, task.id, dateInput.value);

                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'edit-task-delete-btn';
                deleteBtn.textContent = '×';
                deleteBtn.onclick = () => this.deleteTask(list.id, task.id, container);

                taskItem.appendChild(taskInput);
                taskItem.appendChild(dateInput);
                taskItem.appendChild(deleteBtn);
                container.appendChild(taskItem);
            });
        });

        if (container.children.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-message';
            emptyMsg.textContent = 'No incomplete tasks found.';
            container.appendChild(emptyMsg);
        }
    }

    updateTaskText(listId, taskId, newText) {
        const lists = this.getLists();
        const list = lists.find(l => l.id === listId);
        if (!list) return;

        const task = list.tasks.find(t => t.id === taskId);
        if (task) {
            task.text = newText.trim() || 'Untitled Task';
            this.saveLists(lists);

            // Refresh main page
            if (typeof renderTasks === 'function') {
                renderTasks();
            }
        }
    }

    updateTaskDueDate(listId, taskId, dateValue) {
        const lists = this.getLists();
        const list = lists.find(l => l.id === listId);
        if (!list) return;

        const task = list.tasks.find(t => t.id === taskId);
        if (task) {
            task.dueDate = dateValue ? new Date(dateValue).toISOString() : null;
            this.saveLists(lists);

            // Refresh main page
            if (typeof renderTasks === 'function') {
                renderTasks();
            }
        }
    }

    deleteTask(listId, taskId, container) {
        const lists = this.getLists();
        const list = lists.find(l => l.id === listId);
        if (!list) return;

        const taskIndex = list.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const confirmDelete = confirm('Delete this task?');
            if (confirmDelete) {
                list.tasks.splice(taskIndex, 1);
                this.saveLists(lists);
                this.renderEditTasks(container);

                // Refresh main page
                if (typeof renderTasks === 'function') {
                    renderTasks();
                }
            }
        }
    }

    // ===== HELPER METHODS =====
    getLists() {
        const savedLists = localStorage.getItem('rdm_lists_simple');
        if (savedLists) {
            try {
                return JSON.parse(savedLists);
            } catch (e) {
                console.error('Error loading lists:', e);
                return [];
            }
        }
        return [];
    }

    saveLists(lists) {
        localStorage.setItem('rdm_lists_simple', JSON.stringify(lists));
    }
}

// Initialize the Lists Page Navigation
new ListsPageNavigation();
