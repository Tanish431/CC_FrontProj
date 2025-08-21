import React from "react";
import TaskCard from "./TaskCard";

export default function Column({ title, tasks }) {
  return (
    <div className={`column ${title.replace(/\s+/g, '-').toLowerCase()}`}>
      <h3>{title}</h3>
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
