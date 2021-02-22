import { Text, View } from "react-native";
import React from "react";
import { FileItem } from "./FileItem";
import tailwind from "tailwind-rn";

interface FileListProps {
  files: string[];
  onDelete: (file: string) => void;
}

export function FileList({files, onDelete}: FileListProps) {
  if (files.length > 0) {
    return <View>
      {files.map((f, i) => <FileItem key={i} file={f} onDelete={onDelete}/>)}
    </View>;
  }
  return <Text style={tailwind("text-center text-gray-600")}>Pas de feuille de temps enregistrée</Text>;
}
