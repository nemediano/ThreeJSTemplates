
function createArrowGeometry(slices, pointHeightProportion, pointRadiProportion) {
  let arrowGeometry = new THREE.Geometry();
  // Our arrow body to point proportion
  let pointBaseValue = 2.0 * pointHeightProportion - 1.0;
  let cilinderRadious = pointRadiProportion;
  let radious = [cilinderRadious, cilinderRadious, 1.0, 0.0];
  let heights = [-1.0, pointBaseValue, pointBaseValue, 1.0];
  // Our arrow has 4 section
  const SECTIONS = 4;
  for (let i = 0; i < SECTIONS; ++i) {
    // vary the raduiious by section to have the arrow shape
    let r = radious[i];
    let angle = 0.0;
    let deltaAngle = 2.0 * Math.PI / slices;
    let h = heights[i];
    for (let j = 0; j < slices; ++j) {
      let vertex = new THREE.Vector3();
      vertex.x = r * Math.cos(angle);
      vertex.y = h;
      vertex.z = r * Math.sin(angle);
      angle += deltaAngle;
      arrowGeometry.vertices.push(vertex);
    }
  }

  // Create the faces
  let faceCounter = 0;
  for (let i = 0; i < SECTIONS - 1; ++i) {
    for (let j = 0; j < slices; ++j) {
      let a = j + i * slices;
      let b = (j + 1) % slices + i * slices;
      let c = a + slices;
      let d = b + slices;
      arrowGeometry.faces.push(new THREE.Face3(b, a, c));
      //console.log('face ' + faceCounter + ': ' + b + ', ' + a + ', ' + c);
      faceCounter++;
      arrowGeometry.faces.push(new THREE.Face3(c, d, b));
      //console.log('face: '+ faceCounter + ': ' + c + ', ' + d + ', ' + b);
      faceCounter++;
    }
  }

  // bottom
  let vertex = new THREE.Vector3();
  vertex.x = 0.0;
  vertex.y = heights[0];
  vertex.z = 0.0;
  arrowGeometry.vertices.push(vertex);
  let lastIndex = SECTIONS * slices;
  for (let j = 0; j < slices; ++j) {
    let a = j;
    let b = (j + 1) % slices;
    arrowGeometry.faces.push(new THREE.Face3(a, b, lastIndex));
  }

  //arrowGeometry.computeFaceNormals();
  arrowGeometry.computeVertexNormals(true);
  return arrowGeometry;
}

function init() {
  // listen to the resize events
  window.addEventListener('resize', onResize, false);

  let camera;
  let scene;
  let renderer;
  let orbitCtrl;

  // initialize stats
  const stats = initStats();

  // create a scene, that will hold all our elements such as objects, cameras and lights.
  scene = new THREE.Scene();

  // create a camera, which defines where we're looking at.
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

  // create a render and set the size
  renderer = new THREE.WebGLRenderer();

  renderer.setClearColor(new THREE.Color(0xd9d9d9));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  // Options to change shape
  const controls = new function () {
      this.arrowSlices = 20;
      this.pointHeightProportion = 0.8;
      this.pointRadiProportion = 0.4;
      this.arrowHeightScale = 1.8;
      this.arrowWidthScale = 0.5;
  };
  // Controls to manipulate the options
  const gui = new dat.GUI();
  gui.add(controls, 'arrowSlices').min(3).step(1.0);
  gui.add(controls, 'pointHeightProportion', 0.1, 1.0);
  gui.add(controls, 'pointRadiProportion', 0.1, 1.0);
  gui.add(controls, 'arrowHeightScale', 0.1, 10.0);
  gui.add(controls, 'arrowWidthScale', 0.1, 10.0);

  // position and point the camera to the center of the scene
  const RADIUS_MAX =  30;
  let camPos = new THREE.Vector3(-0.5, 0.6, 1);
  camPos.normalize();
  camPos.multiplyScalar(RADIUS_MAX);
  camera.position.set(camPos.x, camPos.y, camPos.z);
  camera.lookAt(scene.position);

  // Add OrbitControls so that we can pan around with the mouse.
  orbitCtrl = new THREE.OrbitControls(camera, renderer.domElement);

  // create the ground plane
  const planeGeometry = new THREE.PlaneGeometry(60, 20, 1, 1);
  const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xeaa40b });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.receiveShadow = true;

  // rotate and position the plane
  plane.rotation.x = -0.5 * Math.PI;
  plane.position.x = 10;
  plane.position.y = 0;
  plane.position.z = 0;
  // add the plane to the scene
  scene.add(plane);

  // create and add marker to the scene
  const marker = createMarker();
  marker.position.y = 1.8;
  scene.add(marker);

  // add subtle ambient lighting
  const ambienLight = new THREE.AmbientLight(0x353535);
  scene.add(ambienLight);

  // add spotlight for the shadows
  const spotLight = new THREE.SpotLight(0xffffff);
  spotLight.position.set(-10, 20, -5);
  spotLight.castShadow = true;
  scene.add(spotLight);

  // add the output of the renderer to the html element
  document.getElementById("webgl-output").appendChild(renderer.domElement);

  render();

  function render() {
    // update the stats and the controls
    orbitCtrl.update();
    stats.update();

    // render using requestAnimationFrame
    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function createMarker() {
    const materials = [
      new THREE.MeshLambertMaterial({ color: 0xff0000 }), // x axis material
      new THREE.MeshLambertMaterial({ color: 0x00ff00 }), // y axis material
      new THREE.MeshLambertMaterial({ color: 0x0000ff }), // z axis material
      new THREE.MeshLambertMaterial({ color: 0x888888 })  // center cube material
    ];
    // Create arrow geometry (Thos values shape the arrow and were calculated with the other app)
    const arrowGeometry = createArrowGeometry(20, 0.85, 0.4);
    const scaleHeight = 1.8;
    const scaleWidth  = 0.2;
    // This shif the arrow center for the marker
    const shift = 0.1;
    // create X axis
    const xAxis = new THREE.Mesh(arrowGeometry, materials[0]);
    // Scale
    xAxis.scale.set(scaleWidth, scaleHeight, scaleWidth);
    // Rotate
    xAxis.rotation.z = 1.5 * Math.PI;
    // Shift
    xAxis.position.x = shift;
    // cast shadow
    xAxis.castShadow = true;
    // create Y axis
    const yAxis = new THREE.Mesh(arrowGeometry, materials[1]);
    // Scale
    yAxis.scale.set(scaleWidth, scaleHeight, scaleWidth);
    // Shift
    yAxis.position.y = shift;
    // cast shadow
    yAxis.castShadow = true;
    // create Z axis
    const zAxis = new THREE.Mesh(arrowGeometry, materials[2]);
    // Scale
    zAxis.scale.set(scaleWidth, scaleHeight, scaleWidth);
    // Rotate
    zAxis.rotation.x = 0.5 * Math.PI;
    // Shift
    zAxis.position.z = shift;
    // cast shadow
    zAxis.castShadow = true;
    // Create cube
    const cubeGeometry = new THREE.BoxGeometry(scaleWidth, scaleWidth, scaleWidth);
    const cube = new THREE.Mesh(cubeGeometry, materials[3]);
    // cast shadow
    cube.castShadow = true;
    //create a group that will become the marker
    let marker = new THREE.Group();
    marker.add(xAxis);
    marker.add(yAxis);
    marker.add(zAxis);
    marker.add(cube);

    return marker;
  }
}
init();