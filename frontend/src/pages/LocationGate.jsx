import { useState } from "react";

const LocationGate = ({ onSuccess, onManualLocation }) => {
  const [error, setError] = useState("");

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onSuccess({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setError("Location permission denied. You can enable it in settings.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundImage: "url('/map-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay for softness */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-sm"></div>

      {/* Welcome Card */}
      <div className="relative max-w-md w-full bg-white/90 backdrop-blur-md
        rounded-2xl shadow-xl p-6 text-center">

        <h1 className="text-2xl font-semibold text-[#1B1F1D]">
          Welcome to BusPulse 👋
        </h1>

        <p className="mt-1 text-xs text-[#5F6F68]">
          Real-time buses • Nearby stops • Accurate ETAs
        </p>

        <p className="mt-4 text-sm text-[#5F6F68]">
          To show nearby bus stops and live bus locations, we need access to your
          location.
        </p>

        {error && (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        )}

        {/* Primary CTA */}
        <button
          onClick={requestLocation}
          className="mt-6 w-full bg-[#1E7F5C] text-white py-3 rounded-xl
            font-medium hover:bg-[#16664A] transition"
        >
          Enable Location
        </button>

        {/* Secondary options */}
        <button
          className="mt-4 w-full text-sm text-[#5F6F68] underline"
          onClick={() => onSuccess(null)}
        >
          Continue without location
        </button>

        <button
          className="mt-2 w-full text-sm text-[#1F4FD8] underline"
          onClick={onManualLocation}
        >
          Set location manually
        </button>
      </div>
    </div>
  );
};

export default LocationGate;
