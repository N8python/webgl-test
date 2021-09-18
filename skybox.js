class Skybox {
    constructor(size, texture) {
        this.size = size;
        this.vsSource = `
        attribute vec4 vertexPosition;
        attribute vec2 textureCoord;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying highp vec2 vTextureCoord;
        void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;
            vTextureCoord = textureCoord;
        }
        `
        this.fsSource = `
        varying lowp vec4 vColor;
        varying highp vec3 vLighting;
        varying highp vec2 vTextureCoord;
        uniform sampler2D uSampler;
        void main() {
          gl_FragColor = texture2D(uSampler, vTextureCoord);
        }
        `;
        this.shaderProgram = initShaderProgram(gl, this.vsSource, this.fsSource);
        this.programInfo = {
            program: this.shaderProgram,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(this.shaderProgram, 'vertexPosition'),
                textureCoord: gl.getAttribLocation(this.shaderProgram, 'textureCoord'),
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(this.shaderProgram, 'projectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(this.shaderProgram, 'modelViewMatrix'),
                uSampler: gl.getUniformLocation(this.shaderProgram, 'uSampler')
            },
        };

        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        const positions = [
            // Front face
            -size, -size, size,
            size, -size, size,
            size, size, size, -size, size, size,

            // Back face
            -size, -size, -size, -size, size, -size,
            size, size, -size,
            size, -size, -size,

            // Top face
            -size, size, -size, -size, size, size,
            size, size, size,
            size, size, -size,

            // Bottom face
            -size, -size, -size,
            size, -size, -size,
            size, -size, size, -size, -size, size,

            // Right face
            size, -size, -size,
            size, size, -size,
            size, size, size,
            size, -size, size,

            // Left face
            -size, -size, -size, -size, -size, size, -size, size, size, -size, size, -size,
        ];
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positions),
            gl.STATIC_DRAW);
        const third = 1 / 3;
        const two_thirds = 2 * third;
        const offset = 0.001;
        const textureCoordinates = [
            // Front
            0.25, two_thirds - offset,
            0.5, two_thirds - offset,
            0.5, third + offset,
            0.25, third + offset,
            // Back
            1.0, two_thirds - offset,
            1.0, third + offset,
            0.75, third + offset,
            0.75, two_thirds - offset,
            // Top
            0.25 + offset, offset,
            0.25 + offset, third + offset,
            0.5 - offset, third + offset,
            0.5 - offset, offset,
            // Bottom
            0.25 + offset, two_thirds - offset,
            0.25 + offset, 1.0 - offset,
            0.5 - offset, 1.0 - offset,
            0.5 - offset, two_thirds - offset,
            // Right
            0.75, two_thirds - offset,
            0.75, third + offset,
            0.5, third + offset,
            0.5, two_thirds - offset,
            // Left
            0.0, two_thirds - offset,
            0.25, two_thirds - offset,
            0.25, third + offset,
            0.0, third + offset,
        ];
        this.textureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        const indices = [
            0, 1, 2, 0, 2, 3, // front
            4, 5, 6, 4, 6, 7, // back
            8, 9, 10, 8, 10, 11, // top
            12, 13, 14, 12, 14, 15, // bottom
            16, 17, 18, 16, 18, 19, // right
            20, 21, 22, 20, 22, 23, // left
        ];
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        this.texture = texture;
        this.matrix = mat4.create();
        this.rotation = 0;
    }
    draw(projectionMatrix) {
        mat4.set(this.matrix, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        this.rotation += 0.0001;
        mat4.translate(this.matrix, this.matrix, [-cameraPos[0], -cameraPos[1], -cameraPos[2]]);
        mat4.rotateY(this.matrix, this.matrix, this.rotation); {
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
            const num = 2;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
            gl.vertexAttribPointer(this.programInfo.attribLocations.textureCoord, num, type, normalize, stride, offset);
            gl.enableVertexAttribArray(this.programInfo.attribLocations.textureCoord);
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
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0); {
            const offset = 0;
            const vertexCount = 36;
            gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_SHORT, offset);
        }
    }
}