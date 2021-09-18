const loadText = async(url) => {
    return await (await fetch(url)).text();
}
const ObjectLoader = {
    async load(obj, mtl) {
        const rawObjFile = await loadText(obj);
        const rawMtlFile = await loadText(mtl);
        const materials = {};
        const mtlLines = rawMtlFile.split("\n");
        const objLines = rawObjFile.split("\n");
        mtlLines.forEach((line, i) => {
            if (line.startsWith("newmtl")) {
                materials[line.split(" ")[1]] = mtlLines[i + 2].split(" ").slice(1).map(x => +x);
            }
        });
        const vertices = [];
        const normals = [];
        objLines.forEach(line => {
            if (line.startsWith("v ")) {
                vertices.push(line.split(" ").slice(1).map(x => +x));
            }
            if (line.startsWith("vn ")) {
                normals.push(line.split(" ").slice(1).map(x => +x))
            }
        });
        let currentMat;
        let faces = []
        objLines.forEach(line => {
            if (line.startsWith("usemtl ")) {
                currentMat = line.split(" ")[1];
            }
            if (line.startsWith("f ")) {
                faces.push([line.split(" ").slice(1), currentMat])
            }
        });
        let finalVertices = [];
        faces.forEach(face => {
            face[0].forEach(point => {
                let parts = point.split("/");
                finalVertices.push(parts[0] + " " + parts[2] + " " + face[1]);
            })
        });
        finalVertices = Array.from(new Set(finalVertices));
        const lookupVertices = Object.fromEntries(Object.entries(finalVertices).map(([k, v]) => [v, +k]));
        let triangles = [];
        faces.forEach(face => {
            for (let i = 1; i < face[0].length - 1; i++) {
                triangles.push([
                    [face[0][0], face[0][i], face[0][i + 1]], face[1]
                ]);
            }
        });
        triangles.forEach((triangle, i) => {
            triangle[0].forEach((point, i) => {
                const parts = point.split("/");
                triangle[0][i] = lookupVertices[parts[0] + " " + parts[2] + " " + triangle[1]];
            });
        });
        finalVertices.forEach((vertex, i) => {
            const parts = vertex.split(" ");
            finalVertices[i] = [vertices[parts[0] - 1], normals[parts[1] - 1], materials[parts[2]]]
        });
        triangles = triangles.map(t => t[0]);
        const positionBuffer = finalVertices.map(v => v[0]).flat();
        const normalBuffer = finalVertices.map(v => v[1]).flat();
        const colorBuffer = finalVertices.map(v => v[2].concat(1.0)).flat();
        const indicesBuffer = triangles.flat();
        const buffers = {
            position: positionBuffer,
            normal: normalBuffer,
            color: colorBuffer,
            indices: indicesBuffer
        }
        return buffers;
    }
}