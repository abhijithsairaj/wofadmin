/**
 * WOF RUSH - Core Game Engine & 3D Runner Mechanics
 * Handles Three.js rendering, 3-lane navigation, jump/slide physics,
 * procedural chunk generation, collision detection, near-miss system,
 * delivery run events, power-ups, food combos, and dynamic day/night cycle.
 */

class WOFGame {
  constructor() {
    this.container = document.getElementById('game-container');
    this.lanes = [-2.2, 0.0, 2.2]; // Left, Center, Right
    this.currentLane = 1; // 0 = Left, 1 = Center, 2 = Right
    this.targetX = this.lanes[this.currentLane];
    this.playerX = this.lanes[this.currentLane];

    // Physics
    this.playerY = 0;
    this.velocityY = 0;
    this.gravity = -38;
    this.jumpForce = 13.5;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.slideDuration = 0.65;

    // Movement & Speed
    this.baseSpeed = 22;
    this.speed = this.baseSpeed;
    this.maxSpeed = 48;
    this.distance = 0;
    this.score = 0;
    this.scoreMultiplier = 1;
    this.comboCounter = 0;
    this.sameFoodStreak = { type: null, count: 0 };

    // Active Meal Tracker [Main, Side, Drink]
    this.activeMeal = { main: null, side: null, drink: null };
    this.mealsCompleted = 0;

    // Delivery Run System
    this.deliveryActive = false;
    this.deliveryOrder = null;
    this.deliveryTimer = 0;
    this.deliveryDuration = 28;
    this.deliveriesCompleted = 0;
    this.nextDeliveryDistance = 350;

    // Power-ups
    this.activePowerups = {
      shield: { active: false, timer: 0 },
      magnet: { active: false, timer: 0 },
      turbo: { active: false, timer: 0 },
      burger_mode: { active: false, timer: 0 }
    };

    // Near-Miss System
    this.lastNearMissTime = 0;
    this.nearMissStreak = 0;

    // Easter Eggs
    this.easterEggsFound = 0;

    // State
    this.isPlaying = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.invulnerableTimer = 0;

    // Camera Shake
    this.cameraShake = { intensity: 0, decay: 8 };

    // Body twist counter for run animation
    this.bodyTwist = 0;

    // Jump double-jump tracker
    this.canDoubleJump = true;

    // Landing squash timer
    this.landingSquash = 0;

    // Speed streak lines (visual VFX meshes)
    this.speedLines = [];

    // Screen flash DOM element
    this.screenFlash = document.getElementById('screen-flash');

    // Environment & Chunks
    this.chunks = [];
    this.chunkLength = 40;
    this.numChunks = 8; // 8 chunks x 40m = 320m continuous forward track (eliminates black horizon voids)
    this.collectibles = [];
    this.obstacles = [];
    this.particles = [];
    this.floatingTexts = [];

    // Clock
    this.clock = new THREE.Clock();
    this.runTime = 0;

    this.initThree();
    this.initPlayer();
    this.initWorld();
    this.setupEventListeners();
  }

  // --- THREE.JS SCENE SETUP ---
  initThree() {
    this.scene = new THREE.Scene();
    // Vibrant Arcade Sky Blue - NEVER black!
    this.scene.background = new THREE.Color(0x4FC3F7);
    // Linear fog: crystal clear up to 90m, soft seamless blend up to 240m
    this.scene.fog = new THREE.Fog(0x4FC3F7, 90, 240);

    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
    this.isMobile = isMobile;

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.3, 350);
    // Heroic eye-level Subway Surfers runner camera
    this.cameraDefaultPos = new THREE.Vector3(0, 3.4, 6.6);
    this.camera.position.copy(this.cameraDefaultPos);
    this.camera.lookAt(0, 1.6, -14);

    this.renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // Mobile performance: 1.25 DPR prevents GPU thermal throttling & maintains rock-solid 60 FPS
    const dpr = isMobile ? Math.min(window.devicePixelRatio, 1.25) : Math.min(window.devicePixelRatio, 1.5);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setClearColor(0x4FC3F7, 1);

    // Disable heavy shadow map passes on mobile for 60fps; use BasicShadowMap on desktop
    if (isMobile) {
      this.renderer.shadowMap.enabled = false;
    } else {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
    }
    this.container.appendChild(this.renderer.domElement);

