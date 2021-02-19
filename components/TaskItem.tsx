import { Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import tailwind from "tailwind-rn";
import { JiraConfig, Task } from "./Quizz";
import { getJiraTicket, JiraIssue } from "../utils/jira";

interface TaskItemProps {
  index: number;
  value: Task;
  selected?: boolean;
  onSelect?: (taskIndex: number) => void;
  defaultJiraConfig: JiraConfig;
}

export function TaskItem({index, value, selected = false, onSelect, defaultJiraConfig}: TaskItemProps) {
  const [ticket, setTicket] = useState<JiraIssue>();

  useEffect(() => {
    if (value.jira) {
      const jiraConfig = value.jira?.config || defaultJiraConfig;
      getJiraTicket(value.jira, jiraConfig)
        .then(t => {
          setTicket(t)
        });
    }
  }, []);

  return <View
    style={tailwind(`p-2 m-1 rounded bg-${value.color}-200 text-${value.color}-500 text-xl font-bold border-2 ${selected ? `border-${value.color}-500` : `border-${value.color}-200`}`)}
    onTouchStart={() => onSelect && onSelect(index)}
  >
    <View style={tailwind("flex flex-row items-center")}>
      <Text
        style={tailwind(`text-${value.color}-500 text-lg font-bold`)}>{value.title}</Text>
      <View style={tailwind("flex-1")}/>
      {ticket && <Text style={tailwind(`text-gray-500 text-sm font-bold`)}>{ticket.key}</Text>}
    </View>
    {ticket?.summary && <Text style={tailwind(`text-gray-600 text-xs`)}>{ticket.summary}</Text>}
  </View>;
}
