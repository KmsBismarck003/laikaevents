// ============================================
// LAIKA CLUB - SCRIPT DE MONGODB
// ============================================

// Conectar a MongoDB
use laika_club_logs;

// ============================================
// CREAR COLECCIONES
// ============================================

// Colección: system_logs
db.createCollection("system_logs", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["level", "action", "timestamp"],
         properties: {
            level: {
               bsonType: "string",
               enum: ["info", "warning", "error", "critical"]
            },
            action: { bsonType: "string" },
            message: { bsonType: "string" },
            user_id: { bsonType: ["int", "null"] },
            ip_address: { bsonType: ["string", "null"] },
            user_agent: { bsonType: ["string", "null"] },
            metadata: { bsonType: ["object", "null"] },
            timestamp: { bsonType: "date" }
         }
      }
   }
});

// Colección: system_config
db.createCollection("system_config", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["key", "value"],
         properties: {
            key: { bsonType: "string" },
            value: {},
            type: { bsonType: "string" },
            description: { bsonType: "string" },
            category: { bsonType: "string" },
            updated_by: { bsonType: ["int", "null"] },
            updated_at: { bsonType: "date" },
            created_at: { bsonType: "date" }
         }
      }
   }
});

// Colección: event_statistics
db.createCollection("event_statistics");

// Colección: user_notifications
db.createCollection("user_notifications");

// Colección: active_sessions
db.createCollection("active_sessions");

// Colección: system_cache
db.createCollection("system_cache");

// ============================================
// CREAR ÍNDICES
// ============================================

// Índices para system_logs
db.system_logs.createIndex({ "timestamp": -1 });
db.system_logs.createIndex({ "level": 1 });
db.system_logs.createIndex({ "action": 1 });
db.system_logs.createIndex({ "user_id": 1 });

// Índices para system_config
db.system_config.createIndex({ "key": 1 }, { unique: true });
db.system_config.createIndex({ "category": 1 });

// Índices para event_statistics
db.event_statistics.createIndex({ "event_id": 1 });
db.event_statistics.createIndex({ "date": -1 });

// Índices para user_notifications
db.user_notifications.createIndex({ "user_id": 1 });
db.user_notifications.createIndex({ "is_read": 1 });
db.user_notifications.createIndex({ "created_at": -1 });

// Índices para active_sessions
db.active_sessions.createIndex({ "user_id": 1 });
db.active_sessions.createIndex({ "session_token": 1 }, { unique: true });
db.active_sessions.createIndex({ "expires_at": 1 });

// Índices para system_cache
db.system_cache.createIndex({ "key": 1 }, { unique: true });
db.system_cache.createIndex({ "expires_at": 1 });

// ============================================
// DATOS DE PRUEBA
// ============================================

// Configuración inicial del sistema
db.system_config.insertMany([
   {
      key: "maintenance_mode",
      value: false,
      type: "boolean",
      description: "Modo de mantenimiento del sistema",
      category: "general",
      created_at: new Date(),
      updated_at: new Date()
   },
   {
      key: "registration_enabled",
      value: true,
      type: "boolean",
      description: "Permitir registro de nuevos usuarios",
      category: "security",
      created_at: new Date(),
      updated_at: new Date()
   },
   {
      key: "session_timeout",
      value: 30,
      type: "number",
      description: "Tiempo de sesión en minutos",
      category: "security",
      created_at: new Date(),
      updated_at: new Date()
   },
   {
      key: "max_tickets_per_purchase",
      value: 10,
      type: "number",
      description: "Máximo de boletos por compra",
      category: "business",
      created_at: new Date(),
      updated_at: new Date()
   }
]);

// Log inicial
db.system_logs.insertOne({
   level: "info",
   action: "database_init",
   message: "Base de datos MongoDB inicializada correctamente",
   timestamp: new Date()
});

// ============================================
// VERIFICACIÓN
// ============================================
print("✅ Base de datos MongoDB creada correctamente");
print("Colecciones creadas:");
db.getCollectionNames().forEach(function(collection) {
   print("  - " + collection);
});
