export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-6">Battleship Naval Strategy</h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl">
          A modern battleship game featuring historical naval vessels with real-time multiplayer
          gameplay
        </p>
        <div className="space-x-4">
          <button className="btn btn-primary text-lg px-8 py-3">Start Game</button>
          <button className="btn btn-secondary text-lg px-8 py-3">How to Play</button>
        </div>
      </div>
    </main>
  )
}
