"use client";

import { usePathname } from "next/navigation";
import NavBar from "./NavBar";
import ProNavBar from "@/components/pro/ProNavBar";

export default function NavigationShell() {
  const pathname = usePathname();

  const isProRoute = pathname.startsWith("/pro");

  if (isProRoute) {
    return <ProNavBar />;
  }

  return <NavBar />;
}