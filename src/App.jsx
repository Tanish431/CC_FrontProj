import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCorners,
  useDroppable,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";
import "./App.css";
import axios from "axios";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import TextField from "@mui/material/TextField";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";

import { FiEdit, FiSun, FiMoon } from "react-icons/fi";
import { AiOutlineDelete } from "react-icons/ai";

// Due Function
function getDueStatus(due, today) {
  const dueDate = new Date(due);
  const diffTime = dueDate.setHours(0,0,0,0) - today.setHours(0,0,0,0);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return { text: `${diffDays} days remaining`, className: "due-green" };
  } else if (diffDays === 0) {
    return { text: "Due today", className: "due-yellow" };
  } else {
    return { text: `Due ${Math.abs(diffDays)} days ago`, className: "due-red" };
  }
}

// Task Card
function TaskCard({ task, onEdit, onDelete, onToggleDone, activeTab}) {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging,} = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.1 : 1,
  };

  const today = new Date();
  const dueStatus =
    task.status === "done"
      ? { text: "🎉 Well Done!!", className: "due-green" }
      : getDueStatus(task.due, today);
  
  const stopDrag = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const isCompletedTab = activeTab === "completed";
  // Hide edit button for completed tasks
  const showEdit = task.status !== "done";
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-card group relative ${activeTab === "status" ? "" : "non-status"}`}
    >
      {activeTab === "status" ? (
        <>
          {showEdit && (
            <button
              className="icon-btn edit-btn"
              onPointerDown={stopDrag}
              onMouseDown={stopDrag}
              onTouchStart={stopDrag}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              aria-label="Edit task"
              style={{ top: 6, right: 6 }}
            >
              <FiEdit size={18} />
            </button>
          )}
          <button
            className="icon-btn delete-btn"
            onPointerDown={stopDrag}
            onMouseDown={stopDrag}
            onTouchStart={stopDrag}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task);
            }}
            aria-label="Delete task"
            style={{ bottom: 6, right: 6 }}
          >
            <AiOutlineDelete size={20} />
          </button>
          <p className="task-title">{task.title}</p>
        </>
      ) : (
        <div className="task-content">
          <input
            type="checkbox"
            checked={task.status === "done"}
            onChange={() => onToggleDone(task)}
            onPointerDown={stopDrag}
            onMouseDown={stopDrag}
            onTouchStart={stopDrag}
            className="task-checkbox"
          />
          <p
            className="task-title"
            style={
              isCompletedTab
                ? {} // No strike-through for completed tab
                : task.status === "done"
                ? { textDecoration: "line-through", color: "#888" }
                : {}
            }
          >
            {task.title}
          </p>
          <div className="action-buttons">
            {showEdit && (
              <button
                className="icon-btn"
                onPointerDown={stopDrag}
                onMouseDown={stopDrag}
                onTouchStart={stopDrag}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                aria-label="Edit task"
              >
                <FiEdit size={18} />
              </button>
            )}
            <button
              className="icon-btn delete-btn"
              onPointerDown={stopDrag}
              onMouseDown={stopDrag}
              onTouchStart={stopDrag}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task);
              }}
              aria-label="Delete task"
            >
              <AiOutlineDelete size={20} />
            </button>
          </div>
        </div>
      )}
      <div className={`task-due ${dueStatus.className}`}>{dueStatus.text}</div>
    </div>
  );
}

// Column
function Column({ id, title, tasks, setEditTask, setDeleteTask, handleToggleDone, activeTab }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`column ${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        {title}
        {id === 'done' && activeTab === 'status' && (
          <span className="done-indicator" title="Completed">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="9" cy="9" r="8" fill="#16a34a" />
              <path d="M6 9.5L8 11.5L12 7.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </h3>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="non-status-view" style={{ minHeight: "50px" }}>
          {tasks.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "var(--text-secondary)",
                fontSize: "0.95em",
                padding: "10px",
                opacity: 0.7,
              }}
            >
              No tasks here !!
            </p>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(task) => setEditTask(task)}
                onDelete={(task) => setDeleteTask(task)}
                onToggleDone={handleToggleDone}
                activeTab={activeTab}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
// Modal for adding tasks
function NewTaskModal({ isOpen, onClose, onAddTask, darkMode }) {
  const [title, setTitle] = useState("");
  const getTodayDate = () => new Date().toISOString().slice(0, 10);
  const [due, setDue] = useState(getTodayDate());
  const [status, setStatus] = useState("not-started");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !due) return;

    onAddTask({
      id: Date.now().toString(),
      title,
      due,
      status,
    });

    setTitle("");
    setDue(getTodayDate());
    setStatus("not-started");
    onClose();
  };

  if (!isOpen) return null;

  // Dynamic MUI theme for light/dark mode
  const pickerTheme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: { main: darkMode ? "#4cafef" : "#2563eb" },
    },
  });

  return createPortal(
    <div className="modal-overlay">
      <div className="modal">
        <h2>Add New Task</h2>
        <form onSubmit={handleSubmit}>
          <label>Task Title</label>
          <ThemeProvider theme={pickerTheme}>
            <TextField
              placeholder="Enter task..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              variant="outlined"
              sx={{
                input: { color: darkMode ? "#fff" : "#000" },
                label: { color: darkMode ? "#aaa" : "#555" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: darkMode ? "#555" : "#ccc",
                  },
                  "&:hover fieldset": {
                    borderColor: darkMode ? "#4cafef" : "#2563eb",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: darkMode ? "#4cafef" : "#2563eb",
                  },
                },
              }}
            />
          </ThemeProvider>

          <label>Due Date</label>
          <ThemeProvider theme={pickerTheme}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Select due date"
                value={due ? new Date(due) : null}
                onChange={(newValue) => {
                  if (newValue) {
                    setDue(new Date(newValue).toISOString().slice(0, 10));
                  }
                }}
                format="dd/MM/yyyy"
                renderInput={(params) => (
                  <TextField {...params} sx={{ input: { color: darkMode ? "#fff" : "#000" } }} />
                )}
              />
            </LocalizationProvider>
          </ThemeProvider>
          
          <ThemeProvider theme={pickerTheme}>
              <FormControl fullWidth>
            <label>Status</label>
            <Select
              labelId="status-label"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              sx={{
                color: darkMode ? "#fff" : "#000",
                backgroundColor: darkMode ? "#222" : "#f9f9f9",
                borderRadius: "6px",
                "& .MuiSvgIcon-root": {
                  color: darkMode ? "#fff" : "#000",
                },
              }}
            >
              <MenuItem value="not-started">Not Started</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="done">Done</MenuItem>
            </Select>
            </FormControl>
          </ThemeProvider>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="add-btn">
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// Modal for editing tasks
function EditTaskModal({ isOpen, onClose, task, onUpdate, darkMode }) {
  const [title, setTitle] = useState(task?.title || "");
  const [due, setDue] = useState(task?.due || "");
  const [status, setStatus] = useState(task?.status || "not-started");

  useEffect(() => {
    setTitle(task?.title || "");
    setDue(task?.due || "");
    setStatus(task?.status || "not-started");
  }, [task]);

  if (!isOpen) return null;

  const pickerTheme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: { main: darkMode ? "#4cafef" : "#2563eb" },
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !due) return;
    onUpdate(task.id, { title, due, status });
    onClose();
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal">
        <h2>Edit Task</h2>
        <form onSubmit={handleSubmit}>
          <label>Task Title</label>
          <ThemeProvider theme={pickerTheme}>
            <TextField
              placeholder="Enter task..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              variant="outlined"
              sx={{
                input: { color: darkMode ? "#fff" : "#000" },
                label: { color: darkMode ? "#aaa" : "#555" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: darkMode ? "#555" : "#ccc",
                  },
                  "&:hover fieldset": {
                    borderColor: darkMode ? "#4cafef" : "#2563eb",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: darkMode ? "#4cafef" : "#2563eb",
                  },
                },
              }}
            />
          </ThemeProvider>

          <label>Due Date</label>
          <ThemeProvider theme={pickerTheme}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Select due date"
                value={due ? new Date(due) : null}
                onChange={(newValue) => {
                  if (newValue) {
                    setDue(new Date(newValue).toISOString().slice(0, 10));
                  }
                }}
                format="dd/MM/yyyy"
                renderInput={(params) => (
                  <TextField {...params} sx={{ input: { color: darkMode ? "#fff" : "#000" } }} />
                )}
              />
            </LocalizationProvider>
          </ThemeProvider>

          <ThemeProvider theme={pickerTheme}>
            <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
          <label>Status</label>
              <Select
                labelId="edit-status-label"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                sx={{
                  color: darkMode ? "#fff" : "#000",
                  backgroundColor: darkMode ? "#222" : "#f9f9f9",
                  borderRadius: "6px",
                  "& .MuiSvgIcon-root": {
                    color: darkMode ? "#fff" : "#000",
                  },
                }}
              >
                <MenuItem value="not-started">Not Started</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="done">Done</MenuItem>
              </Select>
            </FormControl>
          </ThemeProvider>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="add-btn">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
