import { JiraConfig, Task, TempoConfig } from "../components/Quizz";
import { Base64 } from "./utils";

export async function getJiraTicket(task: Task, jiraConfig: JiraConfig) {
  if (!task.jira) {
    return;
  }
  if (task.jira.ticket) {
    return task.jira.ticket;
  } else if (task.jira.status) {
    return await getJiraInProgressTickets(task.jira.status, jiraConfig);
  }
}

export async function getJiraInProgressTickets(status: string, jiraConfig: JiraConfig) {
  let user = Base64.btoa(jiraConfig.account + ":" + jiraConfig.token);
  let url = new URL("https://retaildrive.atlassian.net/rest/api/3/search");
  url.searchParams.append("jql", encodeURIComponent(`assignee=currentuser() and status="${status}"`));
  url.searchParams.append("fields", "summary");
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${user}`
    }
  });
  let raw = await response.json();
  if (response.status === 200) {
    if (raw.issues.length > 0) {
      return raw.issues[0].fields.issue;
    }
  }
  throw new Error(`JIRA errors ${response.status}\n${raw.errorMessages[0]}`);
}

export async function postTempoWorklog(issueKey: string, startDate: string, startTime: string, timeSpentSeconds: number, config: TempoConfig) {
  const worklog = {
    issueKey,
    timeSpentSeconds,
    authorAccountId: config.accountId
  };
  const response = await fetch("https://api.tempo.io/core/3/worklogs", {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(worklog)
  });
  let raw = await response.json();
  console.log("tempo", worklog)
  if (response.status > 300) {
    throw new Error(`JIRA errors ${response.status}\n${raw.errorMessages[0]}`);
  }
}