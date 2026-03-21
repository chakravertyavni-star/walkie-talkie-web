import { Navigate, Route, Routes } from "react-router-dom";
import { ShellLayout } from "./components/ShellLayout.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { RoomsPage } from "./pages/RoomsPage.jsx";
import { RoomPage } from "./pages/RoomPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { EditProfilePage } from "./pages/EditProfilePage.jsx";
import { FriendsPage } from "./pages/FriendsPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";
import { AuthPage } from "./pages/AuthPage.jsx";
import { useAppContext } from "./context/AppContext.jsx";

function App() {
  const { isAuthenticated } = useAppContext();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  return (
    <ShellLayout>
      <Routes>
        <Route path="/auth" element={<Navigate to="/" replace />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/rooms/:roomId" element={<RoomPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />
        <Route path="/profile/friends" element={<FriendsPage />} />
        <Route path="/profile/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ShellLayout>
  );
}

export default App;
