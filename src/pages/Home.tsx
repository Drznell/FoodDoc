```tsx
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Sparkles,
  Globe,
  Brain,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#071019] text-white overflow-hidden relative">

      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-[-150px] left-[-100px] w-[300px] h-[300px] rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute bottom-[-150px] right-[-100px] w-[300px] h-[300px] rounded-full bg-green-400/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-6">

        {/* Header */}
        <div className="pt-10 flex justify-between items-center">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-widest">
              AI Nutrition Assistant
            </p>

            <h1 className="text-3xl font-bold mt-1">
              FoodDoc
            </h1>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
        </div>

        {/* Hero */}
        <section className="pt-14 pb-10">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs mb-6">
            <Sparkles size={14} />
            Built for African Foods
          </div>

          <h2 className="text-5xl font-bold leading-tight tracking-tight">
            Understand
            <br />
            your food
            <br />
            before you eat.
          </h2>

          <p className="text-white/60 mt-6 leading-relaxed">
            FoodDoc uses AI to recognize African meals,
            estimate nutrition, and provide guidance in
            English, Yoruba, Hausa, Igbo and Pidgin.
          </p>

          <button
            onClick={() => navigate("/auth")}
            className="mt-8 w-full h-14 rounded-2xl bg-emerald-500 text-black font-semibold flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all"
          >
            <Camera size={18} />
            Analyze Your First Meal
          </button>

        </section>

        {/* Main Glass Card */}
        <section className="mb-6">

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">

            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg">
                What FoodDoc Knows
              </h3>

              <Brain className="text-emerald-400" />
            </div>

            <div className="grid grid-cols-2 gap-3">

              {[
                "Amala",
                "Eba",
                "Egusi",
                "Jollof Rice",
                "Suya",
                "Moi Moi",
                "Akara",
                "Tuwo",
              ].map((food) => (
                <div
                  key={food}
                  className="rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-white/80"
                >
                  {food}
                </div>
              ))}

            </div>

          </div>

        </section>

        {/* Features */}
        <section className="space-y-4 mb-8">

          <FeatureCard
            icon={<Camera size={22} />}
            title="Instant Meal Recognition"
            description="Snap a meal and get nutrition insights within seconds."
          />

          <FeatureCard
            icon={<Brain size={22} />}
            title="AI Dietitian"
            description="Receive personalized recommendations based on your goals."
          />

          <FeatureCard
            icon={<Globe size={22} />}
            title="Speak Your Language"
            description="English, Yoruba, Hausa, Igbo and Pidgin support."
          />

          <FeatureCard
            icon={<ShieldCheck size={22} />}
            title="Built for Africa"
            description="Designed around real African foods and eating habits."
          />

        </section>

        {/* Insight Card */}
        <section className="mb-8">

          <div className="rounded-3xl bg-gradient-to-r from-emerald-500/20 to-green-500/10 border border-emerald-500/20 p-6">

            <p className="text-xs uppercase tracking-widest text-emerald-300 mb-3">
              FoodDoc Insight
            </p>

            <h3 className="text-xl font-semibold mb-2">
              More than calories.
            </h3>

            <p className="text-white/70 leading-relaxed">
              FoodDoc helps you understand how your meals
              affect weight, diabetes risk, blood pressure,
              nutrient intake and overall health.
            </p>

          </div>

        </section>

        {/* CTA */}
        <section className="pb-12">

          <button
            onClick={() => navigate("/auth")}
            className="w-full h-14 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-center gap-2 font-medium"
          >
            Start Your Nutrition Journey
            <ArrowRight size={18} />
          </button>

          <p className="text-center text-white/40 text-xs mt-4">
            No subscriptions. No wahala. Just better food decisions.
          </p>

        </section>

      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 flex gap-4">

      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
        {icon}
      </div>

      <div>
        <h4 className="font-medium mb-1">
          {title}
        </h4>

        <p className="text-sm text-white/60">
          {description}
        </p>
      </div>

    </div>
  );
}
```
