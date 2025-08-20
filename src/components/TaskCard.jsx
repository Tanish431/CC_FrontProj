import React from "react";
import { useDraggable } from "@dnd-kit/core";

export default function TaskCard({ task }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
  };

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style} className="task-card">
      <p>{task.title}</p>
      <small>Due: {task.due}</small>
    </div>
  );
}
