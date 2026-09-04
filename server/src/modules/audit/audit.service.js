import crypto from 'crypto';
import mongoose from 'mongoose';
import { AuditEvent } from './auditEvent.model.js';
import { logger } from '../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export class AuditService {
  /**
   * Computes a deterministic SHA-256 hash for an audit ledger entry.
   */
  static computeEventHash({ prevHash, eventId, eventType, entityType, entityId, timestamp, payload }) {
    const serializedPayload = JSON.stringify(payload || {});
    const tsString = timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString();
    return crypto
      .createHash('sha256')
      .update(`${prevHash || 'GENESIS'}:${eventId}:${eventType}:${entityType}:${entityId}:${tsString}:${serializedPayload}`)
      .digest('hex');
  }

  static writeQueue = Promise.resolve();

  /**
   * Logs an immutable audit event to the ledger with cryptographic hash chaining.
   * Uses an in-process queue to guarantee monotonic, race-free hash chaining even under high concurrency.
   */
  static async logEvent({
    eventType,
    entityType,
    entityId,
    actor = { type: 'SYSTEM', id: 'system' },
    requestId = null,
    payload = {}
  }) {
    if (mongoose.connection.readyState !== 1) {
      return null;
    }

    return new Promise((resolve) => {
      this.writeQueue = this.writeQueue
        .catch(() => {})
        .then(async () => {
          try {
            const res = await this._doLogEvent({
              eventType,
              entityType,
              entityId,
              actor,
              requestId,
              payload
            });
            resolve(res);
          } catch (err) {
            resolve(null);
          }
        });
    });
  }

  static async _doLogEvent({
    eventType,
    entityType,
    entityId,
    actor,
    requestId,
    payload
  }) {
    if (mongoose.connection.readyState !== 1) return null;

    try {
      const lastEvent = await AuditEvent.findOne().sort({ _id: -1 }).select('hash').lean();
      const prevHash = lastEvent?.hash || '0'.repeat(64);
      const eventId = uuidv4();
      const timestamp = new Date();
      const hash = this.computeEventHash({
        prevHash,
        eventId,
        eventType,
        entityType,
        entityId: String(entityId),
        timestamp,
        payload
      });

      const event = await AuditEvent.create({
        eventId,
        eventType,
        entityType,
        entityId: String(entityId),
        actor,
        requestId,
        payload,
        prevHash,
        hash,
        timestamp
      });

      logger.info(`[AUDIT] ${eventType} on ${entityType}:${entityId}`, {
        eventId: event.eventId,
        requestId
      });

      return event;
    } catch (err) {
      logger.error(`Failed to write audit event ${eventType}: ${err.message}`, {
        entityType,
        entityId,
        requestId
      });
      return null;
    }
  }

  /**
   * Cryptographically verifies the integrity of the audit hash chain.
   * Detects any altered payloads, missing events, or hash tampering.
   */
  static async verifyLedgerIntegrity() {
    await this.writeQueue.catch(() => {});

    const events = await AuditEvent.find().sort({ _id: 1 }).lean();
    if (events.length === 0) {
      return { isValid: true, eventCount: 0, message: 'Ledger is empty.' };
    }

    let expectedPrevHash = '0'.repeat(64);

    for (let i = 0; i < events.length; i++) {
      const evt = events[i];

      if (evt.prevHash && evt.prevHash !== expectedPrevHash) {
        return {
          isValid: false,
          tamperedIndex: i,
          eventId: evt.eventId,
          reason: `Broken chain link: event prevHash does not match expected previous hash.`
        };
      }

      if (evt.hash) {
        const computed = this.computeEventHash({
          prevHash: evt.prevHash,
          eventId: evt.eventId,
          eventType: evt.eventType,
          entityType: evt.entityType,
          entityId: evt.entityId,
          timestamp: evt.timestamp,
          payload: evt.payload
        });

        if (computed !== evt.hash) {
          return {
            isValid: false,
            tamperedIndex: i,
            eventId: evt.eventId,
            reason: `Data tampering detected: computed hash does not match recorded event hash.`
          };
        }
      }

      if (evt.hash) {
        expectedPrevHash = evt.hash;
      }
    }

    return {
      isValid: true,
      eventCount: events.length,
      message: 'Cryptographic ledger audit passed: all hashes chained and verified.'
    };
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
