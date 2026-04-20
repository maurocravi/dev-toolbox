"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = pathname === "/login";

  return (
    <div className={hideSidebar ? "" : "app-layout"}>
      {!hideSidebar && <Sidebar />}
      <main className={hideSidebar ? "w-full" : "app-main"}>{children}</main>
    </div>
  );
}
