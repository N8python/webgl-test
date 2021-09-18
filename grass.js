class Grass {
    constructor({ buffers, positions, rotations, scales, count, frozen, swayAmt = 1, compress = true }) {
        this.buffers = buffers;
        this.count = count;
        this.positions = positions;
        this.rotations = rotations;
        this.scales = scales;
        this.static = frozen;
        this.done = false;
        this.vsSource = `
        attribute vec4 vertexPosition;
        attribute vec4 vertexColor;
        attribute vec3 vertexNormal;
        attribute mat4 modelViewMatrix;
        attribute mat4 normalMatrix;
        attribute float swayOffset;
        attribute float swayMag;
        attribute float swayTime;
        attribute float swayTime2;
        uniform mat4 projectionMatrix;
        uniform vec3 cameraPos;
        uniform highp float time;
        varying lowp vec4 vColor;
        varying highp vec3 vLighting;
        mat4 rotationMatrix(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}
        void main() {
            vec3 position = (modelViewMatrix * vertexPosition).xyz;
          vec3 awayFromPlayer = position - cameraPos;
          float playerDist = distance(cameraPos, position);
          vec3 finalPosition = vertexPosition.xyz;
          float height = position.y;
          mat4 swayR = rotationMatrix(vec3(1.0, 0.0, 0.0), 0.2 * swayMag * ${swayAmt.toFixed(6)} * (height + 0.5) * 2.0 * (0.5 * sin(time / swayTime + swayOffset) + 0.5 * cos(time / swayTime2 + swayOffset)));
          if (playerDist < 2.0 && ${compress}) {
            finalPosition.y -= 0.5 * (1.0 - (playerDist / 2.0));
            gl_Position = projectionMatrix * modelViewMatrix * rotationMatrix(vec3(1.0, 0.0, 0.0), 1.57 * (1.0 - pow((playerDist / 2.0), 2.0))) * swayR * vec4(finalPosition, 1.0);
          } else {
            gl_Position = projectionMatrix * modelViewMatrix * swayR * vec4(finalPosition, 1.0);

          }
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
                normalMatrix: gl.getAttribLocation(this.shaderProgram, 'normalMatrix'),
                swayOffset: gl.getAttribLocation(this.shaderProgram, "swayOffset"),
                swayMag: gl.getAttribLocation(this.shaderProgram, "swayMag"),
                swayTime: gl.getAttribLocation(this.shaderProgram, "swayTime"),
                swayTime2: gl.getAttribLocation(this.shaderProgram, "swayTime2")
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(this.shaderProgram, 'projectionMatrix'),
                cameraPos: gl.getUniformLocation(this.shaderProgram, "cameraPos"),
                time: gl.getUniformLocation(this.shaderProgram, "time")
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
        this.offsetBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.offsetBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Array(this.count).fill(() => Math.PI * 2 * Math.random()).map(x => x())), gl.STATIC_DRAW);
        this.magBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.magBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Array(this.count).fill(() => 1.25 * Math.random()).map(x => x())), gl.STATIC_DRAW);
        this.timeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.timeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Array(this.count).fill(() => (750 + 750 * Math.random()) * (1 / swayAmt) ** 0.5).map(x => x())), gl.STATIC_DRAW);
        this.timeBuffer2 = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.timeBuffer2);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Array(this.count).fill(() => (750 + 750 * Math.random()) * (1 / swayAmt) ** 0.5).map(x => x())), gl.STATIC_DRAW);
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
        if (this.static && !this.done) {
            this.matrices.forEach((matrix, i) => {
                mat4.set(matrix, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
                mat4.translate(matrix, matrix, this.positions[i]);
                mat4.scale(matrix, matrix, this.scales[i]);
                mat4.rotateX(matrix, matrix, this.rotations[i][0] /* + 0.2 * Math.sin(performance.now() / 1000)*/ );
                mat4.rotateY(matrix, matrix, this.rotations[i][1]);
                mat4.rotateZ(matrix, matrix, this.rotations[i][2]);
            });
            this.normalMatrices.forEach((matrix, i) => {
                mat4.set(matrix, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
                mat4.invert(matrix, this.matrices[i]);
                mat4.transpose(matrix, matrix);
            });
            this.done = true;
        }
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
            gl.bindBuffer(gl.ARRAY_BUFFER, this.offsetBuffer);
            gl.enableVertexAttribArray(this.programInfo.attribLocations.swayOffset);
            gl.vertexAttribPointer(this.programInfo.attribLocations.swayOffset, 1, gl.FLOAT, false, 0, 0);
            // this line says this attribute only changes for each 1 instance
            corruptedLocs.push(this.programInfo.attribLocations.swayOffset);
            instancing.vertexAttribDivisorANGLE(this.programInfo.attribLocations.swayOffset, 1);

        } {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.magBuffer);
            gl.enableVertexAttribArray(this.programInfo.attribLocations.swayMag);
            gl.vertexAttribPointer(this.programInfo.attribLocations.swayMag, 1, gl.FLOAT, false, 0, 0);
            // this line says this attribute only changes for each 1 instance
            corruptedLocs.push(this.programInfo.attribLocations.swayMag);
            instancing.vertexAttribDivisorANGLE(this.programInfo.attribLocations.swayMag, 1);
        } {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.timeBuffer);
            gl.enableVertexAttribArray(this.programInfo.attribLocations.swayTime);
            gl.vertexAttribPointer(this.programInfo.attribLocations.swayTime, 1, gl.FLOAT, false, 0, 0);
            // this line says this attribute only changes for each 1 instance
            corruptedLocs.push(this.programInfo.attribLocations.swayTime);
            instancing.vertexAttribDivisorANGLE(this.programInfo.attribLocations.swayTime, 1);
        } {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.timeBuffer2);
            gl.enableVertexAttribArray(this.programInfo.attribLocations.swayTime2);
            gl.vertexAttribPointer(this.programInfo.attribLocations.swayTime2, 1, gl.FLOAT, false, 0, 0);
            // this line says this attribute only changes for each 1 instance
            corruptedLocs.push(this.programInfo.attribLocations.swayTime2);
            instancing.vertexAttribDivisorANGLE(this.programInfo.attribLocations.swayTime2, 1);
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
            projectionMatrix);
        gl.uniform3f(this.programInfo.uniformLocations.cameraPos, ...cameraPos.map(x => -x));
        gl.uniform1f(this.programInfo.uniformLocations.time, performance.now()); {
            const offset = 0;
            const vertexCount = this.buffers.indices.length;
            instancing.drawElementsInstancedANGLE(gl.TRIANGLES, vertexCount, gl.UNSIGNED_SHORT, offset, this.count);
        }
        corruptedLocs.forEach(loc => {
            instancing.vertexAttribDivisorANGLE(loc, 0);
        });
    }
}