'use babel';

import { join } from 'path';
// eslint-disable-next-line no-unused-vars
import { it, fit, wait, beforeEach, afterEach } from 'jasmine-fix';
import linterClojure from '../lib';

const linterProvider = linterClojure.provideLinter();
const { lint } = linterProvider;

const fixturePath = join(__dirname, 'fixtures');
const emptyPath = join(fixturePath, 'empty.clj');
const goodPath = join(fixturePath, 'good.clj');
const badPath = join(fixturePath, 'bad.clj');
const notFoundPath = join(fixturePath, 'notFound.clj');

describe('The Clojure provider for Linter', () => {
  beforeEach(async () => {
    await atom.packages.activatePackage('language-clojure');
    await atom.packages.activatePackage('linter-clojure');
    // NOTE: You must set the environment variable `$ClojurePath` to the full path of Clojure
    if (Object.prototype.hasOwnProperty.call(process.env, 'CLOJURE_PATH')) {
      atom.config.set('linter-clojure.clojureExecutablePath', process.env.CLOJURE_PATH);
    }
    // Used to check for Clojure path failures
    spyOn(atom.notifications, 'addError');
  });

  it('should be in the packages list', () =>
    expect(atom.packages.isPackageLoaded('linter-clojure')).toBe(true));

  it('should be an active package', () =>
    expect(atom.packages.isPackageActive('linter-clojure')).toBe(true));

  it('finds nothing wrong with a good file', async () => {
    const editor = await atom.workspace.open(goodPath);
    const messages = await lint(editor);

    expect(atom.notifications.addError).not.toHaveBeenCalled();
    expect(messages.length).toBe(0);
  });

  it('reports invalid clojure.jar specifications', async () => {
    atom.config.set('linter-clojure.clojureExecutablePath', 'foobar');
    const editor = await atom.workspace.open(goodPath);
    await lint(editor);
    const message = 'linter-clojure: Unable to find Clojure!';
    const options = {
      detail: "Java was unable to find the Clojure jarfile at 'foobar'.",
    };
    expect(atom.notifications.addError).toHaveBeenCalledWith(message, options);
  });

  it('properly reports RuntimeException errors', async () => {
    const editor = await atom.workspace.open(badPath);
    const messages = await lint(editor);

    expect(atom.notifications.addError).not.toHaveBeenCalled();
    expect(messages[0].severity).toBe('error');
    expect(messages[0].excerpt).toBe('Unable to resolve symbol: xyz in this context');
    expect(messages[0].location.file).toBe(badPath);
    expect(messages[0].location.position).toEqual([[0, 0], [0, 4]]);
  });

  it('properly reports FileNotFoundException errors', async () => {
    const editor = await atom.workspace.open(notFoundPath);
    const messages = await lint(editor);

    expect(atom.notifications.addError).not.toHaveBeenCalled();
    expect(messages[0].severity).toBe('error');
    expect(messages[0].excerpt).toBe('Could not locate guestbook/layout__init.class or guestbook/layout.clj on classpath.');
    expect(messages[0].location.file).toBe(notFoundPath);
    expect(messages[0].location.position).toEqual([[0, 0], [0, 3]]);
  });

  it('finds nothing wrong with an empty file', async () => {
    const editor = await atom.workspace.open(emptyPath);
    const messages = await lint(editor);

    expect(atom.notifications.addError).not.toHaveBeenCalled();
    expect(messages.length).toBe(0);
  });
});
