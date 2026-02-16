import { searchPlacesByName } from "../repositories/placeRepository.js";

export async function searchPlaces(req, res) {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json({ success: true, places: [] });
    }

    const places = await searchPlacesByName(q);

    res.json({
      success: true,
      places,
    });
  } catch (error) {
    console.error("Error searching places:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search places",
    });
  }
}
