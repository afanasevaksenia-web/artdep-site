import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./state/AuthContext";
import { useAutoTheme } from "./hooks/useAutoTheme";
import LoginPage from "./routes/LoginPage";
import JoinPage from "./routes/JoinPage";
import ProjectsPage from "./routes/ProjectsPage";
import ProjectLayout from "./routes/ProjectLayout";
import TodayPage from "./routes/TodayPage";
import ChatsPage from "./routes/ChatsPage";
import ShootLayout from "./routes/shoot/ShootLayout";
import KppTab from "./routes/shoot/KppTab";
import ShiftsTab from "./routes/shoot/ShiftsTab";
import ShiftDetail from "./routes/shoot/ShiftDetail";
import FilesPage from "./routes/FilesPage";
import GroupPage from "./routes/GroupPage";

function RequireAuth({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth();
  if (loading) return <CenteredSpinner />;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function CenteredSpinner() {
  return (
    <div className="flex h-screen items-center justify-center text-muted">
      Загрузка…
    </div>
  );
}

export default function App() {
  useAutoTheme();
  const { session, loading } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={!loading && session ? <Navigate to="/projects" replace /> : <LoginPage />}
      />
      <Route
        path="/join/:code"
        element={
          <RequireAuth>
            <JoinPage />
          </RequireAuth>
        }
      />
      <Route
        path="/projects"
        element={
          <RequireAuth>
            <ProjectsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/p/:projectId"
        element={
          <RequireAuth>
            <ProjectLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="today" replace />} />
        <Route path="today" element={<TodayPage />} />
        <Route path="chats" element={<ChatsPage />} />
        <Route path="shoot" element={<ShootLayout />}>
          <Route index element={<Navigate to="shifts" replace />} />
          <Route path="shifts" element={<ShiftsTab />} />
          <Route path="shifts/:shiftId" element={<ShiftDetail />} />
          <Route path="kpp" element={<KppTab />} />
        </Route>
        <Route path="files" element={<FilesPage />} />
        <Route path="group" element={<GroupPage />} />
      </Route>
      <Route path="*" element={<Navigate to={session ? "/projects" : "/login"} replace />} />
    </Routes>
  );
}
