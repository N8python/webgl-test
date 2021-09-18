class RenderQuad {
    constructor() {
        this.vsSource = `
        attribute vec4 vertexPosition;
        attribute vec2 textureCoord;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying highp vec2 vTextureCoord;
        void main() {
            gl_Position = vertexPosition;
            vTextureCoord = textureCoord;
        }
        `;
        this.fsSource = `
        precision highp float;
        varying highp vec2 vTextureCoord;
        uniform sampler2D uSampler;
        uniform sampler2D depthSampler;
        uniform sampler2D refracDepthSampler;
        uniform mat4 projectionMatrixInv;
        uniform mat4 viewMatrixInv;
        uniform float time;
        highp float linearize_depth(highp float d, highp float zNear,highp float zFar)
{
    highp float z_n = 2.0 * d - 1.0;
    return 2.0 * zNear * zFar / (zFar + zNear - z_n * (zFar - zNear));
}
vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
highp float cnoise(vec2 P){
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 * 
    vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 *= norm.x;
  g01 *= norm.y;
  g10 *= norm.z;
  g11 *= norm.w;
  highp float n00 = dot(g00, vec2(fx.x, fy.x));
  highp float n10 = dot(g10, vec2(fx.y, fy.y));
  highp float n01 = dot(g01, vec2(fx.z, fy.z));
  highp float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  highp float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}
float cnoise3(vec3 P){
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
  vec3 WorldPosFromDepth(float depth) {
    float z = depth * 2.0 - 1.0;

    vec4 clipSpacePosition = vec4(vTextureCoord * 2.0 - 1.0, z, 1.0);
    vec4 viewSpacePosition = projectionMatrixInv * clipSpacePosition;

    // Perspective division
    viewSpacePosition /= viewSpacePosition.w;

    vec4 worldSpacePosition = viewMatrixInv * viewSpacePosition;

    return worldSpacePosition.xyz;
} 
        void main() {
          highp float depth = linearize_depth(texture2D(depthSampler, vTextureCoord).x, 0.1, 200.0);
          highp float refracDepth = linearize_depth(texture2D(refracDepthSampler, vTextureCoord).x, 0.1, 200.0);
          vec3 worldPos = WorldPosFromDepth(texture2D(depthSampler, vTextureCoord).x);
          highp float depthReduction = 0.0;
          if (depth > 10.0) {
              depthReduction = pow((depth - 10.0), 1.2) / 120.0;
          }
          depthReduction *= (1.0 - (max(min(((vTextureCoord.y - 0.75 - cnoise(vTextureCoord * 10.0 + time / 1000.0)) + 1.0), 0.35), -0.35) / 2.0));
          depthReduction = max(min(depthReduction, 1.0), 0.0);
          float refracMag = 0.0;
          if (refracDepth < depth + 0.01) {
              refracMag = 0.0033 * ((1.0 / depth) + 1.0);
          }
          vec2 worldConverted = (worldPos.xz + worldPos.y) * 0.5;
          vec3 color = texture2D(uSampler, vTextureCoord + vec2(refracMag * cnoise3(25.0 * vec3(worldConverted, time / 25000.0)), refracMag * cnoise3(25.0 *  vec3(worldConverted, (time + 1000.0) / 25000.0)))).xyz;

            float depth_Diff = 0.0;
            float count = 0.0;
            for(float i = -7.0; i < 8.0; i++) {
                  for(float j = -7.0; j < 8.0; j++) {
                    // color += weight * texture2D(uSampler, vTextureCoord + vec2(0.002 * i, 0.002 * j)).xyz;
                    float tempdiff = (depth - linearize_depth(texture2D(depthSampler, vTextureCoord + vec2((1.0 / 1200.0) * i, (1.0 / 600.0) * j)).x, 0.1, 200.0)) / depth;
                    if (tempdiff * depth < depth * 0.1) {
                        if (tempdiff < 0.05) {
                            depth_Diff += tempdiff;
                        } else {
                            depth_Diff += tempdiff * (1.0 - ((tempdiff - 0.05) / 0.05));
                        }
                        count += 1.0;
                    }
                }
              }
            depth_Diff /= count;
            depth_Diff = max(min(depth_Diff, 0.05), 0.0);
          gl_FragColor = vec4(color - 10.0 * vec3(depth_Diff), texture2D(uSampler, vTextureCoord).w - depthReduction);
          
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
                projectionMatrixInv: gl.getUniformLocation(this.shaderProgram, 'projectionMatrixInv'),
                viewMatrixInv: gl.getUniformLocation(this.shaderProgram, 'viewMatrixInv'),
                modelViewMatrix: gl.getUniformLocation(this.shaderProgram, 'modelViewMatrix'),
                uSampler: gl.getUniformLocation(this.shaderProgram, 'uSampler'),
                depthSampler: gl.getUniformLocation(this.shaderProgram, 'depthSampler'),
                refracDepthSampler: gl.getUniformLocation(this.shaderProgram, "refracDepthSampler"),
                time: gl.getUniformLocation(this.shaderProgram, "time")
            },
        };
        console.log(this.programInfo);
        const positions = [-1, -1, 0.0, 1, -1, 0.0,
            1, 1, 0.0, -1, 1, 0.0,
        ]
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positions),
            gl.STATIC_DRAW)
        const texCoords = [
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
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
        this.matrix = mat4.create();
    }
    draw(projectionMatrix) {
        {
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
        const inv = mat4.create();
        mat4.invert(inv, projectionMatrix);
        gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrixInv,
            false,
            inv
        );
        const inv2 = mat4.create();
        mat4.invert(inv2, this.matrix);
        gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.viewMatrixInv,
            false,
            inv2
        );
        gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.modelViewMatrix,
            false,
            this.matrix);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
        gl.uniform1i(this.programInfo.uniformLocations.depthSampler, 1);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.refracDepthTexture);
        gl.uniform1i(this.programInfo.uniformLocations.refracDepthSampler, 2);
        gl.uniform1f(this.programInfo.uniformLocations.time, performance.now()); {
            const offset = 0;
            const vertexCount = 6;
            gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_SHORT, offset);
        }
    }
}