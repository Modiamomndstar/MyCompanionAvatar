import { Link, useLocation } from "react-router";
import { Home, Search, PlusCircle, MessageSquare, User } from "lucide-react";

const tabs = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Explore", icon: Search, path: "/explore" },
  { label: "Create", icon: PlusCircle, path: "/create" },
  { label: "Chats", icon: MessageSquare, path: "/chats" },
  { label: "Profile", icon: User, path: "/profile" },
];

export function BottomNav() {
  const location = useLocation();

  // Don't show nav on login or chat room
  if (location.pathname === "/login" || location.pathname.startsWith("/chat/")) {
    return null;
  }

  return (
    <nav className="shrink-0 z-50 h-16 glass border-t border-white/10 select-none">
      <div className="flex items-center justify-around h-full pb-safe">
        {tabs.map((tab) => {
          const isActive =
            tab.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(tab.path);

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center justify-center gap-0.5 w-16 h-full active:opacity-70 transition-opacity"
            >
              <tab.icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.5}
                className={
                  isActive
                    ? "text-white"
                    : "text-gray-500"
                }
              />
              <span
                className={`text-[10px] ${
                  isActive ? "text-white font-medium" : "text-gray-500"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
