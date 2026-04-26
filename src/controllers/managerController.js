import { Fault } from '../models/fault.js';
import { User } from '../models/user.js';
import mongoose from 'mongoose';
import { emitFaultUpdated } from '../socket/emitters.js';
import { sendAssignmentEmail } from '../services/email/index.js';
import { USER_STATUS } from '../constants/status.js';

export const addFault = async (req, res) => {
  try {
    const {
      faultId: documentId,
      priority,
      assignedMaintainers,
      plannedDate,
      plannedTime,
      deadline,
      estimatedDuration,
      managerComment,
      typeFault,
    } = req.body;

    const managerId = req.user?._id;
    const managerName = req.user?.name || 'Менеджер';

    const maintainerObjectIds = assignedMaintainers.map((id) =>
      mongoose.Types.ObjectId.createFromHexString(id.trim()),
    );
    const overlappingFault = await Fault.findOne({
      _id: { $ne: documentId },
      plannedDate: plannedDate,
      plannedTime: plannedTime,
      assignedMaintainers: { $in: maintainerObjectIds },
    });

    if (overlappingFault) {
      return res.status(409).json({
        message: `Один із майстрів уже зайнятий на цей час (${plannedDate} ${plannedTime})`,
      });
    }

    const workers = await User.find({
      _id: { $in: assignedMaintainers },
      role: 'maintenanceWorker',
    });

    if (workers.length !== assignedMaintainers.length) {
      return res.status(400).json({
        message: 'Один або кілька вибраних користівачів не є монтерами',
      });
    }

    const fault = await Fault.findById(documentId);

    if (!fault) {
      return res.status(404).json({ message: 'Несправність не знайдена' });
    }

    const updateData = {
      priority,
      assignedMaintainers,
      plannedDate,
      plannedTime,
      deadline,
      estimatedDuration,
      managerComment,
      managerId,
      typeFault,
    };

    fault.history.push({
      action: 'updated_by_manager',
      userId: managerId,
      userName: managerName,
      changes: updateData,
      timestamp: new Date(),
    });

    Object.assign(fault, updateData);

    await fault.save();

    await fault.populate('assignedMaintainers', 'name');
    await fault.populate({ path: 'plantId', select: 'namePlant code' });
    await fault.populate({ path: 'partId', select: 'namePlantPart codePlantPart' });

    emitFaultUpdated(fault);

    setImmediate(async () => {
      try {
        const recipients = await User.find({
          _id: { $in: assignedMaintainers },
          status: USER_STATUS.ACTIVE,
        })
          .select('email fullName')
          .lean();
        await sendAssignmentEmail(fault, recipients);
      } catch (err) {
        console.error('[email] post-assignment dispatch failed', err.message);
      }
    });

    return res.status(200).json(fault);
  } catch (error) {
    return res.status(500).json({
      message: 'Помилка при оновленні несправності менеджером',
      error: error.message,
    });
  }
};
