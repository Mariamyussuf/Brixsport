import { Router } from 'express';
import { RedisInfoController } from '../controllers/redis-info.controller';

const router = Router();

/**
 * @swagger
 * /api/redis/health:
 *   get:
 *     summary: Check Redis health status
 *     tags: [Redis]
 *     responses:
 *       200:
 *         description: Redis health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Redis health check failed
 */
router.get('/health', RedisInfoController.checkHealth);

/**
 * @swagger
 * /api/redis/info:
 *   get:
 *     summary: Get Redis server information
 *     tags: [Redis]
 *     responses:
 *       200:
 *         description: Redis server information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     server:
 *                       type: object
 *                       additionalProperties: true
 *                     clients:
 *                       type: object
 *                       additionalProperties: true
 *                     memory:
 *                       type: object
 *                       additionalProperties: true
 *                     stats:
 *                       type: object
 *                       additionalProperties: true
 *       500:
 *         description: Failed to get Redis info
 */
router.get('/info', RedisInfoController.getInfo);

/**
 * @swagger
 * /api/redis/stats:
 *   get:
 *     summary: Get Redis server statistics
 *     tags: [Redis]
 *     responses:
 *       200:
 *         description: Redis server statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_connections_received:
 *                       type: integer
 *                     total_commands_processed:
 *                       type: integer
 *                     instantaneous_ops_per_sec:
 *                       type: integer
 *                     total_net_input_bytes:
 *                       type: integer
 *                     total_net_output_bytes:
 *                       type: integer
 *                     keyspace_hits:
 *                       type: integer
 *                     keyspace_misses:
 *                       type: integer
 *                     used_memory:
 *                       type: string
 *                     used_memory_human:
 *                       type: string
 *                     used_memory_peak:
 *                       type: string
 *                     used_memory_peak_human:
 *                       type: string
 *                     used_memory_rss:
 *                       type: string
 *                     used_memory_rss_human:
 *                       type: string
 *                     mem_fragmentation_ratio:
 *                       type: string
 *                     connected_clients:
 *                       type: integer
 *                     blocked_clients:
 *                       type: integer
 *       500:
 *         description: Failed to get Redis stats
 */
router.get('/stats', RedisInfoController.getStats);

/**
 * @swagger
 * /api/redis/sections:
 *   get:
 *     summary: Get specific Redis info sections
 *     tags: [Redis]
 *     parameters:
 *       - in: query
 *         name: sections
 *         required: true
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [server, clients, memory, persistence, stats, replication, cpu, commandstats, cluster, keyspace]
 *     responses:
 *       200:
 *         description: Requested Redis info sections
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     additionalProperties: true
 *       400:
 *         description: Invalid or missing sections parameter
 *       500:
 *         description: Failed to get Redis info sections
 */
router.get('/sections', RedisInfoController.getSections);

export default router;
