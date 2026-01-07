// -----------------------------
// Todo Application Main Logic
// -----------------------------

document.addEventListener('DOMContentLoaded', function() {
    const currentUser = storage.getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('loggedInUser').textContent = currentUser.username;

    initTodoApp();
    loadTasks();
    updateStats();
    setupEventListeners();
});

// -----------------------------
// Initialize Todo App
// -----------------------------
function initTodoApp() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const sectionId = this.dataset.section;
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show the selected section
            const sectionToShow = document.getElementById(sectionId);
            if (sectionToShow) {
                sectionToShow.classList.add('active');
            }
        });
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                storage.clearCurrentUser();
                window.location.href = 'index.html';
            }
        });
    }

    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterTasks(this.dataset.filter);
        });
    });
}

// -----------------------------
// Setup Event Listeners
// -----------------------------
function setupEventListeners() {
    const addTaskForm = document.getElementById('addTaskForm');
    console.log('Add Task Form:', addTaskForm); // Debug log
    
    if (addTaskForm) {
        // Remove any previous event listeners
        const newForm = addTaskForm.cloneNode(true);
        addTaskForm.parentNode.replaceChild(newForm, addTaskForm);
        
        // Add submit event listener
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Form submit triggered');
            handleAddTask();
        });
    } else {
        console.error('Add Task Form not found!');
    }

    const closeModal = document.querySelector('.close-modal');
    const modal = document.getElementById('editModal');

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Event delegation for task actions
    const tasksList = document.getElementById('tasksList');
    if (tasksList) {
        tasksList.addEventListener('click', function(e) {
            if (e.target.closest('.task-checkbox')) {
                handleTaskToggle(e);
            }
            if (e.target.closest('.task-btn.edit')) {
                handleEditTask(e);
            }
            if (e.target.closest('.task-btn.delete')) {
                handleDeleteTask(e);
            }
        });
    }
}

// -----------------------------
// Load Tasks
// -----------------------------
function loadTasks() {
    const currentUser = storage.getCurrentUser();
    if (!currentUser) return;
    
    const tasks = storage.getTasks(currentUser.id);
    const tasksList = document.getElementById('tasksList');

    if (!tasks || tasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>No tasks yet</h3>
                <p>Add your first task to get started!</p>
            </div>
        `;
        return;
    }

    // Sort tasks: incomplete first, then by due date
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
        }
        return 0;
    });

    tasksList.innerHTML = sortedTasks.map(task => createTaskElement(task)).join('');
}

// -----------------------------
// Create Task Element
// -----------------------------
function createTaskElement(task) {
    const priorityClass = task.priority;
    const completedClass = task.completed ? 'completed' : '';
    
    // Format due date
    let dueDateText = 'No due date';
    if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (!isNaN(dueDate.getTime())) {
            dueDateText = dueDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        }
    }

    return `
        <div class="task-item-card ${completedClass}" data-task-id="${task.id}">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}">
                ${task.completed ? '<i class="fas fa-check"></i>' : ''}
            </div>
            <div class="task-content">
                <h3>${escapeHtml(task.title)}</h3>
                ${task.description ? `<p>${escapeHtml(task.description)}</p>` : ''}
                <div class="task-meta">
                    <span class="priority ${priorityClass}">${task.priority}</span>
                    <span><i class="fas fa-tag"></i> ${escapeHtml(task.category)}</span>
                    <span><i class="fas fa-calendar"></i> ${dueDateText}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn edit" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="task-btn delete" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
}

