'use babel';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { CompositeDisposable } from 'atom';

// Dependencies
let helpers;

const loadDeps = () => {
  if (!helpers) {
    helpers = require('atom-linter');
  }
};

export default {
  activate() {
    this.idleCallbacks = new Set();
    let depsCallbackID;
    const installLinterClojureDeps = () => {
      this.idleCallbacks.delete(depsCallbackID);
      if (!atom.inSpecMode()) {
        require('atom-package-deps').install('linter-clojure');
      }
      loadDeps();
    };
    depsCallbackID = window.requestIdleCallback(installLinterClojureDeps);
    this.idleCallbacks.add(depsCallbackID);

    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(
      atom.config.observe('linter-clojure.javaExecutablePath', (value) => {
        this.javaExecutablePath = value;
      }),
      atom.config.observe('linter-clojure.clojureExecutablePath', (value) => {
        this.clojureExecutablePath = value;
      }),
    );
  },

  deactivate() {
    this.idleCallbacks.forEach(callbackID => window.cancelIdleCallback(callbackID));
    this.idleCallbacks.clear();
    this.subscriptions.dispose();
  },

  provideLinter() {
    return {
      name: 'Clojure',
      grammarScopes: ['source.clojure', 'source.clojurescript'],
      scope: 'file',
      lintsOnChange: false,
      lint: async (textEditor) => {
        loadDeps();

        if (!atom.workspace.isTextEditor(textEditor)) {
          // Somehow we got fed an invalid TextEditor
          return null;
        }

        const filePath = textEditor.getPath();

        if (!filePath) {
          // The TextEditor had no path associated with it somehow
          return null;
        }

        const fileText = textEditor.getText();

        const parameters = [
          '-jar', this.clojureExecutablePath,
          '-i', filePath,
        ];

        const execOpts = {
          stream: 'stderr',
          allowEmptyStderr: true,
        };

        const output = await helpers.exec(this.javaExecutablePath, parameters, execOpts);

        // Check for invalid jarfile specification
        const invalidJarCheck = /Error: Unable to access jarfile (.+)/.exec(output);
        if (invalidJarCheck !== null) {
          const message = 'linter-clojure: Unable to find Clojure!';
          const options = {
            detail: `Java was unable to find the Clojure jarfile at '${invalidJarCheck[1]}'.`,
          };
          atom.notifications.addError(message, options);
          return [];
        }

        if (textEditor.getText() !== fileText) {
          // File has changed since the lint was triggered, tell Linter not to update
          return null;
        }

        const toReturn = [];
        const regex = /RuntimeException: (.+), compiling:\((.+):(\d+):(\d+)\)/g;

        let match = regex.exec(output);
        while (match !== null) {
          // Reports 1 indexed positions normally, but can report 0:0.
          let line = Number.parseInt(match[3], 10);
          line = line > 0 ? line - 1 : 0;
          let col = Number.parseInt(match[4], 10);
          col = col > 0 ? col - 1 : 0;

          toReturn.push({
            severity: 'error',
            excerpt: match[1],
            location: {
              file: match[2],
              position: helpers.generateRange(textEditor, line, col),
            },
          });
          match = regex.exec(output);
        }
        return toReturn;
      },
    };
  },
};
