const Material = require('../models/Material');

// Get all materials
const getAllMaterials = async (req, res) => {
  try {
    const materials = await Material.find({ isActive: true });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get material by ID
const getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    res.json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new material (admin only)
const createMaterial = async (req, res) => {
  try {
    const material = new Material(req.body);
    await material.save();
    res.status(201).json(material);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update material (admin only)
const updateMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    res.json(material);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete material (admin only)
const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Calculate environmental impact
const calculateImpact = async (req, res) => {
  try {
    const { materials } = req.body;
    let totalImpact = {
      co2Reduced: 0,
      waterSaved: 0,
      treesSaved: 0,
      energySaved: 0,
      totalValue: 0
    };

    for (const item of materials) {
      const material = await Material.findById(item.materialId);
      if (!material) {
        return res.status(404).json({ message: `Material ${item.materialId} not found` });
      }

      const quantity = item.quantity;
      totalImpact.co2Reduced += quantity * material.environmentalImpact.co2Reduced;
      totalImpact.waterSaved += quantity * material.environmentalImpact.waterSaved;
      totalImpact.treesSaved += quantity * material.environmentalImpact.treesSaved;
      totalImpact.energySaved += quantity * material.environmentalImpact.energySaved;
      totalImpact.totalValue += quantity * material.pricePerKg;
    }

    res.json(totalImpact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  calculateImpact
}; 