// wire.js



// 📦 Check if any segment of wire crosses a component bounding box
export function pathIntersectsComponent(path, components) {
  const buffer = 10; // 🛡️ avoid triggering intersection at terminal edges

  for (let i = 0; i < path.length - 1; i++) {
    const segStart = path[i];
    const segEnd = path[i + 1];

    for (const comp of components) {
      const left = comp.x - 60 + buffer;
      const right = comp.x + 60 - buffer;
      const top = comp.y - 60 + buffer;
      const bottom = comp.y + 60 - buffer;

      if (segmentIntersectsBox(segStart, segEnd, left, top, right, bottom)) {
        return true; // ❌ intersecting core body
      }
    }
  }

  return false;
}



// Check if line segment intersects component bounding box
function segmentIntersectsBox(p1, p2, left, top, right, bottom) {
  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);

  if (maxX < left || minX > right || maxY < top || minY > bottom) {
    return false; // completely outside
  }

  // segment is vertical
  if (p1.x === p2.x) {
    const x = p1.x;
    return x >= left && x <= right && (
      (p1.y <= bottom && p2.y >= top) || (p2.y <= bottom && p1.y >= top)
    );
  }

  // segment is horizontal
  if (p1.y === p2.y) {
    const y = p1.y;
    return y >= top && y <= bottom && (
      (p1.x <= right && p2.x >= left) || (p2.x <= right && p1.x >= left)
    );
  }

  return false; // not orthogonal
}


