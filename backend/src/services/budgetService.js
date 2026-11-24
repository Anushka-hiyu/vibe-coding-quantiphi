export function calculateBudget(trip) {
  const activities = trip.activities || [];
  const totalEstimated = activities.reduce((sum, a) => sum + Number(a.estimatedCost || 0), 0);
  const totalActual = activities.reduce((sum, a) => sum + Number(a.actualCost || 0), 0);
  const totalBudget = Number(trip.totalBudget || 0);
  const remainingBudget = totalBudget - totalActual;
  const budgetUtilization = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 1000) / 10 : 0;
  const byCategory = activities.reduce((acc, a) => {
    const key = a.category || 'Other';
    acc[key] = (acc[key] || 0) + Number(a.actualCost || 0);
    return acc;
  }, {});
  return { totalBudget, totalEstimated, totalActual, remainingBudget, budgetUtilization, byCategory,
    state: totalActual > totalBudget && totalBudget > 0 ? 'over' : totalBudget > 0 && totalActual >= totalBudget * .8 ? 'warning' : 'healthy' };
}
