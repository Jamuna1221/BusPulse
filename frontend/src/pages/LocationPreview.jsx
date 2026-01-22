import { useEffect, useState } from "react";

const LocationPreview = ({ location, onContinue, onChange }) => {
  const [place, setPlace] = useState("Detecting your area...");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!location) return;

    const fetchPlaceName = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`
        );

        const data = await res.json();

        if (data?.address) {
          const area =
            data.address.suburb ||
            data.address.neighbourhood ||
            data.address.village ||
            data.address.town ||
            data.address.city ||
            data.address.county;

          const state = data.address.state;

          setPlace(`${area}, ${state}`);
        } else {
          setPlace("Your current area");
        }
      } catch {
        setError("Unable to fetch place name.");
        setPlace("Your current area");
      }
    };

    fetchPlaceName();
  }, [location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAF9] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 text-center">
        <h2 className="text-xl font-semibold text-[#1B1F1D]">
          📍 Location detected
        </h2>

        <p className="mt-3 text-lg font-medium text-[#1E7F5C]">
          {place}
        </p>

        <p className="mt-2 text-sm text-[#5F6F68]">
          We’ll use this to show nearby bus stops and live buses.
        </p>

        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}

        <button
          onClick={onContinue}
          className="mt-6 w-full bg-[#1E7F5C] text-white py-3 rounded-xl font-medium hover:bg-[#16664A]"
        >
          Continue
        </button>

        <button
          onClick={onChange}
          className="mt-3 w-full text-sm text-[#1F4FD8] underline"
        >
          Change location
        </button>
      </div>
    </div>
  );
};

export default LocationPreview;
