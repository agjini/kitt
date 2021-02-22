import { Text, View } from "react-native";
import React from "react";
import tailwind from "tailwind-rn";
import { Feather } from '@expo/vector-icons';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { QuizzDate, ToDate } from "../api/quizz";

interface QuizzItemProps {
  quizz: QuizzDate;
  onSelect: (quizz: QuizzDate) => void;
}

export function QuizzItem({quizz, onSelect}: QuizzItemProps) {
  return <View
    style={tailwind(`flex flex-row rounded justify-between items-center p-2 px-6 m-1 mx-6 border border-gray-200`)}
    onTouchStart={() => onSelect(quizz)}>
    <Text
      style={tailwind(`text-gray-700 text-xl mr-6`)}>{format(ToDate(quizz), "iiii dd MMM yyyy", {locale: fr})}</Text>
    <View style={tailwind("flex-1")}/>
    <Feather style={tailwind(`text-blue-500 font-bold text-2xl`)} name="calendar"/>
  </View>;
}