// ✅ A* orthogonal pathfinding avoiding component bounding boxes
export function aStarOrthogonalPath(start, end, components, gridSize = 30) {
  const buffer = 10;
  const openSet = [start];
  const cameFrom = new Map();

  const gScore = new Map();
  const fScore = new Map();

  const key = (p) => `${p.x},${p.y}`;
  const heuristic = (p) => Math.abs(p.x - end.x) + Math.abs(p.y - end.y);
  // 🛑 0) If start == end, nothing to route
  if (start.x === end.x && start.y === end.y) {
    return [start, end];
  }

  // 🧭 0.1) Bounded search window + hard iteration cap (prevents freezes)
  const margin = 40 * gridSize; // generous envelope around start/end
  const minX = Math.min(start.x, end.x) - margin;
  const maxX = Math.max(start.x, end.x) + margin;
  const minY = Math.min(start.y, end.y) - margin;
  const maxY = Math.max(start.y, end.y) + margin;
  const MAX_ITERS = 200000;
  let iters = 0;

  gScore.set(key(start), 0);
  fScore.set(key(start), heuristic(start));

  const visited = new Set();

   // 🟨 Step 1: Prepare grid with blocked cells for terminals
  const rows = 1000;
  const cols = 1000;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (const comp of components) {
    if (!comp.terminals) continue;

    for (const term of comp.terminals) {
      const tx = Math.round(term.x + comp.x);
      const ty = Math.round(term.y + comp.y);

      // ⚠️ Skip source and destination terminals
      if ((tx === start.x && ty === start.y) || (tx === end.x && ty === end.y)) continue;

      const col = Math.round(tx / gridSize);
      const row = Math.round(ty / gridSize);

      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        grid[row][col] = 1; // ❌ Mark terminal as blocked
      }
    }
  }

  while (openSet.length > 0) {
    // ⏳ guard against runaway expansion
    if (++iters > MAX_ITERS) return null;
    // Sort open set by lowest fScore
    openSet.sort((a, b) => fScore.get(key(a)) - fScore.get(key(b)));
    const current = openSet.shift();
    const currentKey = key(current);

    if (current.x === end.x && current.y === end.y) {
      const path = [];
      let curr = currentKey;
      while (cameFrom.has(curr)) {
        const [x, y] = curr.split(',').map(Number);
        path.unshift({ x, y });
        curr = cameFrom.get(curr);
      }
      path.unshift(start);
      return path;
    }

    visited.add(currentKey);

    for (const dir of [
      { dx: gridSize, dy: 0 },
      { dx: -gridSize, dy: 0 },
      { dx: 0, dy: gridSize },
      { dx: 0, dy: -gridSize },
    ]) {
      const neighbor = {
        x: current.x + dir.dx,
        y: current.y + dir.dy,
      };
      const neighborKey = key(neighbor);

      if (visited.has(neighborKey)) continue;
      // 🧱 1) keep search within reasonable bounds
      if (neighbor.x < minX || neighbor.x > maxX || neighbor.y < minY || neighbor.y > maxY) continue;
      // 🟢 2) allow stepping onto exact goal even if "inside" a component core
      if (!(neighbor.x === end.x && neighbor.y === end.y)) {
        if (isInsideComponent(neighbor, components, buffer)) continue;
      }

const col = Math.round(neighbor.x / gridSize);
const row = Math.round(neighbor.y / gridSize);
if (grid[row] && grid[row][col] === 1) continue; // ❌ Blocked terminal cell

      const tentativeG = gScore.get(currentKey) + 1;
      if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
        cameFrom.set(neighborKey, currentKey);
        gScore.set(neighborKey, tentativeG);
        fScore.set(neighborKey, tentativeG + heuristic(neighbor));

        if (!openSet.some((n) => n.x === neighbor.x && n.y === neighbor.y)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  return null; // ❌ no path found
}

// 🔍 Check if point lies inside any component’s bounding box
function isInsideComponent(point, components, buffer = 10) {
  for (const comp of components) {
    const left = comp.x - 60 + buffer;
    const right = comp.x + 60 - buffer;
    const top = comp.y - 60 + buffer;
    const bottom = comp.y + 60 - buffer;

    if (
      point.x >= left &&
      point.x <= right &&
      point.y >= top &&
      point.y <= bottom
    ) {
      return true;
    }
  }
  return false;
}

//wire deletion code added 
// ---------- Hit-test & delete helpers for wires ----------

// Distance of point P to line segment AB, also returns closest point.
export function pointToSegmentInfo(px, py, ax, ay, bx, by) {
  const APx = px - ax, APy = py - ay;
  const ABx = bx - ax, ABy = by - ay;
  const ab2 = ABx*ABx + ABy*ABy || 1e-9;
  let t = (APx*ABx + APy*ABy) / ab2;
  if (t < 0) t = 0; else if (t > 1) t = 1;
  const qx = ax + t*ABx, qy = ay + t*ABy;
  const dx = px - qx, dy = py - qy;
  return { dist: Math.hypot(dx, dy), qx, qy, t };
}

// Given a wire (with pathPoints or endpoints), test click proximity.
export function hitTestWireAt(wire, worldX, worldY, tol = 6) {
  // ✅ Prefer wire.path (jo tum save karte ho), then pathPoints, else give up
  const pts =
    (Array.isArray(wire.path) && wire.path.length >= 2 && wire.path) ||
    (Array.isArray(wire.pathPoints) && wire.pathPoints.length >= 2 && wire.pathPoints) ||
    [];

  if (pts.length < 2) return null;


  let best = null;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const info = pointToSegmentInfo(worldX, worldY, a.x, a.y, b.x, b.y);
    if (info.dist <= tol) {
      if (!best || info.dist < best.dist) {
        best = { segmentIndex: i, point: { x: info.qx, y: info.qy }, dist: info.dist };
      }
    }
  }
  return best; // null if miss
}

// Iterate all wires; return nearest hit with wire reference.
export function hitTestAllWires(wires, worldX, worldY, tol = 6) {
  let ans = null;
  for (const w of wires || []) {
    const r = hitTestWireAt(w, worldX, worldY, tol);
    if (r) {
      if (!ans || r.dist < ans.dist) ans = { wire: w, ...r };
    }
  }
  return ans;
}

// Delete by id from canvas-like host that has .wires, .recomputeNets(), .draw()
export function deleteWireById(host, wireId) {
  if (!host || !host.wires) return;
  const idx = host.wires.findIndex(w => w.id === wireId);
  if (idx >= 0) {
    host.wires.splice(idx, 1);
    // IMPORTANT: recompute net labels after topology change
    if (typeof host.recomputeNets === 'function') host.recomputeNets();
    if (typeof host.draw === 'function') host.draw();
  }
}

