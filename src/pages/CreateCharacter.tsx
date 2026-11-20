import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { ArrowLeft, Camera, Check, ChevronRight } from "lucide-react";

const categories = ["Romance", "Social", "Business", "Religious", "Counseling", "Productivity", "Anime", "Fantasy"];

export default function CreateCharacter() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [avatar, setAvatar] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [personality, setPersonality] = useState("");
  const [category, setCategory] = useState("Romance");
  const [greeting, setGreeting] = useState("");
  const [physicalDescription, setPhysicalDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createCharacter = trpc.character.create.useMutation({
    onSuccess: () => {
      navigate("/profile");
    },
  });

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!avatar) newErrors.avatar = "Avatar is required";
      if (!name.trim()) newErrors.name = "Name is required";
      if (!description.trim()) newErrors.description = "Description is required";
    }
    if (currentStep === 2) {
      if (!personality.trim()) newErrors.personality = "Personality is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 3) {
        setStep(step + 1);
      } else {
        handleCreate();
      }
    }
  };

  const handleCreate = () => {
    createCharacter.mutate({
      name: name.trim(),
      avatar: avatar || "/avatars/char1.jpg",
      description: description.trim(),
      personality: personality.trim(),
      category,
      greeting: greeting.trim() || undefined,
      physicalDescription: physicalDescription.trim() || undefined,
      isPublic,
    });
  };

  return (
    <div className="min-h-full bg-black pb-6">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-sm px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (step > 1) setStep(step - 1);
              else navigate(-1);
            }}
            className="w-10 h-10 flex items-center justify-center active:opacity-70"
          >
            <ArrowLeft size={22} className="text-white" />
          </button>
          <h1 className="text-lg font-semibold">Create Character</h1>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mt-3 px-1">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                s <= step ? "bg-purple-500" : "bg-[#2C2C2E]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="px-4 pt-6">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Basic Info</h2>
              <p className="text-sm text-gray-500">
                Let's start with the essentials
              </p>
            </div>

            {/* Avatar Upload */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-28 h-28 rounded-3xl bg-[#1C1C1E] flex items-center justify-center overflow-hidden active:scale-95 transition-transform border-2 border-dashed border-purple-500/50"
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera size={32} className="text-purple-400" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <p className="text-xs text-gray-500 mt-2">Tap to upload avatar</p>
              {errors.avatar && (
                <p className="text-xs text-red-400 mt-1">{errors.avatar}</p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Luna, Draco, Aria..."
                className="w-full px-4 py-3 rounded-xl bg-[#1C1C1E] text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              />
              {errors.name && (
                <p className="text-xs text-red-400 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Who is this character? What do they do?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-[#1C1C1E] text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
              />
              {errors.description && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.description}
                </p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Personality</h2>
              <p className="text-sm text-gray-500">
                Define how your character behaves
              </p>
            </div>

            {/* Personality */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Personality Traits *
              </label>
              <textarea
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                placeholder="e.g. Cheerful, sarcastic, mysterious, protective..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-[#1C1C1E] text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
              />
              {errors.personality && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.personality}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
                      category === cat
                        ? "bg-purple-600 text-white"
                        : "bg-[#1C1C1E] text-gray-400"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Physical Appearance */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Visual Appearance (for image sharing)
              </label>
              <textarea
                value={physicalDescription}
                onChange={(e) => setPhysicalDescription(e.target.value)}
                placeholder="Describe how they look: hair color, eyes, signature clothing..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-[#1C1C1E] text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
              />
              <p className="text-[10px] text-gray-600 mt-1">
                This helps the AI generate consistent photos of itself in chat.
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Final Touches</h2>
              <p className="text-sm text-gray-500">
                Add a greeting and visibility settings
              </p>
            </div>

            {/* Greeting */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                First Message (Greeting)
              </label>
              <textarea
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder="What does your character say first?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-[#1C1C1E] text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Visibility
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    isPublic
                      ? "bg-purple-600 text-white"
                      : "bg-[#1C1C1E] text-gray-400"
                  }`}
                >
                  <Check size={16} className={isPublic ? "opacity-100" : "opacity-0"} />
                  Public
                </button>
                <button
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    !isPublic
                      ? "bg-purple-600 text-white"
                      : "bg-[#1C1C1E] text-gray-400"
                  }`}
                >
                  <Check size={16} className={!isPublic ? "opacity-100" : "opacity-0"} />
                  Private
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-[#1C1C1E] rounded-2xl p-4 mt-4">
              <h3 className="text-sm font-semibold mb-3">Preview</h3>
              <div className="flex items-center gap-3">
                {avatar && (
                  <img
                    src={avatar}
                    alt={name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-sm">{name || "Unnamed"}</p>
                  <p className="text-xs text-gray-500">{category}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8">
          <button
            onClick={handleNext}
            disabled={createCharacter.isPending}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-violet-500 text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {createCharacter.isPending ? (
              <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : step === 3 ? (
              <>
                <Check size={18} />
                Create Character
              </>
            ) : (
              <>
                Next
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
