import React, { useCallback, useEffect, useRef, useState } from 'react';
import tailwind from "tailwind-rn";
import { Platform, View } from "react-native";
import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system';
import { format } from 'date-fns';
import { Quizz, TimeResult } from "./components/Quizz";
import { Csv } from "./utils/csv";
import { FileList } from "./components/FileList";

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
    }));
}

async function readHistory(csvFile: string) {
  const info = await FileSystem.getInfoAsync(csvFile);
  if (!info.exists) {
    const inputContent = await FileSystem.readAsStringAsync(csvFile, {encoding: FileSystem.EncodingType.UTF8});
    return Csv.parse(inputContent);
  }
  return [];
}

export default function App() {
  const [quizzes, setQuizzes] = useState<Date[]>([new Date(2021, 2, 7)]);
  const [files, setFiles] = useState<string[]>([]);
  const responseListener = useRef();

  useEffect(() => {
    if (Platform.OS !== 'web') {
      reloadFiles()
        .then(files => setFiles(files));
    }
  });

  useEffect(() => {

    if (Platform.OS !== 'web') {

      registerNotification()
        .then();

      // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        const d = new Date(response.notification.date);
        d.setHours(0, 0, 0, 0);
        setQuizzes([...quizzes, d]);
      });

      return () => {
        // Notifications.removeNotificationSubscription(notificationListener);
        Notifications.removeNotificationSubscription(responseListener);
      };
    }
  }, []);

  const resetCurrentNotification = useCallback(async (quizzDone: TimeResult) => {
    const csvFile = `${FileSystem.documentDirectory}${format(quizzDone.date, "yyyy")}.csv`;
    const history = await readHistory(csvFile);
    const timesheet: any = {date: format(quizzDone.date, "yyyy-MM-dd")};
    for (const time of quizzDone.times) {
      timesheet[time.id] = `${time.time}h`;
    }
    console.log("sfdsd",timesheet)
    const all = [...history, ...timesheet];
    const content = Csv.format(all);
    await FileSystem.writeAsStringAsync(csvFile, content, {encoding: FileSystem.EncodingType.UTF8})
    setQuizzes(quizzes.filter((d, i) => i !== 0));
  }, [quizzes]);

  const deleteFile = async (file: string) => {
    const csvFile = `${FileSystem.documentDirectory}${file}`;
    await FileSystem.deleteAsync(csvFile);
    setFiles(await reloadFiles());
  }

  return (
    <View style={tailwind("flex mt-20")}>
      {
        quizzes.length > 0
          ? <Quizz quizz={quizzes[0]} onQuizzDone={resetCurrentNotification}/>
          : <FileList files={files} onDelete={deleteFile}/>
      }
    </View>
  );
}