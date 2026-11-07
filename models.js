function createCube() {
  const positions = new Float32Array([
    -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,   // front
     1, -1, -1,  -1, -1, -1,  -1,  1, -1,   1,  1, -1,   // back
    -1,  1,  1,   1,  1,  1,   1,  1, -1,  -1,  1, -1,   // top
    -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,   // bottom
     1, -1,  1,   1, -1, -1,   1,  1, -1,   1,  1,  1,   // right
    -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1    // left
  ]);
  const faceNormals = [[0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0]];
  const normals = new Float32Array(faceNormals.flatMap(n => [...n, ...n, ...n, ...n]));

  // Tangent; bitangent = cross(N, T)
  const faceTangents = [[1, 0, 0], [-1, 0, 0], [1, 0, 0], [1, 0, 0], [0, 0, -1], [0, 0, 1]];
  const tangents = new Float32Array(faceTangents.flatMap(t => [...t, ...t, ...t, ...t]));

  const texCoords = new Float32Array(faceNormals.flatMap(() => [0, 0, 1, 0, 1, 1, 0, 1]));

  const indices = new Uint16Array([
     0,  1,  2,   0,  2,  3,   // front
     4,  5,  6,   4,  6,  7,   // back
     8,  9, 10,   8, 10, 11,   // top
    12, 13, 14,  12, 14, 15,   // bottom
    16, 17, 18,  16, 18, 19,   // right
    20, 21, 22,  20, 22, 23    // left
  ]);
  return { positions, normals, tangents, texCoords, indices };
}


