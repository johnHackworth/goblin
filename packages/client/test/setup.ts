import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.window = dom.window as any;
global.document = dom.window.document as any;
global.navigator = dom.window.navigator as any;
global.Node = dom.window.Node as any;
global.Element = dom.window.Element as any;
global.DocumentFragment = dom.window.DocumentFragment as any;
