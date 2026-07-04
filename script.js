/* ==========================================================================
   AetherTask Core JS Engine
   ========================================================================== */

// 1. DOM Element Selectors
const taskForm = document.getElementById("task-create-form");
const taskTitleInp = document.getElementById("task-title");
const taskCategorySelect = document.getElementById("task-category");
const taskPrioritySelect = document.getElementById("task-priority");
const taskDueDateInp = document.getElementById("task-duedate");
const tasksContainer = document.getElementById("tasks-container");
const emptyStateView = document.getElementById("empty-state-view");

// Stat Counters
const countTotal = document.getElementById("count-total");
const countPending = document.getElementById("count-pending");
const countCompleted = document.getElementById("count-completed");
const progressIndicator = document.getElementById("progress-indicator");
const progressText = document.getElementById("progress-text");

// Search & Filters
const searchBar = document.getElementById("search-bar");
const filterCatSelect = document.getElementById("filter-cat-select");
const filterStatusSelect = document.getElementById("filter-status-select");
const sortSelect = document.getElementById("sort-select");

// Theme and Console Panels
const mainContainer = document.querySelector(".main");
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const consoleToggleBtn = document.getElementById("console-toggle-btn");
const conceptsPanelAside = document.getElementById("concepts-panel-aside");
const closePanelTrigger = document.getElementById("close-panel-trigger");
const panelTabBtns = document.querySelectorAll(".panel-tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");

// Concepts Tab Components
const eventTracerLogs = document.getElementById("event-tracer-logs");
const btnClearEvents = document.getElementById("btn-clear-events");
const inspectorPromptBox = document.getElementById("inspector-prompt-box");
const inspectorDisplayBox = document.getElementById("inspector-display-box");
const inspectingTitle = document.getElementById("inspecting-title");
const inspectingId = document.getElementById("inspecting-id");
const inspectAttributesList = document.getElementById("inspect-attributes-list");
const inspectPropertiesList = document.getElementById("inspect-properties-list");
const playTaskTitleInp = document.getElementById("play-task-title-input");
const playTaskCompleteCheck = document.getElementById("play-task-complete-check");
const playLogOutput = document.getElementById("play-log-output");

// Toast Container
const toastContainer = document.getElementById("toast-container");

// 2. Application State
let tasks = [];
let inspectedTaskId = null;

// Progress Ring Configuration
const ringRadius = 24;
const ringCircumference = 2 * Math.PI * ringRadius;
if (progressIndicator) {
    progressIndicator.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
    progressIndicator.style.strokeDashoffset = ringCircumference;
}

// 3. Theme & Panel Toggle Handlers
function initTheme() {
    const savedTheme = localStorage.getItem("aether-theme");
    if (savedTheme === "dark") {
        mainContainer.classList.add("dark");
        themeToggleBtn.textContent = "☀️ Light Mode";
    } else {
        mainContainer.classList.remove("dark");
        themeToggleBtn.textContent = "🌙 Dark Mode";
    }
}

themeToggleBtn.addEventListener("click", () => {
    mainContainer.classList.toggle("dark");
    const isDark = mainContainer.classList.contains("dark");
    if (isDark) {
        themeToggleBtn.textContent = "☀️ Light Mode";
        localStorage.setItem("aether-theme", "dark");
        showToast("Switched to Dark Mode", "info");
    } else {
        themeToggleBtn.textContent = "🌙 Dark Mode";
        localStorage.setItem("aether-theme", "light");
        showToast("Switched to Light Mode", "info");
    }
});

// Sidebar Console Toggle
consoleToggleBtn.addEventListener("click", () => {
    conceptsPanelAside.classList.toggle("hidden");
    showToast(conceptsPanelAside.classList.contains("hidden") ? "Concept Explorer Hidden" : "Concept Explorer Shown", "info");
});

closePanelTrigger.addEventListener("click", () => {
    conceptsPanelAside.classList.add("hidden");
});

