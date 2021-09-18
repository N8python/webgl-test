class Cube {
    constructor({ scale, position, rotation, color: colorInput, texture, repeat = 1, manualset }) {
        this.scale = scale;
        this.position = position;
        this.rotation = rotation;
        this.texture = texture;
        this.manualset = manualset;
        this.vsSource = `
        attribute vec4 vertexPosition;
        attribute vec4 vertexColor;
        attribute vec3 vertexNormal;
        ${texture ? "attribute vec2 textureCoord;": ""}
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat4 normalMatrix;
        varying lowp vec4 vColor;
        varying highp vec3 vLighting;
        ${texture ? "varying highp vec2 vTextureCoord;": ""}
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;
          vColor = vertexColor;
          highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
          highp vec3 directionalLightColor = vec3(1.0, 1.0, 1.0);
          highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
          highp vec4 transformedNormal = normalMatrix * vec4(vertexNormal, 1.0);
          highp float directional = (dot(normalize(transformedNormal.xyz), directionalVector) + 1.0) / 2.0;
          vLighting = ambientLight + 0.6 * (directionalLightColor * directional);
          ${texture ? "vTextureCoord = textureCoord;": ""}
        }
        `;
        this.fsSource = `
        varying lowp vec4 vColor;
        varying highp vec3 vLighting;
        ${ texture ? "varying highp vec2 vTextureCoord;" : ""}
        ${ texture ? "uniform sampler2D uSampler;" : ""}

        void main() {
          gl_FragColor = vColor * vec4(vLighting, 1.0)${texture ? " * texture2D(uSampler, vTextureCoord)": ""};
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
        if (texture) {
            this.programInfo.attribLocations.textureCoord = gl.getAttribLocation(this.shaderProgram, "textureCoord");
            this.programInfo.uniformLocations.uSampler = gl.getUniformLocation(this.shaderProgram, 'uSampler');
        }
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        const positions = [
            // Front face
            -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0,
            1.0, 1.0, 1.0, -1.0, 1.0, 1.0,

            // Back face
            -1.0, -1.0, -1.0, -1.0, 1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, -1.0, -1.0,

            // Top face
            -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, -1.0,

            // Bottom face
            -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, -1.0, 1.0, -1.0, -1.0, 1.0,

            // Right face
            1.0, -1.0, -1.0,
            1.0, 1.0, -1.0,
            1.0, 1.0, 1.0,
            1.0, -1.0, 1.0,

            // Left face
            -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positions),
            gl.STATIC_DRAW);
        const faceColors = colorInput;
        const colors = faceColors.map(c => [c, c, c, c]).flat(Infinity);
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
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
        const vertexNormals = [
            // Front
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,

            // Back
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,

            // Top
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,

            // Bottom
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,

            // Right
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,

            // Left
            -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0
        ];
        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
        const textureCoordinates = [
            // Front
            0.0, 0.0,
            repeat, 0.0,
            repeat, repeat,
            0.0, repeat,
            // Back
            0.0, 0.0,
            repeat, 0.0,
            repeat, repeat,
            0.0, repeat,
            // Top
            0.0, 0.0,
            repeat, 0.0,
            repeat, repeat,
            0.0, repeat,
            // Bottom
            0.0, 0.0,
            repeat, 0.0,
            repeat, repeat,
            0.0, repeat,
            // Right
            0.0, 0.0,
            repeat, 0.0,
            repeat, repeat,
            0.0, repeat,
            // Left
            0.0, 0.0,
            repeat, 0.0,
            repeat, repeat,
            0.0, repeat,
        ];
        this.textureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
        this.buffers = {
            position: this.positionBuffer,
            color: this.colorBuffer,
            indices: this.indexBuffer,
            normal: this.normalBuffer,
            textureCoord: this.textureCoordBuffer
        }
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
        if (!this.manualset) {
            mat4.set(this.matrix, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
            mat4.translate(this.matrix, this.matrix, this.position);
            mat4.scale(this.matrix, this.matrix, this.scale);
            mat4.rotateX(this.matrix, this.matrix, this.rotation[0]);
            mat4.rotateY(this.matrix, this.matrix, this.rotation[1]);
            mat4.rotateZ(this.matrix, this.matrix, this.rotation[2]);
        }
        mat4.set(this.normalMatrix, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        mat4.invert(this.normalMatrix, this.matrix);
        mat4.transpose(this.normalMatrix, this.normalMatrix); {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
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
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.normal);
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
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);
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
        if (this.texture) {
            {
                const num = 2;
                const type = gl.FLOAT;
                const normalize = false;
                const stride = 0;
                const offset = 0;
                gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.textureCoord);
                gl.vertexAttribPointer(this.programInfo.attribLocations.textureCoord, num, type, normalize, stride, offset);
                gl.enableVertexAttribArray(this.programInfo.attribLocations.textureCoord);
            }
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
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
            this.normalMatrix);
        if (this.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);
        } {
            const offset = 0;
            const vertexCount = 36;
            gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_SHORT, offset);
        }
    }
}