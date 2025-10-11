// src/components/MarineVisualizer/canvasEffect.js

let animationId = null;
let windParticles = [];
let oceanParticles = [];

export function drawMarineCanvasEffect(canvas, data) {
  if (!canvas || !data) {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    windParticles = [];
    oceanParticles = [];
    return;
  }

  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  // Extract data with fallbacks
  let windSpeed = data.wind?.wind_speed_10m || 0;
  let windDir = (data.wind?.wind_direction_10m || 0) * (Math.PI / 180);
  const weatherCode = data.wind?.weather_code || 0;
  const pressure = data.wind?.surface_pressure || 1013;

  const waveHeight = data.wave?.wave_height || 0;
  const waveDir = (data.wave?.wave_direction || 0) * (Math.PI / 180);
  const swellHeight = data.ocean?.swell_wave_height?.[0] || 0;
  const swellDir = (data.ocean?.swell_wave_direction?.[0] || 0) * (Math.PI / 180);
  const oceanVel = data.ocean?.ocean_current_velocity?.[0] || 0;
  const oceanDir = (data.ocean?.ocean_current_direction?.[0] || 0) * (Math.PI / 180);

  // ⚡ Storm adjustment
  let stormIntensity = 1;
  if (weatherCode >= 95) {
    stormIntensity = 1.6;
    windSpeed *= stormIntensity;
    windDir += (Math.random() - 0.5) * 0.6;
  }
  if (pressure && pressure < 995) {
    const pressureEffect = (995 - pressure) / 20;
    stormIntensity *= (1 + pressureEffect * 0.3);
    const swirl = (Math.PI / 8) * pressureEffect;
    windDir -= swirl;
    windSpeed *= stormIntensity;
  }

  // 🌬️ WIND PARTICLE SYSTEM
  const windParticleCount = Math.min(150, 30 + Math.round(windSpeed * 3));
  
  if (windParticles.length === 0 || windParticles.length !== windParticleCount) {
    windParticles = Array.from({ length: windParticleCount }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * 0.7, // Wind mostly in upper part of screen
      speed: 0.8 + Math.random() * (windSpeed / 25),
      dir: windDir + (Math.random() * 0.4 - 0.2),
      size: Math.random() * 1.0 + 0.5,
      opacity: Math.random() * 0.6 + 0.2,
      turbulence: Math.random() * 0.8 + 0.2,
    }));
  }

  // 🌊 OCEAN PARTICLE SYSTEM
  const oceanParticleCount = Math.min(100, 20 + Math.round(waveHeight * 15 + oceanVel * 10));
  
  if (oceanParticles.length === 0 || oceanParticles.length !== oceanParticleCount) {
    oceanParticles = Array.from({ length: oceanParticleCount }, () => ({
      x: Math.random() * W,
      y: H * 0.7 + Math.random() * H * 0.3, // Ocean mostly in lower part
      speed: 0.1 + Math.random() * (oceanVel * 0.8),
      dir: oceanDir + (Math.random() * 0.3 - 0.15),
      size: Math.random() * 2.5 + 1.0,
      opacity: Math.random() * 0.5 + 0.3,
      waveInfluence: Math.random() * 0.5 + 0.3,
      depth: Math.random(), // 0-1 for vertical position in water column
    }));
  }

  // Movement vectors
  const windDriftX = Math.cos(windDir) * windSpeed * 0.08;
  const windDriftY = Math.sin(windDir) * windSpeed * 0.08;
  const oceanDriftX = Math.cos(oceanDir) * oceanVel * 1.5;
  const oceanDriftY = Math.sin(oceanDir) * oceanVel * 1.5;

  // 🌊 Draw waves
  function drawWaves() {
    const time = Date.now() / 1000;
    
    // Primary wind-driven waves
    ctx.strokeStyle = `rgba(100, 180, 255, ${0.4 + waveHeight * 0.1})`;
    ctx.lineWidth = 1.2 + waveHeight * 0.8;
    ctx.beginPath();
    
    for (let x = 0; x < W; x += 6) {
      const windWave = Math.sin((x / 60) + time * 1.8) * waveHeight * 15;
      const swellWave = Math.sin((x / 200) + time * 0.6) * swellHeight * 10;
      const y = H * 0.75 + windWave + swellWave;
      
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Wave foam/whitecaps (increased with wind)
    if (windSpeed > 20 || waveHeight > 1.5) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + (windSpeed / 100)})`;
      for (let x = 0; x < W; x += 40) {
        if (Math.random() > 0.7) {
          const foamY = H * 0.75 + 
            Math.sin((x / 60) + time * 1.8) * waveHeight * 15 +
            Math.sin((x / 200) + time * 0.6) * swellHeight * 10;
          ctx.beginPath();
          ctx.arc(x, foamY, 2 + Math.random() * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);

    const time = Date.now() / 1000;

    // 🌬️ Update and draw WIND particles
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)"; // White for wind
    windParticles.forEach((p) => {
      // Base wind movement
      p.x += Math.cos(p.dir) * p.speed + windDriftX;
      p.y += Math.sin(p.dir) * p.speed + windDriftY;
      
      // Storm turbulence
      if (stormIntensity > 1) {
        p.x += (Math.random() - 0.5) * p.turbulence * stormIntensity * 0.5;
        p.y += (Math.random() - 0.5) * p.turbulence * stormIntensity * 0.5;
      }
      
      // Gentle vertical variation
      p.y += Math.sin(time * 3 + p.x * 0.01) * 0.1;

      // Wrap around edges
      if (p.x > W + 10) p.x = -10;
      if (p.x < -10) p.x = W + 10;
      if (p.y > H * 0.8) p.y = 10; // Don't go too deep into ocean
      if (p.y < 0) p.y = H * 0.8;

      // Draw wind particle (streak-like for wind effect)
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      // Draw as small streak in wind direction
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(
        p.x - Math.cos(p.dir) * 4, 
        p.y - Math.sin(p.dir) * 4
      );
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = p.size;
      ctx.stroke();
      ctx.restore();
    });

    // 🌊 Update and draw OCEAN particles
    oceanParticles.forEach((p) => {
      // Base ocean current movement
      p.x += Math.cos(p.dir) * p.speed + oceanDriftX * (1 - p.depth * 0.5);
      p.y += Math.sin(p.dir) * p.speed + oceanDriftY * (1 - p.depth * 0.5);
      
      // Wave motion (stronger near surface)
      const surfaceEffect = (1 - p.depth) * p.waveInfluence;
      const waveMotion = Math.sin((p.x / 80) + time * 2) * waveHeight * 2 * surfaceEffect;
      p.y += waveMotion * 0.3;
      p.x += Math.cos((p.x / 100) + time * 1.5) * waveHeight * 0.5 * surfaceEffect;
      
      // Gentle circular motion for floating particles
      p.x += Math.sin(time * 0.5 + p.y * 0.02) * 0.2;
      p.y += Math.cos(time * 0.5 + p.x * 0.02) * 0.2;

      // Keep in ocean area
      if (p.x > W + 15) p.x = -15;
      if (p.x < -15) p.x = W + 15;
      if (p.y > H) p.y = H * 0.7;
      if (p.y < H * 0.7) p.y = H * 0.7 + Math.random() * 10;

      // Draw ocean particle (bubble-like)
      ctx.fillStyle = `rgba(100, 200, 255, ${p.opacity * (0.7 + p.depth * 0.3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Bubble highlight
      ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.3})`;
      ctx.beginPath();
      ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });

    drawWaves();
    
    animationId = requestAnimationFrame(animate);
  }

  animate();
}

export function cleanupMarineCanvasEffect() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  windParticles = [];
  oceanParticles = [];
}