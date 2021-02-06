import React from 'react';
import tailwind from "tailwind-rn";
import { Text, View } from "react-native";

export default function App() {
  return (
    <View style={tailwind("flex items-center mt-10")}>
      <Text style={tailwind("bg-gray-300 rounded p-4")}>Open up App.tsx to start working on your app!</Text>
    </View>
  );
}
