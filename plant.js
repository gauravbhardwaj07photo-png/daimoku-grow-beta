/**
 * Daimoku Grow - Procedural Plant Renderer
 * Uses HTML5 Canvas to draw a highly stylized, beautiful plant
 * that sways, grows, shrinks, and changes color based on hours, health, and mood.
 */

const PlantRenderer = (function() {
  let canvas = null;
  let ctx = null;
  let animationId = null;
  let windTime = 0;
  
  // Plant State
  let currentHours = 0;
  let currentHealth = 100;
  let isDead = false;
  let isChanting = false;
  
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
      dying: ['#7c8c6c', '#92a382', '#627052', '#a6b895'],   // Grayish olive green
      dead: ['#5b6b4e', '#6e805f', '#46543b', '#809470']     // Withered olive green
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
      // Wind speed increases slightly if the plant is happy
      const windSpeed = isDead ? 0.005 : (currentHealth > 70 ? 0.02 : 0.012);
      windTime += windSpeed;
      
      draw();
      animationId = requestAnimationFrame(loop);
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
   * Main Draw Function
   */
  function draw() {
    if (!canvas || !ctx) return;
    
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    
    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    const nowHour = new Date().getHours();
    const isNight = (nowHour >= 19 || nowHour < 5);

    // If it is night, draw a beautiful dark twilight background and stars
    if (isNight) {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0a0d1a'); // Dark deep midnight
      skyGrad.addColorStop(1, '#151a30'); // Twilight navy
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Draw a few subtle twinkling stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      const starPositions = [
        { x: w * 0.20, y: h * 0.15, r: 1.2 },
        { x: w * 0.38, y: h * 0.08, r: 0.8 },
        { x: w * 0.78, y: h * 0.22, r: 1.5 },
        { x: w * 0.88, y: h * 0.10, r: 1.0 },
        { x: w * 0.15, y: h * 0.30, r: 0.9 },
        { x: w * 0.52, y: h * 0.18, r: 1.1 }
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

    // Draw Sun or Moon based on local hour (7 PM onwards moon)
    const sunMoonX = 75;
    const sunMoonY = 75;
    
    if (!isNight) {
      // Draw Sun
      ctx.save();
      ctx.translate(sunMoonX, sunMoonY);
      
      // Sun glow (Enlarged and made more prominent)
      const sunGlow = ctx.createRadialGradient(0, 0, 26, 0, 0, 68);
      sunGlow.addColorStop(0, 'rgba(255, 215, 64, 0.60)');
      sunGlow.addColorStop(0.5, 'rgba(255, 215, 64, 0.25)');
      sunGlow.addColorStop(1, 'rgba(255, 215, 64, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 68, 0, Math.PI * 2);
      ctx.fill();
      
      // Sun core (Enlarged)
      ctx.fillStyle = '#ffca28';
      ctx.shadowColor = '#ff9800';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Draw Moon (crescent)
      ctx.save();
      ctx.translate(sunMoonX, sunMoonY);
      ctx.rotate(-Math.PI / 4);
      
      // Moon glow (Enlarged and made more prominent)
      const moonGlow = ctx.createRadialGradient(0, 0, 25, 0, 0, 62);
      moonGlow.addColorStop(0, 'rgba(236, 239, 241, 0.50)');
      moonGlow.addColorStop(0.5, 'rgba(236, 239, 241, 0.20)');
      moonGlow.addColorStop(1, 'rgba(236, 239, 241, 0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 62, 0, Math.PI * 2);
      ctx.fill();
      
      // Moon crescent shape (Enlarged and thickened)
      ctx.fillStyle = '#eceff1';
      ctx.shadowColor = '#b0bec5';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, 25, -Math.PI / 2, Math.PI / 2, false);
      ctx.quadraticCurveTo(11, 0, 0, -25);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    
    // Draw plant spotlight beautifully (warm by day, cool by night)
    const potY = h - 85;
    ctx.save();
    const spotGrad = ctx.createLinearGradient(w / 2, 0, w / 2, potY + 10);
    if (!isNight) {
      spotGrad.addColorStop(0, 'rgba(255, 255, 210, 0.18)');
      spotGrad.addColorStop(0.6, 'rgba(255, 255, 210, 0.08)');
      spotGrad.addColorStop(1, 'rgba(255, 255, 210, 0)');
    } else {
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
    
    // Size shrink factor based on health
    const healthScale = isDead ? 0.75 : (0.75 + 0.25 * (currentHealth / 100));
    
    // Droop factor
    const droopFactor = isDead ? 0.85 : (1 - currentHealth / 100);
    
    // Master plant scale based on growth stage
    let stageScale = 1.0;
    switch (stageInfo.stage) {
      case 2: stageScale = 0.80; break;  // Sprout
      case 3: stageScale = 0.95; break;  // Seedling
      case 4: stageScale = 1.0; break;   // Young Plant
      case 5: stageScale = 1.15; break;  // Mature Shrub
      case 6: stageScale = 2.10; break;  // Majestic Tree (Rescaled to fit perfectly on screen without going out)
    }
    
    const masterScale = stageScale * healthScale;
    
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
        
        const stemLength = 75 * masterScale; // Increased stem length
        
        // Draw stem
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-10 * droopFactor, -stemLength / 2, 0, -stemLength);
        ctx.strokeStyle = leafColors[2];
        ctx.lineWidth = 5 * masterScale;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Draw 2 small leaves at top
        const leafSize = 22 * masterScale;
        const leafAngleOffset = 0.4 + (0.5 * droopFactor); // Droop leaves down
        
        drawLeaf(0, -stemLength, leafSize, leafSize * 0.6, -Math.PI/4 + leafAngleOffset, leafColors[0]);
        drawLeaf(0, -stemLength, leafSize, leafSize * 0.6, -Math.PI*3/4 - leafAngleOffset, leafColors[1]);
        
      } else if (stageInfo.stage === 3) {
        // --- STAGE 3: SEEDLING ---
        // Draw split seed shells at the base (soil level)
        ctx.save();
        ctx.fillStyle = '#6e5a4f';
        ctx.beginPath(); ctx.arc(-6, 2, 3 * masterScale, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
        ctx.beginPath(); ctx.arc(4, 3, 3 * masterScale, -Math.PI * 0.5, Math.PI * 0.5); ctx.fill();
        ctx.restore();

        ctx.rotate(windAngle);
        
        const stemLength = 125 * masterScale; // Increased stem length
        
        // Draw central stem curve
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const curveOffset = -15 * droopFactor + Math.sin(windTime * 0.7) * 4;
        ctx.quadraticCurveTo(curveOffset, -stemLength / 2, 0, -stemLength);
        ctx.strokeStyle = woodColor;
        ctx.lineWidth = 6 * masterScale;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Draw leaves along the stem - grows dynamically with hours
        const leafPairs = 3 + Math.min(3, Math.floor((currentHours - 10) / 15));
        for (let i = 1; i <= leafPairs; i++) {
          const ratio = i / leafPairs;
          const yPos = -stemLength * ratio;
          const currentLeafSize = (25 + (1 - ratio) * 10) * masterScale;
          const droop = 0.2 + (0.6 * droopFactor);
          
          // Draw left and right leaf
          drawLeaf(0, yPos, currentLeafSize, currentLeafSize * 0.5, -Math.PI/6 + droop, leafColors[i % leafColors.length]);
          drawLeaf(0, yPos, currentLeafSize, currentLeafSize * 0.5, -Math.PI*5/6 - droop, leafColors[(i+1) % leafColors.length]);
        }
        
      } else if (stageInfo.stage === 4) {
        // --- STAGE 4: YOUNG PLANT (Branched Bush) ---
        // A main stem and 2 side branches
        ctx.rotate(windAngle);
        
        const stemLength = 160 * masterScale;
        
        // Main stem path
        const drawBranch = (startX, startY, length, angle, depth) => {
          if (depth <= 0) return;
          
          ctx.save();
          ctx.translate(startX, startY);
          
          // Apply sway and droop physics
          const sway = Math.sin(windTime + depth) * 0.03 * (currentHealth / 100);
          const droop = (1 - depth * 0.2) * 0.15 * droopFactor;
          
          ctx.rotate(angle + sway + (angle > 0 ? droop : -droop));
          
          // Draw branch line
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -length);
          ctx.strokeStyle = woodColor;
          ctx.lineWidth = depth * 3 * masterScale;
          ctx.lineCap = 'round';
          ctx.stroke();
          
          // Draw leaves on this branch - grows dynamically with hours
          const numLeaves = 4 + Math.min(4, Math.floor((currentHours - 50) / 25));
          for (let i = 1; i <= numLeaves; i++) {
            const r = i / numLeaves;
            const ly = -length * r;
            const lSize = (20 + (1 - r) * 10) * masterScale;
            const leafDroop = 0.25 + (0.5 * droopFactor);
            
            drawLeaf(0, ly, lSize, lSize * 0.55, -Math.PI/4 + leafDroop, leafColors[i % leafColors.length]);
            drawLeaf(0, ly, lSize, lSize * 0.55, -Math.PI*3/4 - leafDroop, leafColors[(i+2) % leafColors.length]);
          }
          
          // Spawn sub-branches at top of this branch
          if (depth > 1) {
            const branchLen = length * 0.65;
            drawBranch(0, -length, branchLen, -0.5, depth - 1);
            drawBranch(0, -length, branchLen, 0.5, depth - 1);
          }
          
          ctx.restore();
        };
        
        // Start branch recursion
        drawBranch(0, 0, stemLength, 0, 2);
        
      } else if (stageInfo.stage === 5) {
        // --- STAGE 5: MATURE SHRUB (With Flowers) ---
        ctx.rotate(windAngle * 1.2);
        
        const drawMatureBranch = (startX, startY, length, angle, depth) => {
          if (depth <= 0) return;
          
          ctx.save();
          ctx.translate(startX, startY);
          
          const sway = Math.sin(windTime * 0.8 + depth) * 0.035 * (currentHealth / 100);
          const droop = (2 - depth) * 0.18 * droopFactor;
          
          ctx.rotate(angle + sway + (angle > 0 ? droop : -droop));
          
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -length);
          ctx.strokeStyle = woodColor;
          ctx.lineWidth = depth * 4 * masterScale;
          ctx.lineCap = 'round';
          ctx.stroke();
          
          // Leaves - grows dynamically with hours
          const leaves = 5 + Math.min(5, Math.floor((currentHours - 150) / 45));
          for (let i = 1; i <= leaves; i++) {
            const r = i / leaves;
            const ly = -length * r;
            const lSize = (22 + (1-r)*8) * masterScale;
            const leafDroop = 0.25 + (0.65 * droopFactor);
            
            drawLeaf(0, ly, lSize, lSize * 0.5, -Math.PI/5 + leafDroop, leafColors[i % leafColors.length]);
            drawLeaf(0, ly, lSize, lSize * 0.5, -Math.PI*4/5 - leafDroop, leafColors[(i+1) % leafColors.length]);
          }
          
          // Draw flowers if healthy & mature (and not dead)
          if (!isDead && currentHealth > 40 && depth === 1) {
            // Draw a flower at the tip of the branch
            drawFlower(0, -length, 8 * masterScale);
          }
          
          if (depth > 1) {
            drawMatureBranch(0, -length, length * 0.7, -0.65, depth - 1);
            drawMatureBranch(0, -length, length * 0.7, 0.65, depth - 1);
            drawMatureBranch(0, -length * 0.6, length * 0.5, 0, depth - 1);
          }
          
          ctx.restore();
        };
        
        drawMatureBranch(0, 0, 180 * masterScale, 0, 2);
        
      } else if (stageInfo.stage === 6) {
        // --- STAGE 6: MAJESTIC TREE (Peepal Tree Style) ---
        // Thick trunk, wide-spreading canopy, colorful deterministic flowers, peepal leaves
        ctx.rotate(windAngle * 0.8);
        
        const drawTreeBranch = (startX, startY, length, angle, depth, branchId = 0) => {
          if (depth <= 0) return;
          
          ctx.save();
          ctx.translate(startX, startY);
          
          const sway = Math.sin(windTime * 0.6 + depth + branchId) * 0.02 * (currentHealth / 100);
          const droop = (3 - depth) * 0.12 * droopFactor;
          
          ctx.rotate(angle + sway + (angle > 0 ? droop : -droop));
          
          // Thick tapering trunk/branch (Peepal trees have sturdy, thick structures)
          ctx.beginPath();
          ctx.moveTo(-depth * 3.5 * masterScale, 0);
          ctx.lineTo(-depth * 2.2 * masterScale, -length);
          ctx.lineTo(depth * 2.2 * masterScale, -length);
          ctx.lineTo(depth * 3.5 * masterScale, 0);
          ctx.closePath();
          ctx.fillStyle = woodColor;
          ctx.fill();
          
          // If top level branch, render full cluster of peepal leaves
          if (depth === 1) {
            // Canopy peepal leaves cluster - grows dynamically with hours
            const leafCount = Math.min(16, 8 + Math.floor((currentHours - 332) / 100));
            for (let i = 0; i < leafCount; i++) {
              const leafAngle = (i / leafCount) * Math.PI * 2;
              const dist = 14 * masterScale;
              const lx = Math.cos(leafAngle) * dist;
              const ly = -length + Math.sin(leafAngle) * dist;
              const lSize = 25 * masterScale;
              const leafCol = leafColors[i % leafColors.length];
              
              drawPeepalLeaf(lx, ly, lSize, lSize * 0.65, leafAngle + (Math.sin(windTime + i) * 0.1), leafCol);
            }
            
            // Colorful, deterministic, non-blinking blossoms
            if (!isDead && currentHealth > 50) {
              const blossomColors = ['#ff7bbd', '#ff9ebe', '#ffd3e2', '#cc99ff', '#ffb3d9']; // Colorful pinks, corals, purples
              const petalColor = blossomColors[branchId % blossomColors.length];
              drawFlower(0, -length - 4, 10 * masterScale, petalColor);
            }
          } else {
            // Draw peepal leaves along the trunk branches - grows dynamically with hours
            const innerLeaves = Math.min(6, 3 + Math.floor((currentHours - 332) / 150));
            for (let i = 1; i <= innerLeaves; i++) {
              const r = i / innerLeaves;
              const ly = -length * r;
              const lSize = 24 * masterScale;
              drawPeepalLeaf(0, ly, lSize, lSize * 0.6, -Math.PI/4 + 0.3, leafColors[i % leafColors.length]);
              drawPeepalLeaf(0, ly, lSize, lSize * 0.6, -Math.PI*3/4 - 0.3, leafColors[(i+1) % leafColors.length]);
            }
          }
          
          // Recurse wide-spreading branches (Peepal shape)
          if (depth > 1) {
            const nextLength = length * 0.75;
            drawTreeBranch(0, -length, nextLength, -0.72, depth - 1, branchId * 4 + 1);
            drawTreeBranch(0, -length, nextLength, 0.72, depth - 1, branchId * 4 + 2);
            drawTreeBranch(0, -length * 0.55, nextLength * 0.8, -0.2, depth - 1, branchId * 4 + 3);
            drawTreeBranch(0, -length * 0.55, nextLength * 0.8, 0.2, depth - 1, branchId * 4 + 4);
          }
          
          ctx.restore();
        };
        
        // Root trunk width scale (base length 75 ensures it fits perfectly)
        drawTreeBranch(0, 0, 75 * masterScale, 0, 3, 0);
      }
      
      // Happy sparkle particles logic (only when happy and actively chanting/testing)
      if (!isDead && currentHealth > 70 && Math.random() < 0.05) {
        // Draw a tiny sparkle particle that will float away (rendered statically for simplicity)
        ctx.save();
        ctx.translate(Math.random() * 80 - 40, -100 * masterScale);
        ctx.fillStyle = 'rgba(229, 173, 53, 0.6)';
        ctx.beginPath();
        ctx.arc(0, 0, 3 * Math.random(), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      
      ctx.restore();
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
    const targetSittingX = potX - 161; // Sit another 0.5cm further left (was 142)
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
})();
