class Water {
    constructor({ position, rotation, scale, width = 25, height = 25, normal, normal2 }) {
        this.scale = scale;
        this.position = position;
        this.rotation = rotation;
        this.width = width;
        this.height = height;
        this.normal = normal;
        this.normal2 = normal2;
        this.vsSource = `
        attribute vec4 vertexPosition;
        attribute vec4 vertexColor;
        attribute vec3 vertexNormal;
        attribute vec2 textureCoord;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat4 normalMatrix;
        uniform float time;
        varying lowp vec4 vColor;
        varying highp vec3 vLighting;
        varying highp vec3 vPosition;
        varying highp vec3 vNormal;
        varying highp vec2 vTextureCoord;
        vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
float cnoise(vec3 P){
    vec3 Pi0 = floor(P); // Integer part for indexing
    vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;
  
    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
  
    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  
    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  
    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
  
    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;
  
    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);
  
    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
    return 2.2 * n_xyz;
  }
        void main() {
          vec4 position = modelViewMatrix * (vertexPosition + vec4(0.0, 0.1 * cnoise(vec3(vertexPosition.xz, time / 5000.0) * 2.0), 0.0, 0.0));
          gl_Position = projectionMatrix * position;
          vColor = vertexColor;
          highp vec3 ambientLight = vec3(0.2, 0.2, 0.2);
          highp vec3 directionalLightColor = vec3(1.0, 1.0, 1.0);
          highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
          highp vec4 transformedNormal = normalMatrix * vec4(vertexNormal, 1.0);
          highp float directional = (dot(normalize(transformedNormal.xyz), directionalVector) + 1.0) / 2.0;
          vLighting = ambientLight + 0.8 * (directionalLightColor * directional);
          vPosition = position.xyz;
          vNormal = vertexNormal;
          vTextureCoord = textureCoord;
        }
        `
        this.fsSource = `
        precision highp float;
        varying lowp vec4 vColor;
        varying highp vec3 vLighting;
        varying highp vec3 vPosition;
        varying highp vec3 vNormal;
        uniform mat4 normalMatrix;
        uniform vec3 viewDir;
        uniform float time;
        varying highp vec2 vTextureCoord;
        uniform sampler2D uSampler;
        uniform sampler2D uSampler2;
        vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
float cnoise(vec3 P){
    vec3 Pi0 = floor(P); // Integer part for indexing
    vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;
  
    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
  
    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  
    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  
    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
  
    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;
  
    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);
  
    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
    return 2.2 * n_xyz;
  }
  float calculateSpecular(vec3 normal, vec3 viewDir, float smoothness) {

    float specularAngle = acos(dot(normalize(vec3(0.85, 0.8, 0.75) - viewDir), normal));
    float specularExponent = specularAngle / smoothness;
    float specularHighlight = exp(-specularExponent * specularExponent);
    return specularHighlight;
}
        void main() {
          float multiplier = (cnoise(5.0 * vec3(vPosition.xyz + vec3(time / 10000.0))) + 1.0) / 2.0;
          //* vec4(vec3(1.0 + calculateSpecular(normalize(vNormal + (texture2D(uSampler, vTextureCoord).xyz - 0.5)), viewDir, 0.5)), 1.0)
          highp vec3 ambientLight = vec3(0.5, 0.5, 0.5);
          highp vec3 directionalLightColor = vec3(1.0, 1.0, 1.0);
          highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
          highp vec3 normal1 = normalize((texture2D(uSampler, vec2(mod((vTextureCoord.x + time / 30000.0), 1.0), mod((vTextureCoord.y + time / 30000.0), 1.0))).yzx - 0.5) * 2.0);
          highp vec3 normal2 = normalize((texture2D(uSampler2, vec2(mod((vTextureCoord.x - time / 30000.0), 1.0), mod((vTextureCoord.y - time / 30000.0), 1.0))).yzx - 0.5) * 2.0);
          highp vec4 transformedNormal = normalMatrix * vec4(vNormal + normal1 - normal2, 1.0);
          highp float directional = (dot(normalize(transformedNormal.xyz), directionalVector) + 1.0) / 2.0;
          vec3 lighting = ambientLight + 0.5 * (directionalLightColor * directional);
          gl_FragColor = vec4(mix(vColor.xyz, vec3(0.454, 0.8, 0.956), multiplier * 0.5), vColor.w) * vec4(lighting, 1.0);
        }
        `;
        this.shaderProgram = initShaderProgram(gl, this.vsSource, this.fsSource);
        this.programInfo = {
            program: this.shaderProgram,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(this.shaderProgram, 'vertexPosition'),
                vertexColor: gl.getAttribLocation(this.shaderProgram, 'vertexColor'),
                vertexNormal: gl.getAttribLocation(this.shaderProgram, 'vertexNormal'),
                textureCoord: gl.getAttribLocation(this.shaderProgram, 'textureCoord')
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(this.shaderProgram, 'projectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(this.shaderProgram, 'modelViewMatrix'),
                normalMatrix: gl.getUniformLocation(this.shaderProgram, 'normalMatrix'),
                viewDir: gl.getUniformLocation(this.shaderProgram, "viewDir"),
                time: gl.getUniformLocation(this.shaderProgram, "time"),
                uSampler: gl.getUniformLocation(this.shaderProgram, 'uSampler'),
                uSampler: gl.getUniformLocation(this.shaderProgram, 'uSampler2')
            },
        };
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        let positions = [
            /*-1.0, 0.0, -1.0, -1.0, 0.0, 1.0,
                        1.0, 0.0, 1.0,
                        1.0, 0.0, -1.0*/
        ];
        for (let i = 0; i < width + 1; i++) {
            for (let j = 0; j < height + 1; j++) {
                positions.push([-1.0 + (i / width) * 2, 0.0, -1.0 + (j / height) * 2])
            }
        }
        let ufpos = positions;
        positions = positions.flat();
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positions),
            gl.STATIC_DRAW);
        let texCoords = [];
        for (let i = 0; i < width + 1; i++) {
            for (let j = 0; j < height + 1; j++) {
                texCoords.push([(i / width), (j / height)])
            }
        }
        texCoords = texCoords.flat();
        this.textureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(texCoords),
            gl.STATIC_DRAW);
        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        const normals = Array(positions.length / 3).fill([0.0, 1.0, 0.0]).flat();
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(normals),
            gl.STATIC_DRAW);
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        const color = [0.137, 0.537, 0.854, 0.75];
        const colors = Array(positions.length / 3).fill(color).flat();
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        //const indices = [0, 1, 3, 0, 2, 3];
        const indices = [0, 1, 4, 0, 3, 4,
            1, 2, 5, 1, 4, 5,
            3, 4, 7, 3, 6, 7,
            4, 5, 8, 4, 7, 8
        ];
        /*for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                indices.push(...[i * height + j, i * height + j + 1, i * height + j + height + 2,
                    i * height + j, i * height + j + height + 1, i * height + j + height + 2
                ]);
            }
        }*/
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                let start = i * (width + 1);
                let end = (i + 1) * (width + 1) + 1;
                indices.push(...[start + j, start + 1 + j, end + j, start + j, end - 1 + j, end + j]);
            }
        }
        this.indices = indices;
        if (width === 1 && height === 1) {
            this.indices = [0, 1, 3, 0, 2, 3];
        }
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.DYNAMIC_DRAW);
        this.matrix = mat4.create();
        mat4.translate(this.matrix, this.matrix, this.position);
        mat4.scale(this.matrix, this.matrix, this.scale);
        mat4.rotateX(this.matrix, this.matrix, this.rotation[0]);
        mat4.rotateY(this.matrix, this.matrix, this.rotation[1]);
        mat4.rotateZ(this.matrix, this.matrix, this.rotation[2]);
        this.normalMatrix = mat4.create();
        mat4.invert(this.normalMatrix, this.matrix);
        mat4.transpose(this.normalMatrix, this.normalMatrix);
        this.positionRecords = {};
        ufpos.forEach((position, i) => {
            const positionMatrix = mat4.create();
            mat4.translate(positionMatrix, positionMatrix, position);
            mat4.multiply(positionMatrix, positionMatrix, this.matrix);
            this.positionRecords[i] = [0, 0, 0];
            mat4.getTranslation(this.positionRecords[i], positionMatrix);
        });
    }
    reset() {
        this.indices = undefined;
    }
    draw(projectionMatrix) {
        mat4.set(this.matrix, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        mat4.translate(this.matrix, this.matrix, this.position);
        mat4.scale(this.matrix, this.matrix, this.scale);
        mat4.rotateX(this.matrix, this.matrix, this.rotation[0]);
        mat4.rotateY(this.matrix, this.matrix, this.rotation[1]);
        mat4.rotateZ(this.matrix, this.matrix, this.rotation[2]);
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
        if (!this.indices) {
            const indices = [];
            for (let i = 0; i < this.width; i++) {
                for (let j = 0; j < this.height; j++) {
                    let start = i * (this.width + 1);
                    let end = (i + 1) * (this.width + 1) + 1;
                    indices.push([start + j, start + 1 + j, end + j]);
                    indices.push([start + j, end - 1 + j, end + j]);
                }
            }
            const indexMap = new Map();
            const invertedCameraPos = cameraPos.map(x => x * -1);
            indices.forEach(a => {
                const object = a;
                a = a.map(x => this.positionRecords[x]);
                indexMap.set(object, vec3.dist([(a[0][0] + a[1][0] + a[2][0]) / 3, (a[0][1] + a[1][1] + a[2][1]) / 3, (a[0][2] + a[1][2] + a[2][2]) / 3], invertedCameraPos));
            })
            indices.sort((a, b) => {
                /*a = a.map(x => this.positionRecords[x]);
                b = b.map(x => this.positionRecords[x]);
                a = [(a[0][0] + a[1][0] + a[2][0]) / 3, (a[0][1] + a[1][1] + a[2][1]) / 3, (a[0][2] + a[1][2] + a[2][2]) / 3];
                b = [(b[0][0] + b[1][0] + b[2][0]) / 3, (b[0][1] + b[1][1] + b[2][1]) / 3, (b[0][2] + b[1][2] + b[2][2]) / 3];
                return vec3.dist(a, cameraPos.map(x => x *; -1)) - vec3.dist(b, cameraPos.map(x => x * -1));*/
                return indexMap.get(a) - indexMap.get(b);
            })
            this.indices = indices.flat();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.DYNAMIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        }
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
        gl.uniform1f(this.programInfo.uniformLocations.time, performance.now());
        const playerMat = mat4.create();
        mat4.rotateX(playerMat, playerMat, cameraRot.x);
        mat4.rotateY(playerMat, playerMat, cameraRot.y);
        mat4.translate(playerMat, playerMat, cameraPos);
        gl.uniform3f(this.programInfo.uniformLocations.viewDir, -playerMat[8], -playerMat[9], -playerMat[10]);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.normal);
        gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);
        gl.bindTexture(gl.TEXTURE_2D, this.normal2);
        gl.uniform1i(this.programInfo.uniformLocations.uSampler2, 1); {
            const offset = 0;
            const vertexCount = this.indices.length;
            gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_SHORT, offset);
        }
    }
}