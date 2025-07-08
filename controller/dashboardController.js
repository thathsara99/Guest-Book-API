import User from '../model/User.js';
import Post from '../model/Post.js';
import CatchAsync from '../utils/CatchAsync.js';
import AppError from '../utils/AppError.js';

//dashboard Counts
const getDashboardStats = CatchAsync(async (req, res, next) => {
  /*
    #swagger.tags = ['Dashboard']
    #swagger.description = 'Get Dashboard Stats'
  */
  // Get today date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const totalUsers = await User.countDocuments();

  const totalPosts = await Post.countDocuments();

  const newPostsToday = await Post.countDocuments({
    createdAt: { $gte: today, $lt: tomorrow }
  });

  const postsWithNewComments = await Post.find({
    'comments.createdAt': { $gte: today, $lt: tomorrow }
  });

  let newCommentsToday = 0;
  postsWithNewComments.forEach(post => {
    post.comments.forEach(comment => {
      if (comment.createdAt >= today && comment.createdAt < tomorrow) {
        newCommentsToday++;
      }
    });
  });

  return res.status(200).send({
    message: 'Dashboard statistics fetched successfully.',
    data: {
      totalUsers,
      totalPosts,
      newPostsToday,
      newCommentsToday
    }
  });
}, 'DashboardController - getDashboardStats');

//all posts
const getAllPosts = CatchAsync(async (req, res, next) => {  
  /*
    #swagger.tags = ['Dashboard']
    #swagger.description = 'Get All Posts'
  */
  const posts = await Post.find()
    .select('-comments')
    .populate('uploadedBy', 'firstName lastName email')
    .sort({ createdAt: -1 });

  return res.status(200).send({
    message: 'All posts fetched successfully.',
    data: posts
  });
}, 'DashboardController - getAllPosts');

const getAllComments = CatchAsync(async (req, res, next) => {
  const posts = await Post.find()
    .populate('uploadedBy', 'firstName lastName')
    .populate('comments.user', 'firstName lastName')
    .sort({ createdAt: -1 });

  const allComments = [];
  posts.forEach(post => {
    post.comments.forEach(comment => {
      allComments.push({
        _id: comment._id,
        comment: comment.comment,
        status: comment.status,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: comment.user,
        postId: post._id,
        postDescription: post.description,
        postStatus: post.status,
        postUploadedBy: post.uploadedBy
      });
    });
  });

  // Sorting comments
  allComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res.status(200).send({
    message: 'All comments fetched successfully.',
    data: allComments
  });
}, 'DashboardController - getAllComments');

// Delete post
const deletePost = CatchAsync(async (req, res, next) => {
  /*
    #swagger.tags = ['Dashboard']
    #swagger.description = 'Delete Post'
  */
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) {
    return next(new AppError('Post not found.', 404));
  }

  await Post.findByIdAndDelete(postId);

  return res.status(200).send({
    message: 'Post deleted successfully.'
  });
}, 'DashboardController - deletePost');

// Delete a comment
const deleteComment = CatchAsync(async (req, res, next) => {        
  /*
    #swagger.tags = ['Dashboard']
    #swagger.description = 'Delete Comment'
  */
  const { postId, commentId } = req.params;

  const post = await Post.findById(postId);
  if (!post) {
    return next(new AppError('Post not found.', 404));
  }

  const commentIndex = post.comments.findIndex(comment => comment._id.toString() === commentId);
  if (commentIndex === -1) {
    return next(new AppError('Comment not found.', 404));
  }

  post.comments.splice(commentIndex, 1);
  await post.save();

  return res.status(200).send({
    message: 'Comment deleted successfully.'
  });
}, 'DashboardController - deleteComment');

// Update post status (approve/reject)
const updatePostStatus = CatchAsync(async (req, res, next) => {
  /*
    #swagger.tags = ['Dashboard']
    #swagger.description = 'Update Post Status'
  */
  const { postId } = req.params;
  const { status } = req.body;

  if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
    return next(new AppError('Invalid status. Must be Approved, Rejected, or Pending.', 400));
  }

  const post = await Post.findById(postId);
  if (!post) {
    return next(new AppError('Post not found.', 404));
  }

  post.status = status;
  await post.save();

  return res.status(200).send({
    message: `Post status updated to ${status} successfully.`,
    data: post
  });
}, 'DashboardController - updatePostStatus');

// Update comment status
const updateCommentStatus = CatchAsync(async (req, res, next) => {  
  /*
    #swagger.tags = ['Dashboard']
    #swagger.description = 'Update Comment Status'
  */
  const { postId, commentId } = req.params;
  const { status } = req.body;

  if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
    return next(new AppError('Invalid status. Must be Approved, Rejected, or Pending.', 400));
  }

  const post = await Post.findById(postId);
  if (!post) {
    return next(new AppError('Post not found.', 404));
  }

  const comment = post.comments.id(commentId);
  if (!comment) {
    return next(new AppError('Comment not found.', 404));
  }

  comment.status = status;
  await post.save();

  return res.status(200).send({
    message: `Comment status updated to ${status} successfully.`,
    data: comment
  });
}, 'DashboardController - updateCommentStatus');

const dashboardController = {
  getDashboardStats,
  getAllPosts,
  getAllComments,
  deletePost,
  deleteComment,
  updatePostStatus,
  updateCommentStatus
};

export default dashboardController;
