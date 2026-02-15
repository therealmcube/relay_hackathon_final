
import React, { useRef, useEffect, useState } from 'react';
import { Vector, Player, Asteroid, Monster, Bullet, MonsterBullet, HeartPowerUp, Particle, Star, TrailParticle } from '../types';
import { GAME_CONSTANTS } from '../constants';

interface GameViewProps {
  isActive: boolean;
  onGameOver: (score: number, time: number) => void;
}

const GameView: React.FC<GameViewProps> = ({ isActive, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  const playerRef = useRef<Player | null>(null);
  const asteroidsRef = useRef<Asteroid[]>([]);
  const monstersRef = useRef<Monster[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const monsterBulletsRef = useRef<MonsterBullet[]>([]);
  const heartPowerUpsRef = useRef<HeartPowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const trailsRef = useRef<TrailParticle[]>([]);
  const starsRef = useRef<Star[]>([]);
  
  const scoreRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const monstersKilledRef = useRef<number>(0);
  const currentLevelRef = useRef<number>(1);
  const lastSpawnTimeRef = useRef<number>(0);
  const lastMonsterSpawnTimeRef = useRef<number>(0);
  const spawnIntervalRef = useRef<number>(GAME_CONSTANTS.INITIAL_SPAWN_INTERVAL_MS);
  const startTimeRef = useRef<number>(0);
  const keysRef = useRef<Record<string, boolean>>({});
  const lastDashTimeRef = useRef<number>(0);
  const lastShootTimeRef = useRef<number>(0);
  const shakeFramesRef = useRef<number>(0);
  const levelTextFramesRef = useRef<number>(0);

  const [hud, setHud] = useState({ score: 0, time: 0, dash: 100, hearts: 3, level: 1, bombReady: false, bombProgress: 0 });

  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < GAME_CONSTANTS.STAR_COUNT; i++) {
      stars.push({
        pos: { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight },
        size: Math.random() * 2,
        speed: Math.random() * 0.4 + 0.1,
      });
    }
    starsRef.current = stars;
  }, []);

  const createAsteroid = (width: number, height: number): Asteroid => {
    const radius = Math.random() * (GAME_CONSTANTS.ASTEROID_MAX_RADIUS - GAME_CONSTANTS.ASTEROID_MIN_RADIUS) + GAME_CONSTANTS.ASTEROID_MIN_RADIUS;
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (side === 0) { x = Math.random() * width; y = -radius; }
    else if (side === 1) { x = width + radius; y = Math.random() * height; }
    else if (side === 2) { x = Math.random() * width; y = height + radius; }
    else { x = -radius; y = Math.random() * height; }

    const targetX = width / 2 + (Math.random() - 0.5) * (width * 0.5);
    const targetY = height / 2 + (Math.random() - 0.5) * (height * 0.5);
    const angle = Math.atan2(targetY - y, targetX - x);
    const speed = Math.random() * (GAME_CONSTANTS.ASTEROID_MAX_SPEED - GAME_CONSTANTS.ASTEROID_MIN_SPEED) + GAME_CONSTANTS.ASTEROID_MIN_SPEED;

    const vertices: Vector[] = [];
    const numPoints = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numPoints; i++) {
      const vAngle = (i / numPoints) * Math.PI * 2;
      const dist = radius * (0.8 + Math.random() * 0.4);
      vertices.push({ x: Math.cos(vAngle) * dist, y: Math.sin(vAngle) * dist });
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      pos: { x, y },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      radius,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.05,
      vertices,
    };
  };

  const createMonster = (width: number, height: number): Monster => {
    const radius = GAME_CONSTANTS.MONSTER_RADIUS;
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (side === 0) { x = Math.random() * width; y = -radius; }
    else if (side === 1) { x = width + radius; y = Math.random() * height; }
    else if (side === 2) { x = Math.random() * width; y = height + radius; }
    else { x = -radius; y = Math.random() * height; }

    return {
      id: Math.random().toString(36).substr(2, 9),
      pos: { x, y },
      vel: { x: 0, y: 0 },
      radius,
      angle: Math.random() * Math.PI * 2,
      speed: GAME_CONSTANTS.MONSTER_INITIAL_SPEED,
      pulse: 0,
      lastShootTime: Date.now() + Math.random() * 2000,
    };
  };

  const createBullet = (p: Player): Bullet => {
    return {
      id: Math.random().toString(36).substr(2, 9),
      pos: { ...p.pos },
      vel: {
        x: Math.cos(p.angle) * GAME_CONSTANTS.BULLET_SPEED,
        y: Math.sin(p.angle) * GAME_CONSTANTS.BULLET_SPEED
      },
      radius: GAME_CONSTANTS.BULLET_RADIUS,
      life: GAME_CONSTANTS.BULLET_LIFE,
    };
  };

  const createMonsterBullet = (m: Monster, pPos: Vector): MonsterBullet => {
    const angle = Math.atan2(pPos.y - m.pos.y, pPos.x - m.pos.x);
    return {
      id: Math.random().toString(36).substr(2, 9),
      pos: { ...m.pos },
      vel: {
        x: Math.cos(angle) * GAME_CONSTANTS.MONSTER_BULLET_SPEED,
        y: Math.sin(angle) * GAME_CONSTANTS.MONSTER_BULLET_SPEED
      },
      radius: GAME_CONSTANTS.MONSTER_BULLET_RADIUS,
      life: 180,
    };
  };

  const createHeart = (width: number, height: number): HeartPowerUp => {
    return {
      id: Math.random().toString(36).substr(2, 9),
      pos: {
        x: Math.random() * (width - 100) + 50,
        y: Math.random() * (height - 100) + 50
      },
      radius: GAME_CONSTANTS.HEART_RADIUS,
      spawnTime: Date.now(),
      life: GAME_CONSTANTS.HEART_LIFETIME_MS,
    };
  };

  const spawnExplosion = (pos: Vector, colorSet: 'blue' | 'red' | 'yellow' | 'cyan' = 'blue') => {
    let colors = ['#22d3ee', '#0891b2', '#ffffff', '#67e8f9'];
    if (colorSet === 'red') colors = ['#ef4444', '#b91c1c', '#fecaca', '#dc2626'];
    if (colorSet === 'yellow') colors = ['#f59e0b', '#d97706', '#fef3c7', '#fbbf24'];
    if (colorSet === 'cyan') colors = ['#06b6d4', '#0891b2', '#22d3ee', '#e0f2fe'];
    
    for (let i = 0; i < GAME_CONSTANTS.PARTICLE_COUNT; i++) {
      particlesRef.current.push({
        pos: { ...pos },
        vel: { x: (Math.random() - 0.5) * 12, y: (Math.random() - 0.5) * 12 },
        radius: Math.random() * 3 + 1,
        life: GAME_CONSTANTS.PARTICLE_LIFE,
        maxLife: GAME_CONSTANTS.PARTICLE_LIFE,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  };

  const handlePlayerHit = () => {
    const p = playerRef.current;
    if (!p || !canvasRef.current || p.invulnFrames > 0) return;

    p.hearts -= 1;
    p.invulnFrames = GAME_CONSTANTS.INVULN_FRAMES;
    shakeFramesRef.current = GAME_CONSTANTS.SCREEN_SHAKE_DURATION;
    spawnExplosion(p.pos, 'blue');

    // Relocate to safe place (center)
    p.pos = { x: canvasRef.current.width / 2, y: canvasRef.current.height / 2 };
    p.vel = { x: 0, y: 0 };
    p.accel = { x: 0, y: 0 };

    if (p.hearts <= 0) {
      const finalScore = scoreRef.current;
      const finalTime = timeRef.current;
      playerRef.current = null;
      onGameOver(finalScore, finalTime);
    }
  };

  const triggerBomb = () => {
    const p = playerRef.current;
    if (!p || !p.bombReady || currentLevelRef.current < 2) return;

    p.bombReady = false;
    p.pointsSinceLastBomb = 0;
    shakeFramesRef.current = 30;

    asteroidsRef.current = asteroidsRef.current.filter(a => {
      const dist = Math.sqrt((a.pos.x - p.pos.x) ** 2 + (a.pos.y - p.pos.y) ** 2);
      if (dist < GAME_CONSTANTS.BOMB_RADIUS) {
        spawnExplosion(a.pos, 'yellow');
        scoreRef.current += GAME_CONSTANTS.POINTS_ASTEROID;
        p.pointsSinceLastBomb += GAME_CONSTANTS.POINTS_ASTEROID;
        return false;
      }
      return true;
    });

    monstersRef.current = monstersRef.current.filter(m => {
      const dist = Math.sqrt((m.pos.x - p.pos.x) ** 2 + (m.pos.y - p.pos.y) ** 2);
      if (dist < GAME_CONSTANTS.BOMB_RADIUS) {
        spawnExplosion(m.pos, 'red');
        scoreRef.current += GAME_CONSTANTS.POINTS_MONSTER;
        p.pointsSinceLastBomb += GAME_CONSTANTS.POINTS_MONSTER;
        monstersKilledRef.current += 1;
        return false;
      }
      return true;
    });

    monsterBulletsRef.current = [];

    for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2;
        particlesRef.current.push({
            pos: { ...p.pos },
            vel: { x: Math.cos(angle) * 15, y: Math.sin(angle) * 15 },
            radius: 5,
            life: 40,
            maxLife: 40,
            color: '#22d3ee'
        });
    }
  };

  const update = (time: number) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    if (isActive && !playerRef.current) {
      playerRef.current = {
        pos: { x: width / 2, y: height / 2 },
        vel: { x: 0, y: 0 },
        accel: { x: 0, y: 0 },
        angle: -Math.PI / 2,
        radius: GAME_CONSTANTS.PLAYER_RADIUS,
        dashCooldown: 0,
        dashActive: 0,
        hearts: GAME_CONSTANTS.PLAYER_MAX_HEARTS,
        invulnFrames: 0,
        bombReady: false,
        pointsSinceLastBomb: 0,
      };
      asteroidsRef.current = [];
      monstersRef.current = [];
      bulletsRef.current = [];
      monsterBulletsRef.current = [];
      heartPowerUpsRef.current = [];
      particlesRef.current = [];
      trailsRef.current = [];
      scoreRef.current = 0;
      timeRef.current = 0;
      monstersKilledRef.current = 0;
      currentLevelRef.current = 1;
      spawnIntervalRef.current = GAME_CONSTANTS.INITIAL_SPAWN_INTERVAL_MS;
      startTimeRef.current = time;
      lastSpawnTimeRef.current = time;
      lastMonsterSpawnTimeRef.current = time;
      lastShootTimeRef.current = 0;
      levelTextFramesRef.current = 0;
    }

    if (isActive && playerRef.current) {
      const p = playerRef.current;
      timeRef.current = (time - startTimeRef.current) / 1000;
      const elapsed = time - startTimeRef.current;

      // Level Transitions
      if (currentLevelRef.current === 1 && monstersKilledRef.current >= GAME_CONSTANTS.LEVEL_UP_KILLS) {
        currentLevelRef.current = 2;
        levelTextFramesRef.current = 180;
        shakeFramesRef.current = 30;
        // Grant radial blast immediately at the start of level 2
        p.bombReady = true;
        p.pointsSinceLastBomb = GAME_CONSTANTS.BOMB_POINTS_RECHARGE;
      } else if (currentLevelRef.current === 2 && monstersKilledRef.current >= GAME_CONSTANTS.LEVEL_3_KILLS_TOTAL) {
        currentLevelRef.current = 3;
        levelTextFramesRef.current = 180;
        shakeFramesRef.current = 30;
      }

      // Heart Power-up Spawning (Level 3 only)
      if (currentLevelRef.current >= 3 && p.hearts < 3) {
        if (Math.random() < GAME_CONSTANTS.HEART_SPAWN_CHANCE && heartPowerUpsRef.current.length === 0) {
          heartPowerUpsRef.current.push(createHeart(width, height));
        }
      }

      // Bomb recharge
      if (currentLevelRef.current >= 2 && !p.bombReady) {
          if (p.pointsSinceLastBomb >= GAME_CONSTANTS.BOMB_POINTS_RECHARGE) {
              p.bombReady = true;
          }
      }

      if (p.invulnFrames > 0) p.invulnFrames--;

      // Spawn Rate
      const levelFactor = Math.floor(elapsed / GAME_CONSTANTS.SPAWN_DECREMENT_INTERVAL_MS);
      spawnIntervalRef.current = Math.max(
        GAME_CONSTANTS.MIN_SPAWN_INTERVAL_MS,
        GAME_CONSTANTS.INITIAL_SPAWN_INTERVAL_MS - (levelFactor * GAME_CONSTANTS.SPAWN_DECREMENT_AMOUNT_MS)
      );

      if (time - lastSpawnTimeRef.current > spawnIntervalRef.current) {
        asteroidsRef.current.push(createAsteroid(width, height));
        lastSpawnTimeRef.current = time;
      }

      const monsterInterval = elapsed > 30000 ? GAME_CONSTANTS.MONSTER_SPAWN_FAST_MS : GAME_CONSTANTS.MONSTER_SPAWN_START_MS;
      if (time - lastMonsterSpawnTimeRef.current > monsterInterval && monstersRef.current.length < GAME_CONSTANTS.MONSTER_MAX_COUNT) {
        monstersRef.current.push(createMonster(width, height));
        lastMonsterSpawnTimeRef.current = time;
      }

      p.accel = { x: 0, y: 0 };
      if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) p.accel.y -= GAME_CONSTANTS.PLAYER_ACCEL;
      if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) p.accel.y += GAME_CONSTANTS.PLAYER_ACCEL;
      if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) p.accel.x -= GAME_CONSTANTS.PLAYER_ACCEL;
      if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) p.accel.x += GAME_CONSTANTS.PLAYER_ACCEL;

      if (keysRef.current['KeyQ']) {
          triggerBomb();
      }

      const now = Date.now();
      if ((keysRef.current['ShiftLeft'] || keysRef.current['ShiftRight']) && (now - lastDashTimeRef.current > GAME_CONSTANTS.DASH_COOLDOWN_MS)) {
        const hasInput = p.accel.x !== 0 || p.accel.y !== 0;
        const dashAngle = hasInput ? Math.atan2(p.accel.y, p.accel.x) : p.angle;
        p.vel.x += Math.cos(dashAngle) * GAME_CONSTANTS.DASH_IMPULSE;
        p.vel.y += Math.sin(dashAngle) * GAME_CONSTANTS.DASH_IMPULSE;
        lastDashTimeRef.current = now;
        p.dashActive = GAME_CONSTANTS.DASH_DURATION_FRAMES;
        shakeFramesRef.current = 5;
      }

      if (keysRef.current['Space'] && (now - lastShootTimeRef.current > GAME_CONSTANTS.BULLET_COOLDOWN_MS)) {
        bulletsRef.current.push(createBullet(p));
        lastShootTimeRef.current = now;
        p.vel.x -= Math.cos(p.angle) * 0.5;
        p.vel.y -= Math.sin(p.angle) * 0.5;
      }

      p.vel.x = (p.vel.x + p.accel.x) * GAME_CONSTANTS.PLAYER_FRICTION;
      p.vel.y = (p.vel.y + p.accel.y) * GAME_CONSTANTS.PLAYER_FRICTION;
      p.pos.x += p.vel.x;
      p.pos.y += p.vel.y;

      if (Math.abs(p.vel.x) > 0.1 || Math.abs(p.vel.y) > 0.1) {
        const targetAngle = Math.atan2(p.vel.y, p.vel.x);
        let diff = targetAngle - p.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        p.angle += diff * GAME_CONSTANTS.PLAYER_ROT_SPEED;
      }

      if (p.dashActive > 0) p.dashActive--;

      p.pos.x = Math.max(p.radius, Math.min(width - p.radius, p.pos.x));
      p.pos.y = Math.max(p.radius, Math.min(height - p.radius, p.pos.y));

      if (Math.random() > 0.3 || p.dashActive > 0) {
        trailsRef.current.push({
          pos: { 
            x: p.pos.x - Math.cos(p.angle) * p.radius, 
            y: p.pos.y - Math.sin(p.angle) * p.radius 
          },
          life: GAME_CONSTANTS.TRAIL_LIFE,
          maxLife: GAME_CONSTANTS.TRAIL_LIFE,
          size: Math.random() * 4 + 2
        });
      }

      // Heart Power-ups Update
      heartPowerUpsRef.current = heartPowerUpsRef.current.filter(h => {
        const age = Date.now() - h.spawnTime;
        const dist = Math.sqrt((h.pos.x - p.pos.x) ** 2 + (h.pos.y - p.pos.y) ** 2);
        
        if (dist < h.radius + p.radius) {
          p.hearts = Math.min(GAME_CONSTANTS.PLAYER_MAX_HEARTS, p.hearts + 1);
          spawnExplosion(h.pos, 'red');
          return false;
        }

        return age < h.life;
      });

      // Bullets Update
      bulletsRef.current = bulletsRef.current.filter(b => {
        b.pos.x += b.vel.x;
        b.pos.y += b.vel.y;
        b.life--;

        for (let i = 0; i < asteroidsRef.current.length; i++) {
          const a = asteroidsRef.current[i];
          const dist = Math.sqrt((b.pos.x - a.pos.x) ** 2 + (b.pos.y - a.pos.y) ** 2);
          if (dist < a.radius + b.radius) {
            spawnExplosion(a.pos, 'yellow');
            asteroidsRef.current.splice(i, 1);
            scoreRef.current += GAME_CONSTANTS.POINTS_ASTEROID;
            p.pointsSinceLastBomb += GAME_CONSTANTS.POINTS_ASTEROID;
            return false;
          }
        }

        for (let i = 0; i < monstersRef.current.length; i++) {
          const m = monstersRef.current[i];
          const dist = Math.sqrt((b.pos.x - m.pos.x) ** 2 + (b.pos.y - m.pos.y) ** 2);
          if (dist < m.radius + b.radius) {
            spawnExplosion(m.pos, 'red');
            monstersRef.current.splice(i, 1);
            scoreRef.current += GAME_CONSTANTS.POINTS_MONSTER;
            p.pointsSinceLastBomb += GAME_CONSTANTS.POINTS_MONSTER;
            monstersKilledRef.current += 1;
            return false;
          }
        }

        return b.life > 0 && b.pos.x > 0 && b.pos.x < width && b.pos.y > 0 && b.pos.y < height;
      });

      // Monster Bullets Update
      monsterBulletsRef.current = monsterBulletsRef.current.filter(mb => {
        mb.pos.x += mb.vel.x;
        mb.pos.y += mb.vel.y;
        mb.life--;

        const dist = Math.sqrt((mb.pos.x - p.pos.x) ** 2 + (mb.pos.y - p.pos.y) ** 2);
        if (dist < mb.radius + p.radius) {
            handlePlayerHit();
            return false;
        }

        return mb.life > 0 && mb.pos.x > 0 && mb.pos.x < width && mb.pos.y > 0 && mb.pos.y < height;
      });

      // Monsters Update
      monstersRef.current.forEach(m => {
        const targetAngle = Math.atan2(p.pos.y - m.pos.y, p.pos.x - m.pos.x);
        let diff = targetAngle - m.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        m.angle += diff * GAME_CONSTANTS.MONSTER_ROT_SPEED;
        
        const currentSpeed = m.speed + 
                            (levelFactor * GAME_CONSTANTS.MONSTER_SPEED_INC) + 
                            (monstersKilledRef.current * GAME_CONSTANTS.MONSTER_KILL_SPEED_INC);
        
        m.vel.x = Math.cos(m.angle) * currentSpeed;
        m.vel.y = Math.sin(m.angle) * currentSpeed;
        m.pos.x += m.vel.x;
        m.pos.y += m.vel.y;
        m.pulse += 0.05;

        if (currentLevelRef.current >= 2) {
            if (Date.now() - m.lastShootTime > GAME_CONSTANTS.MONSTER_SHOOT_INTERVAL_MS) {
                monsterBulletsRef.current.push(createMonsterBullet(m, p.pos));
                m.lastShootTime = Date.now();
            }
        }

        const dist = Math.sqrt((m.pos.x - p.pos.x) ** 2 + (m.pos.y - p.pos.y) ** 2);
        if (dist < m.radius + p.radius - 4) {
          handlePlayerHit();
          const angle = Math.atan2(p.pos.y - m.pos.y, p.pos.x - m.pos.x);
          p.vel.x += Math.cos(angle) * 10;
          p.vel.y += Math.sin(angle) * 10;
        }
      });

      asteroidsRef.current = asteroidsRef.current.filter(a => {
        a.pos.x += a.vel.x;
        a.pos.y += a.vel.y;
        a.rotation += a.rotationSpeed;
        const dist = Math.sqrt((a.pos.x - p.pos.x) ** 2 + (a.pos.y - p.pos.y) ** 2);
        if (dist < a.radius + p.radius - 4) {
          handlePlayerHit();
          a.vel.x *= -1;
          a.vel.y *= -1;
          return true;
        }
        return a.pos.x > -150 && a.pos.x < width + 150 && a.pos.y > -150 && a.pos.y < height + 150;
      });
    }

    starsRef.current.forEach(s => { s.pos.y += s.speed; if (s.pos.y > height) s.pos.y = 0; });
    particlesRef.current = particlesRef.current.filter(part => {
      part.pos.x += part.vel.x; part.pos.y += part.vel.y; part.life--; return part.life > 0;
    });
    trailsRef.current = trailsRef.current.filter(t => { t.life--; return t.life > 0; });

    ctx.save();
    if (shakeFramesRef.current > 0) {
      const amt = shakeFramesRef.current * 0.8;
      ctx.translate((Math.random() - 0.5) * amt, (Math.random() - 0.5) * amt);
      shakeFramesRef.current--;
    }

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    starsRef.current.forEach(s => {
      ctx.beginPath(); ctx.arc(s.pos.x, s.pos.y, s.size, 0, Math.PI * 2); ctx.fill();
    });

    trailsRef.current.forEach(t => {
      const opacity = t.life / t.maxLife;
      ctx.fillStyle = `rgba(34, 211, 238, ${opacity * 0.5})`;
      ctx.beginPath(); ctx.arc(t.pos.x, t.pos.y, t.size * opacity, 0, Math.PI * 2); ctx.fill();
    });

    asteroidsRef.current.forEach(a => {
      ctx.save(); ctx.translate(a.pos.x, a.pos.y); ctx.rotate(a.rotation);
      ctx.beginPath(); ctx.moveTo(a.vertices[0].x, a.vertices[0].y);
      for (let i = 1; i < a.vertices.length; i++) ctx.lineTo(a.vertices[i].x, a.vertices[i].y);
      ctx.closePath();
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, a.radius);
      grad.addColorStop(0, '#475569'); grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad; ctx.fill();
      ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    });

    // Draw Heart Power-ups
    heartPowerUpsRef.current.forEach(h => {
      ctx.save();
      ctx.translate(h.pos.x, h.pos.y);
      const pulse = Math.sin(Date.now() / 200) * 0.2 + 1;
      const timeLeft = h.life - (Date.now() - h.spawnTime);
      const alpha = timeLeft < 1000 ? timeLeft / 1000 : 1;
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ef4444';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ef4444';
      
      const r = h.radius * pulse;
      ctx.beginPath();
      ctx.moveTo(0, r / 2.5);
      ctx.bezierCurveTo(r / 2, -r / 2, r * 1.5, r / 3, 0, r);
      ctx.bezierCurveTo(-r * 1.5, r / 3, -r / 2, -r / 2, 0, r / 2.5);
      ctx.fill();
      ctx.restore();
    });

    bulletsRef.current.forEach(b => {
      ctx.save();
      ctx.translate(b.pos.x, b.pos.y);
      const bGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, b.radius * 3);
      bGlow.addColorStop(0, 'rgba(34, 211, 238, 0.6)');
      bGlow.addColorStop(1, 'rgba(34, 211, 238, 0)');
      ctx.fillStyle = bGlow;
      ctx.beginPath(); ctx.arc(0, 0, b.radius * 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath(); ctx.arc(0, 0, b.radius, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    monsterBulletsRef.current.forEach(mb => {
      ctx.save();
      ctx.translate(mb.pos.x, mb.pos.y);
      const mbGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, mb.radius * 3);
      mbGlow.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
      mbGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = mbGlow;
      ctx.beginPath(); ctx.arc(0, 0, mb.radius * 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(0, 0, mb.radius, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    monstersRef.current.forEach(m => {
      ctx.save();
      ctx.translate(m.pos.x, m.pos.y);
      ctx.rotate(m.angle);
      const pulseAmt = Math.sin(m.pulse) * 4;
      const mGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, m.radius * 2);
      mGlow.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
      mGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = mGlow;
      ctx.beginPath(); ctx.arc(0, 0, m.radius * 2 + pulseAmt, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(m.radius, 0);
      ctx.lineTo(-m.radius, m.radius * 0.8);
      ctx.lineTo(-m.radius * 0.5, 0);
      ctx.lineTo(-m.radius, -m.radius * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fecaca'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    });

    particlesRef.current.forEach(part => {
      ctx.globalAlpha = part.life / part.maxLife; ctx.fillStyle = part.color;
      ctx.beginPath(); ctx.arc(part.pos.x, part.pos.y, part.radius, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    if (playerRef.current) {
      const p = playerRef.current;
      ctx.save();
      ctx.translate(p.pos.x, p.pos.y);
      ctx.rotate(p.angle);
      
      if (p.invulnFrames % 10 < 5) {
          const pGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius * 2.5);
          pGlow.addColorStop(0, p.dashActive > 0 ? 'rgba(255, 255, 255, 0.6)' : 'rgba(34, 211, 238, 0.4)');
          pGlow.addColorStop(1, 'rgba(34, 211, 238, 0)');
          ctx.fillStyle = pGlow;
          ctx.beginPath(); ctx.arc(0, 0, p.radius * 2.5, 0, Math.PI * 2); ctx.fill();

          ctx.fillStyle = p.dashActive > 0 ? '#ffffff' : '#22d3ee';
          ctx.beginPath();
          ctx.moveTo(p.radius, 0); 
          ctx.lineTo(-p.radius, p.radius * 0.7); 
          ctx.lineTo(-p.radius * 0.4, 0); 
          ctx.lineTo(-p.radius, -p.radius * 0.7); 
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.fillStyle = '#083344';
          ctx.beginPath(); ctx.arc(p.radius * 0.2, 0, p.radius * 0.25, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    if (levelTextFramesRef.current > 0) {
        ctx.save();
        ctx.fillStyle = '#22d3ee';
        ctx.font = '900 64px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = Math.min(1, levelTextFramesRef.current / 30);
        ctx.fillText(`LEVEL ${currentLevelRef.current}`, width / 2, height / 2);
        ctx.font = '400 24px Inter';
        const msg = currentLevelRef.current === 2 
            ? 'MONSTER FIREWALL BREACHED - RADIAL BLAST UNLOCKED [Q]' 
            : 'BIO-RESTORE CORE ONLINE - INTEGRITY HEARTS DETECTED';
        ctx.fillText(msg, width / 2, height / 2 + 50);
        ctx.restore();
        levelTextFramesRef.current--;
    }

    ctx.restore();
    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    const kd = (e: KeyboardEvent) => { keysRef.current[e.code] = true; };
    const ku = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    requestRef.current = requestAnimationFrame(update);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    const hudInterval = setInterval(() => {
      const now = Date.now();
      const diff = now - lastDashTimeRef.current;
      const p = playerRef.current;
      if (p) {
          setHud({
            score: scoreRef.current,
            time: timeRef.current,
            dash: Math.min(100, (diff / GAME_CONSTANTS.DASH_COOLDOWN_MS) * 100),
            hearts: p.hearts,
            level: currentLevelRef.current,
            bombReady: p.bombReady,
            bombProgress: Math.min(100, (p.pointsSinceLastBomb / GAME_CONSTANTS.BOMB_POINTS_RECHARGE) * 100)
          });
      }
    }, 50);
    return () => clearInterval(hudInterval);
  }, [isActive]);

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 z-10" />
      {isActive && (
        <div className="absolute top-8 left-8 z-20 pointer-events-none flex flex-col gap-6">
          <div className="flex gap-12">
            <div className="flex flex-col gap-1">
              <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Score</span>
              <span className="text-4xl font-mono text-cyan-400 drop-shadow-md">
                {hud.score}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Level</span>
              <span className="text-4xl font-mono text-white drop-shadow-md">
                {hud.level}
              </span>
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Integrity</span>
                <div className="flex gap-2">
                    {[...Array(GAME_CONSTANTS.PLAYER_MAX_HEARTS)].map((_, i) => (
                        <div key={i} className={`w-6 h-6 rounded-full border-2 border-red-500 flex items-center justify-center ${i < hud.hearts ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-transparent'}`}>
                            {i < hud.hearts && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                    ))}
                </div>
            </div>
          </div>
          
          <div className="flex gap-12">
            <div className="flex flex-col gap-2">
                <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Thruster Capacitor [SHIFT]</span>
                <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-100 ${hud.dash >= 100 ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-slate-600'}`}
                        style={{ width: `${hud.dash}%` }}
                    />
                </div>
            </div>

            {hud.level >= 2 && (
                <div className="flex flex-col gap-2">
                    <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Radial Blast [Q]</span>
                    <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-100 ${hud.bombReady ? 'bg-orange-400 shadow-[0_0_10px_#fb923c]' : 'bg-slate-700'}`}
                            style={{ width: `${hud.bombProgress}%` }}
                        />
                    </div>
                    {hud.bombReady && <span className="text-[10px] text-orange-400 font-black animate-pulse tracking-tighter uppercase">READY</span>}
                </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default GameView;
