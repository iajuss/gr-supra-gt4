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
node --max-old-space-size=8192 optimize.mjs supra.glb supra-web.glb 0.05 0.001 "WHEELARCH RUBBER - black"
```

O último argumento lista (separados por vírgula) os materiais que **não** são simplificados; o padrão já é
esse. Apesar do nome, `WHEELARCH RUBBER - black` é a maior parte da carroceria (2,93M triângulos), e
simplificá-la, mesmo com erro 0.0002, deixa a pintura brilhante cheia de amassados: o meshopt ignora
as normais, que deixam de bater com a superfície. Recalcular as normais depois deixa tudo facetado,
porque a malha não compartilha vértices entre faces. Diagnóstico de 2026-09-17 em
[docs/plan.md](../../docs/plan.md).

O script remove o cenário do autor (o fundo `Cylinder` com escala 7425, a luz `Area` e a `Camera`),
junta as malhas por material, solda vértices, simplifica (menos a lataria) e comprime com Draco.

Resultado: 13 malhas, 3.551.233 triângulos, 7,9 MB. (Simplificando tudo eram 1.472.254 e 4,0 MB,
com a lataria amassada.)

## 3. Instalar

```bash
cp supra-web.glb ../../public/models/supra.glb
cp ../../node_modules/three/examples/jsm/libs/draco/gltf/* ../../public/draco/
```

O decodificador Draco precisa estar em `public/draco/`, porque `scene/car.js` o carrega de `/draco/`.

## Diagnóstico

- `inspect.mjs <arquivo>` — malhas, materiais, triângulos e texturas.
- `nodes.mjs <arquivo>` — hierarquia com escalas, que foi como o cenário escondido apareceu.
