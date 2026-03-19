import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/distance", async (req, res) => {
  const { origin, destination } = req.body;

  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/distancematrix/json",
      {
        params: {
          origins: `${origin.lat},${origin.lng}`,
          destinations: `${destination.lat},${destination.lng}`,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    );

    const element = response.data.rows[0].elements[0];

    if (element.status !== "OK") {
      return res.status(400).json({ error: "Distance not found" });
    }
    res.json(element);
    // res.json({
    //   distanceText: element.distance.text,
    //   distanceValue: element.distance.value,
    //   durationText: element.duration.text,
    // });
  } catch (error) {
    console.error("Distance API error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
