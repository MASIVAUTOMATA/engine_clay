import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import Model from "./components/Model";
import SimpleWall from "./components/SimpleWall";

function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<Model | null>(null);
  const raycaster = new THREE.Raycaster();

  useEffect(() => {
    if (!mountRef.current) return;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const model = new Model();
    modelRef.current = model;

    const startPoint = new THREE.Vector3(0, 0, 0);
    const endPoint = new THREE.Vector3(4, 0, 0);
    const height = 3;
    const width = 0.2;

    const wall = new SimpleWall();
    const wall2 = new SimpleWall();
    wall.startPoint.set(-4, 0, 0);
    wall2.startPoint.set(3, 0, 0);
    model.addElement(wall);
    model.addElement(wall2);

    const animate = () => {
      requestAnimationFrame(animate);
      model.update();
      renderer.render(model.scene, camera);
    };

    animate();

    const handleMouseDown = (event: MouseEvent) => {
      if (!modelRef.current) return;
      for (const element of modelRef.current.elements) {
        element.onMouseDown(event, camera, raycaster);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!modelRef.current) return;
      for (const element of modelRef.current.elements) {
        element.onMouseMove(event, camera, raycaster);
      }
    };

    const handleMouseUp = () => {
      if (!modelRef.current) return;
      for (const element of modelRef.current.elements) {
        element.onMouseUp();
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} />;
}

export default App;
