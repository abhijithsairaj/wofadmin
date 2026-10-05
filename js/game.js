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
    this.coins = 0;
    this.score = 0;
    this.scoreMultiplier = 1;
    this.comboCounter = 0;
    this.sameFoodStreak = { type: null, count: 0 };

    // Active Meal Tracker [Main, Side, Drink]
    this.activeMeal = { main: null, side: null, drink: null };
    this.mealsCompleted = 0;
    this.nextFoodDistance = 250; // Rare food items appear every 200-300m

    // Delivery Run System
    this.deliveryActive = false;
    this.deliveryOrder = null;
    this.deliveryTimer = 0;
    this.deliveryDuration = 28;
    this.deliveriesCompleted = 0;
    this.nextDeliveryDistance = 350;

    // Power-ups (Coin Magnet, Invincible Star, Delivery Scooter + aliases)
    this.activePowerups = {
      coin_magnet: { active: false, timer: 0 },
      invincible: { active: false, timer: 0 },
      delivery_scooter: { active: false, timer: 0 },
      shield: { active: false, timer: 0 },
      magnet: { active: false, timer: 0 },
      turbo: { active: false, timer: 0 },
      burger_mode: { active: false, timer: 0 }
    };

    this.roadsideCustomers = [];

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

    // Sunset / Dusk Gradient Sky Dome (Matching Reference Screenshot - Purple to Magenta to Peach)
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 256;
    skyCanvas.height = 512;
    const sctx = skyCanvas.getContext('2d');
    const sGrad = sctx.createLinearGradient(0, 0, 0, 512);
    sGrad.addColorStop(0.0, '#1A0B2E'); // Deep purple zenith
    sGrad.addColorStop(0.35, '#4A148C'); // Rich royal violet
    sGrad.addColorStop(0.65, '#AD1457'); // Fiery magenta
    sGrad.addColorStop(0.85, '#F4511E'); // Vibrant crimson orange
    sGrad.addColorStop(1.0, '#FFA726'); // Warm glowing peach horizon
    sctx.fillStyle = sGrad;
    sctx.fillRect(0, 0, 256, 512);

    const skyTex = new THREE.CanvasTexture(skyCanvas);
    const skyGeo = new THREE.SphereGeometry(320, 24, 16);
    const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, depthWrite: false });
    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);

    // Warm sunset horizon background and seamless linear fog
    this.scene.background = new THREE.Color(0xF4511E);
    this.scene.fog = new THREE.Fog(0xF4511E, 110, 280);

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
    this.renderer.setClearColor(0xF4511E, 1);

    // Disable heavy shadow map passes on mobile for 60fps; use BasicShadowMap on desktop
    if (isMobile) {
      this.renderer.shadowMap.enabled = false;
    } else {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
    }
    this.container.appendChild(this.renderer.domElement);

    // Warm Sunset Arcade Lighting (Golden Sunlight + Violet Atmospheric Ambient)
    this.ambientLight = new THREE.AmbientLight(0xFFE0B2, 0.85);
    this.scene.add(this.ambientLight);

    // Warm ground bounce & sky ambient
    this.hemiLight = new THREE.HemisphereLight(0xAB47BC, 0xE65100, 0.75);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xFFD54F, 1.10);
    this.dirLight.position.set(18, 32, 20);
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
    const roadWidth = 7.8;

    // 1. Asphalt Road Tarmac
    const roadGeo = new THREE.PlaneGeometry(roadWidth, overlapLen);
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x2A2E33 }); // Clean dark asphalt tarmac
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -this.chunkLength / 2);
    road.receiveShadow = true;
    chunk.add(road);

    // 2. White Outer Road Shoulder Stripes
    const edgeGeo = new THREE.PlaneGeometry(0.18, overlapLen);
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    [-roadWidth / 2 + 0.16, roadWidth / 2 - 0.16].forEach(eX => {
      const edge = new THREE.Mesh(edgeGeo, edgeMat);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(eX, 0.012, -this.chunkLength / 2);
      chunk.add(edge);
    });

    // 3. Crisp Yellow Dashed Center Lane Dividers (Between the 3 lanes at x = -1.2 and +1.2)
    const markerGeo = new THREE.PlaneGeometry(0.16, 2.5);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xFFEB3B });
    [-1.2, 1.2].forEach(laneX => {
      for (let z = 0; z < this.chunkLength; z += 6) {
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.rotation.x = -Math.PI / 2;
        marker.position.set(laneX, 0.014, -z);
        chunk.add(marker);
      }
    });

    // 4. Pedestrian Zebra Crosswalk at start of chunk
    if (!isFirstChunk) {
      const zebraGeo = new THREE.PlaneGeometry(0.55, 3.4);
      const zebraMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      for (let x = -roadWidth / 2 + 0.7; x <= roadWidth / 2 - 0.7; x += 1.0) {
        const stripe = new THREE.Mesh(zebraGeo, zebraMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(x, 0.015, -2.0);
        chunk.add(stripe);
      }
    }

    // 5. Hazard Painted Curbs (Alternating Red & White blocks along road edge)
    const curbWidth = 0.28;
    const curbHeight = 0.26;
    const curbGeo = new THREE.BoxGeometry(curbWidth, curbHeight, overlapLen);
    const curbMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const leftCurb = new THREE.Mesh(curbGeo, curbMat);
    leftCurb.position.set(-roadWidth / 2 - curbWidth / 2, curbHeight / 2, -this.chunkLength / 2);
    const rightCurb = new THREE.Mesh(curbGeo, curbMat);
    rightCurb.position.set(roadWidth / 2 + curbWidth / 2, curbHeight / 2, -this.chunkLength / 2);
    chunk.add(leftCurb, rightCurb);

    // Red curb accent stripes spaced along the curb
    const redAccentGeo = new THREE.BoxGeometry(curbWidth + 0.02, curbHeight + 0.02, 1.6);
    const redAccentMat = new THREE.MeshLambertMaterial({ color: 0xD32F2F });
    for (let z = 2.0; z < this.chunkLength; z += 3.6) {
      const leftRed = new THREE.Mesh(redAccentGeo, redAccentMat);
      leftRed.position.set(-roadWidth / 2 - curbWidth / 2, curbHeight / 2, -z);
      const rightRed = new THREE.Mesh(redAccentGeo, redAccentMat);
      rightRed.position.set(roadWidth / 2 + curbWidth / 2, curbHeight / 2, -z);
      chunk.add(leftRed, rightRed);
    }

    // 6. Sidewalks (Left & Right) - Clean urban pedestrian sidewalk
    const sidewalkWidth = 4.8;
    const sidewalkGeo = new THREE.BoxGeometry(sidewalkWidth, 0.22, overlapLen);
    const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0xCFD8DC });

    const leftWalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    leftWalk.position.set(-roadWidth / 2 - curbWidth - sidewalkWidth / 2, 0.11, -this.chunkLength / 2);
    const rightWalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    rightWalk.position.set(roadWidth / 2 + curbWidth + sidewalkWidth / 2, 0.11, -this.chunkLength / 2);
    chunk.add(leftWalk, rightWalk);

    // 7. Wide Ground Plaza extending outward under buildings (prevents voids at any screen aspect)
    const sidePlazaGeo = new THREE.PlaneGeometry(42, overlapLen);
    const sidePlazaMat = new THREE.MeshLambertMaterial({ color: 0xB0BEC5 });
    const leftPlaza = new THREE.Mesh(sidePlazaGeo, sidePlazaMat);
    leftPlaza.rotation.x = -Math.PI / 2;
    leftPlaza.position.set(-roadWidth / 2 - curbWidth - sidewalkWidth - 21, 0.01, -this.chunkLength / 2);

    const rightPlaza = new THREE.Mesh(sidePlazaGeo, sidePlazaMat);
    rightPlaza.rotation.x = -Math.PI / 2;
    rightPlaza.position.set(roadWidth / 2 + curbWidth + sidewalkWidth + 21, 0.01, -this.chunkLength / 2);
    chunk.add(leftPlaza, rightPlaza);

    // 8. Low Decorative Planters / Hedges along sidewalk outer edge
    const hedgeGeo = new THREE.BoxGeometry(0.42, 0.52, overlapLen);
    const hedgeMat = new THREE.MeshLambertMaterial({ color: 0x2E7D32 }); // Lush evergreen hedge
    const leftHedge = new THREE.Mesh(hedgeGeo, hedgeMat);
    leftHedge.position.set(-roadWidth / 2 - curbWidth - sidewalkWidth - 0.21, 0.26, -this.chunkLength / 2);
    const rightHedge = new THREE.Mesh(hedgeGeo, hedgeMat);
    rightHedge.position.set(roadWidth / 2 + curbWidth + sidewalkWidth + 0.21, 0.26, -this.chunkLength / 2);
    chunk.add(leftHedge, rightHedge);

    // Terracotta Rim along hedge tops
    const rimGeo = new THREE.BoxGeometry(0.50, 0.07, overlapLen);
    const rimMat = new THREE.MeshLambertMaterial({ color: 0xE65100 });
    const leftRim = new THREE.Mesh(rimGeo, rimMat);
    leftRim.position.set(-roadWidth / 2 - curbWidth - sidewalkWidth - 0.21, 0.55, -this.chunkLength / 2);
    const rightRim = new THREE.Mesh(rimGeo, rimMat);
    rightRim.position.set(roadWidth / 2 + curbWidth + sidewalkWidth + 0.21, 0.55, -this.chunkLength / 2);
    chunk.add(leftRim, rightRim);

    // 9. Streetlights (Placed along sidewalk)
    const lampL = window.modelFactory.createStreetLamp('left');
    lampL.position.set(-roadWidth / 2 - curbWidth - 0.5, 0, -this.chunkLength * 0.45);
    const lampR = window.modelFactory.createStreetLamp('right');
    lampR.position.set(roadWidth / 2 + curbWidth + 0.5, 0, -this.chunkLength * 0.90);
    chunk.add(lampL, lampR);

    // 10. Coimbatore Coconut Palm Trees along sidewalk
    const treeL = window.modelFactory.createPalmTree();
    treeL.position.set(-roadWidth / 2 - curbWidth - 2.8, 0, -this.chunkLength * 0.25);
    const treeR = window.modelFactory.createPalmTree();
    treeR.position.set(roadWidth / 2 + curbWidth + 2.8, 0, -this.chunkLength * 0.75);
    chunk.add(treeL, treeR);

    // 11. Overhead WOF Festive Street Banner (Every alternate chunk)
    if (!isFirstChunk && Math.random() < 0.55) {
      const banner = window.modelFactory.createRoadBanner('WOF RUSH - SELVAPURAM');
      banner.position.set(0, 0, -this.chunkLength * 0.5);
      chunk.add(banner);
    }

    // 12. Storefront Buildings along road (3 on left, 3 on right)
    const buildingZOffsets = [
      -this.chunkLength * 0.18,
      -this.chunkLength * 0.50,
      -this.chunkLength * 0.82
    ];
    buildingZOffsets.forEach((zOff, bIdx) => {
      const varL = (bIdx * 2) % 6;
      const bLeft = window.modelFactory.createBuilding(varL, 'left');
      bLeft.position.set(-roadWidth / 2 - curbWidth - sidewalkWidth - 2.8, 0, zOff);
      chunk.add(bLeft);

      const varR = (bIdx * 2 + 1) % 6;
      const bRight = window.modelFactory.createBuilding(varR, 'right');
      bRight.position.set(roadWidth / 2 + curbWidth + sidewalkWidth + 2.8, 0, zOff);
      chunk.add(bRight);
    });

    // 13. Roadside Delivery Customers (Waiting on the sidewalk for orders)
    if (!isFirstChunk && Math.random() < 0.65) {
      const custSide = Math.random() < 0.5 ? 'left' : 'right';
      const customer = window.modelFactory.createDeliveryCustomer(custSide);
      const custX = custSide === 'left' ? -roadWidth / 2 - curbWidth - 0.9 : roadWidth / 2 + curbWidth + 0.9;
      customer.position.set(custX, 0.15, zPos - this.chunkLength * 0.35);
      this.scene.add(customer);
      this.roadsideCustomers.push(customer);
    }

    this.scene.add(chunk);
    chunk.userData = { zPos };
    this.chunks.push(chunk);

    // Populate Obstacles & Collectibles
    if (!isFirstChunk) {
      this.populateChunkContents(zPos);
    }
  }

  // Populate dynamic items along the chunk
  populateChunkContents(chunkZ) {
    const laneIndices = [0, 1, 2];
    const dist = this.distance;

    // Dynamic difficulty tiers
    const isEasy   = dist < 500;
    const isMedium = dist >= 500 && dist < 1500;
    const isHard   = dist >= 1500 && dist < 2500;
    const isRush   = dist >= 2500;

    const segmentOffsets = isRush ? [8, 20, 32] : (isHard ? [10, 28] : [14, 30]);

    segmentOffsets.forEach(offset => {
      const spawnZ = chunkZ - offset;

      // Determine obstacle layout based on difficulty
      let blockedLanes = [];

      if (isEasy) {
        blockedLanes = [Math.floor(Math.random() * 3)];
      } else if (isMedium) {
        const numBlocks = Math.random() < 0.40 ? 2 : 1;
        blockedLanes = [...laneIndices].sort(() => Math.random() - 0.5).slice(0, numBlocks);
      } else if (isHard) {
        blockedLanes = [...laneIndices].sort(() => Math.random() - 0.5).slice(0, 2);
      } else {
        blockedLanes = [...laneIndices].sort(() => Math.random() - 0.5).slice(0, 2);
      }

      blockedLanes.forEach(laneIdx => {
        const laneX = this.lanes[laneIdx];
        const r = Math.random();
        let obs;

        if (r < 0.36) {
          // Coimbatore Auto-Rickshaw
          obs = window.modelFactory.createRickshaw();
          obs.position.set(laneX, 0, spawnZ);
        } else if (r < 0.60) {
          // Jumpable Road Barrier (Construction barrier with flashing light)
          obs = window.modelFactory.createRoadBarrier();
          obs.position.set(laneX, 0, spawnZ);
        } else if (r < 0.78) {
          // Roadside Tea / Food Vendor Cart
          obs = window.modelFactory.createVendorCart();
          obs.position.set(laneX, 0, spawnZ);
        } else if (r < 0.90) {
          // Slide Barrier (Must Slide!)
          obs = window.modelFactory.createSlideBarrier();
          obs.position.set(laneX, 0, spawnZ);
        } else {
          // Traffic Cones Cluster
          obs = window.modelFactory.createTrafficCones();
          obs.position.set(laneX, 0, spawnZ);
        }

        obs.userData.lane = laneIdx;
        obs.userData.spawnZ = spawnZ;
        obs.userData.passed = false;

        this.scene.add(obs);
        this.obstacles.push(obs);
      });

      // Spawn Golden Coins in open lanes
      const freeLanes = laneIndices.filter(l => !blockedLanes.includes(l));
      if (freeLanes.length > 0) {
        const coinLane = freeLanes[Math.floor(Math.random() * freeLanes.length)];
        this.spawnCoinRow(this.lanes[coinLane], spawnZ - 3, 5);
      }
    });

    // Check if it's time for a rare Food Collectible (every 200–300m interval)
    if (this.distance >= this.nextFoodDistance) {
      const openLane = this.lanes[Math.floor(Math.random() * 3)];
      this.spawnRareFood(openLane, chunkZ - 20);
      this.nextFoodDistance = this.distance + 220 + Math.random() * 80;
    }

    // Power-Up Spawn (16% chance per chunk: Coin Magnet, Invincible Star, Delivery Scooter)
    if (Math.random() < 0.16) {
      const pLane = this.lanes[Math.floor(Math.random() * 3)];
      const pZ = chunkZ - 24;
      this.spawnPowerup(pLane, pZ);
    }
  }

  // Spawn row of golden coins (Subway Surfers signature collectibles)
  spawnCoinRow(laneX, startZ, count = 5) {
    for (let i = 0; i < count; i++) {
      const coin = window.modelFactory.createCoinItem();
      coin.position.set(laneX, 1.1, startZ - i * 2.2);
      this.scene.add(coin);
      this.collectibles.push(coin);
    }
  }

  // Spawn rare food collectible (every 200-300m interval)
  spawnRareFood(laneX, z) {
    const types = ['burger', 'fries', 'drink', 'pizza', 'waffle', 'falooda'];
    const foodType = types[Math.floor(Math.random() * types.length)];
    let item;
    switch (foodType) {
      case 'burger': item = window.modelFactory.createBurgerItem(1.25); break;
      case 'fries': item = window.modelFactory.createFriesItem(1.25); break;
      case 'drink': item = window.modelFactory.createDrinkItem(1.25); break;
      case 'pizza': item = window.modelFactory.createPizzaItem(1.25); break;
      case 'waffle': item = window.modelFactory.createWaffleItem(1.25); break;
      case 'falooda': item = window.modelFactory.createFaloodaItem(1.25); break;
      default: item = window.modelFactory.createBurgerItem(1.25); break;
    }
    item.position.set(laneX, 1.3, z);
    item.userData.points = 500; // Special high-value feast reward!
    this.scene.add(item);
    this.collectibles.push(item);
  }

  // Spawn powerup (Coin Magnet, Invincible Star, Delivery Scooter)
  spawnPowerup(laneX, z) {
    const roll = Math.random();
    let pMesh;
    if (roll < 0.45) {
      // Coin Magnet (Rare)
      pMesh = window.modelFactory.createCoinMagnetPowerupItem();
    } else if (roll < 0.72) {
      // Delivery Scooter (Power-up scooter to ride for delivery)
      pMesh = window.modelFactory.createDeliveryScooterPowerupItem();
    } else {
      // Invincible (Very Rare)
      pMesh = window.modelFactory.createInvinciblePowerupItem();
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
    this.coins = 0;
    this.score = 0;
    this.scoreMultiplier = 1;
    this.comboCounter = 0;
    this.sameFoodStreak = { type: null, count: 0 };
    this.activeMeal = { main: null, side: null, drink: null };
    this.mealsCompleted = 0;
    this.nextFoodDistance = 250;

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
    this.roadsideCustomers.forEach(rc => this.scene.remove(rc));
    this.roadsideCustomers = [];
    this.chunks.forEach(ch => this.scene.remove(ch));
    this.chunks = [];

    // Rebuild initial runway
    this.initWorld();

    // Reset player model visuals
    if (this.player) {
      this.player.userData.bodyRoot.visible = true;
      this.player.userData.shieldMesh.visible = false;
      this.player.userData.giantBurger.visible = false;
      if (this.player.userData.scooterVehicle) this.player.userData.scooterVehicle.visible = false;
      if (this.player.userData.invincibleAura) this.player.userData.invincibleAura.visible = false;
      this.player.userData.isBurgerMode = false;
      this.player.userData.isRidingScooter = false;
      this.player.userData.isInvincible = false;
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
        coins: this.coins,
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
    const hasScooter = (this.activePowerups.delivery_scooter && this.activePowerups.delivery_scooter.active) ||
                       (this.activePowerups.turbo && this.activePowerups.turbo.active);
    const speedBoost = hasScooter ? 1.45 : 1.0;
    this.speed = targetSpeed * speedBoost;

    // Distance & Score progression
    const distDelta = this.speed * dt;
    this.distance += distDelta;

    const scooterMult = hasScooter ? 2 : 1;
    this.score += distDelta * this.scoreMultiplier * scooterMult;

    // Music turbo tempo
    window.audioManager.setTurbo(hasScooter);
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

    // Character Animations (Run cycle, jump tuck, slide crouch, scooter ride, burger roll)
    const uData = this.player.userData;
    if (uData.isBurgerMode) {
      uData.giantBurger.rotation.x += this.speed * dt * 0.8;
    } else {
      const speedT = Math.min(this.speed / this.maxSpeed, 1.0); // 0..1

      if (uData.isRidingScooter && !this.isJumping && !this.isSliding) {
        // === RIDING SCOOTER STANCE ===
        uData.bodyRoot.position.y = 0.22;
        uData.bodyRoot.rotation.x = 0.08;
        uData.bodyRoot.rotation.y = 0;
        uData.leftLegPivot.rotation.x = 0;
        uData.rightLegPivot.rotation.x = 0;
        uData.leftArmPivot.rotation.x = -0.55;
        uData.rightArmPivot.rotation.x = -0.55;
        uData.leftArmPivot.rotation.z = 0.22;
        uData.rightArmPivot.rotation.z = -0.22;
        if (uData.leftForearmGroup) uData.leftForearmGroup.rotation.x = -0.8;
        if (uData.rightForearmGroup) uData.rightForearmGroup.rotation.x = -0.8;
        uData.headGroup.position.y = 2.04;

        if (Math.random() < 0.3) {
          this.spawnDust(this.playerX, 0.05, -0.6, 1);
        }
      } else if (!this.isJumping && !this.isSliding) {
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
      uData.bodyRoot.rotation.z = laneDelta * leanAmt;
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

    // Move roadside delivery customers along the track platforms
    for (let i = this.roadsideCustomers.length - 1; i >= 0; i--) {
      const cust = this.roadsideCustomers[i];
      cust.position.z += moveZ;

      if (cust.userData.waveArm) {
        cust.userData.waveArm.rotation.x = Math.sin(this.runTime * 8) * 0.4;
      }

      // Check delivery passing: when runner passes customer
      if (!cust.userData.delivered && Math.abs(cust.position.z) < 2.8) {
        cust.userData.delivered = true;
        this.deliveriesCompleted++;
        const delivBonus = 1000;
        this.score += delivBonus;

        if (cust.userData.orderBubble) {
          const bCanvas = document.createElement('canvas');
          bCanvas.width = 384;
          bCanvas.height = 180;
          const bctx = bCanvas.getContext('2d');
          bctx.fillStyle = '#E8F5E9';
          bctx.beginPath();
          bctx.roundRect(8, 8, 368, 164, 24);
          bctx.fill();
          bctx.lineWidth = 6;
          bctx.strokeStyle = '#00E676';
          bctx.stroke();
          bctx.fillStyle = '#2E7D32';
          bctx.font = 'bold 36px sans-serif';
          bctx.textAlign = 'center';
          bctx.fillText('DELIVERED! 🎉', 192, 75);
          bctx.fillStyle = '#1B5E20';
          bctx.font = 'bold 28px sans-serif';
          bctx.fillText('+1,000 PTS! 🛵', 192, 128);

          cust.userData.orderBubble.material.map = new THREE.CanvasTexture(bCanvas);
          cust.userData.orderBubble.material.map.needsUpdate = true;
        }

        this.spawnCollectParticles(cust.position.x, cust.position.y + 1.5, cust.position.z, 0x00E676, 18);
        this.triggerScreenFlash('#00E676', 0.25, 0.3);
        window.audioManager.playCustomerCheer();
        if (window.uiManager) {
          window.uiManager.showFloatingToast('🛵 ORDER DELIVERED! +1,000 PTS!', '#00E676', 2200);
        }
      }

      if (cust.position.z > 6.0) {
        this.scene.remove(cust);
        this.roadsideCustomers.splice(i, 1);
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

      // Remove obstacle once safely behind camera
      if (obs.position.z > 2.8) {
        this.scene.remove(obs);
        this.obstacles.splice(i, 1);
      }
    }

    // Move collectibles towards player
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      col.position.z += moveZ;

      // Magnet attraction towards player (pulls coins & food)
      const isMagnet = (this.activePowerups.coin_magnet && this.activePowerups.coin_magnet.active) ||
                       (this.activePowerups.magnet && this.activePowerups.magnet.active);
      if (isMagnet && (col.userData.isCoin || col.userData.foodType)) {
        const dX = this.playerX - col.position.x;
        const dY = (this.playerY + 1.1) - col.position.y;
        const dZ = 0 - col.position.z;
        const dist = Math.sqrt(dX * dX + dY * dY + dZ * dZ);

        if (dist < 16) {
          col.position.x += dX * dt * 12;
          col.position.y += dY * dt * 12;
          col.position.z += dZ * dt * 10;
        }
      }

      // Rotate collectible for visual polish
      col.rotation.y += dt * 3.2;

      // Remove collectibles once safely behind runner (z > 2.0)
      if (col.position.z > 2.0) {
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

    // 0. Golden Coins (Primary Pickup across all 3 lanes)
    if (uData.isCoin || uData.type === 'coin') {
      this.coins++;
      const pts = 10 * this.scoreMultiplier;
      this.score += pts;
      this.spawnCollectParticles(col.position.x, col.position.y, col.position.z, 0xFFD700, 5);
      window.audioManager.playCoin(this.coins % 12);
      return;
    }

    // 1. Power-up collected (Coin Magnet, Invincible Star, Delivery Scooter)
    if (uData.powerupType) {
      this.activatePowerup(uData.powerupType, uData.duration || 15);
      this.spawnCollectParticles(col.position.x, col.position.y, col.position.z, 0x00E5FF, 15);
      this.triggerScreenFlash('#00E5FF', 0.30, 0.35);

      if (uData.powerupType === 'delivery_scooter') {
        window.audioManager.playScooterRev();
        if (window.uiManager) {
          window.uiManager.showFloatingToast('🛵 WOF DELIVERY SCOOTER! ZOOM & DELIVER!', '#FF6B00');
        }
      } else if (uData.powerupType === 'coin_magnet') {
        window.audioManager.playPowerup();
        if (window.uiManager) {
          window.uiManager.showFloatingToast('🧲 COIN MAGNET ACTIVATED!', '#FFD700');
        }
      } else if (uData.powerupType === 'invincible') {
        window.audioManager.playPowerup();
        if (window.uiManager) {
          window.uiManager.showFloatingToast('⭐ INVINCIBLE STAR ACTIVATED!', '#FFEB3B');
        }
      } else {
        window.audioManager.playPowerup();
        if (window.uiManager) {
          window.uiManager.showFloatingToast(`POWER-UP: ${uData.powerupType.toUpperCase().replace('_', ' ')}!`, '#00E5FF');
        }
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

    // 3. Rare Food Collectible (+500 PTS Special Feast Reward)
    const fType = uData.foodType;
    const cat = uData.category;
    const pts = (uData.points || 500) * this.scoreMultiplier;
    this.score += pts;
    this.mealsCompleted++;
    this.spawnCollectParticles(col.position.x, col.position.y, col.position.z, 0xFF9100, 14);
    this.triggerScreenFlash('#FF9100', 0.25, 0.3);
    window.audioManager.playMealComplete();

    if (window.uiManager) {
      window.uiManager.showFloatingToast(`🍔 FRESH ${fType ? fType.toUpperCase() : 'FEAST'}! +${pts} PTS!`, '#FF9800', 2200);
    }

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
    if (type === 'magnet') type = 'coin_magnet';
    if (type === 'shield' || type === 'burger_mode') type = 'invincible';
    if (type === 'turbo') type = 'delivery_scooter';

    if (!this.activePowerups[type]) {
      this.activePowerups[type] = { active: false, timer: 0 };
    }

    this.activePowerups[type].active = true;
    this.activePowerups[type].timer = duration;

    const uData = this.player.userData;

    if (type === 'invincible') {
      if (uData.invincibleAura) uData.invincibleAura.visible = true;
      uData.isInvincible = true;
    } else if (type === 'delivery_scooter') {
      if (uData.scooterVehicle) uData.scooterVehicle.visible = true;
      uData.isRidingScooter = true;
      window.audioManager.playScooterRev();
    }
  }

  updatePowerups(dt) {
    const uData = this.player.userData;

    // Invincible Star rotation & pulse
    if (this.activePowerups.invincible && this.activePowerups.invincible.active) {
      if (uData.invincibleAura) {
        uData.invincibleAura.rotation.y += dt * 3.5;
        uData.invincibleAura.rotation.x += dt * 2.0;
        const pulse = 1.0 + Math.sin(this.runTime * 10) * 0.08;
        uData.invincibleAura.scale.set(pulse, pulse, pulse);
      }
    }

    Object.keys(this.activePowerups).forEach(key => {
      const p = this.activePowerups[key];
      if (p.active) {
        p.timer -= dt;

        if (p.timer <= 0) {
          p.active = false;
          if (key === 'invincible') {
            if (uData.invincibleAura) uData.invincibleAura.visible = false;
            uData.isInvincible = false;
          } else if (key === 'delivery_scooter') {
            if (uData.scooterVehicle) uData.scooterVehicle.visible = false;
            uData.isRidingScooter = false;
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
      if (uData.rideableRoof) {
        // Subway Surfers Train: If runner jumped high enough to land on roof, run on roof!
        if (pY >= uData.roofY - 0.45) {
          this.playerY = uData.roofY;
          this.velocityY = 0;
          this.isJumping = false;
          this.canDoubleJump = true;
          continue; // Running safely on top of train!
        } else {
          collidesY = true;
        }
      } else if (uData.mustSlide) {
        // Slide barrier: Collision happens if player is standing tall!
        collidesY = !this.isSliding;
      } else if (uData.jumpable) {
        // Jumpable obstacle: Player Y must clear obstacle height
        collidesY = pY < (oHeight - 0.2);
      } else {
        // Full height vehicle/stall: Collides unless jumping over
        collidesY = pY < (oHeight - 0.2);
      }

      if (collidesX && collidesZ && collidesY) {
        // 1. Invincible Star Power-up Smash!
        const isInvincible = (this.activePowerups.invincible && this.activePowerups.invincible.active) ||
                             (this.activePowerups.burger_mode && this.activePowerups.burger_mode.active);
        if (isInvincible) {
          this.smashObstacle(obs, i);
          window.audioManager.playBurgerSmash();
          this.score += 200;
          this.cameraShake.intensity = Math.max(this.cameraShake.intensity, 0.25);
          this.triggerScreenFlash('#FFD700', 0.25, 0.25);
          if (window.uiManager) {
            window.uiManager.showFloatingToast('⭐ STAR SMASH! +200', '#FFD700');
          }
          return;
        }

        // 2. Delivery Scooter Crash Deflection (Absorbs hit, breaks scooter, runner continues)
        const hasScooter = (this.activePowerups.delivery_scooter && this.activePowerups.delivery_scooter.active);
        if (hasScooter) {
          this.activePowerups.delivery_scooter.active = false;
          if (this.player.userData.scooterVehicle) this.player.userData.scooterVehicle.visible = false;
          this.player.userData.isRidingScooter = false;
          this.invulnerableTimer = 1.8;
          window.audioManager.playShieldBreak();
          this.smashObstacle(obs, i);
          this.cameraShake.intensity = 0.35;
          this.triggerScreenFlash('#FF6B00', 0.38, 0.3);
          if (window.uiManager) {
            window.uiManager.showFloatingToast('SCOOTER CRASH! SAFE RECOVERY!', '#FF6B00');
          }
          return;
        }

        // 3. Shield absorb
        if (this.activePowerups.shield && this.activePowerups.shield.active) {
          this.activePowerups.shield.active = false;
          if (this.player.userData.shieldMesh) this.player.userData.shieldMesh.visible = false;
          this.invulnerableTimer = 1.6;
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

  // --- DYNAMIC SUNSET / TWILIGHT / NEON NIGHT CYCLE ---
  updateEnvironmentLighting() {
    const dist = this.distance;

    if (dist < 1500) {
      // Golden Sunset Canal City (Matching Reference Image)
      this.scene.fog.color.setHex(0xF4511E);
      this.dirLight.color.setHex(0xFFD54F);
      this.ambientLight.color.setHex(0xFFE0B2);
      this.ambientLight.intensity = 0.85;
      if (this.hemiLight) this.hemiLight.color.setHex(0xAB47BC);
    } else {
      // Twilight Magenta & Indigo Neon Mode (Subway Surfers night festival)
      const t = Math.min((dist - 1500) / 1000, 1.0);
      const skyCol = new THREE.Color(0xF4511E).lerp(new THREE.Color(0xAD1457), t);
      this.scene.fog.color.copy(skyCol);
      this.dirLight.color.setHex(0xFF80AB); // Neon rose sun
      this.ambientLight.color.setHex(0xF3E5F5); // Bright lavender ambient
      this.ambientLight.intensity = 0.90;
      if (this.hemiLight) this.hemiLight.color.copy(skyCol);
    }
  }

  // --- DYNAMIC CAMERA EFFECTS ---
  updateCamera(dt) {
    // Keep Sky Dome centered on camera so horizon never clips
    if (this.skyDome) {
      this.skyDome.position.copy(this.camera.position);
    }

    // Dynamic FOV stretch during Scooter Boost or high speed
    const isTurbo = (this.activePowerups.delivery_scooter && this.activePowerups.delivery_scooter.active) ||
                    (this.activePowerups.turbo && this.activePowerups.turbo.active);
    const baseFOV = 60 + Math.min(10, (this.speed - this.baseSpeed) * 0.4);
    const targetFOV = isTurbo ? 72 : baseFOV;
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
