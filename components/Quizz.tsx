import { Button, Text, View } from "react-native";
import React from "react";

interface QuizzProps {
  quizz?: Date;
  onQuizzDone: (quizzDone: Date) => void;
}

export function Quizz({quizz, onQuizzDone}: QuizzProps) {
  if (!quizz) {
    return <View>
      <Text>Plus de pointage à faire pour aujourd'hui</Text>
    </View>;
  }
  return <View>
    <Button title="Salut" onPress={() => onQuizzDone(quizz)}/>
  </View>;
}