import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./services/firebase";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Publications from "./pages/Publications.jsx";
import NewPublication from "./pages/NewPublication";
import EditPublication from "./pages/EditPublication";
import Statistics from "./pages/Statistics";
import Notifications from "./pages/Notifications.jsx";
import NewNotification from "./pages/NewNotification";
import Settings from "./pages/Settings";
import Usage from "./pages/Usage";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <p>Cargando...</p>;
  if (!user) return <Login />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/publications" element={<Publications />} />
          <Route path="/publications/new" element={<NewPublication />} />
          <Route path="/publications/:id/edit" element={<EditPublication />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/notifications/new" element={<NewNotification />} />
          <Route path="/usage" element={<Usage />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
