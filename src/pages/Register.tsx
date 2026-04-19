import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const register = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Account created successfully!");
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message || "Registration failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    register.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 flex flex-col items-center">
        <button 
          onClick={() => navigate(-1)}
          className="self-start mb-6 p-2 rounded-full bg-[#1C1C1E] text-gray-400 active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
          <Sparkles size={32} className="text-white" />
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Create Account</h1>
        <p className="text-gray-500 text-center text-sm mb-8 px-8">
          Join My AI ChatCompanion and start your journey today.
        </p>
      </div>

      {/* Form Section */}
      <div className="px-6 flex-1">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                required
                placeholder="Full Name"
                className="w-full bg-[#1C1C1E] border border-white/5 rounded-2xl px-12 py-3.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500 transition-colors"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="email"
                required
                placeholder="Email Address"
                className="w-full bg-[#1C1C1E] border border-white/5 rounded-2xl px-12 py-3.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500 transition-colors"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="password"
                required
                placeholder="Password"
                className="w-full bg-[#1C1C1E] border border-white/5 rounded-2xl px-12 py-3.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500 transition-colors"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={register.isPending}
              className="w-full h-12 rounded-full bg-gradient-to-r from-purple-600 to-violet-500 text-white font-bold text-sm shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-transform"
            >
              {register.isPending ? "Creating Account..." : "Register Now"}
            </Button>
            
            <p className="text-center text-xs text-gray-500 mt-6 px-4">
              New accounts receive <span className="text-purple-400 font-semibold">10 FREE credits</span> to start chatting.
            </p>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="px-6 pb-12 pt-4 flex justify-center">
        <button 
          onClick={() => navigate("/login")}
          className="text-sm text-gray-400"
        >
          Already have an account? <span className="text-purple-400 font-semibold">Sign In</span>
        </button>
      </div>
    </div>
  );
}
