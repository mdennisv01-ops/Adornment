const asyncHandler = require('../../utils/asyncHandler');
const inventoryService = require('./inventory.service');

const restock = asyncHandler(async (req, res) => {
  const variant = await inventoryService.restock({ ...req.body, staffId: req.user.sub });
  res.status(201).json({ success: true, data: variant });
});

const adjustStock = asyncHandler(async (req, res) => {
  const variant = await inventoryService.adjustStock({ ...req.body, staffId: req.user.sub });
  res.status(201).json({ success: true, data: variant });
});

const listMovements = asyncHandler(async (req, res) => {
  const result = await inventoryService.listMovements(req.query);
  res.json({ success: true, data: result });
});

const lowStock = asyncHandler(async (req, res) => {
  const rows = await inventoryService.lowStockReport();
  res.json({ success: true, data: rows });
});

module.exports = { restock, adjustStock, listMovements, lowStock };
