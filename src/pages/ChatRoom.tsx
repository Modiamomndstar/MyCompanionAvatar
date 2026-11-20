import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { ArrowLeft, MoreVertical, Send, Mic, ImagePlus } from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  metadata?: {
    imageUrl?: string;
    imagePrompt?: string;
    type?: "text" | "image";
  } | null;
  createdAt: Date;
}

export default function ChatRoom() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const convoId = Number(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [inputText, setInputText] = useState("");
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const utils = trpc.useUtils();

  const { data: conversation, isLoading: convoLoading } =
    trpc.conversation.getById.useQuery(
      { id: convoId },
      { enabled: Number.isFinite(convoId) && convoId > 0 }
    );

  const { data: serverMessages, isLoading: messagesLoading } =
    trpc.message.list.useQuery(
      { conversationId: convoId },
      { enabled: Number.isFinite(convoId) && convoId > 0, refetchInterval: 10000 }
    );

  const sendMessageMutation = trpc.message.send.useMutation();
  const getAIResponse = trpc.message.getAIResponse.useMutation({
    onSuccess: () => {
      utils.message.list.invalidate({ conversationId: convoId });
      utils.auth.me.invalidate();
    },
    onError: (error) => {
      if (error.message.includes("INSUFFICIENT_CREDITS")) {
        toast.error("Not enough credits to send a message!");
      } else {
        toast.error(error.message || "AI is busy right now. Try again later.");
      }
    },
  });

  useEffect(() => {
    if (serverMessages) {
      setLocalMessages(serverMessages);
    }
  }, [serverMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, isTyping]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(
        inputRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [inputText]);

  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;

    const userContent = inputText.trim();
    setInputText("");

    const tempId = Date.now();
    const tempUserMsg: ChatMessage = {
      id: tempId,
      role: "user",
      content: userContent,
      createdAt: new Date(),
    };
    setLocalMessages((prev) => [...prev, tempUserMsg]);
    setIsTyping(true);

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: convoId,
        content: userContent,
      });

      await getAIResponse.mutateAsync({
        conversationId: convoId,
      });

      utils.message.list.invalidate({ conversationId: convoId });
    } catch {
      setLocalMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (convoLoading || messagesLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black text-gray-500">
        <p>Conversation not found</p>
        <button
          onClick={() => navigate("/chats")}
          className="mt-4 text-purple-400 text-sm"
        >
          Back to chats
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black/95 backdrop-blur-sm z-40">
        <button
          onClick={() => navigate("/chats")}
          className="w-10 h-10 flex items-center justify-center active:opacity-70"
          aria-label="Back to chats"
        >
          <ArrowLeft size={22} className="text-white" />
        </button>

        <img
          src={conversation.character?.avatar ?? ""}
          alt={conversation.character?.name}
          className="w-9 h-9 rounded-full object-cover"
        />

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold truncate">
            {conversation.character?.name}
          </h2>
          <p className="text-[11px] text-green-400">
            {isTyping ? "Typing..." : "Online"}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            conversation.character &&
            navigate(`/character/${conversation.character.id}`)
          }
          className="w-10 h-10 flex items-center justify-center active:opacity-70"
          aria-label="Companion details"
        >
          <MoreVertical size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
        <div className="space-y-4">
          {localMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              } message-enter`}
            >
              {msg.role === "assistant" && (
                <img
                  src={conversation.character?.avatar ?? ""}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover self-end mr-2 shrink-0"
                />
              )}
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-purple-600 text-white rounded-br-md"
                    : "bg-[#2C2C2E] text-white rounded-bl-md"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.metadata?.imageUrl && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-white/10">
                    <img
                      src={msg.metadata.imageUrl}
                      alt="AI generated"
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-end gap-2 message-enter">
              <img
                src={conversation.character?.avatar ?? ""}
                alt=""
                className="w-7 h-7 rounded-full object-cover self-end"
              />
              <div className="bg-[#2C2C2E] rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-gray-400 typing-dot" />
                  <div className="w-2 h-2 rounded-full bg-gray-400 typing-dot" />
                  <div className="w-2 h-2 rounded-full bg-gray-400 typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 px-4 py-3 border-t border-white/10 bg-black/95 backdrop-blur-sm">
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => toast.info("Image sharing coming soon!")}
            className="w-10 h-10 flex items-center justify-center shrink-0 active:opacity-70"
            aria-label="Send image"
          >
            <ImagePlus size={22} className="text-gray-400" />
          </button>

          <div className="flex-1 bg-[#1C1C1E] rounded-2xl px-4 py-2 flex items-end">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none resize-none max-h-[120px] py-1"
            />
          </div>

          {inputText.trim() ? (
            <button
              type="button"
              onClick={handleSend}
              disabled={isTyping}
              className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center shrink-0 active:scale-95 transition-transform disabled:opacity-50"
              aria-label="Send message"
            >
              <Send size={18} className="text-white" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => toast.info("Voice messages coming soon!")}
              className="w-10 h-10 rounded-full bg-[#1C1C1E] flex items-center justify-center shrink-0 active:scale-95 transition-transform"
              aria-label="Voice message"
            >
              <Mic size={20} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
