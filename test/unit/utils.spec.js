const { jsonParser } = require("../../src/utils");

test("should parsed json string to be equal to parsed js string", () => {
	expect(jsonParser("{\"var\": 1, \"array\": [1, 2, \"hello\", {}]}")).toEqual(
		jsonParser("{var: 1, array: [1, 2, \"hello\", {}]}")
	);

	expect(
		jsonParser(`{"menu": {
    "id": "file",
    "value": "File",
    "popup": {
      "menuitem": [
        {"value": "New", "onclick": "CreateNewDoc()"},
        {"value": "Open", "onclick": "OpenDoc()"},
        {"value": "Close", "onclick": "CloseDoc()"}
      ]
    }
  }}`)
	).toEqual(
		jsonParser(`{menu: {
    id: "file",
    value: "File",
    popup: {
      menuitem: [
        {value: "New", onclick: "CreateNewDoc()"},
        {value: "Open", onclick: "OpenDoc()"},
        {value: "Close", onclick: "CloseDoc()"}
      ]
    }
  }}`)
	);
});
