import React, { useState } from "react";

export default function TaskForm({ addTask }) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !due) return;
    addTask({
      id: Date.now().toString(),
      title,
      due,
      status: "Not Started"
    });
    setTitle("");
    setDue("");
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h2>Create Task</h2>
      <input
        type="text"
        placeholder="Task name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        type="date"
        value={due}
        onChange={(e) => setDue(e.target.value)}
      />
      <button type="submit">Add Task</button>
    </form>
  );
}
