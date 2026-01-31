import { AgentMessage, AgentMessageRole } from "../../types";

/**
 * Appends an assistant message to the messages list.
 * The assistant message is always appended after the last user message.
 * If there are existing assistant messages after the last user message, they are replaced.
 */
export function appendAssistantMessageToMessagesList(assistantMessage: AgentMessage) {
    return (prevMessages: AgentMessage[]) => {
        console.log('[Assistant] appendAssistantMessageToMessagesList called:', { 
            assistantMessageId: assistantMessage.id,
            prevMessagesCount: prevMessages.length
        });

        const lastUserMessageIndex = prevMessages.findLastIndex(
            (message) => message.role === AgentMessageRole.USER,
        );
        console.log('[Assistant] Last user message index:', lastUserMessageIndex);

        const newMessage = structuredClone(assistantMessage);
        const updatedMessages = [...prevMessages.slice(0, lastUserMessageIndex + 1), newMessage];
        console.log('[Assistant] Messages updated:', { 
            newMessagesCount: updatedMessages.length,
            assistantMessageContentCount: assistantMessage.content.length
        });
        
        return updatedMessages;
    }
}