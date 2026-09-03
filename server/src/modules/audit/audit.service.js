import mongoose from 'mongoose';
import { AuditEvent } from './auditEvent.model.js';
import { logger } from '../../utils/logger.js';

export class AuditService {
  /**
   * Logs an immutable audit event to the ledger.
   */
  static async logEvent({
    eventType,
    entityType,
    entityId,
    actor = { type: 'SYSTEM', id: 'system' },
    requestId = null,
    payload = {}
  }) {
    // If not connected to MongoDB (e.g. in standalone unit test), skip write cleanly
    if (mongoose.connection.readyState !== 1) {
      return null;
    }

    try {
      const event = await AuditEvent.create({
        eventType,
        entityType,
        entityId: String(entityId),
        actor,
        requestId,
        payload
      });

      logger.info(`[AUDIT] ${eventType} on ${entityType}:${entityId}`, {
        eventId: event.eventId,
        requestId
      });

      return event;
    } catch (err) {
      // Audit failure should log critically but not crash background ops
      logger.error(`Failed to write audit event ${eventType}: ${err.message}`, {
        entityType,
        entityId,
        requestId
      });
      return null;
    }
  }

  /**
   * Fetches chronological audit trail for a specific entity.
   */
  static async getTimelineForEntity(entityId) {
    return AuditEvent.find({ entityId: String(entityId) })
      .sort({ timestamp: -1 })
      .lean();
  }

  /**
   * Lists audit events with pagination and filtering.
   */
  static async listEvents({ entityType, eventType, requestId, page = 1, limit = 50 }) {
    const query = {};
    if (entityType) query.entityType = entityType;
    if (eventType) query.eventType = eventType;
    if (requestId) query.requestId = requestId;

    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      AuditEvent.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      AuditEvent.countDocuments(query)
    ]);

    return {
      events,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }
}
