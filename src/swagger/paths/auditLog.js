/**
 * @swagger
 * tags:
 *   name: AuditLog
 *   description: Журнал аудиту (admin only). TTL беруть з SystemSettings.retention.auditLogDays (default 90 днів).
 */

/**
 * @swagger
 * /admin/audit-log:
 *   get:
 *     summary: Список подій аудиту з фільтрами та пагінацією
 *     description: |
 *       Повертає записи AuditLog. Автоматичне видалення старших за `SystemSettings.retention.auditLogDays`
 *       відбувається MongoDB TTL-індексом; значення `auditLogDays` можна змінити через `PATCH /system-settings`,
 *       після чого сервер пересоздає індекс без рестарту.
 *     tags: [AuditLog]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: perPage
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *       - in: query
 *         name: actorId
 *         schema: { type: string }
 *       - in: query
 *         name: actorRole
 *         schema:
 *           type: string
 *           enum: [operator, admin, manager, maintenanceWorker, safety, system]
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           description: Точне значення з enum AUDIT_ACTIONS (напр. fault.statusChange)
 *       - in: query
 *         name: targetType
 *         schema:
 *           type: string
 *           enum: [User, Plant, PartPlant, Fault, Comment, SystemSettings, Session, Message]
 *       - in: query
 *         name: targetId
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [createdAt, -createdAt]
 *           default: -createdAt
 *     responses:
 *       200:
 *         description: Сторінка журналу
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuditLogList'
 *       400:
 *         description: Невалідні query-параметри
 *       401:
 *         description: Не авторизований
 *       403:
 *         description: Недостатньо прав (не admin)
 *
 * /admin/audit-log/{id}:
 *   get:
 *     summary: Один запис аудиту
 *     tags: [AuditLog]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Запис
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuditLog'
 *       401:
 *         description: Не авторизований
 *       403:
 *         description: Недостатньо прав (не admin)
 *       404:
 *         description: Запис не знайдено
 */
