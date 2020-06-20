/**
 * Copyright (c) 2020-present, Logically Abstract, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-param-reassign */

import { cjsToEsmTransformerFactory } from '@wessberg/cjs-to-esm-transformer';
import { basename, dirname, join, relative } from 'path';
import { sync } from 'resolve';
import * as ts from 'typescript';

// fix for missing singleQuote parameter in type definition
const createLiteral = ts.createLiteral as any;

const relativePathRegex = /^\.\.?\/.+$/;

const extensions = ['.ts', '.js'];

/**
 * TODO: These two transforms may be able to be combined
 */

const rewriteNodeResolve = (
  requestPath: string,
): ts.TransformerFactory<ts.SourceFile> => (context) => {
  const visit: ts.Visitor = (node) => {
    node = ts.visitEachChild(node, visit, context);

    // transform module specifiers

    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      /**
       * This is the module specifier string
       * './test' or 'unistore'
       */
      const target = node.moduleSpecifier.text;

      /**
       * requestPath is like src/my-app.js or node_modules/unistore/dist/unistore.js
       */
      const dir = dirname(join(process.cwd(), `./${requestPath}`));
      const baseDir = relativePathRegex.test(target) ? dir : process.cwd();

      const path = sync(target, {
        basedir: baseDir,
        extensions,
      });

      /**
       * If the found file was a TS file, replace the extension with JS
       */
      const newTarget = `/${relative(
        process.cwd(),
        path.replace('.ts', '.js'),
      )}`;

      if (ts.isImportDeclaration(node)) {
        return ts.updateImportDeclaration(
          node,
          node.decorators,
          node.modifiers,
          node.importClause,
          createLiteral(newTarget, true),
        );
      }

      return ts.updateExportDeclaration(
        node,
        node.decorators,
        node.modifiers,
        node.exportClause,
        createLiteral(newTarget, true),
        node.isTypeOnly,
      );
    }

    // transform dynamic imports

    /**
     * Note:
     *
     * This only supports relative dynamic imports right now
     */

    if (
      ts.isCallExpression(node) &&
      node.expression &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      /**
       * getText() returns './test' with quotes, so strip the quotes in the string
       */
      const text = node.arguments[0].getText().replace(/['"]/g, '');

      if (!relativePathRegex.test(text)) {
        return node;
      }

      /**
       * requestPath is like src/my-app.js
       */
      const joinPath = join(
        process.cwd(),
        `./${dirname(requestPath)}`,
        `${text}.js`,
      );

      const newTarget = `/${relative(process.cwd(), joinPath)}`;

      const literal = createLiteral(newTarget, true);

      return ts.updateCall(node, node.expression, undefined, [literal]);
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
      // Try to use ts.resolveModuleName?

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
          createLiteral(newTarget, true),
        );
      }

      return ts.updateExportDeclaration(
        node,
        node.decorators,
        node.modifiers,
        node.exportClause,
        createLiteral(newTarget, true),
        node.isTypeOnly,
      );
    }

    return node;
  };

  return (node) => ts.visitNode(node, visit);
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
  const afterTransformers = [
    cjsToEsmTransformerFactory(),
    rewriteNodeResolve(path),
    rewriteLocalPathExts(path),
  ];

  const transformedProcessEnv = rewriteProcessEnv(input);

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
      after: afterTransformers,
    },
  });

  return result.outputText;
};
