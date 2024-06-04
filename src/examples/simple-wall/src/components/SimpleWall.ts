import * as THREE from "three";

class SimpleWall {
  startPoint = new THREE.Vector3(0, 0, 0);
  endPoint = new THREE.Vector3(1, 0, 0);
  height = 1;
  width = 0.2; // Set a default width
  mesh: THREE.Mesh;
  private dragging: boolean = false;
  private dragStart: THREE.Vector3 | null = null;

  private _openings = new Map<
    number,
    { opening: THREE.Object3D; distance: number }
  >();
  private _corners = new Map<
    number,
    { wall: SimpleWall; atTheEndPoint: boolean }
  >();

  constructor() {
    const length = this.startPoint.distanceTo(this.endPoint);
    const geometry = new THREE.BoxGeometry(length, this.height, this.width);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.mesh = new THREE.Mesh(geometry, material);

    this.updatePositionAndRotation();
  }

  private updatePositionAndRotation(): void {
    // Calculate the midpoint
    const midPoint = new THREE.Vector3(
      (this.startPoint.x + this.endPoint.x) / 2,
      (this.startPoint.y + this.endPoint.y) / 2,
      (this.startPoint.z + this.endPoint.z) / 2
    );
    this.mesh.position.copy(midPoint);

    // Calculate the direction and set rotation
    const direction = new THREE.Vector3().subVectors(
      this.endPoint,
      this.startPoint
    );
    const rotationZ = Math.atan2(direction.y, direction.x);
    this.mesh.rotation.set(0, 0, rotationZ);
  }

  update(
    updateGeometry: boolean = false,
    updateCorners: boolean = false
  ): void {
    const length = this.startPoint.distanceTo(this.endPoint);
    const geometry = new THREE.BoxGeometry(length, this.height, this.width);
    this.mesh.geometry.dispose();
    this.mesh.geometry = geometry;
    this.updatePositionAndRotation();

    if (updateCorners) this.updateAllCorners();
  }

  extend(wall: SimpleWall, atTheEndPoint = true): THREE.Vector3 | null {
    const zDirection = new THREE.Vector3(0, 0, 1);
    const normalVector = wall.direction.cross(zDirection);
    const correctedNormalVector = new THREE.Vector3(
      normalVector.x,
      normalVector.z,
      normalVector.y * -1
    );

    const coplanarPoint = new THREE.Vector3(
      wall.startPoint.x,
      wall.startPoint.z,
      wall.startPoint.y * -1
    );

    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      correctedNormalVector,
      coplanarPoint
    );

    const correctedDirection = new THREE.Vector3(
      this.direction.x * -1,
      this.direction.z,
      this.direction.y
    );

    if (atTheEndPoint) correctedDirection.negate();

    const origin = atTheEndPoint ? this.startPoint : this.endPoint;
    const rayOriginPoint = new THREE.Vector3(origin.x, origin.z, origin.y * -1);

    const rayAxisWall1 = new THREE.Ray(rayOriginPoint, correctedDirection);
    const intersectionPoint = rayAxisWall1.intersectPlane(
      plane,
      new THREE.Vector3()
    );

    if (intersectionPoint) {
      const correctedIntersectionPoint = new THREE.Vector3(
        intersectionPoint.x,
        intersectionPoint.z * -1,
        intersectionPoint.y
      );

      wall.update(true);
      this.update(true);

      return correctedIntersectionPoint;
    }
    return null;
  }

  private calculateDistances(
    wall: SimpleWall,
    atTheEndPoint: boolean,
    intersectionPoint: THREE.Vector3
  ) {
    const distance1 = this.midPoint.distanceTo(intersectionPoint);
    const distance2 = wall.midPoint.distanceTo(intersectionPoint);

    const distance3 = this.startPoint.distanceTo(this.midPoint);
    const distance4 = this.startPoint.distanceTo(intersectionPoint);

    const distance5 = wall.startPoint.distanceTo(wall.midPoint);
    const distance6 = wall.startPoint.distanceTo(intersectionPoint);

    let sign1 = 1;
    let sign2 = 1;

    if (distance3 <= distance4 && distance5 <= distance6) {
      sign1 = atTheEndPoint ? 1 : -1;
      sign2 = atTheEndPoint ? 1 : -1;
    } else if (distance3 >= distance4 && distance5 >= distance6) {
      sign1 = -1;
      sign2 = -1;
    } else if (distance3 >= distance4 && distance5 <= distance6) {
      sign1 = 1;
      sign2 = -1;
    } else if (distance3 < distance4 && distance5 > distance6) {
      sign1 = -1;
      sign2 = 1;
    }

    const sign3 = atTheEndPoint ? 1 : -1;

    return {
      distance1,
      distance2,
      sign1,
      sign2,
      sign3,
    };
  }

  private updateAllCorners() {
    for (const [_id, { wall, atTheEndPoint }] of this._corners) {
      const intersectionPoint = this.extend(wall, atTheEndPoint);
      if (!intersectionPoint) return;

      const angle = wall.mesh.rotation.z - this.mesh.rotation.z;

      const width1 = this.width;
      const width2 = wall.width;

      const { distance1, distance2, sign1, sign2, sign3 } =
        this.calculateDistances(wall, atTheEndPoint, intersectionPoint);

      // Update half-spaces or other geometric transformations here

      wall.update(true);
    }
    this.update(true);
  }

  get length() {
    return this.startPoint.distanceTo(this.endPoint);
  }

  get midPoint() {
    return new THREE.Vector3(
      (this.startPoint.x + this.endPoint.x) / 2,
      (this.startPoint.y + this.endPoint.y) / 2,
      (this.startPoint.z + this.endPoint.z) / 2
    );
  }

  get direction() {
    const vector = new THREE.Vector3();
    vector.subVectors(this.endPoint, this.startPoint);
    vector.normalize();
    return vector;
  }
  onMouseDown(
    event: MouseEvent,
    camera: THREE.Camera,
    raycaster: THREE.Raycaster
  ) {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(this.mesh);
    if (intersects.length > 0) {
      this.dragging = true;
      this.dragStart = intersects[0].point;
    }
  }

  onMouseMove(
    event: MouseEvent,
    camera: THREE.Camera,
    raycaster: THREE.Raycaster
  ) {
    if (!this.dragging || !this.dragStart) return;

    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const ray = raycaster.ray;
    const dragEnd = new THREE.Vector3();
    ray.intersectPlane(plane, dragEnd);

    const direction = new THREE.Vector3()
      .subVectors(dragEnd, this.startPoint)
      .normalize();
    const length = this.startPoint.distanceTo(dragEnd);
    this.endPoint.copy(
      this.startPoint.clone().add(direction.multiplyScalar(length))
    );

    this.update(true, true);
  }

  onMouseUp() {
    this.dragging = false;
    this.dragStart = null;
  }
}

export default SimpleWall;