// -----------------------------
// Add Task - SIMPLIFIED AND FIXED
// -----------------------------
function handleAddTask() {
    console.log('handleAddTask called'); // Debug log
    
    const currentUser = storage.getCurrentUser();
    if (!currentUser) {
        showNotification('Please login again', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    // Get form values
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const category = document.getElementById('taskCategory').value.trim() || 'General';
    
    console.log('Form values:', { title, description, priority, dueDate, category }); // Debug log

    // Validate
    if (!title) {
        showNotification('Task title is required', 'error');
        document.getElementById('taskTitle').focus();
        return;
    }

    // Create task data
    const taskData = {
        title: title,
        description: description,
        priority: priority,
        dueDate: dueDate || null,
        category: category
    };
    
    console.log('Task data to save:', taskData); // Debug log

    try {
        // Add task to storage
        storage.addTask(currentUser.id, taskData);
        
        // Reset form
        document.getElementById('addTaskForm').reset();
        
        // Reload tasks
        loadTasks();
        
        // Update stats
        updateStats();
        
        // Show success message
        showNotification('Task added successfully!', 'success');
        
        // Switch to tasks section
        const tasksNav = document.querySelector('.nav-item[data-section="tasksSection"]');
        if (tasksNav) {
            tasksNav.click();
        }
        
        // Focus back to title for quick adding
        document.getElementById('taskTitle').focus();
        
    } catch (error) {
        console.error('Error adding task:', error);
        showNotification('Error adding task', 'error');
    }
}

// -----------------------------
// Toggle Task Completion
// -----------------------------
function handleTaskToggle(e) {
    const taskCard = e.target.closest('.task-item-card');
    if (!taskCard) return;
    
    const taskId = taskCard.dataset.taskId;
    const currentUser = storage.getCurrentUser();
    if (!currentUser) return;
    
    const updatedTask = storage.toggleTaskCompletion(currentUser.id, taskId);

    if (updatedTask) {
        const checkbox = taskCard.querySelector('.task-checkbox');
        if (updatedTask.completed) {
            checkbox.classList.add('checked');
            checkbox.innerHTML = '<i class="fas fa-check"></i>';
            taskCard.classList.add('completed');
            showNotification('Task completed!', 'success');
        } else {
            checkbox.classList.remove('checked');
            checkbox.innerHTML = '';
            taskCard.classList.remove('completed');
            showNotification('Task marked as pending', 'info');
        }
        updateStats();
    }
}

// -----------------------------
// Edit Task
// -----------------------------
function handleEditTask(e) {
    const taskCard = e.target.closest('.task-item-card');
    if (!taskCard) return;
    
    const taskId = taskCard.dataset.taskId;
    const currentUser = storage.getCurrentUser();
    if (!currentUser) return;
    
    const task = storage.getTasks(currentUser.id).find(t => t.id === taskId);
    if (!task) return;

    const editForm = document.getElementById('editTaskForm');
    
    // Format date for input field
    const dueDateValue = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
    
    editForm.innerHTML = `
        <div class="form-group">
            <label for="editTitle">Task Title *</label>
            <input type="text" id="editTitle" value="${escapeHtml(task.title)}" required>
        </div>
        <div class="form-group">
            <label for="editDescription">Description</label>
            <textarea id="editDescription" rows="3">${escapeHtml(task.description)}</textarea>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="editPriority">Priority</label>
                <select id="editPriority">
                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                    <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
                </select>
            </div>
            <div class="form-group">
                <label for="editDueDate">Due Date</label>
                <input type="date" id="editDueDate" value="${dueDateValue}">
            </div>
        </div>
        <div class="form-group">
            <label for="editCategory">Category</label>
            <input type="text" id="editCategory" value="${escapeHtml(task.category)}">
        </div>
        <div class="form-buttons">
            <button type="button" class="btn btn-cancel" onclick="document.getElementById('editModal').style.display='none'">Cancel</button>
            <button type="submit" class="btn btn-submit">Update Task</button>
        </div>
    `;

    const modal = document.getElementById('editModal');
    modal.style.display = 'flex';

    // Handle form submission
    editForm.onsubmit = (ev) => {
        ev.preventDefault();
        
        const updates = {
            title: document.getElementById('editTitle').value.trim(),
            description: document.getElementById('editDescription').value.trim(),
            priority: document.getElementById('editPriority').value,
            dueDate: document.getElementById('editDueDate').value || null,
            category: document.getElementById('editCategory').value.trim() || 'General'
        };

        if (!updates.title) {
            showNotification('Task title is required', 'error');
            return;
        }

        storage.updateTask(currentUser.id, taskId, updates);
        loadTasks();
        updateStats();
        modal.style.display = 'none';
        showNotification('Task updated successfully!', 'success');
    };
}

// -----------------------------
// Delete Task
// -----------------------------
function handleDeleteTask(e) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    const taskCard = e.target.closest('.task-item-card');
    if (!taskCard) return;
    
    const taskId = taskCard.dataset.taskId;
    const currentUser = storage.getCurrentUser();
    if (!currentUser) return;
    
    storage.deleteTask(currentUser.id, taskId);

    // Animation for deletion
    taskCard.style.transform = 'translateX(100%)';
    taskCard.style.opacity = '0';
    setTimeout(() => {
        loadTasks();
        updateStats();
        showNotification('Task deleted successfully!', 'success');
    }, 300);
}

// -----------------------------
// Filter Tasks
// -----------------------------
function filterTasks(filter) {
    const tasks = document.querySelectorAll('.task-item-card');
    tasks.forEach(task => {
        switch(filter) {
            case 'pending':
                task.style.display = task.classList.contains('completed') ? 'none' : 'flex';
                break;
            case 'completed':
                task.style.display = task.classList.contains('completed') ? 'flex' : 'none';
                break;
            default: // 'all'
                task.style.display = 'flex';
        }
    });
}

// -----------------------------
// Update Stats & Charts
// -----------------------------
function updateStats() {
    const currentUser = storage.getCurrentUser();
    if (!currentUser) return;
    
    const stats = storage.getTaskStats(currentUser.id);

    // Update dashboard stats
    document.getElementById('totalTasks').textContent = stats.total;
    document.getElementById('completedTasks').textContent = stats.todayCompleted;
    document.getElementById('totalTodayTasks').textContent = stats.todayTotal;

    // Update progress bar
    const progress = stats.todayTotal > 0 ? (stats.todayCompleted / stats.todayTotal) * 100 : 0;
    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = `${progress}%`;
    progressFill.textContent = `${Math.round(progress)}%`;

    // Update report stats
    document.getElementById('reportTotalTasks').textContent = stats.total;
    document.getElementById('reportCompletedTasks').textContent = stats.completed;
    document.getElementById('reportPendingTasks').textContent = stats.pending;
    document.getElementById('reportHighPriority').textContent = stats.highPriority;

    // Update completion chart
    const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
    const chartFill = document.querySelector('.chart-fill');
    const chartPercentage = document.getElementById('completionPercentage');
    if (chartFill) {
        chartFill.style.width = `${completionRate}%`;
    }
    if (chartPercentage) {
        chartPercentage.textContent = `${Math.round(completionRate)}%`;
    }
}

// -----------------------------
// Utility Functions
// -----------------------------
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Add icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${escapeHtml(message)}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Auto remove
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// -----------------------------
// Add CSS for Notifications
// -----------------------------
const notificationCSS = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 1000;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 350px;
    }
    
    .notification.show {
        transform: translateX(0);
        opacity: 1;
    }
    
    .notification.success {
        background: #10b981;
        border-left: 4px solid #059669;
    }
    
    .notification.error {
        background: #ef4444;
        border-left: 4px solid #dc2626;
    }
    
    .notification.info {
        background: #3b82f6;
        border-left: 4px solid #2563eb;
    }
    
    .notification i {
        font-size: 1.2em;
    }
`;

// Add notification CSS to the page
const style = document.createElement('style');
style.textContent = notificationCSS;
document.head.appendChild(style);