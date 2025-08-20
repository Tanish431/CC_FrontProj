import React, { useState } from "react";
import {
  DndContext,
  closestCorners,
  useDroppable,
  DragOverlay,
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
function TaskCard({ task }) {
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

  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="task-card group relative"
    >
      {/* Edit Button */}
      <button
        onClick={() => onEdit(task)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition bg-gray-200 hover:bg-gray-300 p-1 rounded-full shadow"
      >
        <FiEdit size={16} />
      </button>

      <p className="task-title">{task.title}</p>

      <div className={`task-due ${dueStatus.className}`}>{dueStatus.text}</div>

      {/* Delete Button */}
      <button
        onClick={() => onDelete(task)}
        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition bg-red-200 hover:bg-red-300 p-1 rounded-full shadow"
      >
        <AiOutlineDelete size={18} />
      </button>
    </div>
  );
}

// Column
function Column({ id, title, tasks, isOver }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`column ${isOver ? "column-over" : ""}`}
    >
      <h3>{title}</h3>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={(task) => setEditTask(task)} onDelete={(task) => setDeleteTask(task)}/>
        ))}
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !due) return;

    onUpdate({ ...task, title, due });
    onClose();
  };

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

  const [tasks, setTasks] = useState([
    { id: "1", title: "Go to the Gym", status: "not-started", due: "2025-08-25" },
    { id: "2", title: "Learn React DnD Kit", status: "not-started", due: "2025-08-20" },
    { id: "3", title: "Play Fortnite", status: "in-progress", due: "2025-08-18" },
    { id: "4", title: "Call mom", status: "done", due: "2025-08-10" },
  ]);

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
      return diff > 7;
    }),
  };

  return (
    <div className="app">
      {/* Navbar */}
      <div className="navbar">
        {["status", "today", "week", "upcoming"].map((tab) => (
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
              : "Upcoming"}
          </button>
        ))}
        <button className="new-task-btn" onClick={() => setIsModalOpen(true)}>
          + New Task
        </button>
      </div>

      {/* Status Screen */}
      {activeTab === "status" && (
        <DndContext
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

      {/* Today / Week / Upcoming */}
      {["today", "week", "upcoming"].includes(activeTab) && (
        <div className="filtered-tasks">
          {filteredTasks[activeTab].length === 0 ? (
            <p className="empty-text">No tasks here 🎉</p>
          ) : (
            filteredTasks[activeTab].map((task) => {
              const dueStatus = getDueStatus(task.due);
              return (
                <div key={task.id} className="task-card">
                  <p className="task-title">{task.title}</p>
                  <div
                    className={`task-due ${dueStatus.className}`}
                  >
                    {dueStatus.text}
                  </div>
                </div>
              );
            })
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