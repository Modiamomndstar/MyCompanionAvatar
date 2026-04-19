import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import {
  Settings,
  LogOut,
  ChevronRight,
  User,
  Shield,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { data: myCharacters } = trpc.character.myCharacters.useQuery();
  const deleteCharacter = trpc.character.delete.useMutation({
    onSuccess: () => {
      utils.character.myCharacters.invalidate();
    },
  });
  const utils = trpc.useUtils();
  const updateSettings = trpc.auth.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings updated");
      utils.auth.me.invalidate();
    },
    onError: () => {
      toast.error("Failed to update settings");
    }
  });

  const handleDeleteCharacter = (id: number) => {
    if (confirm("Are you sure you want to delete this character?")) {
      deleteCharacter.mutate({ id });
    }
  };

  return (
    <div className="min-h-full bg-black pb-4">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Profile</h1>
          <button className="w-10 h-10 flex items-center justify-center active:opacity-70">
            <Settings size={22} className="text-gray-400" />
          </button>
        </div>

        {/* User Card */}
        <div className="bg-[#1C1C1E] rounded-3xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-violet-500 flex items-center justify-center text-2xl font-bold text-white">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold truncate">
                {user?.name || "User"}
              </h2>
              <p className="text-sm text-gray-500">
                {user?.email || "No email"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/10">
            <div className="flex-1 text-center">
              <p className="text-xl font-bold">
                {myCharacters?.length ?? 0}
              </p>
              <p className="text-xs text-gray-500">Characters</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex-1 text-center">
              <p className="text-xl font-bold">{user?.credits ?? 0}</p>
              <p className="text-xs text-gray-500">Credits</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex-1 text-center text-purple-400">
              <p className="text-xl font-bold">Pro</p>
              <p className="text-xs text-gray-500">Plan</p>
            </div>
          </div>
        </div>
      </div>

      {/* My Characters */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">My Characters</h2>
          <button
            onClick={() => navigate("/create")}
            className="text-sm text-purple-400 active:opacity-70"
          >
            + Create New
          </button>
        </div>

        {myCharacters && myCharacters.length > 0 ? (
          <div className="space-y-2">
            {myCharacters.map((char) => (
              <div
                key={char.id}
                className="flex items-center gap-3 bg-[#1C1C1E] rounded-2xl p-3"
              >
                <img
                  src={char.avatar}
                  alt={char.name}
                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{char.name}</h3>
                  <p className="text-xs text-gray-500 truncate">
                    {char.category}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteCharacter(char.id)}
                  className="w-8 h-8 flex items-center justify-center active:opacity-70"
                >
                  <Trash2 size={16} className="text-red-400" />
                </button>
                <button
                  onClick={() => navigate(`/character/${char.id}`)}
                  className="w-8 h-8 flex items-center justify-center active:opacity-70"
                >
                  <ChevronRight size={18} className="text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#1C1C1E] rounded-2xl p-6 text-center">
            <Sparkles size={32} className="text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              You haven't created any characters yet
            </p>
            <button
              onClick={() => navigate("/create")}
              className="mt-3 px-4 py-2 rounded-full bg-purple-600 text-white text-xs font-medium active:scale-95 transition-transform"
            >
              Create Your First Character
            </button>
          </div>
        )}
      </div>

      {/* Settings Menu */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Settings</h2>
        <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden">
          <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/5 transition-colors border-b border-white/5">
            <User size={18} className="text-purple-400 shrink-0" />
            <span className="flex-1 text-sm">Account</span>
            <ChevronRight size={16} className="text-gray-600 shrink-0" />
          </button>
            <ChevronRight size={16} className="text-gray-600 shrink-0" />
          </button>
          <div className="w-full flex items-center justify-between px-4 py-3.5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Shield size={18} className={user?.nsfwEnabled ? "text-red-400" : "text-gray-400"} />
              <div className="flex flex-col">
                <span className="text-sm">Adult Content (NSFW)</span>
                <span className="text-[10px] text-gray-500">Enable romantic/erotic roles</span>
              </div>
            </div>
            <Switch 
              checked={user?.nsfwEnabled} 
              onCheckedChange={(checked) => {
                updateSettings.mutate({ nsfwEnabled: checked });
              }}
            />
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/5 transition-colors">
            <Sparkles size={18} className="text-orange-400 shrink-0" />
            <span className="flex-1 text-sm">Subscription</span>
            <span className="text-xs text-gray-500 mr-1">Pro Plan</span>
            <ChevronRight size={16} className="text-gray-600 shrink-0" />
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 pb-8">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full py-3.5 rounded-full bg-[#1C1C1E] text-red-400 font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#1C1C1E] rounded-t-3xl p-6">
            <h3 className="text-lg font-semibold text-center mb-2">
              Log Out?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to log out?
            </p>
            <div className="space-y-2">
              <button
                onClick={logout}
                className="w-full py-3.5 rounded-full bg-red-500 text-white font-semibold text-sm active:scale-[0.98] transition-transform"
              >
                Log Out
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-3.5 rounded-full bg-[#2C2C2E] text-white font-medium text-sm active:scale-[0.98] transition-transform"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
