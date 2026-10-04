/**
 * WOF RUSH - Procedural 3D Model Factory using Three.js
 * Builds stylized low-poly arcade models: Runner, Auto-Rickshaw, Scooter, Street Vendors,
 * Food Collectibles (Burger, Fries, Drink, Pizza, Waffle, Falooda, Golden Fry), Buildings & Scenery.
 */

const WOF_COLORS = {
  orange: 0xFF6B00,
  yellow: 0xFFD000,
  darkOrange: 0xE65100,
  red: 0xD32F2F,
  bunBeige: 0xD9944A,
  bunBottom: 0xC68038,
  patty: 0x4A2511,
  cheese: 0xFFB800,
  lettuce: 0x43A047,
  tomato: 0xE53935,
  fryYellow: 0xFFC400,
  fryRed: 0xD32F2F,
  faloodaPink: 0xFF4081,
  faloodaYellow: 0xFFEB3B,
  cherry: 0xD50000,
  rickshawYellow: 0xFFC107,
  rickshawGreen: 0x1B5E20,
  black: 0x212121,
  white: 0xF5F5F5,
  skin: 0xD79A6D,
  hair: 0x2C1D11,
  denim: 0x283593,
  sneakerWhite: 0xEEEEEE,
  tarmac: 0x263238,
  sidewalk: 0xB0BEC5,
  gold: 0xFFD700
};

