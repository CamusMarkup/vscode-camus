import * as vscode from 'vscode';
import { PreviewPanel } from './PreviewPanel';


export function activate(context: vscode.ExtensionContext) {
    vscode.commands.registerCommand('camus.preview', () => {
        PreviewPanel.createOrShow(context.extensionUri, vscode.window.activeTextEditor?.document.getText()||'');
    });


    let debounce: any = undefined;
    vscode.window.onDidChangeTextEditorSelection((e) => {
        if (e.textEditor.document.languageId === 'camus') {
            if (debounce) {
                clearTimeout(debounce);
            }
            debounce = setTimeout(() => {
                PreviewPanel.update(e.textEditor.document.getText()||'');
                clearTimeout(debounce);
            }, 500);
        }
    });
}

// this method is called when your extension is deactivated
export function deactivate() {}
