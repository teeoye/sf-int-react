import { AgentMessage, AgentMessageRole } from "../../types";

/**
 * Appends an user message to the messages list.
 * The user message is always appended after the last assistant message.
 * If there are existing user messages after the last assistant message, they are replaced.
 */
export function appendUserMessageToMessagesList(userMessage: AgentMessage) {
    return (prevMessages: AgentMessage[]) => {
        console.log('[Assistant] appendUserMessageToMessagesList called:', { 
            userMessageId: userMessage.id,
            prevMessagesCount: prevMessages.length
        });

        const lastAssistantMessageIndex = prevMessages.findLastIndex(
            (message) => message.role === AgentMessageRole.ASSISTANT,
        );
        console.log('[Assistant] Last assistant message index:', lastAssistantMessageIndex);

        const newMessage = structuredClone(userMessage);
        const updatedMessages = [...prevMessages.slice(0, lastAssistantMessageIndex + 1), newMessage];
        console.log('[Assistant] User message added, new messages count:', updatedMessages.length);
        
        return updatedMessages;
    }
}