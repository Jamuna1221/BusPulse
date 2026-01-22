import { useState } from "react";
import LocationGate from "./pages/LocationGate";
import LocationPreview from "./pages/LocationPreview";
import HomePage from "./pages/HomePage";

function App() {
  const [location, setLocation] = useState(null);
  const [step, setStep] = useState("ask");
  // ask | preview | home

  if (step === "ask") {
    return (
      <LocationGate
        onSuccess={(coords) => {
          setLocation(coords);
          setStep("preview");
        }}
        onManualLocation={() => setStep("home")}
      />
    );
  }

  if (step === "preview") {
    return (
      <LocationPreview
        location={location}
        onContinue={() => setStep("home")}
        onChange={() => setStep("ask")}
      />
    );
  }

  return <HomePage location={location} />;
}

export default App;
