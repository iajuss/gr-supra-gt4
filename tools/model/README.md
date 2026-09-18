# Pipeline do modelo 3D

Como `public/models/supra.glb` foi gerado a partir do download do CGTrader
(Toyota Supra MK5 "personalized", FBX de 217 MB).

As ferramentas não são dependências do projeto: instale-as fora dele, num diretório temporário.

```bash
npm install fbx2gltf @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions meshoptimizer draco3dgltf
```

## 1. FBX → GLB

```bash
./node_modules/fbx2gltf/bin/Windows_NT/FBX2glTF.exe --input "supra.fbx" --output supra --binary
```

Resultado bruto: 247 MB, 9450 malhas, 5.310.866 triângulos.

## 2. Limpar e otimizar

```bash
node --max-old-space-size=8192 optimize.mjs supra.glb supra-web.glb 0.05 0.001
```

O script remove o cenário do autor (o fundo `Cylinder` com escala 7425, a luz `Area` e a `Camera`),
junta as malhas por material, solda vértices, simplifica e comprime com Draco.

Resultado: 13 malhas, 1.472.254 triângulos, 4,0 MB.

## 3. Instalar

```bash
cp supra-web.glb ../../public/models/supra.glb
cp ../../node_modules/three/examples/jsm/libs/draco/gltf/* ../../public/draco/
```

O decodificador Draco precisa estar em `public/draco/`, porque `scene/car.js` o carrega de `/draco/`.

## Diagnóstico

- `inspect.mjs <arquivo>` — malhas, materiais, triângulos e texturas.
- `nodes.mjs <arquivo>` — hierarquia com escalas, que foi como o cenário escondido apareceu.
