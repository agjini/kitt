export const Csv = {

  parse(content: string): any[] {
    const lines = content.split("\n");
    if (lines.length == 0) {
      return [];
    }
    const header = lines[0];
    const columns = header.split(",");
    const results: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      const obj: any = {};
      for (let j = 0; j < values.length; j++) {
        const column = columns[j];
        obj[column] = values[j];
      }
      results.push(obj);
    }
    return results;
  },

  format(content: any[]): string {
    if (content.length == 0) {
      return "";
    }
    const columnSet: Set<string> = new Set();
    for (const row of content) {
      for (const rowKey in row) {
        columnSet.add(rowKey);
      }
    }
    const lines: string[] = [];
    const columns = Array.from(columnSet)
      .sort();
    lines.push(columns.join(","));
    for (const row of content) {
      const line: string[] = [];
      for (const column of columns) {
        line.push(row[column] || "");
      }
      lines.push(line.join(","));
    }
    return lines.join("\n");
  }


}