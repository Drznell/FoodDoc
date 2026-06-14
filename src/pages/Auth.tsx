import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit() {
    setLoading(true); setError(''); setMessage('')
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account!')
    }
    setLoading(false)
  }

  return (
    <div className="ambient-bg min-h-screen flex items-center justify-center px-6">
      <div className="content-layer w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4 shadow-glow">
            <span className="text-3xl">🥗</span>
          </div>
          <h1 className="text-2xl font-bold text-white">FoodDoc</h1>
          <p className="text-gray-500 text-sm mt-1">{isLogin ? 'Welcome back' : 'Create your account'}</p>
        </div>

        <div className="glass rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
            />
          </div>

          {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>}
          {message && <p className="text-primary text-sm bg-primary/10 border border-primary/20 px-3 py-2 rounded-lg">{message}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 shadow-glow-sm"
          >
            {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Create Account'}
          </button>

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-center text-gray-500 text-sm hover:text-gray-300 transition-colors"
          >
            {isLogin ? "No account? Sign up free" : 'Already have an account? Log in'}
          </button>
        </div>
      </div>
    </div>
  )
}
