import { useState, useEffect } from "react";
import LocationGate from "./LocationGate";
import LocationPreview from "./LocationPreview";
import UpcomingBuses from "./UpcomingBuses";
import HomePage from "./HomePage";
import ManualLocation from "./ManualLocation";

// Fallback center — Kovilpatti area (Tamil Nadu)
const DEFAULT_LOCATION = { lat: 9.1464, lng: 77.8325 };

function UserFlow() {
  const [location,    setLocation]    = useState(null);
  const [step,        setStep]        = useState("ask");
  const [gpsLocation, setGpsLocation] = useState(null); // best GPS we could get

  // Try to silently get GPS in background as soon as app loads
  // This way, even if user chooses "Set manually", map starts at their real position
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}, // silent fail — user might deny later via LocationGate
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const handleLocationSuccess = (coords) => {
    const loc = coords || gpsLocation || DEFAULT_LOCATION;
    setLocation(loc);
    if (coords) setGpsLocation(coords); // update GPS record too
    setStep("preview");
  };

  const handleManualLocation = () => setStep("manual");

  const handleManualSubmit = (coords) => {
    setLocation(coords);
    setStep("preview");
  };

  const handlePreviewContinue = () => setStep("upcoming");

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
        // Pass GPS location so the map can center on user's real position
        gpsLocation={gpsLocation || DEFAULT_LOCATION}
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