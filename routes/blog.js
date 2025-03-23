const express = require('express');
const router = express.Router();
const Blog = require('../models/blogModel');
const User = require('../models/userModel');
const BlogStats = require('../models/blogStatsModel');
const { slugify, generateUniqueSlug } = require('../utils/slugify');
const { htmlToPlainText, htmlToMobileFormat } = require('../utils/htmlConverter');

// Middleware to check if user is authenticated and is admin
const isAdmin = async (req, res, next) => {
  try {
    const userId = req.headers['userid'];
    if (!userId) {
      return res.status(401).json({ status: false, message: 'Không có quyền truy cập' });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ status: false, message: 'Bạn không có quyền thực hiện hành động này' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ status: false, message: 'Lỗi xác thực: ' + error.message });
  }
};

// Create a new blog post
router.post('/add', isAdmin, async (req, res) => {
  try {
    const { title, content, summary, category, coverImage, tags = [] } = req.body;

    if (!title || !content || !summary || !category || !coverImage) {
      return res.status(400).json({ status: false, message: 'Thiếu thông tin bắt buộc' });
    }

    // Generate slug from title
    const baseSlug = slugify(title);
    const slug = await generateUniqueSlug(baseSlug, async (slug) => {
      const existingBlog = await Blog.findOne({ slug });
      return !!existingBlog;
    });

    const newBlog = await Blog.create({
      title,
      slug,
      content, // Storing as HTML from CKEditor
      summary,
      category,
      coverImage,
      author: req.user._id,
      tags,
      isPublished: false,
    });

    res.status(201).json({ status: true, message: 'Tạo bài viết thành công', data: newBlog });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Lỗi tạo bài viết: ' + error.message });
  }
});

// Update a blog post
router.put('/update/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, summary, category, coverImage, tags, isPublished } = req.body;

    // Find the blog post
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ status: false, message: 'Không tìm thấy bài viết' });
    }

    // Check if title changed and generate new slug if needed
    let slug = blog.slug;
    if (title && title !== blog.title) {
      const baseSlug = slugify(title);
      slug = await generateUniqueSlug(baseSlug, async (s) => {
        const existingBlog = await Blog.findOne({ slug: s, _id: { $ne: id } });
        return !!existingBlog;
      });
    }

    // Update fields
    const updateData = {
      ...(title && { title }),
      ...(content && { content }),
      ...(summary && { summary }),
      ...(category && { category }),
      ...(coverImage && { coverImage }),
      ...(tags && { tags }),
      slug,
      updatedAt: Date.now()
    };

    // Handle publishing status change
    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
      
      // If publishing for the first time, set publishedAt
      if (isPublished && !blog.publishedAt) {
        updateData.publishedAt = Date.now();
      }
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    res.json({ status: true, message: 'Cập nhật bài viết thành công', data: updatedBlog });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Lỗi cập nhật bài viết: ' + error.message });
  }
});

// Delete a blog post
router.delete('/delete/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedBlog = await Blog.findByIdAndDelete(id);
    
    if (!deletedBlog) {
      return res.status(404).json({ status: false, message: 'Không tìm thấy bài viết' });
    }
    
    res.json({ status: true, message: 'Đã xóa bài viết thành công' });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Lỗi xóa bài viết: ' + error.message });
  }
});

// Get all blog posts (admin)
router.get('/admin/all', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    
    const query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const totalBlogs = await Blog.countDocuments(query);
    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('author', 'name email');
      
    res.json({
      status: true,
      data: blogs,
      pagination: {
        total: totalBlogs,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalBlogs / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Lỗi lấy danh sách bài viết: ' + error.message });
  }
});

// Get blog by ID (admin)
router.get('/admin/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const blog = await Blog.findById(id).populate('author', 'name email');
    
    if (!blog) {
      return res.status(404).json({ status: false, message: 'Không tìm thấy bài viết' });
    }
    
    res.json({ status: true, data: blog });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Lỗi lấy thông tin bài viết: ' + error.message });
  }
});

// Public API - Get published blog posts for client app
router.get('/public', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, format = 'html' } = req.query;
    
    const query = { isPublished: true };
    
    if (category) {
      query.category = category;
    }
    
    const totalBlogs = await Blog.countDocuments(query);
    let blogs = await Blog.find(query)
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('author', 'name');

    // Convert content format if needed
    if (format === 'mobile') {
      blogs = blogs.map(blog => {
        const blogObj = blog.toObject();
        blogObj.content = htmlToMobileFormat(blog.content);
        return blogObj;
      });
    } else if (format === 'text') {
      blogs = blogs.map(blog => {
        const blogObj = blog.toObject();
        blogObj.content = htmlToPlainText(blog.content);
        return blogObj;
      });
    }
      
    res.json({
      status: true,
      data: blogs,
      pagination: {
        total: totalBlogs,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalBlogs / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Lỗi lấy danh sách bài viết: ' + error.message });
  }
});

