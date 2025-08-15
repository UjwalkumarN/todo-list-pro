class TodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.selectedDate = null;
        this.currentDate = new Date();
        this.editingTaskId = null;

        this.months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        this.weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        this.priorities = ["high", "medium", "low"];

        this.init();
    }

    init() {
        this.loadTasks();
        this.setupEventListeners();
        this.renderTasks();
        this.renderCalendar();
        this.updateFilterDisplay();
    }

    loadTasks() {
        try {
            const saved = localStorage.getItem('todoListProTasks');
            this.tasks = saved ? JSON.parse(saved) : [{
                id: Date.now(),
                text: "Welcome! Click to edit this task",
                completed: false,
                dueDate: "",
                priority: "medium",
                createdAt: this.formatDate(new Date())
            }];
        } catch (e) {
            this.tasks = [];
        }
        this.saveTasks();
    }

    saveTasks() {
        try {
            localStorage.setItem('todoListProTasks', JSON.stringify(this.tasks));
        } catch (e) {
            console.error('Failed to save tasks');
        }
    }

    setupEventListeners() {
        document.getElementById('addTaskBtn').onclick = () => this.addTask();
        document.getElementById('taskInput').onkeypress = (e) => {
            if (e.key === 'Enter') this.addTask();
        };

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.onclick = () => this.setFilter(btn.dataset.filter);
        });

        document.getElementById('prevMonthBtn').onclick = () => this.changeMonth(-1);
        document.getElementById('nextMonthBtn').onclick = () => this.changeMonth(1);
        
        const toggle = document.getElementById('mobileCalendarToggle');
        if (toggle) {
            toggle.onclick = () => {
                document.getElementById('calendarSection').classList.toggle('active');
            };
        }
    }

    addTask() {
        const input = document.getElementById('taskInput');
        const text = input.value.trim();
        if (!text) return;

        const task = {
            id: Date.now(),
            text,
            completed: false,
            dueDate: document.getElementById('taskDueDate').value,
            priority: document.getElementById('taskPriority').value,
            createdAt: this.formatDate(new Date())
        };

        this.tasks.push(task);
        this.saveTasks();
        input.value = '';
        document.getElementById('taskDueDate').value = '';
        this.renderTasks();
        this.renderCalendar();
    }

    toggleComplete(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
        }
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        const item = document.getElementById(`task-${id}`);
        const textEl = item.querySelector('.todo-text');
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = task.text;
        input.className = 'todo-edit';
        
        textEl.replaceWith(input);
        input.focus();
        input.select();

        const finish = () => {
            task.text = input.value.trim() || task.text;
            this.saveTasks();
            this.renderTasks();
        };

        input.onblur = finish;
        input.onkeydown = (e) => {
            if (e.key === 'Enter') finish();
            if (e.key === 'Escape') this.renderTasks();
        };
    }

    deleteTask(id) {
        if (confirm('Delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.renderCalendar();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.selectedDate = null;
        this.updateFilterDisplay();
        this.renderTasks();
        this.renderCalendar();
    }

    updateFilterDisplay() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === this.currentFilter);
        });
    }

    filterTasks() {
        let filtered = this.tasks;
        
        if (this.currentFilter === 'active') filtered = filtered.filter(t => !t.completed);
        else if (this.currentFilter === 'completed') filtered = filtered.filter(t => t.completed);
        else if (this.currentFilter === 'high-priority') filtered = filtered.filter(t => t.priority === 'high');
        
        if (this.selectedDate) filtered = filtered.filter(t => t.dueDate === this.selectedDate);
        
        return filtered;
    }

    renderTasks() {
        const list = document.getElementById('todoList');
        const tasks = this.filterTasks();
        
        list.innerHTML = tasks.map(task => `
            <li class="todo-item ${task.priority}" id="task-${task.id}">
                <input type="checkbox" class="todo-checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="app.toggleComplete(${task.id})">
                <span class="todo-text ${task.completed ? 'completed' : ''}" 
                      onclick="app.editTask(${task.id})">${task.text}</span>
                ${task.dueDate ? `<span class="todo-date">📅 ${task.dueDate}</span>` : ''}
                <button class="todo-delete" onclick="app.deleteTask(${task.id})">✕</button>
            </li>
        `).join('');
    }

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
    }

    renderCalendar() {
        const monthYear = document.getElementById('calendarMonthYear');
        const grid = document.getElementById('calendarGrid');
        
        monthYear.textContent = `${this.months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        
        let html = this.weekdays.map(day => `<div class="calendar-day">${day}</div>`).join('');
        
        // Empty cells for days before month starts
        for (let i = 0; i < firstDay.getDay(); i++) {
            html += '<div></div>';
        }
        
        // Days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dateStr = this.formatDate(new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day));
            const isToday = this.isToday(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
            const isSelected = this.selectedDate === dateStr;
            const hasTasks = this.tasks.some(t => t.dueDate === dateStr);
            
            const classes = ['calendar-date'];
            if (isToday) classes.push('today');
            if (isSelected) classes.push('selected');
            if (hasTasks) classes.push('has-task');
            
            html += `<div class="${classes.join(' ')}" onclick="app.selectDate('${dateStr}')">${day}</div>`;
        }
        
        grid.innerHTML = html;
    }

    selectDate(dateStr) {
        this.selectedDate = this.selectedDate === dateStr ? null : dateStr;
        document.getElementById('taskDueDate').value = this.selectedDate || '';
        this.renderTasks();
        this.renderCalendar();
    }

    isToday(year, month, day) {
        const today = new Date();
        return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
}

let app;
window.addEventListener('load', () => {
    app = new TodoApp();
});