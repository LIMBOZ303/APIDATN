const express = require('express');
const router = express.Router();
const moment = require('moment');
const mongoose = require('mongoose'); // Thêm mongoose để sử dụng Types.ObjectId
const Transaction = require('../models/transactionModel');

// Hàm lấy thống kê giao dịch
async function getTransactionStats() {
  try {
    const statsByStatus = await Transaction.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalDeposit: { $sum: '$depositAmount' } } },
      { $sort: { _id: 1 } },
    ]);

    const totalDepositAll = await Transaction.aggregate([
      { $group: { _id: null, totalDeposit: { $sum: '$depositAmount' } } },
    ]);

    const statsByUser = await Transaction.aggregate([
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
          totalDeposit: { $sum: '$depositAmount' },
          statuses: { $push: '$status' },
        },
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          userId: '$_id',
          username: '$userInfo.username',
          count: 1,
          totalDeposit: 1,
          statuses: 1,
          _id: 0,
        },
      },
      { $sort: { totalDeposit: -1 } },
    ]);

    return {
      byStatus: statsByStatus,
      totalDeposit: totalDepositAll[0]?.totalDeposit || 0,
      byUser: statsByUser,
    };
  } catch (error) {
    throw new Error('Error fetching transaction stats: ' + error.message);
  }
}

