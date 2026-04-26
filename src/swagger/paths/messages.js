/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: |
 *     Direct messages (user → user) and broadcasts (announcements). Operators
 *     cannot send/receive direct (shared inbox) but can read broadcasts.
 *     Broadcasts auto-expire after `SystemSettings.messaging.broadcastTtlDays`
 *     (default 30 days) via a Mongo TTL index on `expireAt`.
 */

/**
 * @swagger
 * /messages/direct:
 *   post:
 *     summary: Send a direct message to one recipient
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipientId, body]
 *             properties:
 *               recipientId: { type: string }
 *               subject: { type: string, maxLength: 200 }
 *               body: { type: string, minLength: 1, maxLength: 5000 }
 *     responses:
 *       201: { description: Created, content: { application/json: { schema: { $ref: '#/components/schemas/Message' } } } }
 *       400: { description: Invalid payload (e.g. self-recipient, inactive user) }
 *       401: { description: Not authenticated }
 *       403: { description: Operators cannot send direct messages }
 *       404: { description: Recipient not found }
 *
 * /messages/broadcast:
 *   post:
 *     summary: Send a broadcast announcement (to all or to a specific role)
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [target, body]
 *             properties:
 *               target:
 *                 type: string
 *                 enum: [all, role]
 *               targetRole:
 *                 type: string
 *                 enum: [operator, admin, manager, maintenanceWorker, safety]
 *                 description: Required when target=role
 *               subject: { type: string, maxLength: 200 }
 *               body: { type: string, minLength: 1, maxLength: 5000 }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Invalid payload }
 *       401: { description: Not authenticated }
 *
 * /messages/inbox:
 *   get:
 *     summary: List direct messages (inbox / sent / all)
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: box
 *         schema: { type: string, enum: [inbox, sent, all], default: inbox }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: perPage
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 20 }
 *       - in: query
 *         name: unreadOnly
 *         schema: { type: boolean, default: false }
 *     responses:
 *       200:
 *         description: Page of direct messages
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MessageList' }
 *       403: { description: Operators do not have a direct inbox }
 *
 * /messages/announcements:
 *   get:
 *     summary: List broadcast announcements visible to the current user
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: perPage
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 20 }
 *       - in: query
 *         name: unreadOnly
 *         schema: { type: boolean, default: false }
 *     responses:
 *       200:
 *         description: Page of announcements
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MessageList' }
 *
 * /messages/unread-count:
 *   get:
 *     summary: Unread badges for inbox + announcements
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Unread counts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 direct: { type: integer, example: 3 }
 *                 announcements: { type: integer, example: 1 }
 *
 * /messages/{id}/read:
 *   patch:
 *     summary: Mark a message as read by the current user (idempotent)
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated message, content: { application/json: { schema: { $ref: '#/components/schemas/Message' } } } }
 *       403: { description: Not addressed to the current user }
 *       404: { description: Not found }
 *
 * /messages/{id}:
 *   delete:
 *     summary: Delete a message (author or admin only)
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Deleted }
 *       403: { description: Not author and not admin }
 *       404: { description: Not found }
 */
