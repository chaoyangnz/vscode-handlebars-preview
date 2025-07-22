import * as vscode from 'vscode';
import { commands, ExtensionContext, ViewColumn, window, workspace, TextDocument, TextEditor, WebviewPanel } from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import * as HandlebarsUtils from 'handlebars-utils'
import * as helperDate from 'helper-date'

// Siteminder emailx template helpers
// https://github.com/siteminder-au/emailx/blob/master/components/api/src/app/services/templates/render.ts#L11-L24
Handlebars.registerHelper('date', helperDate)
Handlebars.registerHelper('eq', function (a, b, options) {
  if (arguments.length === 2) {
    // eslint-disable-next-line
    options = b
    // eslint-disable-next-line
    b = options.hash.compare
  }
  // @ts-ignore
  return HandlebarsUtils.value(a === b, this, options)
})

export function activate(context: ExtensionContext) {
  const outputChannel = window.createOutputChannel('Handlebars Preview');
  const config = workspace.getConfiguration('handlebarsPreview');

  context.subscriptions.push(
    // Commands
    commands.registerCommand('handlebarsPreview.preview', () => {

      const fileExtensionsToPreview = config.get<string[] | undefined>('fileExtensionsToPreview');
      const isARelevantFile = (fileName: string) =>
        // If not specified, any selected file will be previewed regardless of its extension.
        (!fileExtensionsToPreview || fileExtensionsToPreview.some(ext => path.extname(fileName) === ext));

      const panel = window.createWebviewPanel("preview", "Handlebars HTML Preview", ViewColumn.Two, {})
      updatePanelWebview(panel);

      // Re-render webview if doc changes
      workspace.onDidSaveTextDocument(e => {
        const fileName = e.fileName;
        outputChannel.appendLine('name of file that was just saved:' + fileName);
        outputChannel.appendLine('extensions to trigger preview:' + fileExtensionsToPreview?.join(', '));

        if (isARelevantFile(fileName)) {
          updatePanelWebview(panel);
        }
      });

      // Re-render webview if selected editor changes
      window.onDidChangeActiveTextEditor(e => {
        const fileName = e?.document.fileName;
        outputChannel.appendLine('current file name:' + fileName);
        outputChannel.appendLine('extensions to trigger preview:' + fileExtensionsToPreview?.join(', '));

        if (fileName && isARelevantFile(fileName)) {
          updatePanelWebview(panel);
        }
      });
    })
  );
}

export interface HelperFunction {
  name: string;
  body: Handlebars.HelperDelegate;
}
export interface Context {
  data: object;
  helperFns: HelperFunction[];
}

function updatePanelWebview(panel: WebviewPanel) {
  panel.webview.html = makeWebviewContent(window.activeTextEditor);
}

function makeWebviewContent(maybeActiveEditor: TextEditor | undefined): string {
  const webviewBody = !maybeActiveEditor
    ? 'Select handlebars file to render'
    : makeWebviewBody(maybeActiveEditor.document);

  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Handlebars HTML Preview</title>
    </head>
    <body>
      ${webviewBody}
    </body>
    </html>`;
}

function makeWebviewBody(activeDocument: TextDocument): string {
  const ctxResolution = specifiedContext(activeDocument);

  if (ctxResolution.error !== undefined) {
    return ctxResolution.error;
  }

  let context: Context;
  if (ctxResolution.context) {
    context = ctxResolution.context;
  } else {
    // Go with the old format which is: look for *.hbs.json and *.hbs.js
    const dataFilePath = `${activeDocument.fileName}.json`;
    const helperFnsFilePath = `${activeDocument.fileName}.js`;

    try {
      const data = fs.existsSync(dataFilePath)
        ? JSON.parse(fs.readFileSync(dataFilePath, 'utf8'))
        : {};

      const helperFns = fs.existsSync(helperFnsFilePath)
        ? requireUncached(helperFnsFilePath)
        : [];

      context = { data, helperFns }
    } catch (e) {
      return `Error parsing data and/or helper functions source file: ${e}`;
    }
  }

  try {
    const templateContent = activeDocument.getText();
    const renderedTemplate = renderTemplate(templateContent, context);

    return `
    result:
    <br/>
    ${renderedTemplate}
    <br/>
    <div>-----------------------------------------------------------------</div>
    <br/>
    data:
    <pre>${JSON.stringify(context.data, null, 2)}</pre>
    <br/>
    <div>-----------------------------------------------------------------</div>
    <br/>
    helper functions: 
    <pre>${JSON.stringify(context.helperFns.map(fn => ({ ...fn, body: fn.body.toString() })), null, 2)}</pre>
    `
  } catch (e) {
    return `Error to do with handlebars compilation: ${e}`;
  }
}

export function renderTemplate(template: string, context: Context) {
  context.helperFns.forEach(fn => Handlebars.registerHelper(fn.name, fn.body))
  const compiledTemplate = Handlebars.compile(template);
  return compiledTemplate(context.data);
}

type ContextResolutionResult =
  | { error: undefined, context: Context | undefined }
  | { error: string };

/** Looks at the first line of the handlebars template for `{{!-- vscode-handlebars-preview-context-source=<path.json> --}}` */
function specifiedContext(doc: TextDocument): ContextResolutionResult {
  if (doc.lineCount < 1) {
    return { error: `Current active document has ${doc.lineCount} lines` };
  }

  const docFirstLine = doc.lineAt(0).text;
  const matches = /\{\{!--\s*vscode-handlebars-preview-context-source=(.*)\s*--\}\}/.exec(docFirstLine);
  if (!matches || matches.length < 2) {
    return { error: undefined, context: undefined };
  }

  const activeFileDirName = path.dirname(doc.fileName);
  const ctxFilePath = matches[1].trim();
  const ctxAbsFilePath = path.join(activeFileDirName, ctxFilePath);
  const ctxFileExists = fs.existsSync(ctxAbsFilePath);
  if (!ctxFileExists) {
    return { error: `Referenced context file ${ctxAbsFilePath} not found` };
  }

  try {
    // TODO: Maybe use io-ts for validating correct structure
    const ctx = requireUncached(ctxAbsFilePath) as Context;
    if (!ctx.data) return { error: `Expected field data in context: ${JSON.stringify(ctx, null, 2)}` };
    if (!ctx.helperFns) return { error: `Expected field helperFns in context: ${JSON.stringify(ctx, null, 2)}` };

    return { error: undefined, context: ctx };
  } catch (e) {
    return { error: `Error occurred in importing module ${ctxAbsFilePath}: ${e}` };
  }
}

function requireUncached(modulePath: string) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}