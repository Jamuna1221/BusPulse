import { useState } from "react";

import LocationGate from "./pages/LocationGate";
import LocationPreview from "./pages/LocationPreview";
import UpcomingBuses from "./pages/UpcomingBuses.jsx";
import HomePage from "./pages/HomePage";

function App() {
  const [location, setLocation] = useState(null);

  /**
   * ask      → ask for location permission
   * preview  → show detected location
   * upcoming → show buses in next 15 mins
   * home     → final/home page (later tracking)
   */
  const [step, setStep] = useState("ask");

  // 1️⃣ Ask for location
  if (step === "ask") {
    return (
      <LocationGate
        onSuccess={(coords) => {
          setLocation(coords);
          setStep("preview");
        }}
        onManualLocation={() => setStep("preview")}
      />
    );
  }

  // 2️⃣ Preview detected location
  if (step === "preview") {
    return (
      <LocationPreview
        location={location}
        onContinue={() => setStep("upcoming")} // 🔥 CHANGED
        onChange={() => setStep("ask")}
      />
    );
  }

  // 3️⃣ Upcoming buses page (NEW)
  if (step === "upcoming") {
    return (
      <UpcomingBuses
        location={location}
        onSelectBus={() => setStep("home")} // later bus detail
        onChangeLocation={() => setStep("ask")}
      />
    );
  }

  // 4️⃣ Home / Bus detail page
  return <HomePage location={location} />;
}

export default App;
