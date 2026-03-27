import { useEffect, useState } from "react";

/**
 * LocationPreview
 *
 * For rural Tamil Nadu, Nominatim often doesn't know the village name.
 * Strategy: show the most granular info available in this order:
 *   1. hamlet (small village — e.g. Vanaramutti) ← best
 *   2. village
 *   3. road name (highway label — always accurate on rural roads)
 *   4. county / district
 *
 * Always show exact coordinates so user can verify.
 * Always show district so user has geographic context.
 */

const LocationPreview = ({ location, onContinue, onChange }) => {
  const [primaryName,   setPrimaryName]   = useState("Detecting...");
  const [secondaryName, setSecondaryName] = useState("");
  const [district,      setDistrict]      = useState("");
  const [error,         setError]         = useState("");

  useEffect(() => {
    if (!location) return;

    const fetch18 = (zoom) =>
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=${zoom}&addressdetails=1&accept-language=en`,
        { headers: { "User-Agent": "BusPulse/1.0" } }
      ).then((r) => r.json());

    const fetchName = async () => {
      try {
        // Try zoom 18 first (most granular — picks up hamlets)
        const data = await fetch18(18);
        const a    = data?.address || {};

        const dist = a.state_district || a.county || "";
        setDistrict(dist);

        // Best village/hamlet name
        const villageName =
          a.hamlet        ||
          a.village       ||
          a.suburb        ||
          a.neighbourhood ||
          null;

        // Road — very useful for rural highway locations
        const road = a.road || null;

        if (villageName) {
          // We have a village/hamlet name — great!
          setPrimaryName(villageName);
          setSecondaryName(road || dist);
        } else if (road) {
          // No village name but we have road — show road as primary
          // Road names in rural TN are very descriptive:
          // e.g. "Puliangudi - Sankarankovil - Kalugumalai - Nalatinpudur Road"
          // Shorten if too long
          const shortRoad = road.length > 45 ? road.slice(0, 42) + "…" : road;
          setPrimaryName(shortRoad);
          setSecondaryName(dist);
        } else {
          // Last resort: town/city + state
          const area = a.town || a.city || a.county || "Your location";
          setPrimaryName(area);
          setSecondaryName(dist);
        }
      } catch {
        setError("Could not detect area name.");
        setPrimaryName("Your selected location");
      }
    };

    fetchName();
  }, [location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAF9] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 text-center">

        <h2 className="text-xl font-semibold text-[#1B1F1D]">
          📍 Location detected
        </h2>

        {/* Primary name — hamlet/village/road */}
        <p className="mt-3 text-lg font-medium text-[#1E7F5C] leading-snug">
          {primaryName}
        </p>

        {/* Secondary — road or district */}
        {secondaryName && (
          <p className="mt-1 text-sm text-[#5F6F68]">
            {secondaryName}
          </p>
        )}

        {/* District badge */}
        {district && district !== secondaryName && (
          <span className="mt-2 inline-block bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full border border-emerald-200">
            {district} District
          </span>
        )}

        {/* Exact coordinates */}
        <div className="mt-4 inline-block bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
          <p className="text-xs text-gray-400 mb-0.5">Exact coordinates pinned</p>
          <p className="text-sm font-mono font-bold text-gray-800 tracking-wide">
            {location.lat.toFixed(5)}°N&nbsp;&nbsp;{location.lng.toFixed(5)}°E
          </p>
        </div>

        <p className="mt-2 text-xs text-gray-400">
          ✓ ETA matching uses coordinates — not the name shown above
        </p>

        <p className="mt-3 text-sm text-[#5F6F68]">
          We'll use this to find buses near you.
        </p>

        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

        <button
          onClick={onContinue}
          className="mt-6 w-full bg-[#1E7F5C] text-white py-3 rounded-xl font-medium hover:bg-[#16664A] transition"
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