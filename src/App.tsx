import { Routes, Route, Navigate } from "react-router";
import { lazy, Suspense } from "react";
import { Toaster } from "sonner";
import { BottomNav } from "./components/BottomNav";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useAuth } from "./hooks/useAuth";

const Home = lazy(() => import("./pages/Home"));
const Explore = lazy(() => import("./pages/Explore"));
const CreateCharacter = lazy(() => import("./pages/CreateCharacter"));
const Chats = lazy(() => import("./pages/Chats"));
const ChatRoom = lazy(() => import("./pages/ChatRoom"));
const Profile = lazy(() => import("./pages/Profile"));
const CharacterDetail = lazy(() => import("./pages/CharacterDetail"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const NotFound = lazy(() => import("./pages/NotFound"));

function LoadingFallback() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        <p className="text-sm text-gray-400">Loading MyCompanionAvatar...</p>
      </div>
    </div>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-full bg-black flex flex-col md:flex-row overflow-hidden">
      <div className="hidden md:flex">
        <BottomNav />
      </div>
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <div className="h-full w-full md:max-w-4xl md:mx-auto">{children}</div>
      </main>
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <ErrorBoundary>
        <LoadingFallback />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Toaster position="top-center" richColors theme="dark" />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <Register />
            }
          />
          <Route
            path="/*"
            element={
              isAuthenticated ? (
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/create" element={<CreateCharacter />} />
                    <Route path="/chats" element={<Chats />} />
                    <Route
                      path="/chat/:conversationId"
                      element={<ChatRoom />}
                    />
                    <Route path="/profile" element={<Profile />} />
                    <Route
                      path="/character/:id"
                      element={<CharacterDetail />}
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
