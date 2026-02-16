import { useState, useEffect } from "react";
import { fetchUpcomingBuses } from "../services/busService";

export default function UpcomingBuses({ location, onChangeLocation }) {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [areaName, setAreaName] = useState("your location");
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch upcoming buses
  const loadUpcomingBuses = async () => {
    if (!location) {
      setError("Location not available");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchUpcomingBuses({
        lat: location.lat,
        lng: location.lng,
        maxMinutes: 15,
      });

      if (response.success) {
        setBuses(response.buses || []);
        setLastUpdated(new Date());
      } else {
        setError(response.error || "Failed to fetch buses");
      }
    } catch (err) {
      console.error("Error fetching buses:", err);
      setError("Unable to fetch upcoming buses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch area name using reverse geocoding
  const fetchAreaName = async () => {
    if (!location) return;

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
          "your location";
        setAreaName(area);
      }
    } catch (err) {
      console.error("Error fetching area name:", err);
    }
  };

  // Load buses on mount and when location changes
  useEffect(() => {
    loadUpcomingBuses();
    fetchAreaName();
  }, [location]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadUpcomingBuses();
    }, 30000);

    return () => clearInterval(interval);
  }, [location]);

  // Get status badge styles
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "NEARBY":
        return "bg-emerald-600 text-white";
      case "APPROACHING":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case "HIGH":
        return "text-green-600";
      case "MEDIUM":
        return "text-yellow-600";
      case "LOW":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 flex justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Buses near you
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Near <span className="font-medium">{areaName}</span> • Next 15
            minutes
          </p>
          <button
            className="mt-2 text-sm text-emerald-600 hover:underline"
            onClick={onChangeLocation}
          >
            Change location
          </button>

          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-2">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={loadUpcomingBuses}
              className="mt-2 text-sm text-red-700 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Bus List */}
        {!loading && !error && (
          <div className="space-y-4">
            {buses.length === 0 ? (
              <div className="text-center text-gray-500 mt-20 bg-white rounded-2xl p-8">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-lg font-medium text-gray-700">
                  No buses arriving soon
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Check back in a few minutes
                </p>
                <button
                  onClick={loadUpcomingBuses}
                  className="mt-4 text-sm text-emerald-600 hover:underline"
                >
                  Refresh
                </button>
              </div>
            ) : (
              buses.map((bus, index) => (
                <div
                  key={`${bus.serviceId}-${index}`}
                  className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition"
                >
                  {/* Top Row */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {bus.routeNo}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {bus.from} → {bus.to}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {bus.eta} min
                      </p>
                      <span
                        className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                          bus.status
                        )}`}
                      >
                        {bus.status}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${getConfidenceColor(
                          bus.confidence
                        )}`}
                      >
                        Confidence: {bus.confidence}
                      </span>
                      {bus.distance && (
                        <span className="text-xs text-gray-500">
                          • {bus.distance}m away
                        </span>
                      )}
                    </div>

                    <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition">
                      Track
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Refresh Button */}
        {!loading && buses.length > 0 && (
          <button
            onClick={loadUpcomingBuses}
            className="mt-6 w-full bg-white text-emerald-600 border-2 border-emerald-600 py-3 rounded-xl font-medium hover:bg-emerald-50 transition"
          >
            Refresh Buses
          </button>
        )}
      </div>
    </div>
  );
}