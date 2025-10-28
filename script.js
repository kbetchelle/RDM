// Timer State
let timerInterval = null;
let timeRemaining = 25 * 60; // Default 25 minutes in seconds
let isRunning = false;
let defaultTime = 25 * 60; // Store default time for reset

// DOM Elements
const timerInput = document.getElementById('timer-input');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const resetBtn = document.getElementById('reset-btn');
const selectedTextDisplay = document.getElementById('selected-text');
const listSelectBtn = document.getElementById('list-select-btn');
const listDropdown = document.getElementById('list-dropdown');
const randomTaskBtn = document.getElementById('random-task-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSelectedText();
    updateTimerDisplay();
    loadListsDropdown();
    updateListButtonText();
});

// Timer Functions
function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerInput.value = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function parseTimeInput(timeString) {
    // Parse MM:SS or M:SS format
    const parts = timeString.split(':');
    if (parts.length !== 2) return null;

    const minutes = parseInt(parts[0]);
    const seconds = parseInt(parts[1]);

    if (isNaN(minutes) || isNaN(seconds) || minutes < 0 || seconds < 0 || seconds >= 60) {
        return null;
    }

    return minutes * 60 + seconds;
}

function handleTimerInputChange() {
    // Only allow editing when timer is not running
    if (isRunning) return;

    const newTime = parseTimeInput(timerInput.value);

    if (newTime !== null && newTime > 0) {
        timeRemaining = newTime;
        defaultTime = newTime;
    } else {
        // Invalid input, restore previous value
        updateTimerDisplay();
    }
}

function startTimer() {
    if (!isRunning) {
        // Parse current input before starting
        handleTimerInputChange();

        isRunning = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        timerInput.disabled = true; // Disable editing while running

        timerInterval = setInterval(() => {
            if (timeRemaining > 0) {
                timeRemaining--;
                updateTimerDisplay();
            } else {
                // Timer finished
                stopTimer();
                playTimerFinishedAlert();
            }
        }, 1000);
    }
}

function stopTimer() {
    if (isRunning) {
        isRunning = false;
        clearInterval(timerInterval);
        startBtn.disabled = false;
        stopBtn.disabled = true;
        timerInput.disabled = false; // Re-enable editing
    }
}

function resetTimer() {
    stopTimer();
    timeRemaining = defaultTime;
    updateTimerDisplay();
}

function playTimerFinishedAlert() {
    // Visual alert
    timerInput.style.color = '#f44336';
    setTimeout(() => {
        timerInput.style.color = '#2c2c2c';
    }, 3000);

    // Audio alert (if supported)
    if (window.AudioContext || window.webkitAudioContext) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    alert('Timer finished!');
}

// Event Listeners
startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);

// Timer input change handlers
timerInput.addEventListener('blur', handleTimerInputChange);
timerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        timerInput.blur(); // Trigger blur event to validate and update
    }
});

// Prevent editing while timer is running
timerInput.addEventListener('focus', () => {
    if (isRunning) {
        timerInput.blur();
    }
});

// Selected Text Functions
function loadSelectedText() {
    const savedText = localStorage.getItem('selectedText');
    if (savedText) {
        selectedTextDisplay.textContent = savedText;
    } else {
        selectedTextDisplay.textContent = 'No task selected yet. Use the Random Decision Maker on the Lists page!';
    }
}

// Listen for storage changes (when lists page updates the selection)
window.addEventListener('storage', (e) => {
    if (e.key === 'selectedText') {
        selectedTextDisplay.textContent = e.newValue || 'No task selected yet. Use the Random Decision Maker on the Lists page!';
    }
});

// Also check for updates on page focus (in case navigation from lists page)
window.addEventListener('focus', () => {
    loadSelectedText();
});

// Save timer state to localStorage when page unloads
window.addEventListener('beforeunload', () => {
    if (isRunning) {
        localStorage.setItem('timerState', JSON.stringify({
            timeRemaining,
            isRunning,
            timestamp: Date.now()
        }));
    }
});

// Restore timer state if applicable
const savedTimerState = localStorage.getItem('timerState');
if (savedTimerState) {
    try {
        const state = JSON.parse(savedTimerState);
        const elapsed = Math.floor((Date.now() - state.timestamp) / 1000);

        if (state.isRunning && state.timeRemaining > elapsed) {
            timeRemaining = state.timeRemaining - elapsed;
            updateTimerDisplay();
            // Optionally auto-resume: startTimer();
        }

        localStorage.removeItem('timerState');
    } catch (e) {
        console.error('Error restoring timer state:', e);
    }
}

// ===== LIST SELECTION FUNCTIONALITY =====
let selectedListId = null;

function loadListsDropdown() {
    const lists = getLists();
    listDropdown.innerHTML = '';

    if (lists.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'list-dropdown-item';
        emptyDiv.textContent = 'No lists available';
        emptyDiv.style.cursor = 'default';
        emptyDiv.style.fontStyle = 'italic';
        listDropdown.appendChild(emptyDiv);
        return;
    }

    // Add "All Lists" option
    const allListsDiv = document.createElement('div');
    allListsDiv.className = 'list-dropdown-item';
    allListsDiv.textContent = 'All Lists';
    if (selectedListId === null) {
        allListsDiv.classList.add('selected');
    }
    allListsDiv.onclick = () => selectListFilter(null);
    listDropdown.appendChild(allListsDiv);

    // Add individual lists
    lists.forEach(list => {
        const listDiv = document.createElement('div');
        listDiv.className = 'list-dropdown-item';
        listDiv.textContent = list.name;
        if (selectedListId === list.id) {
            listDiv.classList.add('selected');
        }
        listDiv.onclick = () => selectListFilter(list.id);
        listDropdown.appendChild(listDiv);
    });
}

