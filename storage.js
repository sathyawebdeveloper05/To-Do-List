// storage.js
const storage = {
    getCurrentUser: () => {
        try {
            return JSON.parse(localStorage.getItem('currentUser') || null);
        } catch (error) {
            console.error('Error parsing current user:', error);
            return null;
        }
    },
    
    clearCurrentUser: () => {
        localStorage.removeItem('currentUser');
    },
    
    getTasks: (userId) => {
        try {
            const allTasks = JSON.parse(localStorage.getItem('tasks') || '{}');
            return allTasks[userId] || [];
        } catch (error) {
            console.error('Error parsing tasks:', error);
            return [];
        }
    },
    
    saveTasks: (userId, tasks) => {
        try {
            const allTasks = JSON.parse(localStorage.getItem('tasks') || '{}');
            allTasks[userId] = tasks;
            localStorage.setItem('tasks', JSON.stringify(allTasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    },
    
    addTask: (userId, taskData) => {
        const tasks = storage.getTasks(userId);
        const newTask = { 
            id: Date.now().toString(),
            completed: false,
            createdAt: new Date().toISOString(),
            ...taskData 
        };
        tasks.push(newTask);
        storage.saveTasks(userId, tasks);
        return newTask;
    },
    
    toggleTaskCompletion: (userId, taskId) => {
        const tasks = storage.getTasks(userId);
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return null;
        
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        tasks[taskIndex].updatedAt = new Date().toISOString();
        storage.saveTasks(userId, tasks);
        return tasks[taskIndex];
    },
    
    updateTask: (userId, taskId, updates) => {
        const tasks = storage.getTasks(userId);
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return null;
        
        Object.assign(tasks[taskIndex], updates, { updatedAt: new Date().toISOString() });
        storage.saveTasks(userId, tasks);
        return tasks[taskIndex];
    },
    
    deleteTask: (userId, taskId) => {
        let tasks = storage.getTasks(userId);
        tasks = tasks.filter(t => t.id !== taskId);
        storage.saveTasks(userId, tasks);
        return true;
    },
    
    getTaskStats: (userId) => {
        const tasks = storage.getTasks(userId);
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString().split('T')[0];
        
        const todayTasks = tasks.filter(t => {
            if (!t.dueDate) return false;
            const taskDate = new Date(t.dueDate);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() === today.getTime();
        });
        
        const todayTotal = todayTasks.length;
        const todayCompleted = todayTasks.filter(t => t.completed).length;

        const highPriority = tasks.filter(t => t.priority === 'high').length;

        return { 
            total, 
            completed, 
            pending, 
            todayTotal, 
            todayCompleted, 
            highPriority 
        };
    }
};