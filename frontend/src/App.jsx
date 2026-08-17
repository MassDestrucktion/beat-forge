import { Routes, Route } from "react-router";
import Navbar from "./components/Navbar";

import LandingPage from "./landingPage";
import RegisterPage from "./register";
import LoginPage from "./login";
import UserPage from "./userPage";
import SequencerPage from "./SequencerPage";
import GettingStarted from "./getingStarted";
import FeaturedProjects from "./featuredprojects";

import {useEffect} from "react";
import socket from "./socket";
import cors from "cors"

export default function App() {
  useEffect(() => {
    const token = localStorage.getItem("token");

    if(!token) {
      console.log("No token found - socket.io not connecting");
      return;
    }

    
    socket.connect();

    socket.on("connect", () => {
      console.log("Connected on: ", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from: ", socket.id);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.disconnect();
    };


  }, []);

  return (
    <>
      <Navbar />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/getting-started" element={<GettingStarted />} />
          <Route path="/sequencer" element={<SequencerPage />} />
          <Route path="/FeaturedProjects" element={<FeaturedProjects />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/userPage" element={<UserPage />} />
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
      </main>
    </>
  );
}
