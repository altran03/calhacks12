"use client";

import { useState } from "react";
import Dashboard from "@/components/Dashboard";
import Header from "@/components/Header";

export default function Home() {
  const [activeView, setActiveView] = useState<"dashboard" | "intake" | "timeline" | "map" | "report">("dashboard");

  return (
    <div className="min-h-screen relative">
      <Header />
      <main className="container mx-auto px-6 py-12">
        <Dashboard activeView={activeView} setActiveView={setActiveView} />
      </main>
    </div>
  );
}
