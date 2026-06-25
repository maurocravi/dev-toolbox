"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { ConfirmProvider } from "./ConfirmDialog";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = pathname === "/login";

  return (
    <ConfirmProvider>
      <div className={hideSidebar ? "" : "app-layout"}>
        {!hideSidebar && <Sidebar />}
        <main className={hideSidebar ? "w-full" : "app-main ml-60"}>{children}</main>
      </div>
    </ConfirmProvider>
  );
}
