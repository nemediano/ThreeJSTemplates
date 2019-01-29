
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

  // create an arrow shape
  let arrowGeometry = createArrowGeometry(controls.arrowSlices, controls.pointHeightProportion,
      controls.pointRadiProportion);
  // Multimateral is needed to correct wireframe
  const arrowMaterials = [
      new THREE.MeshLambertMaterial({ color: 0x00ff00 }),
      new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true })
  ];

  let arrow = new THREE.SceneUtils.createMultiMaterialObject(arrowGeometry, arrowMaterials);
  // Since it is a multimaterial object we need to do this to add shadow
  arrow.traverse(function (e) {
      e.castShadow = true
  });

  // Scale arrow
  arrow.scale.x = controls.arrowWidthScale;
  arrow.scale.y = controls.arrowHeightScale;
  arrow.scale.z = controls.arrowWidthScale;
  // Make arrow stand on top of the plane
  arrow.position.y = controls.arrowHeightScale;

  // add the arrow to the scene
  scene.add(arrow);

  // position and point the camera to the center of the scene
  const RADIUS_MAX =  30;
  let camPos = new THREE.Vector3(-0.5, 0.6, 1);
  camPos.normalize();
  camPos.multiplyScalar(RADIUS_MAX);
  camera.position.set(camPos.x, camPos.y, camPos.z);
  // camera.position.set(0, 0, 1.25 * RADIUS_MAX);
  camera.lookAt(scene.position);

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

    // update the arrow
    scene.remove(arrow);
    // create an arrow shape
    arrowGeometry = createArrowGeometry(controls.arrowSlices, controls.pointHeightProportion,
      controls.pointRadiProportion);
    arrow = new THREE.SceneUtils.createMultiMaterialObject(arrowGeometry, arrowMaterials);
    // Since it is a multimaterial object we need to do this to add shadow
    arrow.traverse(function (e) {
      e.castShadow = true
    });

    // Scale arrow
    arrow.scale.x = controls.arrowWidthScale;
    arrow.scale.y = controls.arrowHeightScale;
    arrow.scale.z = controls.arrowWidthScale;
    // Make arrow stand on top of the plane
    arrow.position.y = controls.arrowHeightScale;
    // add the arrow to the scene
    scene.add(arrow);

    // render using requestAnimationFrame
    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
init();