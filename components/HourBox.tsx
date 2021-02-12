import { View } from "react-native";
import React from "react";
import tailwind from "tailwind-rn";
import { Task } from "./Quizz";

interface HourBoxProps {
  value: number;
  tasks: Task[];
}

export function HourBox({value, tasks}: HourBoxProps) {
  const task = tasks[value];
  return <View
    style={tailwind(`w-10 h-10 bg-${task.color}-300 text-${task.color}-500 m-1 border-2 border-${task.color}-600 rounded`)}>
  </View>;
}