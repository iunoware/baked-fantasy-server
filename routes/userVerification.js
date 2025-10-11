// // import express from "express";
// import User from "../models/user.js";
// // import jwt, { verify } from "jsonwebtoken";
// import router from "./authRoutes.js";

// async function verifyUser(req, res, next) {
//   const token = req.headers.authorization?.split(" ")[1];
//   if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded; // contains user.id
//     next();
//   } catch (err) {
//     res.status(401).json({ msg: "Invalid token" });
//   }
// }

// router.get("/user-verification", verifyUser, async (req, res) => {
//   try {
//     const currentUser = await User.findById(req.user.id).populate(
//       `purchasedCourses.courseId`
//     );
//     res.json(currentUser);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// export default router;