    // Vibrant Arcade Lighting
    this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.75);
    this.scene.add(this.ambientLight);

    // Warm sun & ground bounce lighting
    this.hemiLight = new THREE.HemisphereLight(0x4FC3F7, 0x8D6E63, 0.70);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xFFF9C4, 0.95);
    this.dirLight.position.set(15, 30, 20);
    if (!isMobile) {
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.width = 512;
      this.dirLight.shadow.mapSize.height = 512;
      this.dirLight.shadow.camera.near = 0.5;
      this.dirLight.shadow.camera.far = 80;
      const d = 20;
      this.dirLight.shadow.camera.left = -d;
      this.dirLight.shadow.camera.right = d;
      this.dirLight.shadow.camera.top = d;
      this.dirLight.shadow.camera.bottom = -d;
    }
    this.scene.add(this.dirLight);

    window.addEventListener('resize', () => this.onWindowResize());
  }

  onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // --- PLAYER CHARACTER INITIALIZATION ---
  initPlayer() {
    this.player = window.modelFactory.createRunner();
    this.player.position.set(this.playerX, 0, 0);
    this.scene.add(this.player);

    // Ground shadow blob under runner (guarantees crisp grounding on mobile & desktop with zero performance cost)
    const shadowGeo = new THREE.PlaneGeometry(0.95, 0.95);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
    this.playerShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.playerShadow.rotation.x = -Math.PI / 2;
    this.playerShadow.position.set(this.playerX, 0.02, 0);
    this.scene.add(this.playerShadow);

    // Dust particle pool for runner
    this.initDustParticles();
    // Speed streak VFX lines
    this.initSpeedLines();
  }

  initSpeedLines() {
    const stripeGeo = new THREE.PlaneGeometry(0.06, 4.5);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.0, side: THREE.DoubleSide });
    for (let i = 0; i < 30; i++) {
      const side = i < 15 ? -1 : 1;
      const mesh = new THREE.Mesh(stripeGeo, stripeMat.clone());
      const xOff = side * (4.5 + Math.random() * 3.5);
      const yOff = Math.random() * 4 - 1;
      mesh.position.set(xOff, yOff, -6 + Math.random() * 4);
      mesh.rotation.z = (Math.random() - 0.5) * 0.05;
      this.scene.add(mesh);
      this.speedLines.push({ mesh, baseX: xOff, baseY: yOff });
    }
  }

  initDustParticles() {
    const pGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xCFD8DC, transparent: true, opacity: 0.65 });
    this.dustMeshPool = [];
    for (let i = 0; i < 35; i++) {
      const p = new THREE.Mesh(pGeo, pMat);
      p.visible = false;
      this.scene.add(p);
      this.dustMeshPool.push({ mesh: p, life: 0, maxLife: 0.4, vx: 0, vy: 0, vz: 0 });
    }
  }

  spawnDust(x, y, z, count = 2) {
    let spawned = 0;
    for (const p of this.dustMeshPool) {
      if (!p.mesh.visible) {
        p.mesh.visible = true;
        p.mesh.position.set(x + (Math.random() - 0.5) * 0.4, y, z + (Math.random() - 0.5) * 0.2);
        p.vx = (Math.random() - 0.5) * 1.5;
        p.vy = Math.random() * 1.5 + 0.5;
        p.vz = Math.random() * 2 + 1;
        p.life = 0;
        p.maxLife = 0.35 + Math.random() * 0.2;
        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  // --- WORLD & CHUNK INITIALIZATION ---
  initWorld() {
    this.numChunks = 8; // 8 chunks x 40m = 320m forward track so chunks always reach beyond fog!

    // Permanent foundation ground plane at y = -0.06
    // Warm light slate concrete (0x90A4AE) - NEVER pitch black 0x1A2027!
    if (!this.groundFoundation) {
      const groundGeo = new THREE.PlaneGeometry(400, 1000);
      const groundMat = new THREE.MeshLambertMaterial({ color: 0x90A4AE }); // Warm light urban foundation
      this.groundFoundation = new THREE.Mesh(groundGeo, groundMat);
      this.groundFoundation.rotation.x = -Math.PI / 2;
      this.groundFoundation.position.set(0, -0.06, -200);
      this.scene.add(this.groundFoundation);
    }

    // Distant Nilgiris / Coimbatore mountain skyline silhouette (at horizon, blends with sky)
    if (!this.mountainBackdrop) {
      this.mountainBackdrop = new THREE.Group();
      this.mountainBackdrop.position.set(0, 0, -250);

      const mGeo = new THREE.ConeGeometry(50, 45, 4);
      const mMat = new THREE.MeshLambertMaterial({ color: 0x78909C, transparent: true, opacity: 0.65 });
      [-120, -50, 0, 60, 130].forEach((mX, i) => {
        const m = new THREE.Mesh(mGeo, mMat);
        m.position.set(mX, 15 + (i % 2) * 5, 0);
        m.scale.set(1.4, 0.8 + (i % 3) * 0.2, 0.6);
        this.mountainBackdrop.add(m);
      });
      this.scene.add(this.mountainBackdrop);
    }

    // Generate initial continuous chunks
    for (let i = 0; i < this.numChunks; i++) {
      const zPos = 10 - i * this.chunkLength;
      this.createChunk(zPos, i === 0);
    }
  }

  createChunk(zPos, isFirstChunk = false) {
    const chunk = new THREE.Group();
    chunk.position.z = zPos;

    const overlapLen = this.chunkLength + 0.6;
    const roadWidth = 7.6;

    // Road (Tarmac)
    const roadGeo = new THREE.PlaneGeometry(roadWidth, overlapLen);
    const roadMat = new THREE.MeshLambertMaterial({ color: WOF_COLORS.tarmac });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -this.chunkLength / 2);
    chunk.add(road);

    // White Edge Shoulder Lines
    const edgeGeo = new THREE.PlaneGeometry(0.18, overlapLen);
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    [-roadWidth / 2 + 0.15, roadWidth / 2 - 0.15].forEach(eX => {
      const edge = new THREE.Mesh(edgeGeo, edgeMat);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(eX, 0.012, -this.chunkLength / 2);
      chunk.add(edge);
    });

    // Yellow Dashed Lane Dividers (Between lanes)
    const markerGeo = new THREE.PlaneGeometry(0.16, 2.5);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xFFEB3B });
    [-1.1, 1.1].forEach(laneX => {
      for (let z = 0; z < this.chunkLength; z += 6) {
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.rotation.x = -Math.PI / 2;
        marker.position.set(laneX, 0.014, -z);
        chunk.add(marker);
      }
    });

    // Pedestrian Zebra Crosswalk at start of chunk
    if (!isFirstChunk) {
      const zebraGeo = new THREE.PlaneGeometry(0.55, 3.2);
      const zebraMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      for (let x = -roadWidth / 2 + 0.6; x <= roadWidth / 2 - 0.6; x += 0.95) {
        const stripe = new THREE.Mesh(zebraGeo, zebraMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(x, 0.015, -2.0);
        chunk.add(stripe);
      }
    }

    // Sidewalks (Left & Right) - Clean, bright urban pedestrian paving
    const sidewalkWidth = 4.8;
    const sidewalkGeo = new THREE.BoxGeometry(sidewalkWidth, 0.28, overlapLen);
    const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0xCFD8DC });

    const leftWalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    leftWalk.position.set(-roadWidth / 2 - sidewalkWidth / 2, 0.14, -this.chunkLength / 2);
    const rightWalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    rightWalk.position.set(roadWidth / 2 + sidewalkWidth / 2, 0.14, -this.chunkLength / 2);
    chunk.add(leftWalk, rightWalk);

    // Hazard Painted Curb Edge (Alternating Red & White blocks)
    const curbGeo = new THREE.BoxGeometry(0.24, 0.32, overlapLen);
    const curbMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const leftCurb = new THREE.Mesh(curbGeo, curbMat);
    leftCurb.position.set(-roadWidth / 2 - 0.12, 0.16, -this.chunkLength / 2);
    const rightCurb = new THREE.Mesh(curbGeo, curbMat);
    rightCurb.position.set(roadWidth / 2 + 0.12, 0.16, -this.chunkLength / 2);
    chunk.add(leftCurb, rightCurb);

    // Side Ground Pavement (Clean paver concrete under buildings extending to x = +/- 45)
    const sidePlazaGeo = new THREE.PlaneGeometry(36, overlapLen);
    const sidePlazaMat = new THREE.MeshLambertMaterial({ color: 0xCFD8DC });
    const leftPlaza = new THREE.Mesh(sidePlazaGeo, sidePlazaMat);
    leftPlaza.rotation.x = -Math.PI / 2;
    leftPlaza.position.set(-roadWidth / 2 - sidewalkWidth - 18, 0.01, -this.chunkLength / 2);

    const rightPlaza = new THREE.Mesh(sidePlazaGeo, sidePlazaMat);
    rightPlaza.rotation.x = -Math.PI / 2;
    rightPlaza.position.set(roadWidth / 2 + sidewalkWidth + 18, 0.01, -this.chunkLength / 2);
    chunk.add(leftPlaza, rightPlaza);

    // LOW Street Edge Planters / Decorative Railings (0.55m height with terracotta rim)
    // Low enough so the entire multi-story building facade and storefront are 100% visible!
    const lowWallGeo = new THREE.BoxGeometry(0.32, 0.55, overlapLen);
    const lowWallMat = new THREE.MeshLambertMaterial({ color: 0xE0E0E0 });
    const leftLowWall = new THREE.Mesh(lowWallGeo, lowWallMat);
    leftLowWall.position.set(-roadWidth / 2 - sidewalkWidth - 0.16, 0.28, -this.chunkLength / 2);
    const rightLowWall = new THREE.Mesh(lowWallGeo, lowWallMat);
    rightLowWall.position.set(roadWidth / 2 + sidewalkWidth + 0.16, 0.28, -this.chunkLength / 2);
    chunk.add(leftLowWall, rightLowWall);

    // Terracotta Wall Coping Rim on low wall
    const copingGeo = new THREE.BoxGeometry(0.40, 0.08, overlapLen);
    const copingMat = new THREE.MeshLambertMaterial({ color: 0xE65100 });
    const leftCoping = new THREE.Mesh(copingGeo, copingMat);
    leftCoping.position.set(-roadWidth / 2 - sidewalkWidth - 0.16, 0.60, -this.chunkLength / 2);
    const rightCoping = new THREE.Mesh(copingGeo, copingMat);
    rightCoping.position.set(roadWidth / 2 + sidewalkWidth + 0.16, 0.60, -this.chunkLength / 2);
    chunk.add(leftCoping, rightCoping);

    // Continuous Storefronts & Buildings: 3 on left and 3 on right per chunk!
    // Placed right along the sidewalk so the vibrant shopfronts line the road!
    const buildingZOffsets = [
      -this.chunkLength * 0.18,
      -this.chunkLength * 0.50,
      -this.chunkLength * 0.82
    ];

    buildingZOffsets.forEach((zOff, bIdx) => {
      // Left Building
      const varL = (Math.floor(Math.random() * 6) + bIdx) % 6;
      const bLeft = window.modelFactory.createBuilding(varL, 'left');
      bLeft.position.set(-roadWidth / 2 - sidewalkWidth - 2.8, 0, zOff);
      chunk.add(bLeft);

      // Right Building
      const varR = (Math.floor(Math.random() * 6) + bIdx + 3) % 6;
      const bRight = window.modelFactory.createBuilding(varR, 'right');
      bRight.position.set(roadWidth / 2 + sidewalkWidth + 2.8, 0, zOff);
      chunk.add(bRight);
    });

    // Street Lamps with warm glowing globes
    const lamp1 = window.modelFactory.createStreetLamp('right');
    lamp1.position.set(roadWidth / 2 + 1.2, 0.28, -this.chunkLength * 0.25);
    const lamp2 = window.modelFactory.createStreetLamp('right');
    lamp2.position.set(roadWidth / 2 + 1.2, 0.28, -this.chunkLength * 0.75);
    chunk.add(lamp1, lamp2);

    // Palm trees on left sidewalk
    const palm1 = window.modelFactory.createPalmTree();
    palm1.position.set(-roadWidth / 2 - 1.4, 0.28, -this.chunkLength * 0.35);
    const palm2 = window.modelFactory.createPalmTree();
    palm2.position.set(-roadWidth / 2 - 1.4, 0.28, -this.chunkLength * 0.85);
    chunk.add(palm1, palm2);

    // Overhead Festive Bunting Wire with Triangular Party Flags across street
    const buntingWireGeo = new THREE.CylinderGeometry(0.015, 0.015, roadWidth + 3, 6);
    const buntingWireMat = new THREE.MeshBasicMaterial({ color: 0x37474F });
    const buntingWire = new THREE.Mesh(buntingWireGeo, buntingWireMat);
    buntingWire.rotation.z = Math.PI / 2;
    buntingWire.position.set(0, 5.2, -this.chunkLength * 0.5);
    chunk.add(buntingWire);

    // Triangular Bunting Flags hanging from wire
    const flagColors = [0xFF6B00, 0xFFD000, 0x00E5FF, 0x00E676, 0xD32F2F];
    const flagGeo = new THREE.ConeGeometry(0.22, 0.45, 3);
    for (let fX = -roadWidth / 2 + 0.3; fX <= roadWidth / 2 - 0.3; fX += 0.75) {
      const fMat = new THREE.MeshBasicMaterial({ color: flagColors[Math.floor(Math.random() * flagColors.length)], side: THREE.DoubleSide });
      const flag = new THREE.Mesh(flagGeo, fMat);
      flag.rotation.x = Math.PI;
      flag.position.set(fX, 4.95, -this.chunkLength * 0.5);
      chunk.add(flag);
    }

    // Occasional Road Banner across street
    if (Math.random() < 0.35 && !isFirstChunk) {
      const banners = [
        'WOF RUSH - FRESH STREET FOOD',
        'SELVAPURAM SPECIAL - WOF MEALS',
        'TRY OUR FAMOUS CRISPY FRIES!',
        'BEAT THE RUSH - HOT FOOD FAST'
      ];
      const banner = window.modelFactory.createRoadBanner(banners[Math.floor(Math.random() * banners.length)]);
      banner.position.set(0, 0, -this.chunkLength * 0.5);
      chunk.add(banner);
    }

    this.scene.add(chunk);
    chunk.userData = { zPos };
    this.chunks.push(chunk);

    // Populate Obstacles & Collectibles (skip on the very first starting runway)
    if (!isFirstChunk) {
      this.populateChunkContents(zPos);
    }
  }

  // Populate dynamic items along the chunk
  populateChunkContents(chunkZ) {
    const laneIndices = [0, 1, 2];
    const dist = this.distance;

    // Dynamic difficulty tiers
    // Easy: 0-500m | Medium: 500-1500m | Hard: 1500-2500m | RUSH: 2500m+
    const isEasy   = dist < 500;
    const isMedium = dist >= 500 && dist < 1500;
    const isHard   = dist >= 1500 && dist < 2500;
    const isRush   = dist >= 2500;

    // More obstacle slots at higher difficulty
    const segmentOffsets = isRush ? [8, 20, 32] : (isHard ? [10, 28] : [14, 30]);

    segmentOffsets.forEach(offset => {
      const spawnZ = chunkZ - offset;

      // Determine obstacle layout based on difficulty
      let blockedLanes = [];

      if (isEasy) {
        // Single lane blocked
        blockedLanes = [Math.floor(Math.random() * 3)];

      } else if (isMedium) {
        // 40% chance double block
        const numBlocks = Math.random() < 0.40 ? 2 : 1;
        const shuffledLanes = [...laneIndices].sort(() => Math.random() - 0.5);
        blockedLanes = shuffledLanes.slice(0, numBlocks);

      } else if (isHard) {
        // 65% double, 15% triple-with-escape (only 1 gap so player must react)
        const r = Math.random();
        if (r < 0.15) {
          // Triple-lane threat: 2 lanes blocked, 1 open — jump over the barrier in the open lane
          const shuffledLanes = [...laneIndices].sort(() => Math.random() - 0.5);
          blockedLanes = shuffledLanes.slice(0, 2);
          // Force barriers (jumpable) so player can still jump-escape
          const openLane = shuffledLanes[2];
          // Spawn jumpable barrier in open lane too — player must time jump
          if (Math.random() < 0.4) {
            const barrierObs = window.modelFactory.createRoadBarrier();
            barrierObs.position.set(this.lanes[openLane], 0, spawnZ);
            barrierObs.userData.lane = openLane;
            barrierObs.userData.spawnZ = spawnZ;
            barrierObs.userData.passed = false;
            this.scene.add(barrierObs);
            this.obstacles.push(barrierObs);
          }
        } else if (r < 0.65) {
          const shuffledLanes = [...laneIndices].sort(() => Math.random() - 0.5);
          blockedLanes = shuffledLanes.slice(0, 2);
        } else {
          blockedLanes = [Math.floor(Math.random() * 3)];
        }

      } else if (isRush) {
        // RUSH MODE: Most segments are 2-lane blocks, ~20% chance of ALL-3 jumpable wall
        const r = Math.random();
        if (r < 0.20) {
          // All 3 lanes — must jump! Place only jumpable barriers
          blockedLanes = [0, 1, 2];
        } else {
          const shuffledLanes = [...laneIndices].sort(() => Math.random() - 0.5);
          blockedLanes = shuffledLanes.slice(0, 2);
        }
      }

      blockedLanes.forEach(laneIdx => {
        const laneX = this.lanes[laneIdx];
        const r = Math.random();
        let obs;

        // In Rush mode, prefer jumpable obstacles for all-3-lane blocks
        const forceJumpable = isRush && blockedLanes.length === 3;

        if (forceJumpable) {
          obs = window.modelFactory.createRoadBarrier();
          obs.position.set(laneX, 0, spawnZ);
        } else if (r < 0.35) {
          // Coimbatore Auto-Rickshaw!
          obs = window.modelFactory.createRickshaw();
          obs.position.set(laneX, 0, spawnZ);
        } else if (r < 0.55) {
          // Parked / Slow Scooter
          obs = window.modelFactory.createScooter();
          obs.position.set(laneX, 0, spawnZ);
        } else if (r < 0.72) {
          // Jumpable Road Barrier
          obs = window.modelFactory.createRoadBarrier();
          obs.position.set(laneX, 0, spawnZ);
        } else if (r < 0.88) {
          // Slide Barrier (Must Slide!)
          obs = window.modelFactory.createSlideBarrier();
          obs.position.set(laneX, 0, spawnZ);
        } else {
          // Street Vendor Cart
          obs = window.modelFactory.createVendorCart();
          obs.position.set(laneX, 0, spawnZ);
        }

        obs.userData.lane = laneIdx;
        obs.userData.spawnZ = spawnZ;
        obs.userData.passed = false;

        // Moving obstacle: at Hard+ difficulty, 20% chance obstacle slowly shifts lane
        if ((isHard || isRush) && Math.random() < 0.20 && blockedLanes.length < 3) {
          obs.userData.isMoving = true;
          obs.userData.moveDir = Math.random() < 0.5 ? 1 : -1;
          obs.userData.moveSpeed = 1.2 + Math.random() * 0.8;
          obs.userData.moveRange = 1.0 + Math.random() * 0.8;
          obs.userData.moveOriginX = laneX;
        }

        this.scene.add(obs);
        this.obstacles.push(obs);
      });

      // Place food collectibles in the OPEN lane(s)
      const freeLanes = laneIndices.filter(l => !blockedLanes.includes(l));
      if (freeLanes.length > 0) {
        const foodLane = freeLanes[Math.floor(Math.random() * freeLanes.length)];
        // More food items at higher speed to compensate for difficulty
        const foodCount = isRush ? 4 : isMedium ? 3 : 3;
        this.spawnFoodRow(this.lanes[foodLane], spawnZ - 4, foodCount);
      }
    });

    // Rare Power-Up Spawn (10% chance per chunk)
    if (Math.random() < 0.18) {
      const pLane = this.lanes[Math.floor(Math.random() * 3)];
      const pZ = chunkZ - 20;
      this.spawnPowerup(pLane, pZ);
    }

    // Ultra Rare Golden Fry Easter Egg (4% chance per chunk)
    if (Math.random() < 0.04) {
      const gLane = this.lanes[Math.floor(Math.random() * 3)];
      const gZ = chunkZ - 22;
      const goldenFry = window.modelFactory.createGoldenFryItem();
      goldenFry.position.set(gLane, 1.8, gZ);
      this.scene.add(goldenFry);
      this.collectibles.push(goldenFry);
    }

    // Rare Mascot Easter Egg waving on sidewalk (8% chance)
    if (Math.random() < 0.08) {
      const mascot = window.modelFactory.createEasterEggMascot();
      const sideX = Math.random() < 0.5 ? -4.6 : 4.6;
      mascot.position.set(sideX, 0.3, chunkZ - 18);
      this.scene.add(mascot);
      this.collectibles.push(mascot);
    }

    // Giant Rolling Burger Hazard Easter Egg (when distance > 350m, 10% chance)
    if (this.distance > 350 && Math.random() < 0.10) {
      const burgerHaz = window.modelFactory.createGiantRollingBurger();
      burgerHaz.position.set(0, 1.8, chunkZ - 32);
      this.scene.add(burgerHaz);
      this.obstacles.push(burgerHaz);
    }
  }

  spawnFoodRow(laneX, startZ, count = 3) {
    // Choose what food to spawn
    // Check if delivery run is active and prioritize delivery targets!
    let foodType = null;
    if (this.deliveryActive && this.deliveryOrder) {
      const needed = [];
      if (this.deliveryOrder.burger > 0) needed.push('burger');
      if (this.deliveryOrder.fries > 0) needed.push('fries');
      if (this.deliveryOrder.drink > 0) needed.push('drink');
      if (needed.length > 0 && Math.random() < 0.6) {
        foodType = needed[Math.floor(Math.random() * needed.length)];
      }
    }

    if (!foodType) {
      const types = ['burger', 'fries', 'drink', 'pizza', 'waffle', 'falooda'];
      foodType = types[Math.floor(Math.random() * types.length)];
    }

    for (let i = 0; i < count; i++) {
      let item;
      switch (foodType) {
        case 'burger': item = window.modelFactory.createBurgerItem(); break;
        case 'fries': item = window.modelFactory.createFriesItem(); break;
        case 'drink': item = window.modelFactory.createDrinkItem(); break;
        case 'pizza': item = window.modelFactory.createPizzaItem(); break;
        case 'waffle': item = window.modelFactory.createWaffleItem(); break;
        case 'falooda': item = window.modelFactory.createFaloodaItem(); break;
        default: item = window.modelFactory.createBurgerItem(); break;
      }

      item.position.set(laneX, 1.2, startZ - i * 2.2);
      this.scene.add(item);
      this.collectibles.push(item);
    }
  }

  spawnPowerup(laneX, z) {
    const powerups = ['shield', 'magnet', 'turbo', 'burger_mode'];
    const pType = powerups[Math.floor(Math.random() * powerups.length)];
    let pMesh;
    switch (pType) {
      case 'shield': pMesh = window.modelFactory.createShieldPowerup(); break;
      case 'magnet': pMesh = window.modelFactory.createMagnetPowerup(); break;
      case 'turbo': pMesh = window.modelFactory.createTurboPowerup(); break;
      case 'burger_mode': pMesh = window.modelFactory.createBurgerModePowerup(); break;
    }
    pMesh.position.set(laneX, 1.3, z);
    this.scene.add(pMesh);
    this.collectibles.push(pMesh);
  }

  // --- CONTROLS & INPUT ---
  setupEventListeners() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // High-responsiveness Touch Swipe Handling for Smartphones
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let swipeTriggered = false;

    window.addEventListener('touchstart', (e) => {
      // Don't intercept if touching on UI buttons or inputs
      if (e.target.closest('button, input, a, .touch-btn, .modal-content')) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      swipeTriggered = false;
    }, { passive: true });

    // Prevent screen dragging / pull-to-refresh on mobile browsers
    window.addEventListener('touchmove', (e) => {
      if (!this.isPlaying || this.isPaused || this.isGameOver) return;
      if (e.target.closest('input, .modal-content, .leaderboard-list')) return;
      e.preventDefault();

      // Early swipe trigger for ultra-snappy native arcade feel
      if (!swipeTriggered && e.touches.length > 0) {
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const dx = currentX - touchStartX;
        const dy = currentY - touchStartY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (absX > 28 || absY > 28) {
          swipeTriggered = true;
          if (absX > absY) {
            if (dx > 0) this.moveLane(1);
            else this.moveLane(-1);
          } else {
            if (dy < 0) this.jump();
            else this.slide();
          }
        }
      }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      if (swipeTriggered || !this.isPlaying || this.isPaused || this.isGameOver) return;
      if (e.target.closest('button, input, a, .touch-btn')) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      const dt = Date.now() - touchStartTime;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (dt < 400 && (absX > 20 || absY > 20)) {
        if (absX > absY) {
          if (dx > 0) this.moveLane(1);
          else this.moveLane(-1);
        } else {
          if (dy < 0) this.jump();
          else this.slide();
        }
      }
    }, { passive: true });
  }

  handleKeyDown(e) {
    if (!this.isPlaying) return;

    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      this.togglePause();
      return;
    }

    if (this.isPaused || this.isGameOver) return;

    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.moveLane(-1);
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.moveLane(1);
        break;
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        this.jump();
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.slide();
        break;
    }
  }

  moveLane(dir) {
    const nextLane = this.currentLane + dir;
    if (nextLane >= 0 && nextLane <= 2) {
      this.currentLane = nextLane;
      this.targetX = this.lanes[this.currentLane];
      window.audioManager.playLaneSwitch();
    }
  }

  jump() {
    if (!this.isJumping) {
      this.isJumping = true;
      this.velocityY = this.jumpForce;
      this.isSliding = false;
      this.slideTimer = 0;
      this.canDoubleJump = true;
      window.audioManager.playJump();
    } else if (this.canDoubleJump && this.playerY > 0.7) {
      // Subway Surfers acrobatic air jump
      this.canDoubleJump = false;
      this.velocityY = this.jumpForce * 0.82;
      window.audioManager.playJump();
      this.spawnDust(this.playerX, this.playerY, 0, 5);
      if (this.player && this.player.userData.bodyRoot) {
        this.player.userData.bodyRoot.rotation.x = -Math.PI * 0.35;
      }
    }
  }

  slide() {
    if (this.isJumping) {
      // Fast drop down if mid-air
      this.velocityY = -18;
    } else if (!this.isSliding) {
      this.isSliding = true;
      this.slideTimer = this.slideDuration;
      window.audioManager.playSlide();
      this.spawnDust(this.playerX, 0.1, 0, 5);
    }
  }

  // --- GAMEPLAY LIFECYCLE ---
  start() {
    this.reset();
    this.isPlaying = true;
    this.isPaused = false;
    this.isGameOver = false;
    window.audioManager.startMusic();
    this.clock.start();
    this.animate();
  }

  reset() {
    this.currentLane = 1;
    this.targetX = this.lanes[this.currentLane];
    this.playerX = this.lanes[this.currentLane];
    this.playerY = 0;
    this.velocityY = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.canDoubleJump = true;
    this.cameraShake.intensity = 0;

    this.speed = this.baseSpeed;
    this.distance = 0;
    this.score = 0;
    this.scoreMultiplier = 1;
    this.comboCounter = 0;
    this.sameFoodStreak = { type: null, count: 0 };
    this.activeMeal = { main: null, side: null, drink: null };
    this.mealsCompleted = 0;

    this.deliveryActive = false;
    this.deliveryOrder = null;
    this.deliveryTimer = 0;
    this.deliveriesCompleted = 0;
    this.nextDeliveryDistance = 350;

    this.easterEggsFound = 0;
    this.lastNearMissTime = 0;
    this.nearMissStreak = 0;
    this.invulnerableTimer = 0;

    // Reset powerups
    Object.keys(this.activePowerups).forEach(k => {
      this.activePowerups[k].active = false;
      this.activePowerups[k].timer = 0;
    });

    // Clear dynamic entities
    this.obstacles.forEach(o => this.scene.remove(o));
    this.obstacles = [];
    this.collectibles.forEach(c => this.scene.remove(c));
    this.collectibles = [];
    this.chunks.forEach(ch => this.scene.remove(ch));
    this.chunks = [];

    // Rebuild initial runway
    this.initWorld();

    // Reset player model visuals
    if (this.player) {
      this.player.userData.bodyRoot.visible = true;
      this.player.userData.shieldMesh.visible = false;
      this.player.userData.giantBurger.visible = false;
      this.player.userData.isBurgerMode = false;
      this.player.rotation.set(0, 0, 0);
    }

    if (this.playerShadow) {
      this.playerShadow.position.set(this.playerX, 0.02, 0);
      this.playerShadow.scale.set(1, 1, 1);
      this.playerShadow.material.opacity = 0.35;
    }

    if (window.uiManager) {
      window.uiManager.updateHUD();
      window.uiManager.updateMealSlots(this.activeMeal);
      window.uiManager.hideDeliveryCard();
    }
  }

  togglePause() {
    if (!this.isPlaying || this.isGameOver) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      window.audioManager.stopMusic();
      if (window.uiManager) window.uiManager.showPauseMenu(true);
    } else {
      window.audioManager.startMusic();
      if (window.uiManager) window.uiManager.showPauseMenu(false);
      this.clock.getDelta(); // clear delta jump
    }
  }

  gameOver() {
    this.isGameOver = true;
    this.isPlaying = false;
    window.audioManager.stopMusic();
    window.audioManager.playHit();

    // Stumble animation on player
    this.player.userData.bodyRoot.rotation.x = -Math.PI / 3;
    this.player.position.y = 0.4;

    // Dramatic camera shake + red hit screen flash
    this.cameraShake.intensity = 0.55;
    this.triggerScreenFlash('#D50000', 0.5, 0.45);

    if (window.uiManager) {
      window.uiManager.showGameOverScreen({
        score: Math.floor(this.score),
        distance: Math.floor(this.distance),
        meals: this.mealsCompleted,
        deliveries: this.deliveriesCompleted,
        easterEggs: this.easterEggsFound
      });
    }
  }

  // --- CORE UPDATE LOOP ---
  animate() {
    if (!this.isPlaying) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    requestAnimationFrame(() => this.animate());

    if (this.isPaused) return;

    const dt = Math.min(this.clock.getDelta(), 0.1);
    this.runTime += dt;

    this.updateSpeedAndDifficulty(dt);
    this.updatePlayerPhysics(dt);
    this.updateWorldMovement(dt);
    this.updatePowerups(dt);
    this.updateDeliveryRun(dt);
    this.updateCollectibles(dt);
    this.updateObstaclesAndCollisions(dt);
    this.updateParticles(dt);
    this.updateSpeedLines(dt);
    this.updateEnvironmentLighting();
    this.updateCamera(dt);

    if (window.uiManager) {
      window.uiManager.updateHUD();
    }

    this.renderer.render(this.scene, this.camera);
  }

  // Dynamic speed & difficulty scaling
  updateSpeedAndDifficulty(dt) {
    // Speed increases gradually with distance
    const targetSpeed = Math.min(this.baseSpeed + (this.distance / 120), this.maxSpeed);
    const speedBoost = this.activePowerups.turbo.active ? 1.6 : 1.0;
    this.speed = targetSpeed * speedBoost;

    // Distance & Score progression
    const distDelta = this.speed * dt;
    this.distance += distDelta;

    const turboMult = this.activePowerups.turbo.active ? 3 : 1;
    this.score += distDelta * this.scoreMultiplier * turboMult;

    // Music turbo tempo
    window.audioManager.setTurbo(this.activePowerups.turbo.active);
  }

  // Smooth player interpolation, jumping & sliding
  updatePlayerPhysics(dt) {
    // Lateral lane transition (snappy spring lerp — faster than before for arcade feel)
    const lerpFactor = Math.min(dt * 18, 1.0);
    this.playerX += (this.targetX - this.playerX) * lerpFactor;

    // Jump Physics
    if (this.isJumping) {
      this.playerY += this.velocityY * dt;
      this.velocityY += this.gravity * dt;

      if (this.playerY <= 0) {
        this.playerY = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.canDoubleJump = true;
        // Landing squash effect
        this.landingSquash = 0.22;
        this.spawnDust(this.playerX, 0, 0, 5);
        // Camera jolt on landing
        this.cameraShake.intensity = Math.max(this.cameraShake.intensity, 0.06);
      }
    }

    // Slide Physics
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      } else {
        // Continuous dust during slide
        if (Math.random() < 0.4) {
          this.spawnDust(this.playerX, 0.1, 0, 1);
        }
      }
    }

    // Landing squash decay
    if (this.landingSquash > 0) {
      this.landingSquash = Math.max(0, this.landingSquash - dt * 6);
    }

    // Apply position
    this.player.position.set(this.playerX, this.playerY, 0);

    // Apply ground shadow blob under runner (tracks position & scales on jump)
    if (this.playerShadow) {
      this.playerShadow.position.x = this.playerX;
      const shadowScale = Math.max(0.4, 1.0 - this.playerY * 0.16);
      this.playerShadow.scale.set(shadowScale, shadowScale, 1);
      this.playerShadow.material.opacity = Math.max(0.08, 0.35 - this.playerY * 0.09);
    }

    // Apply landing squash to whole player
    if (this.landingSquash > 0) {
      const sq = 1.0 - this.landingSquash;
      const stretch = 1.0 + this.landingSquash * 0.5;
      this.player.scale.set(stretch, sq, stretch);
    } else {
      this.player.scale.set(1, 1, 1);
    }

    // Character Animations (Run cycle, jump tuck, slide crouch, burger roll)
    const uData = this.player.userData;
    if (uData.isBurgerMode) {
      uData.giantBurger.rotation.x += this.speed * dt * 0.8;
    } else {
      const speedT = Math.min(this.speed / this.maxSpeed, 1.0); // 0..1

      if (!this.isJumping && !this.isSliding) {
        // === RUNNING ANIMATION ===
        uData.runCycle += dt * this.speed * 0.92;
        const swing = Math.sin(uData.runCycle);
        const swingAbs = Math.abs(swing);

        // Leg swing — bigger amplitude at higher speeds
        const legAmp = 0.68 + speedT * 0.24;
        uData.leftLegPivot.rotation.x  =  swing * legAmp;
        uData.rightLegPivot.rotation.x = -swing * legAmp;

        // Arm pump — counter to legs with athletic sprinter bent elbows!
        const armAmp = 0.80 + speedT * 0.26;
        uData.leftArmPivot.rotation.x  = -swing * armAmp;
        uData.rightArmPivot.rotation.x =  swing * armAmp;
        uData.leftArmPivot.rotation.z  =  0.12;
        uData.rightArmPivot.rotation.z = -0.12;

        // Dynamic elbow flexion! Pumping fists forward and back
        if (uData.leftForearmGroup) {
          uData.leftForearmGroup.rotation.x = -1.25 - swing * 0.28;
        }
        if (uData.rightForearmGroup) {
          uData.rightForearmGroup.rotation.x = -1.25 + swing * 0.28;
        }

        // Torso twist (counter-rotation to hips) — the SS signature move
        uData.bodyRoot.rotation.y = swing * (0.07 + speedT * 0.04);

        // Head bob — slight up/down oscillation
        uData.headGroup.position.y = 2.04 + swingAbs * 0.035;
        uData.headGroup.rotation.z = swing * 0.04;

        // Hip bounce — vertical bob
        uData.bodyRoot.position.y = swingAbs * (0.06 + speedT * 0.04);
        // Forward lean increases with speed
        uData.bodyRoot.rotation.x = 0.07 + speedT * 0.12;

      } else if (this.isJumping) {
        // === JUMP ANIMATION ===
        const jumpT = Math.min(this.playerY / 3.5, 1.0); // 0=ground, 1=apex

        // Legs tuck up at apex, extend on descent
        const tuck = Math.sin(jumpT * Math.PI) * 0.7;
        uData.leftLegPivot.rotation.x  = -0.4 - tuck;
        uData.rightLegPivot.rotation.x = -0.4 - tuck;

        // Arms swing back for aerodynamics
        uData.leftArmPivot.rotation.x  = 0.6 + tuck * 0.3;
        uData.rightArmPivot.rotation.x = 0.6 + tuck * 0.3;
        uData.leftArmPivot.rotation.z  = 0.35;
        uData.rightArmPivot.rotation.z = -0.35;

        if (uData.leftForearmGroup) uData.leftForearmGroup.rotation.x = -0.6;
        if (uData.rightForearmGroup) uData.rightForearmGroup.rotation.x = -0.6;

        // Body tilts back slightly at peak
        uData.bodyRoot.rotation.x = -0.08 - jumpT * 0.06;
        uData.bodyRoot.rotation.y = 0;
        uData.bodyRoot.position.y = 0;
        uData.headGroup.position.y = 2.04;
        uData.headGroup.rotation.z = 0;

      } else if (this.isSliding) {
        // === SLIDE ANIMATION ===
        uData.bodyRoot.position.y = -0.6;
        uData.bodyRoot.rotation.x = 1.15; // nearly flat
        uData.bodyRoot.rotation.y = 0;
        uData.leftLegPivot.rotation.x  = 0.5;
        uData.rightLegPivot.rotation.x = 0.5;
        uData.leftArmPivot.rotation.x  = -0.3;
        uData.rightArmPivot.rotation.x = -0.3;
        uData.leftArmPivot.rotation.z  = 0.6;
        uData.rightArmPivot.rotation.z = -0.6;
        if (uData.leftForearmGroup) uData.leftForearmGroup.rotation.x = -0.4;
        if (uData.rightForearmGroup) uData.rightForearmGroup.rotation.x = -0.4;
        uData.headGroup.position.y = 2.04;
        uData.headGroup.rotation.z = 0;
      }

      // Lateral anticipatory lean when switching lanes — more at higher speeds
      const laneDelta = this.targetX - this.playerX;
      const leanAmt = 0.22 + speedT * 0.1;
      uData.bodyRoot.rotation.z = -laneDelta * leanAmt;
    }

    // Invulnerability visual blink
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      this.player.visible = Math.floor(this.runTime * 20) % 2 === 0;
    } else {
      this.player.visible = true;
    }
  }

  // World scrolling & continuous chunk recycling
  updateWorldMovement(dt) {
    const moveZ = this.speed * dt;

    // Scroll road chunks
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      chunk.position.z += moveZ;

      // When chunk passes well behind camera (z > 25), recycle to back of line
      if (chunk.position.z > 25) {
        // Find furthest chunk
        let minZ = 0;
        this.chunks.forEach(c => {
          if (c.position.z < minZ) minZ = c.position.z;
        });

        chunk.position.z = minZ - this.chunkLength;
        // Populate new contents on recycled chunk
        this.populateChunkContents(chunk.position.z);
      }
    }

    // Move obstacles towards player
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.position.z += moveZ;

      // Handle moving obstacles (lane shifting)
      if (obs.userData.isMoving) {
        obs.position.x += obs.userData.moveDir * obs.userData.moveSpeed * dt;
        if (Math.abs(obs.position.x - obs.userData.moveOriginX) > obs.userData.moveRange) {
          obs.userData.moveDir *= -1;
        }
      }

      // Near-miss check when obstacle passes right by player (Z between 0 and 2.0)
      if (!obs.userData.passed && obs.position.z >= 0) {
        obs.userData.passed = true;
        this.checkNearMiss(obs);
      }

      // CRITICAL FIX: As soon as obstacle passes the runner (z > 2.2), remove it immediately!
      // This completely prevents it from entering the space between the runner (z=0)
      // and the camera (z=7.5), eliminating the hollow box/backface clipping glitch!
      if (obs.position.z > 2.2) {
        this.scene.remove(obs);
        this.obstacles.splice(i, 1);
      }
    }

    // Move collectibles towards player
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      col.position.z += moveZ;

      // Magnet attraction towards player
      if (this.activePowerups.magnet.active && col.userData.foodType) {
        const dX = this.playerX - col.position.x;
        const dY = (this.playerY + 1.2) - col.position.y;
        const dZ = 0 - col.position.z;
        const dist = Math.sqrt(dX * dX + dY * dY + dZ * dZ);

        if (dist < 14) {
          col.position.x += dX * dt * 10;
          col.position.y += dY * dt * 10;
          col.position.z += dZ * dt * 8;
        }
      }

      // Rotate collectible for visual polish
      col.rotation.y += dt * 3.0;

      // Remove collectibles once safely behind runner (z > 1.8)
      if (col.position.z > 1.8) {
        this.scene.remove(col);
        this.collectibles.splice(i, 1);
      }
    }
  }

  // --- NEAR-MISS DETECTION ---
  checkNearMiss(obs) {
    // If player is in same lane, they already collided or jumped/slid
    // Near-miss occurs if:
    // 1) Player is in adjacent lane and passed within 1.8 units lateral distance, OR
    // 2) Player jumped over a barrier with vertical margin < 0.6m
    const xDist = Math.abs(this.playerX - obs.position.x);

    let isNear = false;
    if (xDist > 0.8 && xDist < 2.4 && !obs.userData.mustSlide) {
      isNear = true;
    } else if (obs.userData.jumpable && this.isJumping) {
      const yDist = this.playerY - obs.userData.height;
      if (yDist >= 0 && yDist < 0.6) {
        isNear = true;
      }
    }

    if (isNear) {
      const now = performance.now();
      if (now - this.lastNearMissTime < 3500) {
        this.nearMissStreak++;
      } else {
        this.nearMissStreak = 1;
      }
      this.lastNearMissTime = now;

      const bonus = 50 * this.nearMissStreak;
      this.score += bonus;
      window.audioManager.playNearMiss();

      const label = this.nearMissStreak > 1 ? `DANGER ZONE x${this.nearMissStreak}! +${bonus}` : `NEAR MISS! +${bonus}`;
      if (window.uiManager) {
        window.uiManager.showFloatingToast(label, '#FF9100');
      }
    }
  }

  // --- COLLECTIBLES & SIGNATURE WOF MEAL MECHANIC ---
  updateCollectibles(dt) {
    const pX = this.playerX;
    const pY = this.playerY + 1.1; // runner center height
    const pZ = 0;

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];

      // Check Mascot Easter Egg proximity + jump
      if (col.userData.isMascot) {
        if (!col.userData.waved && Math.abs(col.position.z) < 4.5 && this.isJumping) {
          col.userData.waved = true;
          this.easterEggsFound++;
          this.score += 500;
          window.audioManager.playGoldenFry();
          if (window.uiManager) {
            window.uiManager.showFloatingToast('SECRET FOUND! WOF MASCOT WAVE! +500', '#FFD000');
          }
        }
        continue;
      }

      const radius = col.userData.radius || 0.6;
      const dx = pX - col.position.x;
      const dy = pY - col.position.y;
      const dz = pZ - col.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < radius + 0.65) {
        // Collect!
        this.collectItem(col);
        this.scene.remove(col);
        this.collectibles.splice(i, 1);
      }
    }
  }

  collectItem(col) {
    const uData = col.userData;

    // 1. Power-up collected
    if (uData.powerupType) {
      this.activatePowerup(uData.powerupType, uData.duration);
      this.spawnCollectParticles(col.position.x, col.position.y, col.position.z, 0x00E5FF, 12);
      this.triggerScreenFlash('#00E5FF', 0.30, 0.35);
      window.audioManager.playPowerup();
      if (window.uiManager) {
        window.uiManager.showFloatingToast(`POWER-UP: ${uData.powerupType.toUpperCase().replace('_', ' ')}!`, '#00E5FF');
      }
      return;
    }

    // 2. Easter Egg: Golden Fry!
    if (uData.isGolden) {
      this.easterEggsFound++;
      this.score += 1000;
      this.spawnCollectParticles(col.position.x, col.position.y, col.position.z, 0xFFD700, 16);
      this.triggerScreenFlash('#FFD700', 0.35, 0.4);
      window.audioManager.playGoldenFry();
      if (window.uiManager) {
        window.uiManager.showFloatingToast('🌟 GOLDEN FRY! +1,000 PTS!', '#FFD700');
      }
      return;
    }

    // 3. WOF Food Items
    const fType = uData.foodType;
    const cat = uData.category;
    const pts = (uData.points || 25) * this.scoreMultiplier;
    this.score += pts;
    this.spawnCollectParticles(col.position.x, col.position.y, col.position.z, 0xFF9100, 6);

    // Check same-food streak
    if (this.sameFoodStreak.type === fType) {
      this.sameFoodStreak.count++;
      if (this.sameFoodStreak.count === 3) {
        const bonus = 150 * this.scoreMultiplier;
        this.score += bonus;
        this.comboCounter++;
        this.scoreMultiplier = Math.min(this.scoreMultiplier + 1, 12);
        this.triggerScreenFlash('#FFD000', 0.20, 0.25);
        if (window.uiManager) {
          window.uiManager.showFloatingToast(`${fType.toUpperCase()} COMBO x3! +${bonus}`, '#FFD000');
        }
      }
    } else {
      this.sameFoodStreak = { type: fType, count: 1 };
    }

    window.audioManager.playPickup(Math.min(this.sameFoodStreak.count, 6));

    // Update Signature WOF Meal Slots (Main + Side + Drink)
    if (cat === 'main') this.activeMeal.main = fType;
    else if (cat === 'side') this.activeMeal.side = fType;
    else if (cat === 'drink') this.activeMeal.drink = fType;

    if (window.uiManager) {
      window.uiManager.updateMealSlots(this.activeMeal);
    }

    // Check if WOF Meal is complete!
    if (this.activeMeal.main && this.activeMeal.side && this.activeMeal.drink) {
      this.completeMeal();
    }

    // Check active delivery order item
    if (this.deliveryActive && this.deliveryOrder) {
      if (this.deliveryOrder[fType] && this.deliveryOrder[fType] > 0) {
        this.deliveryOrder[fType]--;
        if (window.uiManager) {
          window.uiManager.updateDeliveryProgress(this.deliveryOrder);
        }
        // Check if delivery complete!
        if (this.deliveryOrder.burger <= 0 && this.deliveryOrder.fries <= 0 && this.deliveryOrder.drink <= 0) {
          this.completeDelivery();
        }
      }
    }
  }

  completeMeal() {
    this.mealsCompleted++;
    const bonus = 500 * this.scoreMultiplier;
    this.score += bonus;
    this.comboCounter++;
    this.scoreMultiplier = Math.min(this.scoreMultiplier + 1, 12);

    this.spawnCollectParticles(this.playerX, this.playerY + 1.2, 0, 0xFFD700, 18);
    this.triggerScreenFlash('#FFD700', 0.32, 0.4);
    this.cameraShake.intensity = Math.max(this.cameraShake.intensity, 0.16);

    window.audioManager.playMealComplete();

    // Reset meal slots for next combo
    this.activeMeal = { main: null, side: null, drink: null };

    if (window.uiManager) {
      window.uiManager.showMealCompleteBanner(bonus);
      window.uiManager.updateMealSlots(this.activeMeal);
    }
  }

  // --- DELIVERY RUN EVENTS ---
  updateDeliveryRun(dt) {
    // Check if it's time to trigger a new delivery run
    if (!this.deliveryActive && this.distance >= this.nextDeliveryDistance) {
      this.triggerDeliveryRun();
    }

    if (this.deliveryActive) {
      this.deliveryTimer -= dt;
      if (window.uiManager) {
        window.uiManager.updateDeliveryTimer(Math.max(0, Math.ceil(this.deliveryTimer)));
      }

      if (this.deliveryTimer <= 0) {
        // Order Cold!
        this.deliveryActive = false;
        this.nextDeliveryDistance = this.distance + 400 + Math.random() * 200;
        if (window.uiManager) {
          window.uiManager.showFloatingToast('ORDER COLD! (Keep running!)', '#E53935');
          window.uiManager.hideDeliveryCard();
        }
      }
    }
  }

  triggerDeliveryRun() {
    this.deliveryActive = true;
    this.deliveryTimer = this.deliveryDuration;
    const orderNum = 1000 + Math.floor(Math.random() * 900);
    this.deliveryOrder = {
      orderNum,
      burger: 1,
      fries: 1,
      drink: 1
    };

    window.audioManager.playDeliveryAlert();
    if (window.uiManager) {
      window.uiManager.showDeliveryCard(this.deliveryOrder, this.deliveryDuration);
    }
  }

  completeDelivery() {
    this.deliveryActive = false;
    this.deliveriesCompleted++;
    const bonus = 2500;
    this.score += bonus;
    this.nextDeliveryDistance = this.distance + 450 + Math.random() * 250;

    this.spawnCollectParticles(this.playerX, this.playerY + 1.2, 0, 0x00E676, 22);
    this.triggerScreenFlash('#00E676', 0.35, 0.45);
    this.cameraShake.intensity = Math.max(this.cameraShake.intensity, 0.22);

    window.audioManager.playDeliverySuccess();
    if (window.uiManager) {
      window.uiManager.showDeliverySuccessBanner(this.deliveryOrder.orderNum, bonus);
      window.uiManager.hideDeliveryCard();
    }
  }

  // --- POWER-UPS ENGINE ---
  activatePowerup(type, duration) {
    this.activePowerups[type].active = true;
    this.activePowerups[type].timer = duration;

    if (type === 'shield') {
      this.player.userData.shieldMesh.visible = true;
    } else if (type === 'burger_mode') {
      this.player.userData.bodyRoot.visible = false;
      this.player.userData.giantBurger.visible = true;
      this.player.userData.isBurgerMode = true;
    }
  }

  updatePowerups(dt) {
    Object.keys(this.activePowerups).forEach(key => {
      const p = this.activePowerups[key];
      if (p.active) {
        p.timer -= dt;

        // Shield visual rotation
        if (key === 'shield') {
          this.player.userData.shieldMesh.rotation.y += dt * 2;
        }

        if (p.timer <= 0) {
          p.active = false;
          // Deactivate visuals
          if (key === 'shield') {
            this.player.userData.shieldMesh.visible = false;
          } else if (key === 'burger_mode') {
            this.player.userData.bodyRoot.visible = true;
            this.player.userData.giantBurger.visible = false;
            this.player.userData.isBurgerMode = false;
          }
        }
      }
    });
  }

  // --- OBSTACLE COLLISIONS ---
  updateObstaclesAndCollisions(dt) {
    if (this.invulnerableTimer > 0) return;

    const pX = this.playerX;
    const pY = this.playerY;
    const pZ = 0;

    // Player bounding dimensions
    const pWidth = 0.65;
    const pHeight = this.isSliding ? 0.75 : 1.9;
    const pDepth = 0.65;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      const uData = obs.userData;

      const oX = obs.position.x;
      const oY = obs.position.y;
      const oZ = obs.position.z;

      const oWidth = uData.width || 1.4;
      const oHeight = uData.height || 1.8;
      const oDepth = uData.depth || 1.6;

      // 3D Bounding Box Collision Check
      const collidesX = Math.abs(pX - oX) < (pWidth / 2 + oWidth / 2) * 0.78;
      const collidesZ = Math.abs(pZ - oZ) < (pDepth / 2 + oDepth / 2) * 0.78;

      let collidesY = false;
      if (uData.mustSlide) {
        // Slide barrier: Top clearance. Collision happens if player is standing tall!
        // The bar is between Y = 1.1 and Y = 3.2. If player is not sliding, they hit it!
        collidesY = !this.isSliding;
      } else if (uData.jumpable) {
        // Jumpable obstacle (barrier/cones): Player Y must clear obstacle height
        collidesY = pY < (oHeight - 0.2);
      } else {
        // Full height vehicle/stall: Collides unless jumping impossibly high
        collidesY = pY < (oHeight - 0.2);
      }

      if (collidesX && collidesZ && collidesY) {
        // Collision triggered!
        if (this.activePowerups.burger_mode.active) {
          // Smash obstacle into pieces!
          this.smashObstacle(obs, i);
          window.audioManager.playBurgerSmash();
          this.score += 200;
          this.cameraShake.intensity = Math.max(this.cameraShake.intensity, 0.25);
          this.triggerScreenFlash('#FF3D00', 0.25, 0.25);
          if (window.uiManager) {
            window.uiManager.showFloatingToast('SMASH! +200', '#FF3D00');
          }
          return;
        }

        if (this.activePowerups.shield.active) {
          // Shield absorbs collision
          this.activePowerups.shield.active = false;
          this.player.userData.shieldMesh.visible = false;
          this.invulnerableTimer = 1.6; // grace period
          window.audioManager.playShieldBreak();
          this.smashObstacle(obs, i);
          this.cameraShake.intensity = 0.35;
          this.triggerScreenFlash('#00E5FF', 0.38, 0.3);
          if (window.uiManager) {
            window.uiManager.showFloatingToast('SHIELD BROKE!', '#00E5FF');
          }
          return;
        }

        // Game Over!
        this.gameOver();
        return;
      }
    }
  }

  smashObstacle(obs, index) {
    this.spawnSmashDebris(obs.position.x, obs.position.y + 0.8, obs.position.z);
    this.scene.remove(obs);
    this.obstacles.splice(index, 1);
  }

  spawnSmashDebris(x, y, z) {
    const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const mat = new THREE.MeshBasicMaterial({ color: 0xFF9100 });
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x + (Math.random() - 0.5) * 0.8, y, z);
      this.scene.add(m);
      this.particles.push({
        mesh: m,
        life: 0,
        maxLife: 0.6,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 8 + 2,
        vz: (Math.random() - 0.5) * 8
      });
    }
  }

  updateParticles(dt) {
    // Runner dust particles
    for (const p of this.dustMeshPool) {
      if (p.mesh.visible) {
        p.life += dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += (p.vz + this.speed * 0.8) * dt; // natural ground drag
        const progress = p.life / p.maxLife;
        p.mesh.scale.setScalar(1 - progress);
        if (progress >= 1) {
          p.mesh.visible = false;
        }
      }
    }

    // Smash debris particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.life += dt;
      part.vy -= 18 * dt; // gravity
      part.mesh.position.x += part.vx * dt;
      part.mesh.position.y += part.vy * dt;
      part.mesh.position.z += part.vz * dt;
      part.mesh.rotation.x += dt * 5;
      part.mesh.rotation.y += dt * 5;

      if (part.life >= part.maxLife) {
        this.scene.remove(part.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  // --- DYNAMIC DAY / SUNSET / NEON NIGHT CYCLE ---
  updateEnvironmentLighting() {
    const dist = this.distance;

    if (dist < 1000) {
      // Crisp Morning / Midday Coimbatore Sky
      this.scene.background.setHex(0x4FC3F7);
      this.scene.fog.color.setHex(0x4FC3F7);
      this.dirLight.color.setHex(0xFFF9C4);
      this.ambientLight.color.setHex(0xFFFFFF);
      this.ambientLight.intensity = 0.75;
      if (this.hemiLight) this.hemiLight.color.setHex(0x4FC3F7);
    } else if (dist < 2500) {
      // Warm Golden Coimbatore Sunset
      const t = (dist - 1000) / 1500;
      const skyCol = new THREE.Color(0x4FC3F7).lerp(new THREE.Color(0xFFA726), t);
      this.scene.background.copy(skyCol);
      this.scene.fog.color.copy(skyCol);
      this.dirLight.color.setHex(0xFFE082);
      this.ambientLight.color.setHex(0xFFF3E0);
      this.ambientLight.intensity = 0.80;
      if (this.hemiLight) this.hemiLight.color.copy(skyCol);
    } else {
      // Radiant Neon Twilight Arcade Mode (Vibrant violet/magenta - NEVER murky black!)
      const t = Math.min((dist - 2500) / 800, 1.0);
      const skyCol = new THREE.Color(0xFFA726).lerp(new THREE.Color(0x9C27B0), t);
      this.scene.background.copy(skyCol);
      this.scene.fog.color.copy(skyCol);
      this.dirLight.color.setHex(0xFF80AB); // Neon rose sun
      this.ambientLight.color.setHex(0xF3E5F5); // Bright lavender ambient
      this.ambientLight.intensity = 0.85;
      if (this.hemiLight) this.hemiLight.color.copy(skyCol);
    }
  }

  // --- DYNAMIC CAMERA EFFECTS ---
  updateCamera(dt) {
    // Dynamic FOV stretch during Turbo Boost or high speed
    const baseFOV = 60 + Math.min(10, (this.speed - this.baseSpeed) * 0.4);
    const targetFOV = this.activePowerups.turbo.active ? 74 : baseFOV;
    this.camera.fov += (targetFOV - this.camera.fov) * dt * 4;
    this.camera.updateProjectionMatrix();

    // Camera follow player lateral X smoothly with slight anticipatory tilt
    const targetCamX = this.playerX * 0.45;
    this.camera.position.x += (targetCamX - this.camera.position.x) * dt * 8;

    // Camera height bobbing
    const camY = this.cameraDefaultPos.y + Math.max(0, this.playerY * 0.35);
    this.camera.position.y += (camY - this.camera.position.y) * dt * 10;

    // Apply Camera Shake
    if (this.cameraShake.intensity > 0) {
      const s = this.cameraShake.intensity;
      this.camera.position.x += (Math.random() - 0.5) * s * 2.2;
      this.camera.position.y += (Math.random() - 0.5) * s * 1.6;
      this.cameraShake.intensity = Math.max(0, this.cameraShake.intensity - dt * this.cameraShake.decay);
    }
  }

  // --- SPEED STREAK LINES (Subway Surfers speed sensation) ---
  updateSpeedLines(dt) {
    const isFast = this.speed > 27 || this.activePowerups.turbo.active;
    const targetOpacity = this.activePowerups.turbo.active ? 0.75 : (this.speed > 27 ? Math.min(0.55, (this.speed - 27) / 20) : 0);
    const scrollSpeed = this.speed * 1.9;

    for (let i = 0; i < this.speedLines.length; i++) {
      const sl = this.speedLines[i];
      sl.mesh.material.opacity += (targetOpacity - sl.mesh.material.opacity) * dt * 6;
      if (sl.mesh.material.opacity > 0.01) {
        sl.mesh.position.z += scrollSpeed * dt;
        if (sl.mesh.position.z > 6) {
          sl.mesh.position.z = -18 - Math.random() * 14;
          const side = i < 15 ? -1 : 1;
          sl.mesh.position.x = side * (3.8 + Math.random() * 3.8);
          sl.mesh.position.y = Math.random() * 4 - 0.5;
        }
      }
    }
  }

  // --- SCREEN FLASH OVERLAY (Impacts, power-ups, meal completions) ---
  triggerScreenFlash(color = '#FF1744', maxOpacity = 0.4, duration = 0.3) {
    if (!this.screenFlash) this.screenFlash = document.getElementById('screen-flash');
    if (!this.screenFlash) return;

    this.screenFlash.style.transition = 'none';
    this.screenFlash.style.backgroundColor = color;
    this.screenFlash.style.opacity = maxOpacity;

    setTimeout(() => {
      if (this.screenFlash) {
        this.screenFlash.style.transition = `opacity ${duration}s ease-out`;
        this.screenFlash.style.opacity = '0';
      }
    }, 30);
  }

  // --- COLLECT PARTICLE BURST (Arcade coin sparkle burst) ---
  spawnCollectParticles(x, y, z, hexColor = 0xFFD000, count = 7) {
    const pGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const pMat = new THREE.MeshBasicMaterial({ color: hexColor });

    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(pGeo, pMat);
      m.position.set(x + (Math.random() - 0.5) * 0.3, y + (Math.random() - 0.5) * 0.3, z);
      this.scene.add(m);
      this.particles.push({
        mesh: m,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.2,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 6 + 1.5,
        vz: (Math.random() - 0.5) * 4
      });
    }
  }
}

// Global instance
window.wofGame = null;
