import { View } from "react-native";
import React from "react";
import { JiraConfig, Task } from "./Quizz";
import { TaskItem } from "./TaskItem";
import tailwind from "tailwind-rn";

interface TaskListProps {
  tasks: Task[];
  selectedValue: number;
  onSelect: (taskIndex: number) => void;
  defaultJiraConfig: JiraConfig;
}

export function TaskList({tasks, selectedValue, onSelect, defaultJiraConfig}: TaskListProps) {
  return <View style={tailwind("w-full")}>
    {
      tasks.map((t, i) =>
        <TaskItem
          key={i}
          index={i}
          value={t}
          selected={selectedValue == i}
          defaultJiraConfig={defaultJiraConfig}
          onSelect={onSelect}/>
      )
    }
  </View>;
}