// Side Panel Tabs
panelTabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        panelTabBtns.forEach(b => b.classList.remove("active"));
        tabPanels.forEach(p => p.classList.remove("active"));
        
        btn.classList.add("active");
        const targetId = btn.getAttribute("data-target");
        document.getElementById(targetId).classList.add("active");
    });
});

// 4. Toast Notification System
function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "warning") icon = "⚠️";
    if (type === "danger") icon = "🚨";
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
        <span class="toast-close">×</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Slide in animate
    toast.style.animation = "slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards";
    
    // Close on click
    toast.querySelector(".toast-close").addEventListener("click", () => {
        toast.style.animation = "fadeOut 0.2s forwards";
        setTimeout(() => toast.remove(), 200);
    });
    
    // Auto remove
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = "fadeOut 0.2s forwards";
            setTimeout(() => toast.remove(), 200);
        }
    }, 3500);
}

// 5. Tasks Management Engine (CRUD + LocalStorage)
function loadTasks() {
    const stored = localStorage.getItem("aether-tasks");
    if (stored) {
        try {
            tasks = JSON.parse(stored);
        } catch (e) {
            tasks = [];
        }
    }
    updateStats();
    renderTasks();
}

function saveTasks() {
    localStorage.setItem("aether-tasks", JSON.stringify(tasks));
    updateStats();
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    
    countTotal.textContent = total;
    countPending.textContent = pending;
    countCompleted.textContent = completed;
    
    // Progress calculation
    const ratio = total > 0 ? completed / total : 0;
    const percent = Math.round(ratio * 100);
    progressText.textContent = `${percent}%`;
    
    if (progressIndicator) {
        const offset = ringCircumference - (ratio * ringCircumference);
        progressIndicator.style.strokeDashoffset = offset;
    }
}

// Create a Task
taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const titleVal = taskTitleInp.value.trim();
    if (!titleVal) {
        showToast("Task description cannot be empty!", "warning");
        return;
    }
    
    const newTask = {
        id: `task-${Date.now()}`,
        title: titleVal,
        category: taskCategorySelect.value,
        priority: taskPrioritySelect.value,
        dueDate: taskDueDateInp.value || "",
        completed: false,
        createdAt: Date.now()
    };
    
    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    
    taskTitleInp.value = "";
    taskDueDateInp.value = "";
    taskTitleInp.focus();
    
    showToast("Task created successfully", "success");
});

