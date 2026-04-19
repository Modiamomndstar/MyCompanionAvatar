import { useNavigate } from "react-router";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-black flex flex-col items-center justify-center px-6">
      <div className="w-20 h-20 rounded-full bg-[#1C1C1E] flex items-center justify-center mb-6">
        <span className="text-3xl">404</span>
      </div>
      <h1 className="text-xl font-semibold mb-2">Page Not Found</h1>
      <p className="text-sm text-gray-500 text-center mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1C1C1E] text-sm font-medium active:scale-95 transition-transform"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 text-white text-sm font-medium active:scale-95 transition-transform"
        >
          <Home size={16} />
          Home
        </button>
      </div>
    </div>
  );
}
