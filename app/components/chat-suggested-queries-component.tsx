import { SuggestedQuery } from "@/lib/agent-api";
import { motion } from "framer-motion";

export interface ChatSuggestedQueriesComponentProps {
    queries: SuggestedQuery[];
    onQueryClick?: (query: string) => void;
}

export function ChatSuggestedQueriesComponent({ queries, onQueryClick }: ChatSuggestedQueriesComponentProps) {
    return (
        <motion.div
            className="flex flex-col gap-2 w-full"
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
        >
            <p className="text-sm text-muted-foreground">Suggested follow-up questions:</p>
            <div className="flex flex-wrap gap-2">
                {queries.map((q) => (
                    <button
                        key={q.query}
                        onClick={() => onQueryClick?.(q.query)}
                        className="text-sm px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-left transition-colors cursor-pointer"
                    >
                        {q.query}
                    </button>
                ))}
            </div>
        </motion.div>
    );
}
