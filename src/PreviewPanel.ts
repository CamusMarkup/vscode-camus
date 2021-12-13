import * as vscode from 'vscode';
import * as camus from '@bctnry/camus-core';

export type CreateProjectPanelRequest = {
    projectName: string,
    projectDescription: string,
    projectSystemName: string,
    projectSystemUrl: string,
    projectSystemSchema: string,
    projectUseLocalSchemaDir: boolean,
}

export class PreviewPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: PreviewPanel | undefined;

    public static readonly CamusHTMLRenderer = new camus.Renderer.HTMLRenderer();

	public static readonly viewType = 'camusPreview';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
    private readonly _globalWebviewResourceRoot: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri, source: string) {
		if (PreviewPanel.currentPanel) {
            PreviewPanel.currentPanel._update(source);
			PreviewPanel.currentPanel._panel.reveal(vscode.ViewColumn.Beside);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			PreviewPanel.viewType,
            'Camus Preview',
			vscode.ViewColumn.Beside,
            {
                enableScripts: true,
            },
			
		);

		PreviewPanel.currentPanel = new PreviewPanel(panel, extensionUri, source);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, source: string) {
		this._panel = panel;
		this._extensionUri = extensionUri;
        this._globalWebviewResourceRoot = vscode.Uri.joinPath(
            this._extensionUri,
            'media', 'webview',
        );

		this._update(source);

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
	}

	public dispose() {
		PreviewPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
            this._disposables.pop()?.dispose();
		}
	}

	private _update(source: string) {
        this._panel.webview.html = this._getHtmlForWebview(source);
	}

    public static update(source: string) {
		PreviewPanel.currentPanel?._update(source);
    }

	private _getHtmlForWebview(source: string) {
        let webview = this._panel.webview;

		// And the uri we use to load this script in the webview
		const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._globalWebviewResourceRoot, 'vscode.css'));

        const inside = PreviewPanel.CamusHTMLRenderer.render(camus.Parser.parse(source));

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src https://sebastian.graphics https://*.cleword.cn http://localhost:* ${webview.cspSource}; style-src 'unsafe-inline' ${webview.cspSource}; img-src ${webview.cspSource} https:; ">
				
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${stylesMainUri}" rel="stylesheet">
			</head>
			<body>
                ${inside}

			</body>
			</html>`;
	}
}
