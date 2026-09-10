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
  float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.2);
  gl_FragColor = vec4(0.2, 0.8, 0.78, 1.0) * clamp(intensity, 0.0, 1.0);
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

    // Phones and low-core devices get a lighter globe: no MSAA, capped pixel
    // ratio, coarser meshes, a smaller texture and a 30fps cap.
    const lowPower =
      window.matchMedia("(max-width: 768px), (pointer: coarse)").matches ||
      (navigator.hardwareConcurrency ?? 8) <= 4;

    let size = mount.clientWidth || 420;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !lowPower,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(
      lowPower ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    renderer.setSize(size, size);
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.style.touchAction = "none";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    // Pulled back so the sphere fills ~74% of the frame and the atmosphere
    // shell has room to bloom instead of being clipped by the canvas edges.
    camera.position.z = 4.35;

    const group = new THREE.Group();
    group.rotation.set(0.35, -0.6, 0);
    scene.add(group);

    // Earth
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0xdfe7f2,
      roughness: 0.92,
      metalness: 0,
    });
    const earthSegments = lowPower ? 56 : 72;
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1, earthSegments, earthSegments),
      earthMat,
    );
    group.add(earth);

    // Texture: painted once from the equirectangular land map.
    const texW = lowPower ? 1536 : 2048;
    const texH = texW / 2;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = texW;
      c.height = texH;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const grad = ctx.createLinearGradient(0, 0, 0, texH);
      grad.addColorStop(0, "#0a2a5c");
      grad.addColorStop(0.5, "#1c69c4");
      grad.addColorStop(1, "#0a2a5c");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, texW, texH);
      ctx.drawImage(img, 0, 0, texW, texH);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
      earthMat.map = tex;
      earthMat.color.set(0xffffff);
      earthMat.needsUpdate = true;
      renderOnce();
    };
    img.src = "/earth-map.svg";

    // Atmosphere
    const atmoSegments = lowPower ? 28 : 48;
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.22, atmoSegments, atmoSegments),
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
      start(); // wake a parked loop
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

    const renderFrame = () => {
      group.rotation.y += state.velY;
      group.rotation.x = Math.max(
        -1.15,
        Math.min(1.15, group.rotation.x + state.velX),
      );
      atmosphere.rotation.copy(group.rotation);
      renderer.render(scene, camera);
    };
    const renderOnce = () => {
      if (state.onScreen) renderFrame();
    };

    const resize = () => {
      size = mount.clientWidth || size;
      renderer.setSize(size, size);
      renderOnce();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let frame = 0;
    const minFrameMs = lowPower ? 33 : 0; // ~30fps cap on phones
    let lastRender = 0;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - lastRender < minFrameMs) return;
      lastRender = now;

      if (!state.dragging) {
        state.velX *= 0.92;
        state.velY *= 0.94;
        if (!reducedMotion && Math.abs(state.velY) < 0.0022) {
          state.velY += (-0.0022 - state.velY) * 0.05;
        }
      }
      renderFrame();

      // Reduced motion: once the globe settles, stop the loop entirely and
      // wait for the next interaction.
      if (
        reducedMotion &&
        !state.dragging &&
        Math.abs(state.velX) < 0.0002 &&
        Math.abs(state.velY) < 0.0002
      ) {
        stop();
      }
    };
    const start = () => {
      if (!frame && state.onScreen) {
        lastRender = 0;
        frame = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    // Fully stop the render loop whenever the globe is off-screen or the tab is
    // hidden - the single biggest battery / jank win on mobile.
    let inView = true;
    const sync = () => {
      state.onScreen = inView && !document.hidden;
      if (state.onScreen) start();
      else stop();
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );
    io.observe(mount);
    const onVis = () => sync();
    document.addEventListener("visibilitychange", onVis);

    start();

    return () => {
      stop();
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
    <div className="relative mx-auto aspect-square w-full max-w-[440px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[18%] rounded-full"
        style={{ boxShadow: "0 0 120px 4px rgba(52,221,187,0.28)" }}
      />
      <div
        ref={mountRef}
        role="button"
        tabIndex={0}
        aria-label="Open the interactive globe"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") router.push("/explore");
        }}
        className="focus-ring relative h-full w-full select-none"
      />
      <p className="pointer-events-none absolute inset-x-0 -bottom-3 text-center text-[10px] uppercase tracking-[0.22em] text-[var(--color-ink-mute)]">
        Drag to spin, tap to open the map
      </p>
    </div>
  );
}
