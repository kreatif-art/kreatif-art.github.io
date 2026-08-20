import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { PlayerProvider } from '@/context/PlayerContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MiniPlayer } from '@/components/MiniPlayer';
import { SynestheticBackground } from '@/components/SynestheticBackground';
import { PageTransition } from '@/components/PageTransition';
import { IntroLoader } from '@/components/IntroLoader';
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from '@/components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { BrowsePage } from '@/pages/BrowsePage';
import { ContentDetailPage } from '@/pages/ContentDetailPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ArtistProfilePage } from '@/pages/ArtistProfilePage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import { SearchPage } from '@/pages/SearchPage';
import { UploadPage } from '@/pages/UploadPage';
import { AdminPage } from '@/pages/AdminPage';
import { TermsPage } from '@/pages/TermsPage';
import { PrivacyPage } from '@/pages/PrivacyPage';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-transparent">
      <SynestheticBackground />
      <div className="film-grain" aria-hidden />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
        <MiniPlayer />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <IntroLoader />
        <BrowserRouter>
          <Routes>
            {/* Public-only routes (auth pages) */}
            <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
            <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
            <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />

            {/* All other routes share the main layout */}
            <Route path="*" element={
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/browse/music" element={<BrowsePage type="music" />} />
                  <Route path="/browse/art" element={<BrowsePage type="art" />} />
                  <Route path="/content/:id" element={<ContentDetailPage />} />
                  <Route path="/artist/:id" element={<ArtistProfilePage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
                  <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
                </Routes>
              </Layout>
            } />
          </Routes>
        </BrowserRouter>
      </PlayerProvider>
    </AuthProvider>
  );
}

export default App;
