// ===== GLOBAL TASK MANAGEMENT =====
// This module provides centralized task management across all pages

const GlobalTasks = {
    // Get all lists from localStorage
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
    },

    // Get all tasks from all lists
    getAllTasks() {
        const lists = this.getLists();
        const allTasks = [];

        lists.forEach(list => {
            list.tasks.forEach(task => {
                allTasks.push({
                    ...task,
                    listId: list.id,
                    listName: list.name
                });
            });
        });

        return allTasks;
    },

    // Get tasks from archive
    getArchivedTasks() {
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
    },

    // Get tasks from abyss
    getAbyssTasks() {
        const savedAbyss = localStorage.getItem('rdm_abyss');
        if (savedAbyss) {
            try {
                return JSON.parse(savedAbyss);
            } catch (e) {
                console.error('Error loading abyss:', e);
                return [];
            }
        }
        return [];
    },

    // Get all tasks including archived and abyss
    getAllTasksIncludingSpecial() {
        return [
            ...this.getAllTasks(),
            ...this.getArchivedTasks().map(t => ({ ...t, archived: true })),
            ...this.getAbyssTasks().map(t => ({ ...t, inAbyss: true }))
        ];
    },

    // Get tasks created this week
    getTasksCreatedThisWeek() {
        const allTasks = this.getAllTasks();
        const weekStart = this.getStartOfWeek();

        return allTasks.filter(task => {
            if (!task.createdDate) return false;
            const createdDate = new Date(task.createdDate);
            return createdDate >= weekStart;
        });
    },

    // Get tasks due this week
    getTasksDueThisWeek() {
        const allTasks = this.getAllTasks();
        const weekStart = this.getStartOfWeek();
        const weekEnd = this.getEndOfWeek();

        return allTasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate >= weekStart && dueDate <= weekEnd;
        });
    },

    // Get tasks created OR due this week
    getThisWeekTasks() {
        const createdThisWeek = this.getTasksCreatedThisWeek();
        const dueThisWeek = this.getTasksDueThisWeek();

        // Combine and remove duplicates
        const taskMap = new Map();

        [...createdThisWeek, ...dueThisWeek].forEach(task => {
            taskMap.set(task.id, task);
        });

        return Array.from(taskMap.values());
    },

    // Helper: Get start of current week (Sunday)
    getStartOfWeek() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek;
        const weekStart = new Date(now.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    },

    // Helper: Get end of current week (Saturday)
    getEndOfWeek() {
        const weekStart = this.getStartOfWeek();
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return weekEnd;
    },

    // Helper: Check if a date is this week
    isThisWeek(date) {
        if (!date) return false;
        const targetDate = new Date(date);
        const weekStart = this.getStartOfWeek();
        const weekEnd = this.getEndOfWeek();
        return targetDate >= weekStart && targetDate <= weekEnd;
    },

    // Find a specific task by ID across all lists
    findTask(taskId) {
        const lists = this.getLists();

        for (const list of lists) {
            const task = list.tasks.find(t => t.id === taskId);
            if (task) {
                return {
                    task,
                    listId: list.id,
                    listName: list.name
                };
            }
        }

        return null;
    }
};

// Make GlobalTasks available globally
window.GlobalTasks = GlobalTasks;