// Public API - Get blog by slug
router.get('/public/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { format = 'html' } = req.query;
    
    const blog = await Blog.findOne({ slug, isPublished: true })
      .populate('author', 'name');
    
    if (!blog) {
      return res.status(404).json({ status: false, message: 'Không tìm thấy bài viết' });
    }
    
    // Track view
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Get or create stats record
    let stats = await BlogStats.findOne({ blogId: blog._id });
    if (!stats) {
      stats = await BlogStats.create({
        blogId: blog._id,
        views: 0,
        uniqueVisitors: 0,
        visitorIps: [],
        dayStats: []
      });
    }
    
    // Get today's date without time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Update view count
    stats.views += 1;
    stats.lastViewed = new Date();
    
    // Check if this IP is a new visitor
    const isNewVisitor = !stats.visitorIps.includes(ip);
    if (isNewVisitor && ip) {
      stats.visitorIps.push(ip);
      stats.uniqueVisitors += 1;
    }
    
    // Update day stats
    let dayStatIndex = stats.dayStats.findIndex(day => {
      const dayDate = new Date(day.date);
      return dayDate.getTime() === today.getTime();
    });
    
    if (dayStatIndex >= 0) {
      // Update existing day stats
      stats.dayStats[dayStatIndex].views += 1;
      if (isNewVisitor && ip) {
        stats.dayStats[dayStatIndex].uniqueVisitors += 1;
      }
    } else {
      // Create new day stats
      stats.dayStats.push({
        date: today,
        views: 1,
        uniqueVisitors: isNewVisitor && ip ? 1 : 0
      });
    }
    
    await stats.save();
    
    // Convert content based on requested format
    
    let blogData = blog.toObject();
    blogData.views = stats.views;
    if (format === 'mobile') {
      blogData.content = htmlToMobileFormat(blog.content);
    } else if (format === 'text') {
      blogData.content = htmlToPlainText(blog.content);
    }
    
    res.json({ status: true, data: blogData });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Lỗi lấy thông tin bài viết: ' + error.message });
  }
});

// Get related blog posts
router.get('/public/:slug/related', async (req, res) => {
  try {
    const { slug } = req.params;
    const { limit = 3, format = 'html' } = req.query;
    
    // Find the current blog post
    const currentBlog = await Blog.findOne({ slug, isPublished: true });
    
    if (!currentBlog) {
      return res.status(404).json({ status: false, message: 'Không tìm thấy bài viết' });
    }
    
    // Find related posts based on category and tags
    const relatedBlogs = await Blog.find({
      _id: { $ne: currentBlog._id },
      isPublished: true,
      $or: [
        { category: currentBlog.category },
        { tags: { $in: currentBlog.tags } }
      ]
    })
    .sort({ publishedAt: -1 })
    .limit(parseInt(limit))
    .populate('author', 'name');
    
    // Convert content based on requested format
    let blogData = relatedBlogs.map(blog => {
      const blogObj = blog.toObject();
      
      if (format === 'mobile') {
        blogObj.content = htmlToMobileFormat(blog.content);
      } else if (format === 'text') {
        blogObj.content = htmlToPlainText(blog.content);
      }
      
      return blogObj;
    });
    
    res.json({ status: true, data: blogData });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Lỗi lấy bài viết liên quan: ' + error.message });
  }
});

// Get blog statistics (admin only)
router.get('/admin/stats/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify blog exists
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ status: false, message: 'Không tìm thấy bài viết' });
    }
    
    // Get stats
    const stats = await BlogStats.findOne({ blogId: id });
    if (!stats) {
      return res.json({ 
        status: true, 
        data: {
          views: 0,
          uniqueVisitors: 0,
          lastViewed: null,
          dayStats: []
        } 
      });
    }
    
    res.json({ status: true, data: stats });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Lỗi lấy thống kê bài viết: ' + error.message });
  }
});

// Get overall blog statistics (admin only)
router.get('/admin/stats', isAdmin, async (req, res) => {
  try {
    // Get top viewed blogs
    const topBlogs = await BlogStats.find()
      .sort({ views: -1 })
      .limit(5)
      .populate({
        path: 'blogId',
        select: 'title slug category'
      });
    
    // Get total views across all blogs
    const allStats = await BlogStats.find();
    const totalViews = allStats.reduce((sum, stat) => sum + stat.views, 0);
    const totalUniqueVisitors = allStats.reduce((sum, stat) => sum + stat.uniqueVisitors, 0);
    
    // Get views by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const viewsByDay = {};
    
    // Initialize all days with 0 views
    for (let i = 0; i < 30; i++) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      viewsByDay[day.toISOString().split('T')[0]] = 0;
    }
    
    // Add views for each day from stats
    allStats.forEach(stat => {
      stat.dayStats.forEach(dayStat => {
        const day = new Date(dayStat.date);
        if (day >= thirtyDaysAgo) {
          const dayStr = day.toISOString().split('T')[0];
          viewsByDay[dayStr] = (viewsByDay[dayStr] || 0) + dayStat.views;
        }
      });
    });
    
    // Convert to array for easier processing in frontend
    const dailyViewsArray = Object.entries(viewsByDay).map(([date, views]) => ({
      date,
      views
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    res.json({
      status: true,
      data: {
        topBlogs,
        totalViews,
        totalUniqueVisitors,
        dailyViews: dailyViewsArray
      }
    });
  } catch (error) {
    res.status(500).json({ status: false, message: 'Lỗi lấy thống kê tổng hợp: ' + error.message });
  }
});

module.exports = router; 