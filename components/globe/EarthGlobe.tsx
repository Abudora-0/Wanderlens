"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/lib/hooks";

const ATMOSPHERE_VERT = `
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const ATMOSPHERE_FRAG = `
varying vec3 vNormal;
void main() {
  float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.6);
  gl_FragColor = vec4(0.22, 0.82, 0.74, 1.0) * intensity;
}`;

/**
 * A real 3D Earth: a textured sphere (ocean gradient + the land map), a fresnel
 * atmosphere shell, one key light for the terminator. Drags freely on both axes
 * with inertia, auto-rotates when idle, taps through to /explore. Lazy-loaded so
 * three.js never touches first paint.
 */
export function EarthGlobe() {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let size = mount.clientWidth || 420;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, size);
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.style.touchAction = "none";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.z = 3.15;

    const group = new THREE.Group();
    group.rotation.set(0.35, -0.6, 0);
    scene.add(group);

    // Earth
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0xdfe7f2,
      roughness: 0.92,
      metalness: 0,
    });
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1, 96, 96),
      earthMat,
    );
    group.add(earth);

    // Texture: painted once from the equirectangular land map.
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 2048;
      c.height = 1024;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const grad = ctx.createLinearGradient(0, 0, 0, 1024);
      grad.addColorStop(0, "#0a2a5c");
      grad.addColorStop(0.5, "#1c69c4");
      grad.addColorStop(1, "#0a2a5c");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2048, 1024);
      ctx.drawImage(img, 0, 0, 2048, 1024);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      earthMat.map = tex;
      earthMat.color.set(0xffffff);
      earthMat.needsUpdate = true;
    };
    img.src = "/earth-map.svg";

    // Atmosphere
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.14, 64, 64),
      new THREE.ShaderMaterial({
        vertexShader: ATMOSPHERE_VERT,
        fragmentShader: ATMOSPHERE_FRAG,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
      }),
    );
    scene.add(atmosphere);

    scene.add(new THREE.AmbientLight(0xdfeaff, 0.75));
    const key = new THREE.DirectionalLight(0xfff4e6, 1.5);
    key.position.set(-2.5, 1.2, 2);
    scene.add(key);

    // Interaction
    const state = {
      velX: 0,
      velY: reducedMotion ? 0 : -0.0022,
      dragging: false,
      lastX: 0,
      lastY: 0,
      moved: 0,
      onScreen: true,
    };

    const el = renderer.domElement;
    const onDown = (e: PointerEvent) => {
      state.dragging = true;
      state.lastX = e.clientX;
      state.lastY = e.clientY;
      state.moved = 0;
      el.style.cursor = "grabbing";
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!state.dragging) return;
      const dx = e.clientX - state.lastX;
      const dy = e.clientY - state.lastY;
      state.lastX = e.clientX;
      state.lastY = e.clientY;
      state.moved += Math.abs(dx) + Math.abs(dy);
      state.velY = dx * 0.006;
      state.velX = dy * 0.006;
    };
    const onUp = (e: PointerEvent) => {
      if (state.dragging && state.moved < 6) router.push("/explore");
      state.dragging = false;
      el.style.cursor = "grab";
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // already released
      }
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);

    const resize = () => {
      size = mount.clientWidth || size;
      renderer.setSize(size, size);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const io = new IntersectionObserver(
      ([entry]) => {
        state.onScreen = entry.isIntersecting && !document.hidden;
      },
      { threshold: 0 },
    );
    io.observe(mount);
    const onVis = () => {
      state.onScreen = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (!state.onScreen) return;

      if (!state.dragging) {
        state.velX *= 0.92;
        state.velY *= 0.94;
        if (!reducedMotion && Math.abs(state.velY) < 0.0022) {
          state.velY += (-0.0022 - state.velY) * 0.05;
        }
      }
      group.rotation.y += state.velY;
      group.rotation.x = Math.max(
        -1.15,
        Math.min(1.15, group.rotation.x + state.velX),
      );
      atmosphere.rotation.copy(group.rotation);
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      renderer.dispose();
      earth.geometry.dispose();
      earthMat.dispose();
      earthMat.map?.dispose();
      atmosphere.geometry.dispose();
      (atmosphere.material as THREE.Material).dispose();
      el.remove();
    };
  }, [router, reducedMotion]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[8%] rounded-full"
        style={{ boxShadow: "0 0 90px -10px rgba(52,221,187,0.4)" }}
      />
      <div
        ref={mountRef}
        role="button"
        tabIndex={0}
        aria-label="Open the interactive globe"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") router.push("/explore");
        }}
        className="focus-ring relative h-full w-full select-none rounded-full"
      />
      <p className="pointer-events-none absolute inset-x-0 -bottom-2 text-center text-[10px] uppercase tracking-[0.22em] text-[var(--color-ink-mute)]">
        Drag to spin, tap to open the map
      </p>
    </div>
  );
}
