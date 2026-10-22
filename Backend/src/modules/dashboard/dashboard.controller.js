const asyncHandler = require('../../utils/asyncHandler');
const dashboardService = require('./dashboard.service');

const getOverview = asyncHandler(async (req, res) => {
  const overview = await dashboardService.getOverview();
  res.json({ success: true, data: overview });
});

module.exports = { getOverview };
