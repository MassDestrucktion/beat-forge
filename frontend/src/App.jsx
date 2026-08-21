import { Routes, Route } from "react-router";
import Navbar from "./components/NavBar.jsx";

import LandingPage from "./landingPage";
import RegisterPage from "./register";
import LoginPage from "./login";
import UserPage from "./userPage";
import SequencerPage from "./SequencerPage";
import GettingStarted from "./getingStarted";

import {useEffect} from "react";

export default function App() {
  useEffect(() => {
    const token = localStorage.getItem("token");

    if(!token) {
      console.log("No token found - socket.io not connecting");
      return;
    }
  }, []);

  return (
    <>
      <Navbar />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/getting-started" element={<GettingStarted />} />
          <Route path="/sequencer" element={<SequencerPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/userPage/:id" element={<UserPage />} />
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
      </main>
    </>
  );
}
