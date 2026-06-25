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
  function updateState(hours, health, deadState, chantingState) {
    currentHours = hours;
    currentHealth = health;
    isDead = deadState || (health <= 0);
    isChanting = !!chantingState;
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
    if (hours <= 0) return { stage: 1, name: 'Seed' };
    if (hours <= 10) return { stage: 2, name: 'Sprout' };
    if (hours <= 50) return { stage: 3, name: 'Seedling' };
    if (hours <= 150) return { stage: 4, name: 'Young Plant' };
    if (hours <= 332) return { stage: 5, name: 'Mature Shrub' };
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

  /**
   * Helper: Draw a single leaf
   */
  function drawLeaf(x, y, length, width, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    // Draw leaf shape using two bezier curves
    ctx.quadraticCurveTo(length / 2, -width / 2, length, 0);
    ctx.quadraticCurveTo(length / 2, width / 2, 0, 0);
    ctx.closePath();
    
    ctx.fillStyle = color;
    ctx.fill();
    
    // Soft center vein
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length * 0.8, 0);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
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
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    // Left side curve (upwards in Y)
    ctx.bezierCurveTo(length * 0.1, -width * 0.5, length * 0.4, -width * 0.6, length * 0.7, -width * 0.1);
    // Taper into long tail
    ctx.quadraticCurveTo(length * 0.85, 0, length, 0);
    // Right side curve (downwards in Y)
    ctx.quadraticCurveTo(length * 0.85, 0, length * 0.7, width * 0.1);
    ctx.bezierCurveTo(length * 0.4, width * 0.6, length * 0.1, width * 0.5, 0, 0);
    ctx.closePath();
    
    ctx.fillStyle = color;
    ctx.fill();
    
    // Central vein
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length * 0.8, 0);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    
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

  /**
   * Main Draw Function
   */
  function draw() {
    if (!canvas || !ctx) return;
    
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    
    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    const nowHour = new Date().getHours();
    
    // Determine Diurnal Phase: Sunrise (5-9), Day (9-17), Sunset (17-20), Night (20-5)
    let phase = 'day';
    if (nowHour >= 5 && nowHour < 9) {
      phase = 'sunrise';
    } else if (nowHour >= 9 && nowHour < 17) {
      phase = 'day';
    } else if (nowHour >= 17 && nowHour < 20) {
      phase = 'sunset';
    } else {
      phase = 'night';
    }
    
    const isNight = phase === 'night';

    // Sky Background Rendering
    if (phase === 'sunrise') {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#ffd3b6'); // Soft peach sunrise
      skyGrad.addColorStop(0.5, '#ffaaa5'); // Soft rose
      skyGrad.addColorStop(1, '#d4a5b8'); // Lavender base
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);
    } else if (phase === 'day') {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#e8f0fe'); // Light sky blue
      skyGrad.addColorStop(1, '#faf7f2'); // Soft cream base
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);
    } else if (phase === 'sunset') {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#a88be8'); // Sunset violet
      skyGrad.addColorStop(0.5, '#ff8a7a'); // Warm orange-pink
      skyGrad.addColorStop(1, '#fec85a'); // Golden glow
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);
    } else { // Night
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
    }

    // Determine Sun/Moon coordinates
    const sunMoonX = 75;
    const sunMoonY = 75;
    
    // Draw Sun/Moon depending on diurnal phase
    if (phase === 'sunrise') {
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
    } else if (phase === 'day') {
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
      
      ctx.fillStyle = '#ffca28'; // Golden core
      ctx.shadowColor = '#ff9800';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (phase === 'sunset') {
      ctx.save();
      ctx.translate(sunMoonX + 25, sunMoonY + 30); // Setting sun position (lower)
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
    } else { // Night Moon
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
    }
    
    clouds.forEach(cloud => {
      drawCloud(cloud.x, cloud.y, cloud.scale, cloud.opacity, cloudColor);
    });

    // Draw plant spotlight beautifully (warm by day, cool by night)
    const potY = h - 98;
    ctx.save();
    const spotGrad = ctx.createLinearGradient(w / 2, 0, w / 2, potY + 10);
    if (phase === 'sunrise') {
      spotGrad.addColorStop(0, 'rgba(255, 230, 180, 0.20)');
      spotGrad.addColorStop(0.6, 'rgba(255, 230, 180, 0.08)');
      spotGrad.addColorStop(1, 'rgba(255, 230, 180, 0)');
    } else if (phase === 'day') {
      spotGrad.addColorStop(0, 'rgba(255, 255, 210, 0.18)');
      spotGrad.addColorStop(0.6, 'rgba(255, 255, 210, 0.08)');
      spotGrad.addColorStop(1, 'rgba(255, 255, 210, 0)');
    } else if (phase === 'sunset') {
      spotGrad.addColorStop(0, 'rgba(255, 180, 150, 0.20)');
      spotGrad.addColorStop(0.6, 'rgba(255, 180, 150, 0.08)');
      spotGrad.addColorStop(1, 'rgba(255, 180, 150, 0)');
    } else { // Night
      spotGrad.addColorStop(0, 'rgba(235, 245, 255, 0.28)'); // Enhanced spotlight at night
      spotGrad.addColorStop(0.6, 'rgba(235, 245, 255, 0.12)');
      spotGrad.addColorStop(1, 'rgba(235, 245, 255, 0)');
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
    if (currentHours <= 0) {
      stageScale = 0;
    } else if (currentHours <= 10) {
      // Sprout stage: grow smoothly from 0.40 to 0.80
      stageScale = 0.40 + 0.40 * (currentHours / 10);
    } else if (currentHours <= 50) {
      // Seedling stage: grow smoothly from 0.80 to 0.95
      stageScale = 0.80 + 0.15 * ((currentHours - 10) / 40);
    } else if (currentHours <= 150) {
      // Young Plant stage: grow smoothly from 0.95 to 1.05
      stageScale = 0.95 + 0.10 * ((currentHours - 50) / 100);
    } else if (currentHours <= 333) {
      // Mature Shrub stage: grow smoothly from 1.05 to 1.25
      stageScale = 1.05 + 0.20 * ((currentHours - 150) / 183);
    } else {
      // Majestic Tree stage: grow smoothly from 2.10 up to 2.50 based on next milestones
      stageScale = 2.10 + Math.min(0.40, 0.40 * ((currentHours - 333) / 667));
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

    // 3. Draw Pot Body
    ctx.save();
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
      // Translate to soil center
      ctx.translate(potX, potY + rimH - 3);
      
      const windAngle = Math.sin(windTime) * 0.04 * (isDead ? 0.2 : (currentHealth / 100 + 0.3));
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
