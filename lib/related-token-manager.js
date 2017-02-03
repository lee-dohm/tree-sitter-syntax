const {Range} = require('atom');
const {debounce} = require('underscore-plus');

module.exports =
class RelatedTokenManager {
  constructor (editor, document, providerFunction) {
    this.editor = editor
    this.document = document
    this.providerFunction = providerFunction
    this.markers = null
    const selectionChanged = debounce(this.selectionChanged.bind(this), 100);
    editor.onDidChangeSelectionRange(selectionChanged)
  }

  selectionChanged () {
    if (this.markers) {
      for (let i = 0, n = this.markers.length; i < n; i++) {
        this.markers[i].destroy()
      }
    }

    this.markers = []
    const selection = this.editor.getLastSelection()
    if (selection.isEmpty()) {
      const currentPosition = selection.getBufferRange().start
      const currentNode = this.document.rootNode.descendantForPosition(currentPosition)
      let matches = this.providerFunction(currentNode, this.editor.getBuffer())
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
    }
  }
};