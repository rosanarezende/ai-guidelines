// elkjs-bundled.d.ts — o build main-thread (elk.bundled.js) não publica types
// colocalizados; reaproveitamos a API tipada oficial do pacote (elk-api).
declare module "elkjs/lib/elk.bundled.js" {
  import ELK from "elkjs/lib/elk-api";
  export * from "elkjs/lib/elk-api";
  export default ELK;
}
