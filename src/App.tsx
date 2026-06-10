import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Analyse from './pages/Analyse'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Navbar from './components/Navbar'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Loading FoodDoc...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {session && <Navbar />}
      <Routes>
        <Route path="/" element={!session ? <Home /> : <Navigate to="/analyse" />} />
        <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/analyse" />} />
        <Route path="/analyse" element={session ? <Analyse /> : <Navigate to="/" />} />
        <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/profile" element={session ? <Profile /> : <Navigate to="/" />} />
      </Routes>
    </div>
  )
}