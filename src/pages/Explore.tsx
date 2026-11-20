import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { CHARACTER_CATEGORIES } from "@contracts/constants";
import { Search, MessageSquare, X } from "lucide-react";

const categories = ["All", ...CHARACTER_CATEGORIES] as const;

function formatCount(num: number): string {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return String(num);
}

export default function Explore() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const isFiltered = searchQuery.trim().length > 0 || activeCategory !== "All";

  const { data: searchResults, isLoading: searching } =
    trpc.character.search.useQuery(
      {
        query: searchQuery.trim(),
        category: activeCategory === "All" ? undefined : activeCategory,
      },
      { enabled: isFiltered }
    );

  const { data: allCharacters, isLoading: loadingAll } =
    trpc.character.list.useQuery(undefined, { enabled: !isFiltered });

  const characters = isFiltered ? searchResults : allCharacters;
  const isLoading = isFiltered ? searching : loadingAll;

  return (
    <div className="min-h-full bg-black pb-4">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm px-4 pt-4 pb-2">
        <h1 className="text-2xl font-semibold mb-3">Explore</h1>

        {/* Search input */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C1C1E]">
            <Search size={16} className="text-gray-500 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companions..."
              className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-gray-500 hover:text-white"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95 ${
                activeCategory === cat
                  ? "bg-purple-600 text-white"
                  : "bg-[#1C1C1E] text-gray-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Character Grid */}
      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          </div>
        ) : characters && characters.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {characters.map((char) => (
              <button
                key={char.id}
                onClick={() => navigate(`/character/${char.id}`)}
                className="bg-[#1C1C1E] rounded-2xl overflow-hidden active:scale-[0.97] transition-transform text-left"
              >
                <div className="relative">
                  <img
                    src={char.avatar}
                    alt={char.name}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm">
                    <span className="text-[10px] font-medium text-white">
                      {char.category}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">
                    {char.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {char.description}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <MessageSquare size={10} className="text-gray-600" />
                    <span className="text-[10px] text-gray-600">
                      {formatCount(char.messageCount)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500">No companions found</p>
            <p className="text-gray-600 text-sm mt-1">
              Try a different search term or category
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
