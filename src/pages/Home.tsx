import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  Search,
  Flame,
  Clock,
  Sparkles,
  BookOpen,
  Sword,
  Wand2,
  Heart,
  Star,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";

const categories = [
  { label: "Popular", icon: Flame, filter: "all" },
  { label: "Fantasy", icon: Sword, filter: "Fantasy" },
  { label: "Sci-Fi", icon: Sparkles, filter: "Sci-Fi" },
  { label: "Anime", icon: Heart, filter: "Anime" },
  { label: "Mystic", icon: Wand2, filter: "Mystic" },
  { label: "Wisdom", icon: BookOpen, filter: "Wisdom" },
  { label: "Cyberpunk", icon: Star, filter: "Cyberpunk" },
];

function formatCount(num: number): string {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return String(num);
}

export default function Home() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const { data: characters, isLoading } = trpc.character.list.useQuery();

  const filteredChars = characters?.filter((c) =>
    activeFilter === "all" ? true : c.category === activeFilter
  );

  const mostPopular = characters?.slice(0, 10) ?? [];
  const newest = characters?.slice().reverse().slice(0, 10) ?? [];
  const fantasy =
    characters?.filter((c) => c.category === "Fantasy").slice(0, 10) ?? [];
  const scifi =
    characters?.filter((c) => c.category === "Sci-Fi").slice(0, 10) ?? [];

  const handleCharacterClick = (id: number) => {
    navigate(`/character/${id}`);
  };

  return (
    <div className="min-h-full bg-black pb-4">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-violet-500 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">My AI ChatCompanion</h1>
        </div>

        {/* Search bar */}
        <button
          onClick={() => navigate("/explore")}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C1C1E] text-gray-400 text-sm mb-3 active:bg-[#2C2C2E] transition-colors"
        >
          <Search size={16} />
          <span>Search characters...</span>
        </button>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory">
          {categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setActiveFilter(cat.filter)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap snap-start transition-all active:scale-95 ${
                activeFilter === cat.filter
                  ? "bg-purple-600 text-white"
                  : "bg-[#1C1C1E] text-gray-400"
              }`}
            >
              <cat.icon size={13} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      ) : activeFilter !== "all" ? (
        // Filtered view
        <div className="px-4 pt-4">
          <div className="grid grid-cols-2 gap-3">
            {filteredChars?.map((char) => (
              <button
                key={char.id}
                onClick={() => handleCharacterClick(char.id)}
                className="bg-[#1C1C1E] rounded-2xl overflow-hidden active:scale-[0.97] transition-transform text-left"
              >
                <img
                  src={char.avatar}
                  alt={char.name}
                  className="w-full aspect-square object-cover"
                />
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{char.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {char.description}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <MessageSquare size={10} className="text-gray-600" />
                    <span className="text-[10px] text-gray-600">
                      {formatCount(char.messageCount)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {filteredChars?.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <p>No characters found in this category</p>
            </div>
          )}
        </div>
      ) : (
        // Default home view with sections
        <div className="pt-2">
          {/* Most Popular */}
          <section className="mb-6">
            <div className="flex items-center gap-2 px-4 mb-3">
              <Flame size={16} className="text-orange-500" />
              <h2 className="text-lg font-semibold">Most Popular</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4">
              {mostPopular.map((char) => (
                <button
                  key={char.id}
                  onClick={() => handleCharacterClick(char.id)}
                  className="flex-shrink-0 w-36 snap-start active:scale-[0.97] transition-transform text-left"
                >
                  <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
                    <img
                      src={char.avatar}
                      alt={char.name}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="p-2.5">
                      <h3 className="font-semibold text-sm truncate">
                        {char.name}
                      </h3>
                      <p className="text-[11px] text-gray-500 truncate">
                        {char.category}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* New Characters */}
          <section className="mb-6">
            <div className="flex items-center gap-2 px-4 mb-3">
              <Clock size={16} className="text-blue-500" />
              <h2 className="text-lg font-semibold">New Characters</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4">
              {newest.map((char) => (
                <button
                  key={char.id}
                  onClick={() => handleCharacterClick(char.id)}
                  className="flex-shrink-0 w-36 snap-start active:scale-[0.97] transition-transform text-left"
                >
                  <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
                    <img
                      src={char.avatar}
                      alt={char.name}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="p-2.5">
                      <h3 className="font-semibold text-sm truncate">
                        {char.name}
                      </h3>
                      <p className="text-[11px] text-gray-500 truncate">
                        {char.category}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Fantasy */}
          {fantasy.length > 0 && (
            <section className="mb-6">
              <div className="flex items-center gap-2 px-4 mb-3">
                <Sword size={16} className="text-purple-500" />
                <h2 className="text-lg font-semibold">Fantasy</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4">
                {fantasy.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => handleCharacterClick(char.id)}
                    className="flex-shrink-0 w-36 snap-start active:scale-[0.97] transition-transform text-left"
                  >
                    <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
                      <img
                        src={char.avatar}
                        alt={char.name}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="p-2.5">
                        <h3 className="font-semibold text-sm truncate">
                          {char.name}
                        </h3>
                        <p className="text-[11px] text-gray-500 truncate">
                          {char.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Sci-Fi */}
          {scifi.length > 0 && (
            <section className="mb-6">
              <div className="flex items-center gap-2 px-4 mb-3">
                <Sparkles size={16} className="text-cyan-500" />
                <h2 className="text-lg font-semibold">Sci-Fi</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4">
                {scifi.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => handleCharacterClick(char.id)}
                    className="flex-shrink-0 w-36 snap-start active:scale-[0.97] transition-transform text-left"
                  >
                    <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
                      <img
                        src={char.avatar}
                        alt={char.name}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="p-2.5">
                        <h3 className="font-semibold text-sm truncate">
                          {char.name}
                        </h3>
                        <p className="text-[11px] text-gray-500 truncate">
                          {char.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
