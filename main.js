const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl");
const instancing = gl.getExtension('ANGLE_instanced_arrays');
const depthtex = gl.getExtension('WEBGL_depth_texture');
const fragdepth = gl.getExtension("EXT_frag_depth");
let cameraRot = { x: 0, y: 0 };
let cameraPos = [0, -1, 0];
let cameraVel = [0, 0, 0];
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.enable(gl.BLEND)
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

const keys = {};
const grass = loadTexture(gl, 'grass.jpeg');
const bricks = loadTexture(gl, 'bricks.jpeg');
const metal = loadTexture(gl, "metal.jpeg");
const skyboxTex = loadTexture(gl, "skybox-large.jpeg");
const particleTex = loadTexture(gl, "heart.png");
const treeTex = loadTexture(gl, "tree.png");
const waterNormalTex = loadTexture(gl, "pondmap.jpeg");
const waterNormalTex2 = loadTexture(gl, "pondmap2.jpeg");
const cube = new Cube({
    scale: [1, 1, 1],
    position: [0, 0.55, -6],
    rotation: [0, 0, 0],
    color: [
        [1.0, 1.0, 1.0, 1.0], // Front face: white
        [1.0, 0.0, 0.0, 1.0], // Back face: red
        [0.0, 0.75, 0.25, 1.0], // Top face: green
        [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
        [1.0, 1.0, 0.0, 1.0], // Right face: yellow
        [1.0, 0.0, 1.0, 1.0], // Left face: purple
    ]
});
const pole = new Cube({
    scale: [0.5, 5, 0.5],
    position: [10, 2.55, 2.5],
    rotation: [0, 0, 0],
    color: [
        [1.0, 1.0, 1.0, 1.0],
        [1.0, 1.0, 1.0, 1.0],
        [1.0, 1.0, 1.0, 1.0],
        [1.0, 1.0, 1.0, 1.0],
        [1.0, 1.0, 1.0, 1.0],
        [1.0, 1.0, 1.0, 1.0],
    ],
    texture: metal
});
const spinny = new Cube({
    scale: [0.5, 0.5, 0.5],
    position: [-5, 0.55, 3],
    rotation: [0, 0, 0],
    color: [
        [1.0, 1.0, 1.0, 1.0], // Front face: white
        [1.0, 0.0, 0.0, 1.0], // Back face: red
        [0.0, 0.75, 0.25, 1.0], // Top face: green
        [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
        [1.0, 1.0, 0.0, 1.0], // Right face: yellow
        [1.0, 0.0, 1.0, 1.0], // Left face: purple
    ],
    texture: bricks,
    repeat: 1
});
const ground = new Cube({
    scale: [200, 0.1, 200],
    position: [0, -0.45, 0],
    rotation: [0, 0, 0],
    color: [
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0]
    ],
    texture: grass,
    repeat: 8
});
const testQuad = new Quad({
    position: [-3, 0.5, 3],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    color: [1, 1, 1],
    size: 1,
    texture: particleTex
});
const testQuad2 = new Quad({
    position: [-4, 0.47, 4.5],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    color: [1, 1, 1],
    size: 2.5,
    clip: 0.6,
    texture: treeTex
});
const water = new Water({
    position: [6, 0.4, 6],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    normal: waterNormalTex,
    normal2: waterNormalTex2
})
const waterWalls = [new Cube({
    scale: [1.15, 0.3, 0.1],
    position: [6, 0.3, 7.05],
    rotation: [0, 0, 0],
    color: [
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0]
    ],
    texture: bricks,
    repeat: 1
}), new Cube({
    scale: [1.15, 0.3, 0.1],
    position: [6, 0.3, 4.95],
    rotation: [0, 0, 0],
    color: [
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0]
    ],
    texture: bricks,
    repeat: 1
}), new Cube({
    scale: [0.1, 0.3, 1.15],
    position: [7.0501, 0.3001, 6.001],
    rotation: [0, 0, 0],
    color: [
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0]
    ],
    texture: bricks,
    repeat: 1
}), new Cube({
    scale: [0.1, 0.3, 1.15],
    position: [4.9501, 0.3001, 6.001],
    rotation: [0, 0, 0],
    color: [
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0],
        [0.75, 0.75, 0.75, 1.0]
    ],
    texture: bricks,
    repeat: 1
})];
const skybox = new Skybox(100, skyboxTex);
let chair;
let instancedChair;
(async() => {
    const chairBuffers = await ObjectLoader.load("chair.obj", "chair.mtl");
    chair = new Mesh({
        buffers: chairBuffers,
        scale: [0.3, 0.3, 0.3],
        position: [5, -0.3, -5],
        rotation: [0, 0, 0]
    })
    objects.push(chair);
})();
let tree;
let tree2;
let instancedTree;
(async() => {
    const treeBuffers = await ObjectLoader.load("darktree.obj", "darktree.mtl");
    tree = new Mesh({
        buffers: treeBuffers,
        scale: [0.3, 0.3, 0.3],
        position: [-5, -0.3, 9],
        rotation: [0, 0, 0]
    });
    tree2 = new Mesh({
        buffers: treeBuffers,
        scale: [0.35, 0.35, 0.35],
        position: [9, -0.3, -5],
        rotation: [0, Math.PI / 2, 0]
    });
    let positions = [];
    let scales = [];
    let rotations = [];
    for (let i = 1; i < 99; i++) {
        for (let j = 1; j < 99; j++) {
            if (Math.abs(i - 50) + Math.abs(j - 50) < 7) {
                continue;
            }
            let offsetX = (Math.random() - 0.5) * 4;
            let offsetY = (Math.random() - 0.5) * 4;
            positions.push([4 * (i - 50) + offsetX, -0.3, 4 * (j - 50) + offsetY])
            rotations.push([0, Math.random() * Math.PI * 2, 0]);
            let scale = 0.2 + 0.3 * Math.random()
            scales.push([scale, scale, scale]);
        }
    }
    instancedTree = new Grass({
        buffers: treeBuffers,
        positions,
        rotations,
        scales,
        count: positions.length,
        frozen: true,
        swayAmt: 0.1,
        compress: false
    });
    objects.push(instancedTree);
})();
let mario;
(async() => {
    const marioBuffers = await ObjectLoader.load("mario2.obj", "mario2.mtl");
    mario = new Mesh({
        buffers: marioBuffers,
        scale: [0.05, 0.05, 0.05],
        position: [3, -0.3, 3],
        rotation: [0, Math.PI / 4, 0]
    });
    objects.push(mario);
})();
let pistol;
(async() => {
    const pistolBuffers = await ObjectLoader.load("stick.obj", "stick.mtl");
    pistol = new Mesh({
        buffers: pistolBuffers,
        scale: [0.01, 0.01, 0.01],
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        cameraView: true
    })
    objects.push(pistol);
})();
let grassObj;
(async() => {
    const grassBuffers = await ObjectLoader.load("grass-small.obj", "grass.mtl");
    let positions = [];
    let scales = [];
    let rotations = [];
    for (let i = 0; i < 250000; i++) {
        let mag = Math.sqrt(Math.random()) * 20;
        let angle = Math.random() * Math.PI * 2;
        let scale = 0.25 + Math.random() * 0.5;
        positions.push([mag * Math.sin(angle), -0.3, mag * Math.cos(angle)]);
        rotations.push([Math.random() * 0.3 - 0.15, Math.random() * Math.PI * 2, Math.random() * 0.3 - 0.15]);
        scales.push([scale * (0.7 + Math.random() * 0.6), scale * (0.7 + Math.random() * 0.6) * 0.75, scale * (0.7 + Math.random() * 0.6)]);
    }
    grassObj = new Grass({
        buffers: grassBuffers,
        positions,
        rotations,
        scales,
        count: positions.length,
        frozen: true
    });
    objects.push(grassObj);
})();
const objects = [];
objects.push(cube);
objects.push(ground);
objects.push(pole);
objects.push(spinny);
objects.push(skybox);
waterWalls.forEach(cube => {
    objects.push(cube);
})
const alphaObjects = [];
alphaObjects.push(testQuad);
alphaObjects.push(testQuad2);
alphaObjects.push(water);
const quad = new RenderQuad();

