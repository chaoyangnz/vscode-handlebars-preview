import * as assert from "assert";
import { join } from "path";
import { renderTemplate, HelperFunction } from '../../src/extension';


suite("lib/renderContent", () => {
  test("render something simple", () => {
    const html = renderTemplate("Hello <b>World!</b>", { data: {}, helperFns: [] });
    assert.equal(html, "Hello <b>World!</b>");
  });

  test("render with context", () => {
    console.log(join(__dirname, "../examples/simple.handlebars"));
    const html = renderTemplate("Super {{foo}}!", { data: { foo: "bar" }, helperFns: [] });
    assert.equal(html, "Super bar!");
  });

  const helperFns: HelperFunction[] = [{
    name: 'capitalize',
    body: (s: string) => s.toUpperCase()
  }, {
    name: 'ask',
    body: (s: string) => `${s}???`
  }];

  test("render with a helper function", () => {
    const html = renderTemplate('SUPER {{capitalize foo}}!', { data: { "foo": "bar" }, helperFns });
    assert.equal(html, "SUPER BAR!");
  });

  test("render with nested helper functions", () => {
    const html = renderTemplate('SUPER {{capitalize (ask foo)}}!', { data: { "foo": "bar" }, helperFns });
    assert.equal(html, "SUPER BAR???!");
  });
});
