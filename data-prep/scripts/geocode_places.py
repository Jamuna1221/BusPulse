import pandas as pd
import requests
import time

# Load places extracted from step 1
places_df = pd.read_csv("../output/places_raw.csv")

results = []

def geocode(place):
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": f"{place}, Tamil Nadu, India",
        "format": "json"
    }
    headers = {
        "User-Agent": "BusPulse/1.0"
    }

    response = requests.get(url, params=params, headers=headers)
    data = response.json()

    if not data:
        return None, None

    return data[0]["lat"], data[0]["lon"]

# Loop through places
for _, row in places_df.iterrows():
    place = row["place_name"]

    lat, lng = geocode(place)

    if lat and lng:
        results.append({
            "place_name": place,
            "latitude": lat,
            "longitude": lng
        })
        print(f"✅ {place} → {lat}, {lng}")
    else:
        print(f"❌ {place} → NOT FOUND")

    time.sleep(1)  # IMPORTANT: respect API limits

# Save final CSV
final_df = pd.DataFrame(results)
final_df.to_csv("../output/places.csv", index=False)

print("\n places.csv generated successfully")
