import { Router } from 'express';
import { celebrate } from 'celebrate';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';
import {
  createFaultSchema,
  getAllFaultSchema,
  getFaultByIdSchema,
} from '../validations/faultValidation.js';
import {
  createCommentSchema,
  getCommentsSchema,
} from '../validations/commentValidation.js';
import { upload } from '../middleware/multer.js';
import {
  createFault,
  getAllFault,
  getFaultById,
} from '../controllers/faultController.js';
import {
  createComment,
  getCommentsByFaultId,
} from '../controllers/commentController.js';

const router = Router();

router.use('/faults', authenticate);

router.post(
  '/faults',
  upload.array('img', 5),
  celebrate(createFaultSchema),
  createFault,
);

router.get('/faults', celebrate(getAllFaultSchema), getAllFault);

router.get('/faults/:faultId', celebrate(getFaultByIdSchema), getFaultById);

router.post(
  '/faults/:faultId/comments',
  authorizeRoles('safety', 'manager', 'maintenanceWorker', 'admin'),
  celebrate(createCommentSchema),
  createComment,
);

router.get(
  '/faults/:faultId/comments',
  celebrate(getCommentsSchema),
  getCommentsByFaultId,
);

export default router;
