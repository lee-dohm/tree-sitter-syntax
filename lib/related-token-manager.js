const {Range} = require('atom')
const {debounce} = require('underscore-plus')

module.exports =
class RelatedTokenManager {
  constructor (editor, languageMode, providerFunction, rootEmitter) {
    this.editor = editor
    this.languageMode = languageMode
    this.providerFunction = providerFunction
    this.markers = null
    this.rootEmitter = rootEmitter
  }

  start () {
    const selectionChanged = debounce(this.selectionChanged.bind(this), 100)
    return this.editor.onDidChangeSelectionRange(selectionChanged)
  }

  selectionChanged () {
    if (this.markers) {
      for (let i = 0, n = this.markers.length; i < n; i++) {
        this.markers[i].destroy()
      }
    }

    this.markers = []
    const selection = this.editor.getLastSelection()
    const {start, end} = selection.getBufferRange()
    const {rootNode} = this.languageMode.tree || this.languageMode.document
    const currentNode = rootNode.descendantForPosition(start, end)
    let matches = this.providerFunction(currentNode, this.editor.getBuffer(), rootNode)
    if (matches) {
      for (let i = 0, n = matches.length; i < n; i++) {
        const match = matches[i];
        const range = new Range(match.node.startPosition, match.node.endPosition)
        const marker = this.editor.markBufferRange(range, {invalidate: 'touch'})
        const decoration = this.editor.decorateMarker(marker, {
          type: 'highlight',
          class: match.highlightClass
        })
        this.markers.push(marker)
      }
    }

    this.rootEmitter.emit("markers-created", {
      editor: this.editor,
      markers: this.markers
    })
  }
}
