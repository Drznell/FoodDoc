import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white px-6 pt-16 pb-24">
        <div className="max-w-md mx-auto text-center">
          <div className="text-5xl mb-4">🥗</div>
          <h1 className="text-3xl font-bold mb-3">FoodDoc</h1>
          <p className="text-green-100 text-lg mb-2">Know What You Eat</p>
          <p className="text-green-100 text-sm opacity-80">
            Nigeria's first AI-powered nutrition tracker that actually understands your food — jollof rice, egusi, suya and all.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-md mx-auto px-6 -mt-10">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <span className="text-2xl">📸</span>
              <div>
                <h3 className="font-semibold text-gray-800">Snap or Describe</h3>
                <p className="text-gray-500 text-sm">Photo your meal or just describe it — our AI knows Nigerian food deeply.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl">📊</span>
              <div>
                <h3 className="font-semibold text-gray-800">Full Nutrition Breakdown</h3>
                <p className="text-gray-500 text-sm">Calories, protein, carbs, fat, iron, folate, zinc — all in seconds.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl">🧠</span>
              <div>
                <h3 className="font-semibold text-gray-800">Personalised Advice</h3>
                <p className="text-gray-500 text-sm">Get diet advice tailored to your health goals from an AI nutritionist.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl">📅</span>
              <div>
                <h3 className="font-semibold text-gray-800">Track Your Progress</h3>
                <p className="text-gray-500 text-sm">Log every meal and watch your weekly nutrition story unfold.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-3 pb-12">
          <button
            onClick={() => navigate('/auth')}
            className="w-full bg-primary text-white py-4 rounded-xl font-semibold text-lg hover:bg-primary-dark transition-colors"
          >
            Get Started — It's Free
          </button>
          <p className="text-center text-gray-400 text-xs">
            No credit card. No wahala. Just better eating.
          </p>
        </div>
      </div>
    </div>
  )
}