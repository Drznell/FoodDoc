import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="ambient-bg min-h-screen">
      <div className="content-layer max-w-md mx-auto px-6 pt-20 pb-16 flex flex-col min-h-screen">

        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-5 shadow-glow">
            <span className="text-4xl">🥗</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">FoodDoc</h1>
          <p className="text-primary font-medium">Know What You Eat</p>
        </div>

        <div className="glass rounded-3xl p-6 mb-6 text-center">
          <p className="text-gray-200 text-base leading-relaxed">
            Nigeria's first AI nutritionist that truly understands your food —
            <span className="text-primary font-medium"> jollof, egusi, suya</span> and all.
          </p>
          <p className="text-gray-500 text-sm mt-3">
            Speaks English, Pidgin, Yoruba, Hausa & Igbo 🇳🇬
          </p>
        </div>

        <div className="space-y-3 mb-10">
          {[
            { icon: '📸', title: 'Snap or Describe', desc: 'Photo your meal or just describe it in any language' },
            { icon: '🧠', title: 'AI Nutrition Analysis', desc: 'Full breakdown: calories, protein, carbs, iron, zinc & more' },
            { icon: '🗣️', title: 'Voice in Your Language', desc: 'Listen to advice in Pidgin, Yoruba, Hausa or Igbo' },
            { icon: '📊', title: 'Daily Tracking', desc: 'See your progress toward daily nutrition targets' },
          ].map(item => (
            <div key={item.title} className="glass rounded-2xl p-4 flex items-start gap-4">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="font-semibold text-white text-sm">{item.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 mt-auto">
          <button
            onClick={() => navigate('/auth')}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-base hover:bg-primary-dark transition-colors shadow-glow"
          >
            Get Started — Free
          </button>
          <p className="text-center text-gray-600 text-xs">
            No credit card. No wahala. Just better eating. 🙌
          </p>
        </div>
      </div>
    </div>
  )
}
