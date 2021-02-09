import { Button, GestureResponderEvent, LayoutChangeEvent, Text, View } from "react-native";
import React, { useCallback, useState } from "react";
import tailwind from "tailwind-rn";
import { HourBox } from "./HourBox";
import { TaskList } from "./TaskList";

interface QuizzProps {
  quizz?: Date;
  onQuizzDone: (result: TimeResult) => void;
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
  color: "gray" | "red" | "green" | "yellow";
  percent?: number;
  jira?: JiraTask;
}

export interface JiraConfig {
  account: string,
  token: string
}

export interface Config {
  defaultJiraConfig: JiraConfig;
  tasks: Task[];
}

const jiraConfig: JiraConfig = {
  account: "augustin.gjini@synergee.com",
  token: "EVCZrENA24huoA5otLUT079F"
}

const config: Config = {
  defaultJiraConfig: jiraConfig,
  tasks: [
    {
      id: "none",
      title: "Pas travaillé",
      color: "gray"
    },
    {
      id: "synergee",
      title: "Synergee - Management",
      color: "red",
      percent: 0.5,
      jira: {
        config: jiraConfig,
        ticket: "SYN-16666",
        keep: 2
      }
    },
    {
      id: "synergee",
      title: "Synergee - Dev",
      color: "yellow",
      percent: 0.1,
      jira: {
        config: jiraConfig,
        status: "6 In Progress"
      }
    },
    {
      id: "liane",
      title: "Liane",
      color: "green"
    }
  ]
};

export interface Time {
  id: string;
  title: string;
  time: number;
}

export interface TimeResult {
  date: Date;
  times: Time[];
}

export function Quizz({quizz, onQuizzDone}: QuizzProps) {
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
      setHourValue(i, currentTaskIndex);
    }
  }, [currentTaskIndex, hours, width]);

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

  return <View style={tailwind("h-full")}>
    <View style={tailwind("items-center")}><Text>{quizz.toLocaleDateString()}</Text></View>
    <TaskList tasks={config.tasks} selectedValue={currentTaskIndex} onSelect={setCurrentTaskIndex}/>
    <View style={tailwind("flex flex-row mt-32")}
          onLayout={onLayout}
          onTouchMove={onTouchMove}>
      {hours.map((h, i) => <HourBox key={i} value={h} tasks={config.tasks}/>)}
    </View>
    <View style={tailwind("mt-6 p-6")}>
      <Button title="Valider" onPress={() => submit()}/>
    </View>
  </View>;
}