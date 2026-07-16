/**
 * Daimoku Grow - Procedural Plant Renderer
 * Uses HTML5 Canvas to draw a highly stylized, beautiful plant
 * that sways, grows, shrinks, and changes color based on hours, health, and mood.
 */

const PlantRenderer = (function() {
  try {
  let canvas = null;
  let ctx = null;
  let animationId = null;
  let windTime = 0;
  
  // Private helper for deterministic random generation (prevents frame jitter)
  function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
  
  // Private helper for recursive branch drawing
  function drawBranchRecursive(length, thickness, bendAngle, depth, maxDepth, branchId, masterScale, woodColor, leafColors, tips) {
    ctx.save();
    
    // Draw the branch curve in 3 segments
    const segments = 3;
    const segLength = length / segments;
    ctx.strokeStyle = woodColor;
    ctx.lineCap = 'round';
    
    // Wind sway propagates: tips sway more
    const windSway = Math.sin(windTime * 0.8 + depth + branchId) * 0.035 * (currentHealth / 100);
    
    for (let i = 0; i < segments; i++) {
      const currentThickness = thickness * (1 - (i / segments) * 0.25 * (depth === maxDepth ? 0.5 : 1));
      ctx.lineWidth = currentThickness * masterScale;
      
      const angle = bendAngle / segments + windSway / segments;
      ctx.rotate(angle);
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -segLength);
      ctx.stroke();
      ctx.translate(0, -segLength);
    }
    
    // If leaf tip (depth === 1), collect coordinates and draw flowers
    if (depth === 1) {
      const matrix = ctx.getTransform();
      const dpr = window.devicePixelRatio || 1;
      tips.push({
        x: matrix.e / dpr,
        y: matrix.f / dpr,
        angle: Math.atan2(matrix.b, matrix.a),
        branchId: branchId
      });
      
      // Draw flowers if healthy & mature (and not dead)
      if (!isDead && currentHealth > 40) {
        const stageInfo = getGrowthStage(currentHours);
        if (stageInfo.stage === 5) {
          drawFlower(0, 0, 7 * masterScale);
        } else if (stageInfo.stage === 6 && currentHealth > 50) {
          const blossomColors = ['#ff7bbd', '#ff9ebe', '#ffd3e2', '#cc99ff', '#ffb3d9'];
          const petalColor = blossomColors[branchId % blossomColors.length];
          drawFlower(0, 0, 9 * masterScale, petalColor);
        }
      }
    } else {
      // Recurse: split branches
      const nextLength = length * 0.72;
      const nextThickness = thickness * 0.65;
      const stageInfo = getGrowthStage(currentHours);
      
      if (stageInfo.stage === 3) {
        drawBranchRecursive(nextLength, nextThickness, -0.4, depth - 1, maxDepth, branchId * 2 + 1, masterScale, woodColor, leafColors, tips);
        drawBranchRecursive(nextLength, nextThickness, 0.4, depth - 1, maxDepth, branchId * 2 + 2, masterScale, woodColor, leafColors, tips);
      } else if (stageInfo.stage === 4) {
        drawBranchRecursive(nextLength, nextThickness, -0.55, depth - 1, maxDepth, branchId * 2 + 1, masterScale, woodColor, leafColors, tips);
        drawBranchRecursive(nextLength, nextThickness, 0.55, depth - 1, maxDepth, branchId * 2 + 2, masterScale, woodColor, leafColors, tips);
      } else if (stageInfo.stage === 5) {
        drawBranchRecursive(nextLength, nextThickness, -0.65, depth - 1, maxDepth, branchId * 3 + 1, masterScale, woodColor, leafColors, tips);
        drawBranchRecursive(nextLength * 0.85, nextThickness, 0.1, depth - 1, maxDepth, branchId * 3 + 2, masterScale, woodColor, leafColors, tips);
        drawBranchRecursive(nextLength, nextThickness, 0.65, depth - 1, maxDepth, branchId * 3 + 3, masterScale, woodColor, leafColors, tips);
      } else if (stageInfo.stage === 6) {
        drawBranchRecursive(nextLength, nextThickness, -0.72, depth - 1, maxDepth, branchId * 4 + 1, masterScale, woodColor, leafColors, tips);
        drawBranchRecursive(nextLength, nextThickness, 0.72, depth - 1, maxDepth, branchId * 4 + 2, masterScale, woodColor, leafColors, tips);
        drawBranchRecursive(nextLength * 0.8, nextThickness, -0.22, depth - 1, maxDepth, branchId * 4 + 3, masterScale, woodColor, leafColors, tips);
        drawBranchRecursive(nextLength * 0.8, nextThickness, 0.22, depth - 1, maxDepth, branchId * 4 + 4, masterScale, woodColor, leafColors, tips);
      }
    }
    
    ctx.restore();
  }
  
  // Plant State
  let currentHours = 0;
  let currentHealth = 100;
  let isDead = false;
  let isChanting = false;
  let targetHours = 333;
  let skyBackgroundSetting = 'diurnal';
  let currentStreak = 0;
  
  // Ambient Glowing Particles
  let ambientParticles = [];

  // Cinematic Scenery Particle Engines States
  let rainParticles = [];
  let rainSplashes = [];
  let sakuraPetals = [];
  let snowParticles = [];
  let qatarFlameParticles = [];
  let searchlightAngle = 0;

  // Swipe & Tap Sway Physics
  let userWindForce = 0;
  let plantSwayAngle = 0;
  let plantSwayVelocity = 0;
  let isPointerActive = false;
  let lastPointerX = 0;
  
  // Drifting Clouds State
  let clouds = [
    { x: 50, y: 50, speed: 0.08, scale: 0.95, opacity: 0.65 },
    { x: 180, y: 80, speed: 0.06, scale: 1.50, opacity: 0.58 },
    { x: 300, y: 30, speed: 0.11, scale: 0.85, opacity: 0.70 }
  ];
  
  // Lion Animation State Machine Variables
  let lionState = 'offscreen'; // 'offscreen', 'walking-in', 'sitting', 'walking-out'
  let lionX = -1000;
  let walkBob = 0;
  
  // Pot Styles configurations (explicitly customized by user)
  let currentPotStyle = 'clay';
  const potStyles = {
    clay: { rim: '#d4896a', body: '#be6f50', shadow: '#964d32', accent: '#5e2714' },
    lotus: { rim: '#ffd3e2', body: '#ff7bbd', shadow: '#d64b91', accent: '#f5c65a' },
    marble: { rim: '#f2f2f2', body: '#e0e0e0', shadow: '#b3b3b3', accent: '#7f8c8d' },
    jade: { rim: '#9ee2b2', body: '#62c382', shadow: '#3a9254', accent: '#1a4a27' }
  };

  // Theme Color Configurations
  const colors = {
    soil: '#4e3b31',
    leaves: {
      healthy: ['#6b8e6b', '#7fa87f', '#557255', '#8bb48b'],
      thirsty: ['#8bb582', '#a2cc97', '#739e6a', '#b7dfad'], // Pale green
      sad: ['#8fa87a', '#a6bf90', '#748c60', '#b9d4a3'],     // Dry sage green
      dying: ['#bca88a', '#d4c5a3', '#9c8c72', '#c2b595'],   // Faded dry parched yellow-brown
      dead: ['#8e7a68', '#967d64', '#7a624e', '#a68d75']     // Parched dry brown/tan
    },
    wood: {
      healthy: '#70543e',
      dry: '#856a56',
      dead: '#7d664c' // Parched dry bark brown
    },
    flower: {
      petal: '#fdfaf2',
      center: '#e5ad35'
    }
  };

  let resizeObserver = null;

  /**
   * Initialize the renderer on a canvas
   */
  function init(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    
    // Set up high DPI support and responsive resizing
    resizeCanvas();
    
    if (window.ResizeObserver) {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      resizeObserver = new ResizeObserver(() => {
        resizeCanvas();
      });
      resizeObserver.observe(canvas);
    } else {
      window.addEventListener('resize', resizeCanvas);
    }

    // Setup Pointer Listeners for Swipe / Tap Physics
    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', (e) => {
      isPointerActive = true;
      lastPointerX = e.clientX;
      canvas.style.cursor = 'grabbing';
      
      // Tap impact on plants (temporary velocity impulse)
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // If tap is near the center tree trunk/pot
      const clickDistX = Math.abs(x - rect.width / 2);
      if (clickDistX < 85 && y > rect.height * 0.35) {
        plantSwayVelocity += (x < rect.width / 2 ? 0.04 : -0.04);
      }
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!isPointerActive) return;
      const deltaX = e.clientX - lastPointerX;
      lastPointerX = e.clientX;
      
      // Convert swipe speed to wind force
      userWindForce += deltaX * 0.0015;
    });

    canvas.addEventListener('pointerup', () => {
      isPointerActive = false;
      canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('pointercancel', () => {
      isPointerActive = false;
      canvas.style.cursor = 'grab';
    });
    
    // Start the physics/sway loop
    startAnimation();
  }

  /**
   * Resize canvas for Retina/High-DPI screens
   */
  function resizeCanvas() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    let w = rect.width;
    let h = rect.height;
    
    // Fallback if the canvas is hidden or hasn't laid out yet
    if (w === 0 || h === 0) {
      w = parseInt(canvas.getAttribute('width')) || 400;
      h = parseInt(canvas.getAttribute('height')) || 420;
    }
    
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }

  /**
   * Set the plant parameters and queue a redraw
   */
  function updateState(hours, health, deadState, chantingState, targetHoursParam = 333, targetsList = [], skyBg = 'diurnal', userStreak = 0) {
    currentHours = hours;
    currentHealth = health;
    isDead = deadState || (health <= 0);
    isChanting = !!chantingState;
    targetHours = Math.max(1, targetHoursParam);
    ambientParticles = ambientParticles || []; // safeguard
    activeTargets = targetsList || [];
    skyBackgroundSetting = skyBg || 'diurnal';
    currentStreak = userStreak || 0;
  }

  /**
   * Main animation loop
   */
  function startAnimation() {
    if (animationId) return;
    
    function loop() {
      try {
        // Wind speed increases slightly if the plant is happy
        const windSpeed = isDead ? 0.005 : (currentHealth > 70 ? 0.02 : 0.012);
        windTime += windSpeed;
        
        // Update user swipe wind sway spring physics
        const accel = -0.045 * plantSwayAngle - 0.085 * plantSwayVelocity + userWindForce;
        plantSwayVelocity += accel;
        plantSwayAngle += plantSwayVelocity;
        userWindForce *= 0.88; // dampen user wind force
        
        // Update clouds drift physics
        const w = canvas ? canvas.width / (window.devicePixelRatio || 1) : 400;
        clouds.forEach(cloud => {
          cloud.x += cloud.speed;
          if (cloud.x > w + 100 * cloud.scale) {
            cloud.x = -100 * cloud.scale;
            cloud.y = 20 + Math.random() * 90;
            cloud.speed = 0.05 + Math.random() * 0.12;
            cloud.scale = 0.75 + Math.random() * 0.85;
            cloud.opacity = 0.50 + Math.random() * 0.35;
          }
        });
        
        draw();
        animationId = requestAnimationFrame(loop);
      } catch (err) {
        console.error("Error in animation loop:", err);
        cancelAnimationFrame(animationId);
        animationId = null;
        var banner = document.getElementById('debug-error-banner');
        if (banner) {
          banner.style.display = 'block';
          banner.innerHTML += 'Caught animation loop error: ' + err.message + '\nStack:\n' + err.stack + '\n\n';
        }
      }
    }
    
    animationId = requestAnimationFrame(loop);
  }

  function stopAnimation() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  /**
   * Determine the current growth stage based on chanting hours
   */
  function getGrowthStage(hours) {
    const T = targetHours;
    if (hours <= 0) return { stage: 1, name: 'Seed' };
    if (hours <= T * (10 / 333)) return { stage: 2, name: 'Sprout' };
    if (hours <= T * (50 / 333)) return { stage: 3, name: 'Seedling' };
    if (hours <= T * (150 / 333)) return { stage: 4, name: 'Young Plant' };
    if (hours <= T * (332 / 333)) return { stage: 5, name: 'Mature Shrub' };
    return { stage: 6, name: 'Majestic Tree' };
  }

  /**
   * Determine the plant mood based on health
   */
  function getPlantMood(health, deadState) {
    if (deadState || health <= 0) return 'Withered';
    if (health <= 10) return 'Dying';
    if (health <= 40) return 'Sad';
    if (health <= 70) return 'Thirsty';
    return 'Happy';
  }

  /**
   * Helper: Get leaf color palette based on health and growth stage
   */
  function getLeafColors(health, deadState) {
    if (deadState || health <= 0) return colors.leaves.dead;
    if (health <= 10) return colors.leaves.dying;
    if (health <= 40) return colors.leaves.sad;
    if (health <= 70) return colors.leaves.thirsty;
    
    // Healthy green leaf color progression based on growth stage
    const stageInfo = getGrowthStage(currentHours);
    if (stageInfo.stage === 2) {
      // Sprout: Light lime-green
      return ['#aed581', '#c5e1a5', '#9ccc65', '#d4e157'];
    }
    if (stageInfo.stage === 3) {
      // Seedling: Soft kelly-green
      return ['#81c784', '#a5d6a7', '#66bb6a', '#4caf50'];
    }
    if (stageInfo.stage === 4) {
      // Young Plant: True medium green
      return ['#4caf50', '#81c784', '#388e3c', '#2e7d32'];
    }
    if (stageInfo.stage === 5) {
      // Shrub: Deep organic green
      return ['#2e7d32', '#4caf50', '#1b5e20', '#388e3c'];
    }
    // Stage 6 (Tree) or default: Majestic green
    return ['#388e3c', '#4caf50', '#2e7d32', '#81c784'];
  }

  function drawLeaf(x, y, length, width, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // Smooth drop shadow for leaf depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(length / 2, -width / 2, length, 0);
    ctx.quadraticCurveTo(length / 2, width / 2, 0, 0);
    ctx.closePath();
    
    // Leaf gradient from base color to a warm highlight tip
    const leafGrad = ctx.createLinearGradient(0, 0, length, 0);
    leafGrad.addColorStop(0, color);
    leafGrad.addColorStop(1, '#a2cc97');
    
    ctx.fillStyle = leafGrad;
    ctx.fill();
    
    // Reset shadow for vein drawing
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Soft center vein
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length * 0.8, 0);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
  }

  /**
   * Helper: Draw a single Peepal leaf (heart-shaped with a long tail tip)
   */
  function drawPeepalLeaf(x, y, length, width, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // Soft drop shadow for leaf depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.16)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(length * 0.1, -width * 0.5, length * 0.4, -width * 0.6, length * 0.7, -width * 0.1);
    ctx.quadraticCurveTo(length * 0.85, 0, length, 0);
    ctx.quadraticCurveTo(length * 0.85, 0, length * 0.7, width * 0.1);
    ctx.bezierCurveTo(length * 0.4, width * 0.6, length * 0.1, width * 0.5, 0, 0);
    ctx.closePath();
    
    // Premium multi-stop gradient for Peepal leaf (base color to glowing lime tip)
    const leafGrad = ctx.createLinearGradient(0, 0, length, 0);
    leafGrad.addColorStop(0, color);
    leafGrad.addColorStop(0.7, '#8bd48b');
    leafGrad.addColorStop(1, '#a2e3a2');
    
    ctx.fillStyle = leafGrad;
    ctx.fill();
    
    // Reset shadow for vein drawing
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Central vein
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length * 0.8, 0);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    
    ctx.restore();
  }

  /**
   * Helper: Draw a custom Lotus target seed (Teal progress target)
   */
  function drawLotusSeed(x, y, progress, masterScale) {
    ctx.save();
    ctx.translate(x, y);
    
    // Scale grows with target progress (up to 1.0)
    const scale = Math.min(1.0, progress) * masterScale;
    if (scale <= 0.05) {
      ctx.restore();
      return;
    }
    
    // 1. Draw teal lotus leaf base pad
    ctx.fillStyle = '#26a69a';
    ctx.beginPath();
    ctx.ellipse(0, 4, 15 * scale, 4.5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 2. Draw stem curving slightly
    ctx.strokeStyle = '#4db6ac';
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.quadraticCurveTo(-4 * scale, -8 * scale, 0, -18 * scale);
    ctx.stroke();
    
    // Translate to flower bud top
    ctx.translate(0, -18 * scale);
    ctx.rotate(plantSwayAngle * 0.45); // slight physics sway
    
    // 3. Draw flower
    ctx.fillStyle = '#ff80ab'; // Pink lotus glow
    if (progress < 0.25) {
      // Small bud stage
      ctx.beginPath();
      ctx.ellipse(0, 0, 3.5 * scale, 5.5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (progress < 0.70) {
      // Partially open petals
      for (let i = -1; i <= 1; i++) {
        ctx.save();
        ctx.rotate(i * 0.3);
        ctx.beginPath();
        ctx.ellipse(0, -2 * scale, 4 * scale, 7.5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else {
      // Full radiant bloom
      ctx.save();
      ctx.shadowColor = 'rgba(255, 128, 171, 0.65)';
      ctx.shadowBlur = 6;
      
      // Outer petals
      for (let i = -2; i <= 2; i++) {
        ctx.save();
        ctx.rotate(i * 0.42);
        ctx.beginPath();
        ctx.ellipse(0, -3 * scale, 4.5 * scale, 9.5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      
      // Golden center core
      ctx.beginPath();
      ctx.arc(0, -4.5 * scale, 3.5 * scale, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd54f';
      ctx.fill();
      ctx.restore();
    }
    
    ctx.restore();
  }

  /**
   * Helper: Draw a custom Bamboo target seed (Coral/Gold progress target)
   */
  function drawBambooSeed(x, y, progress, masterScale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(plantSwayAngle * 0.35); // sway slightly with touch/wind
    
    const scale = Math.min(1.0, progress) * masterScale;
    if (scale <= 0.05) {
      ctx.restore();
      return;
    }
    
    const maxSegments = Math.max(1, Math.floor(progress * 4.5));
    const segmentH = 9 * masterScale;
    
    ctx.strokeStyle = '#66bb6a';
    ctx.fillStyle = '#81c784';
    ctx.lineWidth = 3.8 * scale;
    
    let currentY = 0;
    for (let i = 0; i < maxSegments; i++) {
      // Segment body
      ctx.beginPath();
      ctx.moveTo(0, currentY);
      ctx.lineTo(0, currentY - segmentH);
      ctx.stroke();
      
      // Segment node bulge ring
      ctx.beginPath();
      ctx.arc(0, currentY - segmentH, 2.8 * scale, 0, Math.PI * 2);
      ctx.fillStyle = '#4caf50';
      ctx.fill();
      
      // Sprouts alternate sides
      if (i > 0) {
        ctx.save();
        ctx.translate(0, currentY - segmentH / 2);
        ctx.rotate(i % 2 === 0 ? 0.75 : -0.75);
        ctx.beginPath();
        ctx.quadraticCurveTo(9 * scale, -2 * scale, 13 * scale, 0);
        ctx.quadraticCurveTo(7 * scale, 2 * scale, 0, 0);
        ctx.fillStyle = '#66bb6a';
        ctx.fill();
        ctx.restore();
      }
      
      currentY -= segmentH;
    }
    
    ctx.restore();
  }

  /**
   * Helper: Draw a flower with customizable petal color
   */
  function drawFlower(x, y, size, petalColor = colors.flower.petal) {
    ctx.save();
    ctx.translate(x, y);
    
    // Petals
    ctx.fillStyle = petalColor;
    for (let i = 0; i < 5; i++) {
      ctx.rotate((Math.PI * 2) / 5);
      ctx.beginPath();
      ctx.arc(size * 0.6, 0, size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Flower center
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = colors.flower.center;
    ctx.fill();
    
    ctx.restore();
  }

  /**
   * Helper: Draw a flying bird with flapping wings
   */
  function drawFlyingBird(bx, by, isFirstBird) {
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(1.8, 1.8); // Scale for flyer
    
    // Wing flap angle
    const flap = Math.sin(windTime * 25);
    
    // Bird body
    ctx.fillStyle = isFirstBird ? '#8ca6cc' : '#f5b041'; // Bird 1 soft blue, Bird 2 warm orange/yellow
    ctx.beginPath();
    ctx.arc(0, 0, 5, Math.PI, 0); // half circle body
    ctx.fill();
    
    // Wing
    ctx.fillStyle = isFirstBird ? '#6b8cbd' : '#d35400';
    ctx.beginPath();
    // Ellipse oriented vertically for flapping
    ctx.ellipse(-1, -1, 4, 3 + flap * 2, -0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    ctx.beginPath();
    ctx.arc(3.5, -3.5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(4.5, -4.5, 0.7, 0, Math.PI * 2);
    ctx.fill();
    
    // Beak
    ctx.fillStyle = '#e5ad35';
    ctx.beginPath();
    ctx.moveTo(6.5, -3.5); ctx.lineTo(9.5, -2.5); ctx.lineTo(6.5, -1.5); ctx.fill();
    
    ctx.restore();
  }

  /**
   * Helper: Draw a single cloud procedurally
   */
  function drawCloud(cx, cy, scale, opacity, cloudColor) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.fillStyle = cloudColor;
    ctx.globalAlpha = opacity;
    
    ctx.beginPath();
    ctx.arc(0, 0, 18, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(15, -12, 22, Math.PI * 1.0, Math.PI * 2.0);
    ctx.arc(42, -8, 18, Math.PI * 1.3, Math.PI * 2.2);
    ctx.arc(55, 0, 16, Math.PI * 1.5, Math.PI * 0.5);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }

  function updateAndDrawAmbientParticles(w, h) {
    const potX = w / 2;
    const potY = h - 98;
    const rimH = 14;
    const soilY = potY + rimH - 3;
    
    const maxParticles = isChanting ? 35 : 20;
    const spawnChance = isChanting ? 0.35 : 0.15;
    
    if (ambientParticles.length < maxParticles && Math.random() < spawnChance && !isDead) {
      ambientParticles.push({
        x: potX + (Math.random() - 0.5) * 140,
        y: soilY - 5,
        vy: -0.35 - Math.random() * 0.6,
        vx: (Math.random() - 0.5) * 0.4,
        size: 1.0 + Math.random() * 2.0,
        alpha: 0.3 + Math.random() * 0.6,
        fadeSpeed: 0.0018 + Math.random() * 0.0025,
        color: Math.random() > 0.4 ? '255, 215, 0' : '162, 227, 162'
      });
    }
    
    ctx.save();
    for (let i = ambientParticles.length - 1; i >= 0; i--) {
      const p = ambientParticles[i];
      p.y += p.vy;
      p.x += p.vx + Math.sin(windTime * 0.8 + p.y * 0.015) * 0.22;
      p.alpha -= p.fadeSpeed;
      
      if (p.y < 20 || p.alpha <= 0) {
        ambientParticles.splice(i, 1);
        continue;
      }
      
      ctx.beginPath();
      const grad = ctx.createRadialGradient(p.x, p.y, 0.1, p.x, p.y, p.size * 3.5);
      grad.addColorStop(0, `rgba(${p.color}, ${p.alpha})`);
      grad.addColorStop(0.5, `rgba(${p.color}, ${p.alpha * 0.4})`);
      grad.addColorStop(1, `rgba(${p.color}, 0)`);
      
      ctx.fillStyle = grad;
      ctx.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Main Draw Function
   */
  function draw() {
    if (!canvas || !ctx) return;
    
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    
    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Determine Diurnal Phase: Sunrise (5-9), Day (9-17), Sunset (17-20), Night (20-5)
    let phase = skyBackgroundSetting || 'diurnal';
    if (phase === 'diurnal') {
      const nowHour = new Date().getHours();
      if (nowHour >= 5 && nowHour < 9) {
        phase = 'sunrise';
      } else if (nowHour >= 9 && nowHour < 17) {
        phase = 'day';
      } else if (nowHour >= 17 && nowHour < 20) {
        phase = 'sunset';
      } else {
        phase = 'night';
      }
    }
    
    const isNight = phase === 'night' || phase === 'bustlingcity' || phase === 'rainforest';

    // Sky Background Rendering
    if (phase === 'sunrise') {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#ffd3b6'); // Soft peach sunrise
      skyGrad.addColorStop(0.5, '#ffaaa5'); // Soft rose
      skyGrad.addColorStop(1, '#d4a5b8'); // Lavender base
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Drifting Mist/Fog for Sunrise
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let i = 0; i < 3; i++) {
        const y = h * 0.45 + i * 45 + Math.sin(windTime * 0.4 + i) * 8;
        const xOffset = (windTime * (12 + i * 4)) % (w + 400) - 200;
        ctx.beginPath();
        ctx.ellipse(xOffset, y, 160, 20, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (phase === 'day') {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#e8f0fe'); // Light sky blue
      skyGrad.addColorStop(1, '#faf7f2'); // Soft cream base
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Rising Golden flares/beams for Day
      ctx.fillStyle = 'rgba(255, 223, 128, 0.08)';
      for (let i = 0; i < 6; i++) {
        const speed = 8 + i * 3;
        const size = 12 + i * 4;
        const x = (i * 75 + Math.sin(windTime * 0.4 + i) * 15) % w;
        const y = (h - (windTime * speed) % (h + 80));
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (phase === 'sunset') {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#a88be8'); // Sunset violet
      skyGrad.addColorStop(0.5, '#ff8a7a'); // Warm orange-pink
      skyGrad.addColorStop(1, '#fec85a'); // Golden glow
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Sunset twilight rays
      ctx.fillStyle = 'rgba(254, 200, 90, 0.04)';
      for (let i = 0; i < 4; i++) {
        const angle = 0.15 + i * 0.35 + Math.sin(windTime * 0.15) * 0.04;
        ctx.beginPath();
        ctx.moveTo(w * 0.85, h * 0.25);
        ctx.lineTo(w * 0.85 + Math.cos(angle - 0.12) * 550, h * 0.25 + Math.sin(angle - 0.12) * 550);
        ctx.lineTo(w * 0.85 + Math.cos(angle + 0.12) * 550, h * 0.25 + Math.sin(angle + 0.12) * 550);
        ctx.closePath();
        ctx.fill();
      }
    } else if (phase === 'night') {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0b0f19'); // Dark midnight sky
      skyGrad.addColorStop(0.5, '#151a30'); // Twilight navy
      skyGrad.addColorStop(1, '#202640'); // Indigo glow
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Draw Twinkling Stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      const starPositions = [
        { x: w * 0.20, y: h * 0.15, r: 1.2 },
        { x: w * 0.38, y: h * 0.08, r: 0.8 },
        { x: w * 0.78, y: h * 0.22, r: 1.5 },
        { x: w * 0.88, y: h * 0.10, r: 1.0 },
        { x: w * 0.15, y: h * 0.30, r: 0.9 },
        { x: w * 0.52, y: h * 0.18, r: 1.1 },
        { x: w * 0.28, y: h * 0.25, r: 1.3 },
        { x: w * 0.68, y: h * 0.12, r: 1.0 },
        { x: w * 0.82, y: h * 0.30, r: 0.7 }
      ];
      starPositions.forEach(star => {
        ctx.save();
        ctx.beginPath();
        const twinkle = Math.sin(windTime * 3.5 + star.x) * 0.35;
        ctx.arc(star.x, star.y, Math.max(0.4, star.r + twinkle), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    } else if (phase === 'rainforest') {
      // 1. Rainforest Backdrop Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#040d06'); // Deep forest canopy shadow
      skyGrad.addColorStop(0.4, '#0a1f0f'); // Dark emerald
      skyGrad.addColorStop(1, '#1c4222'); // Soft mossy green
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 1.5 Distant Forest Layer (Dense tree silhouettes)
      ctx.save();
      ctx.fillStyle = 'rgba(6, 22, 10, 0.30)';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w + 40; x += 45) {
        ctx.arc(x, h - 85 - Math.sin(x * 0.02) * 15, 35, 0, Math.PI * 2);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 1.6 Midground Forest Layer (Varying height palm/broad tree clusters)
      ctx.save();
      ctx.fillStyle = 'rgba(10, 35, 15, 0.58)';
      for (let i = 0; i < 7; i++) {
        const tx = w * 0.15 * i + 10;
        const ty = h - 60 - (i % 3) * 15;
        // trunk
        ctx.fillRect(tx - 2, ty, 4, h - ty);
        // palm head
        ctx.save();
        ctx.translate(tx, ty);
        for (let j = 0; j < 6; j++) {
          ctx.rotate(Math.PI / 3);
          ctx.beginPath();
          ctx.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.restore();

      // 2. Cinematic Sunbeams (God Rays)
      ctx.save();
      const beamGrad = ctx.createRadialGradient(w * 0.3, 0, 10, w * 0.3, 0, w * 0.8);
      beamGrad.addColorStop(0, 'rgba(255, 255, 220, 0.15)');
      beamGrad.addColorStop(0.5, 'rgba(220, 255, 220, 0.04)');
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = beamGrad;
      for (let i = 0; i < 3; i++) {
        const angle = 0.6 + i * 0.4 + Math.sin(windTime * 0.15 + i) * 0.05;
        ctx.beginPath();
        ctx.moveTo(w * 0.3, 0);
        ctx.lineTo(w * 0.3 + Math.cos(angle - 0.1) * 600, Math.sin(angle - 0.1) * 600);
        ctx.lineTo(w * 0.3 + Math.cos(angle + 0.1) * 600, Math.sin(angle + 0.1) * 600);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 3. Volumetric Fog Waves
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
      for (let f = 0; f < 2; f++) {
        const speed = 0.2 + f * 0.1;
        const waveH = 15 + f * 10;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 15) {
          const y = h * 0.5 + f * 60 + Math.sin(x * 0.01 + windTime * speed) * waveH;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 4. Foreground Detailed Rainforest Canopy & Vines (Left/Right Framing)
      ctx.save();
      ctx.fillStyle = 'rgba(3, 10, 4, 0.94)';
      
      // Left Trunk & Branches
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.quadraticCurveTo(w * 0.1, h - 90, 0, h - 180);
      ctx.lineTo(0, 0);
      ctx.lineTo(w * 0.08, 0);
      ctx.quadraticCurveTo(w * 0.22, h * 0.20, w * 0.28, h * 0.25);
      ctx.quadraticCurveTo(w * 0.15, h * 0.32, w * 0.05, h - 90);
      ctx.lineTo(w * 0.05, h);
      ctx.closePath();
      ctx.fill();

      // Right Trunk & Branches
      ctx.beginPath();
      ctx.moveTo(w, h);
      ctx.quadraticCurveTo(w * 0.9, h - 90, w, h - 180);
      ctx.lineTo(w, 0);
      ctx.lineTo(w * 0.92, 0);
      ctx.quadraticCurveTo(w * 0.78, h * 0.18, w * 0.72, h * 0.22);
      ctx.quadraticCurveTo(w * 0.85, h * 0.30, w * 0.95, h - 90);
      ctx.lineTo(w * 0.95, h);
      ctx.closePath();
      ctx.fill();

      // Swaying fern leaves on left/right foreground branches
      const branchSway = Math.sin(windTime * 0.7) * 0.04;
      ctx.save();
      ctx.translate(w * 0.28, h * 0.25);
      ctx.rotate(branchSway);
      ctx.beginPath();
      ctx.ellipse(0, 0, 32, 12, 0.8, 0, Math.PI * 2);
      ctx.ellipse(-15, 15, 25, 9, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(w * 0.72, h * 0.22);
      ctx.rotate(-branchSway);
      ctx.beginPath();
      ctx.ellipse(0, 0, 30, 11, -0.8, 0, Math.PI * 2);
      ctx.ellipse(15, 12, 22, 8, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Vine 1 (hanging from left branch)
      ctx.strokeStyle = 'rgba(3, 10, 4, 0.94)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let y = h * 0.25; y < h * 0.65; y += 5) {
        const x = w * 0.20 + Math.sin(y * 0.03 + windTime * 0.5) * 8;
        if (y === h * 0.25) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        if (y % 20 === 0) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.sin(y + windTime) * 0.3);
          ctx.beginPath();
          ctx.ellipse(0, 0, 8, 4, 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.stroke();

      // Vine 2 (hanging from right branch)
      ctx.beginPath();
      for (let y = h * 0.22; y < h * 0.55; y += 5) {
        const x = w * 0.78 + Math.sin(y * 0.02 + windTime * 0.4) * 6;
        if (y === h * 0.22) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        if (y % 15 === 0) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.sin(y + windTime) * 0.3);
          ctx.beginPath();
          ctx.ellipse(0, 0, 7, 3.5, -0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.stroke();
      ctx.restore();

      // 5. Cinematic Rain Engine (Multi-Layer Depth)
      if (rainParticles.length === 0) {
        for (let i = 0; i < 45; i++) {
          rainParticles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            len: 8 + Math.random() * 12,
            speed: 12 + Math.random() * 8,
            thick: 0.5 + Math.random() * 1.0,
            opacity: 0.08 + Math.random() * 0.12
          });
        }
      }
      // Draw & Update Rain
      rainParticles.forEach(p => {
        ctx.strokeStyle = `rgba(175, 235, 185, ${p.opacity})`;
        ctx.lineWidth = p.thick;
        ctx.beginPath();
        // Fall angled slightly by wind
        const drift = Math.sin(windTime * 0.1) * 1.5;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + drift, p.y + p.len);
        ctx.stroke();

        p.y += p.speed;
        p.x += drift;

        // Reset if offscreen
        const potY = h - 98;
        if (p.y > potY) {
          // 6. Spawn Splash Ripple on hit soil
          if (p.x > w * 0.3 && p.x < w * 0.7 && Math.random() < 0.25) {
            rainSplashes.push({
              x: p.x,
              y: potY + Math.random() * 8,
              r: 0.5,
              maxR: 3 + Math.random() * 5,
              opacity: 0.35
            });
          }
          p.y = -20;
          p.x = Math.random() * w;
        }
      });

      // Update & Draw Splashes
      rainSplashes.forEach((s, idx) => {
        ctx.strokeStyle = `rgba(165, 235, 175, ${s.opacity})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, s.r, s.r * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();

        s.r += 0.45;
        s.opacity -= 0.035;
        if (s.opacity <= 0 || s.r > s.maxR) {
          rainSplashes.splice(idx, 1);
        }
      });

      // 7. Fluttering Drifting Forest Leaves (Tumbling 3D)
      if (sakuraPetals.length === 0 || sakuraPetals[0].isFlower) {
        // Clear old petals if switching theme
        sakuraPetals = [];
        for (let i = 0; i < 4; i++) {
          sakuraPetals.push({
            x: Math.random() * w,
            y: Math.random() * h * 0.8,
            size: 6 + Math.random() * 5,
            speedY: 0.8 + Math.random() * 0.8,
            speedX: 0.3 + Math.random() * 0.5,
            pitch: Math.random() * Math.PI,
            spinSpeed: 0.02 + Math.random() * 0.03,
            color: Math.random() < 0.5 ? '#2b5c32' : '#3c8246',
            isLeaf: true
          });
        }
      }
      sakuraPetals.forEach(l => {
        ctx.save();
        ctx.translate(l.x, l.y);
        // Apply 3D-like scale on pitch (cosine of pitch creates vertical squashing)
        ctx.scale(1.0, Math.max(0.1, Math.cos(l.pitch)));
        ctx.rotate(l.pitch * 0.5);
        ctx.fillStyle = l.color;
        ctx.beginPath();
        // Leaf shape
        ctx.moveTo(0, -l.size);
        ctx.quadraticCurveTo(l.size * 0.7, 0, 0, l.size);
        ctx.quadraticCurveTo(-l.size * 0.7, 0, 0, -l.size);
        ctx.fill();
        ctx.restore();

        l.y += l.speedY;
        l.x += l.speedX + Math.sin(windTime * 0.5 + l.y) * 0.4;
        l.pitch += l.spinSpeed;

        if (l.y > h + 15) {
          l.y = -15;
          l.x = Math.random() * w;
        }
      });
    } else if (phase === 'cherryblossoms') {
      // 1. Dawn Gradient Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#ffeeee'); // Soft peach glow
      skyGrad.addColorStop(0.5, '#ffd2e3'); // Warm sakura pink
      skyGrad.addColorStop(1, '#dbbce8'); // Lavender base
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 2.5 Far Background Soft Cherry Blossom Hills
      ctx.save();
      ctx.fillStyle = 'rgba(255, 174, 201, 0.20)';
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.quadraticCurveTo(w * 0.25, h - 50, w * 0.50, h - 35);
      ctx.quadraticCurveTo(w * 0.75, h - 55, w, h - 30);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = 'rgba(235, 150, 180, 0.15)';
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.quadraticCurveTo(w * 0.35, h - 30, w * 0.70, h - 45);
      ctx.quadraticCurveTo(w * 0.85, h - 35, w, h - 20);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 2. Cinematic Sun Burst & Lens Flare
      ctx.save();
      const sunX = w * 0.20;
      const sunY = h * 0.20;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 95);
      sunGlow.addColorStop(0, 'rgba(255, 235, 235, 0.40)');
      sunGlow.addColorStop(0.3, 'rgba(255, 200, 210, 0.15)');
      sunGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 95, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. Detailed Textured Cherry Tree Branch (Top-Right)
      ctx.save();
      ctx.fillStyle = 'rgba(56, 32, 42, 0.85)';
      ctx.translate(w, 0);
      ctx.rotate(Math.sin(windTime * 0.5) * 0.02);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-50, 20, -110, 35);
      ctx.quadraticCurveTo(-60, 45, 0, 15);
      ctx.fill();

      // Draw blossom clusters on branch
      ctx.fillStyle = 'rgba(255, 160, 185, 0.9)';
      const clusters = [
        { cx: -40, cy: 15, r: 12 },
        { cx: -75, cy: 30, r: 10 },
        { cx: -105, cy: 32, r: 8 },
        { cx: -60, cy: 22, r: 11 },
        { cx: -90, cy: 35, r: 9 }
      ];
      clusters.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
        ctx.arc(c.cx - 5, c.cy + 3, c.r * 0.8, 0, Math.PI * 2);
        ctx.arc(c.cx + 5, c.cy - 2, c.r * 0.8, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // 3.5 Second Detailed Cherry Tree Branch (Top-Left)
      ctx.save();
      ctx.fillStyle = 'rgba(56, 32, 42, 0.85)';
      ctx.translate(0, 0);
      ctx.rotate(Math.sin(windTime * 0.4 + 1.0) * 0.02);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(50, 20, 110, 35);
      ctx.quadraticCurveTo(60, 45, 0, 15);
      ctx.fill();

      // Draw blossom clusters on left branch
      ctx.fillStyle = 'rgba(255, 150, 180, 0.9)';
      const leftClusters = [
        { cx: 40, cy: 15, r: 12 },
        { cx: 75, cy: 30, r: 10 },
        { cx: 105, cy: 32, r: 8 },
        { cx: 60, cy: 22, r: 11 },
        { cx: 90, cy: 35, r: 9 }
      ];
      leftClusters.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
        ctx.arc(c.cx - 5, c.cy + 3, c.r * 0.8, 0, Math.PI * 2);
        ctx.arc(c.cx + 5, c.cy - 2, c.r * 0.8, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // 4. Detailed 3D Sakura Petal Shower
      if (sakuraPetals.length === 0 || !sakuraPetals[0].isFlower) {
        sakuraPetals = [];
        for (let i = 0; i < 28; i++) {
          sakuraPetals.push({
            x: Math.random() * (w + 100) - 50,
            y: Math.random() * h,
            size: 4 + Math.random() * 5,
            speedY: 0.9 + Math.random() * 0.9,
            speedX: -1.2 - Math.random() * 0.8,
            pitch: Math.random() * Math.PI,
            spinSpeed: 0.015 + Math.random() * 0.025,
            r: Math.random() * Math.PI * 2,
            isFlower: true
          });
        }
      }
      sakuraPetals.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(1.0, Math.max(0.1, Math.cos(p.pitch)));
        ctx.rotate(p.r);
        
        // Draw organic petal shape (heart-like)
        ctx.fillStyle = 'rgba(255, 175, 200, 0.9)';
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.bezierCurveTo(p.size, -p.size, p.size, p.size, 0, p.size);
        ctx.bezierCurveTo(-p.size, p.size, -p.size, -p.size, 0, -p.size);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        p.y += p.speedY;
        p.x += p.speedX + Math.sin(windTime * 0.4 + p.y) * 0.3;
        p.pitch += p.spinSpeed;
        p.r += 0.01;

        if (p.y > h + 15 || p.x < -15) {
          p.y = -15;
          p.x = w + 15 + Math.random() * 50;
        }
      });

      // 5. Glowing Yellow Blossom Pollen Particles
      ctx.fillStyle = 'rgba(255, 245, 180, 0.28)';
      for (let i = 0; i < 15; i++) {
        const px = (i * 32 + windTime * 6) % w;
        const py = (h - (windTime * (12 + i * 2)) % h);
        ctx.beginPath();
        const pSize = 1.0 + Math.sin(windTime * 1.5 + i) * 0.8;
        ctx.arc(px, py, Math.max(0.5, pSize), 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (phase === 'mountains') {
      // 1. Cinematic Cloudy Daytime Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#a5bcd0');    // Muted sky blue
      skyGrad.addColorStop(0.5, '#dae6ee');  // Soft cloud mist white
      skyGrad.addColorStop(1, '#f1f6f9');    // Soft light grey-blue at horizon
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Daytime Drifting Overcast Clouds
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      // Cloud 1
      let cx1 = (w * 0.15 + windTime * 2.5) % (w + 160) - 80;
      let cy1 = h * 0.20;
      ctx.beginPath();
      ctx.arc(cx1, cy1, 28, 0, Math.PI * 2);
      ctx.arc(cx1 + 22, cy1 - 10, 35, 0, Math.PI * 2);
      ctx.arc(cx1 + 45, cy1, 25, 0, Math.PI * 2);
      ctx.fill();

      // Cloud 2
      let cx2 = (w * 0.65 - windTime * 1.5) % (w + 200) - 100;
      if (cx2 < -100) cx2 += (w + 200);
      let cy2 = h * 0.12;
      ctx.beginPath();
      ctx.arc(cx2, cy2, 32, 0, Math.PI * 2);
      ctx.arc(cx2 + 25, cy2 - 12, 40, 0, Math.PI * 2);
      ctx.arc(cx2 + 50, cy2, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. Far Background Craggy Peaks (Procedural Ridge Vector)
      ctx.fillStyle = 'rgba(130, 155, 175, 0.45)';
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, h * 0.56);
      ctx.lineTo(w * 0.15, h * 0.44);
      ctx.lineTo(w * 0.28, h * 0.49);
      ctx.lineTo(w * 0.38, h * 0.41);
      ctx.lineTo(w * 0.52, h * 0.55);
      ctx.lineTo(w * 0.65, h * 0.45);
      ctx.lineTo(w * 0.78, h * 0.51);
      ctx.lineTo(w * 0.88, h * 0.43);
      ctx.lineTo(w, h * 0.54);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Draw Snow caps on Far Peaks
      ctx.fillStyle = '#ffffff';
      // Peak at w * 0.15
      ctx.beginPath();
      ctx.moveTo(w * 0.11, h * 0.47);
      ctx.lineTo(w * 0.15, h * 0.44);
      ctx.lineTo(w * 0.19, h * 0.46);
      ctx.quadraticCurveTo(w * 0.15, h * 0.48, w * 0.11, h * 0.47);
      ctx.fill();
      // Peak at w * 0.38
      ctx.beginPath();
      ctx.moveTo(w * 0.34, h * 0.44);
      ctx.lineTo(w * 0.38, h * 0.41);
      ctx.lineTo(w * 0.43, h * 0.45);
      ctx.quadraticCurveTo(w * 0.38, h * 0.465, w * 0.34, h * 0.44);
      ctx.fill();
      // Peak at w * 0.65
      ctx.beginPath();
      ctx.moveTo(w * 0.61, h * 0.48);
      ctx.lineTo(w * 0.65, h * 0.45);
      ctx.lineTo(w * 0.70, h * 0.48);
      ctx.quadraticCurveTo(w * 0.65, h * 0.50, w * 0.61, h * 0.48);
      ctx.fill();
      // Peak at w * 0.88
      ctx.beginPath();
      ctx.moveTo(w * 0.84, h * 0.46);
      ctx.lineTo(w * 0.88, h * 0.43);
      ctx.lineTo(w * 0.92, h * 0.46);
      ctx.quadraticCurveTo(w * 0.88, h * 0.48, w * 0.84, h * 0.46);
      ctx.fill();

      // 4. Volumetric Intermediate Parallax Fog (Drifts between ridges)
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 10) {
        const y = h * 0.53 + Math.sin(x * 0.015 + windTime * 0.12) * 12;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 5. Midground Craggy Ridge (Shaded Peak Slopes)
      ctx.fillStyle = 'rgba(90, 115, 135, 0.70)';
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, h * 0.68);
      ctx.lineTo(w * 0.22, h * 0.54);
      ctx.lineTo(w * 0.34, h * 0.60);
      ctx.lineTo(w * 0.48, h * 0.51);
      ctx.lineTo(w * 0.62, h * 0.65);
      ctx.lineTo(w * 0.76, h * 0.55);
      ctx.lineTo(w * 0.88, h * 0.61);
      ctx.lineTo(w, h * 0.69);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Draw Snow caps on Midground Peaks
      ctx.fillStyle = '#ffffff';
      // Peak at w * 0.22
      ctx.beginPath();
      ctx.moveTo(w * 0.17, h * 0.57);
      ctx.lineTo(w * 0.22, h * 0.54);
      ctx.lineTo(w * 0.27, h * 0.565);
      ctx.quadraticCurveTo(w * 0.22, h * 0.59, w * 0.17, h * 0.57);
      ctx.fill();
      // Peak at w * 0.48
      ctx.beginPath();
      ctx.moveTo(w * 0.43, h * 0.54);
      ctx.lineTo(w * 0.48, h * 0.51);
      ctx.lineTo(w * 0.54, h * 0.56);
      ctx.quadraticCurveTo(w * 0.48, h * 0.565, w * 0.43, h * 0.54);
      ctx.fill();
      // Peak at w * 0.76
      ctx.beginPath();
      ctx.moveTo(w * 0.71, h * 0.575);
      ctx.lineTo(w * 0.76, h * 0.55);
      ctx.lineTo(w * 0.81, h * 0.575);
      ctx.quadraticCurveTo(w * 0.76, h * 0.60, w * 0.71, h * 0.575);
      ctx.fill();

      // 6. Volumetric Foreground Parallax Fog
      ctx.save();
      ctx.fillStyle = 'rgba(240, 245, 250, 0.28)';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 10) {
        const y = h * 0.66 + Math.cos(x * 0.02 + windTime * 0.22) * 15;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 7. Foreground Dark Cliff Silhouettes
      ctx.fillStyle = 'rgba(45, 62, 78, 0.90)';
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, h * 0.80);
      ctx.lineTo(w * 0.30, h * 0.72);
      ctx.lineTo(w * 0.65, h * 0.84);
      ctx.lineTo(w * 0.82, h * 0.75);
      ctx.lineTo(w, h * 0.83);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Draw edge snow on foreground cliffs
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.80);
      ctx.lineTo(w * 0.30, h * 0.72);
      ctx.lineTo(w * 0.65, h * 0.84);
      ctx.lineTo(w * 0.82, h * 0.75);
      ctx.lineTo(w, h * 0.83);
      ctx.lineTo(w, h * 0.845);
      ctx.lineTo(w * 0.82, h * 0.765);
      ctx.lineTo(w * 0.65, h * 0.855);
      ctx.lineTo(w * 0.30, h * 0.735);
      ctx.lineTo(0, h * 0.815);
      ctx.closePath();
      ctx.fill();

      // 7. Windswept Fine Snow Motes
      if (snowParticles.length === 0) {
        for (let i = 0; i < 30; i++) {
          snowParticles.push({
            x: Math.random() * w,
            y: Math.random() * h * 0.8,
            r: 0.6 + Math.random() * 1.2,
            speedX: 1.5 + Math.random() * 2.0,
            speedY: 0.2 + Math.random() * 0.5,
            wobble: Math.random() * Math.PI
          });
        }
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      snowParticles.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();

        s.x += s.speedX;
        s.y += s.speedY + Math.sin(s.wobble + windTime) * 0.3;
        s.wobble += 0.05;

        if (s.x > w + 10) {
          s.x = -10;
          s.y = Math.random() * h * 0.8;
        }
      });
    } else if (phase === 'beach') {
      // 1. Photorealistic Tropical Horizon sunset
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#e0f7fa'); // Ocean horizon turquoise
      skyGrad.addColorStop(0.35, '#ffea75'); // Solar gold
      skyGrad.addColorStop(0.65, '#ff9e80'); // Warm tangerine
      skyGrad.addColorStop(0.9, '#ff8a80'); // Soft blush rose
      skyGrad.addColorStop(1, '#ffccbc'); // Dune sand peach
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Horizon Low Setting Sun
      const sunX = w * 0.80;
      const sunY = h - 130;
      ctx.save();
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 75);
      sunGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      sunGlow.addColorStop(0.4, 'rgba(255, 235, 170, 0.35)');
      sunGlow.addColorStop(1, 'rgba(255, 204, 128, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 75, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. Specular Water Reflection Trail (Vertical solar bloom)
      ctx.save();
      const trailGrad = ctx.createLinearGradient(sunX - 35, sunY, sunX + 35, h);
      trailGrad.addColorStop(0, 'rgba(255, 250, 210, 0.30)');
      trailGrad.addColorStop(0.5, 'rgba(255, 235, 170, 0.15)');
      trailGrad.addColorStop(1, 'rgba(255, 200, 150, 0)');
      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.moveTo(sunX - 5, sunY + 15);
      ctx.lineTo(sunX + 5, sunY + 15);
      ctx.lineTo(sunX + 60, h);
      ctx.lineTo(sunX - 60, h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 4. Overlapping Translucent Waves & Seafoam
      ctx.save();
      const waveColors = [
        'rgba(128, 222, 234, 0.20)', // Distant wave
        'rgba(77, 208, 225, 0.30)',  // Mid wave
        'rgba(38, 198, 218, 0.40)'   // Near shore wave
      ];
      waveColors.forEach((color, idx) => {
        const offset = idx * 25;
        const waveSpeed = 1.0 + idx * 0.4;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 10) {
          const waveY = h - 75 + offset + Math.sin(x * 0.04 + windTime * waveSpeed + idx) * 4;
          ctx.lineTo(x, waveY);
          
          // Generate seafoam particles at wave crests
          if (idx === 2 && x % 25 === 0 && Math.random() < 0.15) {
            rainSplashes.push({
              x: x,
              y: waveY + Math.random() * 4,
              r: 0.5,
              maxR: 2 + Math.random() * 3,
              opacity: 0.45
            });
          }
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
      });

      // Render Seafoam Bubble ripples
      rainSplashes.forEach((s, idx) => {
        ctx.strokeStyle = `rgba(255, 255, 255, ${s.opacity})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, s.r, s.r * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();

        s.r += 0.25;
        s.opacity -= 0.025;
        if (s.opacity <= 0 || s.r > s.maxR) {
          rainSplashes.splice(idx, 1);
        }
      });
      ctx.restore();

      // 5. Helper to draw an animated-movie style smooth palm tree with comb-like fronds
      function drawPalmTree(baseX, baseY, trunkH, bendDir, scale) {
        ctx.save();
        
        // 1. Draw smooth curved trunk path
        ctx.beginPath();
        for (let i = 0; i <= 20; i++) {
          const t = i / 20;
          const wVal = (14 - t * 7.5) * scale;
          const cx = baseX + Math.sin(t * 1.45) * 80 * bendDir;
          const cy = baseY - t * trunkH;
          if (i === 0) ctx.moveTo(cx - wVal, cy);
          else ctx.lineTo(cx - wVal, cy);
        }
        for (let i = 20; i >= 0; i--) {
          const t = i / 20;
          const wVal = (14 - t * 7.5) * scale;
          const cx = baseX + Math.sin(t * 1.45) * 80 * bendDir;
          const cy = baseY - t * trunkH;
          ctx.lineTo(cx + wVal, cy);
        }
        ctx.closePath();

        // Bark gradient
        const trunkGrad = ctx.createLinearGradient(baseX - 10, baseY, baseX + 10, baseY - trunkH);
        trunkGrad.addColorStop(0, '#3e2723'); // Deep cocoa bark
        trunkGrad.addColorStop(0.5, '#5d4037'); // Warm highlight wood
        trunkGrad.addColorStop(1, '#2d1d18'); // Top shadow
        ctx.fillStyle = trunkGrad;
        ctx.fill();

        // 2. Draw soft bark ring creases
        ctx.strokeStyle = 'rgba(28, 18, 12, 0.4)';
        ctx.lineWidth = 1.2 * scale;
        for (let i = 1; i < 20; i++) {
          const t = i / 20;
          const cx = baseX + Math.sin(t * 1.45) * 80 * bendDir;
          const cy = baseY - t * trunkH;
          const wVal = (14 - t * 7.5) * scale;
          ctx.beginPath();
          ctx.ellipse(cx, cy, wVal, 2.5 * scale, 0, Math.PI, 0, false);
          ctx.stroke();
        }

        // Get canopy top coordinates
        const topT = 1.0;
        const topX = baseX + Math.sin(topT * 1.45) * 80 * bendDir;
        const topY = baseY - topT * trunkH;
        
        ctx.translate(topX, topY);
        const sway = Math.sin(windTime * 0.8) * 0.05;

        // 3. Draw Coconuts
        ctx.fillStyle = 'rgba(38, 20, 12, 0.95)';
        ctx.beginPath();
        ctx.arc(-6 * scale, 6 * scale, 6 * scale, 0, Math.PI * 2);
        ctx.arc(4 * scale, 7 * scale, 5.5 * scale, 0, Math.PI * 2);
        ctx.fill();

        // 4. Draw 8 Comb-style Palm Fronds
        const frondAngles = [-1.1, -0.8, -0.5, -0.2, 0.1, 0.4, 0.7, 1.0];
        frondAngles.forEach((baseAngle, idx) => {
          ctx.save();
          const angle = baseAngle + sway;
          ctx.rotate(angle);
          
          const length = (85 + (idx % 3) * 12) * scale;
          const cpX = length * 0.5;
          const cpY = 22 * scale;
          const endX = length;
          const endY = -5 * scale;
          
          // Draw main green spine
          ctx.strokeStyle = 'rgba(27, 94, 32, 0.95)';
          ctx.lineWidth = 2.5 * scale;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(cpX, cpY, endX, endY);
          ctx.stroke();
          
          // Draw comb-like leaflets branching downwards
          ctx.strokeStyle = 'rgba(34, 112, 41, 0.92)';
          ctx.lineWidth = 1.8 * scale;
          for (let f = 5; f < length; f += 4) {
            const lfT = f / length;
            const px = (1 - lfT) * (1 - lfT) * 0 + 2 * (1 - lfT) * lfT * cpX + lfT * lfT * endX;
            const py = (1 - lfT) * (1 - lfT) * 0 + 2 * (1 - lfT) * lfT * cpY + lfT * lfT * endY;
            
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + 4 * scale, py + (20 - lfT * 8) * scale);
            ctx.stroke();
          }
          ctx.restore();
        });
        
        ctx.restore();
      }

      // Draw Main Tall Palm Tree
      drawPalmTree(w * 0.03, h, 260, 1.0, 1.15);
      // Draw Smaller Companion Palm Tree for depth
      drawPalmTree(w * 0.12, h, 185, 0.8, 0.85);
    } else if (phase === 'bustlingcity') {
      // 1. Twilight Background Sky & Glow
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#09081a'); // Deep space twilight
      skyGrad.addColorStop(0.4, '#1b0f32'); // Purple haze
      skyGrad.addColorStop(0.8, '#4a154b'); // Magenta sunset line
      skyGrad.addColorStop(1, '#8c354a'); // Warm golden-orange horizon
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Twinkling Stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      const starPositions = [
        { x: w * 0.12, y: h * 0.08, r: 1.0 },
        { x: w * 0.28, y: h * 0.15, r: 0.8 },
        { x: w * 0.45, y: h * 0.06, r: 1.2 },
        { x: w * 0.65, y: h * 0.18, r: 0.7 },
        { x: w * 0.78, y: h * 0.10, r: 1.4 },
        { x: w * 0.90, y: h * 0.22, r: 0.9 }
      ];
      starPositions.forEach(star => {
        ctx.save();
        ctx.beginPath();
        const twinkle = Math.sin(windTime * 4.0 + star.x) * 0.3;
        ctx.arc(star.x, star.y, Math.max(0.4, star.r + twinkle), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 3. Dense City Skyscraper Silhouettes (Anime Landscape Style)
      ctx.save();
      ctx.fillStyle = 'rgba(12, 8, 22, 0.96)';
      
      // Tower 1 (Far Left, peaked antenna)
      const t1X = w * 0.14;
      const t1W = 25;
      const t1H = 135;
      ctx.fillRect(t1X - t1W, h - t1H, t1W * 2, t1H);
      ctx.strokeStyle = 'rgba(12, 8, 22, 0.96)';
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(t1X, h - t1H); ctx.lineTo(t1X, h - t1H - 20); ctx.stroke(); // antenna

      // Tower 2 (Left-Center, slanted roof)
      const t2X = w * 0.28;
      const t2W = 32;
      const t2H = 175;
      ctx.beginPath();
      ctx.moveTo(t2X - t2W, h);
      ctx.lineTo(t2X - t2W, h - t2H);
      ctx.lineTo(t2X + t2W, h - t2H + 25);
      ctx.lineTo(t2X + t2W, h);
      ctx.closePath();
      ctx.fill();

      // Tower 3 (Center, stepped roof)
      const t3X = w * 0.46;
      const t3W = 28;
      const t3H = 145;
      ctx.fillRect(t3X - t3W, h - t3H, t3W * 2, t3H);
      ctx.fillRect(t3X - t3W + 6, h - t3H - 12, (t3W - 6) * 2, 12);
      ctx.fillRect(t3X - t3W + 12, h - t3H - 24, (t3W - 12) * 2, 12);

      // Tower 4 (Center-Right, massive skyscraper with antenna peak)
      const t4X = w * 0.62;
      const t4W = 36;
      const t4H = 200;
      ctx.beginPath();
      ctx.moveTo(t4X - t4W, h);
      ctx.lineTo(t4X - t4W, h - t4H + 20);
      ctx.lineTo(t4X, h - t4H);
      ctx.lineTo(t4X + t4W, h - t4H + 20);
      ctx.lineTo(t4X + t4W, h);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath(); ctx.moveTo(t4X, h - t4H); ctx.lineTo(t4X, h - t4H - 25); ctx.stroke();

      // Tower 5 (Right, curved top)
      const t5X = w * 0.78;
      const t5W = 26;
      const t5H = 130;
      ctx.beginPath();
      ctx.moveTo(t5X - t5W, h);
      ctx.lineTo(t5X - t5W, h - t5H + 15);
      ctx.quadraticCurveTo(t5X, h - t5H - 10, t5X + t5W, h - t5H + 15);
      ctx.lineTo(t5X + t5W, h);
      ctx.closePath();
      ctx.fill();

      // Tower 6 (Far Right, flat tower with twin spires)
      const t6X = w * 0.90;
      const t6W = 24;
      const t6H = 155;
      ctx.fillRect(t6X - t6W, h - t6H, t6W * 2, t6H);
      ctx.beginPath();
      ctx.moveTo(t6X - t6W + 4, h - t6H); ctx.lineTo(t6X - t6W + 4, h - t6H - 15);
      ctx.moveTo(t6X + t6W - 4, h - t6H); ctx.lineTo(t6X + t6W - 4, h - t6H - 15);
      ctx.stroke();
      ctx.restore();

      // 4. Windows Lights Grids (Warm glowing apartments)
      ctx.save();
      ctx.fillStyle = 'rgba(255, 230, 110, 0.50)';
      // Windows on Tower 2
      for (let col = -2; col <= 2; col++) {
        for (let row = 0; row < 12; row++) {
          const wx = t2X + col * 10 - 2;
          const wy = h - t2H + 30 + row * 11;
          const rand = Math.sin(col * 3 + row * 4 + windTime * 2.0);
          if (rand > -0.1 && wy < h - 25) {
            ctx.fillRect(wx, wy, 4, 5);
          }
        }
      }
      // Windows on Tower 4
      ctx.fillStyle = 'rgba(255, 200, 100, 0.45)';
      for (let col = -3; col <= 3; col++) {
        for (let row = 0; row < 15; row++) {
          const wx = t4X + col * 8 - 1.5;
          const wy = h - t4H + 40 + row * 10;
          const rand = Math.sin(col * 2 + row * 5 + windTime * 1.5);
          if (rand > 0.0 && wy < h - 25) {
            ctx.fillRect(wx, wy, 3, 5);
          }
        }
      }
      ctx.restore();

      // 5. Bustling Elevated Highway Bridge, Prague Tram, & Traffic Streams
      ctx.save();
      ctx.fillStyle = '#06040a';
      ctx.fillRect(0, h - 50, w, 50); // Bridge bar
      // Bridge pillars
      ctx.fillStyle = '#030206';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(w * 0.2 * i + w * 0.08, h - 50, 8, 50);
      }

      // Draw Tram tracks
      ctx.strokeStyle = '#181224';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(0, h - 45); ctx.lineTo(w, h - 45);
      ctx.moveTo(0, h - 43); ctx.lineTo(w, h - 43);
      ctx.stroke();

      // Traffic Stream: Headlights (Yellow/White moving left)
      ctx.fillStyle = 'rgba(255, 245, 180, 0.85)';
      for (let i = 0; i < 6; i++) {
        const hx = (w + 100 - (windTime * 50 + i * 85) % (w + 100)) % (w + 100) - 50;
        ctx.beginPath();
        ctx.ellipse(hx, h - 35, 4, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Traffic Stream: Taillights (Red moving right)
      ctx.fillStyle = 'rgba(255, 80, 80, 0.88)';
      for (let i = 0; i < 5; i++) {
        const rx = (windTime * 40 + i * 110) % (w + 100) - 50;
        ctx.beginPath();
        ctx.ellipse(rx, h - 30, 3, 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Prague Tram (Red & White Tatra-style tram moving left-to-right)
      ctx.save();
      const tramX = (windTime * 32) % (w + 150) - 80;
      const tramY = h - 54;
      
      // Car 1 (Front)
      ctx.fillStyle = '#d32f2f'; // Red bottom half
      ctx.fillRect(tramX, tramY + 4, 20, 5);
      ctx.fillStyle = '#eceff1'; // White top half
      ctx.fillRect(tramX, tramY + 1, 20, 3);
      // Windows
      ctx.fillStyle = '#fff59d'; // Glowing yellow windows
      ctx.fillRect(tramX + 2, tramY + 2, 3, 1.5);
      ctx.fillRect(tramX + 6, tramY + 2, 3, 1.5);
      ctx.fillRect(tramX + 10, tramY + 2, 3, 1.5);
      ctx.fillRect(tramX + 14, tramY + 2, 3, 1.5);
      
      // Car 2 (Rear)
      const gap = 3;
      const rearX = tramX - 20 - gap;
      ctx.fillStyle = '#d32f2f'; // Red bottom half
      ctx.fillRect(rearX, tramY + 4, 20, 5);
      ctx.fillStyle = '#eceff1'; // White top half
      ctx.fillRect(rearX, tramY + 1, 20, 3);
      // Windows
      ctx.fillStyle = '#fff59d';
      ctx.fillRect(rearX + 2, tramY + 2, 3, 1.5);
      ctx.fillRect(rearX + 6, tramY + 2, 3, 1.5);
      ctx.fillRect(rearX + 10, tramY + 2, 3, 1.5);
      ctx.fillRect(rearX + 14, tramY + 2, 3, 1.5);

      // Accordion connector
      ctx.fillStyle = '#37474f';
      ctx.fillRect(tramX - gap, tramY + 3, gap, 5);

      // Pantograph (on top of Car 1)
      ctx.strokeStyle = '#78909c';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(tramX + 10, tramY + 1);
      ctx.lineTo(tramX + 7, tramY - 3);
      ctx.lineTo(tramX + 13, tramY - 3);
      ctx.stroke();

      ctx.restore();
      ctx.restore();

      // 6. Slow Blinking Air Traffic Beacons (Planes drifting across twilight sky)
      ctx.save();
      const blink = Math.floor(windTime * 3.5) % 2 === 0;
      
      // Beacon 1 (Drifting left to right)
      const bx1 = (windTime * 8) % (w + 120) - 60;
      const by1 = h * 0.12;
      if (blink) {
        ctx.fillStyle = 'rgba(255, 60, 0, 0.9)'; // Red blink
        ctx.beginPath(); ctx.arc(bx1, by1, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // White glow halo
        ctx.beginPath(); ctx.arc(bx1, by1, 6, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // White blink
        ctx.beginPath(); ctx.arc(bx1, by1, 2.0, 0, Math.PI * 2); ctx.fill();
      }

      // Beacon 2 (Drifting right to left)
      const bx2 = (w + 100 - (windTime * 12) % (w + 200)) % (w + 200) - 100;
      const by2 = h * 0.22;
      if (blink) {
        ctx.fillStyle = 'rgba(0, 180, 255, 0.8)'; // Blue blink
        ctx.beginPath(); ctx.arc(bx2, by2, 2.5, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath(); ctx.arc(bx2, by2, 2.0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      // 7. Roof Chimney Steam Particles (Slow-fading puffs)
      const steamX = t3X;
      const steamY = h - t3H - 26;
      
      if (qatarFlameParticles.length < 15) {
        qatarFlameParticles.push({
          x: steamX + (Math.random() - 0.5) * 4,
          y: steamY,
          r: 2.5 + Math.random() * 3.0,
          vy: -0.4 - Math.random() * 0.5,
          vx: 0.2 + Math.random() * 0.4, // drift right with forest wind
          life: 1.0
        });
      }
      // Render steam puffs
      ctx.save();
      qatarFlameParticles.forEach((p, idx) => {
        ctx.fillStyle = `rgba(220, 225, 235, ${p.life * 0.12})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (1 + (1 - p.life) * 1.5), 0, Math.PI * 2);
        ctx.fill();

        p.y += p.vy;
        p.x += p.vx;
        p.life -= 0.025;

        if (p.life <= 0) {
          qatarFlameParticles.splice(idx, 1);
        }
      });
      ctx.restore();
    }
    
    // Determine Sun/Moon coordinates
    const sunMoonX = 75;
    const sunMoonY = 75;
    
    // Draw Sun/Moon depending on diurnal phase
    if (phase === 'sunrise' || phase === 'cherryblossoms') {
      ctx.save();
      ctx.translate(sunMoonX + 15, sunMoonY + 15); // Rising sun position (lower)
      const sunGlow = ctx.createRadialGradient(0, 0, 20, 0, 0, 60);
      sunGlow.addColorStop(0, 'rgba(255, 171, 64, 0.60)');
      sunGlow.addColorStop(0.5, 'rgba(255, 138, 101, 0.20)');
      sunGlow.addColorStop(1, 'rgba(255, 204, 128, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 60, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffb74d'; // Warm orange rising core
      ctx.shadowColor = '#e65100';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (phase === 'day' || phase === 'mountains') {
      ctx.save();
      ctx.translate(sunMoonX, sunMoonY);
      const sunGlow = ctx.createRadialGradient(0, 0, 26, 0, 0, 68);
      sunGlow.addColorStop(0, 'rgba(255, 215, 64, 0.60)');
      sunGlow.addColorStop(0.5, 'rgba(255, 215, 64, 0.25)');
      sunGlow.addColorStop(1, 'rgba(255, 215, 64, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 68, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = phase === 'mountains' ? '#ffffff' : '#ffca28'; // Golden/misty white core
      ctx.shadowColor = phase === 'mountains' ? '#e6eff2' : '#ff9800';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (phase === 'sunset') {
      ctx.save();
      ctx.translate(sunMoonX + 25, sunMoonY + 30);
      const sunGlow = ctx.createRadialGradient(0, 0, 24, 0, 0, 62);
      sunGlow.addColorStop(0, 'rgba(244, 67, 54, 0.65)');
      sunGlow.addColorStop(0.5, 'rgba(255, 152, 0, 0.25)');
      sunGlow.addColorStop(1, 'rgba(255, 193, 7, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 62, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ff5722'; // Orange-red core
      ctx.shadowColor = '#d84315';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (phase === 'night' || phase === 'bustlingcity') { // Night Moon
      ctx.save();
      ctx.translate(sunMoonX, sunMoonY);
      ctx.rotate(-Math.PI / 4);
      
      const moonGlow = ctx.createRadialGradient(0, 0, 25, 0, 0, 62);
      moonGlow.addColorStop(0, 'rgba(236, 239, 241, 0.50)');
      moonGlow.addColorStop(0.5, 'rgba(236, 239, 241, 0.20)');
      moonGlow.addColorStop(1, 'rgba(236, 239, 241, 0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 62, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#eceff1'; // Crescent moon shape
      ctx.shadowColor = '#b0bec5';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, 25, -Math.PI / 2, Math.PI / 2, false);
      ctx.quadraticCurveTo(11, 0, 0, -25);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Draw Drifting Clouds behind the plant
    let cloudColor = 'rgba(255, 255, 255, 0.95)';
    if (phase === 'sunrise') {
      cloudColor = 'rgba(255, 235, 240, 0.90)'; // Soft rose-lavender clouds
    } else if (phase === 'sunset') {
      cloudColor = 'rgba(255, 210, 190, 0.88)'; // Peach-gold sunset clouds
    } else if (phase === 'night') {
      cloudColor = 'rgba(25, 30, 48, 0.35)'; // Dark wispy silhouette clouds
    } else if (phase === 'rainforest') {
      cloudColor = 'rgba(10, 40, 15, 0.22)'; // Dark forest clouds
    } else if (phase === 'cherryblossoms') {
      cloudColor = 'rgba(255, 240, 245, 0.65)'; // Soft sakura clouds
    } else if (phase === 'mountains') {
      cloudColor = 'rgba(255, 255, 255, 0.85)'; // Hazy mountain clouds
    } else if (phase === 'beach') {
      cloudColor = 'rgba(255, 255, 255, 0.90)'; // White beach clouds
    } else if (phase === 'bustlingcity') {
      cloudColor = 'rgba(60, 20, 50, 0.28)'; // Deep twilight purple clouds
    }
    
    clouds.forEach(cloud => {
      drawCloud(cloud.x, cloud.y, cloud.scale, cloud.opacity, cloudColor);
    });

    // Draw plant spotlight beautifully (warm by day, cool by night)
    const potY = h - 98;
    ctx.save();
    const spotGrad = ctx.createLinearGradient(w / 2, 0, w / 2, potY + 10);
    if (phase === 'sunrise' || phase === 'cherryblossoms') {
      spotGrad.addColorStop(0, 'rgba(255, 230, 180, 0.20)');
      spotGrad.addColorStop(0.6, 'rgba(255, 230, 180, 0.08)');
      spotGrad.addColorStop(1, 'rgba(255, 230, 180, 0)');
    } else if (phase === 'sunset' || phase === 'bustlingcity') {
      spotGrad.addColorStop(0, 'rgba(255, 180, 150, 0.20)');
      spotGrad.addColorStop(0.6, 'rgba(255, 180, 150, 0.08)');
      spotGrad.addColorStop(1, 'rgba(255, 180, 150, 0)');
    } else if (isNight) {
      spotGrad.addColorStop(0, 'rgba(180, 200, 255, 0.15)');
      spotGrad.addColorStop(0.6, 'rgba(180, 200, 255, 0.05)');
      spotGrad.addColorStop(1, 'rgba(180, 200, 255, 0)');
    } else { // Day, Beach, Rainforest, Mountains
      spotGrad.addColorStop(0, 'rgba(255, 255, 210, 0.18)');
      spotGrad.addColorStop(0.6, 'rgba(255, 255, 210, 0.08)');
      spotGrad.addColorStop(1, 'rgba(255, 255, 210, 0)');
    }
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 25, 0);
    ctx.lineTo(w / 2 + 25, 0);
    ctx.lineTo(w / 2 + 105, potY + 10);
    ctx.lineTo(w / 2 - 105, potY + 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // Determine active pot style color coordinates
    let activePot = potStyles[currentPotStyle] || potStyles.clay;
    
    const potWidth = 75;      // Scaled down half-width at the rim top (150px total) for better proportion
    const potHeight = 55;      // Scaled down total body height below the collar for better proportion
    const potX = w / 2;
    // potY is already declared above (line 396)
    
    // Pot geometry:
    const rimH = 14;           // collar/rim height
    const bodyTopW  = potWidth * 0.88;  // body width just below rim
    const bodyBotW  = potWidth * 0.60;  // body width at base
    const baseY     = potY + rimH + potHeight; // Y of the pot base
    
    // 1. Draw Pot Shadow
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(potX, baseY + 3, bodyBotW * 0.8, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = document.body.classList.contains('theme-forest-dark') ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.07)';
    ctx.fill();
    ctx.restore();

    // Calculate dynamic scales
    const stageInfo = getGrowthStage(currentHours);
    
    // Size shrink factor based on health
    const healthScale = isDead ? 0.75 : (0.75 + 0.25 * (currentHealth / 100));
    
    // Droop factor
    const droopFactor = isDead ? 0.85 : (1 - currentHealth / 100);
    
    // Master plant scale based on continuous growth logic (grows smoothly with each hour of Daimoku)
    let stageScale = 1.0;
    const T = targetHours;
    if (currentHours <= 0) {
      stageScale = 0;
    } else if (currentHours <= T * (10 / 333)) {
      // Sprout stage: grow smoothly from 0.40 to 0.80
      stageScale = 0.40 + 0.40 * (currentHours / (T * (10 / 333)));
    } else if (currentHours <= T * (50 / 333)) {
      // Seedling stage: grow smoothly from 0.80 to 0.95
      const lower = T * (10 / 333);
      const upper = T * (50 / 333);
      stageScale = 0.80 + 0.15 * ((currentHours - lower) / (upper - lower));
    } else if (currentHours <= T * (150 / 333)) {
      // Young Plant stage: grow smoothly from 0.95 to 1.05
      const lower = T * (50 / 333);
      const upper = T * (150 / 333);
      stageScale = 0.95 + 0.10 * ((currentHours - lower) / (upper - lower));
    } else if (currentHours <= T) {
      // Mature Shrub stage: grow smoothly from 1.05 to 1.25
      const lower = T * (150 / 333);
      const upper = T;
      stageScale = 1.05 + 0.20 * ((currentHours - lower) / (upper - lower));
    } else {
      // Majestic Tree stage: grow smoothly from 2.10 up to 2.50 based on next milestones
      stageScale = 2.10 + Math.min(0.40, 0.40 * ((currentHours - T) / (T * 2)));
    }
    
    const masterScale = stageScale * healthScale;

    // Soft radial contrast halo behind the plant structure at night to make the plant pop
    if (isNight && stageInfo.stage > 1) {
      ctx.save();
      const haloY = potY - 80 * masterScale;
      const haloR = 110 * masterScale;
      
      const plantGlow = ctx.createRadialGradient(potX, haloY, 15, potX, haloY, haloR);
      plantGlow.addColorStop(0, 'rgba(255, 255, 255, 0.20)');  // Soft silver glow
      plantGlow.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
      plantGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = plantGlow;
      ctx.beginPath();
      ctx.arc(potX, haloY, haloR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    // 2. Draw Soil in Pot (Inside Rim)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(potX, potY + rimH - 4, bodyTopW * 0.9, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = colors.soil;
    ctx.fill();
    ctx.restore();

    // Streak Pot Halo Aura (Drawn behind pot)
    if (currentStreak >= 3) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(potX, baseY + 1, bodyBotW * 1.5, 9 * masterScale, 0, 0, Math.PI * 2);
      
      let glowColor = 'rgba(38, 166, 154, 0.4)'; // 3+ days: Teal
      let blurRad = 8;
      if (currentStreak >= 30) {
        glowColor = 'rgba(255, 215, 0, 0.55)'; // 30+ days: Gold
        blurRad = 18;
      } else if (currentStreak >= 7) {
        glowColor = 'rgba(255, 128, 171, 0.55)'; // 7+ days: Coral/Pink
        blurRad = 13;
      }
      
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = blurRad * masterScale;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = glowColor;
      ctx.fill();
      ctx.restore();
    }

    // 3. Draw Pot Body
    ctx.save();
    
    // Beautiful pot drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    
    ctx.beginPath();
    ctx.moveTo(potX - bodyTopW, potY + rimH);
    ctx.lineTo(potX + bodyTopW, potY + rimH);
    ctx.quadraticCurveTo(
      potX + bodyTopW * 0.85, potY + rimH + potHeight * 0.55,
      potX + bodyBotW, baseY
    );
    ctx.quadraticCurveTo(potX, baseY + 5, potX - bodyBotW, baseY);
    ctx.quadraticCurveTo(
      potX - bodyTopW * 0.85, potY + rimH + potHeight * 0.55,
      potX - bodyTopW, potY + rimH
    );
    ctx.closePath();
    
    const potGrad = ctx.createLinearGradient(potX - bodyTopW, potY, potX + bodyTopW, potY);
    potGrad.addColorStop(0,    activePot.shadow);
    potGrad.addColorStop(0.25, activePot.body);
    potGrad.addColorStop(0.5,  activePot.rim);
    potGrad.addColorStop(0.75, activePot.body);
    potGrad.addColorStop(1,    activePot.shadow);
    
    ctx.fillStyle = potGrad;
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.strokeStyle = activePot.accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // --- Pot Style Special Decorations ---
    if (currentPotStyle === 'lotus') {
      // Golden Lotus outline on pot face
      ctx.strokeStyle = '#f5c65a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      // Center petal
      ctx.moveTo(potX, potY + rimH + potHeight * 0.7);
      ctx.quadraticCurveTo(potX - 6, potY + rimH + potHeight * 0.4, potX, potY + rimH + potHeight * 0.25);
      ctx.quadraticCurveTo(potX + 6, potY + rimH + potHeight * 0.4, potX, potY + rimH + potHeight * 0.7);
      // Left petal
      ctx.quadraticCurveTo(potX - 12, potY + rimH + potHeight * 0.5, potX - 10, potY + rimH + potHeight * 0.35);
      ctx.quadraticCurveTo(potX - 4, potY + rimH + potHeight * 0.4, potX, potY + rimH + potHeight * 0.7);
      // Right petal
      ctx.quadraticCurveTo(potX + 12, potY + rimH + potHeight * 0.5, potX + 10, potY + rimH + potHeight * 0.35);
      ctx.quadraticCurveTo(potX + 4, potY + rimH + potHeight * 0.4, potX, potY + rimH + potHeight * 0.7);
      ctx.stroke();
    } else if (currentPotStyle === 'marble') {
      // Subtle gray marble veins
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.15)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(potX - bodyTopW * 0.4, potY + rimH + 3);
      ctx.lineTo(potX - 5, potY + rimH + potHeight * 0.45);
      ctx.lineTo(potX - 15, baseY - 3);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(potX + bodyTopW * 0.3, potY + rimH + 6);
      ctx.lineTo(potX + 15, potY + rimH + potHeight * 0.4);
      ctx.lineTo(potX + 25, baseY - 8);
      ctx.stroke();
    } else if (currentPotStyle === 'jade') {
      // White glossy highlight line on jade pot
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(potX - bodyTopW * 0.25, potY + rimH + 4);
      ctx.lineTo(potX - bodyBotW * 0.25, baseY - 4);
      ctx.stroke();
    }
    
    // Subtle horizontal ridge near base
    const ridgeY = potY + rimH + potHeight * 0.82;
    const ridgeW = bodyBotW + (bodyTopW - bodyBotW) * 0.18 + 2;
    ctx.beginPath();
    ctx.ellipse(potX, ridgeY, ridgeW, 3, 0, Math.PI * 0.05, Math.PI * 1.05);
    ctx.strokeStyle = 'rgba(94, 39, 20, 0.18)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
    
    // 4. Draw Thick Flat Collar / Rim
    const rimTopW = potWidth;
    const rimBotW = bodyTopW * 1.00;
    
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(potX - rimTopW, potY);
    ctx.quadraticCurveTo(potX, potY + 4, potX + rimTopW, potY);
    ctx.lineTo(potX + rimBotW, potY + rimH);
    ctx.quadraticCurveTo(potX, potY + rimH + 5, potX - rimBotW, potY + rimH);
    ctx.closePath();
    
    const rimGrad = ctx.createLinearGradient(potX - rimTopW, potY, potX + rimTopW, potY);
    rimGrad.addColorStop(0,    activePot.shadow);
    rimGrad.addColorStop(0.2,  activePot.body);
    rimGrad.addColorStop(0.5,  activePot.rim);
    rimGrad.addColorStop(0.8,  activePot.body);
    rimGrad.addColorStop(1,    activePot.shadow);
    
    ctx.fillStyle = rimGrad;
    ctx.fill();
    ctx.strokeStyle = activePot.accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    
    // 5. Draw Rim Top Ellipse
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(potX, potY, rimTopW, 4, 0, 0, Math.PI * 2);
    
    const lipGrad = ctx.createLinearGradient(potX - rimTopW, potY, potX + rimTopW, potY);
    lipGrad.addColorStop(0,    activePot.shadow);
    lipGrad.addColorStop(0.35, activePot.rim);
    lipGrad.addColorStop(0.65, activePot.rim);
    lipGrad.addColorStop(1,    activePot.shadow);
    
    ctx.fillStyle = lipGrad;
    ctx.fill();
    ctx.strokeStyle = activePot.accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();ctx.restore();
    
    // Draw the Plant (Drawn after the pot so it is on top of the soil and visible)
    if (stageInfo.stage > 1) {
      // Clear or initialize tips list for this frame
      const tips = [];
      
      ctx.save();
      ctx.translate(potX, potY + rimH - 3);
      
      // Draw custom target plants (Lotus and Bamboo) next to main tree
      if (activeTargets && activeTargets.length > 0) {
        // Target 1: Lotus (left)
        const t1 = activeTargets[0];
        const progress1 = t1.type === 'hours' ? (t1.targetSeconds > 0 ? (t1.accumulatedSeconds / t1.targetSeconds) : 0) : 0.5;
        drawLotusSeed(-32, 0, progress1, masterScale);
        
        // Target 2: Bamboo (right)
        if (activeTargets.length > 1) {
          const t2 = activeTargets[1];
          const progress2 = t2.type === 'hours' ? (t2.targetSeconds > 0 ? (t2.accumulatedSeconds / t2.targetSeconds) : 0) : 0.5;
          drawBambooSeed(32, 0, progress2, masterScale);
        }
      }
      
      const windAngle = Math.sin(windTime) * 0.04 * (isDead ? 0.2 : (currentHealth / 100 + 0.3)) + plantSwayAngle;
      const leafColors = getLeafColors(currentHealth, isDead);
      const woodColor = isDead ? colors.wood.dead : (currentHealth <= 40 ? colors.wood.dry : colors.wood.healthy);
      
      // Render different growth stages
      if (stageInfo.stage === 2) {
        // --- STAGE 2: SPROUT ---
        // Draw split seed shells at the base (soil level)
        ctx.save();
        ctx.fillStyle = '#6e5a4f';
        ctx.beginPath(); ctx.arc(-6, 2, 3 * masterScale, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
        ctx.beginPath(); ctx.arc(4, 3, 3 * masterScale, -Math.PI * 0.5, Math.PI * 0.5); ctx.fill();
        ctx.restore();

        ctx.rotate(windAngle);
        
        const stemLength = 75 * masterScale;
        
        // Draw stem
        ctx.beginPath();
        ctx.moveTo(0, 0);
        // If dead, droop stem extremely
        const endX = isDead ? -35 * masterScale : -25 * droopFactor;
        const endY = isDead ? -stemLength * 0.25 : -stemLength + 15 * droopFactor;
        const ctrlX = isDead ? -40 * masterScale : -15 * droopFactor;
        const ctrlY = isDead ? -stemLength * 0.7 : -stemLength / 2;
        
        ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
        ctx.strokeStyle = leafColors[2];
        ctx.lineWidth = 5 * masterScale;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Draw leaves along the stem - grows 1 leaf per hour
        const leafCount = Math.max(1, Math.min(10, Math.floor(currentHours)));
        const leafAngleOffset = 0.4 + (0.5 * droopFactor); // Droop leaves down
        
        for (let i = 1; i <= leafCount; i++) {
          const t = i / (leafCount + 1);
          // Interpolate point along quadratic Bezier curve
          const lx = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * ctrlX + t * t * endX;
          const ly = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * ctrlY + t * t * endY;
          
          const leafSize = (14 + t * 8) * masterScale;
          const leafAngle1 = isDead ? (Math.PI / 2 - 0.1) : (-Math.PI/4 + leafAngleOffset);
          const leafAngle2 = isDead ? (Math.PI / 2 + 0.1) : (-Math.PI*3/4 - leafAngleOffset);
          
          if (i % 2 === 0) {
            drawLeaf(lx, ly, leafSize, leafSize * 0.6, leafAngle1, leafColors[i % leafColors.length]);
          } else {
            drawLeaf(lx, ly, leafSize, leafSize * 0.6, leafAngle2, leafColors[(i + 1) % leafColors.length]);
          }
        }
        
      } else {
        // --- STAGES 3-6: ORGANIC BRANCHING TREE ---
        // Draw split seed shells at the base for Stage 3 seedling
        if (stageInfo.stage === 3) {
          ctx.save();
          ctx.fillStyle = '#6e5a4f';
          ctx.beginPath(); ctx.arc(-6, 2, 3 * masterScale, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
          ctx.beginPath(); ctx.arc(4, 3, 3 * masterScale, -Math.PI * 0.5, Math.PI * 0.5); ctx.fill();
          ctx.restore();
        }

        ctx.rotate(windAngle);
        
        let maxDepth = 2;
        let trunkLen = 60;
        let trunkThickness = 7;
        
        if (stageInfo.stage === 3) {
          maxDepth = 2; trunkLen = 60; trunkThickness = 7;
        } else if (stageInfo.stage === 4) {
          maxDepth = 3; trunkLen = 80; trunkThickness = 9;
        } else if (stageInfo.stage === 5) {
          maxDepth = 4; trunkLen = 95; trunkThickness = 11;
        } else if (stageInfo.stage === 6) {
          maxDepth = 4; trunkLen = 100; trunkThickness = 13;
        }
        
        // Draw recursive winding branch structure and collect tip locations
        drawBranchRecursive(trunkLen, trunkThickness, -0.1, maxDepth, maxDepth, 0, masterScale, woodColor, leafColors, tips);
      }
      
      // Happy sparkle particles logic (only when happy and actively chanting/testing)
      if (!isDead && currentHealth > 70 && Math.random() < 0.05) {
        ctx.save();
        ctx.translate(Math.random() * 80 - 40, -100 * masterScale);
        ctx.fillStyle = 'rgba(229, 173, 53, 0.6)';
        ctx.beginPath();
        ctx.arc(0, 0, 3 * Math.random(), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      
      ctx.restore();

      // Draw leaves in absolute screen-space coordinates at branch tips (only for stages > 2)
      if (stageInfo.stage > 2 && tips.length > 0) {
        const leafCount = Math.floor(currentHours);
        const finalLeafCount = Math.min(500, leafCount);
        
        for (let i = 1; i <= finalLeafCount; i++) {
          const tipIndex = Math.floor(seededRandom(i * 123.45) * tips.length);
          const tip = tips[tipIndex];
          if (!tip) continue;
          
          // Scattered leaf placement relative to tip
          const dist = seededRandom(i * 23.45) * 28 * masterScale;
          const angleOffset = (seededRandom(i * 34.56) - 0.5) * Math.PI * 2;
          
          const lx = tip.x + Math.cos(angleOffset) * dist;
          const ly = tip.y + Math.sin(angleOffset) * dist;
          
          const leafSize = (16 + seededRandom(i * 45.67) * 10) * masterScale;
          const baseAngle = tip.angle + angleOffset * 0.3;
          const flutter = Math.sin(windTime * 4 + i) * 0.08 * (isDead ? 0.2 : (currentHealth / 100));
          const droop = isDead ? Math.PI / 2 : 0;
          const finalAngle = baseAngle + flutter + droop;
          const leafColor = leafColors[i % leafColors.length];
          
          if (stageInfo.stage === 6) {
            drawPeepalLeaf(lx, ly, leafSize, leafSize * 0.65, finalAngle, leafColor);
          } else {
            drawLeaf(lx, ly, leafSize, leafSize * 0.55, finalAngle, leafColor);
          }
        }
      }

      // Draw apples if total chanting is greater than 333 hours
      if (currentHours > 333 && tips.length > 0) {
        const additionalHours = currentHours - 333;
        const applesCount = Math.min(60, Math.floor(additionalHours / 3.3333)); // cap at 60 apples to prevent cluttering
        
        for (let i = 1; i <= applesCount; i++) {
          // Use deterministic random selection based on index so it is stable per frame
          const tipIndex = Math.floor(seededRandom(i * 999.99) * tips.length);
          const tip = tips[tipIndex];
          if (!tip) continue;
          
          // Place apple hanging slightly lower than the tip
          const ax = tip.x + (seededRandom(i * 123.4) - 0.5) * 16 * masterScale;
          const ay = tip.y + (12 + seededRandom(i * 567.8) * 12) * masterScale;
          
          ctx.save();
          
          // 1. Stem
          ctx.beginPath();
          ctx.moveTo(ax, ay - 3 * masterScale);
          ctx.quadraticCurveTo(ax + 2 * masterScale, ay - 6 * masterScale, ax + 3 * masterScale, ay - 7 * masterScale);
          ctx.strokeStyle = '#5c4033'; // Deep brown stem
          ctx.lineWidth = 1 * masterScale;
          ctx.stroke();
          
          // 2. Leaf on stem
          ctx.beginPath();
          ctx.ellipse(ax + 1.8 * masterScale, ay - 5.5 * masterScale, 2 * masterScale, 1 * masterScale, Math.PI / 4, 0, Math.PI * 2);
          ctx.fillStyle = '#459c45'; // Leaf green
          ctx.fill();
          
          // 3. Apple body (triple overlapping circles for heart shape)
          ctx.beginPath();
          ctx.arc(ax - 1.8 * masterScale, ay, 3.2 * masterScale, 0, Math.PI * 2);
          ctx.arc(ax + 1.8 * masterScale, ay, 3.2 * masterScale, 0, Math.PI * 2);
          ctx.arc(ax, ay + 1.8 * masterScale, 3.2 * masterScale, 0, Math.PI * 2);
          ctx.fillStyle = '#d32f2f'; // Premium apple red
          ctx.fill();
          
          // 4. White shine highlight
          ctx.beginPath();
          ctx.arc(ax - 1.2 * masterScale, ay - 1.2 * masterScale, 1 * masterScale, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fill();
          
          ctx.restore();
        }
      }
    }

    // 6. Draw Animations
    ctx.save();
    
    // --- TIMER ACTIVE: WATER DROPS (Slower) ---
    if (isChanting) {
      ctx.fillStyle = 'rgba(60, 170, 255, 0.95)';
      ctx.strokeStyle = 'rgba(30, 130, 255, 1.0)';
      ctx.lineWidth = 1.2;
      const dropSpeed = 180; // Slower drops (set to 180)
      const dropRadius = 5.5; 
      const dropSpacing = 120; 
      const dropX = w / 2;
      
      for (let i = 0; i < 3; i++) {
        const baseDropY = (windTime * dropSpeed + i * dropSpacing) % (potY + 20);
        const dropY = baseDropY - 10;
        
        if (dropY < potY && dropY > -20) {
          ctx.beginPath();
          ctx.arc(dropX, dropY, dropRadius, 0, Math.PI, false);
          ctx.lineTo(dropX, dropY - dropRadius * 2.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          
          if (dropY > potY - 10) {
            ctx.fillStyle = 'rgba(60, 170, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(dropX - 8, dropY, 3, 0, Math.PI * 2);
            ctx.arc(dropX + 8, dropY, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // --- TIMER STOPPED: BUTTERFLIES, BIRDS, OR FIREFLIES ---
    if (!isChanting) {
      if (!isNight) {
        // Multiple Butterflies (Blue, Yellow, Red) - Day Only
        const butterflies = [
          { color: 'rgba(100, 150, 255, 0.9)', offset: 0, speedX: 2.20, speedY: 3.00, flap: 70.0, scale: 1.0 }, // Blue
          { color: 'rgba(255, 220, 100, 0.9)', offset: 2.5, speedX: 3.40, speedY: 1.80, flap: 90.0, scale: 1.0 }, // Yellow
          { color: 'rgba(255, 100, 100, 0.9)', offset: 5.0, speedX: 1.40, speedY: 3.80, flap: 60.0, scale: 1.0 }  // Red
        ];
        
        butterflies.forEach(b => {
          ctx.save();
          const butterX = potX + Math.sin(windTime * b.speedX + b.offset) * 160;
          const butterY = potY - 120 + Math.cos(windTime * b.speedY + b.offset) * 40;
          const wingFlap = Math.sin(windTime * b.flap);
          
          ctx.translate(butterX, butterY);
          ctx.scale(b.scale, b.scale);
          
          // Body
          ctx.fillStyle = '#333';
          ctx.beginPath();
          ctx.ellipse(0, 0, 1.5, 4, 0, 0, Math.PI*2);
          ctx.fill();
          
          // Wings
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.ellipse(-2 - (wingFlap * 2), -2, 5, 7, -0.5, 0, Math.PI*2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(2 + (wingFlap * 2), -2, 5, 7, 0.5, 0, Math.PI*2);
          ctx.fill();
          
          ctx.restore();
        });
        
        // 2 Birds Flying (Wavy paths across the sky every 30 seconds) - Day Only
        const timeSecs = Date.now() / 1000;
        const flightCycle = 30; // 30 seconds
        const progress = timeSecs % flightCycle;
        
        if (progress < 10) {
          const ratio = progress / 10;
          const bird1X = -40 + ratio * (w + 80);
          const bird2X = bird1X - 35; // Flying 35px behind
          
          // Wavy flight paths
          const bird1Y = 70 + Math.sin(ratio * Math.PI * 4) * 20;
          const bird2Y = 95 + Math.sin(ratio * Math.PI * 4 - 0.5) * 18;
          
          // Draw Bird 1 (Soft Blue)
          drawFlyingBird(bird1X, bird1Y, true);
          // Draw Bird 2 (Warm Orange/Yellow)
          drawFlyingBird(bird2X, bird2Y, false);
        }
      } else {
        // Fireflies drifting around the plant - Night Only
        const fireflies = [
          { baseX: potX - 80, baseY: potY - 140, rangeX: 40, rangeY: 30, speedX: 1.5, speedY: 2.0, pulseSpeed: 4.0, size: 3.5, offset: 0 },
          { baseX: potX + 80, baseY: potY - 100, rangeX: 30, rangeY: 40, speedX: 1.2, speedY: 1.7, pulseSpeed: 3.0, size: 2.8, offset: 1.5 },
          { baseX: potX - 30, baseY: potY - 70,  rangeX: 50, rangeY: 20, speedX: 1.8, speedY: 1.1, pulseSpeed: 5.0, size: 3.2, offset: 3.0 },
          { baseX: potX + 40, baseY: potY - 160, rangeX: 35, rangeY: 35, speedX: 1.0, speedY: 1.5, pulseSpeed: 2.5, size: 2.5, offset: 4.5 },
          { baseX: potX - 100, baseY: potY - 60, rangeX: 25, rangeY: 30, speedX: 2.2, speedY: 1.3, pulseSpeed: 6.0, size: 3.0, offset: 6.0 }
        ];

        fireflies.forEach(f => {
          ctx.save();
          // Slow float
          const fx = f.baseX + Math.sin(windTime * f.speedX + f.offset) * f.rangeX;
          const fy = f.baseY + Math.cos(windTime * f.speedY + f.offset) * f.rangeY;
          // Pulse opacity
          const fOpacity = 0.3 + Math.sin(windTime * f.pulseSpeed + f.offset) * 0.5;
          
          if (fOpacity > 0.05) {
            // Glow outer
            const fireflyGlow = ctx.createRadialGradient(fx, fy, 0.5, fx, fy, f.size * 3.5);
            fireflyGlow.addColorStop(0, `rgba(180, 255, 60, ${fOpacity})`);
            fireflyGlow.addColorStop(0.4, `rgba(180, 255, 60, ${fOpacity * 0.4})`);
            fireflyGlow.addColorStop(1, 'rgba(180, 255, 60, 0)');
            ctx.fillStyle = fireflyGlow;
            ctx.beginPath();
            ctx.arc(fx, fy, f.size * 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = `rgba(255, 255, 200, ${fOpacity * 0.9})`;
            ctx.beginPath();
            ctx.arc(fx, fy, f.size * 0.8, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        });
      }
    }

    // --- LION ANIMATION STATE MACHINE & RENDERING (Drawn when not offscreen) ---
    const targetSittingX = potX - 142; // Sit close to the pot so it is fully visible on mobile
    const offscreenLeftX = -35;
    const offscreenRightX = w + 35;

    if (!isChanting) {
      if (lionState === 'offscreen') {
        lionState = 'walking-in';
        lionX = offscreenLeftX;
      } else if (lionState === 'walking-out') {
        lionState = 'walking-in';
      }

      if (lionState === 'walking-in') {
        lionX += 1.2; 
        walkBob = Math.sin(lionX * 0.3) * 2;
        if (lionX >= targetSittingX) {
          lionX = targetSittingX;
          lionState = 'sitting';
          walkBob = 0;
        }
      } else if (lionState === 'sitting') {
        lionX = targetSittingX;
        walkBob = 0;
      }
    } else {
      if (lionState === 'sitting' || lionState === 'walking-in') {
        lionState = 'walking-out';
      }

      if (lionState === 'walking-out') {
        lionX += 1.2; 
        walkBob = Math.sin(lionX * 0.3) * 2;
        if (lionX >= offscreenRightX) {
          lionX = -1000;
          lionState = 'offscreen';
          walkBob = 0;
        }
      }
    }

    if (lionState !== 'offscreen') {
      const isSitting = (lionState === 'sitting');
      const roarTimer = Math.floor(Date.now() / 1000) % 8;
      const isRoaring = isSitting && (roarTimer < 2.5);

      const lionY = baseY - 5 + walkBob; 
      
      ctx.save();
      ctx.translate(lionX, lionY);
      ctx.scale(1.45, 1.45); 
      
      // Draw Lion Cub
      const headX = 4;
      const headY = isSitting ? -12 : -10;

      // Tail
      ctx.strokeStyle = '#f5c65a';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-10, isSitting ? 10 : 2);
      const tailWag = isSitting ? Math.sin(windTime * 5) * 5 : Math.sin(windTime * 8) * 10;
      ctx.quadraticCurveTo(-20, isSitting ? 10 : 0, -15 + tailWag, isSitting ? 0 : -10);
      ctx.stroke();
      
      // Tail tuft
      ctx.fillStyle = '#b36b22';
      ctx.beginPath();
      ctx.arc(-15 + tailWag, isSitting ? 0 : -10, 3, 0, Math.PI*2);
      ctx.fill();

      if (isSitting) {
        // Sitting Body
        ctx.fillStyle = '#f5c65a';
        ctx.beginPath(); ctx.ellipse(0, 0, 10, 14, 0.1, 0, Math.PI*2); ctx.fill();
        // Chest fluff
        ctx.fillStyle = '#fff4d9';
        ctx.beginPath(); ctx.ellipse(3, -2, 6, 9, 0.1, 0, Math.PI*2); ctx.fill();
        // Hind leg
        ctx.fillStyle = '#eab640';
        ctx.beginPath(); ctx.ellipse(-6, 8, 7, 7, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(-3, 14, 6, 4, 0, 0, Math.PI*2); ctx.fill();
        // Front legs
        ctx.fillStyle = '#f5c65a';
        ctx.beginPath(); ctx.rect(-2, 4, 4, 10); ctx.rect(4, 4, 4, 10); ctx.fill();
        ctx.fillStyle = '#eab640';
        ctx.beginPath(); ctx.ellipse(0, 14, 4, 3, 0, 0, Math.PI*2); ctx.ellipse(6, 14, 4, 3, 0, 0, Math.PI*2); ctx.fill();
      } else {
        // Walking Body
        ctx.fillStyle = '#f5c65a';
        ctx.beginPath(); ctx.ellipse(0, 0, 14, 9, 0, 0, Math.PI*2); ctx.fill();
        // Walking legs
        ctx.strokeStyle = '#f5c65a';
        ctx.lineWidth = 5;
        ctx.beginPath();
        const walkSwing = Math.sin(windTime * 8) * 6;
        ctx.moveTo(6, 4); ctx.lineTo(6 + walkSwing, 14);
        ctx.moveTo(2, 4); ctx.lineTo(2 - walkSwing, 14);
        ctx.moveTo(-6, 4); ctx.lineTo(-6 - walkSwing, 14);
        ctx.moveTo(-10, 4); ctx.lineTo(-10 + walkSwing, 14);
        ctx.stroke();
      }

      // Mane
      ctx.fillStyle = '#b36b22';
      ctx.beginPath();
      for(let i=0; i<16; i++) {
         let angle = (i/16) * Math.PI*2;
         let mx = headX + Math.cos(angle) * 11;
         let my = headY + Math.sin(angle) * 11;
         ctx.arc(mx, my, 7.5, 0, Math.PI*2);
      }
      ctx.fill();

      // Ears
      ctx.fillStyle = '#f5c65a';
      ctx.beginPath(); ctx.arc(headX - 8, headY - 6, 3, 0, Math.PI*2); ctx.arc(headX + 8, headY - 6, 3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff4d9';
      ctx.beginPath(); ctx.arc(headX - 8, headY - 6, 1.5, 0, Math.PI*2); ctx.arc(headX + 8, headY - 6, 1.5, 0, Math.PI*2); ctx.fill();

      // Main head
      ctx.fillStyle = '#f5c65a';
      ctx.beginPath(); ctx.ellipse(headX, headY, 12, 11, 0, 0, Math.PI*2); ctx.fill();

      // Eyes
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(headX - 4, headY - 1, 2.5, 0, Math.PI*2);
      ctx.arc(headX + 4, headY - 1, 2.5, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(headX - 4.5, headY - 2, 0.8, 0, Math.PI*2); ctx.arc(headX + 3.5, headY - 2, 0.8, 0, Math.PI*2); ctx.fill();

      // Muzzle
      ctx.fillStyle = '#fff4d9';
      ctx.beginPath(); ctx.ellipse(headX, headY + 5, 6, 4, 0, 0, Math.PI*2); ctx.fill();

      // Nose
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.ellipse(headX, headY + 3.5, 2.5, 1.5, 0, 0, Math.PI*2); ctx.fill();

      if (isRoaring) {
        ctx.fillStyle = '#9c3030';
        ctx.beginPath(); ctx.arc(headX, headY + 6, 3, 0, Math.PI); ctx.fill();
        ctx.fillStyle = '#e5ad35';
        ctx.font = 'bold 10px sans-serif';
        const roarBob = Math.sin(windTime * 15) * 2;
        ctx.fillText('RAWR!', headX + 15, headY - 5 + roarBob);
      } else {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(headX, headY + 5); ctx.lineTo(headX, headY + 6.5); ctx.stroke();
        ctx.beginPath(); ctx.arc(headX - 2, headY + 6.5, 2, 0, Math.PI, false); ctx.stroke();
        ctx.beginPath(); ctx.arc(headX + 2, headY + 6.5, 2, 0, Math.PI, false); ctx.stroke();
      }

      // Whiskers
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(headX - 6, headY + 5); ctx.lineTo(headX - 12, headY + 4);
      ctx.moveTo(headX - 6, headY + 6); ctx.lineTo(headX - 12, headY + 6);
      ctx.moveTo(headX + 6, headY + 5); ctx.lineTo(headX + 12, headY + 4);
      ctx.moveTo(headX + 6, headY + 6); ctx.lineTo(headX + 12, headY + 6);
      ctx.stroke();
      
      ctx.restore();
    }

    updateAndDrawAmbientParticles(w, h);
    ctx.restore();
    
    // 7. Special Stage 1 — seed only, nothing above soil
    if (stageInfo.stage === 1) {
      ctx.save();
      ctx.translate(potX, potY + rimH - 6);
      // Tiny seed shell
      ctx.beginPath();
      ctx.arc(-4, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#6e5a4f';
      ctx.fill();
      
      // Tiny green shoot crack
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.quadraticCurveTo(5, -5, 8, -6);
      ctx.strokeStyle = colors.leaves.healthy[0];
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }

    // 8. Global Atmospheric Ambient Scenery Color Overlay (Cinematic Bloom Tint)
    ctx.save();
    let ambientOverlayColor = 'rgba(0, 0, 0, 0)';
    if (phase === 'sunrise' || phase === 'cherryblossoms') {
      ambientOverlayColor = 'rgba(255, 182, 193, 0.04)'; // soft pink warm bloom
    } else if (phase === 'sunset' || phase === 'bustlingcity') {
      ambientOverlayColor = 'rgba(255, 127, 80, 0.05)'; // soft coral/orange sunset glow
    } else if (phase === 'night') {
      ambientOverlayColor = 'rgba(25, 30, 48, 0.08)'; // deep twilight blue overlay
    } else if (phase === 'rainforest') {
      ambientOverlayColor = 'rgba(20, 50, 25, 0.05)'; // lush green environment bloom
    } else if (phase === 'mountains') {
      ambientOverlayColor = 'rgba(150, 180, 200, 0.03)'; // misty blue alpenglow tint
    }
    if (ambientOverlayColor !== 'rgba(0, 0, 0, 0)') {
      ctx.fillStyle = ambientOverlayColor;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  function setPotStyle(style) {
    if (potStyles[style]) {
      currentPotStyle = style;
      draw();
    }
  }

  // API Expose
  return {
    init: init,
    updateState: updateState,
    draw: draw,
    startAnimation: startAnimation,
    stopAnimation: stopAnimation,
    getGrowthStage: getGrowthStage,
    getPlantMood: getPlantMood,
    resizeCanvas: resizeCanvas,
    setPotStyle: setPotStyle
  };
  } catch (err) {
    console.error("PlantRenderer load error:", err);
    var banner = document.getElementById('debug-error-banner');
    if (banner) {
      banner.style.display = 'block';
      banner.innerHTML += 'Caught plant.js load error: ' + err.message + '\nStack:\n' + err.stack + '\n\n';
    }
  }
})();
