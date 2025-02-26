// --- src/skeletonModel.js ---
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class SkeletonModel {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.skeleton = null;
    this.joints = {};
    this.controls = null;
    this.animationFrameId = null;
    
    this.init();
  }

  init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;
    this.camera.position.y = 1;

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    // Add orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // Add grid for reference
    const gridHelper = new THREE.GridHelper(10, 10);
    this.scene.add(gridHelper);

    // Create skeleton
    this.createSkeleton();

    // Start animation loop
    this.animate();

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  createSkeleton() {
    // Create a group to hold all skeleton parts
    this.skeleton = new THREE.Group();
    this.scene.add(this.skeleton);

    // Material for joints
    const jointMaterial = new THREE.MeshPhongMaterial({ color: 0x0088ff });
    const boneMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

    // Create joints (spheres)
    const createJoint = (name, position, size = 0.1) => {
      const geometry = new THREE.SphereGeometry(size);
      const mesh = new THREE.Mesh(geometry, jointMaterial);
      mesh.position.copy(position);
      this.skeleton.add(mesh);
      this.joints[name] = mesh;
      return mesh;
    };

    // Create bone (cylinder between two joints)
    const createBone = (joint1, joint2, thickness = 0.05) => {
      const direction = new THREE.Vector3().subVectors(joint2.position, joint1.position);
      const length = direction.length();
      
      const geometry = new THREE.CylinderGeometry(thickness, thickness, length, 8);
      const bone = new THREE.Mesh(geometry, boneMaterial);
      
      // Position and rotate the bone to connect the joints
      bone.position.copy(joint1.position);
      bone.position.addScaledVector(direction, 0.5);
      
      // Orient the bone to point from joint1 to joint2
      bone.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize()
      );
      
      this.skeleton.add(bone);
      return bone;
    };

    // Create the basic human skeleton structure
    // Head
    const head = createJoint('head', new THREE.Vector3(0, 1.7, 0), 0.15);
    
    // Torso
    const neck = createJoint('neck', new THREE.Vector3(0, 1.5, 0));
    const spine = createJoint('spine', new THREE.Vector3(0, 1.0, 0));
    const hips = createJoint('hips', new THREE.Vector3(0, 0.8, 0));
    
    // Arms
    const leftShoulder = createJoint('leftShoulder', new THREE.Vector3(-0.3, 1.4, 0));
    const leftElbow = createJoint('leftElbow', new THREE.Vector3(-0.7, 1.2, 0));
    const leftWrist = createJoint('leftWrist', new THREE.Vector3(-1.0, 1.0, 0));
    
    const rightShoulder = createJoint('rightShoulder', new THREE.Vector3(0.3, 1.4, 0));
    const rightElbow = createJoint('rightElbow', new THREE.Vector3(0.7, 1.2, 0));
    const rightWrist = createJoint('rightWrist', new THREE.Vector3(1.0, 1.0, 0));
    
    // Legs
    const leftHip = createJoint('leftHip', new THREE.Vector3(-0.2, 0.7, 0));
    const leftKnee = createJoint('leftKnee', new THREE.Vector3(-0.3, 0.4, 0));
    const leftAnkle = createJoint('leftAnkle', new THREE.Vector3(-0.35, 0.1, 0));
    
    const rightHip = createJoint('rightHip', new THREE.Vector3(0.2, 0.7, 0));
    const rightKnee = createJoint('rightKnee', new THREE.Vector3(0.3, 0.4, 0));
    const rightAnkle = createJoint('rightAnkle', new THREE.Vector3(0.35, 0.1, 0));
    
    // Connect joints with bones
    createBone(head, neck);
    createBone(neck, spine);
    createBone(spine, hips);
    
    createBone(neck, leftShoulder);
    createBone(leftShoulder, leftElbow);
    createBone(leftElbow, leftWrist);
    
    createBone(neck, rightShoulder);
    createBone(rightShoulder, rightElbow);
    createBone(rightElbow, rightWrist);
    
    createBone(hips, leftHip);
    createBone(leftHip, leftKnee);
    createBone(leftKnee, leftAnkle);
    
    createBone(hips, rightHip);
    createBone(rightHip, rightKnee);
    createBone(rightKnee, rightAnkle);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    
    // Update controls
    this.controls.update();
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    // Update camera aspect ratio and renderer size on window resize
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  // Method to move a joint by name and angle
  moveJoint(jointName, rotationAxis, angle) {
    const joint = this.joints[jointName];
    if (!joint) {
      console.warn(`Joint ${jointName} not found`);
      return;
    }

    // Convert angle from degrees to radians
    const radians = THREE.MathUtils.degToRad(angle);
    
    // Create rotation based on axis
    let axis = new THREE.Vector3();
    if (rotationAxis === 'x') axis.set(1, 0, 0);
    else if (rotationAxis === 'y') axis.set(0, 1, 0);
    else if (rotationAxis === 'z') axis.set(0, 0, 1);
    
    // Apply rotation
    joint.rotateOnAxis(axis, radians);
  }

  // Method to reset the skeleton to its initial position
  reset() {
    // Remove the current skeleton
    if (this.skeleton) {
      this.scene.remove(this.skeleton);
    }
    
    // Clear joints dictionary
    this.joints = {};
    
    // Recreate the skeleton
    this.createSkeleton();
  }

  // Clean up resources when the component is unmounted
  dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    window.removeEventListener('resize', this.onWindowResize);
    
    // Remove renderer from DOM
    if (this.renderer && this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

export default SkeletonModel; 