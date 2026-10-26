import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Landing } from "./routes/Landing.tsx";
import { PacketView } from "./routes/Packet.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/packet" element={<PacketView />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