// Render Tasks with Sorting and Filtering
function renderTasks() {
    const query = searchBar.value.toLowerCase().trim();
    const catFilter = filterCatSelect.value;
    const statusFilter = filterStatusSelect.value;
    const sortVal = sortSelect.value;
    
    // Filter
    let filtered = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(query);
        const matchesCat = catFilter === "All" || task.category === catFilter;
        const matchesStatus = statusFilter === "All" || 
                              (statusFilter === "Completed" && task.completed) ||
                              (statusFilter === "Pending" && !task.completed);
        return matchesSearch && matchesCat && matchesStatus;
    });
    
    // Sort
    if (sortVal === "newest") {
        filtered.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortVal === "oldest") {
        filtered.sort((a, b) => a.createdAt - b.createdAt);
    } else if (sortVal === "alphabetical") {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortVal === "priority") {
        const pMap = { High: 3, Medium: 2, Low: 1 };
        filtered.sort((a, b) => pMap[b.priority] - pMap[a.priority]);
    }
    
    // Clear and display
    tasksContainer.innerHTML = "";
    
    if (filtered.length === 0) {
        emptyStateView.style.display = "flex";
        tasksContainer.appendChild(emptyStateView);
        return;
    } else {
        emptyStateView.style.display = "none";
    }
    
    filtered.forEach(task => {
        // Create elements dynamically (DOM manipulation demo)
        const taskBox = document.createElement("div");
        
        // Demonstrating Attributes vs Properties:
        // 1. Setting HTML attributes (source attributes)
        taskBox.setAttribute("id", task.id);
        taskBox.setAttribute("class", `task-box ${task.completed ? 'completed' : ''} ${inspectedTaskId === task.id ? 'inspecting' : ''}`);
        taskBox.setAttribute("data-priority", task.priority);
        taskBox.setAttribute("data-completed", task.completed.toString());
        
        // 2. Tying live Javascript object state to the node properties
        taskBox.taskStateObjectRef = task; // Custom object reference in memory
        taskBox.completedProperty = task.completed; // Custom typed property
        
        // Left text node side
        const textDiv = document.createElement("div");
        textDiv.className = "text";
        
        const heading = document.createElement("h5");
        heading.textContent = task.title;
        
        const metaRow = document.createElement("div");
        metaRow.className = "task-meta-row";
        
        if (task.dueDate) {
            const dateBadge = document.createElement("span");
            dateBadge.className = "task-date-badge";
            dateBadge.innerHTML = `📅 ${task.dueDate}`;
            metaRow.appendChild(dateBadge);
        }
        
        textDiv.appendChild(heading);
        textDiv.appendChild(metaRow);
        
        // Right action button side
        const btnsDiv = document.createElement("div");
        btnsDiv.className = "btns";
        
        const categoryBadge = document.createElement("div");
        categoryBadge.className = "type";
        // Category icon lookup
        let catIcon = "💼";
        if (task.category === "Urgent") catIcon = "🚨";
        if (task.category === "Study") catIcon = "📚";
        if (task.category === "Personal") catIcon = "🏠";
        categoryBadge.textContent = `${catIcon} ${task.category}`;
        
        const priorityBadge = document.createElement("span");
        priorityBadge.className = "badge-priority";
        priorityBadge.textContent = task.priority;
        
        const editBtn = document.createElement("button");
        editBtn.className = "btn btn-1";
        editBtn.textContent = "Edit";
        
        const completeBtn = document.createElement("button");
        completeBtn.className = "btn btn-2";
        completeBtn.textContent = task.completed ? "✓ Done" : "Complete";
        
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn btn-3";
        deleteBtn.textContent = "Delete";
        
        btnsDiv.appendChild(categoryBadge);
        btnsDiv.appendChild(priorityBadge);
        btnsDiv.appendChild(editBtn);
        btnsDiv.appendChild(completeBtn);
        btnsDiv.appendChild(deleteBtn);
        
        taskBox.appendChild(textDiv);
        taskBox.appendChild(btnsDiv);
        
        tasksContainer.appendChild(taskBox);
    });
}

// 6. Centralized Event Delegation & Bubbling/Capturing Log
// Filters / Search Input handlers
searchBar.addEventListener("input", renderTasks);
filterCatSelect.addEventListener("change", renderTasks);
filterStatusSelect.addEventListener("change", renderTasks);
sortSelect.addEventListener("change", renderTasks);

// List of DOM nodes to trace for capturing/bubbling visualization
const nodesToTrace = [
    { name: "Window", node: window },
    { name: "Document", node: document },
    { name: "HTML Element", node: document.documentElement },
    { name: "Body", node: document.body },
    { name: "div.main", node: mainContainer },
    { name: "div.dashboard-wrapper", node: document.querySelector(".dashboard-wrapper") },
    { name: "div.task-apear-container", node: document.querySelector(".task-apear-container") },
    { name: "div#tasks-container (Parent Delegator)", node: tasksContainer }
];

// Register capturing listeners
nodesToTrace.forEach(item => {
    item.node.addEventListener("click", (e) => {
        // Trace ONLY if the event originated inside the tasks container to prevent noise
        if (tasksContainer.contains(e.target)) {
            const time = new Date().toLocaleTimeString().split(" ")[0];
            const log = document.createElement("div");
            log.className = "log-row capture";
            log.textContent = `[${time}] ⬇️ CAPTURING | CurrentTarget: ${item.name} | Target: ${e.target.tagName.toLowerCase()}${e.target.className ? '.' + e.target.className.split(' ').join('.') : ''}`;
            eventTracerLogs.appendChild(log);
            eventTracerLogs.scrollTop = eventTracerLogs.scrollHeight;
        }
    }, { capture: true });
});

