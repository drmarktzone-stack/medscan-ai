import React from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

export default function AppLayout() {
  return (
    <>
      <main className="pb-28">
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
}