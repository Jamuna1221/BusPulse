import pandas as pd

# Load Excel
df = pd.read_csv("../input/SETC.csv")

# Extract unique places
from_places = df["From"].dropna().str.strip()
to_places = df["To"].dropna().str.strip()

places = sorted(set(from_places) | set(to_places))

# Save intermediate output
places_df = pd.DataFrame({"place_name": places})
places_df.to_csv("../output/places_raw.csv", index=False)

print(f"✅ Extracted {len(places)} unique places")  