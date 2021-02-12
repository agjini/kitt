import { View } from "react-native";
import React from "react";
import { JiraConfig, Task } from "./Quizz";
import { TaskItem } from "./TaskItem";

interface TaskListProps {
  tasks: Task[];
  selectedValue: number;
  onSelect: (taskIndex: number) => void;
  defaultJiraConfig: JiraConfig;
}

export function TaskList({tasks, selectedValue, onSelect, defaultJiraConfig}: TaskListProps) {
  return <View>
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