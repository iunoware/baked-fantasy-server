import express from "express";
// import axios from "axios";

const router = express.Router();

router.post("/distance", async (req, res) => {
  const { origin, destination } = req.body;

  try {
    if (!origin || !destination) {
      return res.status(400).json({ error: "Missing origin or destination" });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY?.replace(/[\s,]+/g, "");

    if (!apiKey) {
      console.error("Missing GOOGLE_MAPS_API_KEY in environment variables");
      return res.status(500).json({ error: "Server configuration error" });
    }

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

    if (
      !response.data ||
      !response.data.rows ||
      response.data.rows.length === 0
    ) {
      console.error("Google API raw response:", response.data);
      return res.status(500).json({
        error: "Invalid response from Distance Matrix API",
        details: response.data,
      });
    }

    const row = response.data.rows[0];
    if (!row.elements || row.elements.length === 0) {
      return res.status(500).json({ error: "No routes found" });
    }

    const element = row.elements[0];

    if (element.status !== "OK") {
      return res
        .status(400)
        .json({ error: `Distance not found: ${element.status}` });
    }

    res.json({
      distanceValue: element.distance.value,
      distanceText: element.distance.text,
      durationText: element.duration.text,
      durationValue: element.duration.value,
    });
  } catch (error) {
    console.error(
      "Distance API error:",
      error?.response?.data || error.message,
    );
    res.status(500).json({ error: "Server error calculating distance" });
  }
});

export default router;
