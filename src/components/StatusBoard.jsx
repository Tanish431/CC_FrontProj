import React from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import Column from "./Column";

export default function StatusBoard({ tasks, updateTaskStatus }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const statuses = ["Not Started", "In Progress", "Done"];

  const onDragEnd = (event) => {
    const { over, active } = event;
    if (!over) return;

    const newStatus = over.id;
    updateTaskStatus(active.id, newStatus);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
      <div className="board">
        {statuses.map(status => (
          <SortableContext key={status} id={status} items={tasks.filter(t => t.status === status)} strategy={verticalListSortingStrategy}>
            <Column title={status} tasks={tasks.filter(t => t.status === status)} />
          </SortableContext>
        ))}
      </div>
    </DndContext>
  );
}