// Register bubbling listeners
nodesToTrace.forEach(item => {
    item.node.addEventListener("click", (e) => {
        if (tasksContainer.contains(e.target)) {
            const time = new Date().toLocaleTimeString().split(" ")[0];
            const log = document.createElement("div");
            log.className = "log-row bubble";
            log.textContent = `[${time}] ⬆️ BUBBLING | CurrentTarget: ${item.name} | Target: ${e.target.tagName.toLowerCase()}${e.target.className ? '.' + e.target.className.split(' ').join('.') : ''}`;
            eventTracerLogs.appendChild(log);
            
            // Special indicator when caught at the delegation node
            if (item.node === tasksContainer) {
                const triggerLog = document.createElement("div");
                triggerLog.className = "log-row trigger";
                triggerLog.textContent = `⚡ EVENT DELEGATED | Caught at Container: div#tasks-container`;
                eventTracerLogs.appendChild(triggerLog);
            }
            
            eventTracerLogs.scrollTop = eventTracerLogs.scrollHeight;
        }
    }, { capture: false });
});

// Clear event log
btnClearEvents.addEventListener("click", () => {
    eventTracerLogs.innerHTML = `<div class="log-row sys">> Console cleared. Awaiting task interaction...</div>`;
    showToast("Event log cleared", "info");
});

// Centralized Action Handlers using Event Delegation on #tasks-container
tasksContainer.addEventListener("click", (event) => {
    // 1. Identify card context
    const taskBox = event.target.closest(".task-box");
    if (!taskBox) return;
    
    const taskId = taskBox.getAttribute("id");
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    const task = tasks[taskIndex];
    
    // 2. Select / Inspect handler (clicking text)
    if (event.target.closest(".text")) {
        // Toggle selected styling
        const activeInspecting = tasksContainer.querySelector(".task-box.inspecting");
        if (activeInspecting) activeInspecting.classList.remove("inspecting");
        
        inspectedTaskId = taskId;
        taskBox.classList.add("inspecting");
        
        // Open Concept explorer and switch to Attributes vs Props tab
        conceptsPanelAside.classList.remove("hidden");
        panelTabBtns.forEach(b => b.classList.remove("active"));
        tabPanels.forEach(p => p.classList.remove("active"));
        
        const tabBtn = document.querySelector('[data-target="panel-attributes"]');
        tabBtn.classList.add("active");
        document.getElementById("panel-attributes").classList.add("active");
        
        inspectElement(taskBox, task);
        showToast(`Inspecting node: ${task.title.substring(0, 15)}...`, "info");
        return;
    }
    
    // 3. EDIT ACTION (Inline DOM modification)
    if (event.target.classList.contains("btn-1")) {
        const btn = event.target;
        const textDiv = taskBox.querySelector(".text");
        const heading = textDiv.querySelector("h5");
        
        if (btn.textContent === "Edit") {
            // Enter edit mode
            btn.textContent = "Save";
            btn.className = "btn btn-1 btn-save";
            
            // Switch Complete to Cancel
            const completeBtn = taskBox.querySelector(".btn-2");
            completeBtn.textContent = "Cancel";
            completeBtn.className = "btn btn-2 btn-cancel";
            
            // DOM Replacement: replace text node with input element
            const input = document.createElement("input");
            input.type = "text";
            input.className = "task-inline-input";
            input.value = heading.textContent;
            
            // Replace the heading node in the DOM tree
            heading.replaceWith(input);
            input.focus();
            input.select();
            
            // Handle Save on Enter key
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    saveInlineEdit(taskBox, input, btn, completeBtn, task);
                } else if (e.key === "Escape") {
                    cancelInlineEdit(taskBox, input, btn, completeBtn, task);
                }
            });
            
            showToast("Inline Edit Mode Activated (DOM node replaced)", "info");
        } else {
            // Save mode
            const input = textDiv.querySelector(".task-inline-input");
            const completeBtn = taskBox.querySelector(".btn-cancel");
            saveInlineEdit(taskBox, input, btn, completeBtn, task);
        }
        return;
    }
    
    // 4. COMPLETE / CANCEL ACTION
    if (event.target.classList.contains("btn-2")) {
        const btn = event.target;
        
        if (btn.classList.contains("btn-cancel")) {
            // Cancel inline edit mode
            const textDiv = taskBox.querySelector(".text");
            const input = textDiv.querySelector(".task-inline-input");
            const editBtn = taskBox.querySelector(".btn-save");
            cancelInlineEdit(taskBox, input, editBtn, btn, task);
            showToast("Edit cancelled", "info");
        } else {
            // Complete task toggle
            if (task.completed) {
                showToast("Task is already completed!", "warning");
                return;
            }
            
            task.completed = true;
            saveTasks();
            renderTasks();
            
            // If we are currently inspecting this task, refresh the inspector
            if (inspectedTaskId === taskId) {
                const refreshedNode = document.getElementById(taskId);
                inspectElement(refreshedNode, task);
            }
            
            showToast("Task completed!", "success");
        }
        return;
    }
    
    // 5. DELETE ACTION
    if (event.target.classList.contains("btn-3")) {
        // Animate task deletion (Reflow + Paint explanation in explorer)
        taskBox.style.animation = "fadeOut 0.25s forwards";
        
        setTimeout(() => {
            tasks.splice(taskIndex, 1);
            saveTasks();
            
            if (inspectedTaskId === taskId) {
                inspectedTaskId = null;
                inspectorPromptBox.classList.remove("hidden");
                inspectorDisplayBox.classList.add("hidden");
            }
            
            renderTasks();
            showToast("Task deleted", "danger");
        }, 250);
        return;
    }
});

