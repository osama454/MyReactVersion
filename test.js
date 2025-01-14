class JSXParser {
  constructor(code) {
    this.code = code;
    this.pos = 0;
    this.length = code.length;
  }

  parse() {
    let result = 'import React from "./react.js";\n';
    while (this.pos < this.length) {
      if (this.peek() === '"' || this.peek() === "'" || this.peek() === "`") {
        result += this.parseStringLiteral();
        continue;
      }

      if (
        this.peek() === "<" &&
        (this.peek(1) === ">" || /[\sA-Za-z]/.test(this.peek(1)))
      ) {
        const startPos = this.pos;
        // const jsCode = this.captureJSBeforeJSX();
        try {
          const jsxElement = this.parseJSXElement();
          // result += jsCode;
          result += this.generateCode(jsxElement);
        } catch (e) {
          // Reset position and treat as normal text
          this.pos = startPos;
          result += this.consume();
        }
      } else {
        result += this.consume();
      }
    }
    return result;
  }

  parseStringLiteral() {
    const quote = this.consume();
    let str = quote;

    while (this.pos < this.length) {
      const char = this.consume();
      str += char;
      if (char === quote && str[str.length - 2] !== "\\") {
        break;
      }
    }

    return str;
  }

  captureJSBeforeJSX() {
    let code = "";
    let pos = this.pos;

    while (pos > 0 && /[=:(]/.test(this.code[pos - 1])) {
      pos--;
    }

    while (pos < this.pos) {
      code += this.code[pos];
      pos++;
    }

    return code;
  }

  parseJSXElement() {
    this.consume(); // <
    this.skipWhitespace();

    // Handle Fragment syntax
    if (this.peek() === ">") {
      this.consume(); // >
      const children = this.parseJSXChildren("");
      return {
        type: "JSXElement",
        tagName: "Fragment",
        attributes: {},
        children,
      };
    }

    let tagName = "";
    while (this.pos < this.length && /[A-Za-z0-9]/.test(this.peek())) {
      tagName += this.consume();
    }

    if (!tagName) throw new Error("Invalid JSX");

    const attributes = this.parseJSXAttributes();

    if (this.peek() === "/" && this.peek(1) === ">") {
      this.pos += 2;
      return {
        type: "JSXElement",
        tagName,
        attributes,
        children: [],
      };
    }

    if (this.consume() !== ">") throw new Error("Expected >");

    const children = this.parseJSXChildren(tagName);

    return {
      type: "JSXElement",
      tagName,
      attributes,
      children,
    };
  }

  parseJSXAttributes() {
    const attributes = {};

    this.skipWhitespace();

    while (
      this.pos < this.length &&
      this.peek() !== ">" &&
      this.peek() !== "/"
    ) {
      try {
        const attrName = this.parseJSXAttributeName();
        this.skipWhitespace();

        if (this.consume() !== "=") throw new Error("Expected =");
        this.skipWhitespace();

        attributes[attrName] = this.parseJSXAttributeValue();
        this.skipWhitespace();
      } catch (e) {
        throw new Error("Invalid JSX attributes");
      }
    }

    return attributes;
  }

  parseJSXAttributeName() {
    let name = "";
    while (this.pos < this.length && /[A-Za-z0-9-_]/.test(this.peek())) {
      name += this.consume();
    }
    if (!name) throw new Error("Invalid attribute name");
    return name;
  }

  parseJSXAttributeValue() {
    const quote = this.consume();

    if (quote === "{") {
      return this.parseJSXExpression();
    }

    let value = "";
    while (this.pos < this.length && this.peek() !== '"') {
      value += this.consume();
    }

    if (this.consume() !== '"') throw new Error("Unclosed attribute value");
    return value;
  }

  parseJSXExpression() {
    let expression = "";
    let braceCount = 1;
    let buffer = "";
    let inString = false;
    let stringChar = "";

    while (this.pos < this.length && braceCount > 0) {
      if (!inString && this.peek() === "<" && /[A-Za-z]/.test(this.peek(1))) {
        try {
          const jsxElement = this.parseJSXElement();
          buffer += this.generateCode(jsxElement);
          continue;
        } catch (e) {
          buffer += this.consume();
          continue;
        }
      }

      const char = this.consume();

      if (
        (char === '"' || char === "'") &&
        (buffer.length === 0 || buffer[buffer.length - 1] !== "\\")
      ) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      if (!inString) {
        if (char === "{") braceCount++;
        if (char === "}") braceCount--;
      }

      if (braceCount > 0) {
        buffer += char;
      }
    }

    return {
      type: "JSXExpression",
      code: buffer.trim(),
    };
  }

  parseJSXChildren(parentTag) {
    const children = [];

    while (this.pos < this.length) {
      this.skipWhitespace();

      if (this.peek() === "<" && this.peek(1) === "/") {
        this.pos += 2;
        // For Fragment, just consume the closing tag
        if (parentTag === "") {
          if (this.peek() === ">") {
            this.consume();
            break;
          }
        }

        let closingTag = "";
        while (this.pos < this.length && /[A-Za-z0-9]/.test(this.peek())) {
          closingTag += this.consume();
        }

        if (parentTag && closingTag !== parentTag) {
          throw new Error("Mismatched closing tag");
        }

        this.skipWhitespace();
        if (this.consume() !== ">") throw new Error("Expected >");
        break;
      }

      if (this.peek() === "{") {
        this.consume();
        children.push(this.parseJSXExpression());
        continue;
      }

      if (this.peek() === "<") {
        try {
          children.push(this.parseJSXElement());
        } catch (e) {
          let text = "<";
          this.consume(); // consume <
          while (
            this.pos < this.length &&
            this.peek() !== "<" &&
            this.peek() !== "{"
          ) {
            text += this.consume();
          }
          if (text.trim()) {
            children.push(text.trim());
          }
        }
        continue;
      }

      let text = "";
      while (
        this.pos < this.length &&
        this.peek() !== "<" &&
        this.peek() !== "{"
      ) {
        text += this.consume();
      }
      if (text.trim()) {
        children.push(text.trim());
      }
    }

    return children;
  }

  generateCode(parsedItem) {
    if (!parsedItem || typeof parsedItem !== "object") {
      return parsedItem;
    }

    if (parsedItem.type === "JSXExpression") {
      return parsedItem.code;
    }

    if (parsedItem.type === "JSXElement") {
      const attrs = Object.entries(parsedItem.attributes)
        .map(([key, value]) => {
          if (typeof value === "object" && value.type === "JSXExpression") {
            return `${key}: ${value.code}`;
          }
          return `${key}: "${value}"`;
        })
        .join(", ");

      const childrenCode = parsedItem.children
        .map((child) => {
          if (typeof child === "string") {
            return `'${child.replace(/'/g, "\\'")}'`;
          }
          if (child.type === "JSXExpression") {
            return child.code;
          }
          return this.generateCode(child);
        })
        .filter(Boolean)
        .join(", ");

      const elementName =
        parsedItem.tagName === "Fragment"
          ? "React.Fragment"
          : /^[A-Z]/.test(parsedItem.tagName)
          ? parsedItem.tagName
          : `"${parsedItem.tagName}"`;
      return `React.createElement(${elementName}, ${attrs ? `{${attrs}}` : "null"}${
        childrenCode ? ", " + childrenCode : ""
      })`;
    }

    return "";
  }

  peek(ahead = 0) {
    return this.pos + ahead < this.length ? this.code[this.pos + ahead] : null;
  }

  consume() {
    return this.pos < this.length ? this.code[this.pos++] : null;
  }

  skipWhitespace() {
    while (this.pos < this.length && /\s/.test(this.peek())) {
      this.consume();
    }
  }
}

let code = `
<div/>
<   div  />
return toggle ? (
  <div>
    <F name="osama" s={24} key={1} />
    <button
      onClick={() => {
        console.log("press");
        setToggle(false);
      }}
    >
      "click me"
    </button>
    "test"
  </div>
) : (
  <div>'Null'</div>
);
(<App/>)
render(<App/>, document.getElementById("root"));
`;
console.log([1,2,[3,4],5].flat())
console.log(new JSXParser(code).parse());
