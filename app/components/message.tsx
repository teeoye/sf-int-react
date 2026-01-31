'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';
import {
    AgentApiState,
    AgentMessage,
    AgentMessageRole,
    AgentMessageChartContent,
    AgentMessageFetchedTableContent,
    AgentMessageServerTableContent,
    AgentMessageSuggestedQueriesContent,
    AgentMessageTextContent,
    AgentMessageToolResultsContent,
    AgentMessageToolUseContent,
    Citation,
    CortexSearchCitationSource,
    SuggestedQuery,
} from '@/lib/agent-api';
import equal from 'fast-deep-equal';
import { prettifyChartSpec } from '@/lib/agent-api/functions/chat/prettifyChartSpec';
import { ChatTextComponent } from './chat-text-component';
import { ChatChartComponent } from './chat-chart-component';
import { ChatSQLComponent } from './chat-sql-component';
import { ChatTableComponent } from './chat-table-component';
import { ChatSuggestedQueriesComponent } from './chat-suggested-queries-component';
import { ChatCitationsComponent } from './chat-citations-component';
import { Data2AnalyticsMessage } from './chat-data2-message';
import { postProcessAgentText } from '../functions/postProcessAgentText';

const PurePreviewMessage = ({
    message,
    agentState,
    isLatestAssistantMessage,
    onSuggestedQueryClick,
}: {
    message: AgentMessage;
    agentState: AgentApiState;
    isLatestAssistantMessage: boolean;
    onSuggestedQueryClick?: (query: string) => void;
}) => {
    // if only the search citations are available without text
    if (
        message.content.length === 2 &&
        message.content[0]?.type === "tool_use" &&
        (message?.content[0] as AgentMessageToolUseContent)?.tool_use?.name === "search1"
    ) {
        return null;
    }

    let agentApiText = "";
    const role = message.role;
    const citations: Citation[] = [];
    const suggestedQueries: SuggestedQuery[] = [];
    const agentResponses: React.ReactElement[] = [];

    message.content.forEach((content) => {
        if (content.type === "text") {
            const { text } = (content as AgentMessageTextContent);
            agentApiText = text;
            const postProcessedText = postProcessAgentText(text, citations);
            agentResponses.push(<ChatTextComponent key={text} text={postProcessedText} role={role} />);

        } else if (content.type === "tool_results") {
            const toolResultsContent = (content as AgentMessageToolResultsContent).tool_results.content[0]?.json;
            if (!toolResultsContent) return;

            // Search response - extract citations
            if ("searchResults" in toolResultsContent) {
                citations.push(...toolResultsContent.searchResults.map((result: CortexSearchCitationSource) => ({
                    text: result.text,
                    number: parseInt(String(result.source_id), 10),
                })));
            }

            // Analyst text response
            if ("text" in toolResultsContent) {
                agentResponses.push(<ChatTextComponent key={toolResultsContent.text} role={role} text={toolResultsContent.text} />);
            }

            // Analyst SQL response
            if ("sql" in toolResultsContent) {
                agentResponses.push(<ChatSQLComponent key={toolResultsContent.sql} sql={toolResultsContent.sql} />);
            }

        } else if (content.type === "fetched_table") {
            const tableContent = (content as AgentMessageFetchedTableContent);
            agentResponses.push(
                <ChatTableComponent
                    key={`${tableContent.tableMarkdown}-${tableContent.toolResult}`}
                    tableMarkdown={tableContent.tableMarkdown}
                    toolResult={tableContent.toolResult}
                />
            );

        } else if (content.type === "server_table") {
            const tableContent = (content as AgentMessageServerTableContent);
            agentResponses.push(
                <ChatTableComponent
                    key={`server-${tableContent.query_id || tableContent.tableMarkdown}`}
                    tableMarkdown={tableContent.tableMarkdown}
                    toolResult={true}
                />
            );

        } else if (content.type === "chart") {
            const chartContent = (content as AgentMessageChartContent);
            const chartSpec = prettifyChartSpec(JSON.parse(chartContent.chart.chart_spec));
            agentResponses.push(<ChatChartComponent key={JSON.stringify(chartSpec)} chartSpec={chartSpec} />);

        } else if (content.type === "suggested_queries") {
            const sqContent = (content as AgentMessageSuggestedQueriesContent);
            suggestedQueries.push(...sqContent.queries);
        }
    });

    if (agentResponses.length === 0) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                className="w-full mx-auto max-w-3xl px-4 group/message"
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                data-role={message.role}
            >
                <div className='flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-lg group-data-[role=user]/message:w-fit'>
                    <div className="flex flex-col gap-4 w-full">
                        {agentResponses}

                        {role === AgentMessageRole.ASSISTANT && agentState === AgentApiState.PLANNING && isLatestAssistantMessage && (
                            <Data2AnalyticsMessage message="Planning..." />
                        )}

                        {role === AgentMessageRole.ASSISTANT && agentState === AgentApiState.EXECUTING_TOOL && isLatestAssistantMessage && (
                            <Data2AnalyticsMessage message="Executing tool..." />
                        )}

                        {role === AgentMessageRole.ASSISTANT && agentState === AgentApiState.EXECUTING_SQL && isLatestAssistantMessage && (
                            <Data2AnalyticsMessage message="Executing SQL..." />
                        )}

                        {role === AgentMessageRole.ASSISTANT && suggestedQueries.length > 0 && (
                            <ChatSuggestedQueriesComponent
                                queries={suggestedQueries}
                                onQueryClick={onSuggestedQueryClick}
                            />
                        )}

                        {role === AgentMessageRole.ASSISTANT && citations.length > 0 && agentState === AgentApiState.IDLE && agentApiText && (
                            <ChatCitationsComponent agentApiText={agentApiText} citations={citations} />
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export const PreviewMessage = memo(
    PurePreviewMessage,
    (prevProps, nextProps) => {
        if (prevProps.agentState !== nextProps.agentState) return false;
        if (!equal(prevProps.message.content, nextProps.message.content)) return false;
        if (prevProps.onSuggestedQueryClick !== nextProps.onSuggestedQueryClick) return false;
        return true;
    },
);
