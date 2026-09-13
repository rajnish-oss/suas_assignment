import type { ChatMessage } from "@/types/experiment";
import { ExperimentCard } from "@/components/ExperimentCard";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  if (message.experiment) {
    return (
      <div className="flex flex-col gap-2">
        <Bubble isUser={false}>{message.content}</Bubble>
        <ExperimentCard experiment={message.experiment} />
      </div>
    );
  }

  return <Bubble isUser={isUser}>{message.content}</Bubble>;
}

function Bubble({ isUser, children }: { isUser: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[85%] rounded-md px-4 py-2.5 text-[15px] leading-relaxed",
          isUser
            ? "bg-ink-700 text-paper-100"
            : "bg-transparent border border-ink-600 text-paper-100",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
