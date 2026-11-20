import { Button } from "@/components/ui/button";
import { Sparkles, MessageCircle, Shield, Zap, Mail, Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";

const features = [
  {
    icon: MessageCircle,
    title: "Chat with AI Companions",
    description: "Have meaningful conversations with unique AI personalities",
  },
  {
    icon: Sparkles,
    title: "Create Your Own Avatar",
    description: "Design custom companions with unique personalities & looks",
  },
  {
    icon: Zap,
    title: "Instant Responses",
    description: "Get real-time, intelligent responses powered by AI",
  },
  {
    icon: Shield,
    title: "Private & Secure",
    description: "Your conversations are always kept confidential",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Welcome back!");
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message || "Login failed");
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(formData);
  };

  const handleGoogleLogin = () => {
    toast.info("Google OAuth integration coming soon! Please use email for now.");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 via-violet-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
          <Sparkles size={40} className="text-white" />
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">
          MyCompanionAvatar
        </h1>
        <p className="text-gray-500 text-center text-sm mb-10">
          Your Intelligent AI Companion
        </p>

        {/* Login Form */}
        <div className="w-full max-w-sm space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                size={18}
              />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Email Address"
                className="w-full bg-[#1C1C1E] border border-white/5 rounded-2xl px-12 py-3.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500 transition-colors"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                size={18}
              />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="Password"
                className="w-full bg-[#1C1C1E] border border-white/5 rounded-2xl px-12 py-3.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500 transition-colors"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            <Button
              type="submit"
              disabled={login.isPending}
              className="w-full h-12 rounded-full bg-gradient-to-r from-purple-600 to-violet-500 text-white font-bold text-sm active:scale-[0.98] transition-transform shadow-lg shadow-purple-500/20"
            >
              {login.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black px-2 text-gray-600">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-100 border-0 transition-colors"
            onClick={handleGoogleLogin}
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-4 h-4 mr-2"
            />
            Continue with Google
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-sm text-gray-500"
            >
              Don't have an account?{" "}
              <span className="text-purple-400 font-semibold">Join Free</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Features */}
      <div className="px-6 pb-12 pt-8 max-w-sm mx-auto w-full">
        <div className="flex justify-center gap-1.5 mb-8">
          {features.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all ${
                index === currentSlide ? "bg-purple-500 w-6" : "bg-gray-800 w-2"
              }`}
            />
          ))}
        </div>

        <div
          className="bg-[#1C1C1E] rounded-3xl p-4 flex items-center gap-4 cursor-pointer active:scale-95 transition-transform"
          onClick={() => setCurrentSlide((s) => (s + 1) % features.length)}
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center shrink-0">
            {(() => {
              const Icon = features[currentSlide].icon;
              return <Icon size={24} className="text-purple-400" />;
            })()}
          </div>
          <div>
            <h3 className="font-semibold text-sm">
              {features[currentSlide].title}
            </h3>
            <p className="text-xs text-gray-500">
              {features[currentSlide].description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
