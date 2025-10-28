// ===== THEME LOADER =====
// This script loads the saved theme on page load
// Include this script in all HTML pages to maintain consistent theming

(function() {
    function loadTheme() {
        let savedTheme = localStorage.getItem('rdm_theme');

        // If no theme is saved, set default to 'lined'
        if (!savedTheme) {
            savedTheme = 'lined';
            localStorage.setItem('rdm_theme', savedTheme);
        }

        document.body.setAttribute('data-theme', savedTheme);
        console.log('Theme loaded:', savedTheme);
        console.log('Body has data-theme:', document.body.getAttribute('data-theme'));
    }

    // Load theme immediately when script runs
    if (document.body) {
        loadTheme();
    } else {
        // If body doesn't exist yet, wait for DOMContentLoaded
        document.addEventListener('DOMContentLoaded', loadTheme);
    }
})();
