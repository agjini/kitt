import React, { useCallback, useEffect, useRef, useState } from 'react';
import tailwind from "tailwind-rn";
import { Platform, Text, View } from "react-native";
import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { format } from 'date-fns';
import { Feather } from '@expo/vector-icons';
import { Config, Quizz, TempoConfig, Time, TimeResult } from "./components/Quizz";
import { Csv } from "./utils/csv";
import { FileList } from "./components/FileList";
import { getJiraTicket, postTempoWorklog } from "./utils/jira";
import { QuizzList } from "./components/QuizzList";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function registerNotificationOnDay(weekday: number) {
  const trigger = {hour: 18, minute: 0, weekday, repeats: true};
  console.log("Triggered for ", trigger);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Pointage",
      body: "Qu'as-tu fait aujourd'hui Michael ?",
      vibrate: [1, 2, 1]
    },
    trigger: trigger
  });
}

async function registerNotification() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (let weekday = 2; weekday < 7; weekday++) {
    await registerNotificationOnDay(weekday);
  }
}

function reloadFiles() {
  return FileSystem.readDirectoryAsync(`${FileSystem.documentDirectory}`)
    .then(files => files.filter(f => f.endsWith(".csv")).map(f => {
      const strings = f.split("/");
      return strings[strings.length - 1];
    }))
    .then(files => files.sort());
}

async function readHistory(csvFile: string) {
  const info = await FileSystem.getInfoAsync(csvFile);
  if (!info.exists) {
    return [];
  }
  const inputContent = await FileSystem.readAsStringAsync(csvFile, {encoding: FileSystem.EncodingType.UTF8});
  return Csv.parse(inputContent);
}

const configFile = `${FileSystem.documentDirectory}config.json`;
const quizzTodoFile = `${FileSystem.documentDirectory}todo.json`;

async function readQuizzTodo(): Promise<Date[]> {
  const info = await FileSystem.getInfoAsync(quizzTodoFile);
  if (!info.exists) {
    return [];
  }
  const inputContent = await FileSystem.readAsStringAsync(quizzTodoFile, {encoding: FileSystem.EncodingType.UTF8});
  return JSON.parse(inputContent) as Date[];
}

async function saveQuizzTodo(quizzes: Date[]) {
  await FileSystem.writeAsStringAsync(quizzTodoFile, JSON.stringify(quizzes), {encoding: FileSystem.EncodingType.UTF8});
}

async function readConfig(): Promise<Config | undefined> {
  const info = await FileSystem.getInfoAsync(configFile);
  if (!info.exists) {
    return;
  }
  const inputContent = await FileSystem.readAsStringAsync(configFile, {encoding: FileSystem.EncodingType.UTF8});
  return JSON.parse(inputContent) as Config;
}

async function persistCsvTimesheet(quizzDone: TimeResult) {
  if (Platform.OS !== 'web') {
    const csvFile = `${FileSystem.documentDirectory}${format(quizzDone.date, "yyyy")}.csv`;
    const history = await readHistory(csvFile);
    const timesheet: any = {date: format(quizzDone.date, "yyyy-MM-dd")};
    for (const time of quizzDone.times) {
      timesheet[time.id] = `${time.time}h`;
    }
    const all = [...history, timesheet];
    const content = Csv.format(all);
    await FileSystem.writeAsStringAsync(csvFile, content, {encoding: FileSystem.EncodingType.UTF8});
  }
}

interface TempoUpdate {
  ticket: string;
  time: number;
  tempo: TempoConfig;
}

async function getTempoUpdates(times: Time[], config: Config) {
  const tempoUpdates: TempoUpdate[] = [];
  for (let time of times) {
    const task = config.tasks.find(t => t.id === time.id);
    if (task && task.jira) {
      const jiraConfig = task.jira?.config || config.defaultJiraConfig;
      if (jiraConfig.tempo) {
        const ticket = await getJiraTicket(task.jira, jiraConfig);
        if (ticket) {
          tempoUpdates.push({ticket: ticket.key, time: time.time, tempo: jiraConfig.tempo});
        }
      }
    }
  }
  return tempoUpdates;
}

