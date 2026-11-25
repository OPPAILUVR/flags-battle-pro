/**
 * Flags Battle Pro — 2D Physics Engine (String-Cutting Arena Battle)
 * Closed circular arena where 8 flags bounce and cut each other's
 * perimeter-tethered strings until only 1 flag remains.
 *
 * Namespace: window.FB.Physics
 */
(function () {
  'use strict';
  window.FB = window.FB || {};

  /* ------------------------------------------------------------------ */
  /*  Constants & Helpers                                                */
  /* ------------------------------------------------------------------ */

  var STRINGS_PER_FLAG = 11;

  // Expose as mutable on module for UI control
  var _stringsPerFlagOverride = null;
  var FLAG_COLORS = [
    '#ff3b5c', // Crimson
    '#3b82f6', // Electric Blue
    '#22c55e', // Emerald Green
    '#facc15', // Gold Yellow
    '#a855f7', // Violet Purple
    '#06b6d4', // Cyan
    '#f97316', // Bright Orange
    '#ec4899'  // Hot Pink
  ];

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(v, min, max) {
    return v < min ? min : (v > max ? max : v);
  }

  function normalizeAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  /**
   * Returns true if segment (ax,ay)-(bx,by) strictly intersects (cx,cy)-(dx,dy).
   */
  function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
    // Fast AABB rejection before division
    if ((ax < cx && ax < dx && bx < cx && bx < dx) ||
        (ax > cx && ax > dx && bx > cx && bx > dx) ||
        (ay < cy && ay < dy && by < cy && by < dy) ||
        (ay > cy && ay > dy && by > cy && by > dy)) {
      return false;
    }
    var d1x = bx - ax, d1y = by - ay;
    var d2x = dx - cx, d2y = dy - cy;
    var denom = d1x * d2y - d1y * d2x;
    if (denom > -1e-6 && denom < 1e-6) return false;
    var qpx = cx - ax, qpy = cy - ay;
    var t = (qpx * d2y - qpy * d2x) / denom;
    if (t <= 0.01 || t >= 0.99) return false;
    var u = (qpx * d1y - qpy * d1x) / denom;
    return u > 0.01 && u < 0.99;
  }

  /**
   * Shortest distance squared from point (px, py) to segment (ax, ay)-(bx, by).
   * Returns { distSq, cx, cy }.
   */
  function pointToSegmentDistSq(px, py, ax, ay, bx, by) {
    var dx = bx - ax;
    var dy = by - ay;
    var lenSq = dx * dx + dy * dy;
    var t = 0;
    if (lenSq > 1e-6) {
      t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
      if (t < 0) t = 0;
      else if (t > 1) t = 1;
    }
    var cx = ax + t * dx;
    var cy = ay + t * dy;
    var ex = px - cx;
    var ey = py - cy;
    return { distSq: ex * ex + ey * ey, cx: cx, cy: cy };
  }

  /* ------------------------------------------------------------------ */
  /*  Physics Module                                                     */
  /* ------------------------------------------------------------------ */

  window.FB.Physics = {

    /* --- configurable state (9:16 vertical stream layout) --- */
    arenaAngle: 0,
    accumulatedRotation: 0,
    arenaRadius: 247,
    baseRadius: 247,
    gapSize: 0,                  // Closed arena (kept for API compatibility)
    gapDegrees: 0,
    centerX: 270,
    centerY: 415,
    gravity: 0.02,               // Very light gravity so flags traverse whole circle
    baseRotationSpeed: 0.003,
    rotationSpeed: 0.003,
    speedMultiplier: 1.0,
    flagRadius: 18,
    baseRestitution: 1.0,
    restitution: 1.0,
    collisionRestitution: 1.05,
    bounceMultiplier: 1.2,
    damping: 1.0,
    paused: false,
    safeCountryCode: null,
    startingGraceTimer: 0,
    startingGraceDuration: 0.5,

    /* --- Intro lobby state --- */
    introTimer: 0,
    introDuration: 3.2,

    /* --- Chaos effect timers --- */
    _chaosVortexTimer: 0,
    _chaosVortexStrength: 0,
    _chaosWindTimer: 0,
    _chaosWindX: 0,
    _chaosWindY: 0,

    /* --- runtime --- */
    flags: [],
    anchors: [],

    /* ================================================================ */
    /*  init / reset                                                     */
    /* ================================================================ */

    init: function (config) {
      config = config || {};
      var w = config.width || 540;
      var h = config.height || 960;
      this.centerX = w / 2;
      this.centerY = Math.round(h * 0.428);
      this.arenaRadius = Math.min(252, Math.round(w * 0.458));
      this.baseRadius = this.arenaRadius;
      this.flagRadius = config.flagRadius || 18;
      this.gravity = config.gravity !== undefined ? config.gravity : 0.02;
      this.rotationSpeed = config.rotationSpeed || 0.003;
      this.reset();
    },

    setDimensions: function (w, h) {
      if (!w || !h) return;
      this.centerX = w / 2;
      this.centerY = Math.round(h * 0.428);
      this.arenaRadius = Math.min(252, Math.round(w * 0.458));
      this.baseRadius = this.arenaRadius;
      this._updateAnchorPositions();
    },

    reset: function () {
      this.flags = [];
      this.anchors = [];
      this.arenaAngle = 0;
      this.accumulatedRotation = 0;
      this.arenaRadius = this.baseRadius || 215;
      this.safeCountryCode = null;
      this.startingGraceTimer = 0;
      this.introTimer = 0;
      this.paused = false;
      this.resetChaosEffects();
    },

    setSafeCountry: function () {
      this.safeCountryCode = null;
    },

    /* ================================================================ */
    /*  spawnFlags                                                       */
    /* ================================================================ */

    /**
     * Spawn the battle contenders (typically 8) in a ring with tethered strings.
     */
    spawnFlags: function (flagDataArray, options) {
      options = options || {};
      this.flags = [];
      this.anchors = [];
      this.arenaRadius = this.baseRadius || 215;
      this.introTimer = options.skipIntro ? 0 : this.introDuration;
      this.startingGraceTimer = this.startingGraceDuration;

      var count = flagDataArray.length;
      if (count === 0) return;

      var stringsCount = this._stringsPerFlag || _stringsPerFlagOverride || STRINGS_PER_FLAG;

      var slotRadius = this.arenaRadius * 0.56;
      var angleStep = (Math.PI * 2) / count;
      // Start slot 0 at bottom (PI/2) so Champion sits at bottom like the recording
      var startAngle = Math.PI / 2;

      for (var i = 0; i < count; i++) {
        var data = flagDataArray[i];
        var slotAngle = startAngle + i * angleStep;
        var sx = this.centerX + Math.cos(slotAngle) * slotRadius;
        var sy = this.centerY + Math.sin(slotAngle) * slotRadius;
        var color = FLAG_COLORS[i % FLAG_COLORS.length];

        // Build contiguous arc of shared perimeter anchor points around slotAngle
        var arcSpan = angleStep;
        var anchorStep = arcSpan / stringsCount;
        var arcStart = slotAngle - arcSpan / 2 + anchorStep / 2;

        for (var s = 0; s < stringsCount; s++) {
          var aAngle = arcStart + s * anchorStep;
          this.anchors.push({
            id: this.anchors.length,
            angle: aAngle,
            ax: this.centerX + Math.cos(aAngle) * this.arenaRadius,
            ay: this.centerY + Math.sin(aAngle) * this.arenaRadius,
            ownerId: i,
            cooldown: 0
          });
        }

        // Launch velocity (inward + tangential)
        var launchAngle = slotAngle + Math.PI + rand(-0.65, 0.65);
        var baseSpeed = 3.4 * (this.speedMultiplier || 1.0);

        this.flags.push({
          id: i,
          code: data.code,
          name: data.name || data.code.toUpperCase(),
          color: color,
          role: data.role || 'random',
          votes: data.votes || 0,
          x: sx,
          y: sy,
          introX: sx,
          introY: sy,
          slotIndex: i,
          vx: Math.cos(launchAngle) * baseSpeed,
          vy: Math.sin(launchAngle) * baseSpeed,
          radius: this.flagRadius,
          stringsRemaining: stringsCount,
          totalStrings: stringsCount,
          shields: data.shields || 0,
          shieldCooldown: 0,
          attachCooldown: 0,
          cutCooldown: 0,
          speedBoostTimer: 0,
          graceTimer: 0.4,
          eliminated: false,
          isSafe: false,
          isViewerFavorite: !!data.isViewerFavorite,
          hasChatSupport: !!data.hasChatSupport,
          supportCount: data.supportCount || 0,
          fallOpacity: 1
        });
      }
    },

    _updateAnchorPositions: function () {
      for (var i = 0; i < this.anchors.length; i++) {
        var a = this.anchors[i];
        a.ax = this.centerX + Math.cos(a.angle) * this.arenaRadius;
        a.ay = this.centerY + Math.sin(a.angle) * this.arenaRadius;
      }
    },

    /* ================================================================ */
    /*  update                                                           */
    /* ================================================================ */

    update: function (dt) {
      var result = {
        eliminated: [],
        shieldSaves: [],
        safeSaves: [],
        bounces: [],
        cuts: [],
        attaches: [],
        gapExpanded: false,
        currentGapDegrees: 0
      };

      if (this.paused) return result;

      var dtScale = clamp(dt || 1, 0.2, 3.0);
      var dtSec = dtScale / 60;

      // Intro lobby countdown
      if (this.introTimer > 0) {
        this.introTimer = Math.max(0, this.introTimer - dtSec);
        return result;
      }

      if (this.startingGraceTimer > 0) {
        this.startingGraceTimer = Math.max(0, this.startingGraceTimer - dtSec);
      }

      // Chaos timers
      if (this._chaosVortexTimer > 0) {
        this._chaosVortexTimer = Math.max(0, this._chaosVortexTimer - dtSec);
      }
      if (this._chaosWindTimer > 0) {
        this._chaosWindTimer = Math.max(0, this._chaosWindTimer - dtSec);
      }

      var activeFlags = this.getActiveFlags();
      if (activeFlags.length <= 1) {
        return result;
      }

      // Decrement per-anchor cooldowns
      for (var ak = 0; ak < this.anchors.length; ak++) {
        if (this.anchors[ak].cooldown > 0) {
          this.anchors[ak].cooldown = Math.max(0, this.anchors[ak].cooldown - dtSec);
        }
      }

      // 1. Integrate positions & regulate speed
      var baseTargetSpeed = 3.5 * (this.speedMultiplier || 1.0) * (0.85 + 0.15 * (this.bounceMultiplier || 1.2));

      for (var i = 0; i < activeFlags.length; i++) {
        var f = activeFlags[i];
        if (f.graceTimer > 0) f.graceTimer = Math.max(0, f.graceTimer - dtSec);
        if (f.shieldCooldown > 0) f.shieldCooldown = Math.max(0, f.shieldCooldown - dtSec);
        if (f.attachCooldown > 0) f.attachCooldown = Math.max(0, f.attachCooldown - dtSec);
        if (f.cutCooldown > 0) f.cutCooldown = Math.max(0, f.cutCooldown - dtSec);
        if (f.speedBoostTimer > 0) f.speedBoostTimer = Math.max(0, f.speedBoostTimer - dtSec);

        // Light gravity + chaos forces
        f.vy += this.gravity * dtScale;

        if (this._chaosVortexTimer > 0) {
          var vdx = this.centerX - f.x;
          var vdy = this.centerY - f.y;
          var vdist = Math.hypot(vdx, vdy) || 1;
          f.vx += (vdx / vdist) * this._chaosVortexStrength * dtScale;
          f.vy += (vdy / vdist) * this._chaosVortexStrength * dtScale;
        }
        if (this._chaosWindTimer > 0) {
          f.vx += this._chaosWindX * 0.15 * dtScale;
          f.vy += this._chaosWindY * 0.15 * dtScale;
        }

        // Maintain lively constant-ish speed (with 1.85x boost when boosted)
        var targetSpeed = f.speedBoostTimer > 0 ? baseTargetSpeed * 1.85 : baseTargetSpeed;
        var curSpeed = Math.hypot(f.vx, f.vy);
        if (curSpeed < 0.01) {
          var rAng = rand(0, Math.PI * 2);
          f.vx = Math.cos(rAng) * targetSpeed;
          f.vy = Math.sin(rAng) * targetSpeed;
        } else {
          var newSpeed = curSpeed + (targetSpeed - curSpeed) * 0.08 * dtScale;
          var ratio = newSpeed / curSpeed;
          f.vx *= ratio;
          f.vy *= ratio;
        }

        f.x += f.vx * dtScale;
        f.y += f.vy * dtScale;

        // 2. Closed circular wall bounce
        var dx = f.x - this.centerX;
        var dy = f.y - this.centerY;
        var dist = Math.hypot(dx, dy);
        var maxDist = this.arenaRadius - f.radius;

        if (dist > maxDist && dist > 0.001) {
          var nx = dx / dist;
          var ny = dy / dist;
          f.x = this.centerX + nx * maxDist;
          f.y = this.centerY + ny * maxDist;

          var dot = f.vx * nx + f.vy * ny;
          if (dot > 0) {
            f.vx -= 2 * dot * nx;
            f.vy -= 2 * dot * ny;

            // Slight random angular jitter to prevent repetitive loops
            var jitter = rand(-0.07, 0.07);
            var cosJ = Math.cos(jitter);
            var sinJ = Math.sin(jitter);
            var jvx = f.vx * cosJ - f.vy * sinJ;
            var jvy = f.vx * sinJ + f.vy * cosJ;
            f.vx = jvx;
            f.vy = jvy;

            result.bounces.push({ code: f.code, force: Math.abs(dot) });
          }
        }
      }

      // 3. Flag-to-flag elastic collisions
      this._resolveCollisions(activeFlags, result.bounces);

      // 4. String cutting checks (other flags crossing a flag's strings)
      if (this.startingGraceTimer <= 0) {
        this._checkStringCuts(activeFlags, result);
        // 5. Surviving flags immediately claim open, non-overlapping space on the circle
        this._fillFreeAnchors(result);
      }

      return result;
    },

    _resolveCollisions: function (activeFlags, bounces) {
      var n = activeFlags.length;
      for (var i = 0; i < n; i++) {
        var a = activeFlags[i];
        for (var j = i + 1; j < n; j++) {
          var b = activeFlags[j];
          var dx = b.x - a.x;
          var dy = b.y - a.y;
          var minDist = a.radius + b.radius;
          var distSq = dx * dx + dy * dy;

          if (distSq < minDist * minDist && distSq > 1e-6) {
            var dist = Math.sqrt(distSq);
            var nx = dx / dist;
            var ny = dy / dist;
            var overlap = (minDist - dist) * 0.5;

            a.x -= nx * overlap;
            a.y -= ny * overlap;
            b.x += nx * overlap;
            b.y += ny * overlap;

            var rvx = b.vx - a.vx;
            var rvy = b.vy - a.vy;
            var velAlongNormal = rvx * nx + rvy * ny;

            if (velAlongNormal < 0) {
              var e = clamp(this.collisionRestitution, 0.9, 1.3);
              var imp = -(1 + e) * velAlongNormal * 0.5;
              a.vx -= imp * nx;
              a.vy -= imp * ny;
              b.vx += imp * nx;
              b.vy += imp * ny;

              bounces.push({ code: a.code, force: Math.abs(velAlongNormal) });
            }
          }
        }
      }
    },

    _wouldOverlapExistingString: function (flag, anchor) {
      var x1 = flag.x, y1 = flag.y;
      var x2 = anchor.ax, y2 = anchor.ay;

      // Do not attach through another flag's body
      for (var j = 0; j < this.flags.length; j++) {
        var otherFlag = this.flags[j];
        if (otherFlag.id === flag.id || otherFlag.eliminated) continue;
        var check = pointToSegmentDistSq(otherFlag.x, otherFlag.y, x1, y1, x2, y2);
        if (check.distSq <= otherFlag.radius * otherFlag.radius) {
          return true;
        }
      }

      // Do not cross any existing intact string
      for (var k = 0; k < this.anchors.length; k++) {
        var existing = this.anchors[k];
        if (existing.ownerId === null || existing.id === anchor.id) continue;
        var owner = this.flags[existing.ownerId];
        if (!owner || owner.eliminated) continue;
        if (segmentsIntersect(x1, y1, x2, y2, owner.x, owner.y, existing.ax, existing.ay)) {
          return true;
        }
      }
      return false;
    },

    _fillFreeAnchors: function (result) {
      // Collect available free anchors (no GC-heavy sorting)
      var free = [];
      for (var k = 0; k < this.anchors.length; k++) {
        var a = this.anchors[k];
        if (a.ownerId === null && a.cooldown <= 0) {
          free.push(a);
        }
      }
      if (free.length === 0) return;

      var active = this.getActiveFlags();
      if (active.length <= 1) return;

      // Precompute reference angles once
      var refAngles = [];
      for (var i = 0; i < active.length; i++) {
        var f = active[i];
        refAngles.push(Math.atan2(f.y - this.centerY, f.x - this.centerX));
      }

      // Immediately fill unobstructed open space in round-robin order (up to 3 passes = 24 strings/frame)
      var maxPasses = Math.min(3, free.length);
      for (var pass = 0; pass < maxPasses && free.length > 0; pass++) {
        var anyAttached = false;
        for (var j = 0; j < active.length && free.length > 0; j++) {
          var flag = active[j];
          if (flag.eliminated) continue;
          if (this._tryAttachNearestAnchor(flag, refAngles[j], free, result)) {
            anyAttached = true;
          }
        }
        if (!anyAttached) break;
      }
    },

    _tryAttachNearestAnchor: function (flag, refAngle, free, result) {
      // Pick closest unobstructed free anchor with zero allocations
      var bestIdx = -1;
      var bestDiff = Infinity;

      for (var i = 0; i < free.length; i++) {
        var a = free[i];
        var diff = Math.abs(normalizeAngle(a.angle - refAngle));
        if (diff < bestDiff && !this._wouldOverlapExistingString(flag, a)) {
          bestDiff = diff;
          bestIdx = i;
        }
      }

      if (bestIdx !== -1) {
        var best = free[bestIdx];
        best.ownerId = flag.id;
        flag.stringsRemaining++;
        // Swap-remove from free array in O(1)
        free[bestIdx] = free[free.length - 1];
        free.pop();
        if (result && result.attaches) {
          result.attaches.push({
            x: best.ax,
            y: best.ay,
            color: flag.color,
            code: flag.code
          });
        }
        return true;
      }
      return false;
    },

    _checkStringCuts: function (activeFlags, result) {
      var n = activeFlags.length;
      var activeCount = n;

      for (var k = 0; k < this.anchors.length; k++) {
        var anchor = this.anchors[k];
        if (anchor.ownerId === null) continue;

        var owner = this.flags[anchor.ownerId];
        if (!owner || owner.eliminated) {
          anchor.ownerId = null;
          continue;
        }

        for (var j = 0; j < n; j++) {
          var cutter = activeFlags[j];
          if (cutter.id === owner.id || cutter.eliminated || cutter.graceTimer > 0) continue;

          var hitR = cutter.radius * 0.9;
          var check = pointToSegmentDistSq(
            cutter.x, cutter.y,
            owner.x, owner.y,
            anchor.ax, anchor.ay
          );

          if (check.distSq <= hitR * hitR) {
            // Shield blocks a string cut
            if (owner.shields > 0 && owner.shieldCooldown <= 0) {
              owner.shields--;
              owner.shieldCooldown = 0.4;
              result.shieldSaves.push({
                code: owner.code,
                name: owner.name,
                x: check.cx,
                y: check.cy,
                shieldsLeft: owner.shields
              });
              break;
            }

            // Cut the string and free the anchor (1-frame cooldown so it fills immediately next tick)
            anchor.ownerId = null;
            anchor.cooldown = 0.03;
            owner.stringsRemaining--;
            result.cuts.push({
              x: check.cx,
              y: check.cy,
              color: owner.color,
              owner: owner.code,
              cutBy: cutter.code
            });

            if (owner.stringsRemaining <= 0 && !owner.eliminated) {
              owner.eliminated = true;
              activeCount--;
              result.eliminated.push({
                code: owner.code,
                name: owner.name,
                x: owner.x,
                y: owner.y,
                color: owner.color
              });
            }
            break;
          }
        }
      }
    },

    /* ================================================================ */
    /*  Boost / Shield / Control Helpers                                 */
    /* ================================================================ */

    boostFlag: function (idOrCode, durationSec) {
      var dur = durationSec || 2.0;
      for (var i = 0; i < this.flags.length; i++) {
        var f = this.flags[i];
        if (!f.eliminated && (f.code === idOrCode || f.id === idOrCode)) {
          f.speedBoostTimer = Math.max(f.speedBoostTimer || 0, dur);
        }
      }
    },

    cutStringsOnFlag: function (idOrCode, count) {
      var toCut = count || 1;
      for (var i = 0; i < this.flags.length; i++) {
        var f = this.flags[i];
        if (!f.eliminated && (f.code === idOrCode || f.id === idOrCode)) {
          for (var k = 0; k < this.anchors.length && toCut > 0; k++) {
            if (this.anchors[k].ownerId === f.id) {
              this.anchors[k].ownerId = null;
              f.stringsRemaining--;
              toCut--;
            }
          }
          if (f.stringsRemaining <= 0) {
            f.eliminated = true;
            return true;
          }
          return false;
        }
      }
      return false;
    },

    getActiveFlags: function () {
      var res = [];
      for (var i = 0; i < this.flags.length; i++) {
        if (!this.flags[i].eliminated) res.push(this.flags[i]);
      }
      return res;
    },

    getActiveCount: function () {
      var c = 0;
      for (var i = 0; i < this.flags.length; i++) {
        if (!this.flags[i].eliminated) c++;
      }
      return c;
    },

    getEliminatedFlags: function () {
      var res = [];
      for (var i = 0; i < this.flags.length; i++) {
        if (this.flags[i].eliminated) res.push(this.flags[i]);
      }
      return res;
    },

    getFlags: function () {
      return this.flags;
    },

    getState: function () {
      return {
        flags: this.flags,
        anchors: this.anchors,
        arenaAngle: this.arenaAngle,
        arenaRadius: this.arenaRadius,
        gapSize: 0,
        gapDegrees: 0,
        centerX: this.centerX,
        centerY: this.centerY,
        startingGraceTimer: this.startingGraceTimer,
        introTimer: this.introTimer,
        introDuration: this.introDuration
      };
    },

    setGapSize: function (degrees) {
      this.gapDegrees = degrees;
    },

    setRotationSpeed: function (multiplier) {
      this.speedMultiplier = multiplier || 1.0;
    },

    setBounce: function (multiplier) {
      this.bounceMultiplier = multiplier || 1.2;
    },

    applyForceToAll: function (fx, fy) {
      for (var i = 0; i < this.flags.length; i++) {
        if (!this.flags[i].eliminated) {
          this.flags[i].vx += fx;
          this.flags[i].vy += fy;
        }
      }
    },

    applyForceToFlag: function (idOrCode, fx, fy) {
      for (var i = 0; i < this.flags.length; i++) {
        var f = this.flags[i];
        if (!f.eliminated && (f.code === idOrCode || f.id === idOrCode)) {
          f.vx += fx;
          f.vy += fy;
        }
      }
    },

    addShield: function (idOrCode, count) {
      var add = count || 1;
      for (var i = 0; i < this.flags.length; i++) {
        var f = this.flags[i];
        if (!f.eliminated && (f.code === idOrCode || f.id === idOrCode)) {
          f.shields = (f.shields || 0) + add;
          f.speedBoostTimer = Math.max(f.speedBoostTimer || 0, 2.0);
        }
      }
    },

    rescueFlag: function (idOrCode) {
      return false;
    },

    addFlag: function (code, name, shields) {
      return null;
    },

    removeFlag: function (idOrCode) {
      for (var i = 0; i < this.flags.length; i++) {
        var f = this.flags[i];
        if (f.code === idOrCode || f.id === idOrCode) {
          f.eliminated = true;
          f.stringsRemaining = 0;
          for (var k = 0; k < this.anchors.length; k++) {
            if (this.anchors[k].ownerId === f.id) {
              this.anchors[k].ownerId = null;
            }
          }
          return true;
        }
      }
      return false;
    },

    applyChaosEffect: function (type, params) {
      params = params || {};
      switch (type) {
        case 'vortex_pull':
          this._chaosVortexTimer = params.duration || 2.0;
          this._chaosVortexStrength = params.strength || 0.45;
          break;
        case 'wind_gust':
          this._chaosWindTimer = params.duration || 1.5;
          this._chaosWindX = params.forceX || 1.5;
          this._chaosWindY = params.forceY || 0;
          break;
        case 'speed_burst':
          var mult = params.multiplier || 1.5;
          for (var i = 0; i < this.flags.length; i++) {
            if (!this.flags[i].eliminated) {
              this.flags[i].vx *= mult;
              this.flags[i].vy *= mult;
              this.flags[i].speedBoostTimer = Math.max(this.flags[i].speedBoostTimer || 0, 2.0);
            }
          }
          break;
        case 'arena_shrink':
          this.shrinkArena(params.shrinkAmount || 10, params.minRadius || 150);
          break;
      }
    },

    resetChaosEffects: function () {
      this._chaosVortexTimer = 0;
      this._chaosWindTimer = 0;
      this.arenaRadius = this.baseRadius || 215;
      this._updateAnchorPositions();
    },

    setGravity: function (gy) {
      this.gravity = gy;
    },

    shrinkArena: function (amount, minRadius) {
      var minR = minRadius || 150;
      this.arenaRadius = Math.max(minR, this.arenaRadius - (amount || 10));
      this._updateAnchorPositions();
    }
  };
})();
