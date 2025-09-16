import { AuthButton } from '../components/auth/AuthButton'

export default function HomePage() {
  return (
    <main className="min-h-screen relative">
      {/* Header with Auth */}
      <header className="absolute top-0 right-0 p-6">
        <AuthButton />
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-6">Battleship Naval Strategy</h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl">
            A modern battleship game featuring historical naval vessels with real-time multiplayer
            gameplay
          </p>
          <div className="space-x-4">
            <a href="/game" className="btn btn-primary text-lg px-8 py-3 inline-block">Start Game</a>
            <button className="btn btn-secondary text-lg px-8 py-3">How to Play</button>
          </div>

          {/* Phase 5 Implementation Status */}
          <div className="mt-12 p-6 bg-surface-secondary rounded-lg border border-neutral-700 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-white mb-3">🎮 Phase 5: Local Gameplay</h3>
            <div className="text-left text-sm text-neutral-300 space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✅</span>
                <span>Game Engine Integration</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✅</span>
                <span>Game Orchestration Service</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✅</span>
                <span>AI Game Sessions</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✅</span>
                <span>Local Multiplayer Support</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-yellow-400">⏳</span>
                <span>Visual Board Integration</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