// Inline edit helper functions
function saveInlineEdit(taskBox, input, editBtn, cancelBtn, task) {
    const newTitle = input.value.trim();
    if (!newTitle) {
        showToast("Task description cannot be empty!", "warning");
        input.focus();
        return;
    }
    
    task.title = newTitle;
    saveTasks();
    
    // Restore normal buttons class
    editBtn.textContent = "Edit";
    editBtn.className = "btn btn-1";
    
    cancelBtn.textContent = task.completed ? "✓ Done" : "Complete";
    cancelBtn.className = "btn btn-2";
    
    // Recreate the h5 node
    const heading = document.createElement("h5");
    heading.textContent = newTitle;
    
    // Replace input with heading in the DOM tree
    input.replaceWith(heading);
    
    if (inspectedTaskId === task.id) {
        inspectElement(taskBox, task);
    }
    
    showToast("Task updated in DOM and state", "success");
}

function cancelInlineEdit(taskBox, input, editBtn, cancelBtn, task) {
    editBtn.textContent = "Edit";
    editBtn.className = "btn btn-1";
    
    cancelBtn.textContent = task.completed ? "✓ Done" : "Complete";
    cancelBtn.className = "btn btn-2";
    
    // Recreate the h5 node
    const heading = document.createElement("h5");
    heading.textContent = task.title;
    
    input.replaceWith(heading);
}

