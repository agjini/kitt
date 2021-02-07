import React, { useCallback, useEffect, useRef, useState } from 'react';
import tailwind from "tailwind-rn";
import { Platform, Text, View } from "react-native";
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Quizz } from "./components/Quizz";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [quizzes, setQuizzes] = useState<Date[]>([]);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {

    Notifications.scheduleNotificationAsync({
      content: {
        title: "Pointage",
        body: "Qu'as-tu fait aujourd'hui ?",
        vibrate: [1, 2, 1]
      },
      trigger: {hour: 15, minute: 25, repeats: true}
    })
      .then(value => console.log(value));

    // registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    // This listener is fired whenever a notification is received while the app is foregrounded
    // notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
    //   setNotification(notification);
    // });

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
  }, []);

  const resetCurrentNotification = useCallback((quizzDone) => {
    setQuizzes(quizzes.filter(d => d == quizzDone));
  }, [quizzes]);

  return (
    <View style={tailwind("flex items-center mt-10")}>
      <Text style={tailwind("bg-gray-300 rounded p-4")}>Open up App.tsx to start working on your app!</Text>
      <Quizz quizz={quizzes[0]} onQuizzDone={resetCurrentNotification}/>
    </View>
  );
}


async function registerForPushNotificationsAsync() {
  let token;
  if (Constants.isDevice) {
    const {status: existingStatus} = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const {status} = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}