import { AgentMessage, AgentMessageTextContent } from "../../types";

/**
 * Appends text to the last text message in the assistant message.
 * If the last message is not text, it creates a new text message.
 */
export function appendTextToAssistantMessage(
    assistantMessage: AgentMessage,
    text: string,
): void {
    console.log('[Assistant] appendTextToAssistantMessage called:', { 
        messageId: assistantMessage.id,
        textLength: text.length,
        currentContentCount: assistantMessage.content.length
    });

    // Find the last text message in the content array
    const lastTextIndex = findLastTextContentIndex(assistantMessage.content);
    console.log('[Assistant] Last text index:', lastTextIndex);
    
    // If there's a text message, append to it, otherwise create a new one
    if (lastTextIndex !== -1) {
        const lastTextContent = assistantMessage.content[lastTextIndex] as AgentMessageTextContent;
        const previousLength = lastTextContent.text.length;
        lastTextContent.text += text;
        console.log('[Assistant] Appended to existing text:', { 
            previousLength, 
            newLength: lastTextContent.text.length 
        });
    } else {
        // No text content found, add a new one
        console.log('[Assistant] Creating new text content');
        assistantMessage.content.push({
            type: "text",
            text: text,
        });
        console.log('[Assistant] New text content added, total content count:', assistantMessage.content.length);
    }

    // Helper function to find the last text content index
    function findLastTextContentIndex(content: AgentMessage['content']): number {
        for (let i = content.length - 1; i >= 0; i--) {
            if (content[i].type === "text") {
                return i;
            }
        }
        return -1;
    }
}