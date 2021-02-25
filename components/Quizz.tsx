import { ActivityIndicator, GestureResponderEvent, LayoutChangeEvent, Text, View } from "react-native";
import React, { useCallback, useState } from "react";
import tailwind from "tailwind-rn";
import { HourBox } from "./HourBox";
import { TaskList } from "./TaskList";
import { format } from "date-fns";
import { Feather } from '@expo/vector-icons';
import { fr } from "date-fns/locale";
import { QuizzDate, ToDate } from "../api/quizz";

interface QuizzProps {
  quizz?: QuizzDate;
  config: Config;
  onQuizzDone: (result: TimeResult) => void;
  onClose: () => void;
  loading?: boolean;
}

export interface JiraTask {
  config?: JiraConfig;
  ticket?: string;
  status?: string;
  keep?: number;
}

export interface Task {
  id: string;
  title: string;
  color: "gray" | "red" | "green" | "yellow" | "blue" | "indigo" | "purple";
  percent?: number;
  jira?: JiraTask;
}

export interface TempoConfig {
  accountId: string;
  apiKey: string;
}

export interface JiraConfig {
  account: string;
  token: string;
  tempo?: TempoConfig;
}

export interface Config {
  defaultJiraConfig: JiraConfig;
  tasks: Task[];
}

export interface Time {
  id: string;
  title: string;
  time: number;
}

export interface TimeResult {
  date: QuizzDate;
  times: Time[];
}

export function Quizz({quizz, config, onQuizzDone, loading = false, onClose}: QuizzProps) {
  if (!quizz) {
    return <View>
      <Text style={tailwind("bg-gray-300 rounded p-4")}>Plus de pointage à faire pour aujourd'hui</Text>
    </View>;
  }

  const defaultHours = config.tasks
    .flatMap((t, index) => {
      const h = [];
      if (t.percent) {
        const number = t.percent * 8;
        for (let i = 0; i < number; i++) {
          h.push(index);
        }
      }
      return h;
    })
    .flat()
    .slice(0, 8);

  for (let i = defaultHours.length; i < 8; i++) {
    defaultHours.push(0);
  }

  const [hours, setHours] = useState(defaultHours);
  const [x, setX] = useState(0);
  const [width, setWidth] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  const setHourValue = (index: number, value: number) => {
    setHours(hours.map((h, i) => {
      if (i == index) {
        return value;
      }
      return h;
    }));
  };

  const onLayout = (e: LayoutChangeEvent) => {
    setX(e.nativeEvent.layout.x);
    setWidth(e.nativeEvent.layout.width);
  };

  const onTouchMove = useCallback((e: GestureResponderEvent) => {
    if (width > 0) {
      let i = Math.floor(((e.nativeEvent.pageX - x) / width) * hours.length);
      if (i >= 0 && i <= (hours.length - 1)) {
        setHourValue(i, currentTaskIndex);
      }
    }
  }, [currentTaskIndex, hours, x, width]);

  const submit = useCallback(() => {
    const times = config.tasks
      .map((t, i) => {
        const time = hours.filter(h => h === i)
          .length;
        return ({
          id: t.id,
          title: t.title,
          time
        });
      })
      .filter(t => t.time > 0);
    onQuizzDone({date: quizz, times});
  }, [hours]);

  return <View style={tailwind("h-full flex items-center")}>
    <View style={tailwind("items-center")}>
      <Text
        style={tailwind("m-4 text-xl text-gray-600 font-bold")}>{format(ToDate(quizz), "iiii dd MMM yyyy", {locale: fr})}</Text>
    </View>
    <TaskList tasks={config.tasks} selectedValue={currentTaskIndex} onSelect={setCurrentTaskIndex}
              defaultJiraConfig={config.defaultJiraConfig}/>
    <View style={tailwind("flex flex-1 flex-row mt-10")}
          onLayout={onLayout}
          onTouchMove={onTouchMove}>
      {hours.map((h, i) => <HourBox key={i} value={h} tasks={config.tasks}/>)}
    </View>
    <View style={tailwind("absolute bottom-0 mt-24 w-full bg-gray-600")}>
      {
        loading
          ? <ActivityIndicator animating={true} size="large" color="#F3F4F6"/>
          : <View style={tailwind("flex flex-row w-full justify-around")}>
            <View style={tailwind("items-center p-10")} onTouchStart={() => onClose()}>
              <Feather style={tailwind(`text-gray-100 font-bold text-4xl`)} name="skip-back"/>
            </View>
            <View style={tailwind("items-center p-10")} onTouchStart={() => submit()}>
              <Feather style={tailwind(`text-gray-100 font-bold text-4xl`)} name="save"/>
            </View>
          </View>
      }
    </View>
  </View>;
}

