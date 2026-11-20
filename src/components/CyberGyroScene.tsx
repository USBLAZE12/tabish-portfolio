import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const _vec3 = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _euler = new THREE.Euler();
const _defaultCamPos = new THREE.Vector3(0, 1.05, 5.6);
const _defaultTarget = new THREE.Vector3(0, 0, 0);

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.04,
      size / 2,
      size / 2,
      size * 0.48
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
    grad.addColorStop(0.45, 'rgba(0, 0, 0, 0.34)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBrushedMetalTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#888888';
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y++) {
      const shade = 115 + Math.floor(Math.sin(y * 0.7) * 18 + (Math.random() - 0.5) * 28);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(0, y, size, 1);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  return tex;
}

interface SceneActionsRef {
  autoOrbit: boolean;
  wireframe: boolean;
  exploded: boolean;
  bloom: boolean;
  resetCameraPending: boolean;
  pulseImpulse: number;
}

export default function CyberGyroScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [autoOrbit, setAutoOrbit] = useState<boolean>(true);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [exploded, setExploded] = useState<boolean>(false);
  const [bloomEnabled, setBloomEnabled] = useState<boolean>(true);
  const [controlsCollapsed, setControlsCollapsed] = useState<boolean>(false);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [pulseCount, setPulseCount] = useState<number>(0);
  const [webglError, setWebglError] = useState<boolean>(false);

  const stateRef = useRef<SceneActionsRef>({
    autoOrbit: true,
    wireframe: false,
    exploded: false,
    bloom: true,
    resetCameraPending: false,
    pulseImpulse: 0,
  });

  useEffect(() => {
    stateRef.current.autoOrbit = autoOrbit;
  }, [autoOrbit]);

  useEffect(() => {
    stateRef.current.wireframe = wireframe;
  }, [wireframe]);

  useEffect(() => {
    stateRef.current.exploded = exploded;
  }, [exploded]);

  useEffect(() => {
    stateRef.current.bloom = bloomEnabled;
  }, [bloomEnabled]);

  const handleResetView = () => {
    stateRef.current.resetCameraPending = true;
  };

  const handlePulseCore = () => {
    stateRef.current.pulseImpulse = 1;
    setPulseCount((c) => c + 1);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSoftwareGl = detectSoftwareWebGL();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError(true);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 560;

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.052);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 80);
    camera.position.copy(_defaultCamPos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 3.2;
    controls.maxDistance = 9.5;
    controls.minPolarAngle = Math.PI * 0.15;
    controls.maxPolarAngle = Math.PI * 0.82;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.055;
    controls.autoRotate = !isSoftwareGl && !prefersReducedMotion && stateRef.current.autoOrbit;
    controls.autoRotateSpeed = 0.9;
    controls.target.copy(_defaultTarget);

    const cancelResetOnUserInput = () => {
      stateRef.current.resetCameraPending = false;
    };
    controls.addEventListener('start', cancelResetOnUserInput);

    // Three-point studio lighting + warm core illumination
    const hemiLight = new THREE.HemisphereLight(0xa3c2ff, 0x1a0903, 0.65);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffb570, 2.2);
    keyLight.position.set(4.5, 6.2, 4.8);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 18;
      keyLight.shadow.camera.left = -3.5;
      keyLight.shadow.camera.right = 3.5;
      keyLight.shadow.camera.top = 3.5;
      keyLight.shadow.camera.bottom = -3.5;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xff5a1f, 1.35);
    rimLight.position.set(-5.0, 2.5, -4.5);
    scene.add(rimLight);

    const coreLight = new THREE.PointLight(0xff6b1a, 5.0, 12, 2);
    coreLight.position.set(0, 0.15, 0);
    scene.add(coreLight);

    // Ground contact shadow & subtle architectural plinth ring
    const shadowTex = createContactShadowTexture();
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(5.6, 5.6),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.55,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.92;
    scene.add(shadowPlane);

    const floorRingGeo = new THREE.RingGeometry(1.78, 1.84, 72);
    const floorRingMat = new THREE.MeshBasicMaterial({
      color: 0xea580c,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const floorRing = new THREE.Mesh(floorRingGeo, floorRingMat);
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.y = -1.9;
    scene.add(floorRing);

    // Procedural brushed roughness map
    const brushedTex = createBrushedMetalTexture();
    brushedTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // Composite 8-part procedural Weblumes Optical Gyroscope
    const rootGroup = new THREE.Group();
    rootGroup.position.y = 0.15;
    scene.add(rootGroup);

    const wireframeMaterials: THREE.MeshStandardMaterial[] = [];
    const clickableMeshes: THREE.Object3D[] = [];

    // 1. Outer Titanium Gimbal Ring
    const outerMat = new THREE.MeshPhysicalMaterial({
      color: 0x3b3f47,
      metalness: 0.92,
      roughness: 0.24,
      roughnessMap: brushedTex,
      anisotropy: 0.8,
      clearcoat: 0.3,
    });
    wireframeMaterials.push(outerMat);

    const outerGroup = new THREE.Group();
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.52, 0.075, 24, 96), outerMat);
    outerRing.castShadow = !isSoftwareGl;
    outerRing.receiveShadow = !isSoftwareGl;
    outerRing.userData.partName = 'Outer Titanium Gimbal';
    outerRing.layers.enable(1);
    clickableMeshes.push(outerRing);
    outerGroup.add(outerRing);

    // 2. Machined Mounting Brackets on Outer Ring (4 accent lugs)
    const lugMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.72,
      roughness: 0.52,
    });
    wireframeMaterials.push(lugMat);
    const lugGeo = new THREE.BoxGeometry(0.14, 0.22, 0.18);
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const lug = new THREE.Mesh(lugGeo, lugMat);
      lug.position.set(Math.cos(angle) * 1.52, Math.sin(angle) * 1.52, 0);
      lug.rotation.z = angle;
      outerGroup.add(lug);
    }
    rootGroup.add(outerGroup);

    // 3. Middle Obsidian Gunmetal Ring
    const midMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b18,
      metalness: 0.84,
      roughness: 0.36,
    });
    wireframeMaterials.push(midMat);

    const midGroup = new THREE.Group();
    const midRing = new THREE.Mesh(new THREE.TorusGeometry(1.16, 0.06, 20, 84), midMat);
    midRing.castShadow = !isSoftwareGl;
    midRing.userData.partName = 'Middle Gyro Ring';
    midRing.layers.enable(1);
    clickableMeshes.push(midRing);
    midGroup.add(midRing);

    // 4. Precision Collar Rib inside Middle Ring
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0xc2410c,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x7c2d12,
      emissiveIntensity: 0.35,
    });
    wireframeMaterials.push(collarMat);
    const collarRing = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.016, 12, 72), collarMat);
    midGroup.add(collarRing);
    rootGroup.add(midGroup);

    // 5. Inner Brushed Copper-Gold Ring
    const innerMat = new THREE.MeshPhysicalMaterial({
      color: 0xd97706,
      metalness: 0.95,
      roughness: 0.16,
      anisotropy: 0.8,
      clearcoat: 0.5,
    });
    wireframeMaterials.push(innerMat);

    const innerGroup = new THREE.Group();
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.045, 20, 72), innerMat);
    innerRing.userData.partName = 'Inner Copper Gimbal';
    innerRing.layers.enable(1);
    clickableMeshes.push(innerRing);
    innerGroup.add(innerRing);
    rootGroup.add(innerGroup);

    // 6. Optical Core (faceted inner emitter + translucent outer lens shell)
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xff7a1a,
      emissive: 0xff5a00,
      emissiveIntensity: 1.85,
      roughness: 0.25,
      metalness: 0.1,
    });
    wireframeMaterials.push(coreMat);

    const coreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), coreMat);
    coreMesh.userData.partName = 'Weblumes Optical Core';
    coreMesh.layers.enable(1);
    clickableMeshes.push(coreMesh);
    rootGroup.add(coreMesh);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffedd5,
      metalness: 0,
      roughness: 0.08,
      transmission: isSoftwareGl ? 0 : 0.78,
      transparent: true,
      opacity: isSoftwareGl ? 0.32 : 1,
      ior: 1.55,
      thickness: 0.8,
      clearcoat: 1.0,
      depthWrite: false,
    });
    const glassShell = new THREE.Mesh(new THREE.SphereGeometry(0.56, 36, 36), glassMat);
    glassShell.renderOrder = 2;
    rootGroup.add(glassShell);

    // 7. Fine Orbital Wire Paths (2 tilted rings)
    const orbitLines: THREE.LineLoop[] = [];
    const orbitConfigs = [
      { radius: 2.15, color: 0xea580c, opacity: 0.42, tiltX: 0.55, tiltZ: 0.35 },
      { radius: 2.38, color: 0x94a3b8, opacity: 0.26, tiltX: -0.45, tiltZ: -0.5 },
    ];
    for (const cfg of orbitConfigs) {
      const pts: THREE.Vector3[] = [];
      const segments = 96;
      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(theta) * cfg.radius, 0, Math.sin(theta) * cfg.radius));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: cfg.opacity,
      });
      const loop = new THREE.LineLoop(lineGeo, lineMat);
      loop.rotation.set(cfg.tiltX, 0, cfg.tiltZ);
      orbitLines.push(loop);
      rootGroup.add(loop);
    }

    // 8. Instanced Orbital Telemetry Nodes (36 nodes)
    const nodeCount = 36;
    const nodeGeo = new THREE.SphereGeometry(0.028, 10, 10);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xfdba74,
      emissive: 0xf97316,
      emissiveIntensity: 1.4,
      roughness: 0.3,
      metalness: 0.2,
    });
    const instancedNodes = new THREE.InstancedMesh(nodeGeo, nodeMat, nodeCount);
    instancedNodes.frustumCulled = false;

    for (let i = 0; i < nodeCount; i++) {
      const orbitIdx = i % 2;
      const cfg = orbitConfigs[orbitIdx];
      const angle = (i / (nodeCount / 2)) * Math.PI * 2;
      const s = 0.75 + (i % 4) * 0.14;
      _vec3.set(Math.cos(angle) * cfg.radius, 0, Math.sin(angle) * cfg.radius);
      _euler.set(cfg.tiltX, 0, cfg.tiltZ);
      _vec3.applyEuler(_euler);
      _quat.identity();
      _scale.set(s, s, s);
      _mat4.compose(_vec3, _quat, _scale);
      instancedNodes.setMatrixAt(i, _mat4);
    }
    instancedNodes.instanceMatrix.needsUpdate = true;
    instancedNodes.computeBoundingSphere();
    rootGroup.add(instancedNodes);

    // Pre-warm shaders and configure EffectComposer + UnrealBloomPass on GPU
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);

      composer = new EffectComposer(renderer);
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(width, height);

      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        0.55, // subtle cyberpunk bloom strength
        0.45, // soft glow radius
        0.82 // threshold so only emissive core, nodes, and sharp highlights glow
      );
      composer.addPass(bloomPass);

      const outputPass = new OutputPass();
      composer.addPass(outputPass);
    }

    // Raycasting for hover & click
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointerNdc = new THREE.Vector2(-9, -9);
    let lastRaycastTime = 0;
    let currentHoveredObj: THREE.Object3D | null = null;

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handlePointerMove = (e: PointerEvent) => {
      updatePointer(e.clientX, e.clientY);
      const now = performance.now();
      if (now - lastRaycastTime < 45) return;
      lastRaycastTime = now;

      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(clickableMeshes, false);
      if (hits.length > 0) {
        const hitObj = hits[0].object;
        if (currentHoveredObj !== hitObj) {
          currentHoveredObj = hitObj;
          setHoveredPart(String(hitObj.userData.partName || '3D Module'));
        }
        renderer.domElement.style.cursor = 'pointer';
      } else {
        if (currentHoveredObj !== null) {
          currentHoveredObj = null;
          setHoveredPart(null);
        }
        renderer.domElement.style.cursor = 'grab';
      }
    };

    const handlePointerLeave = () => {
      currentHoveredObj = null;
      setHoveredPart(null);
      renderer.domElement.style.cursor = 'grab';
    };

    const handleClick = (e: MouseEvent) => {
      updatePointer(e.clientX, e.clientY);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(clickableMeshes, false);
      if (hits.length > 0) {
        stateRef.current.pulseImpulse = 1;
        setPulseCount((c) => c + 1);
      }
    };

    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.addEventListener('pointermove', handlePointerMove, { passive: true });
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave);
    renderer.domElement.addEventListener('click', handleClick);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
    };
    const handleContextRestored = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || 560;
      renderer.setSize(w, h);
      if (composer && bloomPass) {
        composer.setSize(w, h);
        bloomPass.resolution.set(w, h);
      }
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (composer && bloomPass) {
        composer.setPixelRatio(renderer.getPixelRatio());
        composer.setSize(w, h);
        bloomPass.resolution.set(w, h);
      }
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Animation loop with software-WebGL pacing
    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();
    let explodeFactor = 0;
    let pulseEnergy = 0;
    let prevWireframe = false;

    function afterDraw(cb: () => void) {
      if (disposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (status === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    const tick = () => {
      if (disposed) return;

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // Sync wireframe mode only on change
      if (stateRef.current.wireframe !== prevWireframe) {
        prevWireframe = stateRef.current.wireframe;
        for (const mat of wireframeMaterials) {
          mat.wireframe = prevWireframe;
        }
      }

      // Sync OrbitControls autoRotate
      controls.autoRotate = !isSoftwareGl && !prefersReducedMotion && stateRef.current.autoOrbit;

      // Damped exploded view separation
      const targetExplode = stateRef.current.exploded ? 1 : 0;
      explodeFactor = THREE.MathUtils.damp(explodeFactor, targetExplode, 6, delta);
      outerGroup.position.z = -explodeFactor * 0.55;
      midGroup.position.z = explodeFactor * 0.15;
      innerGroup.position.z = explodeFactor * 0.55;

      // Damped pulse reaction when user clicks core or triggers Pulse
      if (stateRef.current.pulseImpulse > 0) {
        pulseEnergy = 1;
        stateRef.current.pulseImpulse = 0;
      }
      pulseEnergy = THREE.MathUtils.damp(pulseEnergy, 0, 4.5, delta);

      const coreScale = 1 + pulseEnergy * 0.24 + (prefersReducedMotion ? 0 : Math.sin(elapsed * 2.2) * 0.03);
      coreMesh.scale.setScalar(coreScale);
      coreMat.emissiveIntensity = 1.75 + pulseEnergy * 2.4;
      coreLight.intensity = 4.6 + pulseEnergy * 5.0;

      if (bloomPass) {
        bloomPass.enabled = stateRef.current.bloom;
        bloomPass.strength = 0.55 + pulseEnergy * 0.4;
      }

      // Smooth damped camera reset
      if (stateRef.current.resetCameraPending) {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _defaultCamPos.x, 6.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _defaultCamPos.y, 6.5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _defaultCamPos.z, 6.5, delta);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, _defaultTarget.x, 6.5, delta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _defaultTarget.y, 6.5, delta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _defaultTarget.z, 6.5, delta);

        if (camera.position.distanceTo(_defaultCamPos) < 0.02) {
          camera.position.copy(_defaultCamPos);
          controls.target.copy(_defaultTarget);
          stateRef.current.resetCameraPending = false;
        }
      }

      // Subtle continuous mechanical gimbal motion
      if (!prefersReducedMotion) {
        outerGroup.rotation.x = Math.sin(elapsed * 0.35) * 0.32;
        outerGroup.rotation.y += delta * 0.18;

        midGroup.rotation.y = Math.cos(elapsed * 0.45) * 0.45;
        midGroup.rotation.x += delta * 0.28;

        innerGroup.rotation.z += delta * 0.42;
        innerGroup.rotation.x = Math.sin(elapsed * 0.6) * 0.5;

        coreMesh.rotation.y -= delta * 0.55;
        coreMesh.rotation.x += delta * 0.32;

        instancedNodes.rotation.y += delta * 0.16;
        orbitLines[0].rotation.y += delta * 0.16;
        orbitLines[1].rotation.y -= delta * 0.12;
      }

      controls.update();
      if (composer && !isSoftwareGl) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      renderer.render(scene, camera);
      afterDraw(tick);
    } else {
      frameId = window.requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);

      controls.removeEventListener('start', cancelResetOnUserInput);
      controls.dispose();

      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineLoop) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });

      shadowTex.dispose();
      brushedTex.dispose();
      envTarget.dispose();
      bloomPass?.dispose();
      composer?.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[520px] sm:h-[580px] lg:h-[640px] bg-[#0a0a0a] overflow-hidden select-none">
      {/* Isolated WebGL mount container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Fallback if WebGL unavailable */}
      {webglError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-orange-500 mb-2">
            3D Viewport Unavailable
          </p>
          <p className="text-sm text-neutral-300 max-w-md">
            WebGL rendering is disabled in this browser environment. All core Weblumes capabilities remain available below.
          </p>
        </div>
      )}

      {/* Minimal Top-Left Viewport Title */}
      <div className="pointer-events-none absolute top-5 left-5 sm:top-7 sm:left-8 flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-400">
          Interactive 3D Core
        </span>
        <p className="text-xs text-neutral-300">
          {hoveredPart ? `Inspecting: ${hoveredPart}` : 'Drag to orbit · Scroll to zoom · Click core to pulse'}
        </p>
      </div>

      {/* Top-Right Static Interaction Telemetry */}
      {pulseCount > 0 && (
        <div className="pointer-events-none absolute top-5 right-5 sm:top-7 sm:right-8 text-xs tabular-nums text-neutral-400">
          Core pulses: {pulseCount}
        </div>
      )}

      {/* Collapsible Bottom Control Dock (no backdrop-blur over WebGL) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center max-w-[94vw]">
        <button
          type="button"
          onClick={() => setControlsCollapsed((prev) => !prev)}
          className="mb-2 px-3.5 py-1 rounded-full text-[11px] font-medium text-neutral-300 bg-[#141416] border border-white/10 hover:text-white hover:border-white/25 transition-colors cursor-pointer whitespace-nowrap"
        >
          {controlsCollapsed ? '▴ Show Controls' : '▾ Hide Controls'}
        </button>

        {!controlsCollapsed && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-[#141416]/95 border border-white/12 shadow-xl">
            <button
              type="button"
              onClick={() => setAutoOrbit((prev) => !prev)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                autoOrbit
                  ? 'bg-orange-600 text-white'
                  : 'text-neutral-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              Auto-Orbit
            </button>

            <button
              type="button"
              onClick={() => setWireframe((prev) => !prev)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                wireframe
                  ? 'bg-white text-neutral-900'
                  : 'text-neutral-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              Wireframe
            </button>

            <button
              type="button"
              onClick={() => setExploded((prev) => !prev)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                exploded
                  ? 'bg-white text-neutral-900'
                  : 'text-neutral-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              Explode
            </button>

            <button
              type="button"
              onClick={() => setBloomEnabled((prev) => !prev)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                bloomEnabled
                  ? 'bg-orange-600 text-white'
                  : 'text-neutral-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              Glow
            </button>

            <button
              type="button"
              onClick={handlePulseCore}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium text-neutral-300 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              Pulse Core
            </button>

            <button
              type="button"
              onClick={handleResetView}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium text-neutral-300 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              Reset View
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
