"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type ContactIdBadgeProps = {
  locale: "en" | "id";
  paused?: boolean;
};

// Physics chain & geometry constants
const NUM_JOINTS = 8;
const GRAVITY = -34;
const DAMPING = 0.955;
const UV_ASPECT = 0.757248; // UV max V from badge.glb accessor

export function constrainBadgeRibbon(positions: Float32Array, bounds: THREE.Box3, matrix: THREE.Matrix4, ribbonWidth: number) {
  if (bounds.isEmpty()) return;
  const inverse = matrix.clone().invert();
  const points = Array.from({ length: positions.length / 3 }, (_, index) =>
    new THREE.Vector3().fromArray(positions, index * 3).applyMatrix4(inverse));
  const clearance = ribbonWidth * 0.5 + 0.002;
  const solid = bounds.clone().expandByScalar(0.002);
  solid.min.z = -Infinity;
  solid.max.z = Infinity;
  const quadBounds = new THREE.Box3();
  for (let pass = 0; pass < points.length / 2; pass++) {
    let changed = false;
    for (let row = 0; row < points.length / 2 - 1; row++) {
      const quad = points.slice(row * 2, row * 2 + 4);
      quadBounds.setFromPoints(quad);
      if (!quadBounds.intersectsBox(solid)) continue;
      for (const point of quad) {
        if (point.y >= solid.max.y + clearance) continue;
        point.y = solid.max.y + clearance;
        changed = true;
      }
    }
    if (!changed) break;
  }
  points.forEach((point, index) => point.applyMatrix4(matrix).toArray(positions, index * 3));
}

