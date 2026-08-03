function permutations(items) {
  if (items.length <= 1) return [items];
  const out = [];
  for (let i = 0; i < items.length; i += 1) {
    const head = items[i];
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const tail of permutations(rest)) out.push([head, ...tail]);
  }
  return out;
}

function relationHolds(order, [left, op, right]) {
  const a = order.indexOf(left);
  const b = order.indexOf(right);
  if (a < 0 || b < 0) return false;
  if (op === '<') return a < b;
  if (op === '>') return a > b;
  if (op === 'adjacent') return Math.abs(a - b) === 1;
  if (op === 'not-adjacent') return Math.abs(a - b) !== 1;
  throw new Error(`unsupported relation: ${op}`);
}

export function enumerateValidOrders(entities = [], constraints = []) {
  return permutations([...entities]).filter((order) => constraints.every((rule) => relationHolds(order, rule)));
}

export function classifyOrderingClaim(validOrders, claim) {
  if (!validOrders.length) return 'inconsistent-task';
  const count = validOrders.filter((order) => relationHolds(order, claim)).length;
  if (count === validOrders.length) return 'necessary';
  if (count === 0) return 'impossible';
  return 'possible';
}

export function solveNecessaryClaim(task) {
  const validOrders = enumerateValidOrders(task.people, task.constraints);
  const necessary = task.claims.filter((entry) => classifyOrderingClaim(validOrders, entry.relation) === 'necessary');
  if (necessary.length !== 1) throw new Error(`logic task needs exactly one necessary claim, found ${necessary.length}`);
  return { claimId: necessary[0].id, text: necessary[0].text, validOrderCount: validOrders.length };
}