function main() {
    stats.begin();
    if (keys["w"]) {
        cameraVel[0] -= 0.025 * Math.sin(cameraRot.y);
        cameraVel[2] += 0.025 * Math.cos(cameraRot.y);
    }
    if (keys["s"]) {
        cameraVel[0] += 0.025 * Math.sin(cameraRot.y);
        cameraVel[2] -= 0.025 * Math.cos(cameraRot.y);
    }
    if (keys["a"]) {
        cameraVel[0] -= 0.025 * Math.sin(cameraRot.y - Math.PI / 2);
        cameraVel[2] += 0.025 * Math.cos(cameraRot.y - Math.PI / 2);
    }
    if (keys["d"]) {
        cameraVel[0] -= 0.025 * Math.sin(cameraRot.y + Math.PI / 2);
        cameraVel[2] += 0.025 * Math.cos(cameraRot.y + Math.PI / 2);
    }
    let jumped = false;
    if (keys[" "] && cameraPos[1] === -1) {
        jumped = true;
        cameraVel[1] -= 0.75;
    }
    if (cameraPos[1] < -1) {
        cameraVel[1] += 0.015;
    } else {
        cameraPos[1] = -1;
        if (!jumped) {
            cameraVel[1] = 0;
        }
    }
    cameraPos[0] += cameraVel[0];
    cameraPos[1] += cameraVel[1];
    cameraPos[2] += cameraVel[2];
    cameraVel[0] *= 0.9;
    cameraVel[1] *= 0.9;
    cameraVel[2] *= 0.9;
    water.reset();
    const targetTextureWidth = canvas.width;
    const targetTextureHeight = canvas.height;
    const depthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    const renderTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, renderTexture); {
        const level = 0;
        const internalFormat = gl.RGBA;
        const border = 0;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;
        const data = null;
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
            targetTextureWidth, targetTextureHeight, border,
            format, type, data);

        // set the filtering so we don't need mips
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    } {
        // define size and format of level 0
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        const level = 0;
        const internalFormat = gl.DEPTH_COMPONENT;
        const border = 0;
        const format = gl.DEPTH_COMPONENT;
        const type = gl.UNSIGNED_INT;
        const data = null;
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
            targetTextureWidth, targetTextureHeight, border,
            format, type, data);

        // set the filtering so we don't need mips
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        const depthBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

        // make a depth buffer and the same size as the targetTexture
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, targetTextureWidth, targetTextureHeight);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
        // attach the texture as the first color attachment
        //const attachmentPoint = gl.COLOR_ATTACHMENT0;
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, level);
        gl.bindTexture(gl.TEXTURE_2D, renderTexture);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, renderTexture, level);
    }
    gl.clearColor(0.0, 1.0, 1.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const fieldOfView = 55 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 200.0;
    cameraRot.x = Math.min(Math.max(cameraRot.x, -Math.PI / 1.9), Math.PI / 1.9)
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    //mat4.rotateZ(projectionMatrix, projectionMatrix, 0.1);
    mat4.rotateX(projectionMatrix, projectionMatrix, cameraRot.x);
    mat4.rotateY(projectionMatrix, projectionMatrix, cameraRot.y);
    mat4.translate(projectionMatrix, projectionMatrix, cameraPos);
    spinny.rotation[1] = performance.now() / 1000;
    spinny.rotation[2] = performance.now() / 1000;
    if (chair) {
        chair.rotation[1] += 0.01;
    }
    objects.forEach(object => {
        object.draw(projectionMatrix);
    });
    alphaObjects.sort((a, b) => {
        return vec3.dist(b.position, cameraPos.map(x => x * -1)) - vec3.dist(a.position, cameraPos.map(x => x * -1))
    });
    alphaObjects.forEach(object => {
        object.draw(projectionMatrix);
    });
    const refracRenderTexture = gl.createTexture();
    const refracDepthTexture = gl.createTexture(); {
        gl.bindTexture(gl.TEXTURE_2D, refracRenderTexture);
        const level = 0;
        const internalFormat = gl.RGBA;
        const border = 0;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;
        const data = null;
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
            targetTextureWidth, targetTextureHeight, border,
            format, type, data);

        // set the filtering so we don't need mips
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    } {
        // define size and format of level 0
        gl.bindTexture(gl.TEXTURE_2D, refracDepthTexture);
        const level = 0;
        const internalFormat = gl.DEPTH_COMPONENT;
        const border = 0;
        const format = gl.DEPTH_COMPONENT;
        const type = gl.UNSIGNED_INT;
        const data = null;
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
            targetTextureWidth, targetTextureHeight, border,
            format, type, data);

        // set the filtering so we don't need mips
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        const depthBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

        // make a depth buffer and the same size as the targetTexture
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, targetTextureWidth, targetTextureHeight);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
        // attach the texture as the first color attachment
        //const attachmentPoint = gl.COLOR_ATTACHMENT0;
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, refracDepthTexture, level);
        gl.bindTexture(gl.TEXTURE_2D, renderTexture);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, refracRenderTexture, level);
    }
    water.draw(projectionMatrix);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    skybox.draw(projectionMatrix);
    quad.texture = renderTexture;
    quad.depthTexture = depthTexture;
    quad.refracDepthTexture = refracDepthTexture;
    quad.shadowMatrix = mat4.create();
    quad.draw(projectionMatrix);
    stats.end();
    requestAnimationFrame(main);
}
document.onkeydown = (e) => {
    keys[e.key] = true;
}
document.onkeyup = (e) => {
    keys[e.key] = false;
}
document.onclick = () => {
    canvas.requestPointerLock();
}
let mouseDelta = { x: 0, y: 0 };
document.onmousemove = (e) => {
    if (document.pointerLockElement) {
        cameraRot.y += e.movementX * 0.005;
        cameraRot.x += e.movementY * 0.005;
        mouseDelta.x = e.movementY * 0.005;
        mouseDelta.y = e.movementX * 0.005;
    }
}
var stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);
main();