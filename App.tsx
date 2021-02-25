import React, { useCallback, useEffect, useRef, useState } from 'react';
import tailwind from "tailwind-rn";
import { Platform, Text, View } from "react-native";
import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { format } from 'date-fns';
import { Feather } from '@expo/vector-icons';
import { Config, Quizz, TempoConfig, Time, TimeResult } from "./components/Quizz";
import { Csv } from "./api/csv";
import { FileList } from "./components/FileList";
import { getJiraTicket, postTempoWorklog } from "./api/jira";
import { QuizzList } from "./components/QuizzList";
import { fr } from "date-fns/locale";
import { FromDate, QuizzDate, ToDate } from "./api/quizz";

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
  if (__DEV__) {
    console.log("No notification registred in dev mode");
    return false;
  } else {
    for (let weekday = 2; weekday < 7; weekday++) {
      await registerNotificationOnDay(weekday);
    }
    return true;
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

async function readQuizzTodo(): Promise<QuizzDate[]> {
  const info = await FileSystem.getInfoAsync(quizzTodoFile);
  if (!info.exists) {
    return [];
  }
  const inputContent = await FileSystem.readAsStringAsync(quizzTodoFile, {encoding: FileSystem.EncodingType.UTF8});
  console.log("Loading quizzes", inputContent)
  return JSON.parse(inputContent) as QuizzDate[];
}

async function persistQuizzes(quizzes: QuizzDate[]) {
  await FileSystem.writeAsStringAsync(quizzTodoFile, JSON.stringify(quizzes), {encoding: FileSystem.EncodingType.UTF8});
  return quizzes;
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
    const date = ToDate(quizzDone.date);
    const csvFile = `${FileSystem.documentDirectory}${format(date, "yyyy")}.csv`;
    const history = await readHistory(csvFile);
    const timesheet: any = {date: format(date, "yyyy-MM-dd", {locale: fr})};
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
  const [quizzes, setQuizzes] = useState<QuizzDate[]>([]);
  const [currentQuizz, setCurrentQuizz] = useState<number>(-1);
  const [files, setFiles] = useState<string[]>([]);
  const [config, setConfig] = useState<Config>();
  const [saving, setSaving] = useState(false);

  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    if (Platform.OS !== 'web') {
      readQuizzTodo()
        .then(quizzes => setQuizzes(quizzes));

      readConfig()
        .then(config => setConfig(config));

      reloadFiles()
        .then(files => setFiles(files));

      registerNotification()
        .then(r => {
          if (r) {
            console.log("Notifications registered");
          }
        });
    }
  }, []);

  useEffect(() => {

    if (Platform.OS !== 'web') {
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        const date = new Date(notification.date);
        persistQuizzes([...quizzes, FromDate(date)])
          .then(q => setQuizzes(q));
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
        if (quizzes.length > 0) {
          setCurrentQuizz(quizzes.length - 1);
        }
      });

      return () => {
        Notifications.removeNotificationSubscription(notificationListener);
        Notifications.removeNotificationSubscription(responseListener);
      };
    }
  }, [quizzes]);

  const selectQuizz = useCallback((q) => {
    setCurrentQuizz(q);
  }, []);

  const closeQuizz = useCallback(() => {
    setCurrentQuizz(-1);
  }, []);

  const saveQuizz = useCallback(async (quizzDone: TimeResult) => {
    setSaving(true);
    try {
      if (config) {
        const tempoUpdates = await getTempoUpdates(quizzDone.times, config);
        for (const tempoUpdate of tempoUpdates) {
          await postTempoWorklog(tempoUpdate.ticket, format(ToDate(quizzDone.date), "yyyy-MM-dd", {locale: fr}), "08:00:00", tempoUpdate.time * 3600, tempoUpdate.tempo);
        }
      }
      await persistCsvTimesheet(quizzDone);
      const newQuizzes = await persistQuizzes(quizzes.filter(d => d !== quizzDone.date));
      setCurrentQuizz(-1);
      setQuizzes(newQuizzes);
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
    if (count >= 6) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Pointage",
          body: "Notification de test Michael",
          vibrate: [1, 2, 1]
        },
        trigger: {seconds: 2}
      });
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
  } else if (currentQuizz >= 0 && currentQuizz < quizzes.length) {
    return <View style={tailwind("flex flex-col mt-20")}>
      <Quizz quizz={quizzes[currentQuizz]} config={config} onQuizzDone={saveQuizz} loading={saving}
             onClose={closeQuizz}/>
    </View>;
  } else {
    return <View style={tailwind("h-full flex flex-col mt-20")}>
      {
        quizzes.length > 0
          ? <QuizzList quizzes={quizzes} onSelect={selectQuizz}/>
          : <FileList files={files} onDelete={deleteFile}/>
      }
      <View style={tailwind("flex flex-col mt-20 items-center h-20")}>
        <Feather
          style={tailwind("mt-20 text-center text-gray-500 border-gray-500 text-3xl font-bold p-4")}
          name="settings"
          onPress={() => downloadConfig()}
          onLongPress={() => devMode()}/>
      </View>
    </View>;
  }
}
