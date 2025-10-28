// ===== GLOBAL VARIABLES FOR PROJECTS AND CATEGORIES =====
// This module provides centralized management for projects and categories

const GlobalVars = {
    // Get all projects from localStorage
    getProjects() {
        const savedProjects = localStorage.getItem('rdm_projects');
        if (savedProjects) {
            try {
                return JSON.parse(savedProjects);
            } catch (e) {
                console.error('Error loading projects:', e);
                return [];
            }
        }
        return [];
    },

    // Save projects to localStorage
    saveProjects(projects) {
        localStorage.setItem('rdm_projects', JSON.stringify(projects));
    },

    // Add a new project
    addProject(projectName) {
        if (!projectName || !projectName.trim()) return false;

        const projects = this.getProjects();
        const trimmedName = projectName.trim();

        // Check if project already exists
        if (projects.includes(trimmedName)) {
            return false;
        }

        projects.push(trimmedName);
        this.saveProjects(projects);
        return true;
    },

    // Remove a project
    removeProject(projectName) {
        let projects = this.getProjects();
        projects = projects.filter(p => p !== projectName);
        this.saveProjects(projects);
    },

    // Get all categories from localStorage
    getCategories() {
        const savedCategories = localStorage.getItem('rdm_categories');
        if (savedCategories) {
            try {
                return JSON.parse(savedCategories);
            } catch (e) {
                console.error('Error loading categories:', e);
                return [];
            }
        }
        return [];
    },

    // Save categories to localStorage
    saveCategories(categories) {
        localStorage.setItem('rdm_categories', JSON.stringify(categories));
    },

    // Add a new category
    addCategory(categoryName) {
        if (!categoryName || !categoryName.trim()) return false;

        const categories = this.getCategories();
        const trimmedName = categoryName.trim();

        // Check if category already exists
        if (categories.includes(trimmedName)) {
            return false;
        }

        categories.push(trimmedName);
        this.saveCategories(categories);
        return true;
    },

    // Remove a category
    removeCategory(categoryName) {
        let categories = this.getCategories();
        categories = categories.filter(c => c !== categoryName);
        this.saveCategories(categories);
    }
};

// Make GlobalVars available globally
window.GlobalVars = GlobalVars;