// 7. Attributes vs Properties Inspector Details Engine
function inspectElement(element, taskObj) {
    inspectorPromptBox.classList.add("hidden");
    inspectorDisplayBox.classList.remove("hidden");
    
    inspectingTitle.textContent = taskObj.title;
    inspectingId.textContent = taskObj.id;
    
    // Read and render HTML Attributes
    inspectAttributesList.innerHTML = "";
    const attributes = [
        { name: "id", value: element.getAttribute("id") },
        { name: "class", value: element.getAttribute("class") },
        { name: "data-priority", value: element.getAttribute("data-priority") },
        { name: "data-completed", value: element.getAttribute("data-completed") }
    ];
    
    attributes.forEach(attr => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><code>${attr.name}</code></td>
            <td><span class="attr-val">"${attr.value}"</span></td>
        `;
        inspectAttributesList.appendChild(row);
    });
    
    // Read and render DOM Properties in memory (demonstrating dynamic typing)
    inspectPropertiesList.innerHTML = "";
    const properties = [
        { name: "id (string)", value: element.id },
        { name: "className (string)", value: element.className },
        { name: "dataset.priority (string)", value: element.dataset.priority },
        { name: "completedProperty (boolean)", value: element.completedProperty.toString() },
        { name: "tagName (string)", value: element.tagName }
    ];
    
    properties.forEach(prop => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><code>${prop.name}</code></td>
            <td><span class="prop-val">${prop.value}</span></td>
        `;
        inspectPropertiesList.appendChild(row);
    });
    
    // Reset Playground fields to match active item
    playTaskTitleInp.value = taskObj.title;
    playTaskCompleteCheck.checked = taskObj.completed;
    
    playLogOutput.innerHTML = `Loaded node: ${taskObj.id} <br>> Awaiting edits inside Playground...`;
}

// Playground changes listeners (Modify DOM Property live demo)
playTaskTitleInp.addEventListener("input", (e) => {
    if (!inspectedTaskId) return;
    
    const activeNode = document.getElementById(inspectedTaskId);
    if (!activeNode) return;
    
    const newText = e.target.value;
    
    // 1. Modify the DOM Property in memory
    const heading = activeNode.querySelector("h5");
    if (heading) {
        heading.textContent = newText; // DOM node property modified
    }
    
    // Update local task state but do not render full list to show property mutation
    const task = tasks.find(t => t.id === inspectedTaskId);
    if (task) task.title = newText;
    saveTasks();
    
    // 2. Log what happened to show Attribute vs Property disconnect
    const titleAttr = activeNode.getAttribute("title"); // Read HTML attribute
    
    playLogOutput.innerHTML = `
        <strong>Property modified:</strong> <code>h5.textContent = "${newText}"</code>.<br>
        <strong>Result:</strong> Visual node text updated.<br>
        <strong>HTML Attribute Check:</strong> <code>getAttribute('title')</code> resolves to: <span class="attr-val">${titleAttr ? '"' + titleAttr + '"' : 'null'}</span>.<br>
        <em>Proof: Modifying this DOM property did NOT create or change an HTML attribute on the element!</em>
    `;
    
    // Refresh inspector columns without full re-rendering
    inspectingTitle.textContent = newText;
});

playTaskCompleteCheck.addEventListener("change", (e) => {
    if (!inspectedTaskId) return;
    
    const activeNode = document.getElementById(inspectedTaskId);
    if (!activeNode) return;
    
    const checkedState = e.target.checked;
    
    // 1. Update element property and class attribute
    activeNode.completedProperty = checkedState;
    if (checkedState) {
        activeNode.classList.add("completed");
        activeNode.setAttribute("data-completed", "true");
    } else {
        activeNode.classList.remove("completed");
        activeNode.setAttribute("data-completed", "false");
    }
    
    // Update state and stats
    const task = tasks.find(t => t.id === inspectedTaskId);
    if (task) {
        task.completed = checkedState;
        
        // Update complete button text
        const completeBtn = activeNode.querySelector(".btn-2");
        if (completeBtn && !completeBtn.classList.contains("btn-cancel")) {
            completeBtn.textContent = checkedState ? "✓ Done" : "Complete";
        }
    }
    saveTasks();
    
    // 2. Log property vs attribute comparison
    const completedAttrVal = activeNode.getAttribute("data-completed");
    const completedPropVal = activeNode.completedProperty;
    
    playLogOutput.innerHTML = `
        <strong>Property changed:</strong> <code>completedProperty = ${completedPropVal}</code>.<br>
        <strong>Attribute updated manually:</strong> <code>setAttribute('data-completed', '${completedAttrVal}')</code>.<br>
        <strong>Sync Analysis:</strong> Toggling completed state updated both class attribute and boolean property in JS memory.
    `;
    
    // Refresh inspector columns
    inspectElement(activeNode, task);
});

// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
    initTheme();
    loadTasks();
});
