import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from './components/layout/AppLayout'
import { AuthProvider } from './features/auth/AuthContext'
import { LoginPage } from './features/auth/LoginPage'
import { PasswordRecoveryPage } from './features/auth/PasswordRecoveryPage'
import { AdminDashboard } from './features/dashboard/AdminDashboard'
import { RoleDashboard } from './features/dashboard/RoleDashboard'
import { ProgramsPage } from './features/programs/ProgramsPage'
import { ProjectsPage } from './features/projects/ProjectsPage'
import { ProjectDetailPage } from './features/projects/ProjectDetailPage'
import { LandingPage } from './features/public/LandingPage'
import { CallsPage } from './features/public/CallsPage'
import { CallDetailPage } from './features/public/CallDetailPage'
import { ApplicationPage } from './features/applications/ApplicationPage'
import { ModulePage } from './features/shared/ModulePage'
import { StaticPage } from './features/shared/StaticPage'
import { NotFoundPage } from './features/shared/NotFoundPage'
import { ProtectedRoute } from './routes/ProtectedRoute'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

function protectedLayout(roles: Parameters<typeof ProtectedRoute>[0]['roles']) {
  return <ProtectedRoute roles={roles}><AppLayout /></ProtectedRoute>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/convocatorias" element={<CallsPage />} />
            <Route path="/convocatorias/:slug" element={<CallDetailPage />} />
            <Route path="/convocatorias/:slug/solicitud" element={<ApplicationPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/recuperar-contrasena" element={<PasswordRecoveryPage />} />
            <Route path="/restablecer-contrasena" element={<PasswordRecoveryPage update />} />
            <Route path="/privacidad" element={<StaticPage title="Política de privacidad" />} />
            <Route path="/terminos" element={<StaticPage title="Términos de uso" />} />
            <Route path="/accesibilidad" element={<StaticPage title="Declaración de accesibilidad" />} />
            <Route path="/no-autorizado" element={<NotFoundPage unauthorized />} />

            <Route element={protectedLayout(['admin', 'coordinator'])}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/programas" element={<ProgramsPage />} />
              <Route path="/admin/programas/:id" element={<ModulePage kind="programas" />} />
              <Route path="/admin/proyectos" element={<ProjectsPage />} />
              <Route path="/admin/proyectos/:id" element={<ProjectDetailPage />} />
              {['convocatorias', 'candidaturas', 'evaluaciones', 'cohortes', 'mentores', 'itinerarios', 'eventos', 'indicadores', 'documentos', 'informes'].map((path) => <Route key={path} path={`/admin/${path}`} element={<ModulePage kind={path} />} />)}
            </Route>

            <Route element={protectedLayout(['admin'])}>
              {['usuarios', 'configuracion', 'auditoria'].map((path) => <Route key={path} path={`/admin/${path}`} element={<ModulePage kind={path} />} />)}
            </Route>

            <Route element={protectedLayout(['participant'])}>
              <Route path="/app" element={<RoleDashboard />} />
              {['itinerario', 'entregables', 'mentorias', 'calendario', 'comunidad', 'documentos', 'notificaciones', 'perfil'].map((path) => <Route key={path} path={`/app/${path}`} element={<ModulePage kind={path} />} />)}
              <Route path="/app/itinerario/:moduleId" element={<ModulePage kind="itinerario" />} />
              <Route path="/app/entregables/:taskId" element={<ModulePage kind="entregables" />} />
            </Route>

            <Route element={protectedLayout(['mentor'])}>
              <Route path="/mentor" element={<RoleDashboard />} />
              <Route path="/mentor/proyectos" element={<ProjectsPage />} />
              <Route path="/mentor/proyectos/:id" element={<ProjectDetailPage />} />
              {['sesiones', 'entregables', 'horas', 'calendario', 'perfil'].map((path) => <Route key={path} path={`/mentor/${path}`} element={<ModulePage kind={path} />} />)}
            </Route>

            <Route element={protectedLayout(['evaluator'])}>
              <Route path="/evaluador" element={<RoleDashboard />} />
              <Route path="/evaluador/candidaturas" element={<ModulePage kind="candidaturas" />} />
              <Route path="/evaluador/candidaturas/:id" element={<ModulePage kind="evaluaciones" />} />
              <Route path="/evaluador/evaluaciones" element={<ModulePage kind="evaluaciones" />} />
            </Route>

            <Route path="/app/*" element={<Navigate to="/app" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
