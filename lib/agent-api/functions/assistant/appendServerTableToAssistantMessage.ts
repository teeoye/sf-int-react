import { AgentMessage } from "../../types";

interface ServerTableData {
    columns: { name: string; type: string }[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows: any[][];
    query_id?: string;
    sql?: string;
}

/**
 * Converts server-side table data to markdown format
 */
function convertServerTableToMarkdown(
    columns: { name: string; type: string }[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows: any[][]
): string {
    if (!columns || columns.length === 0) {
        return '';
    }

    const headerRow = `| ${columns.map(col => col.name).join(' | ')} |`;
    const separatorRow = `| ${columns.map(() => '---').join(' | ')} |`;
    const dataRows = rows.map(row =>
        `| ${row.map(cell => cell === null ? '' : String(cell)).join(' | ')} |`
    ).join('\n');

    return `${headerRow}\n${separatorRow}\n${dataRows}`;
}

/**
 * Appends server-side table data to the assistant message.
 */
export function appendServerTableToAssistantMessage(
    assistantMessage: AgentMessage,
    tableData: ServerTableData
): void {
    const { columns, rows, query_id, sql } = tableData;
    const tableMarkdown = convertServerTableToMarkdown(columns, rows);

    assistantMessage.content.push({
        type: "server_table",
        columns,
        rows,
        tableMarkdown,
        query_id,
        sql,
    });
}
