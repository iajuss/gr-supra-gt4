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

Um quinto argumento opcional lista (separados por vírgula) os materiais que ficam **fora da simplificação
geral**; o padrão é a carroceria: pintura (`METALLIC CARPAINT - black.001`), `BLACKOUT`, carbono, caixas
de roda e vidro, 2,93M triângulos no total. Na simplificação geral, mesmo com erro 0.0002, a pintura
brilhante fica cheia de amassados: o meshopt ignora as normais, que deixam de bater com a superfície.
Recalcular as normais depois deixa tudo facetado, porque a malha não compartilha vértices entre faces.
Diagnóstico de 2026-09-17 em [docs/plan.md](../../docs/plan.md).

**A carroceria tem uma simplificação própria** (2026-09-19, `BODYWORK_SIMPLIFY` no script):
`simplifyWithAttributes`, que pesa as normais junto com as posições, até metade dos triângulos (erro
0.001, peso 1). O verniz continua liso. Comparado lado a lado com `tools/lookLab.html?models=`: 30% também
ficava liso (4,3 MB); 20% amassava o capô e a tampa traseira (3,9 MB). Precisa do meshoptimizer ≥ 0.21
(testado com 1.2.0).

O script remove o cenário do autor (o fundo `Cylinder` com escala 7425, a luz `Area` e a `Camera`),
junta as malhas por material, solda vértices, simplifica (menos a lataria) e comprime com Draco.

**O `dedup` não pode fundir materiais** (corrigido em 2026-09-18). O conversor dá os mesmos valores a
todos os materiais, e o `dedup()` padrão juntava pintura, blackout, carbono, caixas de roda e vidro num
só, com o nome do primeiro (`WHEELARCH RUBBER - black`): na página o carro só podia ter uma cor.

**Detalhes com material próprio** (`DETAILS` no script, pelos nomes dos nós do FBX): placa, luz central do
difusor, faróis de neblina, calotas, lanternas, vidro das lanternas e pinças de freio ganham material
próprio antes da junção, para a página pintá-los à parte.

Resultado: 24 malhas, **2.083.332 triângulos, 5,6 MB** (5.554.504 bytes, reproduzido byte a byte). Antes
da simplificação própria da carroceria: 3.544.763 triângulos e 7,7 MB. (Simplificando tudo só pelas
posições eram 1.472.254 e 4,0 MB, com a lataria amassada.)

## 3. Instalar

```bash
cp supra-web.glb ../../public/models/supra.glb
cp ../../node_modules/three/examples/jsm/libs/draco/gltf/* ../../public/draco/
```

O decodificador Draco precisa estar em `public/draco/`, porque `scene/car.js` o carrega de `/draco/`.

## Diagnóstico

- `inspect.mjs <arquivo>` — malhas, materiais, triângulos e texturas.
- `nodes.mjs <arquivo>` — hierarquia com escalas, que foi como o cenário escondido apareceu.
