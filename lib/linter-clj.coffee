{exec, child} = require 'child_process'
linterPath = atom.packages.getLoadedPackage("linter").path
Linter = require "#{linterPath}/lib/linter"

class LinterCLJ extends Linter
  # The syntax that the linter handles. May be a string or
  # list/tuple of strings. Names should be all lowercase.
  @syntax: ['source.clojure', 'source.clojurescript']

  # A string, list, tuple or callable that returns a string, list or tuple,
  # containing the command line (with arguments) used to lint.
  cmd: ''

  linterName: 'clj'

  # A regex pattern used to extract information from the executable's output.
  regex: 'RuntimeException:(?<message>.*), compiling:(.*):(?<line>\\d+):(?<col>\\d+)'

  isNodeExecutable: no

  errorStream: 'stderr'

  constructor: (editor) ->
    super(editor)

    atom.config.observe 'linter-clj.javaExecutablePath', =>
      @executablePath = atom.config.get 'linter-clj.javaExecutablePath'

    atom.config.observe 'linter-clj.cljExecutablePath', =>
      @cmd = 'java -jar ' + atom.config.get('linter-clj.cljExecutablePath') + ' -i'

  destroy: ->
    atom.config.unobserve 'linter-clj.javaExecutablePath'
    atom.config.unobserve 'linter-clj.cljExecutablePath'

module.exports = LinterCLJ
