import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageCircle, Shield, Zap } from "lucide-react";
import { useState } from "react";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

const features = [
  {
    icon: MessageCircle,
    title: "Chat with AI Characters",
    description: "Have meaningful conversations with unique AI personalities",
  },
  {
    icon: Sparkles,
    title: "Create Your Own",
    description: "Design custom characters with unique personalities",
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
  const [currentSlide, setCurrentSlide] = useState(0);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12">
        {/* Logo */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 via-violet-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
          <Sparkles size={40} className="text-white" />
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">My AI ChatCompanion</h1>
        <p className="text-gray-500 text-center text-sm mb-10">
          Your AI Companion App
        </p>

        {/* Feature Carousel */}
        <div className="w-full max-w-sm">
          <div className="relative overflow-hidden rounded-2xl bg-[#1C1C1E] p-5">
            <div className="flex items-start gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`flex-shrink-0 w-full transition-all duration-500 ${
                    index === currentSlide
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 absolute translate-x-full"
                  }`}
                  style={{ display: index === currentSlide ? "flex" : "none" }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center shrink-0">
                      <feature.icon
                        size={24}
                        className="text-purple-400"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-1.5 mt-4">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide
                      ? "bg-purple-500 w-5"
                      : "bg-gray-600"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="px-6 pb-8 pt-4">
        <Card className="bg-[#1C1C1E] border-0 rounded-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg">Get Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full h-12 rounded-full bg-gradient-to-r from-purple-600 to-violet-500 text-white font-semibold text-sm active:scale-[0.98] transition-transform"
              size="lg"
              onClick={() => {
                window.location.href = getOAuthUrl();
              }}
            >
              Sign in with Kimi
            </Button>
            <p className="text-center text-xs text-gray-600">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
