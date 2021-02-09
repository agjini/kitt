import { View } from "react-native";
import React from "react";
import { Task } from "./Quizz";
import { TaskItem } from "./TaskItem";

interface TaskListProps {
  tasks: Task[];
  selectedValue: number;
  onSelect: (taskIndex: number) => void;
  size?: "sm" | "lg" | "md" | "xl";
}

export function TaskList({tasks, selectedValue, onSelect, size}: TaskListProps) {
  return <View>
    {
      tasks.map((t, i) =>
        <TaskItem
          key={i}
          index={i}
          value={t}
          selected={selectedValue == i}
          selectedValue={selectedValue}
          onSelect={onSelect}
          size={size}
          color={t.color}/>
      )
    }
  </View>;
}