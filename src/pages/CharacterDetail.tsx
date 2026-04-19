import { useNavigate, useParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { ArrowLeft, MessageSquare, Users, Sparkles, Palette } from "lucide-react";
import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export default function CharacterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const charId = Number(id);

  const { data: character, isLoading } = trpc.character.getById.useQuery(
    { id: charId },
    { enabled: !!charId }
  );

  const createConversation = trpc.conversation.create.useMutation({
    onSuccess: (data) => {
      navigate(`/chat/${data.id}`);
    },
  });

  const [customization, setCustomization] = useState<{
    style: "anime" | "realistic" | "classic";
    personalityModifier: string;
  }>({
    style: "classic",
    personalityModifier: "",
  });
  const [showCustomization, setShowCustomization] = useState(false);
  const [isNsfwAgreed, setIsNsfwAgreed] = useState(false);

  const handleMessage = () => {
    setShowCustomization(true);
  };

  const startChat = () => {
    createConversation.mutate({ 
      characterId: charId,
      customization: {
        style: customization.style,
        personalityModifier: customization.personalityModifier
      }
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <p>Character not found</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-purple-400 text-sm"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-black">
      {/* Hero Image */}
      <div className="relative">
        <img
          src={character.avatar}
          alt={character.name}
          className="w-full aspect-square object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center active:bg-black/70 transition-colors"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 -mt-16 relative z-10">
        <div className="bg-[#1C1C1E] rounded-3xl p-5">
          <h1 className="text-2xl font-bold">{character.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-400 text-xs font-medium">
              {character.category}
            </span>
          </div>

          <p className="text-gray-300 mt-4 text-sm leading-relaxed">
            {character.description}
          </p>

          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">
              Personality
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              {character.personality}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-5 py-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-purple-400" />
              <div>
                <p className="text-sm font-semibold">
                  {(character.messageCount / 1000).toFixed(1)}k
                </p>
                <p className="text-[10px] text-gray-500">Messages</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-400" />
              <div>
                <p className="text-sm font-semibold">{(character.messageCount / 50).toFixed(0)}</p>
                <p className="text-[10px] text-gray-500">Chatting now</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-orange-400" />
              <div>
                <p className="text-sm font-semibold">AI</p>
                <p className="text-[10px] text-gray-500">Powered</p>
              </div>
            </div>
          </div>

          {/* Message Button */}
          <button
            onClick={handleMessage}
            disabled={createConversation.isPending}
            className="w-full mt-4 py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-violet-500 text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {createConversation.isPending ? (
              <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <MessageSquare size={18} />
                Start Chat
              </>
            )}
          </button>
        </div>
      </div>

      {/* Customization Drawer */}
      <Drawer open={showCustomization} onOpenChange={setShowCustomization}>
        <DrawerContent className="bg-[#1C1C1E] border-white/10 text-white">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl flex items-center gap-2">
              <Palette className="text-purple-400" />
              Customize {character.name}
            </DrawerTitle>
            <DrawerDescription className="text-gray-400 text-xs">
              Personalize your companion before you start chatting.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-5 py-4 space-y-6">
            {/* Style Selection */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                Visual Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["classic", "anime", "realistic"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setCustomization({ ...customization, style: s })}
                    className={cn(
                      "py-3 rounded-xl border text-sm capitalize transition-all",
                      customization.style === s
                        ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20"
                        : "bg-black/40 border-white/5 text-gray-400"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Personality Modifier */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">
                Vibe Modifier (Optional)
              </label>
              <input
                type="text"
                value={customization.personalityModifier}
                onChange={(e) => setCustomization({ ...customization, personalityModifier: e.target.value })}
                placeholder="Ex: 'be more funny' or 'act mysterious'"
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* NSFW Confirmation if applicable */}
            {character.isNsfw && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    id="nsfw" 
                    className="mt-1 accent-red-500" 
                    checked={isNsfwAgreed}
                    onChange={(e) => setIsNsfwAgreed(e.target.checked)}
                  />
                  <label htmlFor="nsfw" className="text-xs text-red-100 leading-relaxed">
                    I understand this character may engage in adult-themed (NSFW) conversations and I am over 18.
                  </label>
                </div>
              </div>
            )}
          </div>

          <DrawerFooter className="pb-8">
            <button
              onClick={startChat}
              disabled={createConversation.isPending || (character.isNsfw && !isNsfwAgreed)}
              className="w-full py-4 rounded-full bg-gradient-to-r from-purple-600 to-violet-500 text-white font-bold text-sm shadow-xl shadow-purple-500/20 active:scale-[0.98] transition-transform disabled:opacity-30"
            >
              {createConversation.isPending ? "Connecting..." : "Confirm & Start Chat"}
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
