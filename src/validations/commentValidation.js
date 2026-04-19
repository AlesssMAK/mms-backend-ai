import { Joi, Segments } from 'celebrate';
import { isValidObjectId } from 'mongoose';

const objectIdValidator = (value, helpers) => {
  return !isValidObjectId(value) ? helpers.message('Invalid id format') : value;
};

export const createCommentSchema = {
  [Segments.PARAMS]: Joi.object({
    faultId: Joi.string().custom(objectIdValidator).required(),
  }),
  [Segments.BODY]: Joi.object({
    content: Joi.string().trim().min(1).max(2000).required(),
  }),
};

export const getCommentsSchema = {
  [Segments.PARAMS]: Joi.object({
    faultId: Joi.string().custom(objectIdValidator).required(),
  }),
  [Segments.QUERY]: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).max(50).default(20),
  }),
};
