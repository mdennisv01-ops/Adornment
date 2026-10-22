const { Order, Product, AiTryOnJob } = require('../../models');
const inventoryService = require('../inventory/inventory.service');

/**
 * Aggregates the numbers dashboard.html shows at a glance: revenue,
 * order counts by status, low-stock alerts, and recent orders for the
 * "quick view" pending-orders panel.
 */
async function getOverview() {
  const [revenueAgg, statusCounts, lowStock, recentOrders, productCount, aiJobCounts] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $in: ['PAID', 'FULFILLED', 'SHIPPED', 'DELIVERED'] } } },
      { $group: { _id: null, total: { $sum: { $toDouble: '$total' } }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    inventoryService.lowStockReport(),
    Order.find().sort({ createdAt: -1 }).limit(5).populate('customer', 'username'),
    Product.countDocuments(),
    AiTryOnJob.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const statusMap = Object.fromEntries(statusCounts.map((s) => [s._id, s.count]));
  const aiJobMap = Object.fromEntries(aiJobCounts.map((s) => [s._id, s.count]));

  return {
    revenue: revenueAgg[0]?.total || 0,
    completedOrderCount: revenueAgg[0]?.count || 0,
    ordersByStatus: statusMap,
    pendingOrderCount: statusMap.PENDING || 0,
    lowStockCount: lowStock.length,
    lowStockItems: lowStock.slice(0, 10),
    productCount,
    recentOrders,
    aiJobsByStatus: aiJobMap,
  };
}

module.exports = { getOverview };
