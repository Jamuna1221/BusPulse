import pandas as pd

# Load CSV
df = pd.read_csv("../output/places.csv")

# Sort alphabetically by PLACE column
df_sorted = df.sort_values(by="place_name")

# Save back to CSV
df_sorted.to_csv("places_sorted.csv", index=False)

print("Sorted CSV generated: places_sorted.csv")
