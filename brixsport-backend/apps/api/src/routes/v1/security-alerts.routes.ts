import { Router } from 'express';
import { alertingService } from '../../services/security/alerting.service';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';

const router = Router();

// Get active alerts
router.get('/active', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const alerts = await alertingService.getActiveAlerts();
    res.json({
      success: true,
      data: alerts
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get alert history
router.get('/history', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const filters: any = {};
    
    // Parse query parameters
    if (req.query.type) filters.type = req.query.type;
    if (req.query.severity) filters.severity = req.query.severity;
    if (req.query.resolved !== undefined) filters.resolved = req.query.resolved === 'true';
    if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
    if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
    if (req.query.offset) filters.offset = parseInt(req.query.offset as string);
    
    const result = await alertingService.getAlertHistory(filters);
    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Resolve an alert
router.post('/:id/resolve', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { resolvedBy } = req.body;
    
    // Use the authenticated user's ID if not provided in the body
    const resolvedByUserId = resolvedBy || req.user.id;
    
    await alertingService.resolveAlert(id, resolvedByUserId);
    res.json({
      success: true,
      message: 'Alert resolved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get alert rules
router.get('/rules', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const rules = await alertingService.getAlertRules();
    res.json({
      success: true,
      data: rules
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add alert rule
router.post('/rules', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const rule = req.body;
    await alertingService.addAlertRule(rule);
    res.status(201).json({
      success: true,
      message: 'Alert rule added successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update alert rule
router.put('/rules/:id', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    await alertingService.updateAlertRule(id, updates);
    res.json({
      success: true,
      message: 'Alert rule updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete alert rule
router.delete('/rules/:id', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    await alertingService.deleteAlertRule(id);
    res.json({
      success: true,
      message: 'Alert rule deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;