function createCylinder(segments = 64, uRepeat = 3) {
  const positions = [], normals = [], tangents = [], texCoords = [], indices = [];

  // Side: theta grows with u, so T points along the circle and B = cross(N, T) points up
  for (let i = 0; i <= segments; i++) {
    const u = i / segments, theta = 2 * Math.PI * u;
    const s = Math.sin(theta), c = Math.cos(theta);
    for (const y of [-1, 1]) {
      positions.push(s, y, c);
      normals.push(s, 0, c);
      tangents.push(c, 0, -s);
      texCoords.push(u * uRepeat, (y + 1) / 2);
    }
  }
  for (let i = 0; i < segments; i++) {
    const k = 2 * i;
    indices.push(k, k + 2, k + 3, k, k + 3, k + 1);
  }

  // Caps: planar mapping of x, z into the texture, T = +x on both
  for (const y of [1, -1]) {
    const center = positions.length / 3;
    positions.push(0, y, 0);
    normals.push(0, y, 0);
    tangents.push(1, 0, 0);
    texCoords.push(0.5, 0.5);
    for (let i = 0; i <= segments; i++) {
      const theta = 2 * Math.PI * i / segments;
      const s = Math.sin(theta), c = Math.cos(theta);
      positions.push(s, y, c);
      normals.push(0, y, 0);
      tangents.push(1, 0, 0);
      texCoords.push(0.5 + 0.5 * s, 0.5 - 0.5 * y * c);  // keeps cross(N, T) along +v
    }
    for (let i = 0; i < segments; i++) {
      const a = center + 1 + i, b = a + 1;
      if (y > 0) indices.push(center, a, b);
      else indices.push(center, b, a);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    tangents: new Float32Array(tangents),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}


function createSphere(horizontalSegments = 48, verticalSegments = 32, horizontalRepeat = 4, verticalRepeat = 2) {
  const positions = [], normals = [], tangents = [], texCoords = [], indices = [];

  for (let verticalStep = 0; verticalStep <= verticalSegments; verticalStep++) {
    const vCoordinate = verticalStep / verticalSegments;
    const latitude = Math.PI * (vCoordinate - 0.5);
    for (let horizontalStep = 0; horizontalStep <= horizontalSegments; horizontalStep++) {
      const uCoordinate = horizontalStep / horizontalSegments;
      const theta = 2 * Math.PI * uCoordinate;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      const pointX = Math.cos(latitude) * sinTheta;
      const pointY = Math.sin(latitude);
      const pointZ = Math.cos(latitude) * cosTheta;

      positions.push(pointX, pointY, pointZ);
      normals.push(pointX, pointY, pointZ);
      tangents.push(cosTheta, 0, -sinTheta);
      texCoords.push(uCoordinate * horizontalRepeat, vCoordinate * verticalRepeat);
    }
  }

  for (let verticalStep = 0; verticalStep < verticalSegments; verticalStep++) {
    for (let horizontalStep = 0; horizontalStep < horizontalSegments; horizontalStep++) {
      const bottomLeft = verticalStep * (horizontalSegments + 1) + horizontalStep;
      const bottomRight = bottomLeft + 1;
      const topLeft = bottomLeft + horizontalSegments + 1;
      const topRight = topLeft + 1;
      indices.push(bottomLeft, bottomRight, topRight);
      indices.push(bottomLeft, topRight, topLeft);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    tangents: new Float32Array(tangents),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}


function createCone(segments = 64, horizontalRepeat = 3) {
  const positions = [], normals = [], tangents = [], texCoords = [], indices = [];
  const radius = 1;
  const height = 2;
  const slantLength = Math.sqrt(radius * radius + height * height);

  for (let horizontalStep = 0; horizontalStep <= segments; horizontalStep++) {
    const uCoordinate = horizontalStep / segments;
    const theta = 2 * Math.PI * uCoordinate;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    const normalX = height * sinTheta / slantLength;
    const normalY = radius / slantLength;
    const normalZ = height * cosTheta / slantLength;

    positions.push(radius * sinTheta, -1, radius * cosTheta);
    normals.push(normalX, normalY, normalZ);
    tangents.push(cosTheta, 0, -sinTheta);
    texCoords.push(uCoordinate * horizontalRepeat, 0);

    positions.push(0, 1, 0);
    normals.push(normalX, normalY, normalZ);
    tangents.push(cosTheta, 0, -sinTheta);
    texCoords.push(uCoordinate * horizontalRepeat, 1);
  }
  for (let horizontalStep = 0; horizontalStep < segments; horizontalStep++) {
    const bottomLeft = 2 * horizontalStep;
    const apexLeft = bottomLeft + 1;
    const bottomRight = bottomLeft + 2;
    indices.push(bottomLeft, bottomRight, apexLeft);
  }

  const centerIndex = positions.length / 3;
  positions.push(0, -1, 0);
  normals.push(0, -1, 0);
  tangents.push(1, 0, 0);
  texCoords.push(0.5, 0.5);
  for (let horizontalStep = 0; horizontalStep <= segments; horizontalStep++) {
    const theta = 2 * Math.PI * horizontalStep / segments;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    positions.push(sinTheta, -1, cosTheta);
    normals.push(0, -1, 0);
    tangents.push(1, 0, 0);
    texCoords.push(0.5 + 0.5 * sinTheta, 0.5 + 0.5 * cosTheta);
  }
  for (let horizontalStep = 0; horizontalStep < segments; horizontalStep++) {
    const currentIndex = centerIndex + 1 + horizontalStep;
    indices.push(centerIndex, currentIndex + 1, currentIndex);
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    tangents: new Float32Array(tangents),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}


function createTorus(bigRadius = 0.75, tubeRadius = 0.35, thetaSegments = 64, phiSegments = 32, horizontalRepeat = 4, verticalRepeat = 2) {
  const positions = [], normals = [], tangents = [], texCoords = [], indices = [];

  for (let phiStep = 0; phiStep <= phiSegments; phiStep++) {
    const vCoordinate = phiStep / phiSegments;
    const phi = 2 * Math.PI * vCoordinate;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    for (let thetaStep = 0; thetaStep <= thetaSegments; thetaStep++) {
      const uCoordinate = thetaStep / thetaSegments;
      const theta = 2 * Math.PI * uCoordinate;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      positions.push((bigRadius + tubeRadius * cosPhi) * sinTheta, tubeRadius * sinPhi, (bigRadius + tubeRadius * cosPhi) * cosTheta);
      normals.push(cosPhi * sinTheta, sinPhi, cosPhi * cosTheta);
      tangents.push(cosTheta, 0, -sinTheta);
      texCoords.push(uCoordinate * horizontalRepeat, vCoordinate * verticalRepeat);
    }
  }

  for (let phiStep = 0; phiStep < phiSegments; phiStep++) {
    for (let thetaStep = 0; thetaStep < thetaSegments; thetaStep++) {
      const bottomLeft = phiStep * (thetaSegments + 1) + thetaStep;
      const bottomRight = bottomLeft + 1;
      const topLeft = bottomLeft + thetaSegments + 1;
      const topRight = topLeft + 1;
      indices.push(bottomLeft, bottomRight, topRight);
      indices.push(bottomLeft, topRight, topLeft);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    tangents: new Float32Array(tangents),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}
