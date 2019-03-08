# Handlebars Preview for Visual Studio Code

Live preview for your Handlebars templates. Extension compiles Handlebars template on the fly, apply preview data and render resulting HTML in separate window.

## Features

- Live prview for Handlebars templates. Preview updates as you type.
- Support for user-defined data and helper functions


## Example 
Have the following files in the same directory:

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
