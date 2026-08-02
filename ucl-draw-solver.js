// @ts-check
(function initUclDrawSolver(root, factory) {
  const solver = factory();
  if (typeof module === "object" && module.exports) module.exports = solver;
  if (root) root.UclDrawSolver = solver;
})(typeof window !== "undefined" ? window : globalThis, function createUclDrawSolver() {
  "use strict";

  /** @typedef {string | number} TeamId */
  /**
   * @typedef {Readonly<{
   *   id: TeamId,
   *   name: string,
   *   country: string,
   *   pot: 1 | 2 | 3 | 4
   * }>} DrawTeam
   */
  /** @typedef {{ id: string, homeId: TeamId, awayId: TeamId }} DrawMatch */
  /**
   * @typedef {Readonly<{
   *   seed?: string | number,
   *   maxSearchNodes?: number
   * }>} DrawOptions
   */

  /** @param {unknown} value @returns {number} */
  function hash(value) {
    let current = 2166136261;
    for (const character of String(value)) {
      current ^= character.charCodeAt(0);
      current = Math.imul(current, 16777619);
    }
    return current >>> 0;
  }

  /** @param {readonly DrawTeam[]} teams */
  function validateTeams(teams) {
    if (!Array.isArray(teams) || teams.length !== 36) throw new TypeError("Expected exactly 36 teams.");
    const ids = new Set();
    const potCounts = [0, 0, 0, 0];
    teams.forEach((team, index) => {
      if (!team || (typeof team.id !== "string" && typeof team.id !== "number")) throw new TypeError(`Team ${index + 1} has an invalid id.`);
      if (ids.has(team.id)) throw new TypeError(`Duplicate team id: ${String(team.id)}.`);
      if (!team.name || !team.country) throw new TypeError(`Team ${String(team.id)} needs a name and country.`);
      if (!Number.isInteger(team.pot) || team.pot < 1 || team.pot > 4) throw new TypeError(`Team ${String(team.id)} has an invalid pot.`);
      ids.add(team.id);
      potCounts[team.pot - 1] += 1;
    });
    if (potCounts.some((count) => count !== 9)) throw new TypeError("Every pot must contain exactly nine teams.");
  }

  /**
   * Generates all 144 league-phase matches. The search is deterministic for a
   * given seed; the seed only orders equally legal branches and never relaxes a
   * constraint.
   *
   * @param {readonly DrawTeam[]} inputTeams
   * @param {DrawOptions} [options]
   * @returns {DrawMatch[][]}
   */
  function generateChampionsLeagueSchedule(inputTeams, options = {}) {
    validateTeams(inputTeams);
    const teams = [...inputTeams];
    const teamCount = teams.length;
    const seed = options.seed ?? 0;
    const maxNodes = Math.max(100_000, options.maxSearchNodes ?? 4_000_000);
    const remaining = Array.from({ length: teamCount }, () => [2, 2, 2, 2]);
    const opponents = Array.from({ length: teamCount }, () => new Set());
    const countryCounts = Array.from({ length: teamCount }, () => new Map());
    /** @type {{ a: number, b: number }[]} */
    const edges = [];
    let searchNodes = 0;

    /** @param {number} left @param {number} right */
    function canPair(left, right) {
      if (left === right || opponents[left].has(right)) return false;
      const a = teams[left];
      const b = teams[right];
      if (a.country === b.country) return false;
      if (remaining[left][b.pot - 1] <= 0 || remaining[right][a.pot - 1] <= 0) return false;
      if ((countryCounts[left].get(b.country) || 0) >= 2) return false;
      if ((countryCounts[right].get(a.country) || 0) >= 2) return false;
      return true;
    }

    /** @param {number} teamIndex @param {number} potIndex */
    function candidatesFor(teamIndex, potIndex) {
      /** @type {number[]} */
      const candidates = [];
      for (let opponentIndex = 0; opponentIndex < teamCount; opponentIndex += 1) {
        if (teams[opponentIndex].pot === potIndex + 1 && canPair(teamIndex, opponentIndex)) candidates.push(opponentIndex);
      }
      return candidates;
    }

    function hasFutureCapacity() {
      for (let teamIndex = 0; teamIndex < teamCount; teamIndex += 1) {
        for (let potIndex = 0; potIndex < 4; potIndex += 1) {
          const need = remaining[teamIndex][potIndex];
          if (need > 0 && candidatesFor(teamIndex, potIndex).length < need) return false;
        }
      }
      return true;
    }

    /** @param {number} left @param {number} right @param {1 | -1} direction */
    function changeCountryCount(left, right, direction) {
      const country = teams[right].country;
      const next = (countryCounts[left].get(country) || 0) + direction;
      if (next === 0) countryCounts[left].delete(country);
      else countryCounts[left].set(country, next);
    }

    /** @param {number} left @param {number} right */
    function addEdge(left, right) {
      opponents[left].add(right);
      opponents[right].add(left);
      remaining[left][teams[right].pot - 1] -= 1;
      remaining[right][teams[left].pot - 1] -= 1;
      changeCountryCount(left, right, 1);
      changeCountryCount(right, left, 1);
      edges.push({ a: left, b: right });
    }

    function removeLastEdge() {
      const edge = edges.pop();
      if (!edge) return;
      opponents[edge.a].delete(edge.b);
      opponents[edge.b].delete(edge.a);
      remaining[edge.a][teams[edge.b].pot - 1] += 1;
      remaining[edge.b][teams[edge.a].pot - 1] += 1;
      changeCountryCount(edge.a, edge.b, -1);
      changeCountryCount(edge.b, edge.a, -1);
    }

    /** @returns {{ teamIndex: number, potIndex: number, candidates: number[] } | null} */
    function mostConstrainedQuota() {
      let best = null;
      for (let teamIndex = 0; teamIndex < teamCount; teamIndex += 1) {
        for (let potIndex = 0; potIndex < 4; potIndex += 1) {
          const need = remaining[teamIndex][potIndex];
          if (need <= 0) continue;
          const candidates = candidatesFor(teamIndex, potIndex);
          if (candidates.length < need) return { teamIndex, potIndex, candidates: [] };
          const slack = candidates.length - need;
          if (!best || slack < best.slack || (slack === best.slack && candidates.length < best.candidates.length)) {
            best = { teamIndex, potIndex, candidates, slack };
          }
        }
      }
      return best ? { teamIndex: best.teamIndex, potIndex: best.potIndex, candidates: best.candidates } : null;
    }

    /** @returns {boolean} */
    function solveOpponents() {
      searchNodes += 1;
      if (searchNodes > maxNodes) throw new Error(`Draw search exceeded ${maxNodes.toLocaleString()} nodes; the supplied country distribution may be unsatisfiable.`);
      const quota = mostConstrainedQuota();
      if (!quota) return true;
      if (!quota.candidates.length) return false;
      quota.candidates.sort((left, right) => {
        const leftScarcity = candidatesFor(left, teams[quota.teamIndex].pot - 1).length;
        const rightScarcity = candidatesFor(right, teams[quota.teamIndex].pot - 1).length;
        return leftScarcity - rightScarcity
          || hash(`${seed}:${edges.length}:${quota.teamIndex}:${left}`) - hash(`${seed}:${edges.length}:${quota.teamIndex}:${right}`);
      });
      for (const opponentIndex of quota.candidates) {
        if (!canPair(quota.teamIndex, opponentIndex)) continue;
        addEdge(quota.teamIndex, opponentIndex);
        if (hasFutureCapacity() && solveOpponents()) return true;
        removeLastEdge();
      }
      return false;
    }

    if (!solveOpponents()) throw new Error("No valid Champions League draw exists for the supplied teams.");

    const edgeByTeam = Array.from({ length: teamCount }, () => /** @type {number[]} */ ([]));
    edges.forEach((edge, edgeIndex) => {
      edgeByTeam[edge.a].push(edgeIndex);
      edgeByTeam[edge.b].push(edgeIndex);
    });
    /** @type {(0 | 1 | null)[]} */
    const orientation = Array(edges.length).fill(null);
    const orientationLinks = Array.from({ length: edges.length }, () => /** @type {{ edgeIndex: number, xor: 0 | 1 }[]} */ ([]));
    for (let teamIndex = 0; teamIndex < teamCount; teamIndex += 1) {
      for (let pot = 1; pot <= 4; pot += 1) {
        const incident = edgeByTeam[teamIndex].filter((edgeIndex) => {
          const edge = edges[edgeIndex];
          const opponentIndex = edge.a === teamIndex ? edge.b : edge.a;
          return teams[opponentIndex].pot === pot;
        });
        if (incident.length !== 2) throw new Error("Internal error: an opponent quota was not completed.");
        const [first, second] = incident;
        const firstInverted = edges[first].b === teamIndex ? 1 : 0;
        const secondInverted = edges[second].b === teamIndex ? 1 : 0;
        const xor = /** @type {0 | 1} */ (1 ^ firstInverted ^ secondInverted);
        orientationLinks[first].push({ edgeIndex: second, xor });
        orientationLinks[second].push({ edgeIndex: first, xor });
      }
    }
    for (let start = 0; start < edges.length; start += 1) {
      if (orientation[start] !== null) continue;
      orientation[start] = /** @type {0 | 1} */ (hash(`${seed}:orientation:${start}`) & 1);
      const stack = [start];
      while (stack.length) {
        const edgeIndex = /** @type {number} */ (stack.pop());
        for (const link of orientationLinks[edgeIndex]) {
          const required = /** @type {0 | 1} */ (orientation[edgeIndex] ^ link.xor);
          if (orientation[link.edgeIndex] === null) {
            orientation[link.edgeIndex] = required;
            stack.push(link.edgeIndex);
          } else if (orientation[link.edgeIndex] !== required) {
            throw new Error("No home/away orientation satisfies one home and one away opponent per pot.");
          }
        }
      }
    }

    const available = new Set(edges.map((_, index) => index));
    /** @type {number[][]} */
    const roundEdges = [];
    let matchingNodes = 0;

    /** @param {number} roundIndex @returns {boolean} */
    function solveRounds(roundIndex) {
      if (roundIndex === 8) return available.size === 0;
      if (roundIndex === 7) {
        const last = [...available];
        const clubs = new Set(last.flatMap((edgeIndex) => [edges[edgeIndex].a, edges[edgeIndex].b]));
        if (last.length !== 18 || clubs.size !== 36) return false;
        roundEdges.push(last);
        available.clear();
        return true;
      }
      const used = new Set();
      /** @type {number[]} */
      const matching = [];

      /** @returns {boolean} */
      function extendMatching() {
        matchingNodes += 1;
        if (matchingNodes > maxNodes) throw new Error(`Matchday search exceeded ${maxNodes.toLocaleString()} nodes.`);
        if (matching.length === 18) {
          matching.forEach((edgeIndex) => available.delete(edgeIndex));
          roundEdges.push([...matching]);
          if (solveRounds(roundIndex + 1)) return true;
          roundEdges.pop();
          matching.forEach((edgeIndex) => available.add(edgeIndex));
          return false;
        }
        let selectedTeam = -1;
        /** @type {number[]} */
        let selectedEdges = [];
        for (let teamIndex = 0; teamIndex < teamCount; teamIndex += 1) {
          if (used.has(teamIndex)) continue;
          const choices = edgeByTeam[teamIndex].filter((edgeIndex) => {
            if (!available.has(edgeIndex)) return false;
            const edge = edges[edgeIndex];
            const opponentIndex = edge.a === teamIndex ? edge.b : edge.a;
            return !used.has(opponentIndex);
          });
          if (!choices.length) return false;
          if (selectedTeam < 0 || choices.length < selectedEdges.length) {
            selectedTeam = teamIndex;
            selectedEdges = choices;
          }
        }
        selectedEdges.sort((left, right) => hash(`${seed}:round:${roundIndex}:${left}`) - hash(`${seed}:round:${roundIndex}:${right}`));
        for (const edgeIndex of selectedEdges) {
          const edge = edges[edgeIndex];
          if (used.has(edge.a) || used.has(edge.b)) continue;
          used.add(edge.a);
          used.add(edge.b);
          matching.push(edgeIndex);
          if (extendMatching()) return true;
          matching.pop();
          used.delete(edge.a);
          used.delete(edge.b);
        }
        return false;
      }
      return extendMatching();
    }

    if (!solveRounds(0)) throw new Error("The valid opponent graph could not be divided into eight matchdays.");

    return roundEdges.map((round, roundIndex) => round.map((edgeIndex, matchIndex) => {
      const edge = edges[edgeIndex];
      const leftIsHome = orientation[edgeIndex] === 1;
      return {
        id: `ucl-md${roundIndex + 1}-${matchIndex + 1}`,
        homeId: teams[leftIsHome ? edge.a : edge.b].id,
        awayId: teams[leftIsHome ? edge.b : edge.a].id,
      };
    }));
  }

  return Object.freeze({ generateChampionsLeagueSchedule, validateTeams });
});
