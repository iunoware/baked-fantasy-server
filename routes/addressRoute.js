import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import Address from "../models/address.js";

const router = express.Router();

router.post("/address", authMiddleware, async (req, res) => {
  try {
    const { label, fullAddress, landmark, building, lat, lng, isDefault } =
      req.body;

    let isActuallyDefault = isDefault;
    const count = await Address.countDocuments({ userId: req.user._id });
    if (count === 0) {
      isActuallyDefault = true; // First address added automatically becomes default
    }

    if (isActuallyDefault) {
      await Address.updateMany(
        { userId: req.user._id },
        { $set: { isDefault: false } },
      );
    }

    const address = await Address.create({
      userId: req.user._id,
      label,
      fullAddress,
      lat,
      lng,
      landmark,
      building,
      isDefault: isActuallyDefault,
    });

    res.status(200).json(address);
  } catch (error) {
    console.error(error); // 🔥 add this
    res.status(500).json({ message: error.message });
  }
});

router.get("/address", authMiddleware, async (req, res) => {
  try {
    const address = await Address.find({ userId: req.user._id }).sort({
      isDefault: -1, // Sort so default is at position 0
      createdAt: -1,
    });
    res.json(address);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/address/:id/select", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Reset all addresses to false
    await Address.updateMany({ userId }, { $set: { isDefault: false } });

    // Set the selected one to true
    await Address.findOneAndUpdate(
      { _id: id, userId },
      { $set: { isDefault: true } },
      { new: true },
    );

    // Return the cleanly updated full list, sorting default to the top
    const updatedAddresses = await Address.find({ userId }).sort({
      isDefault: -1,
      createdAt: -1,
    });
    res.json(updatedAddresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/address/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const address = await Address.findOne({ _id: id, userId });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    const wasDefault = address.isDefault;

    await Address.deleteOne({ _id: id, userId });

    if (wasDefault) {
      const nextAddress = await Address.findOne({ userId }).sort({
        createdAt: -1,
      });

      if (nextAddress) {
        ((nextAddress.isDefault = true), await nextAddress.save());
      }
    }

    const updatedAddresses = await Address.find({ userId }).sort({
      isDefault: -1,
      createdAt: -1,
    });
    res.json(updatedAddresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
