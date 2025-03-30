/**
 * Scheduler để kiểm tra và đánh dấu người dùng không hoạt động
 */

const { markInactiveUsers } = require('../Middleware/userActivity');

// Thời gian kiểm tra hoạt động (tính bằng phút)
const INACTIVE_TIME_LIMIT = 15; // 15 phút không hoạt động

// Thời gian giữa các lần chạy scheduler (tính bằng mili giây)
const CHECK_INTERVAL = 5 * 60 * 1000; // Chạy mỗi 5 phút

/**
 * Hàm khởi tạo scheduler
 */
function initUserActivityScheduler() {
  console.log('Khởi tạo scheduler kiểm tra hoạt động người dùng');
  
  // Chạy ngay lần đầu tiên
  checkInactiveUsers();
  
  // Lập lịch chạy định kỳ
  setInterval(checkInactiveUsers, CHECK_INTERVAL);
}

/**
 * Hàm kiểm tra người dùng không hoạt động
 */
async function checkInactiveUsers() {
  console.log(`Đang kiểm tra người dùng không hoạt động (thời gian giới hạn: ${INACTIVE_TIME_LIMIT} phút)...`);
  
  const markedCount = await markInactiveUsers(INACTIVE_TIME_LIMIT);
  
  console.log(`Hoàn tất kiểm tra: ${markedCount} người dùng đã được đánh dấu là offline.`);
}

module.exports = {
  initUserActivityScheduler
}; 