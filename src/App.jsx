import React, { useState,useEffect } from "react";
import {
  DndContext,
  closestCorners,
  useDroppable,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
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

import { FiEdit } from "react-icons/fi";
import { AiOutlineDelete } from "react-icons/ai";

// Due Calculation Function
function getDueStatus(due) {
  const today = new Date();
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.1 : 1,
  };

  const dueStatus =
    task.status === "done"
      ? { text: "🎉 Well Done!!", className: "due-green" }
      : getDueStatus(task.due);
  
  const stopDrag = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  // Remove strike-through for completed tab
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
function Column({ id, title, tasks, isOver, setEditTask, setDeleteTask, handleToggleDone, activeTab }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`column ${isOver ? "column-over" : ""}`}
    >
      <h3>{title}</h3>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="non-status-view">
          {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={(task) => setEditTask(task)}
            onDelete={(task) => setDeleteTask(task)}
            onToggleDone={handleToggleDone}
            activeTab={activeTab}
          />))}
        </div>
      </SortableContext>
    </div>
  );
}

// Modal for adding tasks
function NewTaskModal({ isOpen, onClose, onAddTask }) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
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
    setDue("");
    setStatus("not-started");
    onClose();
  };

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
        <h2>Add New Task</h2>
        <form onSubmit={handleSubmit}>
          <label>Task Title</label>
          <input
            type="text"
            placeholder="Enter task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label>Due Date</label>
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            required
          />

          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="not-started">Not Started</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>

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

function EditTaskModal({ isOpen, onClose, task, onUpdate }) {
  const [title, setTitle] = useState(task?.title || "");
  const [due, setDue] = useState(task?.due || "");

  useEffect(() => {
    setTitle(task?.title || "");
    setDue(task?.due || "");
  }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !due) return;

    onUpdate({ ...task, title, due });
    onClose();
  };

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
        <h2>Edit Task</h2>
        <form onSubmit={handleSubmit}>
          <label>Task Title</label>
          <input
            type="text"
            placeholder="Enter task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label>Due Date</label>
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            required
          />

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

// Main App Component
export default function App() {
  const [activeTab, setActiveTab] = useState("status");
  const [activeTask, setActiveTask] = useState(null);
  const [overColumn, setOverColumn] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);

  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem("tasks");
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);


  const columns = [
    { key: "not-started", title: "Not Started" },
    { key: "in-progress", title: "In Progress" },
    { key: "done", title: "Done" },
  ];

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

    if (columns.find((c) => c.key === overId)) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overId } : t
        )
      );
      return;
    }

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
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overTask.status } : t
        )
      );
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }, // must move 6px before a drag starts
    })
  );

  const handleAddTask = (newTask) => {
    setTasks((prev) => [...prev, newTask]);
  };
  const handleUpdateTask = (updatedTask) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  };

  const handleDeleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToggleDone = (task) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: t.status === "done" ? "not-started" : "done",
            }
          : t
      )
    );  
  };

  const today = new Date();
  const filteredTasks = {
    today: tasks.filter((t) => {
      const diff =
        new Date(t.due).setHours(0, 0, 0, 0) -
        today.setHours(0, 0, 0, 0);
      return diff === 0;
    }),
    week: tasks.filter((t) => {
      const diff =
        (new Date(t.due).setHours(0, 0, 0, 0) -
          today.setHours(0, 0, 0, 0)) /
        (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    }),
    upcoming: tasks.filter((t) => {
      const diff =
        (new Date(t.due).setHours(0, 0, 0, 0) -
          today.setHours(0, 0, 0, 0)) /
        (1000 * 60 * 60 * 24);
      return diff > 7 && t.status !== "done";
    }),
    completed: tasks.filter((t) => t.status === "done"),
  };

  return (
    <div className="app">
      {/* Navbar */}
      <div className="navbar">
        {["status", "today", "week", "upcoming", "completed"].map((tab) => (
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
              : tab === "upcoming"
              ? "Upcoming"
              : "Completed"}
          </button>
        ))}
        <button className="new-task-btn" onClick={() => setIsModalOpen(true)}>
          + New Task
        </button>
      </div>

      {/* Status Screen */}
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
                    {getDueStatus(activeTask.due).text}
                  </p>
                </div>
              ) : null}
            </DragOverlay>,
            document.body
          )}
        </DndContext>
      )}
      
      {["today", "week", "upcoming", "completed"].includes(activeTab) && filteredTasks[activeTab] && (
  <div className="filtered-tasks">
    {filteredTasks[activeTab].length === 0 ? (
      <p className="empty-text">No tasks here 🎉</p>
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
      />
      <EditTaskModal
        isOpen={!!editTask}
        onClose={() => setEditTask(null)}
        task={editTask}
        onUpdate={handleUpdateTask}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteTask}
        onClose={() => setDeleteTask(null)}
        onConfirm={handleDeleteTask}
        task={deleteTask}
      />
    </div>
  );
}