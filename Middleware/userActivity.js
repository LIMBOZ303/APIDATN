const User = require('../models/userModel');

/**
 * Middleware theo dõi hoạt động của người dùng
 * Cập nhật thời gian hoạt động cuối cùng mỗi khi người dùng thực hiện request
 */
const trackUserActivity = async (req, res, next) => {
  try {
    // Kiểm tra nếu có userId trong request (từ authentication middleware)
    if (req.headers['user-id']) {
      const userId = req.headers['user-id'];
      
      // Cập nhật thời gian hoạt động cuối cùng
      await User.findByIdAndUpdate(userId, {
        lastActive: new Date()
      });
    }
    
    // Tiếp tục xử lý request
    next();
  } catch (error) {
    console.error('Lỗi khi cập nhật thời gian hoạt động:', error);
    next(); // Vẫn cho phép request tiếp tục ngay cả khi có lỗi
  }
};

/**
 * Đánh dấu người dùng offline sau khoảng thời gian không hoạt động
 * Được thiết kế để chạy định kỳ bằng scheduler
 * @param {number} inactiveTimeLimit - Thời gian giới hạn không hoạt động (tính bằng phút)
 */
const markInactiveUsers = async (inactiveTimeLimit = 15) => {
  try {
    const timeLimit = new Date();
    timeLimit.setMinutes(timeLimit.getMinutes() - inactiveTimeLimit);
    
    // Tìm và cập nhật người dùng chưa hoạt động quá thời gian giới hạn và vẫn đang online
    const result = await User.updateMany(
      { 
        isOnline: true, 
        lastActive: { $lt: timeLimit } 
      },
      { 
        isOnline: false 
      }
    );
    
    console.log(`Đã đánh dấu ${result.modifiedCount} người dùng không hoạt động là offline.`);
    return result.modifiedCount;
  } catch (error) {
    console.error('Lỗi khi đánh dấu người dùng không hoạt động:', error);
    return 0;
  }
};

module.exports = {
  trackUserActivity,
  markInactiveUsers
}; 