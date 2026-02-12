import { useState } from "react";

import LocationGate from "./LocationGate";
import LocationPreview from "./LocationPreview";
import UpcomingBuses from "./UpcomingBuses";
import HomePage from "./HomePage";

function UserFlow() {
  const [location, setLocation] = useState(null);
  const [step, setStep] = useState("ask");

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

  if (step === "preview") {
    return (
      <LocationPreview
        location={location}
        onContinue={() => setStep("upcoming")}
        onChange={() => setStep("ask")}
      />
    );
  }

  if (step === "upcoming") {
    return (
      <UpcomingBuses
        location={location}
        onSelectBus={() => setStep("home")}
        onChangeLocation={() => setStep("ask")}
      />
    );
  }

  return <HomePage location={location} />;
}

export default UserFlow;
