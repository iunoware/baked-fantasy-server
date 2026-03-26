import express from "express";
// import axios from "axios";

const router = express.Router();

function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Math.round(d * 1000); // Distance in meters
}

router.post("/distance", async (req, res) => {
  const { origin, destination } = req.body;

  try {
    if (!origin || !destination) {
      return res
        .status(400)
        .json({ success: false, error: "Missing origin or destination" });
    }

    if (
      origin.lat === undefined ||
      origin.lng === undefined ||
      destination.lat === undefined ||
      destination.lng === undefined
    ) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Origin and destination must include lat and lng",
        });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY?.replace(/[\s,]+/g, "");

    if (apiKey) {
      try {
        const response = await axios.get(
          "https://maps.googleapis.com/maps/api/distancematrix/json",
          {
            params: {
              origins: `${origin.lat},${origin.lng}`,
              destinations: `${destination.lat},${destination.lng}`,
              key: apiKey,
            },
          },
        );

        if (response.data?.rows?.[0]?.elements?.[0]?.status === "OK") {
          const element = response.data.rows[0].elements[0];
          return res.json({
            success: true,
            distance: element.distance.value, // in meters
            duration: element.duration.value, // in seconds
          });
        } else {
          console.warn(
            "Google API returned non-OK status, falling back to Haversine. Status:",
            response.data?.rows?.[0]?.elements?.[0]?.status,
          );
        }
      } catch (apiError) {
        console.error(
          "Distance API error:",
          apiError?.response?.data || apiError.message,
        );
      }
    } else {
      console.warn(
        "Missing GOOGLE_MAPS_API_KEY, falling back to manual Haversine calculation",
      );
    }

    // Fallback to Haversine
    const distanceMeters = getDistanceFromLatLonInMeters(
      parseFloat(origin.lat),
      parseFloat(origin.lng),
      parseFloat(destination.lat),
      parseFloat(destination.lng),
    );

    return res.json({
      success: true,
      distance: distanceMeters,
      // No duration provided via Haversine
    });
  } catch (error) {
    console.error("Distance calculation error:", error.message);
    res.status(500).json({ success: false, error: "Server error calculating distance" });
  }
});

export default router;
