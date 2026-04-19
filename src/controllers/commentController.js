import createHttpError from 'http-errors';
import { Comment } from '../models/comment.js';
import { Fault } from '../models/fault.js';

export const createComment = async (req, res) => {
  const { faultId } = req.params;
  const { content } = req.body;

  const fault = await Fault.findById(faultId);
  if (!fault) {
    throw createHttpError(404, 'Fault not found');
  }

  const comment = await Comment.create({
    faultId,
    authorId: req.user._id,
    authorRole: req.user.role,
    content,
  });

  const populated = await Comment.findById(comment._id).populate({
    path: 'authorId',
    select: 'name lastname role',
  });

  return res.status(201).json(populated);
};

export const getCommentsByFaultId = async (req, res) => {
  const { faultId } = req.params;
  const { page, perPage } = req.query;

  const faultExists = await Fault.exists({ _id: faultId });
  if (!faultExists) {
    throw createHttpError(404, 'Fault not found');
  }

  const skip = (page - 1) * perPage;

  const [totalComments, comments] = await Promise.all([
    Comment.countDocuments({ faultId }),
    Comment.find({ faultId })
      .populate({ path: 'authorId', select: 'name lastname role' })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(perPage)
      .lean(),
  ]);

  const totalPage = Math.ceil(totalComments / perPage);

  res.status(200).json({
    page,
    perPage,
    totalComments,
    totalPage,
    comments,
  });
};
