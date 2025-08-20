import router from "./authRoutes";
import Product from "../models/products";

router.post("/add-products", async (req, res) => {
  try {
    const newProduct = await Product.create({
      name: "product-1",
      description: "brand new product here",
      price: 1234,
      category: "some category",
      imageUrl: "img.png",
      inStock: true,
    });
    res.json(newProduct);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
