import * as THREE from "three";
import SimpleWall from "./SimpleWall";

class Model {
  elements: SimpleWall[];
  scene: THREE.Scene;

  constructor() {
    this.elements = [];
    this.scene = new THREE.Scene();
  }

  addElement(element: SimpleWall): void {
    this.elements.push(element);
    this.scene.add(element.mesh);
  }

  update(): void {
    for (const element of this.elements) {
      element.update();
    }
  }
}

export default Model;