// Modal for task deletion
function DeleteConfirmationModal({ isOpen, onClose, onConfirm, task }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal">
        <h2>Delete Task?</h2>
        <p className="mb-4">Are you sure you want to delete "{task.title}"?</p>
        <div className="modal-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="add-btn bg-red-500 hover:bg-red-600"
            onClick={() => {
              onConfirm(task.id);
              onClose();
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
function SignInModal({ isOpen, onClose, onSignIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await onSignIn(email, password, setError, setLoading);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal">
        <h2>Sign In</h2>

        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="custom-input"
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="custom-input"
          />

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="add-btn" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}


// SignUpModal
function SignUpModal({ isOpen, onClose, onSignUp }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await onSignUp(username, email, password, setError, setLoading);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal">
        <h2>Sign Up</h2>

        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="custom-input"
          />

          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="custom-input"
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="custom-input"
          />

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="add-btn" disabled={loading}>
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}


// Main App Component
export default function App() {
  // Add viewport meta tag for mobile responsiveness
  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0';
      document.head.appendChild(meta);
    }
  }, []);
  const [activeTab, setActiveTab] = useState("status");
  const [activeTask, setActiveTask] = useState(null);
  const [overColumn, setOverColumn] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);
  const [darkMode, setDarkMode] = useState(true); 
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const [tasks, setTasks] = useState([]); 

  useEffect(() => {
  const storedToken = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (storedToken) {
    setToken(storedToken);
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchTasks(storedToken); // Load signed-in user's tasks
  } else {
    const guestTasks = JSON.parse(localStorage.getItem("guest_tasks")) || [];
    setTasks(guestTasks); // Load guest tasks
  }
}, []);



  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  });
  api.interceptors.request.use(
    (config) => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        config.headers["Authorization"] = `Bearer ${storedToken}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const fetchTasks = async (authToken) => {
    try {
      if (!authToken) {
        // Guest → load guest tasks
        const storedTasks = JSON.parse(localStorage.getItem("guest_tasks")) || [];
        setTasks(storedTasks);
        return;
      }

      // Logged-in → fetch from backend
      const response = await api.get("/tasks", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      // Normalize tasks → Always provide "id"
      const normalizedTasks = response.data.map(task => ({
        ...task,
        id: task.id || task._id,  // Use MongoDB _id if id is missing
      }));

      setTasks(normalizedTasks);
      localStorage.setItem("user_tasks", JSON.stringify(response.data));
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };   

  // Save tasks to localStorage
  useEffect(() => {
    if (token) {
    localStorage.setItem("user_tasks", JSON.stringify(tasks));
    } else {
    localStorage.setItem("guest_tasks", JSON.stringify(tasks));
}
  }, [tasks]);
  
  useEffect(() => {
    document.body.classList.toggle('light-mode', !darkMode);
  }, [darkMode]);
  
  const columns = [
    { key: "not-started", title: "Not Started" },
    { key: "in-progress", title: "In Progress" },
    { key: "done", title: "Done" },
  ];
  const findColumn = (id) => {
    if (tasks.todo.find((task) => task.id === id)) return "not-started";
    if (tasks["in-progress"].find((task) => task.id === id)) return "in-progress";
    if (tasks.done.find((task) => task.id === id)) return "done";
    return null;
  };

  // Drag and drop handlers
  const handleDragStart = ({ active }) => {
    const task = tasks.find((t) => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = ({ over }) => {
    if (over && columns.find((c) => c.key === over.id)) {
      setOverColumn(over.id);
    } else if (over) {
      const overTask = tasks.find((t) => t.id === over.id);
      setOverColumn(overTask?.status || null);
    } else {
      setOverColumn(null);
    }
  };

  const handleDragEnd = ({ active, over }) => {
  setActiveTask(null);
  setOverColumn(null);
  if (!over) return;

  const activeId = active.id;
  const overId = over.id;

  // Check if task is being dropped into a column
  if (columns.find((c) => c.key === overId)) {
    // Update UI instantly
    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeId ? { ...t, status: overId } : t
      )
    );

    // Update backend or localStorage
    handleUpdateTask(activeId, { status: overId });
    return;
  }

  // Handle reordering within the same status
  const activeTask = tasks.find((t) => t.id === activeId);
  const overTask = tasks.find((t) => t.id === overId);
  if (!activeTask || !overTask) return;

  if (activeTask.status === overTask.status) {
    const filtered = tasks.filter((t) => t.status === activeTask.status);
    const oldIndex = filtered.findIndex((t) => t.id === activeId);
    const newIndex = filtered.findIndex((t) => t.id === overId);

    const reordered = arrayMove(filtered, oldIndex, newIndex);

    setTasks((prev) => [
      ...prev.filter((t) => t.status !== activeTask.status),
      ...reordered,
    ]);
  } else {
    // Moving to a different column
    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeId ? { ...t, status: overTask.status } : t
      )
    );

    // Update backend or localStorage
    handleUpdateTask(activeId, { status: overTask.status });
  }
};

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 }, // must move 4px before a drag starts
    }),
    useSensor(TouchSensor)
  );

  const handleAddTask = async (newTask) => {
  try {
    if (!token) {
      // Guest → Save locally
      const storedTasks = JSON.parse(localStorage.getItem("guest_tasks")) || [];
      const updatedTasks = [...storedTasks, newTask];
      localStorage.setItem("guest_tasks", JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
      return;
    }

    // Logged-in → Save on backend
    const response = await api.post("/tasks", newTask);
    const savedTask = { ...response.data, id: response.data._id }; 
    setTasks((prev) => [...prev, savedTask]);
    localStorage.setItem("user_tasks", JSON.stringify([...tasks, response.data]));
  } catch (error) {
    console.error("Error adding task:", error);
  }
};

  const handleUpdateTask = async (taskId, updatedData) => {
  try {
    if (!token) {
      // Guest → update localStorage
      let storedTasks = JSON.parse(localStorage.getItem("guest_tasks")) || [];
      storedTasks = storedTasks.map((t) =>
        t.id === taskId ? { ...t, ...updatedData } : t
      );
      localStorage.setItem("guest_tasks", JSON.stringify(storedTasks));
      setTasks(storedTasks);
      return;
    }

    // Logged-in → update backend
    const response = await api.put(`/tasks/${taskId}`, updatedData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    const updatedTask = { ...response.data, id: response.data._id };
    const updatedTasks = tasks.map((t) => (t.id === taskId ? updatedTask : t));
    setTasks(updatedTasks);
    localStorage.setItem("user_tasks", JSON.stringify(updatedTasks));
  } catch (error) {
    console.error("Error updating task:", error);
  }
};

  const handleDeleteTask = async (taskId) => {
  try {
    if (!token) {
      // Guest → delete locally
      const storedTasks = JSON.parse(localStorage.getItem("guest_tasks")) || [];
      const updatedTasks = storedTasks.filter((t) => t.id !== taskId);
      localStorage.setItem("guest_tasks", JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
      return;
    }

    // Logged-in → delete on backend
    await api.delete(`/tasks/${taskId}`);
    const updatedTasks = tasks.filter((t) => t.id !== taskId);
    setTasks(updatedTasks);
    localStorage.setItem("user_tasks", JSON.stringify(updatedTasks));
  } catch (error) {
    console.error("Error deleting task:", error);
  }
};

const handleToggleDone = async (task) => {
  const newStatus = task.status === "done" ? "not-started" : "done";
  handleUpdateTask(task.id, { status: newStatus });
  // Update UI instantly for responsiveness
  setTasks((prev) =>
    prev.map((t) =>
      t.id === task.id ? { ...t, status: newStatus } : t
    )
  );
  try {
    // Update backend if logged in
    if (token) {
      await handleUpdateTask(task.id, { status: newStatus });
    } else {
      // Guest → update localStorage
      let storedTasks = JSON.parse(localStorage.getItem("guest_tasks")) || [];
      storedTasks = storedTasks.map((t) =>
        t.id === task.id ? { ...t, status: newStatus } : t
      );
      localStorage.setItem("guest_tasks", JSON.stringify(storedTasks));
    }
    console.log("Task toggled successfully");
  } catch (error) {
    console.error("Error toggling task:", error);
  }
};


  const handleSignup = async (username, email, password, setError, setLoading) => {
    try {
      const response = await api.post("/auth/signup", { username, email, password });
      setIsSignUpModalOpen(false);
      alert("Sign up successful! Please sign in.");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Sign up failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignin = async (email, password, setError, setLoading) => {
  try {
    const response = await api.post("/auth/signin", { email, password });
    const { token, user } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    setToken(token);
    setUser(user);

    // Fetch fresh tasks from backend
    fetchTasks(token);

    setIsSignInModalOpen(false);
  } catch (error) {
    setError("Invalid credentials");
    console.error("Signin error:", error);
  } finally {
    setLoading(false);
  }
};


  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_tasks");
    setToken(null);
    setUser(null);
    // Load guest tasks when logging out
    const guestTasks = JSON.parse(localStorage.getItem("guest_tasks")) || [];
    setTasks(guestTasks);
  };

  // Filter tasks for Today, This Week, Pending, and Completed tabs
  const today = new Date();
  const zeroedToday = new Date(today);
  zeroedToday.setHours(0, 0, 0, 0);

  const filteredTasks = {
    today: tasks.filter((t) => {
      const taskDate = new Date(t.due);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === zeroedToday.getTime();
    }),
    week: tasks.filter((t) => {
      const taskDate = new Date(t.due);
      taskDate.setHours(0, 0, 0, 0);
      const diff = (taskDate.getTime() - zeroedToday.getTime()) / (1000 * 60 * 60 * 24);
      return t.status !== "done" && diff >= 0 && diff < 7;
    }),
    pending: tasks.filter((t) => {
      const dueDate = new Date(t.due);
      dueDate.setHours(0, 0, 0, 0);
      return t.status !== "done" && dueDate.getTime() < zeroedToday.getTime();
    }),
    completed: tasks.filter((t) => t.status === "done"),
  };

  // Today's date for display
  const todayString = today.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="app">
      <header className="app-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', marginBottom: '12px' }}>
        <div className="todo-heading" style={{ font: 'var(--text-head)', fontSize: '2.5em', letterSpacing: '2px', color: 'var(--text-main)', fontWeight: "bold"}}>TO-DO LIST</div>
        <button
          className="mode-toggle-btn"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5em', color: 'var(--accent)' }}
          onClick={() => setDarkMode((prev) => !prev)}
          aria-label="Toggle light mode"
        >
          {darkMode ? <FiSun /> : <FiMoon />}
        </button>
      </header>

      <div className="navbar">
        {["status", "today", "week", "pending", "completed"].map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "status"
              ? "Status"
              : tab === "today"
              ? "Today"
              : tab === "week"
              ? "This Week"
              : tab === "pending"
              ? "Pending"
              : "Completed"}
          </button>
        ))}
        <div className="user-actions">
              {user ? (
                <>
                  <span className="welcome-text">
                    Welcome, {user.username}!    
                  </span>
                  <button onClick={handleSignOut} className="sign-out-btn">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsSignInModalOpen(true)}
                    className="auth-btn"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setIsSignUpModalOpen(true)}
                    className="auth-btn"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
        <button className="new-task-btn" onClick={() => setIsModalOpen(true)}>
          + New Task
        </button>
      </div>

      {activeTab === "today" && (
        <div className="date-title">
          {todayString}
        </div>
      )}

      {activeTab === "status" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="board">
            {columns.map((col) => (
              <Column
                key={col.key}
                id={col.key}
                title={col.title}
                tasks={tasks.filter((t) => t.status === col.key)}
                isOver={overColumn === col.key}
                setEditTask={setEditTask}
                setDeleteTask={setDeleteTask}
                handleToggleDone={handleToggleDone}
                activeTab={activeTab}
              />
            ))}
          </div>

          {createPortal(
            <DragOverlay>
              {activeTask ? (
                <div className="task-card dragging">
                  <p className="task-title">{activeTask.title}</p>
                  <p className="task-due">
                    {getDueStatus(activeTask.due, today).text}
                  </p>
                </div>
              ) : null}
            </DragOverlay>,
            document.body
          )}
        </DndContext>
      )}
      
      {activeTab === "week" && filteredTasks["week"] && (
        <div className="week-list">
          {filteredTasks["week"].length === 0 ? (
            <p className="empty-text">No tasks here 🎉</p>
          ) : (
            (() => {
              // Group tasks by weekday name
              const tasksByDay = {};
              filteredTasks["week"].forEach(task => {
                const dateObj = new Date(task.due);
                const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'long' });
                if (!tasksByDay[dayName]) tasksByDay[dayName] = [];
                tasksByDay[dayName].push(task);
              });
              // Sort days by order in week
              const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
              return weekDays
                .filter(day => tasksByDay[day])
                .map(day => (
                  <div key={day} style={{ marginBottom: '24px' }}>
                    <div className="date-title">{day}</div>
                    {tasksByDay[day]
                      .sort((a, b) => new Date(a.due) - new Date(b.due))
                      .map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onEdit={setEditTask}
                          onDelete={setDeleteTask}
                          onToggleDone={handleToggleDone}
                          activeTab={activeTab}
                        />
                      ))}
                  </div>
                ));
            })()
          )}
        </div>
      )}

      { ["today", "pending", "completed"].includes(activeTab) && filteredTasks[activeTab] && (
        <div className="filtered-tasks">
          {filteredTasks[activeTab].length === 0 ? (
            <p className="empty-text">No tasks here {activeTab!=="completed" ? '🎉' : '☹️'}</p>
          ) : (
            [...filteredTasks[activeTab]]
              .sort((a, b) => (a.status === "done" ? 1 : b.status === "done" ? -1 : 0))
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={setEditTask}
                  onDelete={setDeleteTask}
                  onToggleDone={handleToggleDone}
                  activeTab={activeTab}
                />
              ))
          )}
        </div>
      )}

      <NewTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTask={handleAddTask}
        darkMode={darkMode}
      />
      <EditTaskModal
        isOpen={!!editTask}
        onClose={() => setEditTask(null)}
        task={editTask}
        onUpdate={handleUpdateTask}
        darkMode={darkMode}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteTask}
        onClose={() => setDeleteTask(null)}
        onConfirm={handleDeleteTask}
        task={deleteTask}
      />
      <SignInModal
          isOpen={isSignInModalOpen}
          onClose={() => setIsSignInModalOpen(false)}
          onSignIn={handleSignin}
          darkMode={darkMode}
        />
      <SignUpModal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        onSignUp={handleSignup}
        darkMode={darkMode}
      />
    </div>
  );
}