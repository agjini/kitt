import { Alert, Text, TouchableHighlight, View } from "react-native";
import React, { useCallback } from "react";
import tailwind from "tailwind-rn";
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface FileItemProps {
  file: string;
  onDelete: (file: string) => void;
}

export function FileItem({file, onDelete}: FileItemProps) {

  const deleteFile = useCallback((f: string) => {
    Alert.alert(
      "Confirmation",
      `Es-tu sûr de vouloir supprimer le feuille de temps ${f}?`,
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        {
          text: "Supprimer", onPress: () => onDelete(f)
        }
      ],
      {cancelable: false}
    );

  }, []);

  const share = useCallback(async (f: string) => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(`${FileSystem.documentDirectory}${f}`, {mimeType: "text/csv"});
    }
  }, []);

  return <View
    style={tailwind(`flex flex-row items-center p-2 m-1 mx-6 border border-gray-200 rounded`)}
  >
    <TouchableHighlight
      onPress={() => share(file)}
    >
      <View style={tailwind(`flex flex-row items-end`)}>
        <Feather style={tailwind(`text-gray-500 font-bold text-2xl mr-2`)} name="share" onPress={() => share(file)}/>
        <Text
          style={tailwind(`text-blue-500 text-xl mr-6`)}>{file}</Text>
      </View>
    </TouchableHighlight>
    <View style={tailwind("flex-1")}/>
    <Feather style={tailwind(`text-red-500 font-bold text-2xl mr-2`)} name="delete"
             onLongPress={() => deleteFile(file)}/>
  </View>;
}