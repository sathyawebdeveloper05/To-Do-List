getWeeklyData: (userId) => {
    const tasks = storage.getTasks(userId);
    
    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6); // Last 7 days including today
    
    // Format dates for comparison
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);
    
    // Initialize data structure
    const dailyData = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize all days with zeros - in correct chronological order
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dayName = days[date.getDay()];
        dailyData[dayName] = { 
            added: 0, 
            completed: 0,
            date: formatDate(date)
        };
    }
    
    let totalAdded = 0;
    let totalCompleted = 0;
    const priorities = { high: 0, medium: 0, low: 0 };
    const categories = {};
    const recentTasks = [];
    
    // Process each task
    tasks.forEach(task => {
        const taskDate = new Date(task.createdAt || task.dueDate || Date.now());
        const taskDateStr = formatDate(taskDate);
        
        // Check if task was created within the last 7 days
        if (taskDateStr >= startDateStr && taskDateStr <= endDateStr) {
            const dayName = days[taskDate.getDay()];
            
            // Count added tasks
            dailyData[dayName].added++;
            totalAdded++;
            
            // Count completed tasks (if completed in the last 7 days)
            if (task.completed) {
                const completedDate = task.completedAt ? new Date(task.completedAt) : new Date();
                const completedDateStr = formatDate(completedDate);
                
                if (completedDateStr >= startDateStr && completedDateStr <= endDateStr) {
                    dailyData[dayName].completed++;
                    totalCompleted++;
                }
            }
            
            // Count priorities
            if (task.priority && priorities.hasOwnProperty(task.priority)) {
                priorities[task.priority]++;
            }
            
            // Count categories
            const category = task.category || 'Uncategorized';
            categories[category] = (categories[category] || 0) + 1;
            
            // Add to recent tasks
            recentTasks.push({
                title: task.title,
                completed: task.completed,
                priority: task.priority || 'medium',
                createdAt: task.createdAt,
                category: task.category
            });
        }
    });
    
    // Sort recent tasks by date (most recent first)
    recentTasks.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    // Convert dailyData object to array for easier charting
    const dailyDataArray = Object.keys(dailyData).map(day => ({
        day,
        ...dailyData[day]
    }));
    
    return {
        startDate: startDateStr,
        endDate: endDateStr,
        totalAdded,
        totalCompleted,
        totalPending: totalAdded - totalCompleted,
        dailyData: dailyDataArray, // Return as array
        priorities,
        categories,
        recentTasks: recentTasks.slice(0, 10) // Return top 10
    };
}