import { JiraConfig, Task } from "../components/Quizz";
import { Base64 } from "./utils";

async function getJiraInProgressTickets(task: Task, jiraConfig: JiraConfig): Promise<Task[]> {
  let user = Base64.btoa(jiraConfig.account + ":" + jiraConfig.token);
  let url = new URL("https://retaildrive.atlassian.net/rest/api/3/search");
  url.searchParams.append("jql", encodeURIComponent('assignee=currentuser() and status="6 In Progress"'));
  url.searchParams.append("fields", "summary");
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${user}`
    }
  });
  let raw = await response.json();
  if (response.status === 200) {
    return raw.issues.map((i: any) => {
      const subTask = {id: "jira-XXX", title: i.fields.summary};
      return {...task, subTask};
    });
  }
  console.error(`JIRA errors ${response.status}`, JSON.stringify(raw.errorMessages[0]));
  throw new Error(`JIRA errors ${response.status}\n${raw.errorMessages[0]}`);
}

export async function expandTasks(tasks: Task[], jiraConfig: JiraConfig): Promise<Task[]> {
  let newVar = await Promise.all(
    tasks.flatMap(async t => {
      if (jiraConfig && t.inProgressJiraTickets) {
        return await getJiraInProgressTickets(t, jiraConfig);
      }
      return [t];
    })
  );
  return newVar.flat();
}