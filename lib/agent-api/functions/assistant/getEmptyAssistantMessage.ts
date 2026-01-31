import { AgentMessage, AgentMessageRole } from "../../types";

/**
 * Returns an empty assistant message.
 */
export function getEmptyAssistantMessage(latestId: string): AgentMessage {
    console.log('[Assistant] getEmptyAssistantMessage called:', { messageId: latestId });
    const message = {
        id: latestId,
        role: AgentMessageRole.ASSISTANT,
        content: [],
    };
    console.log('[Assistant] Empty assistant message created');
    return message;
}