// Canvas texture generator for shop signs and Tamil boards
function createTextTexture(text, bgColor = '#FF6B00', textColor = '#FFFFFF', subText = '') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

  // Text
  ctx.fillStyle = textColor;
  ctx.font = 'bold 44px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  if (subText) {
    ctx.fillText(text, canvas.width / 2, 48);
    ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#FFE082';
    ctx.fillText(subText, canvas.width / 2, 92);
  } else {
    ctx.fillText(text, canvas.width / 2, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Model Factory
class ModelFactory {
  constructor() {
    this.initSharedMaterials();
  }

  initSharedMaterials() {
    this.matOrange = new THREE.MeshLambertMaterial({ color: WOF_COLORS.orange });
    this.matYellow = new THREE.MeshLambertMaterial({ color: WOF_COLORS.yellow });
    this.matDarkOrange = new THREE.MeshLambertMaterial({ color: WOF_COLORS.darkOrange });
    this.matRed = new THREE.MeshLambertMaterial({ color: WOF_COLORS.red });
    this.matBun = new THREE.MeshLambertMaterial({ color: WOF_COLORS.bunBeige });
    this.matPatty = new THREE.MeshLambertMaterial({ color: WOF_COLORS.patty });
    this.matCheese = new THREE.MeshLambertMaterial({ color: WOF_COLORS.cheese });
    this.matLettuce = new THREE.MeshLambertMaterial({ color: WOF_COLORS.lettuce });
    this.matFries = new THREE.MeshLambertMaterial({ color: WOF_COLORS.fryYellow });
    this.matBlack = new THREE.MeshLambertMaterial({ color: WOF_COLORS.black });
    this.matWhite = new THREE.MeshLambertMaterial({ color: WOF_COLORS.white });
    this.matSkin = new THREE.MeshLambertMaterial({ color: WOF_COLORS.skin });
    this.matHair = new THREE.MeshLambertMaterial({ color: WOF_COLORS.hair });
    this.matDenim = new THREE.MeshLambertMaterial({ color: WOF_COLORS.denim });
    this.matGold = new THREE.MeshStandardMaterial({ 
      color: WOF_COLORS.gold, 
      metalness: 0.8, 
      roughness: 0.2,
      emissive: 0x443300 
    });
    this.matChrome = new THREE.MeshStandardMaterial({ color: 0xDDDDDD, metalness: 0.9, roughness: 0.1 });
    this.matGlass = new THREE.MeshLambertMaterial({ color: 0x81D4FA, transparent: true, opacity: 0.5 });
  }

  // --- 1. SUBWAY SURFERS STYLE SKATER RUNNER WITH WOF BRANDING ---
  createRunner() {
    const runner = new THREE.Group();

    // Pivot root for sliding / rolling / banking
    const bodyRoot = new THREE.Group();
    bodyRoot.name = 'bodyRoot';
    runner.add(bodyRoot);

    // Subway Surfers / Arcade Materials
    const matSkin = new THREE.MeshLambertMaterial({ color: 0xF7D0B2 });
    const matHairDark = new THREE.MeshLambertMaterial({ color: 0x24160E });
    const matHoodieOrange = new THREE.MeshLambertMaterial({ color: 0xFF6B00 }); // WOF Signature Vibrant Orange
    const matVestNavy = new THREE.MeshLambertMaterial({ color: 0x1A237E });   // Skater Denim / Navy Vest
    const matVestTrim = new THREE.MeshLambertMaterial({ color: 0x283593 });
    const matDrawstrings = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const matCapRed = new THREE.MeshLambertMaterial({ color: 0xD32F2F });      // Skater Cap Red
    const matCapVisor = new THREE.MeshLambertMaterial({ color: 0x1A237E });    // Visor Navy
    const matCapBadge = new THREE.MeshLambertMaterial({ color: 0xFFD000 });    // Cap Yellow Badge
    const matCargoPants = new THREE.MeshLambertMaterial({ color: 0x2A343D });  // Baggy Dark Wash Joggers
    const matShoeWhite = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });   // Skater Vulcanized Sole
    const matShoeOrange = new THREE.MeshLambertMaterial({ color: 0xFF6B00 });  // Sneaker Upper Orange
    const matShoeNavy = new THREE.MeshLambertMaterial({ color: 0x0D47A1 });    // Sneaker Trim Navy
    const matShoeSole = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });    // Waffle Sole Base
    const matGlowCyan = new THREE.MeshStandardMaterial({
      color: 0x00E5FF,
      emissive: 0x00B0FF,
      emissiveIntensity: 0.8
    });

    // --- PELVIS & BAGGY SKATER PANTS TOP ---
    const pelvisGeo = new THREE.CylinderGeometry(0.28, 0.25, 0.26, 16);
    const pelvis = new THREE.Mesh(pelvisGeo, matCargoPants);
    pelvis.position.y = 0.96;
    pelvis.castShadow = true;
    bodyRoot.add(pelvis);

    // Skater Belt with silver buckle
    const beltGeo = new THREE.CylinderGeometry(0.285, 0.285, 0.05, 16);
    const belt = new THREE.Mesh(beltGeo, this.matBlack);
    belt.position.y = 1.07;
    const buckleGeo = new THREE.BoxGeometry(0.09, 0.065, 0.03);
    const buckle = new THREE.Mesh(buckleGeo, this.matChrome);
    buckle.position.set(0, 1.07, 0.29);
    bodyRoot.add(belt, buckle);

    // --- TORSO: VIBRANT ORANGE HOODIE + LAYERED SKATER VEST ---
    // Base Orange Hoodie (slightly broader, athletic skater build)
    const hoodieGeo = new THREE.CylinderGeometry(0.32, 0.27, 0.70, 16);
    const hoodieMesh = new THREE.Mesh(hoodieGeo, matHoodieOrange);
    hoodieMesh.position.y = 1.40;
    hoodieMesh.castShadow = true;
    bodyRoot.add(hoodieMesh);

    // Layered Sleeveless Skater Denim Vest
    const vestGeo = new THREE.CylinderGeometry(0.34, 0.29, 0.60, 16);
    const vestMesh = new THREE.Mesh(vestGeo, matVestNavy);
    vestMesh.position.y = 1.42;
    vestMesh.castShadow = true;
    bodyRoot.add(vestMesh);

    // Vest Arm Cutouts (revealing orange hoodie shoulders)
    [-1, 1].forEach(side => {
      const cutoutGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.20, 12);
      const cutout = new THREE.Mesh(cutoutGeo, matHoodieOrange);
      cutout.rotation.z = Math.PI / 2;
      cutout.position.set(side * 0.29, 1.62, 0);
      bodyRoot.add(cutout);
    });

    // 3D Bunched Fabric Hood behind neck
    const bunchedHoodGeo = new THREE.TorusGeometry(0.24, 0.09, 10, 16, Math.PI * 1.35);
    const bunchedHood = new THREE.Mesh(bunchedHoodGeo, matHoodieOrange);
    bunchedHood.rotation.x = Math.PI / 2 + 0.35;
    bunchedHood.rotation.z = Math.PI * 0.85;
    bunchedHood.position.set(0, 1.72, -0.17);
    bunchedHood.castShadow = true;
    bodyRoot.add(bunchedHood);

    // Hanging White Hoodie Drawstrings
    [-0.08, 0.08].forEach(xOffset => {
      const stringGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.34, 8);
      const drawstring = new THREE.Mesh(stringGeo, matDrawstrings);
      drawstring.position.set(xOffset, 1.50, 0.33);
      drawstring.rotation.z = xOffset > 0 ? -0.1 : 0.1;

      // Silver aglet tip
      const agletGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.05, 8);
      const aglet = new THREE.Mesh(agletGeo, this.matChrome);
      aglet.position.set(xOffset * 1.25, 1.31, 0.34);
      bodyRoot.add(drawstring, aglet);
    });

    // Front Left Chest Embroidered WOF Patch
    const frontPatchGeo = new THREE.PlaneGeometry(0.14, 0.10);
    const frontPatchTex = createTextTexture('WOF', '#D32F2F', '#FFD000');
    const frontPatch = new THREE.Mesh(frontPatchGeo, new THREE.MeshBasicMaterial({ map: frontPatchTex }));
    frontPatch.position.set(0.17, 1.50, 0.335);
    frontPatch.rotation.y = 0.2;
    bodyRoot.add(frontPatch);

    // ⭐ BIG BOLD WOF RUSH BACK GRAPHIC (Facing camera continuously!)
    const backGraphicGeo = new THREE.PlaneGeometry(0.42, 0.30);
    const backGraphicTex = createTextTexture('WOF', '#FF6B00', '#FFFFFF', 'RUSH');
    const backGraphicMat = new THREE.MeshBasicMaterial({ map: backGraphicTex });
    const backGraphic = new THREE.Mesh(backGraphicGeo, backGraphicMat);
    backGraphic.position.set(0, 1.44, -0.345);
    backGraphic.rotation.y = Math.PI;
    bodyRoot.add(backGraphic);

    // --- 🎒 SIGNATURE WOF COURIER DELIVERY BACKPACK ---
    const bagGroup = new THREE.Group();
    // Main thermal insulated box backpack
    const bagGeo = new THREE.BoxGeometry(0.38, 0.46, 0.22);
    const bagMat = new THREE.MeshLambertMaterial({ color: 0x212529 }); // Dark matte ballistic nylon
    const bagMesh = new THREE.Mesh(bagGeo, bagMat);
    bagMesh.position.set(0, 1.40, -0.42);
    bagMesh.castShadow = true;
    bagGroup.add(bagMesh);

    // Orange top flap & trim
    const flapGeo = new THREE.BoxGeometry(0.39, 0.12, 0.23);
    const flapMesh = new THREE.Mesh(flapGeo, matHoodieOrange);
    flapMesh.position.set(0, 1.58, -0.42);
    bagGroup.add(flapMesh);

    // Yellow/Black diagonal hazard reflector stripe on backpack bottom
    const hazardGeo = new THREE.PlaneGeometry(0.36, 0.08);
    const hazardTex = createTextTexture('///', '#FFD000', '#111111');
    const hazardMesh = new THREE.Mesh(hazardGeo, new THREE.MeshBasicMaterial({ map: hazardTex }));
    hazardMesh.position.set(0, 1.22, -0.535);
    hazardMesh.rotation.y = Math.PI;
    bagGroup.add(hazardMesh);

    // Side Drink Mesh Pocket with soda cup & straw!
    const cupGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.22, 10);
    const cupMat = new THREE.MeshLambertMaterial({ color: 0xD32F2F }); // Red soda cup
    const cupMesh = new THREE.Mesh(cupGeo, cupMat);
    cupMesh.position.set(0.22, 1.42, -0.42);
    // Straw
    const strawGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.15, 6);
    const strawMesh = new THREE.Mesh(strawGeo, this.matWhite);
    strawMesh.position.set(0.22, 1.56, -0.42);
    strawMesh.rotation.z = 0.2;
    bagGroup.add(cupMesh, strawMesh);

    // Cross-chest sling straps
    [-0.14, 0.14].forEach(xStrap => {
      const strapGeo = new THREE.BoxGeometry(0.06, 0.68, 0.02);
      const strap = new THREE.Mesh(strapGeo, new THREE.MeshLambertMaterial({ color: 0x37474F }));
      strap.position.set(xStrap, 1.42, 0.31);
      bagGroup.add(strap);
    });
    bodyRoot.add(bagGroup);

    // --- NECK & CARTOON RUNNER HEAD ---
    const neckGeo = new THREE.CylinderGeometry(0.10, 0.11, 0.18, 12);
    const neck = new THREE.Mesh(neckGeo, matSkin);
    neck.position.y = 1.76;
    bodyRoot.add(neck);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.04, 0);

    // Stylized Expressive Cartoon Head (Jake from Subway Surfers rounded caricature)
    const headGeo = new THREE.SphereGeometry(0.28, 20, 20);
    headGeo.scale(1.0, 1.08, 1.04);
    const headMesh = new THREE.Mesh(headGeo, matSkin);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Tapered Jaw / Chin
    const chinGeo = new THREE.CylinderGeometry(0.17, 0.12, 0.15, 14);
    const chin = new THREE.Mesh(chinGeo, matSkin);
    chin.position.set(0, -0.17, 0.11);
    headGroup.add(chin);

    // Expressive Cartoon Eyes
    const eyeBaseGeo = new THREE.PlaneGeometry(0.11, 0.12);
    const pupilGeo = new THREE.PlaneGeometry(0.07, 0.08);
    const irisRingGeo = new THREE.PlaneGeometry(0.085, 0.095);
    const shineGeo = new THREE.PlaneGeometry(0.035, 0.035);

    const eyeIrisMat = new THREE.MeshBasicMaterial({ color: 0x5D4037 }); // Amber skater iris
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const shineMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

    [-1, 1].forEach(side => {
      const eyeWhite = new THREE.Mesh(eyeBaseGeo, this.matWhite);
      eyeWhite.position.set(side * 0.12, 0.01, 0.265);

      const iris = new THREE.Mesh(irisRingGeo, eyeIrisMat);
      iris.position.set(side * 0.12, 0.01, 0.27);

      const pupil = new THREE.Mesh(pupilGeo, eyePupilMat);
      pupil.position.set(side * 0.12, 0.01, 0.272);

      const shine = new THREE.Mesh(shineGeo, shineMat);
      shine.position.set(side * 0.12 + 0.02, 0.03, 0.275);
      headGroup.add(eyeWhite, iris, pupil, shine);

      // Confident Skater Eyebrow
      const browGeo = new THREE.BoxGeometry(0.11, 0.026, 0.02);
      const brow = new THREE.Mesh(browGeo, matHairDark);
      brow.position.set(side * 0.12, 0.10, 0.27);
      brow.rotation.z = side * -0.18;
      headGroup.add(brow);

      // Cartoon Cheek Blush
      const blushGeo = new THREE.PlaneGeometry(0.07, 0.04);
      const blushMat = new THREE.MeshBasicMaterial({ color: 0xFF8A80, transparent: true, opacity: 0.45 });
      const blush = new THREE.Mesh(blushGeo, blushMat);
      blush.position.set(side * 0.16, -0.07, 0.25);
      headGroup.add(blush);
    });

    // Confident Smirk Mouth
    const mouthGeo = new THREE.TorusGeometry(0.08, 0.016, 6, 12, Math.PI * 0.85);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x8D2010 });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.rotation.x = Math.PI;
    mouth.rotation.z = 0.12;
    mouth.position.set(0.01, -0.11, 0.27);
    headGroup.add(mouth);

    // Skater Hair Locks peeking from cap
    const hairLocks = [
      { x: -0.16, y: 0.13, z: 0.24, rx: 0.2, rz: -0.4, s: 0.13 },
      { x: -0.06, y: 0.16, z: 0.26, rx: 0.1, rz: -0.1, s: 0.11 },
      { x: 0.06, y: 0.16, z: 0.26, rx: 0.1, rz: 0.2, s: 0.12 },
      { x: 0.16, y: 0.13, z: 0.24, rx: 0.2, rz: 0.5, s: 0.13 },
      // Sideburns
      { x: -0.27, y: -0.03, z: 0.09, rx: 0, rz: -0.1, s: 0.17 },
      { x: 0.27, y: -0.03, z: 0.09, rx: 0, rz: 0.1, s: 0.17 }
    ];
    hairLocks.forEach(hl => {
      const lockGeo = new THREE.ConeGeometry(0.055, hl.s * 2, 5);
      const lock = new THREE.Mesh(lockGeo, matHairDark);
      lock.position.set(hl.x, hl.y, hl.z);
      lock.rotation.x = hl.rx;
      lock.rotation.z = hl.rz;
      headGroup.add(lock);
    });

    // 🧢 SIGNATURE BACKWARD BASEBALL CAP
    const capGroup = new THREE.Group();

    // Cap Main Crown
    const capDomeGeo = new THREE.SphereGeometry(0.30, 18, 18);
    capDomeGeo.scale(1.05, 0.96, 1.10);
    const capDome = new THREE.Mesh(capDomeGeo, matCapRed);
    capDome.position.set(0, 0.09, -0.01);
    capDome.castShadow = true;
    capGroup.add(capDome);

    // Cap Top Button
    const capBtnGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.03, 10);
    const capBtn = new THREE.Mesh(capBtnGeo, matCapVisor);
    capBtn.position.set(0, 0.38, -0.01);
    capGroup.add(capBtn);

    // Backward Visor (curving backward over neck, stylishly tilted)
    const visorGeo = new THREE.CylinderGeometry(0.29, 0.30, 0.035, 14, 1, false, Math.PI * 0.75, Math.PI * 0.5);
    const visor = new THREE.Mesh(visorGeo, matCapVisor);
    visor.rotation.x = 0.38;
    visor.position.set(0, 0.07, -0.24);
    visor.scale.set(1.06, 1.0, 1.50);
    visor.castShadow = true;
    capGroup.add(visor);

    // Visor Edge Rim Trim
    const visorRimGeo = new THREE.TorusGeometry(0.26, 0.02, 6, 14, Math.PI * 0.6);
    const visorRim = new THREE.Mesh(visorRimGeo, matCapBadge);
    visorRim.rotation.x = Math.PI / 2 + 0.38;
    visorRim.rotation.z = Math.PI * 0.7;
    visorRim.position.set(0, 0.05, -0.35);
    capGroup.add(visorRim);

    // ⭐ FRONT CAP BADGE: BOLD RAISED "WOF" BADGE (Facing forward!)
    const capBadgeGeo = new THREE.BoxGeometry(0.24, 0.13, 0.03);
    const capBadge = new THREE.Mesh(capBadgeGeo, matCapBadge);
    capBadge.position.set(0, 0.18, 0.28);
    capBadge.rotation.x = -0.15;

    const capTex = createTextTexture('WOF', '#FFD000', '#D32F2F');
    const capTexMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.11), new THREE.MeshBasicMaterial({ map: capTex }));
    capTexMesh.position.set(0, 0.18, 0.30);
    capTexMesh.rotation.x = -0.15;
    capGroup.add(capBadge, capTexMesh);

    // Snapback Notch Closure at Back
    const snapbackGeo = new THREE.BoxGeometry(0.13, 0.045, 0.02);
    const snapback = new THREE.Mesh(snapbackGeo, this.matBlack);
    snapback.position.set(0, 0.09, -0.30);
    capGroup.add(snapback);

    headGroup.add(capGroup);
    bodyRoot.add(headGroup);

    // --- ARMS: ATHLETIC SPRINTER ARMS WITH BENT ELBOWS ---
    // Left Arm (Pivot at shoulder)
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(0.38, 1.62, 0);

    const shoulderGeo = new THREE.SphereGeometry(0.11, 12, 12);
    const leftShoulder = new THREE.Mesh(shoulderGeo, matHoodieOrange);
    leftArmPivot.add(leftShoulder);

    // Upper Arm (Hoodie sleeve)
    const upperArmGeo = new THREE.CylinderGeometry(0.095, 0.085, 0.32, 12);
    const leftUpperArm = new THREE.Mesh(upperArmGeo, matHoodieOrange);
    leftUpperArm.position.y = -0.16;
    leftUpperArm.castShadow = true;
    leftArmPivot.add(leftUpperArm);

    // Elbow Pivot with 75-degree natural running bend
    const leftForearmGroup = new THREE.Group();
    leftForearmGroup.position.set(0, -0.30, 0);
    leftForearmGroup.rotation.x = -1.25; // Athletic sprinter bend!

    // Forearm (Skin tone)
    const forearmGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.30, 12);
    const leftForearm = new THREE.Mesh(forearmGeo, matSkin);
    leftForearm.position.y = -0.15;
    leftForearm.castShadow = true;
    leftForearmGroup.add(leftForearm);

    // Cyan Neon Delivery Wristband
    const wristbandGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.08, 12);
    const leftWristband = new THREE.Mesh(wristbandGeo, matGlowCyan);
    leftWristband.position.y = -0.28;
    leftForearmGroup.add(leftWristband);

    // Clenched Runner Fist
    const fistGeo = new THREE.SphereGeometry(0.075, 10, 10);
    const leftHand = new THREE.Mesh(fistGeo, matSkin);
    leftHand.position.y = -0.36;
    leftForearmGroup.add(leftHand);

    leftArmPivot.add(leftForearmGroup);
    bodyRoot.add(leftArmPivot);

    // Right Arm (Pivot at shoulder)
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(-0.38, 1.62, 0);

    const rightShoulder = new THREE.Mesh(shoulderGeo, matHoodieOrange);
    rightArmPivot.add(rightShoulder);

    const rightUpperArm = new THREE.Mesh(upperArmGeo, matHoodieOrange);
    rightUpperArm.position.y = -0.16;
    rightUpperArm.castShadow = true;
    rightArmPivot.add(rightUpperArm);

    const rightForearmGroup = new THREE.Group();
    rightForearmGroup.position.set(0, -0.30, 0);
    rightForearmGroup.rotation.x = -1.25; // Athletic sprinter bend!

    const rightForearm = new THREE.Mesh(forearmGeo, matSkin);
    rightForearm.position.y = -0.15;
    rightForearm.castShadow = true;
    rightForearmGroup.add(rightForearm);

    // Red Sports Sweatband
    const rightWristband = new THREE.Mesh(wristbandGeo, matCapRed);
    rightWristband.position.y = -0.28;
    rightForearmGroup.add(rightWristband);

    const rightHand = new THREE.Mesh(fistGeo, matSkin);
    rightHand.position.y = -0.36;
    rightForearmGroup.add(rightHand);

    rightArmPivot.add(rightForearmGroup);
    bodyRoot.add(rightArmPivot);

    // --- LEGS & CHUNKY SUBWAY SURFERS SKATER SNEAKERS ---
    const createSkaterSneaker = () => {
      const shoeGroup = new THREE.Group();

      // Thick White Vulcanized Cup-Sole
      const soleGeo = new THREE.BoxGeometry(0.24, 0.11, 0.48);
      const sole = new THREE.Mesh(soleGeo, matShoeWhite);
      sole.position.set(0, -0.02, 0.06);
      sole.castShadow = true;
      shoeGroup.add(sole);

      // Dark Waffle Tread
      const treadGeo = new THREE.BoxGeometry(0.23, 0.02, 0.46);
      const tread = new THREE.Mesh(treadGeo, matShoeSole);
      tread.position.set(0, -0.075, 0.06);
      shoeGroup.add(tread);

      // Rubber Toe Bumper Cap
      const toeBumperGeo = new THREE.CylinderGeometry(0.12, 0.13, 0.11, 12, 1, false, 0, Math.PI);
      const toeBumper = new THREE.Mesh(toeBumperGeo, matShoeWhite);
      toeBumper.rotation.y = -Math.PI / 2;
      toeBumper.position.set(0, -0.01, 0.25);
      shoeGroup.add(toeBumper);

      // Vibrant Orange Canvas Shoe Upper
      const upperGeo = new THREE.BoxGeometry(0.22, 0.19, 0.40);
      const upper = new THREE.Mesh(upperGeo, matShoeOrange);
      upper.position.set(0, 0.10, 0.04);
      upper.castShadow = true;
      shoeGroup.add(upper);

      // Contrasting Navy Blue Heel Counter
      const heelGeo = new THREE.BoxGeometry(0.225, 0.17, 0.15);
      const heel = new THREE.Mesh(heelGeo, matShoeNavy);
      heel.position.set(0, 0.10, -0.11);
      shoeGroup.add(heel);

      // Skater White Side Wave Swoosh
      [-1, 1].forEach(side => {
        const swooshGeo = new THREE.BoxGeometry(0.02, 0.05, 0.28);
        const swoosh = new THREE.Mesh(swooshGeo, matShoeWhite);
        swoosh.position.set(side * 0.115, 0.09, 0.04);
        swoosh.rotation.z = side * 0.1;
        shoeGroup.add(swoosh);
      });

      // Padded White Tongue & Laces
      const tongueGeo = new THREE.BoxGeometry(0.13, 0.17, 0.19);
      const tongue = new THREE.Mesh(tongueGeo, matShoeWhite);
      tongue.position.set(0, 0.14, 0.11);
      tongue.rotation.x = -0.3;
      shoeGroup.add(tongue);

      for (let l = 0; l < 3; l++) {
        const laceGeo = new THREE.BoxGeometry(0.11, 0.02, 0.03);
        const lace = new THREE.Mesh(laceGeo, this.matBlack);
        lace.position.set(0, 0.11 + l * 0.04, 0.07 + l * 0.05);
        lace.rotation.x = -0.3;
        shoeGroup.add(lace);
      }

      return shoeGroup;
    };

    // Left Leg Pivot
    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(0.18, 0.90, 0);

    const thighGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.44, 12);
    const leftThigh = new THREE.Mesh(thighGeo, matCargoPants);
    leftThigh.position.y = -0.22;
    leftThigh.castShadow = true;
    leftLegPivot.add(leftThigh);

    // Cargo Side Pocket
    const pocketGeo = new THREE.BoxGeometry(0.06, 0.15, 0.15);
    const leftPocket = new THREE.Mesh(pocketGeo, matCargoPants);
    leftPocket.position.set(0.13, -0.22, 0);
    leftLegPivot.add(leftPocket);

    // Calf
    const calfGeo = new THREE.CylinderGeometry(0.115, 0.10, 0.42, 12);
    const leftCalf = new THREE.Mesh(calfGeo, matCargoPants);
    leftCalf.position.y = -0.58;
    leftCalf.castShadow = true;
    leftLegPivot.add(leftCalf);

    // Rolled Hem Cuff
    const cuffGeo = new THREE.TorusGeometry(0.12, 0.03, 8, 14);
    const leftCuff = new THREE.Mesh(cuffGeo, matCargoPants);
    leftCuff.rotation.x = Math.PI / 2;
    leftCuff.position.set(0, -0.76, 0);
    leftLegPivot.add(leftCuff);

    const leftShoe = createSkaterSneaker();
    leftShoe.position.set(0, -0.84, 0);
    leftLegPivot.add(leftShoe);
    bodyRoot.add(leftLegPivot);

    // Right Leg Pivot
    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(-0.18, 0.90, 0);

    const rightThigh = new THREE.Mesh(thighGeo, matCargoPants);
    rightThigh.position.y = -0.22;
    rightThigh.castShadow = true;
    rightLegPivot.add(rightThigh);

    const rightPocket = new THREE.Mesh(pocketGeo, matCargoPants);
    rightPocket.position.set(-0.13, -0.22, 0);
    rightLegPivot.add(rightPocket);

    const rightCalf = new THREE.Mesh(calfGeo, matCargoPants);
    rightCalf.position.y = -0.58;
    rightCalf.castShadow = true;
    rightLegPivot.add(rightCalf);

    const rightCuff = new THREE.Mesh(cuffGeo, matCargoPants);
    rightCuff.rotation.x = Math.PI / 2;
    rightCuff.position.set(0, -0.76, 0);
    rightLegPivot.add(rightCuff);

    const rightShoe = createSkaterSneaker();
    rightShoe.position.set(0, -0.84, 0);
    rightLegPivot.add(rightShoe);
    bodyRoot.add(rightLegPivot);

    // Full Meal Shield Bubble (initially hidden)
    const shieldGeo = new THREE.SphereGeometry(1.5, 24, 24);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0x00B0FF,
      emissiveIntensity: 0.5
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.position.y = 1.3;
    shieldMesh.visible = false;
    runner.add(shieldMesh);

    // Giant Burger Avatar for Burger Mode (initially hidden)
    const giantBurger = this.createBurgerItem(1.4);
    giantBurger.position.y = 1.2;
    giantBurger.visible = false;
    giantBurger.name = 'giantBurger';
    runner.add(giantBurger);

    // Store animation handles on runner object
    runner.userData = {
      bodyRoot,
      headGroup,
      leftArmPivot,
      rightArmPivot,
      leftForearmGroup,
      rightForearmGroup,
      leftLegPivot,
      rightLegPivot,
      shieldMesh,
      giantBurger,
      runCycle: 0,
      isSliding: false,
      isJumping: false,
      isBurgerMode: false
    };

    return runner;
  }

  // --- 2. COIMBATORE AUTO-RICKSHAW OBSTACLE ---
  createRickshaw() {
    const rickshaw = new THREE.Group();

    // Cabin Main Body (Green bottom)
    const lowerBodyGeo = new THREE.BoxGeometry(1.6, 0.8, 2.6);
    const lowerBodyMat = new THREE.MeshLambertMaterial({ color: WOF_COLORS.rickshawGreen });
    const lowerBody = new THREE.Mesh(lowerBodyGeo, lowerBodyMat);
    lowerBody.position.y = 0.7;
    lowerBody.castShadow = true;
    rickshaw.add(lowerBody);

    // Yellow Canopy Top / Roof
    const roofGeo = new THREE.BoxGeometry(1.65, 0.75, 2.5);
    const roofMat = new THREE.MeshLambertMaterial({ color: WOF_COLORS.rickshawYellow });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 1.6;
    roof.castShadow = true;
    rickshaw.add(roof);

    // Windshield
    const windshieldGeo = new THREE.PlaneGeometry(1.4, 0.6);
    const windshield = new THREE.Mesh(windshieldGeo, this.matGlass);
    windshield.position.set(0, 1.5, 1.26);
    rickshaw.add(windshield);

    // Headlight
    const lightGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.1, 16);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xFFF9C4 });
    const headlight = new THREE.Mesh(lightGeo, lightMat);
    headlight.rotation.x = Math.PI / 2;
    headlight.position.set(0, 0.8, 1.35);
    rickshaw.add(headlight);

    // Front Wheel
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16);
    const frontWheel = new THREE.Mesh(wheelGeo, this.matBlack);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.32, 1.1);
    frontWheel.castShadow = true;
    rickshaw.add(frontWheel);

    // Rear Wheels (Left & Right)
    const rearLeftWheel = new THREE.Mesh(wheelGeo, this.matBlack);
    rearLeftWheel.rotation.z = Math.PI / 2;
    rearLeftWheel.position.set(0.85, 0.32, -0.6);
    rearLeftWheel.castShadow = true;

    const rearRightWheel = new THREE.Mesh(wheelGeo, this.matBlack);
    rearRightWheel.rotation.z = Math.PI / 2;
    rearRightWheel.position.set(-0.85, 0.32, -0.6);
    rearRightWheel.castShadow = true;
    rickshaw.add(rearLeftWheel, rearRightWheel);

    // Coimbatore Registration Plate "TN 38 WOF"
    const plateTex = createTextTexture('TN 38 WOF 1042', '#FFEB3B', '#212121');
    const plateGeo = new THREE.PlaneGeometry(0.8, 0.22);
    const plateMat = new THREE.MeshBasicMaterial({ map: plateTex });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(0, 0.5, -1.31);
    plate.rotation.y = Math.PI;
    rickshaw.add(plate);

    // Passenger Back Rest
    const seatGeo = new THREE.BoxGeometry(1.3, 0.5, 0.4);
    const seatMat = new THREE.MeshLambertMaterial({ color: 0x3E2723 });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(0, 0.9, -0.4);
    rickshaw.add(seat);

    rickshaw.userData = { type: 'rickshaw', width: 1.6, height: 2.1, depth: 2.6 };
    return rickshaw;
  }

  // --- 3. STREET SCOOTER OBSTACLE ---
  createScooter() {
    const scooter = new THREE.Group();

    // Main Body
    const bodyGeo = new THREE.BoxGeometry(0.65, 0.55, 1.8);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x00897B });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.55;
    body.castShadow = true;
    scooter.add(body);

    // Seat
    const seatGeo = new THREE.BoxGeometry(0.5, 0.18, 0.9);
    const seatMat = new THREE.MeshLambertMaterial({ color: 0x3E2723 });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(0, 0.88, -0.2);
    scooter.add(seat);

    // Handlebar & Headlight
    const handleGeo = new THREE.BoxGeometry(0.9, 0.08, 0.08);
    const handle = new THREE.Mesh(handleGeo, this.matBlack);
    handle.position.set(0, 1.15, 0.65);
    scooter.add(handle);

    const lightGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12);
    const light = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: 0xFFF59D }));
    light.rotation.x = Math.PI / 2;
    light.position.set(0, 1.15, 0.72);
    scooter.add(light);

    // Front & Rear Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.15, 16);
    const frontWheel = new THREE.Mesh(wheelGeo, this.matBlack);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.24, 0.7);
    const rearWheel = new THREE.Mesh(wheelGeo, this.matBlack);
    rearWheel.rotation.z = Math.PI / 2;
    rearWheel.position.set(0, 0.24, -0.6);
    scooter.add(frontWheel, rearWheel);

    scooter.userData = { type: 'scooter', width: 0.9, height: 1.3, depth: 1.8 };
    return scooter;
  }

  // --- 4. ROAD BARRIER / CONSTRUCTION (Jumpable) ---
  createRoadBarrier() {
    const barrier = new THREE.Group();

    // Stripes Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFC107';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#212121';
    for (let x = -64; x < 256; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 20, 0);
      ctx.lineTo(x - 10, 64);
      ctx.lineTo(x - 30, 64);
      ctx.fill();
    }
    const stripeTex = new THREE.CanvasTexture(canvas);
    stripeTex.wrapS = THREE.RepeatWrapping;
    stripeTex.repeat.set(2, 1);

    const boardGeo = new THREE.BoxGeometry(1.8, 0.5, 0.1);
    const boardMat = new THREE.MeshLambertMaterial({ map: stripeTex });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = 0.65;
    board.castShadow = true;
    barrier.add(board);

    // Leg stands
    const legGeo = new THREE.BoxGeometry(0.1, 0.85, 0.6);
    const legMat = new THREE.MeshLambertMaterial({ color: 0x424242 });
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(0.75, 0.42, 0);
    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(-0.75, 0.42, 0);
    barrier.add(leftLeg, rightLeg);

    // Amber Hazard Light on top
    const lampGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.16, 12);
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xFF9100 });
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(0, 1.0, 0);
    barrier.add(lamp);

    barrier.userData = { type: 'barrier', width: 1.8, height: 1.0, depth: 0.6, jumpable: true };
    return barrier;
  }

  // --- 5. OVERHEAD SLIDE BARRIER (Player MUST slide) ---
  createSlideBarrier() {
    const slideFrame = new THREE.Group();

    // Two tall side poles
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 12);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x37474F });
    const leftPole = new THREE.Mesh(poleGeo, poleMat);
    leftPole.position.set(1.0, 1.6, 0);
    const rightPole = new THREE.Mesh(poleGeo, poleMat);
    rightPole.position.set(-1.0, 1.6, 0);
    slideFrame.add(leftPole, rightPole);

    // High Crossbeam
    const beamGeo = new THREE.BoxGeometry(2.2, 0.15, 0.15);
    const beam = new THREE.Mesh(beamGeo, poleMat);
    beam.position.set(0, 3.1, 0);
    slideFrame.add(beam);

    // Hanging Slide Warning Sign (Between y=1.2 and y=2.8, clearance below 1.1m)
    const signTex = createTextTexture('▼ SLIDE! ▼', '#D50000', '#FFFFFF');
    const signGeo = new THREE.BoxGeometry(1.9, 1.5, 0.1);
    const signMat = new THREE.MeshLambertMaterial({ map: signTex });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 2.2, 0);
    sign.castShadow = true;
    slideFrame.add(sign);

    slideFrame.userData = { type: 'slide_barrier', width: 2.0, height: 3.2, depth: 0.5, mustSlide: true };
    return slideFrame;
  }

  // --- 6. TRAFFIC CONES CLUSTER ---
  createTrafficCones() {
    const cones = new THREE.Group();
    const coneGeo = new THREE.ConeGeometry(0.24, 0.65, 16);
    const coneMat = new THREE.MeshLambertMaterial({ color: 0xFF5722 });
    const baseGeo = new THREE.BoxGeometry(0.48, 0.06, 0.48);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x212121 });

    const positions = [
      { x: -0.4, z: 0 },
      { x: 0.4, z: -0.2 }
    ];

    positions.forEach(pos => {
      const singleCone = new THREE.Group();
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.y = 0.35;
      cone.castShadow = true;
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.03;
      singleCone.add(cone, base);
      singleCone.position.set(pos.x, 0, pos.z);
      cones.add(singleCone);
    });

    cones.userData = { type: 'cones', width: 1.4, height: 0.7, depth: 0.8, jumpable: true };
    return cones;
  }

  // --- 7. STREET VENDOR TEA / FRUIT CART (Coimbatore Chai Stall Cart) ---
  createVendorCart() {
    const cart = new THREE.Group();

    // Wooden Cart Bed
    const bedGeo = new THREE.BoxGeometry(1.7, 0.45, 2.2);
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x795548 });
    const bed = new THREE.Mesh(bedGeo, woodMat);
    bed.position.y = 0.75;
    bed.castShadow = true;
    cart.add(bed);

    // Canopy Poles & Striped Roof
    const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8);
    const p1 = new THREE.Mesh(poleGeo, woodMat);
    p1.position.set(0.75, 1.6, 0.95);
    const p2 = new THREE.Mesh(poleGeo, woodMat);
    p2.position.set(-0.75, 1.6, 0.95);
    const p3 = new THREE.Mesh(poleGeo, woodMat);
    p3.position.set(0.75, 1.6, -0.95);
    const p4 = new THREE.Mesh(poleGeo, woodMat);
    p4.position.set(-0.75, 1.6, -0.95);
    cart.add(p1, p2, p3, p4);

    // Canopy
    const canopyGeo = new THREE.ConeGeometry(1.3, 0.4, 4);
    const canopyMat = new THREE.MeshLambertMaterial({ color: 0x0288D1 });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.rotation.y = Math.PI / 4;
    canopy.position.set(0, 2.45, 0);
    cart.add(canopy);

    // Large spoked wheels
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
    const w1 = new THREE.Mesh(wheelGeo, this.matBlack);
    w1.rotation.z = Math.PI / 2;
    w1.position.set(0.9, 0.4, 0);
    const w2 = new THREE.Mesh(wheelGeo, this.matBlack);
    w2.rotation.z = Math.PI / 2;
    w2.position.set(-0.9, 0.4, 0);
    cart.add(w1, w2);

    // Tea Urn / Samovar on bed
    const urnGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.5, 12);
    const urn = new THREE.Mesh(urnGeo, this.matChrome);
    urn.position.set(0, 1.25, 0.4);
    cart.add(urn);

    cart.userData = { type: 'vendor_cart', width: 1.8, height: 2.5, depth: 2.3 };
    return cart;
  }

  // --- 8. GIANT ROLLING BURGER (Easter Egg Hazard) ---
  createGiantRollingBurger() {
    const burger = this.createBurgerItem(1.8);
    burger.rotation.z = Math.PI / 2;
    burger.position.y = 1.8;
    burger.userData = { type: 'giant_burger_hazard', width: 2.2, height: 2.2, depth: 2.2 };
    return burger;
  }

  // --- 9. FOOD COLLECTIBLES ---

  // 🍔 BURGER (Main)
  createBurgerItem(scale = 1.0) {
    const group = new THREE.Group();

    // Top Bun (Dome)
    const topBunGeo = new THREE.SphereGeometry(0.38 * scale, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const topBun = new THREE.Mesh(topBunGeo, this.matBun);
    topBun.position.y = 0.14 * scale;
    topBun.castShadow = true;
    group.add(topBun);

    // Sesame Seeds on Top Bun
    const seedGeo = new THREE.BoxGeometry(0.03 * scale, 0.02 * scale, 0.05 * scale);
    const seedMat = new THREE.MeshBasicMaterial({ color: 0xFFF9C4 });
    const seedCoords = [
      { x: 0.1, y: 0.35, z: 0.05 },
      { x: -0.12, y: 0.36, z: -0.04 },
      { x: 0.02, y: 0.38, z: 0.14 },
      { x: -0.05, y: 0.37, z: 0.15 },
      { x: 0.15, y: 0.33, z: -0.1 }
    ];
    seedCoords.forEach(pos => {
      const s = new THREE.Mesh(seedGeo, seedMat);
      s.position.set(pos.x * scale, pos.y * scale, pos.z * scale);
      group.add(s);
    });

    // Lettuce Leaf (Green wavy layer)
    const lettuceGeo = new THREE.CylinderGeometry(0.42 * scale, 0.42 * scale, 0.05 * scale, 12);
    const lettuce = new THREE.Mesh(lettuceGeo, this.matLettuce);
    lettuce.position.y = 0.1 * scale;
    group.add(lettuce);

    // Tomato Slice
    const tomatoGeo = new THREE.CylinderGeometry(0.38 * scale, 0.38 * scale, 0.05 * scale, 12);
    const tomatoMat = new THREE.MeshLambertMaterial({ color: WOF_COLORS.tomato });
    const tomato = new THREE.Mesh(tomatoGeo, tomatoMat);
    tomato.position.y = 0.05 * scale;
    group.add(tomato);

    // Patty
    const pattyGeo = new THREE.CylinderGeometry(0.39 * scale, 0.39 * scale, 0.09 * scale, 14);
    const patty = new THREE.Mesh(pattyGeo, this.matPatty);
    patty.position.y = -0.03 * scale;
    group.add(patty);

    // Cheese (Square sticking out)
    const cheeseGeo = new THREE.BoxGeometry(0.68 * scale, 0.03 * scale, 0.68 * scale);
    const cheese = new THREE.Mesh(cheeseGeo, this.matCheese);
    cheese.rotation.y = Math.PI / 4;
    cheese.position.y = 0.02 * scale;
    group.add(cheese);

    // Bottom Bun
    const botBunGeo = new THREE.CylinderGeometry(0.36 * scale, 0.34 * scale, 0.12 * scale, 14);
    const botBun = new THREE.Mesh(botBunGeo, this.matBun);
    botBun.position.y = -0.13 * scale;
    group.add(botBun);

    group.userData = { foodType: 'burger', category: 'main', points: 30, radius: 0.6 * scale };
    return group;
  }

  // 🍟 FRENCH FRIES (Side)
  createFriesItem(scale = 1.0) {
    const group = new THREE.Group();

    // Red Fries Box
    const boxGeo = new THREE.BoxGeometry(0.45 * scale, 0.55 * scale, 0.32 * scale);
    const box = new THREE.Mesh(boxGeo, this.matRed);
    box.position.y = 0;
    box.castShadow = true;
    group.add(box);

    // Yellow WOF "W" Emblem on red box
    const wLogoTex = createTextTexture('WOF', '#D32F2F', '#FFD000');
    const logoGeo = new THREE.PlaneGeometry(0.35 * scale, 0.2 * scale);
    const logoMat = new THREE.MeshBasicMaterial({ map: wLogoTex });
    const logoMesh = new THREE.Mesh(logoGeo, logoMat);
    logoMesh.position.set(0, 0, 0.165 * scale);
    group.add(logoMesh);

    // Golden Fries sticks sticking out
    const fryGeo = new THREE.BoxGeometry(0.07 * scale, 0.45 * scale, 0.07 * scale);
    const fryOffsets = [
      { x: -0.14, y: 0.32, z: 0.04, rx: 0.1, rz: -0.15 },
      { x: -0.05, y: 0.38, z: 0.02, rx: -0.05, rz: -0.05 },
      { x: 0.06, y: 0.42, z: 0.05, rx: 0.1, rz: 0.1 },
      { x: 0.15, y: 0.34, z: -0.02, rx: -0.1, rz: 0.2 },
      { x: -0.1, y: 0.36, z: -0.06, rx: -0.15, rz: 0.0 },
      { x: 0.02, y: 0.44, z: -0.05, rx: 0.05, rz: 0.05 },
      { x: 0.12, y: 0.38, z: -0.06, rx: 0.15, rz: 0.15 }
    ];

    fryOffsets.forEach(cfg => {
      const fry = new THREE.Mesh(fryGeo, this.matFries);
      fry.position.set(cfg.x * scale, cfg.y * scale, cfg.z * scale);
      fry.rotation.x = cfg.rx;
      fry.rotation.z = cfg.rz;
      group.add(fry);
    });

    group.userData = { foodType: 'fries', category: 'side', points: 25, radius: 0.55 * scale };
    return group;
  }

  // 🥤 DRINK (Drink)
  createDrinkItem(scale = 1.0) {
    const group = new THREE.Group();

    // Tapered Paper Cup
    const cupGeo = new THREE.CylinderGeometry(0.26 * scale, 0.18 * scale, 0.65 * scale, 16);
    const cupMat = new THREE.MeshLambertMaterial({ color: 0xF5F5F5 });
    const cup = new THREE.Mesh(cupGeo, cupMat);
    cup.position.y = 0;
    cup.castShadow = true;
    group.add(cup);

    // Red Center Band with WOF Logo
    const bandGeo = new THREE.CylinderGeometry(0.24 * scale, 0.20 * scale, 0.35 * scale, 16);
    const band = new THREE.Mesh(bandGeo, this.matOrange);
    band.position.y = 0;
    group.add(band);

    // Lid
    const lidGeo = new THREE.CylinderGeometry(0.28 * scale, 0.27 * scale, 0.06 * scale, 16);
    const lid = new THREE.Mesh(lidGeo, this.matWhite);
    lid.position.y = 0.34 * scale;
    group.add(lid);

    // Striped Straw
    const strawGeo = new THREE.CylinderGeometry(0.03 * scale, 0.03 * scale, 0.45 * scale, 8);
    const strawMat = new THREE.MeshLambertMaterial({ color: WOF_COLORS.red });
    const straw = new THREE.Mesh(strawGeo, strawMat);
    straw.rotation.z = 0.25;
    straw.position.set(0.06 * scale, 0.48 * scale, 0);
    group.add(straw);

    group.userData = { foodType: 'drink', category: 'drink', points: 20, radius: 0.5 * scale };
    return group;
  }

  // 🍕 PIZZA SLICE (Main)
  createPizzaItem(scale = 1.0) {
    const group = new THREE.Group();

    // Triangular wedge geometry
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0.38 * scale, 0.7 * scale);
    shape.lineTo(-0.38 * scale, 0.7 * scale);
    shape.closePath();

    const extrudeSettings = { depth: 0.08 * scale, bevelEnabled: false };
    const pizzaGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const pizzaMat = new THREE.MeshLambertMaterial({ color: WOF_COLORS.cheese });
    const pizza = new THREE.Mesh(pizzaGeo, pizzaMat);
    pizza.rotation.x = Math.PI / 2;
    pizza.position.set(0, 0, -0.35 * scale);
    pizza.castShadow = true;
    group.add(pizza);

    // Crust cylinder at the wide edge
    const crustGeo = new THREE.CylinderGeometry(0.07 * scale, 0.07 * scale, 0.78 * scale, 8);
    const crust = new THREE.Mesh(crustGeo, this.matBun);
    crust.rotation.z = Math.PI / 2;
    crust.position.set(0, 0.04 * scale, 0.35 * scale);
    group.add(crust);

    // Pepperoni toppings
    const pepGeo = new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 0.02 * scale, 8);
    const pepMat = new THREE.MeshLambertMaterial({ color: 0xB71C1C });
    const pep1 = new THREE.Mesh(pepGeo, pepMat);
    pep1.position.set(0, 0.05 * scale, 0.1 * scale);
    const pep2 = new THREE.Mesh(pepGeo, pepMat);
    pep2.position.set(-0.15 * scale, 0.05 * scale, 0.22 * scale);
    const pep3 = new THREE.Mesh(pepGeo, pepMat);
    pep3.position.set(0.15 * scale, 0.05 * scale, 0.22 * scale);
    group.add(pep1, pep2, pep3);

    group.userData = { foodType: 'pizza', category: 'main', points: 35, radius: 0.55 * scale };
    return group;
  }

  // 🧇 WAFFLE (Side)
  createWaffleItem(scale = 1.0) {
    const group = new THREE.Group();

    // Round golden waffle base
    const waffleGeo = new THREE.CylinderGeometry(0.36 * scale, 0.36 * scale, 0.1 * scale, 20);
    const waffle = new THREE.Mesh(waffleGeo, this.matBun);
    waffle.castShadow = true;
    group.add(waffle);

    // Grid grooves
    const grooveMat = new THREE.MeshLambertMaterial({ color: 0x8D521B });
    for (let i = -2; i <= 2; i++) {
      const gX = new THREE.Mesh(new THREE.BoxGeometry(0.6 * scale, 0.04 * scale, 0.04 * scale), grooveMat);
      gX.position.set(0, 0.05 * scale, i * 0.12 * scale);
      const gZ = new THREE.Mesh(new THREE.BoxGeometry(0.04 * scale, 0.04 * scale, 0.6 * scale), grooveMat);
      gZ.position.set(i * 0.12 * scale, 0.05 * scale, 0);
      group.add(gX, gZ);
    }

    // Melting butter cube
    const butterGeo = new THREE.BoxGeometry(0.14 * scale, 0.08 * scale, 0.14 * scale);
    const butterMat = new THREE.MeshLambertMaterial({ color: 0xFFEB3B });
    const butter = new THREE.Mesh(butterGeo, butterMat);
    butter.position.set(0, 0.09 * scale, 0);
    group.add(butter);

    group.userData = { foodType: 'waffle', category: 'side', points: 30, radius: 0.5 * scale };
    return group;
  }

  // 🍮 FALOODA (Drink)
  createFaloodaItem(scale = 1.0) {
    const group = new THREE.Group();

    // Tall flared glass
    const glassGeo = new THREE.CylinderGeometry(0.24 * scale, 0.14 * scale, 0.7 * scale, 14);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xFF4081,
      transparent: true,
      opacity: 0.85,
      roughness: 0.1
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    group.add(glass);

    // Vermicelli yellow layer in middle
    const vermGeo = new THREE.CylinderGeometry(0.21 * scale, 0.17 * scale, 0.22 * scale, 14);
    const vermMat = new THREE.MeshLambertMaterial({ color: WOF_COLORS.faloodaYellow });
    const verm = new THREE.Mesh(vermGeo, vermMat);
    verm.position.y = 0.05 * scale;
    group.add(verm);

    // Ice cream scoop on top
    const scoopGeo = new THREE.SphereGeometry(0.18 * scale, 12, 12);
    const scoopMat = new THREE.MeshLambertMaterial({ color: 0xFFFDD0 });
    const scoop = new THREE.Mesh(scoopGeo, scoopMat);
    scoop.position.y = 0.42 * scale;
    group.add(scoop);

    // Red Cherry on top
    const cherryGeo = new THREE.SphereGeometry(0.08 * scale, 8, 8);
    const cherryMat = new THREE.MeshLambertMaterial({ color: WOF_COLORS.cherry });
    const cherry = new THREE.Mesh(cherryGeo, cherryMat);
    cherry.position.y = 0.58 * scale;
    group.add(cherry);

    group.userData = { foodType: 'falooda', category: 'drink', points: 40, radius: 0.5 * scale };
    return group;
  }

  // 🌟 THE GOLDEN FRY (Ultra Rare Easter Egg)
  createGoldenFryItem() {
    const group = new THREE.Group();

    // Curved golden fry stick
    const fryGeo = new THREE.BoxGeometry(0.16, 0.9, 0.16);
    const fry = new THREE.Mesh(fryGeo, this.matGold);
    fry.rotation.z = 0.2;
    fry.castShadow = true;
    group.add(fry);

    // Halo Starburst Ring
    const ringGeo = new THREE.TorusGeometry(0.65, 0.04, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xFFF59D });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    // Golden point light
    const pLight = new THREE.PointLight(0xFFD700, 2.5, 4);
    group.add(pLight);

    group.userData = { foodType: 'golden_fry', category: 'easter_egg', points: 1000, isGolden: true, radius: 0.8 };
    return group;
  }

  // --- 10. POWER-UP ITEMS ---

  // 🛡️ FULL MEAL SHIELD ICON
  createShieldPowerup() {
    const group = new THREE.Group();
    const orbGeo = new THREE.SphereGeometry(0.45, 16, 16);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x00E5FF,
      emissive: 0x0091EA,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    group.add(orb);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.05, 8, 24), new THREE.MeshBasicMaterial({ color: 0x80D8FF }));
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    group.userData = { powerupType: 'shield', duration: 15, radius: 0.7 };
    return group;
  }

  // 🧲 FRY MAGNET ICON
  createMagnetPowerup() {
    const group = new THREE.Group();
    // Horseshoe shape
    const magnetGeo = new THREE.TorusGeometry(0.42, 0.12, 12, 16, Math.PI);
    const magnetMat = new THREE.MeshLambertMaterial({ color: 0xD32F2F });
    const magnet = new THREE.Mesh(magnetGeo, magnetMat);
    magnet.rotation.z = Math.PI;
    group.add(magnet);

    // Silver tips
    const tipGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.18, 12);
    const tipMat = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });
    const leftTip = new THREE.Mesh(tipGeo, tipMat);
    leftTip.position.set(-0.42, -0.1, 0);
    const rightTip = new THREE.Mesh(tipGeo, tipMat);
    rightTip.position.set(0.42, -0.1, 0);
    group.add(leftTip, rightTip);

    group.userData = { powerupType: 'magnet', duration: 10, radius: 0.7 };
    return group;
  }

  // ⚡ TURBO DRINK (WOF BOOST) ICON
  createTurboPowerup() {
    const group = new THREE.Group();
    const canGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.7, 16);
    const canMat = new THREE.MeshStandardMaterial({
      color: 0x76FF03,
      emissive: 0x64DD17,
      emissiveIntensity: 0.7
    });
    const can = new THREE.Mesh(canGeo, canMat);
    group.add(can);

    // Lightning symbol
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.04, 8, 20), new THREE.MeshBasicMaterial({ color: 0xEEFF41 }));
    ring.rotation.y = Math.PI / 4;
    group.add(ring);

    group.userData = { powerupType: 'turbo', duration: 6, radius: 0.7 };
    return group;
  }

  // 🍔 BURGER MODE ICON
  createBurgerModePowerup() {
    const group = new THREE.Group();
    const b = this.createBurgerItem(1.0);
    group.add(b);

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xFFD700, transparent: true, opacity: 0.4 })
    );
    group.add(glow);

    group.userData = { powerupType: 'burger_mode', duration: 7, radius: 0.8 };
    return group;
  }

  // --- 11. SCENERY: BUILDINGS & STREET ELEMENTS ---

  // Stylized Coimbatore Street House / Shopfront (Subway Surfers Multi-Tier Facade)
  createBuilding(variant = 0, side = 'left') {
    const building = new THREE.Group();

    // Building Dimensions
    const width = 5.2 + (variant % 3) * 1.4;
    const height = 7.5 + ((variant * 2) % 4) * 1.5;
    const depth = 6.8;

    // Palette: Vibrant Coimbatore street facade colors
    const colors = [0xFF9F43, 0x54A0FF, 0xEE5253, 0x10AC84, 0xF368E0, 0xFF6B6B];
    const facadeColor = colors[variant % colors.length];

    // Main multi-story wall structure
    const wallMat = new THREE.MeshLambertMaterial({ color: facadeColor });
    const wallGeo = new THREE.BoxGeometry(width, height, depth);
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.y = height / 2;
    walls.castShadow = true;
    building.add(walls);

    // Ground Floor Commercial Plinth / Storefront Base
    const baseMat = new THREE.MeshLambertMaterial({ color: 0xF8F9FA });
    const baseGeo = new THREE.BoxGeometry(width + 0.15, 3.4, depth + 0.15);
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 1.7;
    building.add(baseMesh);

    // Storefront Entrance / Roll-down iron shutter facing street
    const shutterMat = new THREE.MeshLambertMaterial({ color: variant % 2 === 0 ? 0x2C3E50 : 0xC0392B });
    const shutterGeo = new THREE.BoxGeometry(0.12, 2.6, 3.8);
    const shutter = new THREE.Mesh(shutterGeo, shutterMat);
    if (side === 'left') {
      shutter.position.set(width / 2 + 0.08, 1.35, 0);
    } else {
      shutter.position.set(-width / 2 - 0.08, 1.35, 0);
    }
    building.add(shutter);

    // Warm Interior Illuminated Shop Display Window (glowing yellow warm light)
    const displayMat = new THREE.MeshBasicMaterial({ color: 0xFFF9C4 });
    const displayGeo = new THREE.BoxGeometry(0.14, 1.4, 2.4);
    const display = new THREE.Mesh(displayGeo, displayMat);
    if (side === 'left') {
      display.position.set(width / 2 + 0.09, 1.6, 0);
    } else {
      display.position.set(-width / 2 - 0.09, 1.6, 0);
    }
    building.add(display);

    // Shop Canopy / Striped Fabric Awning extending toward sidewalk
    const awningMat = new THREE.MeshLambertMaterial({ color: variant % 2 === 0 ? WOF_COLORS.orange : 0x0984E3 });
    const awningGeo = new THREE.BoxGeometry(1.6, 0.15, 4.4);
    const awning = new THREE.Mesh(awningGeo, awningMat);
    if (side === 'left') {
      awning.position.set(width / 2 + 0.8, 2.9, 0);
      awning.rotation.z = -0.25;
    } else {
      awning.position.set(-width / 2 - 0.8, 2.9, 0);
      awning.rotation.z = 0.25;
    }
    building.add(awning);

    // Ground Floor Shop Signboard (English & Tamil)
    const shopSigns = [
      { t: 'WOF BURGERS & FRIES', s: 'HOT & CRISPY SELVAPURAM' },
      { t: 'அண்ணா டீ ஸ்டால்', s: 'ANNAPOORNA KOVAI SPECIAL CHAI' },
      { t: 'SELVAPURAM SWEETS', s: 'FRESH PASTRIES & FALOODA' },
      { t: 'WOF RUSH EXPRESS', s: 'SUPER MEALS 30-MIN DELIVERY' },
      { t: 'கோவை பேக்கரி', s: 'HOT PUFFS, BUN MASKA & SHAKES' },
      { t: 'WOF PIZZA & WRAPS', s: 'SELVAPURAM FOOD STREET' }
    ];
    const signInfo = shopSigns[variant % shopSigns.length];
    const signTex = createTextTexture(signInfo.t, variant % 2 === 0 ? '#D32F2F' : '#FF6B00', '#FFFFFF', signInfo.s);
    const signMat = new THREE.MeshLambertMaterial({ map: signTex });
    const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.15), signMat);
    if (side === 'left') {
      signBoard.position.set(width / 2 + 0.1, 3.65, 0);
      signBoard.rotation.y = Math.PI / 2;
    } else {
      signBoard.position.set(-width / 2 - 0.1, 3.65, 0);
      signBoard.rotation.y = -Math.PI / 2;
    }
    building.add(signBoard);

    // Upper Floor Windows with white molded frames, warm glowing glass & sunshades (Chajja)
    const winFrameMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const winGlassMat = new THREE.MeshBasicMaterial({ color: 0xFFF59D }); // Warm illuminated window
    const chajjaMat = new THREE.MeshLambertMaterial({ color: 0x47535E });
    const numFloors = Math.floor((height - 3.4) / 2.0);

    for (let f = 0; f < numFloors; f++) {
      const winY = 4.8 + f * 2.0;
      [-1.4, 1.4].forEach(zPos => {
        // Frame
        const frameGeo = new THREE.BoxGeometry(0.12, 1.3, 1.0);
        const frame = new THREE.Mesh(frameGeo, winFrameMat);
        // Glass
        const glassGeo = new THREE.BoxGeometry(0.14, 1.1, 0.8);
        const glass = new THREE.Mesh(glassGeo, winGlassMat);
        // Chajja (South Indian concrete sunshade sloping over window)
        const chajjaGeo = new THREE.BoxGeometry(0.6, 0.08, 1.2);
        const chajja = new THREE.Mesh(chajjaGeo, chajjaMat);

        if (side === 'left') {
          frame.position.set(width / 2 + 0.06, winY, zPos);
          glass.position.set(width / 2 + 0.07, winY, zPos);
          chajja.position.set(width / 2 + 0.35, winY + 0.72, zPos);
          chajja.rotation.z = -0.22;
        } else {
          frame.position.set(-width / 2 - 0.06, winY, zPos);
          glass.position.set(-width / 2 - 0.07, winY, zPos);
          chajja.position.set(-width / 2 - 0.35, winY + 0.72, zPos);
          chajja.rotation.z = 0.22;
        }
        building.add(frame, glass, chajja);
      });

      // Air Conditioner Outdoor Compressor Unit on upper floors
      if (f === 0 && variant % 2 === 0) {
        const acGeo = new THREE.BoxGeometry(0.5, 0.4, 0.6);
        const acMat = new THREE.MeshLambertMaterial({ color: 0xDFE6E9 });
        const acMesh = new THREE.Mesh(acGeo, acMat);
        if (side === 'left') {
          acMesh.position.set(width / 2 + 0.3, winY - 0.3, 0);
        } else {
          acMesh.position.set(-width / 2 - 0.3, winY - 0.3, 0);
        }
        building.add(acMesh);
      }
    }

    // Rooftop Terrace Parapet Wall
    const parapetGeo = new THREE.BoxGeometry(width + 0.3, 0.5, depth + 0.3);
    const parapetMat = new THREE.MeshLambertMaterial({ color: 0x2D3436 });
    const parapet = new THREE.Mesh(parapetGeo, parapetMat);
    parapet.position.y = height + 0.25;
    building.add(parapet);

    // Terracotta Coping Rim on Roof
    const roofCopingGeo = new THREE.BoxGeometry(width + 0.4, 0.1, depth + 0.4);
    const roofCopingMat = new THREE.MeshLambertMaterial({ color: 0xD35400 });
    const roofCoping = new THREE.Mesh(roofCopingGeo, roofCopingMat);
    roofCoping.position.y = height + 0.52;
    building.add(roofCoping);

    // Iconic South Indian Sintex Water Tank on roof
    const tankGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.1, 14);
    const tankMat = new THREE.MeshLambertMaterial({ color: variant % 2 === 0 ? 0x1E272E : 0xDFE4EA });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set((variant % 2 === 0 ? 1 : -1) * 1.3, height + 1.05, -1.2);
    building.add(tank);

    // Satellite Dish Antenna
    const dishGeo = new THREE.CylinderGeometry(0.4, 0.05, 0.1, 10);
    const dishMat = new THREE.MeshLambertMaterial({ color: 0xFAFAFA });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.rotation.x = 0.6;
    dish.position.set((variant % 2 === 0 ? -1 : 1) * 1.2, height + 0.8, 1.0);
    building.add(dish);

    building.userData = { width, depth, height };
    return building;
  }

  // Tropical Coconut / Palm Tree
  createPalmTree() {
    const tree = new THREE.Group();

    // Curved Segmented Trunk
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5D4037 });
    let currY = 0;
    let currX = 0;
    for (let i = 0; i < 7; i++) {
      const segH = 0.7;
      const segGeo = new THREE.CylinderGeometry(0.18 - i * 0.015, 0.22 - i * 0.015, segH, 8);
      const seg = new THREE.Mesh(segGeo, trunkMat);
      seg.position.set(currX, currY + segH / 2, 0);
      seg.rotation.z = -0.06;
      tree.add(seg);
      currY += segH * 0.95;
      currX += 0.05;
    }

    // Lush Palm Fronds
    const frondMat = new THREE.MeshLambertMaterial({ color: 0x2E7D32, side: THREE.DoubleSide });
    const frondCount = 7;
    for (let i = 0; i < frondCount; i++) {
      const angle = (i / frondCount) * Math.PI * 2;
      const frondGeo = new THREE.ConeGeometry(0.7, 2.2, 5);
      const frond = new THREE.Mesh(frondGeo, frondMat);
      frond.position.set(currX, currY, 0);
      frond.rotation.y = angle;
      frond.rotation.z = Math.PI / 2.8;
      tree.add(frond);
    }

    // Tiny green coconuts
    const nutGeo = new THREE.SphereGeometry(0.14, 8, 8);
    const nutMat = new THREE.MeshLambertMaterial({ color: 0x689F38 });
    for (let j = 0; j < 3; j++) {
      const nut = new THREE.Mesh(nutGeo, nutMat);
      nut.position.set(currX + (j - 1) * 0.15, currY - 0.1, (j % 2) * 0.15);
      tree.add(nut);
    }

    tree.position.y = 0;
    return tree;
  }

  // Street Lamp with glowing cone
  createStreetLamp(side = 'left') {
    const lamp = new THREE.Group();

    const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 4.5, 10);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x455A64 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 2.25;
    lamp.add(pole);

    // Overhang arm reaching towards road
    const armGeo = new THREE.BoxGeometry(side === 'left' ? 1.0 : 1.0, 0.08, 0.08);
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.position.set(side === 'left' ? -0.4 : 0.4, 4.4, 0);
    lamp.add(arm);

    // Warm Light Bulb
    const bulbGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xFFF9C4 });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(side === 'left' ? -0.8 : 0.8, 4.25, 0);
    lamp.add(bulb);

    return lamp;
  }

  // Road Banner stretching across street
  createRoadBanner(text = 'WOF RUSH - FRESH FOODS') {
    const bannerGroup = new THREE.Group();

    const bannerTex = createTextTexture(text, '#FF6B00', '#FFFFFF', 'SELVAPURAM, COIMBATORE');
    const bannerGeo = new THREE.PlaneGeometry(7.0, 1.2);
    const bannerMat = new THREE.MeshLambertMaterial({ map: bannerTex, side: THREE.DoubleSide });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.y = 4.2;
    bannerGroup.add(banner);

    // Hanging cables
    const wireMat = new THREE.LineBasicMaterial({ color: 0x212121 });
    const leftPoints = [new THREE.Vector3(-3.5, 4.2, 0), new THREE.Vector3(-4.5, 5.5, 0)];
    const rightPoints = [new THREE.Vector3(3.5, 4.2, 0), new THREE.Vector3(4.5, 5.5, 0)];
    const leftLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(leftPoints), wireMat);
    const rightLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(rightPoints), wireMat);
    bannerGroup.add(leftLine, rightLine);

    return bannerGroup;
  }

  // Waving WOF Mascot Easter Egg beside shop
  createEasterEggMascot() {
    const mascot = new THREE.Group();
    // Round burger body
    const burger = this.createBurgerItem(1.3);
    burger.position.y = 1.4;
    mascot.add(burger);

    // Cute Big Eyes
    const eyeGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const pupilGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeo, this.matWhite);
    leftEye.position.set(0.25, 1.6, 0.45);
    const leftPupil = new THREE.Mesh(pupilGeo, this.matBlack);
    leftPupil.position.set(0.27, 1.6, 0.54);

    const rightEye = new THREE.Mesh(eyeGeo, this.matWhite);
    rightEye.position.set(-0.25, 1.6, 0.45);
    const rightPupil = new THREE.Mesh(pupilGeo, this.matBlack);
    rightPupil.position.set(-0.23, 1.6, 0.54);
    mascot.add(leftEye, leftPupil, rightEye, rightPupil);

    // Chef Hat on top
    const hatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.15, 12), this.matWhite);
    hatBase.position.y = 2.1;
    const hatDome = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), this.matWhite);
    hatDome.position.y = 2.15;
    mascot.add(hatBase, hatDome);

    // Waving Hand
    const handGeo = new THREE.SphereGeometry(0.16, 8, 8);
    const leftHand = new THREE.Mesh(handGeo, this.matWhite);
    leftHand.position.set(0.7, 1.7, 0.2);
    const rightHand = new THREE.Mesh(handGeo, this.matWhite);
    rightHand.position.set(-0.7, 1.4, 0.1);
    mascot.add(leftHand, rightHand);

    mascot.userData = { isMascot: true, waved: false };
    return mascot;
  }
}

// Global instance
window.modelFactory = new ModelFactory();