// API endpoint: Lấy thống kê giao dịch
router.get('/transaction-stats', async (req, res) => {
  try {
    const stats = await getTransactionStats();
    res.status(200).json({
      success: true,
      data: {
        byStatus: stats.byStatus,
        totalDeposit: stats.totalDeposit,
        byUser: stats.byUser,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint: Lấy thống kê theo trạng thái cụ thể
router.get('/transaction-stats/by-status/:status', async (req, res) => {
  const { status } = req.params;
  const validStatuses = ['Chưa kích hoạt', 'Đang chờ', 'Đã kích hoạt'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be one of: Chưa kích hoạt, Đang chờ, Đã kích hoạt',
    });
  }

  try {
    const stats = await Transaction.aggregate([
      { $match: { status } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalDeposit: { $sum: '$depositAmount' } } },
    ]);
    res.status(200).json({
      success: true,
      data: stats[0] || { status, count: 0, totalDeposit: 0 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint: Lấy thống kê theo userId
router.get('/transaction-stats/by-user/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: 'Invalid userId format' });
  }

  try {
    const stats = await Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
          totalDeposit: { $sum: '$depositAmount' },
          statuses: { $push: '$status' },
        },
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          userId: '$_id',
          username: '$userInfo.username',
          count: 1,
          totalDeposit: 1,
          statuses: 1,
          _id: 0,
        },
      },
    ]);
    res.status(200).json({
      success: true,
      data: stats[0] || { userId, count: 0, totalDeposit: 0, statuses: [] },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Hàm lấy tổng doanh thu theo tuần, quý, tháng, năm
async function getRevenueStats() {
  try {
    // 1. Tổng doanh thu theo tuần
    const revenueByWeek = await Transaction.aggregate([
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, week: { $isoWeek: '$createdAt' } },
          totalDeposit: { $sum: '$depositAmount' },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.week': -1 } },
    ]);

    // 2. Tổng doanh thu theo quý
    const revenueByQuarter = await Transaction.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            quarter: { $ceil: { $divide: [{ $month: '$createdAt' }, 3] } },
          },
          totalDeposit: { $sum: '$depositAmount' },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.quarter': -1 } },
    ]);

    // 3. Tổng doanh thu theo tháng
    const revenueByMonth = await Transaction.aggregate([
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          totalDeposit: { $sum: '$depositAmount' },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
    ]);

    // 4. Tổng doanh thu theo năm
    const revenueByYear = await Transaction.aggregate([
      {
        $group: {
          _id: { year: { $year: '$createdAt' } },
          totalDeposit: { $sum: '$depositAmount' },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1 } },
    ]);

    return {
      byWeek: revenueByWeek,
      byQuarter: revenueByQuarter,
      byMonth: revenueByMonth,
      byYear: revenueByYear,
    };
  } catch (error) {
    throw new Error('Error fetching revenue stats: ' + error.message);
  }
}

// API endpoint: Lấy tổng doanh thu theo tuần, quý, tháng, năm
router.get('/revenue-stats', async (req, res) => {
  try {
    const stats = await getRevenueStats();
    res.status(200).json({
      success: true,
      data: {
        byWeek: stats.byWeek,
        byQuarter: stats.byQuarter,
        byMonth: stats.byMonth,
        byYear: stats.byYear,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint: Lấy doanh thu theo năm cụ thể
router.get('/revenue-stats/by-year/:year', async (req, res) => {
  const { year } = req.params;
  const yearNum = parseInt(year);
  if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear()) {
    return res.status(400).json({ success: false, message: 'Invalid year' });
  }

  try {
    const stats = await Transaction.aggregate([
      {
        $match: { createdAt: { $gte: new Date(`${yearNum}-01-01`), $lte: new Date(`${yearNum}-12-31`) } },
      },
      {
        $group: { _id: { year: { $year: '$createdAt' } }, totalDeposit: { $sum: '$depositAmount' }, transactionCount: { $sum: 1 } },
      },
    ]);
    res.status(200).json({
      success: true,
      data: stats[0] || { year: yearNum, totalDeposit: 0, transactionCount: 0 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint: Lấy doanh thu theo quý cụ thể trong năm
router.get('/revenue-stats/by-quarter/:year/:quarter', async (req, res) => {
  const { year, quarter } = req.params;
  const yearNum = parseInt(year);
  const quarterNum = parseInt(quarter);
  if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear()) {
    return res.status(400).json({ success: false, message: 'Invalid year' });
  }
  if (isNaN(quarterNum) || quarterNum < 1 || quarterNum > 4) {
    return res.status(400).json({ success: false, message: 'Invalid quarter. Must be between 1 and 4' });
  }

  try {
    const stats = await Transaction.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${yearNum}-${(quarterNum - 1) * 3 + 1}-01`),
            $lte: new Date(`${yearNum}-${quarterNum * 3}-31`),
          },
        },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, quarter: { $ceil: { $divide: [{ $month: '$createdAt' }, 3] } } },
          totalDeposit: { $sum: '$depositAmount' },
          transactionCount: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json({
      success: true,
      data: stats[0] || { year: yearNum, quarter: quarterNum, totalDeposit: 0, transactionCount: 0 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint: Lấy doanh thu theo tháng cụ thể trong năm
router.get('/revenue-stats/by-month/:year/:month', async (req, res) => {
  const { year, month } = req.params;
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);

  if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear()) {
    return res.status(400).json({ success: false, message: 'Invalid year' });
  }
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return res.status(400).json({ success: false, message: 'Invalid month. Must be between 1 and 12' });
  }

  try {
    const startOfMonth = moment(`${yearNum}-${monthNum}-01`, 'YYYY-MM-DD').startOf('month').toDate();
    const endOfMonth = moment(`${yearNum}-${monthNum}-01`, 'YYYY-MM-DD').endOf('month').toDate();

    const stats = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          totalDeposit: { $sum: '$depositAmount' },
          transactionCount: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || { year: yearNum, month: monthNum, totalDeposit: 0, transactionCount: 0 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint: Lấy doanh thu theo tuần cụ thể trong năm
router.get('/revenue-stats/by-week/:year/:week', async (req, res) => {
  const { year, week } = req.params;
  const yearNum = parseInt(year);
  const weekNum = parseInt(week);

  if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear()) {
    return res.status(400).json({ success: false, message: 'Invalid year' });
  }
  if (isNaN(weekNum) || weekNum < 1 || weekNum > 53) {
    return res.status(400).json({ success: false, message: 'Invalid week. Must be between 1 and 53' });
  }

  try {
    const stats = await Transaction.aggregate([
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $year: '$createdAt' }, yearNum] },
              { $eq: [{ $isoWeek: '$createdAt' }, weekNum] },
            ],
          },
        },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, week: { $isoWeek: '$createdAt' } },
          totalDeposit: { $sum: '$depositAmount' },
          transactionCount: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json({
      success: true,
      data: stats[0] || { year: yearNum, week: weekNum, totalDeposit: 0, transactionCount: 0 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;