import React, { useCallback, useEffect, useRef, useState } from 'react';
import tailwind from "tailwind-rn";
import { Platform, View } from "react-native";
import * as Notifications from 'expo-notifications';
import { Quizz } from "./components/Quizz";

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

export default function App() {
  const [quizzes, setQuizzes] = useState<Date[]>([new Date(2021, 2, 7)]);
  const [nextNotificationScheduledAt, setNextNotificationScheduledAt] = useState<Date>();
  const responseListener = useRef();

  useEffect(() => {

    if (Platform.OS !== 'web') {
      registerNotification()
        .then((d) => setNextNotificationScheduledAt(d));

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

  const resetCurrentNotification = useCallback((quizzDone) => {
    console.log("icici", quizzDone)
    setQuizzes(quizzes.filter((d, i) => i !== 0));
  }, [quizzes]);

  return (
    <View style={tailwind("flex items-center mt-20")}>
      <Quizz quizz={quizzes[0]} onQuizzDone={resetCurrentNotification}/>
    </View>
  );
}