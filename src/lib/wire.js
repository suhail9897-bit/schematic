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
if (isInsideComponent(neighbor, components, buffer)) continue;

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
