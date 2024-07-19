/**
 * Turn a complex json response into a flat array of arrays. This can be
 * used to populate, for example, a spreadsheet sheet or other tabular data.
 *
 * @param columns
 *   * Keys are spreadsheet headers.
 *   * Values are function callbacks that return the data from the json item.
 * @param jsonArrayOfObjects
 *   * Iterable json array with each item being a consistently structured thing that the callbacks in columns know how to interact with.
 *
 * @return
 *   * A flattened array of arrays to go into a spreadsheet tab.
 */
function processJsonItemsWithCallbacks(columnsWithCallbacks, jsonArrayOfObjects) {
  var processedData = [];

  processedData.push(Object.keys(columnsWithCallbacks)); // Header row.
  for (let i = 0, len = jsonArrayOfObjects.length; i < len; i++) {
    let rowData = [];
    for (let key in columnsWithCallbacks) {
      let apply = columnsWithCallbacks[key];
      // If 'apply' is callable, call it.
      if (typeof apply === 'function') {
        rowData.push(apply(key, jsonArrayOfObjects[i]));
      }
      // Otherwise assume it's a key.
      else if (typeof apply === 'string') {
        if (jsonArrayOfObjects[i]) {
          rowData.push(jsonArrayOfObjects[i][apply]);
        }
      }
      else {
          rowData.push(null);
      }
    }
    processedData.push(rowData);
  }

  return processedData;
}