export default function ContactIdBadge({ locale, paused = false }: ContactIdBadgeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const localeRef = useRef(locale);
  const redrawCardRef = useRef<(() => void) | null>(null);
  const pausedRef = useRef(paused);
  const syncAnimationRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
    syncAnimationRef.current?.();
  }, [paused]);

  useEffect(() => {
    localeRef.current = locale;
    redrawCardRef.current?.();
  }, [locale]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const targetContainer = container;
    const targetCanvas = canvas;

    function initBadge() {
      let disposed = false;
      let inViewport = false;
      delete targetCanvas.dataset.ready;
      const modelGeometries = new Set<THREE.BufferGeometry>();
      const modelMaterials = new Set<THREE.Material>();
      const modelTextures = new Set<THREE.Texture>();
      const disposeModelResources = () => {
        modelGeometries.forEach(geometry => geometry.dispose());
        modelMaterials.forEach(material => material.dispose());
        modelTextures.forEach(texture => texture.dispose());
        modelGeometries.clear();
        modelMaterials.clear();
        modelTextures.clear();
      };
      let width = targetContainer.clientWidth || window.innerWidth;
      let height = targetContainer.clientHeight || 760;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const getBadgeScale = (w: number) => {
        if (w >= 1200) return 2.25;
        if (w >= 1024) return 2.07;
        if (w >= 768) return 1.76;
        return 1.44;
      };
      let badgeScale = getBadgeScale(width);
      let attachOffsetY = 0.70653 * badgeScale;
      let strapWidth = 0.165 * (badgeScale / 2.15);
      let model: THREE.Group | undefined;
      let cardSolid: THREE.Mesh | undefined;
      const cardLocalBounds = new THREE.Box3();
      const cardLocalMatrix = new THREE.Matrix4();

      // Three.js Scene & Camera setup
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(23, width / height, 0.1, 100);
      camera.position.set(0, 0, 14.5);

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas: targetCanvas,
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        });
      } catch {
        return () => {};
      }
      const onContextLost = () => { delete targetCanvas.dataset.ready; };
      targetCanvas.addEventListener("webglcontextlost", onContextLost);
    renderer.setSize(width, height);
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // Lighting setup for realistic physical reflection
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(-5, 8, 9);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
    fillLight.position.set(6, -2, 7);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xffffff, 1.2, 25);
    rimLight.position.set(0, -4, 5);
    scene.add(rimLight);

    // 1024x1024 Texture Canvas (UV active region: 0..512 and 512..1024, height 0..775)
    const cardCanvas = document.createElement("canvas");
    cardCanvas.width = 1024;
    cardCanvas.height = 1024;
    const cardCtx = cardCanvas.getContext("2d")!;
    const cardH = Math.round(1024 * UV_ASPECT); // ~775px

    const cardTexture = new THREE.CanvasTexture(cardCanvas);
    cardTexture.colorSpace = THREE.SRGBColorSpace;
    cardTexture.flipY = false;
    cardTexture.anisotropy = 8;

    const bwPhotoCanvas = document.createElement("canvas");
    let hasPhoto = false;

    function drawTopographicWaves(ctx: CanvasRenderingContext2D, startX: number) {
      ctx.save();
      ctx.lineWidth = 1.2;
      const waves = [
        { y0: 80,  cp1x: 120, cp1y: 200, cp2x: 280, cp2y: 60,  x1: 490, y1: 170, color: "rgba(243, 242, 237, 0.045)" },
        { y0: 170, cp1x: 100, cp1y: 310, cp2x: 320, cp2y: 130, x1: 490, y1: 290, color: "rgba(243, 242, 237, 0.038)" },
        { y0: 380, cp1x: 140, cp1y: 520, cp2x: 330, cp2y: 310, x1: 490, y1: 460, color: "rgba(255, 77, 0, 0.05)" },
        { y0: 480, cp1x: 150, cp1y: 630, cp2x: 350, cp2y: 430, x1: 490, y1: 580, color: "rgba(243, 242, 237, 0.04)" },
        { y0: 590, cp1x: 130, cp1y: 720, cp2x: 370, cp2y: 530, x1: 490, y1: 670, color: "rgba(243, 242, 237, 0.035)" },
      ];
      waves.forEach(w => {
        ctx.strokeStyle = w.color;
        ctx.beginPath();
        ctx.moveTo(startX + 20, w.y0);
        ctx.bezierCurveTo(startX + w.cp1x, w.cp1y, startX + w.cp2x, w.cp2y, startX + w.x1, w.y1);
        ctx.stroke();
      });
      ctx.restore();
    }

    function drawCardTexture() {
      if (disposed) return;
      cardCtx.save();
      // Base pure dark background
      cardCtx.fillStyle = "#070709";
      cardCtx.fillRect(0, 0, 1024, 1024);

      // =========================================================================
      // FRONT SIDE (0..512, 0..cardH) - Editorial B&W + Subtle Orange Accent
      // =========================================================================
      cardCtx.save();
      cardCtx.beginPath();
      cardCtx.rect(0, 0, 512, cardH);
      cardCtx.clip();

      const frontGrad = cardCtx.createLinearGradient(0, 0, 512, cardH);
      frontGrad.addColorStop(0, "#111215");
      frontGrad.addColorStop(0.4, "#0a0b0d");
      frontGrad.addColorStop(1, "#060708");
      cardCtx.fillStyle = frontGrad;
      cardCtx.fillRect(0, 0, 512, cardH);

      // Subtle micro-dot matrix pattern across card front for tactical texture
      cardCtx.fillStyle = "rgba(243, 242, 237, 0.018)";
      for (let dotY = 32; dotY < cardH - 30; dotY += 24) {
        for (let dotX = 28; dotX < 490; dotX += 24) {
          cardCtx.fillRect(dotX, dotY, 1, 1);
        }
      }

      // Topographic contour waves (delicate, refined)
      drawTopographicWaves(cardCtx, 0);

      // Card outer border (refined, crisp)
      cardCtx.strokeStyle = "rgba(243, 242, 237, 0.14)";
      cardCtx.lineWidth = 1.5;
      cardCtx.strokeRect(8, 8, 496, cardH - 16);

      // Inner hairline border
      cardCtx.strokeStyle = "rgba(243, 242, 237, 0.04)";
      cardCtx.lineWidth = 1;
      cardCtx.strokeRect(14, 14, 484, cardH - 28);

      // Corner registration marks (+)
      const regCrosses = [
        [24, 24],
        [488, 24],
        [24, cardH - 24],
        [488, cardH - 24],
      ];
      cardCtx.strokeStyle = "rgba(243, 242, 237, 0.15)";
      cardCtx.lineWidth = 1;
      regCrosses.forEach(([rx, ry]) => {
        cardCtx.beginPath();
        cardCtx.moveTo(rx - 4, ry);
        cardCtx.lineTo(rx + 4, ry);
        cardCtx.moveTo(rx, ry - 4);
        cardCtx.lineTo(rx, ry + 4);
        cardCtx.stroke();
      });

      // Top Header: Minimal Monogram Chip + Technical Status
      // Left: clean monogram badge
      cardCtx.strokeStyle = "rgba(243, 242, 237, 0.12)";
      cardCtx.lineWidth = 1;
      cardCtx.strokeRect(36, 38, 26, 18);
      cardCtx.fillStyle = "rgba(243, 242, 237, 0.65)";
      cardCtx.font = "bold 9px monospace";
      cardCtx.fillText("MD", 42, 50);

      // Subtle hairline line connecting header elements
      cardCtx.strokeStyle = "rgba(243, 242, 237, 0.05)";
      cardCtx.beginPath();
      cardCtx.moveTo(70, 47);
      cardCtx.lineTo(430, 47);
      cardCtx.stroke();

      // Top-right status dot (#FF4D00) with subtle glow
      cardCtx.save();
      cardCtx.shadowColor = "#FF4D00";
      cardCtx.shadowBlur = 6;
      cardCtx.fillStyle = "#FF4D00";
      cardCtx.beginPath();
      cardCtx.arc(472, 47, 3.5, 0, Math.PI * 2);
      cardCtx.fill();
      cardCtx.restore();

      // Name Header: Single clean line "MUHAMAD DIKRULLOH"
      // "MUHAMAD" in light weight (300), "DIKRULLOH" in bold (800)
      const nameY = 104;
      cardCtx.font = "300 27px 'Big Shoulders Display', sans-serif";
      const muhamadWidth = cardCtx.measureText("MUHAMAD ").width;
      cardCtx.fillStyle = "rgba(243, 242, 237, 0.68)";
      cardCtx.fillText("MUHAMAD ", 36, nameY);

      cardCtx.font = "800 27px 'Big Shoulders Display', sans-serif";
      cardCtx.fillStyle = "#f3f2ed";
      cardCtx.fillText("DIKRULLOH", 36 + muhamadWidth, nameY);

      // Subtle accent line under name with signature orange micro-dash
      cardCtx.fillStyle = "#FF4D00";
      cardCtx.fillRect(36, nameY + 12, 16, 1.5);
      cardCtx.fillStyle = "rgba(243, 242, 237, 0.08)";
      cardCtx.fillRect(56, nameY + 12, 420, 1);

      // Photo (Pure Crisp Black & White Photography, Premium Framing)
      const photoX = 36;
      const photoY = 138;
      const photoW = 440;
      const photoH = 430;

      // Draw photo container background & content
      cardCtx.save();
      cardCtx.beginPath();
      cardCtx.roundRect(photoX, photoY, photoW, photoH, 12);
      cardCtx.clip();

      if (hasPhoto) {
        cardCtx.drawImage(bwPhotoCanvas, photoX, photoY, photoW, photoH);
      } else {
        cardCtx.fillStyle = "#090a0d";
        cardCtx.fillRect(photoX, photoY, photoW, photoH);
      }

      // Subtle semi-matte sheen overlay across photo surface
      const sheenGrad = cardCtx.createLinearGradient(photoX, photoY, photoX + photoW, photoY + photoH);
      sheenGrad.addColorStop(0, "rgba(243, 242, 237, 0.025)");
      sheenGrad.addColorStop(0.35, "transparent");
      sheenGrad.addColorStop(0.7, "transparent");
      sheenGrad.addColorStop(1, "rgba(0, 0, 0, 0.35)");
      cardCtx.fillStyle = sheenGrad;
      cardCtx.fillRect(photoX, photoY, photoW, photoH);

      // Subtle inner rim glow / vignette
      const innerVignette = cardCtx.createRadialGradient(
        photoX + photoW * 0.5, photoY + photoH * 0.45, photoW * 0.3,
        photoX + photoW * 0.5, photoY + photoH * 0.5, photoW * 0.65,
      );
      innerVignette.addColorStop(0, "transparent");
      innerVignette.addColorStop(1, "rgba(5, 6, 8, 0.40)");
      cardCtx.fillStyle = innerVignette;
      cardCtx.fillRect(photoX, photoY, photoW, photoH);

      cardCtx.restore(); // restore photo clip

      // Refined Outer Photo Frame Border (delicate, crisp hairline)
      cardCtx.strokeStyle = "rgba(243, 242, 237, 0.12)";
      cardCtx.lineWidth = 1;
      cardCtx.beginPath();
      cardCtx.roundRect(photoX, photoY, photoW, photoH, 12);
      cardCtx.stroke();

      // Subtle secondary inner hairline for depth
      cardCtx.strokeStyle = "rgba(243, 242, 237, 0.035)";
      cardCtx.lineWidth = 0.8;
      cardCtx.beginPath();
      cardCtx.roundRect(photoX + 2, photoY + 2, photoW - 4, photoH - 4, 10);
      cardCtx.stroke();

      // Corner technical tick marks on photo frame
      const cornerTicks = [
        [photoX - 4, photoY, photoX + 6, photoY],
        [photoX, photoY - 4, photoX, photoY + 6],
        [photoX + photoW - 6, photoY, photoX + photoW + 4, photoY],
        [photoX + photoW, photoY - 4, photoX + photoW, photoY + 6],
        [photoX - 4, photoY + photoH, photoX + 6, photoY + photoH],
        [photoX, photoY + photoH - 6, photoX, photoY + photoH + 4],
        [photoX + photoW - 6, photoY + photoH, photoX + photoW + 4, photoY + photoH],
        [photoX + photoW, photoY + photoH - 6, photoX + photoW, photoY + photoH + 4],
      ];
      cardCtx.strokeStyle = "rgba(243, 242, 237, 0.22)";
      cardCtx.lineWidth = 1;
      cornerTicks.forEach(([x1, y1, x2, y2]) => {
        cardCtx.beginPath();
        cardCtx.moveTo(x1, y1);
        cardCtx.lineTo(x2, y2);
        cardCtx.stroke();
      });

      // Bottom Area: Clean Technical Elements
      // Barcode bars (refined, crisp, compact)
      const barX = 36;
      const barY = 598;
      const barH = 36;
      const pattern = [3, 2, 4, 2, 6, 2, 2, 4, 3, 2, 5, 2, 7, 3, 2, 2, 4, 2, 5, 3, 3, 6, 2, 4, 3, 5, 2, 2, 4, 2, 6];
      let curX = barX;
      cardCtx.fillStyle = "rgba(243, 242, 237, 0.85)";
      pattern.forEach((w, i) => {
        if (i % 2 === 0) {
          cardCtx.fillRect(curX, barY, w * 1.3, barH);
        }
        curX += w * 1.7;
      });

      // Technical Serial & Fine Spec Details on Right
      cardCtx.strokeStyle = "rgba(243, 242, 237, 0.08)";
      cardCtx.lineWidth = 1;
      cardCtx.beginPath();
      cardCtx.moveTo(270, barY + 18);
      cardCtx.lineTo(440, barY + 18);
      cardCtx.stroke();

      cardCtx.fillStyle = "rgba(243, 242, 237, 0.40)";
      cardCtx.font = "8.5px monospace";
      cardCtx.textAlign = "right";
      cardCtx.fillText("SYS // 2026", 476, barY + 14);
      cardCtx.fillStyle = "rgba(243, 242, 237, 0.25)";
      cardCtx.fillText("42-MD-09", 476, barY + 28);
      cardCtx.textAlign = "left";

      // Subtle registration cross on bottom-right
      cardCtx.strokeStyle = "rgba(243, 242, 237, 0.16)";
      cardCtx.beginPath();
      cardCtx.moveTo(270, barY + 12);
      cardCtx.lineTo(270, barY + 24);
      cardCtx.stroke();

      cardCtx.restore(); // restore FRONT SIDE

      // =========================================================================
      // BACK SIDE (512..1024, 0..cardH) - Technical Isometric Wireframe Schematic
      // =========================================================================
      cardCtx.save();
      cardCtx.beginPath();
      cardCtx.rect(512, 0, 512, cardH);
      cardCtx.clip();
      cardCtx.fillStyle = "#0c0d10";
      cardCtx.fillRect(512, 0, 512, cardH);

      // Topographic waves on back side too
      drawTopographicWaves(cardCtx, 512);

      cardCtx.strokeStyle = "rgba(243, 242, 237, 0.18)";
      cardCtx.lineWidth = 2.5;
      cardCtx.strokeRect(520, 8, 496, cardH - 16);

      cardCtx.strokeStyle = "rgba(243, 242, 237, 0.06)";
      cardCtx.lineWidth = 1;
      cardCtx.strokeRect(526, 14, 484, cardH - 28);

      // 1. Magnetic Stripe across top
      const magGrad = cardCtx.createLinearGradient(526, 26, 1010, 72);
      magGrad.addColorStop(0, "#191a20");
      magGrad.addColorStop(0.5, "#24252d");
      magGrad.addColorStop(1, "#15161b");
      cardCtx.fillStyle = magGrad;
      cardCtx.fillRect(526, 26, 484, 44);

      cardCtx.fillStyle = "#f3f2ed";
      cardCtx.font = "bold 34px 'Big Shoulders Display', sans-serif";
      cardCtx.fillText("MD.", 912, 120);

      // 3. Blueprint Coordinate Grid
      cardCtx.strokeStyle = "rgba(243, 242, 237, 0.035)";
      cardCtx.lineWidth = 1;
      for (let gx = 548; gx <= 988; gx += 22) {
        cardCtx.beginPath();
        cardCtx.moveTo(gx, 168);
        cardCtx.lineTo(gx, 490);
        cardCtx.stroke();
      }
      for (let gy = 168; gy <= 490; gy += 22) {
        cardCtx.beginPath();
        cardCtx.moveTo(548, gy);
        cardCtx.lineTo(988, gy);
        cardCtx.stroke();
      }

      // 4. Central Isometric Wireframe Polyhedron
      const cx = 512 + 256;
      const cy = 320;

      cardCtx.save();
      cardCtx.translate(cx, cy);

      const iso = (x: number, y: number, z: number): [number, number] => {
        const cos30 = Math.cos(Math.PI / 6);
        const sin30 = Math.sin(Math.PI / 6);
        return [(x - z) * cos30, y + (x + z) * sin30];
      };

      const S = 82;
      const vertices: [number, number][] = [
        iso(-S, -S, -S), iso(S, -S, -S), iso(S, S, -S), iso(-S, S, -S),
        iso(-S, -S, S),  iso(S, -S, S),  iso(S, S, S),  iso(-S, S, S),
        iso(0, -S * 1.5, 0), iso(0, S * 1.5, 0),
        iso(-S * 1.35, 0, 0), iso(S * 1.35, 0, 0),
        iso(0, 0, -S * 1.35), iso(0, 0, S * 1.35),
      ];

      const edges = [
        [0,1], [1,2], [2,3], [3,0],
        [4,5], [5,6], [6,7], [7,4],
        [0,4], [1,5], [2,6], [3,7],
        [0,6], [1,7], [2,4], [3,5],
        [8,0], [8,1], [8,4], [8,5],
        [9,2], [9,3], [9,6], [9,7],
        [10,0], [10,3], [10,4], [10,7],
        [11,1], [11,2], [11,5], [11,6],
        [12,0], [12,1], [12,2], [12,3],
        [13,4], [13,5], [13,6], [13,7],
      ];

      // Wireframe Edges
      cardCtx.strokeStyle = "rgba(243, 242, 237, 0.32)";
      cardCtx.lineWidth = 1.3;
      edges.forEach(([i, j]) => {
        cardCtx.beginPath();
        cardCtx.moveTo(vertices[i][0], vertices[i][1]);
        cardCtx.lineTo(vertices[j][0], vertices[j][1]);
        cardCtx.stroke();
      });

      // Radar Rings
      cardCtx.strokeStyle = "rgba(255, 77, 0, 0.45)";
      cardCtx.lineWidth = 1;
      cardCtx.setLineDash([4, 6]);
      cardCtx.beginPath();
      cardCtx.arc(0, 0, 130, 0, Math.PI * 2);
      cardCtx.stroke();

      cardCtx.strokeStyle = "rgba(243, 242, 237, 0.15)";
      cardCtx.beginPath();
      cardCtx.arc(0, 0, 95, 0, Math.PI * 2);
      cardCtx.stroke();
      cardCtx.setLineDash([]);

      // Crosshairs
      cardCtx.strokeStyle = "rgba(255, 77, 0, 0.65)";
      cardCtx.lineWidth = 1.4;
      cardCtx.beginPath();
      cardCtx.moveTo(-145, 0); cardCtx.lineTo(-125, 0);
      cardCtx.moveTo(125, 0);  cardCtx.lineTo(145, 0);
      cardCtx.moveTo(0, -145); cardCtx.lineTo(0, -125);
      cardCtx.moveTo(0, 125);  cardCtx.lineTo(0, 145);
      cardCtx.stroke();

      // Vertex Nodes
      vertices.forEach(([vx, vy], idx) => {
        cardCtx.fillStyle = idx === 8 || idx === 9 ? "#FF4D00" : "#f3f2ed";
        cardCtx.beginPath();
        cardCtx.arc(vx, vy, 2.8, 0, Math.PI * 2);
        cardCtx.fill();
      });

      // Center Node
      cardCtx.fillStyle = "#FF4D00";
      cardCtx.beginPath();
      cardCtx.arc(0, 0, 4, 0, Math.PI * 2);
      cardCtx.fill();

      cardCtx.restore(); // restore polyhedron translate

      // Wireframe Annotations
      cardCtx.fillStyle = "rgba(243, 242, 237, 0.6)";
      cardCtx.font = "9px monospace";


      // Section Divider Line
      cardCtx.strokeStyle = "rgba(243, 242, 237, 0.16)";
      cardCtx.lineWidth = 1;
      cardCtx.beginPath();
      cardCtx.moveTo(548, 514);
      cardCtx.lineTo(988, 514);
      cardCtx.stroke();

      // 5. Developer Credentials Table
      const rows = [
        { label: "EMAIL", val: "muhamaddikrulloh@gmail.com" },
      ];

      rows.forEach((r, idx) => {
        const ry = 538 + idx * 26;
        cardCtx.fillStyle = "rgba(243, 242, 237, 0.45)";
        cardCtx.font = "bold 9px monospace";
        cardCtx.fillText(r.label, 548, ry);

        cardCtx.fillStyle = "#f3f2ed";
        cardCtx.font = "bold 10px monospace";
        cardCtx.fillText(r.val, 626, ry);

        if (idx < rows.length - 1) {
          cardCtx.strokeStyle = "rgba(243, 242, 237, 0.06)";
          cardCtx.beginPath();
          cardCtx.moveTo(548, ry + 8);
          cardCtx.lineTo(988, ry + 8);
          cardCtx.stroke();
        }
      });

      // 6. DataMatrix 2D Matrix Block
      const qrX = 932;
      const qrY = 638;
      const qrS = 52;
      cardCtx.fillStyle = "rgba(243, 242, 237, 0.08)";
      cardCtx.fillRect(qrX, qrY, qrS, qrS);
      cardCtx.strokeStyle = "rgba(243, 242, 237, 0.22)";
      cardCtx.strokeRect(qrX, qrY, qrS, qrS);

      // Matrix cells simulation
      cardCtx.fillStyle = "#f3f2ed";
      const qrPattern = [
        [1,1,1,1,0,1,1],
        [1,0,0,1,0,0,1],
        [1,0,1,0,1,0,1],
        [1,1,0,1,0,1,1],
        [0,0,1,0,1,0,0],
        [1,0,0,1,0,1,1],
        [1,1,1,0,1,1,1],
      ];
      const cellSize = qrS / 7;
      qrPattern.forEach((row, ri) => {
        row.forEach((cell, ci) => {
          if (cell) {
            cardCtx.fillRect(qrX + ci * cellSize + 1, qrY + ri * cellSize + 1, cellSize - 2, cellSize - 2);
          }
        });
      });

      // 7. Micro-tick calibration ruler along bottom
      cardCtx.strokeStyle = "rgba(243, 242, 237, 0.25)";
      cardCtx.lineWidth = 1;
      for (let bx = 548; bx <= 900; bx += 11) {
        const tickH = (bx - 548) % 55 === 0 ? 8 : 4;
        cardCtx.beginPath();
        cardCtx.moveTo(bx, 672);
        cardCtx.lineTo(bx, 672 + tickH);
        cardCtx.stroke();
      }

      cardCtx.fillStyle = "#FF4D00";
      cardCtx.font = "bold 9px monospace";


      cardCtx.restore(); // restore BACK SIDE
      cardCtx.restore(); // restore root drawCardTexture save
    }

    let textureTimer = 0;
    const scheduleCardTexture = () => {
      if (disposed || textureTimer) return;
      textureTimer = window.setTimeout(() => {
        textureTimer = 0;
        if (disposed) return;
        drawCardTexture();
        cardTexture.needsUpdate = true;
      }, 0);
    };
    scheduleCardTexture();
    redrawCardRef.current = scheduleCardTexture;
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        if (disposed) return;
        scheduleCardTexture();
      });
    }

    let processedPhoto: HTMLImageElement | null = null;
    const processPhoto = (img: HTMLImageElement) => {
      if (disposed || processedPhoto === img) return;
      processedPhoto = img;
      try {
        const photoW = 440;
        const photoH = 430;
        bwPhotoCanvas.width = photoW;
        bwPhotoCanvas.height = photoH;
        const pCtx = bwPhotoCanvas.getContext("2d", { willReadFrequently: true });
        if (!pCtx) return;

        // Fill deep clean dark base (#08090b) so portrait edges blend into card surface
        const bgR = 8;
        const bgG = 9;
        const bgB = 11;
        pCtx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
        pCtx.fillRect(0, 0, photoW, photoH);

        // Scale portrait to 86% of box height: prominent, clean framing
        const scale = 0.86;
        const targetH = Math.round(photoH * scale);
        const naturalW = img.naturalWidth || 640;
        const naturalH = img.naturalHeight || 632;
        const targetW = Math.round((naturalW / naturalH) * targetH);
        const targetX = Math.round((photoW - targetW) / 2);
        const targetY = photoH - targetH;

        pCtx.drawImage(img, 0, 0, naturalW, naturalH, targetX, targetY, targetW, targetH);

        // Refined portrait grade: controlled face highlights, smooth subtle contrast,
        // clean separation from darker backdrop so subject pops cleanly without glare.
        const imgData = pCtx.getImageData(0, 0, photoW, photoH);
        const d = imgData.data;

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
          const rawLuma = 0.299 * r + 0.587 * g + 0.114 * b;
          const norm = Math.max(0, Math.min(1, rawLuma / 255));

          // Subtle S-curve for refined contrast: firm shadows, rich midtones, subdued highlights
          let shaped: number;
          if (norm < 0.45) {
            shaped = 0.45 * Math.pow(norm / 0.45, 1.35); // crisp defined shadows & jawline
          } else {
            shaped = 0.45 + 0.55 * Math.pow((norm - 0.45) / 0.55, 0.85); // smooth highlights
          }

          // Dynamic range: black base 10 -> highlight cap 120 (velvety, no glare)
          const luma = 10 + shaped * 110;

          // Seamless edge alpha blending with #08090b backdrop
          const alphaFrac = a / 255;
          d[i] = Math.round(luma * alphaFrac + bgR * (1 - alphaFrac));
          d[i + 1] = Math.round(luma * alphaFrac + bgG * (1 - alphaFrac));
          d[i + 2] = Math.round(luma * alphaFrac + bgB * (1 - alphaFrac));
          d[i + 3] = 255;
        }
        pCtx.putImageData(imgData, 0, 0);

        hasPhoto = true;
        scheduleCardTexture();
      } catch (err) {
        console.error("Failed to process badge photo:", err);
      }
    };

    const photoImg = new Image();
    let fallbackPhoto: HTMLImageElement | null = null;
    photoImg.onload = () => processPhoto(photoImg);
    photoImg.onerror = () => {
      if (disposed) return;
      const fallback = new Image();
      fallbackPhoto = fallback;
      fallback.onload = () => processPhoto(fallback);
      fallback.src = "/portrait.png";
    };
    photoImg.src = "/portrait-hero-640.webp";
    if (photoImg.complete && photoImg.naturalWidth) {
      processPhoto(photoImg);
    }

    // Lanyard Strap Canvas Texture with Boxed MD. Monogram Logo
    const strapCanvas = document.createElement("canvas");
    strapCanvas.width = 512;
    strapCanvas.height = 64;
    const strapCtx = strapCanvas.getContext("2d")!;
    strapCtx.fillStyle = "#0c0d10";
    strapCtx.fillRect(0, 0, 512, 64);

    // Edge stitching
    strapCtx.fillStyle = "rgba(243, 242, 237, 0.22)";
    strapCtx.fillRect(0, 0, 512, 2.5);
    strapCtx.fillRect(0, 61.5, 512, 2.5);

    // Fine woven weave texture
    strapCtx.fillStyle = "rgba(255, 255, 255, 0.02)";
    for (let x = 0; x < 512; x += 4) {
      strapCtx.fillRect(x, 3, 2, 58);
    }

    // Repeated [MD.] Logo and Branding along strap
    const segmentW = 128;
    for (let i = 0; i < 4; i++) {
      const startX = i * segmentW;

      // Box outline for MD. monogram logo
      strapCtx.strokeStyle = "rgba(243, 242, 237, 0.85)";
      strapCtx.lineWidth = 1.8;
      strapCtx.strokeRect(startX + 12, 16, 32, 32);

      // MD. monogram text
      strapCtx.fillStyle = "#f3f2ed";
      strapCtx.font = "bold 20px 'Big Shoulders Display', sans-serif";
      strapCtx.textAlign = "center";
      strapCtx.textBaseline = "middle";
      strapCtx.fillText("MD.", startX + 28, 33);

      // Signature orange accent dot (#FF4D00)
      strapCtx.fillStyle = "#FF4D00";
      strapCtx.beginPath();
      strapCtx.arc(startX + 58, 32, 2.8, 0, Math.PI * 2);
      strapCtx.fill();

      // Text label
      strapCtx.fillStyle = "rgba(243, 242, 237, 0.65)";
      strapCtx.font = "bold 10px monospace";
      strapCtx.textAlign = "left";
      strapCtx.fillText("DIKRULLOH", startX + 68, 35);
    }

    const strapTexture = new THREE.CanvasTexture(strapCanvas);
    strapTexture.wrapS = THREE.RepeatWrapping;
    strapTexture.wrapT = THREE.RepeatWrapping;
    strapTexture.repeat.set(1, 5.5);
    strapTexture.colorSpace = THREE.SRGBColorSpace;

    // Materials
    const cardMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: cardTexture,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      roughness: 0.72,
      metalness: 0.18,
      side: THREE.DoubleSide,
    });

    const clipMat = new THREE.MeshStandardMaterial({
      color: 0x909094,
      roughness: 0.25,
      metalness: 0.88,
    });

    // 3D Card Group
    const cardGroup = new THREE.Group();
    scene.add(cardGroup);

    let shadersReady = false;
    const prepareShaders = () => {
      renderer.compileAsync(scene, camera).catch(() => {}).then(() => {
        if (!disposed) shadersReady = true;
      });
    };

    // Load GLTF model
    const loader = new GLTFLoader();
    loader.load(
      "/badge.glb",
      gltf => {
        for (const loadedScene of gltf.scenes) {
          loadedScene.traverse(obj => {
            const mesh = obj as THREE.Mesh;
            if (!mesh.isMesh) return;
            modelGeometries.add(mesh.geometry);
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const material of materials) {
              modelMaterials.add(material);
              for (const value of Object.values(material)) {
                if (value instanceof THREE.Texture) modelTextures.add(value);
              }
            }
          });
        }
        if (disposed) {
          disposeModelResources();
          return;
        }
        const meshes: { card: THREE.Mesh | null; clip: THREE.Mesh | null; clamp: THREE.Mesh | null } = {
          card: null,
          clip: null,
          clamp: null,
        };

        gltf.scene.traverse(obj => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) {
            if (mesh.name === "card") meshes.card = mesh;
            else if (mesh.name === "clip") meshes.clip = mesh;
            else if (mesh.name === "clamp") meshes.clamp = mesh;
          }
        });

        if (meshes.card && meshes.clip && meshes.clamp) {
          cardSolid = meshes.card;
          meshes.card.material = cardMat;
          meshes.clip.material = clipMat;
          meshes.clamp.material = clipMat;

          // Zero out raw GLB translation offsets so all parts align perfectly at (0, 0, 0)
          meshes.card.position.set(0, 0, 0);
          meshes.clip.position.set(0, 0, 0);
          meshes.clamp.position.set(0, 0, 0);
          meshes.card.rotation.set(0, 0, 0);
          meshes.clip.rotation.set(0, 0, 0);
          meshes.clamp.rotation.set(0, 0, 0);

          const modelGroup = new THREE.Group();
          model = modelGroup;
          modelGroup.scale.setScalar(badgeScale);
          // Center the card around Y = 0 in cardGroup (card center in model is Y ~0.523)
          modelGroup.position.set(0, -0.522857 * badgeScale, 0);
          modelGroup.add(meshes.card, meshes.clip, meshes.clamp);
          cardGroup.add(modelGroup);
          prepareShaders();
        } else {
          createFallbackBadge();
        }
      },
      undefined,
      () => createFallbackBadge(),
    );

    function createFallbackBadge() {
      if (disposed) return;
      const geom = new THREE.BoxGeometry(2.4 * (badgeScale / 2.45), 3.6 * (badgeScale / 2.45), 0.06);
      const uv = geom.getAttribute("uv");
      for (const group of geom.groups) {
        const face = group.materialIndex;
        group.materialIndex = face === 4 || face === 5 ? 1 : 0;
        if (face !== 4 && face !== 5) continue;
        const firstVertex = face * 4;
        for (let vertex = firstVertex; vertex < firstVertex + 4; vertex++) {
          uv.setXY(vertex, uv.getX(vertex) * 0.5 + (face === 5 ? 0.5 : 0), (1 - uv.getY(vertex)) * UV_ASPECT);
        }
      }
      const mesh = new THREE.Mesh(geom, [clipMat, cardMat]);
      cardSolid = mesh;

      const clipGeom = new THREE.TorusGeometry(0.18 * (badgeScale / 2.15), 0.03 * (badgeScale / 2.15), 8, 24);
      modelGeometries.add(geom);
      modelGeometries.add(clipGeom);
      const clipMesh = new THREE.Mesh(clipGeom, clipMat);
      clipMesh.position.set(0, attachOffsetY - 0.18, 0);
      cardGroup.add(mesh, clipMesh);
      prepareShaders();
    }

    // Dynamic Quad Strip Ribbon for Lanyard Strap
    const RIBBON_SEGS = 28;
    const ribbonGeom = new THREE.BufferGeometry();
    const ribbonPositions = new Float32Array(RIBBON_SEGS * 2 * 3);
    const ribbonUvs = new Float32Array(RIBBON_SEGS * 2 * 2);
    const ribbonIndices: number[] = [];

    for (let i = 0; i < RIBBON_SEGS - 1; i++) {
      const a = i * 2;
      const b = a + 1;
      const c = (i + 1) * 2;
      const d = c + 1;
      ribbonIndices.push(a, b, c, b, d, c);
    }

    for (let i = 0; i < RIBBON_SEGS; i++) {
      const v = i / (RIBBON_SEGS - 1);
      ribbonUvs[i * 4] = 0;
      ribbonUvs[i * 4 + 1] = v * 14;
      ribbonUvs[i * 4 + 2] = 1;
      ribbonUvs[i * 4 + 3] = v * 14;
    }

    ribbonGeom.setAttribute("position", new THREE.BufferAttribute(ribbonPositions, 3));
    ribbonGeom.setAttribute("uv", new THREE.BufferAttribute(ribbonUvs, 2));
    ribbonGeom.setIndex(ribbonIndices);

    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: strapTexture,
      roughness: 0.85,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const ribbonFade = new Float32Array(RIBBON_SEGS * 2);
    for (let index = 0; index < RIBBON_SEGS; index++) {
      const opacity = THREE.MathUtils.smoothstep(index / (RIBBON_SEGS - 1), 0, 0.1);
      ribbonFade[index * 2] = opacity;
      ribbonFade[index * 2 + 1] = opacity;
    }
    ribbonGeom.setAttribute("strapOpacity", new THREE.BufferAttribute(ribbonFade, 1));
    ribbonMat.transparent = true;
    ribbonMat.depthWrite = false;
    ribbonMat.onBeforeCompile = shader => {
      shader.vertexShader = "attribute float strapOpacity; varying float vStrapOpacity;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvStrapOpacity = strapOpacity;");
      shader.fragmentShader = "varying float vStrapOpacity;\n" + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace("#include <alphamap_fragment>", "#include <alphamap_fragment>\ndiffuseColor.a *= vStrapOpacity;");
    };
    const ribbonMesh = new THREE.Mesh(ribbonGeom, ribbonMat);
    scene.add(ribbonMesh);

    // =========================================================================
    // PHYSICS INITIALIZATION (Verlet Integration & Distance Constraints)
    // Anchor aligned precisely to top divider of Contact section
    const vFovRad = (camera.fov * Math.PI) / 180;
    const halfHeight = Math.tan(vFovRad / 2) * camera.position.z;
    const halfWidth = halfHeight * camera.aspect;
    const worldTop = camera.position.y + halfHeight;

    const computePlacement = (w: number, h: number, curHalfH: number, curHalfW: number, curTopY: number) => {
      const slotEl = document.querySelector(".contact-card-slot");
      if (slotEl && container) {
        const slotRect = slotEl.getBoundingClientRect();
        const secRect = container.getBoundingClientRect();
        const pxX = slotRect.left + slotRect.width / 2 - secRect.left;
        const nX = (pxX / w) * 2 - 1;

        if (w < 768) {
          // Mobile: slot is below contact info. Anchor hangs from slot's top divider
          const slotTopPxY = slotRect.top - secRect.top;
          const pxY = slotRect.top + slotRect.height * 0.62 - secRect.top;
          const slotTopNdcY = -((slotTopPxY / h) * 2 - 1);
          const nY = -((pxY / h) * 2 - 1);
          return {
            anchorX: nX * curHalfW,
            anchorY: camera.position.y + slotTopNdcY * curHalfH,
            cardX: nX * curHalfW,
            cardY: camera.position.y + nY * curHalfH,
          };
        } else {
          // Desktop & Tablet (>= 768px): 2-column layout. Lanyard hangs from section's top divider
          const pxY = slotRect.top + slotRect.height * (w >= 1024 ? 0.60 : 0.57) - secRect.top;
          const nY = -((pxY / h) * 2 - 1);
          return {
            anchorX: nX * curHalfW,
            anchorY: curTopY,
            cardX: nX * curHalfW,
            cardY: camera.position.y + nY * curHalfH,
          };
        }
      }
      return {
        anchorX: w >= 768 ? curHalfW * 0.52 : 0,
        anchorY: curTopY,
        cardX: w >= 768 ? curHalfW * 0.52 : 0,
        cardY: camera.position.y + (w >= 768 ? -curHalfH * 0.14 : -curHalfH * 0.42),
      };
    };

    const targetPos = computePlacement(width, height, halfHeight, halfWidth, worldTop);
    const anchor = new THREE.Vector3(targetPos.anchorX, targetPos.anchorY, 0);
    let initialCardX = targetPos.cardX;
    let initialCardY = targetPos.cardY;
    const joints = Array.from({ length: NUM_JOINTS }, () => ({ pos: new THREE.Vector3(), prev: new THREE.Vector3() }));
    const card = {
      pos: new THREE.Vector3(initialCardX, initialCardY, 0),
      prev: new THREE.Vector3(initialCardX, initialCardY, 0),
      rot: new THREE.Euler(),
    };
    const rotVel = new THREE.Vector3();
    const flip = { angle: 0 };
    let crossedBoundary = false;
    let flipTimeline: gsap.core.Timeline | undefined;
    const projectedCorner = new THREE.Vector3();
    const badgeBounds = new THREE.Box3();
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let segmentLength = 0.1;
    const resetPhysics = () => {
      segmentLength = Math.max(0.1, (anchor.y - initialCardY - attachOffsetY) / NUM_JOINTS);
      joints.forEach((joint, index) => {
        joint.pos.set(anchor.x, anchor.y - segmentLength * (index + 1), 0);
        joint.prev.copy(joint.pos);
      });
      card.pos.set(initialCardX, initialCardY, 0);
      card.prev.copy(card.pos);
      card.rot.set(0, 0, 0);
      rotVel.set(0, 0, 0);
      cardGroup.position.copy(card.pos);
      cardGroup.quaternion.identity();
    };
    resetPhysics();
    // Pointer Dragging State
    const pointer = {
      isDown: false,
      id: -1,
      clientX: 0,
      clientY: 0,
      target3D: new THREE.Vector3(initialCardX, initialCardY, 0),
      dragOffset: new THREE.Vector3(0, 0, 0),
      plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
      raycaster: new THREE.Raycaster(),
    };

    const updatePointer3D = (clientX: number, clientY: number) => {
      pointer.clientX = clientX;
      pointer.clientY = clientY;
      const rect = targetCanvas.getBoundingClientRect();
      const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);
      pointer.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
      pointer.raycaster.ray.intersectPlane(pointer.plane, pointer.target3D);
    };

    const isPointerOverCard = (clientX: number, clientY: number): boolean => {
      updatePointer3D(clientX, clientY);
      if (!cardGroup.children.length) return false;
      const hits = pointer.raycaster.intersectObjects(cardGroup.children, true);
      return hits.length > 0;
    };

    // Only drag when directly touching the card mesh. Outside clicks NEVER hook/drag.
    const onWindowPointerDown = (e: PointerEvent) => {
      if (!inViewport || pausedRef.current || document.hidden || pointer.isDown || (e.button !== 0 && e.pointerType === "mouse")) return;
      const rect = targetCanvas.getBoundingClientRect();
      if (e.clientY < rect.top || e.clientY > rect.bottom || e.clientX < rect.left || e.clientX > rect.right) return;
      if (isPointerOverCard(e.clientX, e.clientY)) {
        if (e.cancelable && e.pointerType === "touch") {
          e.preventDefault();
        }
        flipTimeline?.kill();
        crossedBoundary = false;
        pointer.isDown = true;
        updatePointer3D(e.clientX, e.clientY);
        pointer.dragOffset.copy(card.pos).sub(pointer.target3D);
        pointer.id = e.pointerId;
        card.prev.copy(card.pos);
        targetCanvas.style.pointerEvents = "auto";
        try {
          targetCanvas.setPointerCapture(e.pointerId);
        } catch {}
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!inViewport || pausedRef.current || document.hidden || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const rect = targetCanvas.getBoundingClientRect();
      if (touch.clientY < rect.top || touch.clientY > rect.bottom || touch.clientX < rect.left || touch.clientX > rect.right) return;
      if (isPointerOverCard(touch.clientX, touch.clientY)) {
        if (e.cancelable) e.preventDefault();
        flipTimeline?.kill();
        crossedBoundary = false;
        pointer.isDown = true;
        updatePointer3D(touch.clientX, touch.clientY);
        pointer.dragOffset.copy(card.pos).sub(pointer.target3D);
        pointer.id = touch.identifier;
        card.prev.copy(card.pos);
        targetCanvas.style.pointerEvents = "auto";
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pointer.isDown) return;
      const touch = Array.from(e.touches).find(t => t.identifier === pointer.id) || e.touches[0];
      if (touch) {
        if (e.cancelable) e.preventDefault();
        updatePointer3D(touch.clientX, touch.clientY);
      }
    };

    const onTouchEnd = () => {
      if (pointer.isDown) {
        pointer.isDown = false;
        if (crossedBoundary && !reducedMotion.matches) {
          if (Math.abs(flip.angle) >= Math.PI / 2) {
            flipTimeline = gsap.timeline()
              .to(flip, { angle: 0, duration: 0.9, delay: 0.25, ease: "back.out(1.3)" });
          } else {
            flipTimeline = gsap.timeline()
              .to(flip, { angle: Math.PI, duration: 0.6, ease: "power2.inOut" })
              .to(flip, { angle: 0, duration: 0.9, delay: 0.5, ease: "back.out(1.3)" });
          }
        } else if (Math.abs(flip.angle) > 0.001 && !reducedMotion.matches) {
          flipTimeline = gsap.timeline()
            .to(flip, { angle: 0, duration: 0.9, delay: 0.35, ease: "back.out(1.3)" });
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!inViewport || pausedRef.current || document.hidden) return;
      if (pointer.isDown) {
        updatePointer3D(e.clientX, e.clientY);

      } else {
        const overCard = isPointerOverCard(e.clientX, e.clientY);
        targetCanvas.style.pointerEvents = overCard ? "auto" : "none";
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pointer.isDown) {
        pointer.isDown = false;
        try {
          targetCanvas.releasePointerCapture(e.pointerId);
        } catch {}
        if (crossedBoundary && e.type !== "pointercancel" && !reducedMotion.matches) {
          if (Math.abs(flip.angle) >= Math.PI / 2) {
            flipTimeline = gsap.timeline()
              .to(flip, { angle: 0, duration: 0.9, delay: 0.25, ease: "back.out(1.3)" });
          } else {
            flipTimeline = gsap.timeline()
              .to(flip, { angle: Math.PI, duration: 0.6, ease: "power2.inOut" })
              .to(flip, { angle: 0, duration: 0.9, delay: 0.5, ease: "back.out(1.3)" });
          }
        } else if (Math.abs(flip.angle) > 0.001 && !reducedMotion.matches) {
          flipTimeline = gsap.timeline()
            .to(flip, { angle: 0, duration: 0.9, delay: 0.35, ease: "back.out(1.3)" });
        }
      }
      if (!inViewport || pausedRef.current || document.hidden) {
        targetCanvas.style.pointerEvents = "none";
        return;
      }
      const overCard = isPointerOverCard(e.clientX, e.clientY);
      targetCanvas.style.pointerEvents = overCard ? "auto" : "none";
    };

    window.addEventListener("pointerdown", onWindowPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: false });
    window.addEventListener("touchcancel", onTouchEnd, { passive: false });

    // Render loop
    let animId = 0;
    let previousFrame = performance.now();
    let accumulatedTime = 0;

    const animate = () => {
      animId = 0;
      if (disposed || !inViewport || document.hidden || pausedRef.current) return;
      if (!shadersReady) {
        previousFrame = performance.now();
        animId = requestAnimationFrame(animate);
        return;
      }
      const now = performance.now();
      const dt = Math.min((now - previousFrame) / 1000, 0.05);
      previousFrame = now;

      if (!pausedRef.current) {
          accumulatedTime += dt;
          while (accumulatedTime >= 1 / 60) {
            const step = 1 / 60;
            if (!reducedMotion.matches || pointer.isDown) {
              for (const joint of joints) {
                const velocity = joint.pos.clone().sub(joint.prev).multiplyScalar(DAMPING);
                joint.prev.copy(joint.pos);
                joint.pos.add(velocity);
                joint.pos.y += GRAVITY * step * step;
              }
              const velocity = card.pos.clone().sub(card.prev).multiplyScalar(DAMPING);
              card.prev.copy(card.pos);
              if (pointer.isDown) {
                updatePointer3D(pointer.clientX, pointer.clientY);
                card.pos.lerp(pointer.target3D.clone().add(pointer.dragOffset), 0.32);
              } else {
                velocity.addScaledVector(new THREE.Vector3(initialCardX, initialCardY, 0).sub(card.pos), 5 * step * step);
                card.pos.add(velocity);
                card.pos.y += GRAVITY * step * step;
              }
              for (let iteration = 0; iteration < 8; iteration++) {
                const delta = joints[0].pos.clone().sub(anchor);
                const length = delta.length();
                if (length > 1e-4) joints[0].pos.copy(anchor).add(delta.multiplyScalar(segmentLength / length));
                for (let index = 0; index < NUM_JOINTS - 1; index++) {
                  const a = joints[index];
                  const b = joints[index + 1];
                  const offset = b.pos.clone().sub(a.pos);
                  const distance = offset.length();
                  if (distance > 1e-4) {
                    offset.multiplyScalar((distance - segmentLength) / distance * 0.48);
                    a.pos.add(offset);
                    b.pos.sub(offset);
                  }
                }
                const last = joints[NUM_JOINTS - 1];
                const attachment = new THREE.Vector3(0, attachOffsetY, 0).applyEuler(card.rot).add(card.pos);
                const offset = attachment.sub(last.pos);
                const distance = offset.length();
                if (distance > 1e-4) {
                  offset.multiplyScalar((distance - segmentLength) / distance);
                  if (pointer.isDown) last.pos.add(offset);
                  else {
                    offset.multiplyScalar(0.42);
                    last.pos.add(offset);
                    card.pos.sub(offset);
                  }
                }
              }
              const hang = card.pos.clone().sub(joints[NUM_JOINTS - 1].pos);
              const targets = new THREE.Vector3(
                THREE.MathUtils.clamp(hang.z * 0.35 + velocity.y * 3.2, -0.5, 0.5),
                THREE.MathUtils.clamp(velocity.x * 8 + (pointer.isDown ? pointer.dragOffset.x * 0.15 : 0), -0.45, 0.45),
                THREE.MathUtils.clamp(-hang.x * 0.42 + (pointer.isDown ? pointer.dragOffset.x * 0.25 : 0), -0.55, 0.55),
              );
              rotVel.x = (rotVel.x + (targets.x - card.rot.x) * 18 * step) * 0.90;
              rotVel.y = (rotVel.y + (targets.y - card.rot.y) * 24 * step) * 0.88;
              rotVel.z = (rotVel.z + (targets.z - card.rot.z) * 22 * step) * 0.91;
              card.rot.x += rotVel.x * step;
              card.rot.y += rotVel.y * step;
              card.rot.z += rotVel.z * step;
            }
            accumulatedTime -= step;
          }
          cardGroup.position.copy(card.pos);
          cardGroup.rotation.set(card.rot.x, card.rot.y + flip.angle, card.rot.z);
          if (pointer.isDown && cardGroup.children.length) {
            badgeBounds.setFromObject(cardGroup);
            for (const y of [badgeBounds.min.y, badgeBounds.max.y]) {
              projectedCorner.set(card.pos.x, y, card.pos.z).project(camera);
              if (Math.abs(projectedCorner.y) > 1) crossedBoundary = true;
            }
          }
          // 5. Update Ribbon Mesh along CatmullRomCurve3
          const cardClipAttach = card.pos.clone().add(
            new THREE.Vector3(0, attachOffsetY, 0).applyQuaternion(cardGroup.quaternion),
          );
          const curvePoints = [
            anchor.clone(),
            ...joints.slice(0, -1).map(j => j.pos.clone()),
            cardClipAttach,
          ];
          const curve = new THREE.CatmullRomCurve3(curvePoints, false, "centripetal");

          const posAttr = ribbonGeom.getAttribute("position") as THREE.BufferAttribute;
          const positions = posAttr.array as Float32Array;

          for (let i = 0; i < RIBBON_SEGS; i++) {
            const t = i / (RIBBON_SEGS - 1);
            const pt = curve.getPointAt(t);
            const tangent = curve.getTangentAt(t);
            const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();

            positions[i * 6] = pt.x - normal.x * (strapWidth * 0.5);
            positions[i * 6 + 1] = pt.y - normal.y * (strapWidth * 0.5);
            positions[i * 6 + 2] = pt.z;

            positions[i * 6 + 3] = pt.x + normal.x * (strapWidth * 0.5);
            positions[i * 6 + 4] = pt.y + normal.y * (strapWidth * 0.5);
            positions[i * 6 + 5] = pt.z;
          }
          if (cardSolid) {
            if (!cardSolid.geometry.boundingBox) cardSolid.geometry.computeBoundingBox();
            cardSolid.updateWorldMatrix(true, false);
            cardGroup.updateWorldMatrix(true, false);
            cardLocalMatrix.copy(cardGroup.matrixWorld).invert().multiply(cardSolid.matrixWorld);
            cardLocalBounds.copy(cardSolid.geometry.boundingBox!).applyMatrix4(cardLocalMatrix);
            constrainBadgeRibbon(positions, cardLocalBounds, cardGroup.matrixWorld, strapWidth);
          }
          posAttr.needsUpdate = true;
          ribbonGeom.computeVertexNormals();

          renderer.render(scene, camera);
          if (model && hasPhoto && !renderer.getContext().isContextLost()) targetCanvas.dataset.ready = "true";
        }

      animId = requestAnimationFrame(animate);
    };

    const syncAnimation = () => {
      if (disposed) return;
      if (!inViewport || document.hidden || pausedRef.current) {
        cancelAnimationFrame(animId);
        animId = 0;
        flipTimeline?.pause();
        return;
      }
      if (animId) return;
      previousFrame = performance.now();
      accumulatedTime = 0;
      flipTimeline?.resume();
      animId = requestAnimationFrame(animate);
    };
    syncAnimationRef.current = syncAnimation;
    document.addEventListener("visibilitychange", syncAnimation);
    const visibilityObserver = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      syncAnimation();
    });
    if (visibilityObserver) visibilityObserver.observe(targetContainer);
    else {
      inViewport = true;
      syncAnimation();
    }

    const onResize = () => {
      width = targetContainer.clientWidth || window.innerWidth;
      height = targetContainer.clientHeight || 760;
      badgeScale = getBadgeScale(width);
      attachOffsetY = 0.70653 * badgeScale;
      strapWidth = 0.165 * (badgeScale / 2.15);
      if (model) {
        model.scale.setScalar(badgeScale);
        model.position.y = -0.522857 * badgeScale;
      }
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);

      const curHalfH = Math.tan(((camera.fov / 2) * Math.PI) / 180) * camera.position.z;
      const curHalfW = curHalfH * camera.aspect;
      const curTopY = camera.position.y + curHalfH;

      const p = computePlacement(width, height, curHalfH, curHalfW, curTopY);
      anchor.x = p.anchorX;
      anchor.y = p.anchorY;
      initialCardX = p.cardX;
      initialCardY = p.cardY;
      segmentLength = Math.max(0.1, (anchor.y - initialCardY - attachOffsetY) / NUM_JOINTS);

      if (pointer.isDown) {
        updatePointer3D(pointer.clientX, pointer.clientY);
        pointer.dragOffset.copy(card.pos).sub(pointer.target3D);
        return;
      }

      resetPhysics();
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(targetContainer);

      return () => {
        disposed = true;
        clearTimeout(textureTimer);
        delete targetCanvas.dataset.ready;
        photoImg.onload = null;
        photoImg.onerror = null;
        if (fallbackPhoto) {
          fallbackPhoto.onload = null;
          fallbackPhoto.onerror = null;
        }
        redrawCardRef.current = null;
        flipTimeline?.kill();
        cancelAnimationFrame(animId);
        syncAnimationRef.current = null;
        document.removeEventListener("visibilitychange", syncAnimation);
        visibilityObserver?.disconnect();
        ro.disconnect();
        targetCanvas.removeEventListener("webglcontextlost", onContextLost);
        window.removeEventListener("pointerdown", onWindowPointerDown);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
        window.removeEventListener("touchcancel", onTouchEnd);
        renderer.dispose();
        disposeModelResources();
        cardTexture.dispose();
        strapTexture.dispose();
        ribbonGeom.dispose();
        ribbonMat.dispose();
        cardMat.dispose();
        clipMat.dispose();
      };
    }

    let cleanup: (() => void) | null = null;
    let initTimer = 0;

    const start = () => {
      if (cleanup || initTimer) return;
      initTimer = (setTimeout(() => {
        initTimer = 0;
        cleanup = initBadge();
      }, 0) as unknown as number);
    };

    start();

    return () => {
      clearTimeout(initTimer);
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="contact-badge-container"
    >
      <canvas
        ref={canvasRef}
        className="contact-badge-canvas"
        role="img"
        aria-label={locale === "id" ? "Kartu identitas 3D interaktif Muhamad Dikrulloh" : "Interactive 3D ID badge of Muhamad Dikrulloh"}
      />
    </div>
  );
}
