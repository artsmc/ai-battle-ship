/**
 * User Profile Page
 * Main profile page displaying user information and statistics
 */

import { UserProfile } from '../../components/user/UserProfile'
import { Header, Footer } from '../../components/layout'

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-navy-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <UserProfile />
      </main>
      <Footer />
    </div>
  )
}