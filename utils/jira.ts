import { JiraConfig, JiraTask, TempoConfig } from "../components/Quizz";
import { Base64 } from "./utils";

export async function getJiraTicket(jiraTask: JiraTask, jiraConfig: JiraConfig) {
  if (!jiraTask) {
    return;
  }
  if (jiraTask.ticket) {
    return {key: jiraTask.ticket};
  } else if (jiraTask.status) {
    const tickets = await getJiraInProgressTickets(jiraTask.status, jiraConfig, 1);
    if (tickets.length == 0) {
      return;
    }
    return tickets[0];
  }
}

export interface JiraIssue {
  key: string;
  summary?: string;
}

export async function getJiraInProgressTickets(status: string, jiraConfig: JiraConfig, keep?: number): Promise<JiraIssue[]> {
  let user = Base64.btoa(jiraConfig.account + ":" + jiraConfig.token);
  let url = new URL("https://retaildrive.atlassian.net/rest/api/3/search");
  url.searchParams.append("jql", encodeURIComponent(`assignee=currentuser() and status="${status}" order by rank`));
  url.searchParams.append("fields", "summary");
  if (keep) {
    url.searchParams.append("maxResults", keep.toString());
  }
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${user}`
    }
  });
  let raw = await response.json();
  if (response.status === 200) {
    return raw.issues.map((i: any) => ({key: i.key, summary: i.fields.summary}));
  }
  throw new Error(`JIRA errors ${response.status}\n${raw.errorMessages[0]}`);
}

export async function postTempoWorklog(issueKey: string, startDate: string, startTime: string, timeSpentSeconds: number, config: TempoConfig) {
  const worklog = {
    startDate,
    startTime,
    issueKey,
    timeSpentSeconds,
    authorAccountId: config.accountId
  };
  const response = await fetch("https://api.tempo.io/core/3/worklogs", {
    method: 'POST',
    headers: {
      'Content-Type': "application/json",
      'Accept': "application/json",
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(worklog)
  });
  let raw = await response.json();
  if (response.status !== 200) {
    throw new Error(`Tempo error ${response.status} : ${raw.errors[0].message}`);
  }
}