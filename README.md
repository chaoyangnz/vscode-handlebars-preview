# Handlebars Preview for Visual Studio Code
Live preview for your Handlebars templates (supports a user-defined context data and helper functions)

Upcoming release:
* Extension compiles Handlebars template on the fly

## Example (Reference context source from within the handlebars template)
NOTE: the context source file path is relative

test.hbs:
```handlebars
{{!-- vscode-handlebars-preview-context-source=./source.js --}}
{{ capitalize foo }} - {{ duplicate goo }}
```
source.js
```js
module.exports = {
  data: {
    foo: 'bar',
    goo: 'qes'
  },
  helperFns: [{
    name: 'capitalize',
    body: s => s.toUpperCase()
  }, {
    name: 'duplicate',
    body: s => `${s}${s}`
  }]
}
```

## Example (Separate data vs helper functions sources)
In the same directory:

test.hbs:
```handlebars
{{ capitalize foo }} - {{ duplicate goo }}
```

test.hbs.json
```json
{ 
  "foo": "bar",
  "goo": "qes"
}
```

test.hbs.js
```js
module.exports = [{
  name: 'capitalize',
  body: s => s.toUpperCase()
}, {
  name: 'duplicate',
  body: s => `${s}${s}`
}]
```

- Use the keybinding 'ctrl+p h'
- Type "Handlebars: Open Preview" (Given the example files above, the output is: `BAR - qesqes`)

## Credits

- [Handlebars.js: Minimal Templating on Steroids](http://handlebarsjs.com/)
- [Handlebars for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=andrejunges.Handlebars)
- [A HTML previewer for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=tht13.html-preview-vscode)
- [Original plugin repository](https://github.com/chaliy/vscode-handlebars-preview)

## License

MIT
