// Author: Tanmay-Dalwadi
let tasks = loadTasks();
const taskList = document.getElementById('taskList');
const newTaskInput = document.getElementById('newTask');
const prioritySelect = document.getElementById('priority');
const dueDateInput = document.getElementById('dueDate');
const deleteAllCompletedButton = document.getElementById('deleteAllCompleted');

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const storedTasks = localStorage.getItem('tasks');
    return storedTasks ? JSON.parse(storedTasks) : [];
}

function renderTasks() {
    taskList.innerHTML = '';
    tasks.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
        } else if (a.dueDate) {
            return -1;
        } else if (b.dueDate) {
            return 1;
        }
        return 0;
    });

    tasks.forEach((task, index) => {
        const listItem = document.createElement('li');
        listItem.classList.add('task-item', `priority-${task.priority}`);
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
        if (isOverdue) {
            listItem.classList.add('due-date-overdue');
        }

        listItem.innerHTML = `
            <div class="task-item-content">
                <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleComplete(${index})">
                <span class="${task.completed ? 'completed' : ''}" id="taskText-${index}">${task.text}</span>
                ${task.dueDate ? `<span class="due-date">Due: ${task.dueDate}</span>` : ''}
            </div>
            <div class="actions">
                <button onclick="editTask(${index})">Change</button>
                <button class="remove" onclick="removeTask(${index})">Remove</button>
            </div>
        `;
        taskList.appendChild(listItem);
    });

    const hasCompletedTasks = tasks.some(task => task.completed);
    deleteAllCompletedButton.style.display = hasCompletedTasks ? 'block' : 'none';
    saveTasks();
}

function addTask() {
    const taskText = newTaskInput.value.trim();
    const priority = prioritySelect.value;
    const dueDate = dueDateInput.value;

    if (taskText !== '') {
        tasks.push({ text: taskText, completed: false, priority: priority, dueDate: dueDate, notified: false }); // Initialize 'notified' to false
        newTaskInput.value = '';
        prioritySelect.value = 'low';
        dueDateInput.value = '';
        renderTasks();
    }
}

function toggleComplete(index) {
    tasks[index].completed = !tasks[index].completed;
    tasks[index].notified = false; // Reset notification status on completion change
    saveTasks();
}

function removeTask(index) {
    tasks.splice(index, 1);
    renderTasks();
}

function editTask(index) {
    const listItem = taskList.children[index];
    const taskItemContent = listItem.querySelector('.task-item-content');
    const task = tasks[index];

    taskItemContent.innerHTML = `
        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleComplete(${index})">
        <input type="text" class="edit-input" id="editInput-${index}" value="${task.text}">
        <select id="editPriority-${index}">
            <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
            <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
        </select>
        <input type="date" id="editDueDate-${index}" value="${task.dueDate || ''}">
        <div class="edit-actions">
            <button onclick="saveEdit(${index})">Save</button>
            <button class="cancel" onclick="cancelEdit(${index}, '${task.text}')">Cancel</button>
        </div>
    `;

    const editInput = listItem.querySelector('.edit-input');
    editInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            saveEdit(index);
        }
    });
}

function saveEdit(index) {
    const editInput = document.getElementById(`editInput-${index}`);
    const editPrioritySelect = document.getElementById(`editPriority-${index}`);
    const editDueDateInput = document.getElementById(`editDueDate-${index}`);

    tasks[index].text = editInput.value.trim();
    tasks[index].priority = editPrioritySelect.value;
    tasks[index].dueDate = editDueDateInput.value;
    tasks[index].notified = false; // Reset notification status on edit
    renderTasks();
}

function cancelEdit(index, originalText) {
    const listItem = taskList.children[index];
    const taskItemContent = listItem.querySelector('.task-item-content');
    const task = tasks[index];

    taskItemContent.innerHTML = `
        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleComplete(${index})">
        <span class="${task.completed ? 'completed' : ''}" id="taskText-${index}">${originalText}</span>
        ${task.dueDate ? `<span class="due-date">Due: ${task.dueDate}</span>` : ''}
    `;
    listItem.querySelector('.actions').innerHTML = `
        <button onclick="editTask(${index})">Change</button>
        <button class="remove" onclick="removeTask(${index})">Remove</button>
    `;
}

function deleteAllCompletedTasks() {
    tasks = tasks.filter(task => !task.completed);
    renderTasks();
}

function checkDueDates() {
    const now = new Date();
    tasks.forEach(task => {
        if (task.dueDate && !task.completed && !task.notified) {
            const dueDate = new Date(task.dueDate);
            const timeDiff = dueDate.getTime() - now.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

            let notificationMessage = null;

            if (daysLeft <= 0) {
                notificationMessage = `To-Do Reminder: "${task.text}" is overdue!`;
            } else if (daysLeft <= 1) {
                notificationMessage = `To-Do Reminder: "${task.text}" is due tomorrow!`;
            } else if (daysLeft === 0) { // Added check for tasks due today
                notificationMessage = `To-Do Reminder: "${task.text}" is due today!`;
            }

            if (notificationMessage) {
                if (Notification.permission === 'granted') {
                    new Notification(notificationMessage);
                    task.notified = true; // Mark as notified
                    saveTasks(); // Update local storage
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            new Notification(notificationMessage);
                            task.notified = true;
                            saveTasks();
                        }
                    });
                }
            }
        } else if (task.completed || (task.dueDate && new Date(task.dueDate) > now)) {
            task.notified = false; // Reset notification status if completed or due date is in the future
            saveTasks();
        }
    });
}
flatpickr("#dueDate", {
    dateFormat: "d/m/Y",
    disableMobile: true
});

setInterval(checkDueDates, 3600000);

renderTasks();
