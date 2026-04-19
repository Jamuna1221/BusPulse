import { useState } from "react";
import { Outlet } from "react-router-dom";
import SchedulerSidebar from "./SchedulerSidebar";
import SchedulerNavbar from "./SchedulerNavbar";

const SchedulerLayout = ({
  basePath = "/scheduler",
  panelLabel = "Scheduler",
  profilePath,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const resolvedProfile = profilePath ?? `${basePath}/profile`;
  const outletCtx = { basePath, panelLabel, profilePath: resolvedProfile };

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      <SchedulerSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        basePath={basePath}
        panelLabel={panelLabel}
        profilePath={resolvedProfile}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <SchedulerNavbar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          basePath={basePath}
          panelLabel={panelLabel}
          profilePath={resolvedProfile}
        />

        <main className="flex-1 overflow-y-auto bg-gray-900 p-6">
          <Outlet context={outletCtx} />
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default SchedulerLayout;
