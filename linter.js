const jsonMap = require("./json-source-map.js");

const size = [
  "xxxs",
  "xxs",
  "xs",
  "s",
  "m",
  "l",
  "xl",
  "xxl",
  "xxxl",
  "xxxxl",
  "xxxxxl"
];

class Warning {
  constructor(obj) {
    this.text = {
      code: "WARNING.TEXT_SIZES_SHOULD_BE_EQUAL",
      mods: { size: obj.size || "none" },
      error: "Тексты в блоке warning должны быть одного размера",
      pass: true
    };

    this.button = {
      code: "WARNING.INVALID_BUTTON_SIZE",
      error: "Размер кнопки блока warning должен быть на 1 шаг больше текста",
      mods: { size: obj.size || "none" },
      pass: true
    };

    this.placeholder = {
      code: "WARNING.INVALID_PLACEHOLDER_SIZE",
      error: "Недопустимые размеры для блока placeholder",
      mods: { size: ["s", "m", "l"] },
      pass: true
    };

    this.sequence = {
      code: "WARNING.INVALID_BUTTON_POSITION",
      error: "Блок button не может находиться перед блоком placeholder",
      placeholder: false,
      button: false,
      pass: true
    };

    this.path = obj.path;
  }
}
function warning(obj, rule) {
  if (obj.block === "text") {
    if (rule.text.mods.size === "none") {
      const sizeButton = size[size.indexOf(obj.mods.size) + 1];
      rule.text.mods.size = obj.mods.size;

      if (
        rule.button.mods.size !== "none" &&
        rule.button.mods.size !== sizeButton
      ) {
        this.errors.push({
          code: rule.button.code,
          error: rule.button.error,
          location: {
            start: {
              column: this.pointers[rule.path].value.column,
              line: this.pointers[rule.path].value.line
            },
            end: {
              column: this.pointers[rule.path].valueEnd.column,
              line: this.pointers[rule.path].valueEnd.line
            }
          }
        });

        rule.button.pass = false;
      }

      rule.button.mods.size = sizeButton;
    }

    if (rule.text.mods.size !== obj.mods.size && rule.text.pass) {
      this.errors.push({
        code: rule.text.code,
        error: rule.text.error,
        location: {
          start: {
            column: this.pointers[rule.path].value.column,
            line: this.pointers[rule.path].value.line
          },
          end: {
            column: this.pointers[rule.path].valueEnd.column,
            line: this.pointers[rule.path].valueEnd.line
          }
        }
      });

      rule.text.pass = false;
    }
  }

  if (obj.block === "button") {
    rule.sequence.button = true;

    if (!rule.sequence.placeholder && rule.sequence.pass) {
      this.errors.push({
        code: rule.sequence.code,
        error: rule.sequence.error,
        location: {
          start: {
            column: this.pointers[rule.path].value.column,
            line: this.pointers[rule.path].value.line
          },
          end: {
            column: this.pointers[rule.path].valueEnd.column,
            line: this.pointers[rule.path].valueEnd.line
          }
        }
      });

      rule.sequence.pass = false;
    }

    if (rule.button.mods.size === "none") {
      rule.button.mods.size = obj.mods.size;
      return;
    }

    if (rule.button.mods.size !== obj.mods.size && rule.button.pass) {
      this.errors.push({
        code: rule.button.code,
        error: rule.button.error,
        location: {
          start: {
            column: this.pointers[rule.path].value.column,
            line: this.pointers[rule.path].value.line
          },
          end: {
            column: this.pointers[rule.path].valueEnd.column,
            line: this.pointers[rule.path].valueEnd.line
          }
        }
      });
      rule.button.pass = false;
    }
  }

  if (obj.block === "placeholder") {
    rule.sequence.placeholder = true;

    if (rule.sequence.button && rule.sequence.pass) {
      this.errors.push({
        code: rule.sequence.code,
        error: rule.sequence.error,
        location: {
          start: {
            column: this.pointers[rule.path].value.column,
            line: this.pointers[rule.path].value.line
          },
          end: {
            column: this.pointers[rule.path].valueEnd.column,
            line: this.pointers[rule.path].valueEnd.line
          }
        }
      });

      rule.sequence.pass = false;
    }

    if (
      !rule.placeholder.mods.size.includes(obj.mods.size) &&
      rule.placeholder.pass
    ) {
      this.errors.push({
        code: rule.placeholder.code,
        error: rule.placeholder.error,
        location: {
          start: {
            column: this.pointers[rule.path].value.column,
            line: this.pointers[rule.path].value.line
          },
          end: {
            column: this.pointers[rule.path].valueEnd.column,
            line: this.pointers[rule.path].valueEnd.line
          }
        }
      });

      rule.placeholder.pass = false;
    }
  }
}

function reqcursion(obj, path = "", rule = {}) {
  rule = { ...rule };

  if (Array.isArray(obj)) {
    obj.forEach((e, i) => {
      reqcursion(e, `${path}/${i}`, rule);
    });
    return;
  }

  if (obj.block === "warning") {
    rule.warning = new Warning({ path });
  }

  // console.log(`---- > \n Елемент ${obj}\n Path ${path}\n Правила`, rule);

  if (obj.hasOwnProperty("content")) {
    const newPath = `${path}/content`;
    reqcursion(obj.content, newPath, rule);
    return;
  }

  if (rule.hasOwnProperty("warning")) {
    warning(obj, rule.warning);
  }
}

/**
 * @param {string} str
 */

function lint(str) {
  const obj = jsonMap.parse(str);

  this.errors = [];
  this.pointers = obj.pointers;

  const req = reqcursion.bind(this);
  req(obj.data);

  return this.errors;
}

module.exports = lint;
