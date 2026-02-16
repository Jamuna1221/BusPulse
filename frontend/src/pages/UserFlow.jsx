import { useState } from "react";
import LocationGate from "./LocationGate";
import LocationPreview from "./LocationPreview";
import UpcomingBuses from "./UpcomingBuses";
import HomePage from "./HomePage";
import ManualLocation from "./ManualLocation";

const DEFAULT_LOCATION = {
  lat: 9.1464,
  lng: 77.8325,
};

function UserFlow() {
  const [location, setLocation] = useState(null);
  const [step, setStep] = useState("ask");

  const handleLocationSuccess = (coords) => {
    if (coords) {
      setLocation(coords);
    } else {
      // Continue without location
      setLocation(DEFAULT_LOCATION);
    }
    setStep("preview");
  };

  const handleManualLocation = () => {
    setStep("manual");
  };

  const handleManualSubmit = (coords) => {
    setLocation(coords);
    setStep("preview");
  };

  const handlePreviewContinue = () => {
    setStep("upcoming");
  };

  const handleChangeLocation = () => {
    setLocation(null);
    setStep("ask");
  };

  if (step === "ask") {
    return (
      <LocationGate
        onSuccess={handleLocationSuccess}
        onManualLocation={handleManualLocation}
      />
    );
  }

  if (step === "manual") {
    return (
      <ManualLocation
        onSubmit={handleManualSubmit}
        onCancel={() => setStep("ask")}
      />
    );
  }

  if (step === "preview") {
    return (
      <LocationPreview
        location={location}
        onContinue={handlePreviewContinue}
        onChange={handleChangeLocation}
      />
    );
  }

  if (step === "upcoming") {
    return (
      <UpcomingBuses
        location={location}
        onChangeLocation={handleChangeLocation}
        onSelectBus={() => setStep("home")}
      />
    );
  }

  return <HomePage location={location} />;
}

export default UserFlow;
