"use client";

import Image from "next/image";
import { AgentApiState, useAgentObjectQuery } from "@/lib/agent-api";
import { useAccessToken } from "@/lib/auth";
import { Messages } from "./components/messages";
import { ChatInput } from "./components/input";
import { ChatHeader } from "./components/chat-header";
import { useLanguage } from "./context/language-context";

const ELLIPSE_8 = "/icons/Ellipse 8.png";

export default function Home() {
  const { token: jwtToken } = useAccessToken();
  const { t } = useLanguage();

  const {
    agentState,
    messages,
    latestAssistantMessageId,
    handleNewMessage,
  } = useAgentObjectQuery({
    authToken: jwtToken,
    database: process.env.NEXT_PUBLIC_SNOWFLAKE_DATABASE!,
    schema: process.env.NEXT_PUBLIC_SNOWFLAKE_SCHEMA!,
    agentName: process.env.NEXT_PUBLIC_AGENT_NAME!,
    role: process.env.NEXT_PUBLIC_SNOWFLAKE_ROLE,
    experimental: {
      EnableRelatedQueries: true,
    },
  });

  const isEmpty = messages.length === 0;

  return (
    <div
      className="relative flex flex-col min-h-dvh"
      style={
        isEmpty
          ? {
              background:
                "radial-gradient(ellipse 150% 120% at 50% 20%, rgba(178,223,219,0.45), rgba(225,245,254,0.25) 40%, rgba(255,255,255,0.95) 70%)",
            }
          : { backgroundColor: "hsl(var(--background))" }
      }
    >
      <ChatHeader />

      <main className="flex-1 flex flex-col min-h-0">
        {isEmpty ? (
          /* Hero */
          <div className="flex flex-col items-center justify-center text-center px-4 flex-1">
            <div className="mb-6">
              <div className="w-14 h-14 mx-auto rounded-full bg-white/70 shadow-sm flex items-center justify-center">
                <div className="relative w-8 h-8 md:w-9 md:h-9 opacity-90">
                  <Image
                    src={encodeURI(ELLIPSE_8)}
                    alt=""
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
              {t("welcomeTitle")}
            </h1>

            <p className="text-sm md:text-base text-muted-foreground max-w-md">
              {t("welcomeSubtitle")}
            </p>
          </div>
        ) : (
          <Messages
            agentState={agentState}
            messages={messages}
            latestAssistantMessageId={latestAssistantMessageId}
            onSuggestedQueryClick={handleNewMessage}
          />
        )}
      </main>

      {/* Input */}
      <form
        className="
          sticky bottom-0
          w-full
          bg-background/80 backdrop-blur-sm
          px-4 pb-4 md:pb-6
          mx-auto
          md:max-w-3xl
        "
      >
        <ChatInput
          isLoading={agentState !== AgentApiState.IDLE}
          handleSubmit={handleNewMessage}
        />
      </form>
    </div>
  );
}
