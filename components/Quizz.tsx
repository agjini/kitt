import { Button, GestureResponderEvent, LayoutChangeEvent, Text, View } from "react-native";
import React, { useCallback, useState } from "react";
import tailwind from "tailwind-rn";
import { HourBox } from "./HourBox";

interface QuizzProps {
  quizz?: Date;
  onQuizzDone: (quizzDone: Date) => void;
}

export function Quizz({quizz, onQuizzDone}: QuizzProps) {
  if (!quizz) {
    return <View>
      <Text style={tailwind("bg-gray-300 rounded p-4")}>Plus de pointage à faire pour aujourd'hui</Text>
    </View>;
  }
  const [hours, setHours] = useState([0, 0, 0, 0, 0, 0, 0, 0]);
  const [width, setWidth] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);

  const setHourValue = (index: number, value: number) => {
    setHours(hours.map((h, i) => {
      if (i == index) {
        return value;
      }
      return h;
    }));
  };

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  const onTouchMove = useCallback((e: GestureResponderEvent) => {
    if (width > 0) {
      let i = Math.floor((e.nativeEvent.pageX / width) * hours.length);
      if (i < 0) {
        i = 0;
      } else if (i > (hours.length - 1)) {
        i = hours.length - 1;
      }
      setHourValue(i, currentValue);
    }
  }, [currentValue, hours, width]);

  return <View>
    <View style={tailwind("m-8")}>
      <Button title="Pas travaillé" onPress={() => setCurrentValue(0)}/>
    </View>
    <View style={tailwind("m-8")}>
      <Button title="Synergee" onPress={() => setCurrentValue(1)}/>
      <View style={tailwind("m-8")}>
      </View>
      <Button title="Liane" onPress={() => setCurrentValue(2)}/>
    </View>
    <View style={tailwind("flex flex-row mt-32")}
          onLayout={onLayout}
          onTouchMove={onTouchMove}>
      {hours.map((h, i) => <HourBox key={i} value={h} onValueChanged={v => setHourValue(i, v)}/>)}
    </View>
  </View>;
}