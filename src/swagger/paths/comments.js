/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Коментарі до заявок (faults)
 */

/**
 * @swagger
 * /faults/{faultId}/comments:
 *   post:
 *     summary: Додати коментар до заявки
 *     description: |
 *       Створює коментар, прив'язаний до Fault. Доступно ролям:
 *       `safety`, `manager`, `maintenanceWorker`, `admin`.
 *       Для `operator` — 403.
 *     tags: [Comments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: faultId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId заявки
 *         example: "65c12f8a9e1b2c0012a3b456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 example: "Перевірив вузол — потрібна заміна манжети."
 *     responses:
 *       201:
 *         description: Коментар створено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Помилка валідації (Celebrate) або невалідний faultId
 *       401:
 *         description: Не авторизований
 *       403:
 *         description: Недостатньо прав (наприклад, роль operator)
 *       404:
 *         description: Fault не знайдено
 *
 *   get:
 *     summary: Отримати список коментарів до заявки
 *     description: Повертає пагінований список коментарів. Доступно всім автентифікованим.
 *     tags: [Comments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: faultId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId заявки
 *         example: "65c12f8a9e1b2c0012a3b456"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *     responses:
 *       200:
 *         description: Список коментарів
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 perPage:
 *                   type: integer
 *                   example: 20
 *                 totalComments:
 *                   type: integer
 *                   example: 37
 *                 totalPage:
 *                   type: integer
 *                   example: 2
 *                 comments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Невалідний faultId або query-параметри
 *       401:
 *         description: Не авторизований
 *       404:
 *         description: Fault не знайдено
 */
