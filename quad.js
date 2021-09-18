class Quad {
    constructor({ scale, position, rotation, color, texture, size, zrot = 0, clip = 0.1 }) {
        this.scale = scale;
        this.position = position;
        this.rotation = rotation;
        this.texture = texture;
        this.vsSource = `
        attribute vec4 vertexPosition;
        attribute vec2 textureCoord;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat4 viewMatrix;
        varying highp vec2 vTextureCoord;
        void main() {
            vec3 camera_Up = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
            vec3 camera_Right = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
            vec3 position = vec3(${position.join(", ")}) + camera_Up * vertexPosition.x * ${(-size).toFixed(6)} + camera_Right * vertexPosition.y * ${size.toFixed(6)};
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            vTextureCoord = textureCoord;
        }
        `
        this.fsSource = `
        #extension GL_EXT_frag_depth : enable
        varying lowp vec4 vColor;
        varying highp vec3 vLighting;
        varying highp vec2 vTextureCoord;
        uniform sampler2D uSampler;
        void main() {
          gl_FragColor = vec4(${color.join(", ")}, 1.0) * texture2D(uSampler, vTextureCoord);
          if (texture2D(uSampler, vTextureCoord).w < ${clip}) {
            gl_FragDepthEXT = 1.0;
          } else {
            gl_FragDepthEXT = gl_FragCoord.z;
          }
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
                viewMatrix: gl.getUniformLocation(this.shaderProgram, "viewMatrix"),
                uSampler: gl.getUniformLocation(this.shaderProgram, 'uSampler')
            },
        };
        const positions = [-0.5, -0.5, 0.0,
            0.5, -0.5, 0.0, 0.5, 0.5, 0.0, -0.5, 0.5, 0.0,
        ];
        for (let i = 0; i < 3; i++) {
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            positions[i * 3] = x * Math.cos(zrot) - y * Math.sin(zrot);
            positions[i * 3 + 1] = x * Math.sin(zrot) + y * Math.cos(zrot);
        }
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positions),
            gl.STATIC_DRAW);
        const texCoords = [
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,
        ]
        this.textureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(texCoords),
            gl.STATIC_DRAW);
        const indices = [0, 1, 2, 0, 2, 3];
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        this.texture = texture;
        this.matrix = mat4.create();
    }
    draw(projectionMatrix) {
        mat4.set(this.matrix, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        mat4.translate(this.matrix, this.matrix, this.position);
        mat4.scale(this.matrix, this.matrix, this.scale);
        mat4.rotateX(this.matrix, this.matrix, this.rotation[0]);
        mat4.rotateY(this.matrix, this.matrix, this.rotation[1]);
        mat4.rotateZ(this.matrix, this.matrix, this.rotation[2]); {
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
        const viewMatrix = mat4.create();
        mat4.rotateX(viewMatrix, viewMatrix, cameraRot.x);
        mat4.rotateY(viewMatrix, viewMatrix, cameraRot.y);
        mat4.translate(viewMatrix, viewMatrix, cameraPos);
        //mat4.invert(viewMatrix, viewMatrix);
        gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.viewMatrix,
            false,
            viewMatrix);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0); {
            const offset = 0;
            const vertexCount = 6;
            gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_SHORT, offset);
        }
    }
}