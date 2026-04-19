import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader, MapPin, Activity } from "lucide-react";
import { adminUsersAPI } from "../../config/api";

const UserActivity = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    adminUsersAPI
      .getActivity(userId)
      .then((res) => {
        if (!mounted) return;
        setPayload(res.data);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e.message || "Failed to load activity");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [userId]);

  const u = payload?.user;
  const totals = payload?.totals;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          type="button"
          onClick={() => navigate("/admin/users")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-fit"
        >
          <ArrowLeft size={18} />
          Back to users
        </button>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
          <Activity className="text-blue-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">User activity</h1>
          {u && (
            <p className="text-gray-400 mt-1">
              {u.name}{" "}
              <span className="text-gray-500">·</span> {u.email}{" "}
              <span className="text-gray-500">·</span> {u.role}
            </p>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-400">
          <Loader className="animate-spin" size={22} />
          Loading…
        </div>
      )}
      {!loading && error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">{error}</div>
      )}

      {!loading && !error && totals && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Total searches", value: totals.totalSearches },
              { label: "Searches (30d)", value: totals.searchesLast30Days },
              { label: "Saved places", value: totals.savedPlaces },
              { label: "Bus interactions", value: totals.totalUserEvents },
              { label: "Reported boarded", value: totals.reportedBoarded },
              { label: "Reported missed", value: totals.reportedMissed },
            ].map((row) => (
              <div
                key={row.label}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4"
              >
                <p className="text-gray-500 text-xs uppercase tracking-wide">{row.label}</p>
                <p className="text-2xl font-semibold text-white mt-1">{row.value}</p>
              </div>
            ))}
          </div>

          <p className="text-gray-500 text-sm">
            Searches come from the trip finder. “Boarded” / “missed” are from in-app track feedback. This is not
            automatic AFC validation.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
                <MapPin size={18} className="text-green-400" />
                <h2 className="font-semibold text-white">Recent searches</h2>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {(payload.recentSearches || []).length === 0 ? (
                  <p className="p-4 text-gray-500 text-sm">No searches recorded.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-700/40 text-gray-400 text-left">
                      <tr>
                        <th className="px-4 py-2">When</th>
                        <th className="px-4 py-2">From</th>
                        <th className="px-4 py-2">To</th>
                        <th className="px-4 py-2">Buses</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/80">
                      {payload.recentSearches.map((s) => (
                        <tr key={s.id} className="text-gray-300">
                          <td className="px-4 py-2 whitespace-nowrap">
                            {s.searched_at
                              ? new Date(s.searched_at).toLocaleString()
                              : "—"}
                          </td>
                          <td className="px-4 py-2">{s.from_label || "—"}</td>
                          <td className="px-4 py-2">{s.to_place_name || "—"}</td>
                          <td className="px-4 py-2">{s.buses_found ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700">
                <h2 className="font-semibold text-white">Events by type</h2>
              </div>
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {(payload.eventsByType || []).length === 0 ? (
                  <p className="text-gray-500 text-sm">No bus feedback events.</p>
                ) : (
                  payload.eventsByType.map((e) => (
                    <div
                      key={e.event_type}
                      className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0"
                    >
                      <span className="text-gray-300 font-mono text-sm">{e.event_type}</span>
                      <span className="text-white font-medium">{e.cnt}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <h2 className="font-semibold text-white">Recent bus feedback events</h2>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              {(payload.recentEvents || []).length === 0 ? (
                <p className="p-4 text-gray-500 text-sm">None yet.</p>
              ) : (
                <table className="w-full text-sm min-w-[640px]">
                  <thead className="bg-slate-700/40 text-gray-400 text-left">
                    <tr>
                      <th className="px-4 py-2">When</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Route</th>
                      <th className="px-4 py-2">Departure</th>
                      <th className="px-4 py-2">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/80">
                    {payload.recentEvents.map((ev) => (
                      <tr key={ev.id} className="text-gray-300">
                        <td className="px-4 py-2 whitespace-nowrap">
                          {ev.created_at ? new Date(ev.created_at).toLocaleString() : "—"}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs">{ev.event_type}</td>
                        <td className="px-4 py-2">{ev.route_no || "—"}</td>
                        <td className="px-4 py-2">{ev.departure_time || "—"}</td>
                        <td className="px-4 py-2 text-gray-400">
                          {[ev.value, ev.delay_minutes != null ? `${ev.delay_minutes}m delay` : null, ev.note]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/admin/feedback"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Open feedback inbox (tickets from user events)
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default UserActivity;
