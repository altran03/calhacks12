"use client";

import { useState } from "react";
import Dashboard from "@/components/Dashboard";
import Header from "@/components/Header";

export default function Home() {
  const [activeView, setActiveView] = useState<"dashboard" | "intake" | "timeline" | "map" | "transport">("dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Dashboard activeView={activeView} setActiveView={setActiveView} />
      </main>
    </div>
  );
}
