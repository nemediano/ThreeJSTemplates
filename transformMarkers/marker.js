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
      arrowGeometry.faces.push(new THREE.Face3(c, d, b));
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

  arrowGeometry.computeVertexNormals(true);
  return arrowGeometry;
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