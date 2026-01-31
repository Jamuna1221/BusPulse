import { useState } from "react";

export default function UpcomingBuses() {
  // Dummy data (replace with backend later)
  const [buses] = useState([
    {
      route: "83A",
      eta: 6,
      from: "Kovilpatti",
      to: "Shencottai",
      status: "NEARBY",
      confidence: "MEDIUM",
    },
    {
      route: "831UD",
      eta: 12,
      from: "Thoothukudi",
      to: "Tirunelveli",
      status: "APPROACHING",
      confidence: "LOW",
    },
    {
      route: "L23",
      eta: 14,
      from: "Madurai",
      to: "Aruppukottai",
      status: "APPROACHING",
      confidence: "HIGH",
    },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 flex justify-center">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Buses near you
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Near <span className="font-medium">Nalattinputhur</span> • Next 15 minutes
          </p>
          <button className="mt-2 text-sm text-emerald-600 hover:underline">
            Change location
          </button>
        </div>

        {/* Bus List */}
        <div className="space-y-4">
          {buses.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              No buses arriving in the next 15 minutes.
            </div>
          ) : (
            buses.map((bus, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-4 shadow-md"
              >
                {/* Top Row */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {bus.route}
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
                      className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium
                        ${
                          bus.status === "NEARBY"
                            ? "bg-emerald-600 text-white"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                    >
                      {bus.status}
                    </span>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="flex justify-between items-center mt-4">
                  <span
                    className={`text-sm font-medium
                      ${
                        bus.confidence === "HIGH"
                          ? "text-green-600"
                          : bus.confidence === "MEDIUM"
                          ? "text-yellow-600"
                          : "text-red-500"
                      }`}
                  >
                    Confidence: {bus.confidence}
                  </span>

                  <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition">
                    View Bus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
