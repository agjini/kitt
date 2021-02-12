import { Text, View } from "react-native";
import React from "react";
import tailwind from "tailwind-rn";
import { Feather } from '@expo/vector-icons';
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface QuizzItemProps {
  quizz: Date;
  onSelect: (quizz: Date) => void;
}

export function QuizzItem({quizz, onSelect}: QuizzItemProps) {
  return <View
    style={tailwind(`flex flex-row justify-between items-center p-2 px-6 m-1 mx-6 border border-gray-200`)}
    onTouchStart={() => onSelect(quizz)}>
    <Text
      style={tailwind(`text-gray-700 text-xl mr-6`)}>{format(quizz, "iiii dd MMM yyyy", {locale: fr})}</Text>
    <View style={tailwind("flex-1")}/>
    <Feather style={tailwind(`text-blue-500 font-bold text-2xl`)} name="calendar"/>
  </View>;
}