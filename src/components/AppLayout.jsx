import React from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import PilotModeBanner from "@/components/PilotModeBanner";

export default function AppLayout() {
  return (
    <>
      <PilotModeBanner />
      <main className="pb-28">
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
}