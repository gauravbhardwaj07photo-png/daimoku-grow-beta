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
  
  // Theme Color Configurations (so the pot matches the active theme)
  const colors = {
    soil: '#4e3b31',
    potSage: { rim: '#d4896a', body: '#be6f50', shadow: '#964d32', accent: '#5e2714' },
    potWood: { rim: '#ce7c58', body: '#b6613d', shadow: '#8b4122', accent: '#5e2714' },
    potForest: { rim: '#884227', body: '#71321b', shadow: '#4d1e0d', accent: '#300f04' },
    leaves: {
      healthy: ['#6b8e6b', '#7fa87f', '#557255', '#8bb48b'],
      thirsty: ['#8ba373', '#9eb58b', '#778c61', '#adc499'],
      sad: ['#a3a373', '#b8b88d', '#8a8a5e', '#cfcfad'],
      dying: ['#8f7d6b', '#a38f7c', '#756555', '#bdaaa6'],
      dead: ['#4a413a', '#544d47', '#3d3733']
    },
    wood: {
      healthy: '#70543e',
      dry: '#856a56',
      dead: '#4a4038'
    },
    flower: {
      petal: '#fdfaf2',
      center: '#e5ad35'
    }
  };

  /**
   * Initialize the renderer on a canvas
   */
  function init(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    
    // Set up high DPI support
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
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
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
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
   * Helper: Get leaf color palette based on health
   */
  function getLeafColors(health, deadState) {
    if (deadState || health <= 0) return colors.leaves.dead;
    if (health <= 10) return colors.leaves.dying;
    if (health <= 40) return colors.leaves.sad;
    if (health <= 70) return colors.leaves.thirsty;
    return colors.leaves.healthy;
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
   * Helper: Draw a flower
   */
  function drawFlower(x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    
    // Petals
    ctx.fillStyle = colors.flower.petal;
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
   * Main Draw Function
   */
  function draw() {
    if (!canvas || !ctx) return;
    
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    
    // Clear canvas
    ctx.clearRect(0, 0, w, h);
    
    // Determine active theme from document body to style the pot
    let activePot = colors.potSage;
    if (document.body.classList.contains('theme-wood-sand')) {
      activePot = colors.potWood;
    } else if (document.body.classList.contains('theme-forest-dark')) {
      activePot = colors.potForest;
    }
    
    const potWidth = 110;      // half-width at the rim top
    const potHeight = 75;      // total body height below the collar
    const potX = w / 2;
    const potY = h - 95; // Position pot near bottom
    
    // Pot geometry — matches the reference image:
    //  - Wide flat cylindrical collar/rim at top
    //  - Body tapers inward: top ~88% of rimWidth, bottom ~60% of rimWidth
    //  - Bottom ends with a small rounded base curve
    const rimH = 16;           // collar/rim height
    const bodyTopW  = potWidth * 0.88;  // body width just below rim
    const bodyBotW  = potWidth * 0.60;  // body width at base
    const baseY     = potY + rimH + potHeight; // Y of the pot base
    
    // 1. Draw Pot Shadow
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(potX, baseY + 4, bodyBotW * 0.8, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = document.body.classList.contains('theme-forest-dark') ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.07)';
    ctx.fill();
    ctx.restore();

    // Calculate dynamic scales
    const stageInfo = getGrowthStage(currentHours);
    
    // Size shrink factor based on health
    // Fully healthy = scale 1.0, Dead = scale 0.45, dynamically scale in between
    const healthScale = isDead ? 0.45 : (0.45 + 0.55 * (currentHealth / 100));
    
    // Droop factor (stems and leaves bend down more when thirsty/sad)
    const droopFactor = isDead ? 0.9 : (1 - currentHealth / 100);
    
    // Master plant scale based on growth stage
    let stageScale = 1.0;
    switch (stageInfo.stage) {
      case 2: stageScale = 0.4; break;   // Sprout
      case 3: stageScale = 0.65; break;  // Seedling
      case 4: stageScale = 0.85; break;  // Young Plant
      case 5: stageScale = 1.0; break;   // Mature Shrub
      case 6: stageScale = 1.25; break;  // Majestic Tree
    }
    
    const masterScale = stageScale * healthScale;
    
    // Draw the Plant (Before Pot, so stem is tucked behind soil rim)
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
        ctx.rotate(windAngle);
        
        const stemLength = 60 * masterScale;
        
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
        ctx.rotate(windAngle);
        
        const stemLength = 110 * masterScale;
        
        // Draw central stem curve
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const curveOffset = -15 * droopFactor + Math.sin(windTime * 0.7) * 4;
        ctx.quadraticCurveTo(curveOffset, -stemLength / 2, 0, -stemLength);
        ctx.strokeStyle = woodColor;
        ctx.lineWidth = 6 * masterScale;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Draw leaves along the stem
        const leafPairs = 3;
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
          
          // Draw leaves on this branch
          const numLeaves = 4;
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
          
          // Leaves
          const leaves = 5;
          for (let i = 1; i <= leaves; i++) {
            const r = i / leaves;
            const ly = -length * r;
            const lSize = (22 + (1-r)*8) * masterScale;
            const leafDroop = 0.2 + (0.65 * droopFactor);
            
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
        // --- STAGE 6: MAJESTIC TREE ---
        // Thick trunk, multiple levels of branches, blooming flowers
        ctx.rotate(windAngle * 0.8);
        
        const drawTreeBranch = (startX, startY, length, angle, depth) => {
          if (depth <= 0) return;
          
          ctx.save();
          ctx.translate(startX, startY);
          
          const sway = Math.sin(windTime * 0.6 + depth) * 0.02 * (currentHealth / 100);
          const droop = (3 - depth) * 0.12 * droopFactor;
          
          ctx.rotate(angle + sway + (angle > 0 ? droop : -droop));
          
          // Thick tapering trunk/branch
          ctx.beginPath();
          ctx.moveTo(-depth * 2 * masterScale, 0);
          ctx.lineTo(-depth * 1.2 * masterScale, -length);
          ctx.lineTo(depth * 1.2 * masterScale, -length);
          ctx.lineTo(depth * 2 * masterScale, 0);
          ctx.closePath();
          ctx.fillStyle = woodColor;
          ctx.fill();
          
          // If top level branch, render full cluster of leaves
          if (depth === 1) {
            // Canopy leaves cluster
            const leafCount = 8;
            for (let i = 0; i < leafCount; i++) {
              const leafAngle = (i / leafCount) * Math.PI * 2;
              const dist = 14 * masterScale;
              const lx = Math.cos(leafAngle) * dist;
              const ly = -length + Math.sin(leafAngle) * dist;
              const lSize = 25 * masterScale;
              const leafCol = leafColors[i % leafColors.length];
              
              drawLeaf(lx, ly, lSize, lSize * 0.6, leafAngle + (Math.sin(windTime + i) * 0.1), leafCol);
            }
            
            // Blossom
            if (!isDead && currentHealth > 50 && Math.random() > 0.3) {
              drawFlower(0, -length - 4, 10 * masterScale);
            }
          } else {
            // Draw leaves along the trunk branches
            const innerLeaves = 3;
            for (let i = 1; i <= innerLeaves; i++) {
              const r = i / innerLeaves;
              const ly = -length * r;
              const lSize = 24 * masterScale;
              drawLeaf(0, ly, lSize, lSize * 0.5, -Math.PI/4 + 0.3, leafColors[i % leafColors.length]);
              drawLeaf(0, ly, lSize, lSize * 0.5, -Math.PI*3/4 - 0.3, leafColors[(i+1) % leafColors.length]);
            }
          }
          
          // Recurse branches
          if (depth > 1) {
            const nextLength = length * 0.72;
            drawTreeBranch(0, -length, nextLength, -0.65, depth - 1);
            drawTreeBranch(0, -length, nextLength, 0.65, depth - 1);
            drawTreeBranch(0, -length * 0.55, nextLength * 0.8, -0.2, depth - 1);
            drawTreeBranch(0, -length * 0.55, nextLength * 0.8, 0.2, depth - 1);
          }
          
          ctx.restore();
        };
        
        // Root trunk width scale
        drawTreeBranch(0, 0, 110 * masterScale, 0, 3);
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

    // 2. Draw Soil in Pot (Inside Rim — top ellipse of soil)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(potX, potY + rimH - 4, bodyTopW * 0.9, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = colors.soil;
    ctx.fill();
    ctx.restore();

    // 3. Draw Pot Body (Tapered walls from bodyTopW down to bodyBotW)
    ctx.save();
    ctx.beginPath();
    // Top-left under collar
    ctx.moveTo(potX - bodyTopW, potY + rimH);
    // Top-right under collar
    ctx.lineTo(potX + bodyTopW, potY + rimH);
    // Right side — straight taper with very slight inward curve (like the photo)
    ctx.quadraticCurveTo(
      potX + bodyTopW * 0.85, potY + rimH + potHeight * 0.55,
      potX + bodyBotW, baseY
    );
    // Bottom base curve
    ctx.quadraticCurveTo(potX, baseY + 6, potX - bodyBotW, baseY);
    // Left side — mirror
    ctx.quadraticCurveTo(
      potX - bodyTopW * 0.85, potY + rimH + potHeight * 0.55,
      potX - bodyTopW, potY + rimH
    );
    ctx.closePath();
    
    // Pot body gradient — 3D shading (left shadow → mid highlight → right shadow)
    const potGrad = ctx.createLinearGradient(potX - bodyTopW, potY, potX + bodyTopW, potY);
    potGrad.addColorStop(0,    activePot.shadow);
    potGrad.addColorStop(0.25, activePot.body);
    potGrad.addColorStop(0.5,  activePot.rim);      // brightest centre
    potGrad.addColorStop(0.75, activePot.body);
    potGrad.addColorStop(1,    activePot.shadow);
    
    ctx.fillStyle = potGrad;
    ctx.fill();
    ctx.strokeStyle = activePot.accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Subtle horizontal ridge near base (like the reference photo)
    const ridgeY = potY + rimH + potHeight * 0.82;
    const ridgeW = bodyBotW + (bodyTopW - bodyBotW) * 0.18 + 2;
    ctx.beginPath();
    ctx.ellipse(potX, ridgeY, ridgeW, 3.5, 0, Math.PI * 0.05, Math.PI * 1.05);
    ctx.strokeStyle = 'rgba(94, 39, 20, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.restore();
    
    // 4. Draw Thick Flat Collar / Rim  (the most distinctive feature of the reference pot)
    // The rim overhangs the body slightly and has a flat cylindrical face.
    const rimTopW = potWidth;          // rim outer width (overhanging)
    const rimBotW = bodyTopW * 1.00;  // rim bottom matches body top
    
    ctx.save();
    ctx.beginPath();
    // Top ellipse left
    ctx.moveTo(potX - rimTopW, potY);
    // Top ellipse arc (front top face)
    ctx.quadraticCurveTo(potX, potY + 5, potX + rimTopW, potY);
    // Drop straight down to bottom of rim
    ctx.lineTo(potX + rimBotW, potY + rimH);
    // Bottom ellipse arc of rim (front bottom face)
    ctx.quadraticCurveTo(potX, potY + rimH + 6, potX - rimBotW, potY + rimH);
    ctx.closePath();
    
    const rimGrad = ctx.createLinearGradient(potX - rimTopW, potY, potX + rimTopW, potY);
    rimGrad.addColorStop(0,    activePot.shadow);
    rimGrad.addColorStop(0.2,  activePot.body);
    rimGrad.addColorStop(0.5,  activePot.rim);    // top-center brightest
    rimGrad.addColorStop(0.8,  activePot.body);
    rimGrad.addColorStop(1,    activePot.shadow);
    
    ctx.fillStyle = rimGrad;
    ctx.fill();
    ctx.strokeStyle = activePot.accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    
    // 5. Draw Rim Top Ellipse (the flat top face of the collar that catches light)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(potX, potY, rimTopW, 5, 0, 0, Math.PI * 2);
    
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
    ctx.restore();
    
    // 6. Draw Animations during Chanting
    if (isChanting) {
      ctx.save();
      
      // Stream of Large Water Drops falling faster
      ctx.fillStyle = 'rgba(100, 200, 255, 0.7)';
      const dropSpeed = 150; // Increased speed significantly
      const dropRadius = 4;
      const dropSpacing = 80; // Distance between successive drops
      const dropX = w / 2;
      
      for (let i = 0; i < 3; i++) {
        // Cycle from top to bottom
        const baseDropY = (windTime * dropSpeed + i * dropSpacing) % (potY + 20);
        const dropY = baseDropY - 10;
        
        if (dropY < potY && dropY > -20) {
          // Draw tear-drop shape
          ctx.beginPath();
          ctx.arc(dropX, dropY, dropRadius, 0, Math.PI, false);
          ctx.lineTo(dropX, dropY - dropRadius * 2.5);
          ctx.closePath();
          ctx.fill();
          
          // Splash effect right as it hits the soil
          if (dropY > potY - 10) {
            ctx.fillStyle = 'rgba(100, 200, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(dropX - 6, dropY, 2, 0, Math.PI * 2);
            ctx.arc(dropX + 6, dropY, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(100, 200, 255, 0.7)'; // Reset for next drop
          }
        }
      }
      
      // Multiple Butterflies (Blue, Yellow, Red)
      const butterflies = [
        { color: 'rgba(100, 150, 255, 0.9)', offset: 0, speedX: 0.3, speedY: 0.5, flap: 10, scale: 1.0 }, // Blue
        { color: 'rgba(255, 220, 100, 0.9)', offset: 2, speedX: 0.4, speedY: 0.3, flap: 12, scale: 1.0 }, // Yellow
        { color: 'rgba(255, 100, 100, 0.9)', offset: 4, speedX: 0.25, speedY: 0.6, flap: 8, scale: 1.0 }  // Red
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
      
      // Bird sitting firmly on rim
      ctx.save();
      const birdX = potX - rimTopW + 30;
      const birdY = potY - 3; // Lowered to sit exactly on the rim
      ctx.translate(birdX, birdY);
      ctx.scale(2.5, 2.5); // Make bird significantly bigger
      
      // Bird feet
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      // Left foot
      ctx.moveTo(-2, 0);
      ctx.lineTo(-2, 2);
      ctx.lineTo(-3, 3);
      ctx.moveTo(-2, 2);
      ctx.lineTo(-1, 3);
      // Right foot
      ctx.moveTo(2, 0);
      ctx.lineTo(2, 2);
      ctx.lineTo(1, 3);
      ctx.moveTo(2, 2);
      ctx.lineTo(3, 3);
      ctx.stroke();
      
      // Bird body
      ctx.fillStyle = '#8ca6cc'; // Soft blue bird
      ctx.beginPath();
      ctx.arc(0, 0, 6, Math.PI, 0); // half circle body
      ctx.fill();
      
      // NEW: Flutter wings if tweeting
      const isTweeting = (windTime % 60) > 58; // tweet for 2 seconds every minute
      if (isTweeting) {
        ctx.fillStyle = '#6b8cbd';
        ctx.beginPath();
        const wingFlap = Math.sin(windTime * 20) * 3;
        ctx.ellipse(-1, -2, 5, 3, -0.2 + wingFlap * 0.1, 0, Math.PI*2);
        ctx.fill();
      }

      // Bird head
      ctx.beginPath();
      ctx.arc(4, -4, 4, 0, Math.PI*2);
      ctx.fill();
      
      // Bird eye
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(5, -5, 0.8, 0, Math.PI*2); // small dot eye
      ctx.fill();
      
      // Beak (Silent, closed, OR Tweeting, open)
      ctx.fillStyle = '#e5ad35';
      ctx.beginPath();
      if (isTweeting) {
        ctx.moveTo(7, -5); ctx.lineTo(12, -6); ctx.lineTo(8, -3); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(7, -3); ctx.lineTo(12, -1); ctx.lineTo(8, -1); ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.font = '6px sans-serif';
        const noteBob = Math.sin(windTime * 10) * 2;
        ctx.fillText('♪', 12, -8 + noteBob);
      } else {
        ctx.moveTo(7, -4); ctx.lineTo(11, -3); ctx.lineTo(7, -2); ctx.fill();
      }
      
      ctx.restore();

      // Lion Cub Animation State Machine
      const targetSittingX = potX - 85; // Positioned beautifully next to the pot on all screen sizes
      const offscreenLeftX = -35;
      const offscreenRightX = w + 35;

      if (isChanting) {
        if (lionState === 'offscreen') {
          lionState = 'walking-in';
          lionX = offscreenLeftX;
        } else if (lionState === 'walking-out') {
          lionState = 'walking-in';
        }

        if (lionState === 'walking-in') {
          lionX += 1.2; // Walk speed
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
          lionX += 1.2; // Walk speed
          walkBob = Math.sin(lionX * 0.3) * 2;
          if (lionX >= offscreenRightX) {
            lionX = -1000;
            lionState = 'offscreen';
            walkBob = 0;
          }
        }
      }

      const isSitting = (lionState === 'sitting');
      let isRoaring = false;
      if (isSitting) {
        // Roar for 3 seconds every 15 seconds
        const roarCycle = (windTime * 3) % 15;
        if (roarCycle > 12) {
          isRoaring = true;
        }
      }

      const lionY = potY + 70 + walkBob; // Stable ground level next to the pot
      
      ctx.save();
      ctx.translate(lionX, lionY);
      ctx.scale(1.3, 1.3); // Scale slightly for mobile optimization
      
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

      // Mane (proud fluffy brown mane)
      ctx.fillStyle = '#b36b22';
      ctx.beginPath();
      for(let i=0; i<12; i++) {
         let angle = (i/12) * Math.PI*2;
         let mx = headX + Math.cos(angle) * 8.5;
         let my = headY + Math.sin(angle) * 8.5;
         ctx.arc(mx, my, 4.5, 0, Math.PI*2);
      }
      ctx.fill();

      // Ears (tucked slightly in mane)
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
      
      ctx.restore(); // lion restore
      ctx.restore(); // isChanting block restore
    }
    
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

  // API Expose
  return {
    init: init,
    updateState: updateState,
    draw: draw,
    startAnimation: startAnimation,
    stopAnimation: stopAnimation,
    getGrowthStage: getGrowthStage,
    getPlantMood: getPlantMood,
    resizeCanvas: resizeCanvas
  };
})();
