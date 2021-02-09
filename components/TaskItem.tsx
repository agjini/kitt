import { Text, View } from "react-native";
import React from "react";
import tailwind from "tailwind-rn";
import { Task } from "./Quizz";

interface TaskItemProps {
  index: number;
  value: Task;
  selected?: boolean;
  onSelect?: (taskIndex: number) => void;
}

export function TaskItem({index, value, selected = false, onSelect}: TaskItemProps) {

  return <View
    style={tailwind(`p-2 m-1 rounded bg-${value.color}-200 text-${value.color}-500 text-xl font-bold text-center border-2 ${selected ? `border-${value.color}-500` : `border-${value.color}-200`}`)}
  >
    <Text
      style={tailwind(`text-${value.color}-500 text-xl font-bold text-center`)}
      onPress={() => onSelect && onSelect(index)}>{value.title}</Text>
  </View>;
}