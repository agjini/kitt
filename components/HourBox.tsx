import { View } from "react-native";
import React from "react";
import tailwind from "tailwind-rn";

interface HourBoxProps {
  value: number;
  onValueChanged?: (h: number) => void
}

function getHourColor(value: number) {
  switch (value) {
    case 0:
      return "bg-gray-200";
    case 1:
      return "bg-green-200";
    case 2:
      return "bg-red-200";
  }
}

export function HourBox({value, onValueChanged}: HourBoxProps) {
  const color = getHourColor(value);
  return <View style={tailwind(`w-10 h-10 ${color} m-1`)}>
  </View>;
}