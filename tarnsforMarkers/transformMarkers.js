let scene;
let camera;
let renderer;
let cube;
let orbitCtrl;
let manipulCtrl;
let octree;
let selectedMode = true;
let transformMode = 0;  // 0 translate 1 scale

const RADIUS_MAX = 40.0;
const RADIUS_MAX_HALF = 20.0;
const NUM_OBJECTS = 40;

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let selectedObject;
let auxMaterial;

const matSelected = new THREE.MeshLambertMaterial( { color: 0x00ffff} );

function unselect () {
  // Return previous selected object to original material
  if (selectedObject !== null) {
    selectedObject.material = auxMaterial;
  }
  selectedObject = null;
  auxMaterial = null;
  if (manipulCtrl !== null) {
    manipulCtrl.enable = false;
    //manipulCtrl.dispose();
    scene.remove(manipulCtrl);
  }
}

function onMouseMove( event ) {
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function onResize ( event ) {
  let WIDTH = window.innerWidth;
  let HEIGHT = window.innerHeight;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
  render();
}

function onKeyPress ( event ) {
  switch ( event.keyCode ) {
    case 32: // Spacebar
      selectedMode = !selectedMode;
    break;
    case 82:  // Keyboard 'R'
    case 114: // Keyboard 'r'
      transformMode = 1;
    break;
    case 84:  // Keyboard 'T'
    case 116: // Keyboard 't'
      transformMode = 0;
    break;
  }

  if (selectedMode) {
    console.log('Select mode ON');
  } else {
    console.log('Select mode OFF');
    unselect();
  }
  render();
}

function onClick( event ) {
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  // selection
  if (selectedMode) {
    pickingLogic();
  }
  render();
}

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 500);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio( window.devicePixelRatio );
  // create octree
  octree = new THREE.Octree( {
    // uncomment below to see the octree (may kill the fps)
    //scene: scene,
    // when undeferred = true, objects are inserted immediately
    // instead of being deferred until next octree.update() call
    // this may decrease performance as it forces a matrix update
    undeferred: false,
    // set the max depth of tree
    depthMax: Infinity,
    // max number of objects before nodes split or merge
    objectsThreshold: 8,
    // percent between 0 and 1 that nodes will overlap each other
    // helps insert objects that lie over more than one node
    overlapPct: 0.15
  } );
  // Hexadecimal color (recommended)
  let bgColor = new THREE.Color( 0xaa6622);
  renderer.setClearColor(bgColor, 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  // Create a basic meshes in random positions and add it to scene
  let marker;
  for (let i = 0; i < NUM_OBJECTS; ++i) {
    marker = createMarker();
    // random position
    for (let j = 0; j < 3; ++j) {
      marker.position.setComponent(j, Math.random() * RADIUS_MAX - RADIUS_MAX_HALF);
    }
    // random orientation
    let rotVec = new THREE.Vector3();
    for (let j = 0; j < 3; ++j) {
      rotVec.setComponent(j, Math.random() * 2 * Math.PI);
    }
    marker.rotation.setFromVector3(rotVec);

    // we need to store a reference to the objects since we are going to query later
    let meshes = marker.children;
    for (let i = 0; i < meshes.lenght; ++i) {
      octree.add(meshes[i]);
    }
    scene.add(marker);
  }

  selectedObject = null;
  auxMaterial = null;
  // create lights (Three point lighting and ambient)
  const ambientLight = new THREE.AmbientLight(0x303030);
  const keyLight = new THREE.PointLight(0xffffff);
  keyLight.position.set(10, 50, 130);
  const dimLight = new THREE.PointLight(0x808080);
  dimLight.position.set(-10, 50, 130);
  const backLight = new THREE.PointLight(0x606060);
  backLight.position.set(0, 0, -130);
  // add to the scene
  scene.add(keyLight);
  scene.add(dimLight);
  scene.add(backLight);
  scene.add(ambientLight);

  // Move camera away
  camera.position.set(0, 0, 1.25 * RADIUS_MAX);

  // Create an event listener that resizes the renderer with the browser window.
  window.addEventListener('resize', onResize);

  // Add the mouse move function to update the ray's start
  window.addEventListener( 'mousemove', onMouseMove, false );

  // Add the keyboard event
  window.addEventListener( 'keyup', onKeyPress, false);

  // Add the mouse click event
  window.addEventListener( 'click', onClick, false);

  // Add OrbitControls so that we can pan around with the mouse.
  orbitCtrl = new THREE.OrbitControls(camera, renderer.domElement);

  // The manipulation controls init logic
  manipulCtrl = new THREE.TransformControls( camera, renderer.domElement );
  manipulCtrl.addEventListener( 'change', render );

  manipulCtrl.addEventListener( 'dragging-changed', function ( event ) {
    orbitCtrl.enabled = !event.value;
  } );
}

function pickingLogic() {
  orbitCtrl.update();
  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);
  // calculate objects intersecting the picking ray
  // Query the octree to see which objects are near the ray
  let closeObjects = octree.search( raycaster.ray.origin, raycaster.ray.far, true, raycaster.ray.direction );
  // only search on the potential close objects
  let intersections = raycaster.intersectOctreeObjects(closeObjects);
  // see if we hit something
  if (intersections.length > 0) {
    console.log('Hit!');
    // is a new selection?
    if (intersections[0].object != selectedObject) {
      console.log('New selection!');
      selectLogic(intersections[0].object);
    }
  } else {
    unselect();
  }

}

function selectLogic(newObject) {
  if (newObject === null) {
    console.log('Impossible to select null object!');
  }
  // Return previous selected object to original material
  if (selectedObject !== null) {
    selectedObject.material = auxMaterial;
  }
  // update selection
  selectedObject = newObject;
  auxMaterial = selectedObject.material;
  // Change the current selected object material
  selectedObject.material = matSelected;
  // add manipulation controls to object
  if (manipulCtrl !== null) {
    if (transformMode == 0) {
      manipulCtrl.setMode('translate');
    } else if (transformMode == 1) {
      manipulCtrl.setMode('rotate');
    }
    scene.add(manipulCtrl);
    manipulCtrl.attach(newObject);
  }
}

function render() {
  renderer.render(scene, camera);
}

function animate() {
  orbitCtrl.update();
  // Callback simulated by recursion
  requestAnimationFrame(animate);
  // Draw!
  render();
  // update octree post render
  // this ensures any objects being added
  // have already had their matrices updated
  octree.update();
}
// Manually call the first time
init();
animate();