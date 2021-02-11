import React, { useCallback, useEffect, useRef, useState } from 'react';
import tailwind from "tailwind-rn";
import { Platform, Text, View } from "react-native";
import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { format } from 'date-fns';
import { Feather } from '@expo/vector-icons';
import { Config, Quizz, TimeResult } from "./components/Quizz";
import { Csv } from "./utils/csv";
import { FileList } from "./components/FileList";
import { getJiraTicket, postTempoWorklog } from "./utils/jira";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function registerNotification() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Pointage",
      body: "Qu'as-tu fait aujourd'hui Michael ?",
      vibrate: [1, 2, 1]
    },
    trigger: {hour: 18, minute: 0, repeats: true}
  });
  const d = new Date();
  d.setHours(18, 0, 0, 0);
  return d;
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

async function readConfig(): Promise<Config | undefined> {
  const info = await FileSystem.getInfoAsync(configFile);
  if (!info.exists) {
    return;
  }
  const inputContent = await FileSystem.readAsStringAsync(configFile, {encoding: FileSystem.EncodingType.UTF8});
  return JSON.parse(inputContent) as Config;
}

async function persistCsvTimesheet(quizzDone: TimeResult) {
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

export default function App() {
  const [quizzes, setQuizzes] = useState<Date[]>([new Date(2021, 2, 7)]);
  const [files, setFiles] = useState<string[]>([]);
  const [config, setConfig] = useState<Config>();
  const responseListener = useRef();

  useEffect(() => {

    if (Platform.OS !== 'web') {

      readConfig()
        .then(config => setConfig(config));

      reloadFiles()
        .then(files => setFiles(files));

      registerNotification()
        .then();

      // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        const d = new Date(response.notification.date);
        d.setHours(0, 0, 0, 0);
        setQuizzes([...quizzes, d]);
      });

      return () => {
        Notifications.removeNotificationSubscription(responseListener);
      };
    }
  }, []);

  const resetCurrentNotification = useCallback(async (quizzDone: TimeResult) => {
    await persistCsvTimesheet(quizzDone);
    if (config) {
      for (let time of quizzDone.times) {
        const task = config.tasks.find(t => t.id === time.id);
        if (task && task.jira) {
          console.log("icici")
          console.log("icici", config.defaultJiraConfig)
          const jiraConfig = task.jira?.config || config.defaultJiraConfig;
          if (jiraConfig.tempo) {
            console.log("oui")
            const ticket = await getJiraTicket(task, jiraConfig);
            console.log("oui", ticket)
            if (ticket) {
              await postTempoWorklog(ticket, format(quizzDone.date, "yyyy-MM-dd"), "08:00:00", time.time * 3600, jiraConfig.tempo);
            }
          }
        }
      }
    }
    setQuizzes(quizzes.filter((d, i) => i !== 0));
  }, [quizzes, config]);

  const deleteFile = async (file: string) => {
    const csvFile = `${FileSystem.documentDirectory}${file}`;
    await FileSystem.deleteAsync(csvFile);
    setFiles(await reloadFiles());
  }

  const downloadConfig = useCallback(async () => {
    const document = await DocumentPicker.getDocumentAsync({type: "*/*", copyToCacheDirectory: false});
    if (document.type == "success") {
      await FileSystem.deleteAsync(document.uri);
      await FileSystem.copyAsync({from: document.uri, to: configFile});
      const newVar = await readConfig();
      setConfig(newVar);
      console.log("config", newVar)
    }
  }, []);

  if (!config) {
    return <View style={tailwind("flex mt-20 items-center")}>
      <Text style={tailwind("flex mt-20 text-center text-gray-700 text-lg")}>Donne moi un fichier de configuration stp
        Michael !</Text>
      <Feather
        style={tailwind("flex mt-20 text-center text-blue-500 text-4xl font-bold p-4")}
        name="settings"
        onPress={() => downloadConfig()}/>
    </View>;
  } else {
    return <View style={tailwind("flex flex-col mt-20")}>
      {
        quizzes.length > 0
          ? <Quizz quizz={quizzes[0]} config={config} onQuizzDone={resetCurrentNotification}/>
          : <FileList files={files} onDelete={deleteFile}/>
      }
      <View style={tailwind("h-96")}/>
      <View style={tailwind("flex flex-col mt-20 items-center")}>
        <Feather
          style={tailwind("mt-20 text-center text-gray-500 border-gray-500 text-2xl font-bold p-4")}
          name="settings"
          onPress={() => downloadConfig()}/>
      </View>
    </View>;
  }
}