import { cjsToEsmTransformerFactory } from '@wessberg/cjs-to-esm-transformer';
import * as ts from 'typescript';

export const transpile = (input: string) => {
  const result = ts.transpileModule(input, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2019,
      allowJs: true,
      sourceMap: true,
      inlineSourceMap: true,
      emitDecoratorMetadata: true,
      experimentalDecorators: true,
    },
    transformers: {
      before: [cjsToEsmTransformerFactory()],
    },
  });

  return result.outputText;
};
