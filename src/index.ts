import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import dotenv from 'dotenv';
import { CivicIntakeSchema } from './schemas/intake.schema.js';
import { processCivicDispatch } from './services/dispatcher.service.js';

dotenv.config();

const fastify = Fastify({ logger: true });

// Health check endpoint for Cloud Run container probes
fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
  return { status: 'healthy', service: 'eventarc-civic-dispatcher', timestamp: new Date().toISOString() };
});

// Eventarc / Webhook ingestion endpoint
fastify.post('/v1/dispatch', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Cloud Storage / Eventarc sometimes wraps events in a standard CloudEvent envelope or raw JSON body
    const body: any = request.body;
    const rawPayload = body.data ? body.data : body;

    // Validate incoming payload against strict Zod/MISMO schema
    const validationResult = CivicIntakeSchema.safeParse(rawPayload);

    if (!validationResult.success) {
      fastify.log.warn({ errors: validationResult.error.format() }, '[DISPATCH] Schema validation failed');
      return reply.code(400).send({
        status: 'error',
        message: 'Payload failed rigorous compliance validation',
        details: validationResult.error.format(),
      });
    }

    // Process storage and state commit
    const dispatchResult = await processCivicDispatch(validationResult.data);

    if (!dispatchResult.success) {
      return reply.code(500).send({
        status: 'error',
        message: 'Failed to commit state to Firestore audit ledger',
        error: dispatchResult.error,
      });
    }

    return reply.code(200).send({
      status: 'success',
      message: 'Civic intake payload verified and dispatched successfully',
      auditId: dispatchResult.docId,
    });
  } catch (err: any) {
    fastify.log.error(err, '[DISPATCH] Unexpected server exception');
    return reply.code(500).send({ status: 'fatal', error: err.message });
  }
});

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
    const host = process.env.HOST || '0.0.0.0';
    await fastify.listen({ port, host });
    console.log(`[BEAST 3.0] eventarc-civic-dispatcher active on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
