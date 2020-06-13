/* eslint-disable no-param-reassign */

import { cjsToEsmTransformerFactory } from '@wessberg/cjs-to-esm-transformer';
import { basename, dirname, join, relative } from 'path';
import { sync } from 'resolve';
import * as ts from 'typescript';

const rewriteNodeResolve = (
  requestPath: string,
): ts.TransformerFactory<ts.SourceFile> => (context) => {
  const visit: ts.Visitor = (node) => {
    node = ts.visitEachChild(node, visit, context);

    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const target = node.moduleSpecifier.text;

      try {
        const path = sync(target, {
          basedir: target.startsWith('./')
            ? dirname(join(process.cwd(), `.${requestPath}`))
            : process.cwd(),
        });

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

const rewriteLocalPathExts = (
  requestPath: string,
): ts.TransformerFactory<ts.SourceFile> => (context) => {
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

      if (requestPath.includes('node_modules')) {
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

/**
 * Not sure how to do this in typescript's ast parser, so
 * use a regex for now.
 */
const rewriteDynamicImports = (input: string): string => {
  const rewrite = input.replace(
    /await\simport\('\.\/(.*)'\)/gm,
    (match, offset) => {
      return match.replace(offset, `${offset}.js`);
    },
  );

  return rewrite;
};

const processEnvRegex = /process\.env\.WC_([A-Z_]+)/g;

const rewriteProcessEnv = (input: string): string => {
  return input.replace(processEnvRegex, (_match, offset) => {
    if (process.env[`WC_${offset}`]) {
      return JSON.stringify(process.env[`WC_${offset}`]);
    }

    return JSON.stringify(false);
  });
};

export const transpile = (input: string, path: string) => {
  const beforeTransformers = [
    cjsToEsmTransformerFactory(),
    rewriteNodeResolve(path),
    rewriteLocalPathExts(path),
  ];

  const transformedDynamicImports = rewriteDynamicImports(input);
  const transformedProcessEnv = rewriteProcessEnv(transformedDynamicImports);

  const result = ts.transpileModule(transformedProcessEnv, {
    fileName: basename(path),
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
