"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { useFeatureFlag } from "@/design-system";
import Footer from "@/components/Footer";
import CustomFooter from "@/components/CustomFooter";
import Header from "./Header";
import CustomHeader from "./CustomHeader";
import AdminHeader from "./AdminHeader";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The DS Landing (flag on) renders its own nav + footer, so the global
  // marketplace header/footer must not wrap the root route.
  const landingOn = useFeatureFlag("landing");

  const customFooterRoutes = ['/profile-complete'];
  const isAuthPage = pathname.includes("auth");
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminHeader />
        <div className="flex-1 flex flex-col">{children}</div>
        <CustomFooter/>
      </div>
    );
  }

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAppointmentRoute = pathname.startsWith("/appointment");
  const isOrgRoute = pathname.startsWith("/organization");
  const isProfileRoute = pathname.startsWith("/profile");
  const isNoFooterRoute =
    pathname.startsWith("/contact") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/support");

  // Org routes use their own layout (OrgSidebar + OrgHeader) — no global header/footer.
  // The DS Landing at "/" is likewise self-chrome when its flag is on.
  if (isOrgRoute || isProfileRoute || (pathname === "/" && landingOn)) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {!isAuthPage && (isDashboardRoute ? <CustomHeader /> : <Suspense fallback={null}><Header /></Suspense>)}
      <div className="flex-1 flex flex-col">{children}</div>
      {!isAuthPage && !isNoFooterRoute && (isDashboardRoute || customFooterRoutes.includes(pathname) || isAppointmentRoute ? <CustomFooter /> : <Footer />)}
    </div>
  );
}