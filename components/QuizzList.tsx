import { Text, View } from "react-native";
import React from "react";
import { QuizzItem } from "./QuizzItem";

interface QuizzListProps {
  quizzes: Date[];
  onSelect: (quizz: Date) => void;
}

export function QuizzList({quizzes, onSelect}: QuizzListProps) {
  if (quizzes.length > 0) {
    return <View>
      {quizzes.map((f, i) => <QuizzItem key={i} quizz={f} onSelect={onSelect}/>)}
    </View>;
  }
  return <Text>Pas de feuille de temps à remplir</Text>;
}
