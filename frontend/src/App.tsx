import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Login } from '@/pages/Login';
import { Doctors } from '@/pages/Doctors';
import { DoctorDetail } from '@/pages/DoctorDetail';
import { DoctorsManagement } from '@/pages/admin/DoctorsManagement';
import { AvailabilityManagement } from '@/pages/admin/AvailabilityManagement';
import { AppointmentsManagement } from '@/pages/admin/AppointmentsManagement';
import { MyAppointments } from '@/pages/MyAppointments';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

function Layout({ children }: { children: ReactNode }) {
  const { user, signOut, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-2xl font-bold">
              Clinica Orchidea
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <Link to="/doctors" className="text-sm hover:text-primary">
                Dottori
              </Link>
              {!isAdmin() && (
                <Link to="/appointments" className="text-sm hover:text-primary">
                  I miei appuntamenti
                </Link>
              )}
              {isAdmin() && (
                <>
                  <Link to="/admin/doctors" className="text-sm hover:text-primary">
                    Gestione Dottori
                  </Link>
                  <Link to="/admin/availability" className="text-sm hover:text-primary">
                    Disponibilità
                  </Link>
                  <Link to="/admin/appointments" className="text-sm hover:text-primary">
                    Appuntamenti
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.email} ({user?.role})
            </span>
            <Button variant="outline" size="sm" onClick={signOut}>
              Logout
            </Button>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}

function HomePage() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold mb-4">
          Benvenuto{user?.role === 'admin' ? ' Admin' : ''}!
        </h2>
        <p className="text-muted-foreground mb-6">
          Prenotazione Appuntamenti
        </p>

        <div className="grid gap-4">
          <Link to="/doctors">
            <Button variant="outline" className="w-full justify-start">
              Visualizza i nostri dottori
            </Button>
          </Link>
          {!isAdmin() && (
            <Link to="/appointments">
              <Button variant="outline" className="w-full justify-start">
                I miei appuntamenti
              </Button>
            </Link>
          )}
          {isAdmin() && (
            <>
              <Link to="/admin/doctors">
                <Button variant="outline" className="w-full justify-start">
                  Gestisci dottori
                </Button>
              </Link>
              <Link to="/admin/availability">
                <Button variant="outline" className="w-full justify-start">
                  Gestisci disponibilità
                </Button>
              </Link>
              <Link to="/admin/appointments">
                <Button variant="outline" className="w-full justify-start">
                  Gestisci appuntamenti
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Toaster position="top-right" />

        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <HomePage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctors"
            element={
              <ProtectedRoute>
                <Layout>
                  <Doctors />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctors/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <DoctorDetail />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <Layout>
                  <MyAppointments />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/doctors"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <DoctorsManagement />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/availability"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <AvailabilityManagement />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/appointments"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <AppointmentsManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
