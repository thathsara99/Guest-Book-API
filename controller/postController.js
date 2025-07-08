import Post from '../model/Post.js';
import AppError from '../utils/AppError.js';
import CatchAsync from '../utils/CatchAsync.js';
import multer from 'multer';
import fs from 'fs';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed.', 400), false);
    }
  },
});

// Publish a new post
const publishPost = CatchAsync(async (req, res, next) => {
  const { description } = req.body;
  const userId = req.decodedToken.userId;

  if (!req.file) {
    return next(new AppError('Image is required.', 400));
  }

  if (!description) {
    return next(new AppError('Description is required.', 400));
  }

  // Convert uploaded image to base64
  const imageBuffer = req.file.buffer;
  const mimeType = req.file.mimetype;
  const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

  const post = await Post.create({
    image: base64Image,
    description,
    uploadedBy: userId,
    comments: []
  });

  return res.status(201).send({ message: 'Post published successfully.', data: post });
}, 'PostController - publishPost');

// Add a comment to a post
const addComment = CatchAsync(async (req, res, next) => {
  const { postId } = req.params;
  const { comment } = req.body;
  const userId = req.decodedToken.userId;

  if (!comment) {
    return next(new AppError('Comment is required.', 400));
  }

  const post = await Post.findById(postId);
  if (!post) {
    return next(new AppError('Post not found.', 404));
  }

  post.comments.push({ user: userId, comment });
  await post.save();

  return res.status(201).send({ message: 'Comment added successfully.', data: post });
}, 'PostController - addComment');

// Get approved posts with user details
const getApprovedPosts = CatchAsync(async (req, res, next) => {
  const posts = await Post.find({ status: 'Approved' })
    .populate('uploadedBy', 'firstName lastName')
    .populate('comments.user', 'firstName lastName')
    .sort({ createdAt: -1 });

  // Filter out non-approved comments
  const postsWithApprovedComments = posts.map(post => {
    const postObj = post.toObject();
    postObj.comments = postObj.comments.filter(comment => comment.status === 'Approved');
    return postObj;
  });

  return res.status(200).send({
    message: 'Approved posts fetched successfully.',
    data: postsWithApprovedComments
  });
}, 'PostController - getApprovedPosts');

const postController = {
  publishPost,
  addComment,
  getApprovedPosts,
  upload
};
export default postController;
