import { Link, useLocation } from "react-router";
import {
  Home,
  Search,
  PlusCircle,
  MessageSquare,
  User,
  Sparkles,
} from "lucide-react";

const tabs = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Explore", icon: Search, path: "/explore" },
  { label: "Create", icon: PlusCircle, path: "/create" },
  { label: "Chats", icon: MessageSquare, path: "/chats" },
  { label: "Profile", icon: User, path: "/profile" },
];

export function BottomNav() {
  const location = useLocation();

  const hideMobileNav =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname.startsWith("/chat/");

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 shrink-0 border-r border-white/10 bg-[#0A0A0C] px-4 py-6 select-none">
        <Link to="/" className="flex items-center gap-3 px-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-violet-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="font-semibold text-base tracking-tight text-white">
            MyCompanionAvatar
          </span>
        </Link>

        <nav className="flex flex-col gap-1.5 flex-1">
          {tabs.map((tab) => {
            const isActive =
              tab.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(tab.path);

            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-purple-600/20 text-white border border-purple-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <tab.icon
                  size={20}
                  strokeWidth={isActive ? 2.25 : 1.75}
                  className={isActive ? "text-purple-400" : "text-gray-500"}
                />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        <p className="text-[11px] text-gray-600 px-2">
          MyCompanionAvatar &copy; {new Date().getFullYear()}
        </p>
      </aside>

      {/* Mobile Bottom Nav */}
      {!hideMobileNav && (
        <nav className="md:hidden shrink-0 z-50 h-16 glass border-t border-white/10 select-none">
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
                    className={isActive ? "text-white" : "text-gray-500"}
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
      )}
    </>
  );
}
