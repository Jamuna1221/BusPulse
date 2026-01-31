import fetch from "node-fetch";

const cache = new Map();

export async function geocode(place) {
  if (cache.has(place)) {
    return cache.get(place);
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    place + ", Tamil Nadu, India"
  )}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "BusPulse/1.0" }
  });

  const data = await res.json();
  if (!data || data.length === 0) return null;

  const location = {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon)
  };

  cache.set(place, location);
  return location;
}
