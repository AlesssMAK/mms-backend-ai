/**
 * @swagger
 * tags:
 *   name: SystemSettings
 *   description: Глобальні налаштування системи (singleton)
 */

/**
 * @swagger
 * /system-settings:
 *   get:
 *     summary: Публічні налаштування (робочі години, слоти, вихідні)
 *     description: |
 *       Повертає поля, потрібні фронту для побудови слот-гріду та календаря.
 *       Доступно всім автентифікованим користувачам.
 *       Не містить email-конфігурації та інших чутливих полів — для них див. `/system-settings/full` (admin).
 *     tags: [SystemSettings]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Публічні налаштування
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SystemSettingsPublic'
 *       401:
 *         description: Не авторизований
 *
 *   patch:
 *     summary: Оновити налаштування (admin only)
 *     description: |
 *       Часткове оновлення будь-яких полів. Після успішного оновлення інвалідується in-memory кеш
 *       сервісу SystemSettings, тож наступні виклики `getSettings()` читатимуть свіжі дані з БД.
 *     tags: [SystemSettings]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SystemSettingsUpdate'
 *     responses:
 *       200:
 *         description: Оновлений документ налаштувань
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SystemSettings'
 *       400:
 *         description: Помилка валідації (Celebrate/Joi або pre-validate)
 *       401:
 *         description: Не авторизований
 *       403:
 *         description: Недостатньо прав (не admin)
 *       404:
 *         description: Singleton не ініціалізовано
 *
 * /system-settings/full:
 *   get:
 *     summary: Повні налаштування (admin only)
 *     description: Повертає документ SystemSettings повністю, включно з email/retention/messaging.
 *     tags: [SystemSettings]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Повні налаштування
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SystemSettings'
 *       401:
 *         description: Не авторизований
 *       403:
 *         description: Недостатньо прав (не admin)
 */
