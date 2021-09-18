class InstancedMesh {
    constructor({ buffers, positions, rotations, scales, count }) {
        this.buffers = buffers;
        this.count = count;
        this.positions = positions;
        this.rotations = rotations;
        this.scales = scales;
        this.vsSource = `
        attribute vec4 vertexPosition;
        attribute vec4 vertexColor;
        attribute vec3 vertexNormal;
        attribute mat4 modelViewMatrix;
        attribute mat4 normalMatrix;
        uniform mat4 projectionMatrix;
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
                vertexNormal: gl.getAttribLocation(this.shaderProgram, 'vertexNormal'),
                modelViewMatrix: gl.getAttribLocation(this.shaderProgram, 'modelViewMatrix'),
                normalMatrix: gl.getAttribLocation(this.shaderProgram, 'normalMatrix')
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(this.shaderProgram, 'projectionMatrix')
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
        const matrixData = new Float32Array(this.count * 16);
        const matrices = [];
        for (let i = 0; i < this.count; ++i) {
            const byteOffsetToMatrix = i * 16 * 4;
            const numFloatsForView = 16;
            matrices.push(new Float32Array(
                matrixData.buffer,
                byteOffsetToMatrix,
                numFloatsForView));
        }
        const normalMatrixData = new Float32Array(this.count * 16);
        const normalMatrices = [];
        for (let i = 0; i < this.count; ++i) {
            const byteOffsetToMatrix = i * 16 * 4;
            const numFloatsForView = 16;
            normalMatrices.push(new Float32Array(
                normalMatrixData.buffer,
                byteOffsetToMatrix,
                numFloatsForView));
        }
        this.matrixData = matrixData;
        this.normalMatrixData = normalMatrixData;
        this.matrices = matrices;
        this.normalMatrices = normalMatrices;
        this.matrixBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.matrixBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.matrixData, gl.DYNAMIC_DRAW);
        this.normalMatrixBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalMatrixBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.normalMatrixData.byteLength, gl.DYNAMIC_DRAW);
    }
    draw(projectionMatrix) {
        this.matrices.forEach((matrix, i) => {
            mat4.set(matrix, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
            mat4.translate(matrix, matrix, this.positions[i]);
            mat4.scale(matrix, matrix, this.scales[i]);
            mat4.rotateX(matrix, matrix, this.rotations[i][0]);
            mat4.rotateY(matrix, matrix, this.rotations[i][1]);
            mat4.rotateZ(matrix, matrix, this.rotations[i][2]);
        });
        this.normalMatrices.forEach((matrix, i) => {
            mat4.set(matrix, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
            mat4.invert(matrix, this.matrices[i]);
            mat4.transpose(matrix, matrix);
        });
        let corruptedLocs = []; {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.matrixBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.matrixData);
            const bytesPerMatrix = 4 * 16;
            for (let i = 0; i < 4; i++) {
                const loc = this.programInfo.attribLocations.modelViewMatrix + i;
                gl.enableVertexAttribArray(loc);
                const offset = i * 16;
                gl.vertexAttribPointer(
                    loc, // location
                    4, // size (num values to pull from buffer per iteration)
                    gl.FLOAT, // type of data in buffer
                    false, // normalize
                    bytesPerMatrix, // stride, num bytes to advance to get to next set of values
                    offset, // offset in buffer
                ); // i know what this does ;)
                corruptedLocs.push(loc);
                instancing.vertexAttribDivisorANGLE(loc, 1);
            }
        } {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.normalMatrixBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.normalMatrixData);
            const bytesPerMatrix = 4 * 16;
            for (let i = 0; i < 4; i++) {
                const loc = this.programInfo.attribLocations.normalMatrix + i;
                const offset = i * 16;
                gl.vertexAttribPointer(
                    loc, // location
                    4, // size (num values to pull from buffer per iteration)
                    gl.FLOAT, // type of data in buffer
                    false, // normalize
                    bytesPerMatrix, // stride, num bytes to advance to get to next set of values
                    offset, // offset in buffer
                ); // i know what this does ;)
                corruptedLocs.push(loc);
                instancing.vertexAttribDivisorANGLE(loc, 1);
            }
        } {
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
            //instancing.vertexAttribDivisorANGLE(this.programInfo.attribLocations.vertexPosition, 0);
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
            // instancing.vertexAttribDivisorANGLE(this.programInfo.attribLocations.vertexNormal, 0);
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
            //instancing.vertexAttribDivisorANGLE(this.programInfo.attribLocations.vertexColor, 0);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.useProgram(this.programInfo.program);
        gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix); {
            const offset = 0;
            const vertexCount = this.buffers.indices.length;
            instancing.drawElementsInstancedANGLE(gl.TRIANGLES, vertexCount, gl.UNSIGNED_SHORT, offset, this.count);
        }
        corruptedLocs.forEach(loc => {
            instancing.vertexAttribDivisorANGLE(loc, 0);
        });
    }
}