export default function App() {
  const [quizzes, setQuizzes] = useState<Date[]>([]);
  const [currentQuizz, setCurrentQuizz] = useState<Date>();
  const [files, setFiles] = useState<string[]>([]);
  const [config, setConfig] = useState<Config>();
  const [saving, setSaving] = useState(false);
  const responseListener = useRef();

  useEffect(() => {
    saveQuizzTodo(quizzes).then();
  }, [quizzes]);

  useEffect(() => {

    if (Platform.OS !== 'web') {

      readQuizzTodo()
        .then(quizzes => setQuizzes(quizzes));

      readConfig()
        .then(config => setConfig(config));

      reloadFiles()
        .then(files => setFiles(files));

      registerNotification()
        .then();

      // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        const date = new Date(response.notification.date);
        date.setHours(0, 0, 0, 0);
        setQuizzes([...quizzes, date]);
        setCurrentQuizz(date);
      });

      return () => {
        Notifications.removeNotificationSubscription(responseListener);
      };
    }
  }, []);

  const selectQuizz = useCallback((q) => {
    setCurrentQuizz(q);
  }, []);

  const closeQuizz = useCallback(() => {
    setCurrentQuizz(undefined);
  }, []);

  const saveQuizz = useCallback(async (quizzDone: TimeResult) => {
    setSaving(true);
    try {
      if (config) {
        const tempoUpdates = await getTempoUpdates(quizzDone.times, config);
        for (const tempoUpdate of tempoUpdates) {
          await postTempoWorklog(tempoUpdate.ticket, format(quizzDone.date, "yyyy-MM-dd"), "08:00:00", tempoUpdate.time * 3600, tempoUpdate.tempo);
        }
      }
      await persistCsvTimesheet(quizzDone);
      await saveQuizzTodo(quizzes.filter(d => d !== quizzDone.date));
      setCurrentQuizz(undefined);
    } finally {
      setSaving(false);
    }
  }, [quizzes, currentQuizz, config]);

  const deleteFile = async (file: string) => {
    const csvFile = `${FileSystem.documentDirectory}${file}`;
    await FileSystem.deleteAsync(csvFile);
    setFiles(await reloadFiles());
  }

  const downloadConfig = useCallback(async () => {
    const document = await DocumentPicker.getDocumentAsync({type: "*/*", copyToCacheDirectory: false});
    if (document.type == "success") {
      if (Platform.OS !== 'web') {
        await FileSystem.copyAsync({from: document.uri, to: configFile});
        const newVar = await readConfig();
        setConfig(newVar);
      }
    }
  }, []);

  const [devModeCounter, setDevModeCounter] = useState(0);
  const devMode = useCallback(async () => {
    let count = devModeCounter + 1;
    if (count >= 10) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      setQuizzes([...quizzes, date]);
      count = 0;
    }
    setDevModeCounter(count);
  }, [devModeCounter]);

  if (!config) {
    return <View style={tailwind("flex mt-20 items-center h-full")}>
      <Text style={tailwind("flex mt-20 text-center text-gray-700 text-lg")}>Donne moi un fichier de configuration stp
        Michael !</Text>
      <Feather
        style={tailwind("flex mt-20 text-center text-blue-500 text-4xl font-bold p-4")}
        name="settings"
        onPress={() => downloadConfig()}/>
    </View>;
  } else if (currentQuizz) {
    return <View style={tailwind("flex flex-col mt-20")}>
      <Quizz quizz={currentQuizz} config={config} onQuizzDone={saveQuizz} loading={saving} onClose={closeQuizz}/>
    </View>;
  } else {
    return <View style={tailwind("h-full flex flex-col mt-20")} onTouchStart={() => devMode()}>
      {
        quizzes.length > 0
          ? <QuizzList quizzes={quizzes} onSelect={selectQuizz}/>
          : <FileList files={files} onDelete={deleteFile}/>
      }
      <View style={tailwind("flex flex-col mt-20 items-center h-20")}>
        <Feather
          style={tailwind("mt-20 text-center text-gray-500 border-gray-500 text-2xl font-bold p-4")}
          name="settings"
          onPress={() => downloadConfig()}/>
      </View>
    </View>;
  }
}
