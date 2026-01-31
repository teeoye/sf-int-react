import { AgentMessage } from "../../types";

/**
 * Appends a tool response to the last message in the assistant message.
 */
export function appendToolResponseToAssistantMessage(
    assistantMessage: AgentMessage,
    toolResponse: AgentMessage['content'][number],
) {
    console.log('[Assistant] appendToolResponseToAssistantMessage called:', { 
        messageId: assistantMessage.id,
        toolResponseType: toolResponse.type,
        currentContentCount: assistantMessage.content.length
    });
    
    assistantMessage.content.push(toolResponse);
    
    console.log('[Assistant] Tool response added, new content count:', assistantMessage.content.length);
}