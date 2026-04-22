const FoodItem = require("../models/FoodItem");

const getFoods = async (req, res, next) => {
  try {
    const { canteen } = req.query;

    let query = {};
    if (canteen) {
      query.canteen = canteen;
    }

    console.log("🔍 getFoods called with query:", query);
    const foods = await FoodItem.find(query).sort({ createdAt: -1 });
    console.log(`✅ Found ${foods.length} foods for query:`, query);

    if (foods.length > 0) {
      console.log("📋 Foods details:");
      foods.forEach((food, idx) => {
        console.log(`  [${idx}] ID: ${food._id.toString().substring(0, 8)}... | Name: "${food.name}" | Price: ${food.price} | Image: ${food.image ? '✅' : '❌'} | Canteen: ${food.canteen}`);
      });
    }

    res.json(foods);
  } catch (error) {
    console.error("❌ getFoods error:", error);
    next(error);
  }
};

const addFood = async (req, res, next) => {
  try {
    const { name, price, image, inStock, canteen, quantity } = req.body;

    console.log("🎁 addFood called with payload:", { name, price, image, inStock, canteen, quantity });

    if (!name || price === undefined || !canteen) {
      console.warn("⚠️ Missing required fields:", { name, price, canteen });
      return res.status(400).json({ message: "name, price, and canteen are required" });
    }

    if (Number(price) < 0) {
      console.warn("⚠️ Invalid price:", price);
      return res.status(400).json({ message: "Price must be zero or positive" });
    }

    if (!["anohana", "basement"].includes(canteen)) {
      console.warn("⚠️ Invalid canteen:", canteen);
      return res.status(400).json({ message: "Invalid canteen. Must be 'anohana' or 'basement'" });
    }

    const newFood = new FoodItem({
      name,
      price: Number(price),
      image: image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
      inStock: inStock !== undefined ? inStock : true,
      canteen,
      quantity: quantity || 0,
    });

    const savedFood = await newFood.save();
    console.log("✅ Food added successfully:", savedFood._id);

    res.status(201).json(savedFood);
  } catch (error) {
    console.error("❌ addFood error:", error);
    next(error);
  }
};

const updateFood = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log("🔄 updateFood called for ID:", id, "with updates:", updates);

    const updatedFood = await FoodItem.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedFood) {
      console.warn("⚠️ Food not found for ID:", id);
      return res.status(404).json({ message: "Food item not found" });
    }

    console.log("✅ Food updated successfully:", updatedFood._id);
    res.json(updatedFood);
  } catch (error) {
    console.error("❌ updateFood error:", error);
    next(error);
  }
};

const updateFoodStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    console.log("📦 updateFoodStock called for ID:", id, "with quantity:", quantity);

    if (quantity < 0) {
      console.warn("⚠️ Invalid quantity:", quantity);
      return res.status(400).json({ message: "Quantity cannot be negative" });
    }

    const updatedFood = await FoodItem.findByIdAndUpdate(
      id,
      { quantity, inStock: quantity > 0 },
      { new: true }
    );

    if (!updatedFood) {
      console.warn("⚠️ Food not found for ID:", id);
      return res.status(404).json({ message: "Food item not found" });
    }

    console.log("✅ Food stock updated successfully:", updatedFood._id);
    res.json(updatedFood);
  } catch (error) {
    console.error("❌ updateFoodStock error:", error);
    next(error);
  }
};

const deleteFood = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log("🗑️ deleteFood called for ID:", id);

    const deletedFood = await FoodItem.findByIdAndDelete(id);

    if (!deletedFood) {
      console.warn("⚠️ Food not found for ID:", id);
      return res.status(404).json({ message: "Food item not found" });
    }

    console.log("✅ Food deleted successfully:", deletedFood._id);
    res.json({ message: "Food item deleted successfully" });
  } catch (error) {
    console.error("❌ deleteFood error:", error);
    next(error);
  }
};

module.exports = {
  getFoods,
  addFood,
  updateFood,
  updateFoodStock,
  deleteFood,
};