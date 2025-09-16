/**
 * Game Page
 * Main game interface for starting and playing battleship games
 */

import { GameFlow } from '../../components/game/GameFlow'
import { Header, Footer } from '../../components/layout'

export default function GamePage() {
  return (
    <div className="min-h-screen bg-navy-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <GameFlow />
      </main>
      <Footer />
    </div>
  )
}