function getLists() {
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

function selectListFilter(listId) {
    selectedListId = listId;
    localStorage.setItem('selectedListFilter', listId === null ? '' : listId.toString());
    updateListButtonText();
    loadListsDropdown();
    toggleListDropdown();
}

function updateListButtonText() {
    const savedFilter = localStorage.getItem('selectedListFilter');
    if (savedFilter && savedFilter !== '') {
        selectedListId = parseInt(savedFilter);
        const lists = getLists();
        const list = lists.find(l => l.id === selectedListId);
        if (list) {
            listSelectBtn.textContent = `${list.name} ▼`;
        } else {
            listSelectBtn.textContent = 'All Lists ▼';
            selectedListId = null;
        }
    } else {
        listSelectBtn.textContent = 'All Lists ▼';
        selectedListId = null;
    }
}

function toggleListDropdown() {
    listDropdown.classList.toggle('active');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.list-selector')) {
        listDropdown.classList.remove('active');
    }
});

// List dropdown toggle
listSelectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleListDropdown();
});

// ===== RANDOM TASK SELECTION =====
function getRandomTask() {
    const lists = getLists();

    if (lists.length === 0) {
        alert('No lists found! Please create a list first on the Lists page.');
        return;
    }

    let availableTasks = [];

    if (selectedListId === null) {
        // Get tasks from all lists
        lists.forEach(list => {
            if (list.tasks) {
                const listTasks = list.tasks.filter(task =>
                    !task.completed && !isTaskBlocked(task, list.tasks)
                ).map(task => ({ ...task, listId: list.id }));
                availableTasks.push(...listTasks);
            }
        });
    } else {
        // Get tasks from selected list only
        const list = lists.find(l => l.id === selectedListId);
        if (list && list.tasks) {
            availableTasks = list.tasks.filter(task =>
                !task.completed && !isTaskBlocked(task, list.tasks)
            ).map(task => ({ ...task, listId: list.id }));
        }
    }

    if (availableTasks.length === 0) {
        const listName = selectedListId === null ? 'any list' :
            lists.find(l => l.id === selectedListId)?.name || 'the selected list';
        alert(`No available tasks found in ${listName}! All tasks are either completed or blocked by dependencies.`);
        return;
    }

    // Weighted random selection
    const selectedTask = weightedRandomSelect(availableTasks);

    if (selectedTask) {
        // Update display
        selectedTextDisplay.textContent = selectedTask.text;

        // Remove strikethrough if it was previously completed
        selectedTextDisplay.style.textDecoration = 'none';

        // Save to localStorage
        localStorage.setItem('selectedText', selectedTask.text);
        localStorage.setItem('selectedTaskId', selectedTask.id.toString());
        localStorage.setItem('selectedTaskListId', selectedTask.listId.toString());
    }
}

function isTaskBlocked(task, allTasks) {
    if (!task.dependencies || task.dependencies.length === 0) return false;

    // Check if any dependency is not completed
    return task.dependencies.some(depId => {
        const depTask = allTasks.find(t => t.id === depId);
        return depTask && !depTask.completed;
    });
}

function weightedRandomSelect(tasks) {
    if (tasks.length === 0) return null;

    // Calculate total weight
    const totalWeight = tasks.reduce((sum, task) => sum + (task.weight || 5), 0);

    // Generate random number
    let random = Math.random() * totalWeight;

    // Select task based on weight
    for (const task of tasks) {
        random -= (task.weight || 5);
        if (random <= 0) {
            return task;
        }
    }

    // Fallback
    return tasks[tasks.length - 1];
}

// Random task button
randomTaskBtn.addEventListener('click', getRandomTask);

// ===== GLOBAL DOUBLE-CLICK TO COMPLETE TASK =====
selectedTextDisplay.addEventListener('dblclick', () => {
    const taskId = localStorage.getItem('selectedTaskId');
    const listId = localStorage.getItem('selectedTaskListId');

    if (!taskId || !listId) {
        return; // No task selected
    }

    const lists = getLists();
    const list = lists.find(l => l.id === parseInt(listId));

    if (!list) return;

    const task = list.tasks.find(t => t.id === parseInt(taskId));

    if (!task) return;

    // Toggle completed status
    task.completed = !task.completed;

    // Update visual state
    if (task.completed) {
        selectedTextDisplay.style.textDecoration = 'line-through';
        selectedTextDisplay.style.opacity = '0.6';
    } else {
        selectedTextDisplay.style.textDecoration = 'none';
        selectedTextDisplay.style.opacity = '1';
    }

    // Save to localStorage
    localStorage.setItem('rdm_lists_simple', JSON.stringify(lists));

    // Trigger storage event for other pages/windows
    window.dispatchEvent(new StorageEvent('storage', {
        key: 'rdm_lists_simple',
        newValue: JSON.stringify(lists)
    }));
});
