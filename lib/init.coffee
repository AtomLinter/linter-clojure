module.exports =
  config:
    javaExecutablePath:
      type: 'string'
      default: ''
    clojureExecutablePath:
      type: 'string'
      default: ''

  activate: ->
    console.log 'activate linter-clojure'
