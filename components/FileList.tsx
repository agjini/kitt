import { Text, View } from "react-native";
import React from "react";
import { FileItem } from "./FileItem";

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
  return <Text>Pas de feuille de temps enreistrée</Text>;
}
