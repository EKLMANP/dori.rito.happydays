// Alert severity levels
export const SEVERITY = { critical: 'critical', warning: 'warning', info: 'info' };

/**
 * Evaluate a set of rules against current metric values.
 * @param {Array<{id, severity, condition, message, suggestion}>} rules
 * @param {Object} metrics - key-value pairs of current metric values
 * @returns {Array<{id, severity, message, suggestion, triggeredAt}>}
 */
export function evaluateAlerts(rules, metrics) {
    const triggered = [];
    for (const rule of rules) {
        try {
            if (rule.condition(metrics)) {
                triggered.push({
                    id: rule.id,
                    severity: rule.severity,
                    message: rule.message,
                    suggestion: rule.suggestion,
                    triggeredAt: new Date().toISOString(),
                });
            }
        } catch {
            // rule evaluation error — skip
        }
    }
    return triggered;
}
