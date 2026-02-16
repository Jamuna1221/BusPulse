import { useState } from "react";
import api from "../config/api";

function ManualLocation({ onSubmit, onCancel }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (value) => {
    setQuery(value);

    if (value.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await api.placesAPI.search(value);
      setResults(res.places || []);
    } catch (error) {
      console.error("Search error:", error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-md w-96">
        <h2 className="text-lg font-semibold mb-4">
          Search Your Location
        </h2>

        <input
          type="text"
          placeholder="Search location..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full border p-2 rounded mb-3"
        />

        {loading && <p className="text-sm">Searching...</p>}

        {results.map((place) => (
          <div
            key={place.id}
            onClick={() => onSubmit({ lat: place.lat, lng: place.lng })}
            className="p-2 cursor-pointer hover:bg-gray-100 rounded"
          >
            {place.name}
          </div>
        ))}

        <button
          onClick={onCancel}
          className="mt-4 w-full text-sm underline text-gray-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default ManualLocation;
