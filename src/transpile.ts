/* eslint-disable no-param-reassign */

import { cjsToEsmTransformerFactory } from '@wessberg/cjs-to-esm-transformer';
import { relative } from 'path';
import { sync } from 'resolve';
import * as ts from 'typescript';

const rewriteNodeResolve = (): // requestPath: string,
ts.TransformerFactory<ts.SourceFile> => (context) => {
  const visit: ts.Visitor = (node) => {
    node = ts.visitEachChild(node, visit, context);

    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const target = node.moduleSpecifier.text;

      // const base = dirname(join(process.cwd(), requestPath));

      try {
        const path = sync(target);

        const newTarget = `/${relative(process.cwd(), path)}`;

        if (ts.isImportDeclaration(node)) {
          return ts.updateImportDeclaration(
            node,
            node.decorators,
            node.modifiers,
            node.importClause,
            ts.createLiteral(newTarget),
          );
        }

        return ts.updateExportDeclaration(
          node,
          node.decorators,
          node.modifiers,
          node.exportClause,
          ts.createLiteral(newTarget),
          node.isTypeOnly,
        );
      } catch (error) {
        return node;
      }
    }

    return node;
  };

  return (node) => ts.visitNode(node, visit);
};

const rewriteLocalPathExts = (): ts.TransformerFactory<ts.SourceFile> => (
  context,
) => {
  /**
   * Huge props to https://gist.github.com/AviVahl/40e031bd72c7264890f349020d04130a
   *
   * Huge props to https://github.com/Polymer/koa-node-resolve
   */
  const visit: ts.Visitor = (node) => {
    node = ts.visitEachChild(node, visit, context);

    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const target = node.moduleSpecifier.text;

      if (target.endsWith('.js')) {
        return node;
      }

      const newTarget = `${target}.js`;

      if (ts.isImportDeclaration(node)) {
        return ts.updateImportDeclaration(
          node,
          node.decorators,
          node.modifiers,
          node.importClause,
          ts.createLiteral(newTarget),
        );
      }

      return ts.updateExportDeclaration(
        node,
        node.decorators,
        node.modifiers,
        node.exportClause,
        ts.createLiteral(newTarget),
        node.isTypeOnly,
      );
    }

    return node;
  };

  return (node) => ts.visitNode(node, visit);
};

export const transpile = (input: string) => {
  const beforeTransformers = [
    rewriteNodeResolve(),
    cjsToEsmTransformerFactory(),
    rewriteNodeResolve(),
    rewriteLocalPathExts(),
  ];

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
      before: beforeTransformers,
    },
  });

  return result.outputText;
};
