class Mesh {
    constructor({ buffers, scale, position, rotation, cameraView }) {
        this.scale = scale;
        this.position = position;
        this.rotation = rotation;
        this.cameraView = cameraView;
        this.vsSource = `
        attribute vec4 vertexPosition;
        attribute vec4 vertexColor;
        attribute vec3 vertexNormal;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat4 normalMatrix;
        varying lowp vec4 vColor;
        varying highp vec3 vLighting;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;
          vColor = vertexColor;
          highp vec3 ambientLight = vec3(0.2, 0.2, 0.2);
          highp vec3 directionalLightColor = vec3(1.0, 1.0, 1.0);
          highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
          highp vec4 transformedNormal = normalMatrix * vec4(vertexNormal, 1.0);
          highp float directional = (dot(normalize(transformedNormal.xyz), directionalVector) + 1.0) / 2.0;
          vLighting = ambientLight + 0.8 * (directionalLightColor * directional);
        }
        `;
        this.fsSource = `
        varying lowp vec4 vColor;
        varying highp vec3 vLighting;

        void main() {
          gl_FragColor = vColor * vec4(vLighting, 1.0);
        }
        `;
        this.shaderProgram = initShaderProgram(gl, this.vsSource, this.fsSource);
        this.programInfo = {
            program: this.shaderProgram,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(this.shaderProgram, 'vertexPosition'),
                vertexColor: gl.getAttribLocation(this.shaderProgram, 'vertexColor'),
                vertexNormal: gl.getAttribLocation(this.shaderProgram, 'vertexNormal')
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(this.shaderProgram, 'projectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(this.shaderProgram, 'modelViewMatrix'),
                normalMatrix: gl.getUniformLocation(this.shaderProgram, 'normalMatrix')
            },
        };
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(buffers.position),
            gl.STATIC_DRAW);
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(buffers.color), gl.STATIC_DRAW);
        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(buffers.normal), gl.STATIC_DRAW);
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(buffers.indices), gl.STATIC_DRAW);
        this.buffers = buffers;
        this.matrix = mat4.create();
        mat4.translate(this.matrix, this.matrix, this.position);
        mat4.scale(this.matrix, this.matrix, this.scale);
        mat4.rotateX(this.matrix, this.matrix, this.rotation[0]);
        mat4.rotateY(this.matrix, this.matrix, this.rotation[1]);
        mat4.rotateZ(this.matrix, this.matrix, this.rotation[2]);
        this.normalMatrix = mat4.create();
        mat4.invert(this.normalMatrix, this.matrix);
        mat4.transpose(this.normalMatrix, this.normalMatrix);
    }
    draw(projectionMatrix) {
        /*if (this.cameraView) {
            this.position = [...cameraPos.map(x => x * -1)];
            this.position[0] += -projectionMatrix[8];
            this.position[0] += -projectionMatrix[9];
            this.position[0] += -projectionMatrix[10];
        }*/
        mat4.set(this.matrix, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        mat4.translate(this.matrix, this.matrix, this.position);
        mat4.scale(this.matrix, this.matrix, this.scale);
        mat4.rotateX(this.matrix, this.matrix, this.rotation[0]);
        mat4.rotateY(this.matrix, this.matrix, this.rotation[1]);
        mat4.rotateZ(this.matrix, this.matrix, this.rotation[2]);
        if (this.cameraView) {
            if (!this.tilt) {
                this.tilt = { x: 0, y: 0 };
            }
            const slowBob = Math.sin(performance.now() / 1000);
            const fastBob = Math.sin(performance.now() / 250);
            const factor = Math.min((Math.abs(cameraVel[0]) + Math.abs(cameraVel[2])), 0.15) / 0.15;
            const bob = slowBob * (1 - factor) + factor * fastBob;
            this.tilt.x += mouseDelta.x;
            this.tilt.y += mouseDelta.y;
            mouseDelta.x = 0;
            mouseDelta.y = 0;
            this.tilt.x *= 0.9;
            this.tilt.y *= 0.9;
            this.tilt.x = Math.max(Math.min(this.tilt.x, Math.PI / 4), -Math.PI / 4);
            this.tilt.y = Math.max(Math.min(this.tilt.y, Math.PI / 4), -Math.PI / 4);
            const playerMat = mat4.create();
            /*const pos = cameraPos.map(x => x * -1);
            //pos[1] += 1 * Math.sin(-cameraRot.x);
            pos[0] -= 1 * Math.sin(-cameraRot.y);
            pos[2] -= 1 * Math.cos(-cameraRot.y);*/
            mat4.rotateX(playerMat, playerMat, cameraRot.x);
            mat4.rotateY(playerMat, playerMat, cameraRot.y);
            mat4.translate(playerMat, playerMat, cameraPos);
            mat4.copy(this.matrix, playerMat);
            mat4.invert(this.matrix, this.matrix);
            const scale = mat4.create();
            mat4.translate(scale, scale, [0.55 / 2, -0.56 / 2 + 0.015 * bob, -0.5]);
            mat4.rotateX(scale, scale, -cameraPos[1] * 0.05 - 0.5 * this.tilt.x);
            mat4.rotateY(scale, scale, Math.PI / 2 - 0.5 * this.tilt.y);
            mat4.scale(scale, scale, [0.1 * 1.35, 0.075 * 1.35, 0.08 * 1.35]);
            mat4.multiply(this.matrix, this.matrix, scale)
        }
        mat4.set(this.normalMatrix, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        mat4.invert(this.normalMatrix, this.matrix);
        mat4.transpose(this.normalMatrix, this.normalMatrix); {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
            gl.vertexAttribPointer(
                this.programInfo.attribLocations.vertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                this.programInfo.attribLocations.vertexPosition);
        } {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
            gl.vertexAttribPointer(
                this.programInfo.attribLocations.vertexNormal,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                this.programInfo.attribLocations.vertexNormal);
        } {
            const numComponents = 4;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
            gl.vertexAttribPointer(
                this.programInfo.attribLocations.vertexColor,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                this.programInfo.attribLocations.vertexColor);
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.useProgram(this.programInfo.program);
        gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix);
        gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.modelViewMatrix,
            false,
            this.matrix);
        gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.normalMatrix,
            false,
            this.normalMatrix); {
            const offset = 0;
            const vertexCount = this.buffers.indices.length;
            gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_SHORT, offset);
        }
    }
}