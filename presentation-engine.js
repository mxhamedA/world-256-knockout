(function attachMatchPresentation(global) {
  "use strict";

  const IMPORTANCE = Object.freeze({ silent: 0, normal: 1, notable: 2, major: 3, goal: 4 });

  function importanceValue(importance) {
    return IMPORTANCE[importance] ?? IMPORTANCE.silent;
  }

  function freezeScore(score) {
    return Object.freeze({
      home: Number(score?.home) || 0,
      away: Number(score?.away) || 0,
    });
  }

  function createEvent(event) {
    const metadata = Object.freeze({ ...(event.metadata || {}) });
    const playerIds = Object.freeze([...(event.playerIds || [])].filter(Boolean));
    return Object.freeze({
      ...event,
      id: String(event.id),
      sequence: Number(event.sequence) || 0,
      minute: Number(event.minute) || 0,
      addedTime: Number(event.addedTime) || 0,
      importance: event.importance in IMPORTANCE ? event.importance : "silent",
      playerIds,
      scoreBefore: freezeScore(event.scoreBefore),
      scoreAfter: freezeScore(event.scoreAfter),
      metadata,
    });
  }

  function scoreForSide(score, side) {
    return side === "away"
      ? { team: score.away, opponent: score.home }
      : { team: score.home, opponent: score.away };
  }

  function goalCommentary(event, teamName) {
    const metadata = event.metadata || {};
    const side = event.side || metadata.side || "home";
    const before = scoreForSide(event.scoreBefore || {}, side);
    const after = scoreForSide(event.scoreAfter || {}, side);
    const team = (teamName || metadata.teamName || "TEAM").toUpperCase();
    const scorer = (metadata.scorer || event.player || "UNKNOWN SCORER").toUpperCase();
    const ownGoalBy = (metadata.ownGoalBy || "").toUpperCase();

    if (event.type === "shootout-kick") {
      return metadata.scored === false
        ? `${scorer} MISSES FOR ${team} IN THE SHOOTOUT!`
        : `${scorer} SCORES FOR ${team} IN THE SHOOTOUT!`;
    }
    if (event.type === "disallowed-goal") return `GOAL DISALLOWED FOR ${team}!`;
    if (event.type === "penalty-miss") return `${scorer} MISSES FROM THE SPOT FOR ${team}!`;

    const subject = metadata.ownGoal
      ? `${ownGoalBy || scorer} PUTS THROUGH AN OWN GOAL`
      : scorer;
    const suffix = `${metadata.goalType === "penalty" ? " FROM THE SPOT" : ""}${event.phase === "extra-time" ? " IN EXTRA TIME" : ""}`;
    const finish = (text) => `${text}${suffix}!`;

    if (before.team === 0 && before.opponent === 0) {
      if (event.minute <= 10) return finish(`${subject} STRIKES EARLY TO PUT ${team} IN FRONT`);
      return finish(`${subject} OPENS THE SCORING FOR ${team}`);
    }
    if (after.team === after.opponent) {
      if (event.minute >= 85) return finish(`LATE DRAMA AS ${subject} EQUALISES FOR ${team}`);
      return finish(`${subject} EQUALISES FOR ${team}`);
    }
    if (before.team <= before.opponent && after.team > after.opponent) {
      if (event.minute >= 85) return finish(`${subject} MAY HAVE WON IT LATE FOR ${team}`);
      if (metadata.teamHadLed) return finish(`${subject} RESTORES ${team}'S LEAD`);
      return finish(`${subject} PUTS ${team} AHEAD`);
    }
    if (before.team - before.opponent === 1 && after.team - after.opponent === 2) {
      return finish(`${subject} DOUBLES ${team}'S LEAD`);
    }
    if (after.team < after.opponent) {
      if (event.minute >= 80) return finish(`${subject} GIVES ${team} LATE HOPE`);
      return finish(`${subject} PULLS ONE BACK FOR ${team}`);
    }
    if (after.team > before.team) {
      if (after.team - after.opponent >= 3) return finish(`${subject} PUTS THE RESULT BEYOND DOUBT FOR ${team}`);
      return finish(`${subject} EXTENDS ${team}'S LEAD`);
    }
    return finish(`${subject} SCORES FOR ${team}`);
  }

  function displayDuration(importance, speed, reducedMotion = false) {
    if (reducedMotion) return importance === "goal" ? 650 : importance === "major" ? 450 : 250;
    const safeSpeed = Math.max(0.5, Number(speed) || 1);
    if (importance === "goal") return Math.max(900, 2200 / safeSpeed);
    if (importance === "major") return Math.max(650, 1600 / safeSpeed);
    if (importance === "notable") return Math.max(350, 1100 / safeSpeed);
    if (importance === "normal") return Math.max(250, 800 / safeSpeed);
    return 0;
  }

  function createScheduler(options = {}) {
    const onAccept = options.onAccept || (() => {});
    const onShow = options.onShow || (() => {});
    const onDrop = options.onDrop || (() => {});
    const clock = options.now || (() => Date.now());
    const seen = new Set();
    let queue = [];
    let active = null;
    let lastNormalAt = -Infinity;
    let lastNotableAt = -Infinity;
    let generation = 0;

    const drop = (event, reason) => onDrop(event, reason, queue.length);
    const show = (event, now, context) => {
      active = {
        event,
        until: now + displayDuration(event.importance, context.speed, context.reducedMotion),
      };
      if (event.importance === "normal") lastNormalAt = now;
      if (event.importance === "notable") lastNotableAt = now;
      onShow(event, queue.length);
      return event;
    };
    const prune = (now) => {
      queue = queue.filter((event) => {
        const maxAge = event.importance === "normal" ? 1200 : event.importance === "notable" ? 2400 : Infinity;
        const keep = now - event.receivedAt <= maxAge;
        if (!keep) drop(event, "expired");
        return keep;
      });
    };

    return {
      enqueue(rawEvent, context = {}) {
        const now = context.now ?? clock();
        const event = createEvent({ ...rawEvent, receivedAt: rawEvent.receivedAt ?? now });
        const key = event.id || `sequence:${event.sequence}`;
        if (seen.has(key)) {
          drop(event, "duplicate");
          return false;
        }
        seen.add(key);
        if (event.importance === "silent") {
          drop(event, "silent");
          return false;
        }
        if (event.importance === "normal" && ((context.speed || 1) > 1 || now - lastNormalAt < 3500)) {
          drop(event, "routine");
          return false;
        }
        if (event.importance === "notable" && (context.speed || 1) > 1) {
          const notableIsActive = active?.event.importance === "notable" && now < active.until;
          const highSpeedBurst = (context.speed || 1) >= 3 && now - lastNotableAt < 700;
          if (notableIsActive || highSpeedBurst) {
            drop(event, "high-speed-congestion");
            return false;
          }
        }

        onAccept(event, queue.length);
        prune(now);
        const priority = importanceValue(event.importance);
        if (priority >= IMPORTANCE.major) {
          queue = queue.filter((queued) => {
            const keep = importanceValue(queued.importance) >= priority;
            if (!keep) drop(queued, "preempted");
            return keep;
          });
        }

        const activePriority = active ? importanceValue(active.event.importance) : -1;
        const shouldPreempt = priority > activePriority
          || (priority >= IMPORTANCE.major && priority === activePriority);
        if (!active || now >= active.until || shouldPreempt) {
          show(event, now, context);
        } else {
          queue.push(event);
          queue.sort((left, right) => (
            importanceValue(right.importance) - importanceValue(left.importance)
            || left.sequence - right.sequence
          ));
        }
        return true;
      },

      tick(context = {}) {
        const now = context.now ?? clock();
        prune(now);
        if (active && now < active.until) return active.event;
        active = null;
        if (!queue.length) return null;
        return show(queue.shift(), now, context);
      },

      clear(reason = "clear") {
        generation += 1;
        queue.forEach((event) => drop(event, reason));
        queue = [];
        active = null;
      },

      snapshot() {
        return Object.freeze({
          generation,
          queueLength: queue.length,
          activeId: active?.event.id || null,
          seenCount: seen.size,
        });
      },
    };
  }

  function createClock(options = {}) {
    let authoritative = Math.max(0, Number(options.initialMinute) || 0);
    let displayed = authoritative;
    let lastNow = Number(options.now) || 0;
    let speed = Math.max(0.5, Number(options.speed) || 1);
    let rate = 1;
    let paused = false;
    const maxMinute = Math.max(authoritative, Number(options.maxMinute) || 90);

    const read = (now) => {
      const currentNow = Math.max(lastNow, Number(now) || lastNow);
      const elapsed = paused ? 0 : (currentNow - lastNow) / 1000;
      displayed = Math.min(authoritative, displayed + rate * elapsed);
      lastNow = currentNow;
      return displayed;
    };

    return {
      sync(minute, now) {
        read(now);
        authoritative = Math.min(maxMinute, Math.max(authoritative, Number(minute) || 0));
        const gap = Math.max(0, authoritative - displayed);
        rate = Math.max(0.75 * speed, gap / Math.max(0.12, 0.55 / speed));
        return displayed;
      },
      read,
      setSpeed(nextSpeed, now) {
        read(now);
        speed = Math.max(0.5, Number(nextSpeed) || 1);
        const gap = Math.max(0, authoritative - displayed);
        rate = Math.max(0.75 * speed, gap / Math.max(0.12, 0.55 / speed));
      },
      pause(now) {
        read(now);
        paused = true;
      },
      resume(now) {
        lastNow = Math.max(lastNow, Number(now) || lastNow);
        paused = false;
      },
      finish(now) {
        read(now);
        authoritative = maxMinute;
        displayed = maxMinute;
        return displayed;
      },
      snapshot() {
        return Object.freeze({ authoritative, displayed, paused, rate, speed });
      },
    };
  }

  global.MatchPresentation = Object.freeze({
    IMPORTANCE,
    createClock,
    createEvent,
    createScheduler,
    displayDuration,
    goalCommentary,
    importanceValue,
  });
})(globalThis);
