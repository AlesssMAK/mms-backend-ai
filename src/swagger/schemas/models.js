/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - lastname
 *         - email
 *         - phone
 *         - password
 *         - role
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated user ID
 *           example: 64f0c2a9b9a1c2a1a1234567
 *         name:
 *           type: string
 *           description: User's first name
 *           example: John
 *         lastname:
 *           type: string
 *           description: User's last name
 *           example: Doe
 *         email:
 *           type: string
 *           format: email
 *           description: Unique email address
 *           example: john.doe@example.it
 *         phone:
 *           type: string
 *           description: Phone number in Italian format (+39XXXXXXXXXX)
 *           example: "+391234567890"
 *         city:
 *           type: string
 *           default: ""
 *           example: Rome
 *         avatar:
 *           type: string
 *           default: ""
 *           description: URL or string for avatar
 *           example: https://res.cloudinary.com/demo/image.jpg
 *         role:
 *           type: string
 *           enum:
 *             - operator
 *             - admin
 *             - manager
 *             - maintenanceWorker
 *             - safety
 *           default: operator
 *           description: User access level
 *           example: operator
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-02-09T12:00:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2026-02-09T12:00:00Z
 *
 *     Plant:
 *       type: object
 *       required:
 *         - namePlant
 *         - code
 *         - location
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated plant ID
 *           example: 65a1b2c3d4e5f6a7b8c9d0e1
 *         namePlant:
 *           type: string
 *           description: The name of the industrial plant
 *           example: Central Power Station
 *         code:
 *           type: string
 *           description: Unique plant code
 *           example: CPS-01
 *         location:
 *           type: string
 *           description: Geographical or physical location
 *           example: Milan, Sector B
 *         description:
 *           type: string
 *           description: Detailed plant description
 *           example: Main power generation facility for the northern region.
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     PartPlant:
 *       type: object
 *       required:
 *         - plantId
 *         - namePartPlant
 *         - codePartPlant
 *         - location
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated part plant ID
 *           example: 65b2c3d4e5f6a7b8c9d0e1f2
 *         plantId:
 *           type: string
 *           description: Reference to the Plant ID
 *           example: 65a1b2c3d4e5f6a7b8c9d0e1
 *         namePartPlant:
 *           type: string
 *           minLength: 4
 *           description: Name of the specific plant part/sector
 *           example: Cooling Tower A
 *         codePartPlant:
 *           type: string
 *           minLength: 4
 *           description: Unique code for the part
 *           example: CTA-55
 *         location:
 *           type: string
 *           minLength: 4
 *           description: Specific location within the plant
 *           example: North Wing, Level 2
 *         description:
 *           type: string
 *           nullable: true
 *           description: Optional description of the plant part
 *           example: Primary cooling system for turbine 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Fault:
 *       type: object
 *       description: Модель несправності обладнання
 *       properties:
 *         _id:
 *           type: string
 *           example: "65c12f8a9e1b2c0012a3b456"
 *         id_fault:
 *           type: string
 *           description: Унікальний ідентифікатор несправності
 *           example: "FAULT-2024-001"
 *         nameOperator:
 *           type: string
 *           description: Імʼя оператора, який зареєстрував несправність
 *           example: "Ivan Ivanov"
 *         userId:
 *           type: string
 *           description: ID оператора
 *           example: "65c12f8a9e1b2c0012a3b111"
 *         dataCreated:
 *           type: string
 *           description: Дата створення
 *           example: "2024-02-10"
 *         timeCreated:
 *           type: string
 *           description: Час створення
 *           example: "14:32"
 *         plantId:
 *           type: string
 *           description: ID обладнання (Plant)
 *           example: "64b1a2..."
 *         partId:
 *           type: string
 *           description: ID деталі обладнання (PartPlant)
 *           example: "64b1f5..."
 *         typeFault:
 *           type: string
 *           enum: [Produzione, Qualità, Manutenzione, Sicurezza]
 *           description: Тип несправності
 *           example: "Produzione"
 *         comment:
 *           type: string
 *           description: Опис проблеми
 *           example: "Не спрацьовує датчик тиску на основному валу"
 *         img:
 *           type: string
 *           description: Посилання на фото несправності
 *           example: "https://example.com/uploads/fault.jpg"
 *         priority:
 *           type: string
 *           enum: [Bassa, Media, Alta]
 *           description: Пріоритет виконання
 *           example: "Media"
 *         assignedMaintainers:
 *           type: array
 *           description: Список ID призначених монтерів
 *           items:
 *             type: string
 *         managerComment:
 *           type: string
 *           description: Коментар менеджера
 *           example: "Терміново перевірити вузол"
 *         deadline:
 *           type: string
 *           description: Дедлайн
 *           example: "2024-02-15"
 *         plannedDate:
 *           type: string
 *           description: Запланована дата
 *           example: "2024-02-12"
 *         plannedTime:
 *           type: string
 *           description: Запланований час
 *           example: "10:30"
 *         estimatedDuration:
 *           type: number
 *           description: Орієнтовна тривалість робіт (хв)
 *           example: 60
 *         managerId:
 *           type: string
 *           description: ID менеджера
 *           example: "65c12f8a9e1b2c0012a3b777"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Comment:
 *       type: object
 *       description: Коментар до заявки (Fault)
 *       required:
 *         - faultId
 *         - authorId
 *         - authorRole
 *         - content
 *       properties:
 *         _id:
 *           type: string
 *           example: "65d4f2a1b9a1c2a1a1234567"
 *         faultId:
 *           type: string
 *           description: ObjectId заявки
 *           example: "65c12f8a9e1b2c0012a3b456"
 *         authorId:
 *           type: string
 *           description: ID автора (populated у відповіді до обʼєкта з полями _id, name, lastname, role)
 *           example: "65c12f8a9e1b2c0012a3b111"
 *         authorRole:
 *           type: string
 *           enum: [admin, manager, maintenanceWorker, safety]
 *           description: Snapshot ролі автора на момент створення
 *         content:
 *           type: string
 *           minLength: 1
 *           maxLength: 2000
 *           example: "Перевірив вузол — потрібна заміна манжети."
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Session:
 *       type: object
 *       required:
 *         - userId
 *         - accessToken
 *         - refreshToken
 *         - accessTokenValidUntil
 *         - refreshTokenValidUntil
 *       properties:
 *         _id:
 *           type: string
 *           example: 65c3d4e5f6a7b8c9d0e1f2g3
 *         userId:
 *           type: string
 *           description: Reference to the User ID
 *           example: 64f0c2a9b9a1c2a1a1234567
 *         accessToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         refreshToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         accessTokenValidUntil:
 *           type: string
 *           format: date-time
 *         refreshTokenValidUntil:
 *           type: string
 *           format: date-time
 *
 *     Error:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           description: HTTP status code
 *           example: 400
 *         message:
 *           type: string
 *           description: Error message
 *           example: Invalid request parameters
 *         data:
 *           type: object
 *           description: Additional error details
 *
 *     SystemSettingsPublic:
 *       type: object
 *       description: Публічні поля SystemSettings (потрібні всім ролям для слот-гріду/календаря)
 *       properties:
 *         _id:
 *           type: string
 *           example: global
 *         workHours:
 *           type: object
 *           properties:
 *             start:
 *               type: string
 *               pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$'
 *               example: "08:00"
 *             end:
 *               type: string
 *               pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$'
 *               example: "17:00"
 *         workDays:
 *           type: array
 *           description: Робочі дні тижня (0=нд..6=сб)
 *           items:
 *             type: integer
 *             minimum: 0
 *             maximum: 6
 *           example: [1, 2, 3, 4, 5]
 *         slotDurationMinutes:
 *           type: integer
 *           minimum: 5
 *           maximum: 240
 *           example: 30
 *         holidays:
 *           type: array
 *           items:
 *             type: string
 *             format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     SystemSettings:
 *       allOf:
 *         - $ref: '#/components/schemas/SystemSettingsPublic'
 *         - type: object
 *           properties:
 *             email:
 *               type: object
 *               properties:
 *                 enabled:
 *                   type: boolean
 *                   example: true
 *                 from:
 *                   type: string
 *                   format: email
 *                   example: noreply@mms.local
 *                 triggers:
 *                   type: object
 *                   properties:
 *                     onAssignment: { type: boolean, example: true }
 *                     onNewFault: { type: boolean, example: true }
 *                     onSicurezzaHse: { type: boolean, example: true }
 *                     onDirectMessage: { type: boolean, example: true }
 *                 rateLimits:
 *                   type: object
 *                   properties:
 *                     perRecipientPerHour:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 1000
 *                       example: 10
 *             messaging:
 *               type: object
 *               properties:
 *                 broadcastTtlDays:
 *                   type: integer
 *                   minimum: 1
 *                   maximum: 365
 *                   example: 30
 *                 directRateLimitPerHour:
 *                   type: integer
 *                   minimum: 0
 *                   maximum: 1000
 *                   example: 30
 *             retention:
 *               type: object
 *               properties:
 *                 auditLogDays:
 *                   type: integer
 *                   minimum: 1
 *                   maximum: 3650
 *                   example: 90
 *                 completedFaultsArchiveMonths:
 *                   type: integer
 *                   nullable: true
 *                   minimum: 1
 *                   maximum: 120
 *             updatedBy:
 *               type: string
 *               nullable: true
 *               description: ID користувача, який востаннє змінював налаштування
 *
 *     AuditLog:
 *       type: object
 *       description: Запис журналу аудиту. Записи створюються автоматично через middleware/service; REST API надає лише читання.
 *       properties:
 *         _id:
 *           type: string
 *           example: "65d4f2a1b9a1c2a1a1234567"
 *         actorId:
 *           type: string
 *           nullable: true
 *           description: ID користувача-ініціатора. null для system/cron подій.
 *           example: "65c12f8a9e1b2c0012a3b111"
 *         actorRole:
 *           type: string
 *           enum: [operator, admin, manager, maintenanceWorker, safety, system]
 *           example: admin
 *         action:
 *           type: string
 *           enum:
 *             - auth.login
 *             - auth.logout
 *             - auth.refresh
 *             - auth.register
 *             - user.create
 *             - user.update
 *             - user.delete
 *             - user.verify
 *             - plant.create
 *             - plant.update
 *             - plant.delete
 *             - part.create
 *             - part.update
 *             - part.delete
 *             - fault.create
 *             - fault.update
 *             - fault.delete
 *             - fault.statusChange
 *             - fault.assign
 *             - fault.verify
 *             - comment.create
 *             - comment.delete
 *             - settings.update
 *             - message.create
 *             - message.broadcast
 *             - cron.reschedule
 *             - cron.markOverdue
 *         targetType:
 *           type: string
 *           nullable: true
 *           enum: [User, Plant, PartPlant, Fault, Comment, SystemSettings, Session, Message]
 *         targetId:
 *           type: string
 *           nullable: true
 *         summary:
 *           type: string
 *           maxLength: 500
 *           example: "Fault #FAULT-2026-042 assigned to 2 maintainers"
 *         meta:
 *           type: object
 *           nullable: true
 *           description: Вільна структура з diff/контекстом. Чутливі ключі (password, *Token, secret, ...) редактяться як "[Redacted]".
 *         ip:
 *           type: string
 *           nullable: true
 *         userAgent:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     AuditLogList:
 *       type: object
 *       properties:
 *         page: { type: integer, example: 1 }
 *         perPage: { type: integer, example: 20 }
 *         total: { type: integer, example: 135 }
 *         totalPages: { type: integer, example: 7 }
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AuditLog'
 *
 *     SystemSettingsUpdate:
 *       type: object
 *       description: Часткове оновлення SystemSettings (мінімум одне поле)
 *       minProperties: 1
 *       properties:
 *         workHours:
 *           type: object
 *           required: [start, end]
 *           properties:
 *             start: { type: string, example: "08:00" }
 *             end:   { type: string, example: "17:00" }
 *         workDays:
 *           type: array
 *           items: { type: integer, minimum: 0, maximum: 6 }
 *         slotDurationMinutes: { type: integer, minimum: 5, maximum: 240 }
 *         holidays:
 *           type: array
 *           items: { type: string, format: date-time }
 *         email: { type: object }
 *         messaging: { type: object }
 *         retention: { type: object }
 */
