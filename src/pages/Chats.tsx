import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { MessageSquare } from "lucide-react";

export default function Chats() {
  const navigate = useNavigate();
  const { data: conversations, isLoading } =
    trpc.conversation.list.useQuery();

  return (
    <div className="min-h-full bg-black pb-4">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-white/5">
        <h1 className="text-2xl font-semibold">Chats</h1>
      </div>

      {/* Conversation List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      ) : conversations && conversations.length > 0 ? (
        <div className="divide-y divide-white/5">
          {conversations.map((convo) => (
            <button
              key={convo.id}
              onClick={() => navigate(`/chat/${convo.id}`)}
              className="w-full flex items-start gap-3 px-4 py-4 active:bg-white/5 transition-colors text-left"
            >
              <div className="relative shrink-0">
                <img
                  src={convo.character?.avatar ?? ""}
                  alt={convo.character?.name}
                  className="w-14 h-14 rounded-2xl object-cover"
                />
                {convo.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">
                      {convo.unreadCount}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm truncate">
                    {convo.character?.name}
                  </h3>
                  {convo.updatedAt && (
                    <span className="text-[11px] text-gray-500 shrink-0 ml-2">
                      {new Date(convo.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                  {convo.lastMessage || "Start a conversation..."}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <MessageSquare size={10} className="text-gray-600" />
                  <span className="text-[10px] text-gray-600">
                    {convo.character?.category}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
          <MessageSquare size={48} className="text-gray-700 mb-4" />
          <p className="text-lg font-medium">No conversations yet</p>
          <p className="text-sm mt-1">
            Start chatting with your favorite characters
          </p>
          <button
            onClick={() => navigate("/explore")}
            className="mt-6 px-6 py-2.5 rounded-full bg-purple-600 text-white text-sm font-medium active:scale-95 transition-transform"
          >
            Explore Characters
          </button>
        </div>
      )}
    </div>
  );
}
