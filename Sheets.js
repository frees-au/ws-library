
/**
 * Class with spreadsheet data processing tools.
 */

// Globally accessible factory method.
function createGoogleSheets() {
  return new GoogleSheets();
} 

/**
 * Google Sheets helper class.
 * 
 * This class encapsulates logic for working with a Google Sheet, ie it
 * assumes it is running in the context of a google app script which
 * is inside a Google Sheets container.
 */
class GoogleSheets {

  /**
   * Wipe a sheet's *data* completely and replace it with new data.
   *
   * The method used will conserve the sheet itself along with properties like
   * frozen rows, formatting, and named ranges that cover whole columns. The
   * sheet will be resized to match the data being applied.
   *
   * @param sheetName
   *   Name of existing sheet.
   * @param arrayOfArrays
   *   [['Header one', 'Header two'], ['Cotton Sweatshirt XL', 'css004'], ['Cheese', 'touch']]
   *   All the rows should be a consistent length.
   *
   * @return
   *   The data range for inspection or manipulation.
   */
  updateSheetWithData(sheetName, arrayOfArrays) {
    let doc = SpreadsheetApp.getActiveSpreadsheet();
    let targetSheet = doc.getSheetByName(sheetName);

    let sheetRows = targetSheet.getMaxRows();
    let sheetCols = targetSheet.getMaxColumns();

    let dataRows = arrayOfArrays.length;
    let dataCols = arrayOfArrays[0].length;
    // console.log(sheetName, sheetRows, sheetCols, dataRows, dataCols);

    if (dataRows < sheetRows) {
      // Delete rows to match the data.
      targetSheet.deleteRows(dataRows + 1,  sheetRows - dataRows);
    }
    else if (dataRows > sheetRows) {
      // Add rows to match the data.
      targetSheet.insertRowsAfter(sheetRows, dataRows - sheetRows);
    }

    if (dataCols < sheetCols) {
      // Delete columns to match the data.
      targetSheet.deleteColumns(dataCols + 1,  sheetCols - dataCols);
    }
    else if (dataCols > sheetCols) {
      // Add columns to match the data.
      targetSheet.insertColumnsAfter(sheetCols, dataCols - sheetCols);
    }

    let dataRange = targetSheet.getRange(1, 1, dataRows, dataCols);
    dataRange.setValues(arrayOfArrays);

    return dataRange;
  }

  /**
   * Blindly inserts new data at the top of a sheet.
   *
   * This allows for efficient adding of data to data sets. We insert the data
   * at the top so that we can use native sheets removeDuplicates() later.
   * This ends up being the most efficient method I have found.
   *
   * The method used will conserve the sheet, so there is an assumption that
   * the structure of the sheet matches the data being inserted. Compare this
   * with updateSheetWithData() which descructively resplaces all of the data.
   *
   * @param sheetName
   *   Name of the sheet (currently must exist).
   * @param arrayOfArrays
   *   [['Header one', 'Header two'], ['Cotton Sweatshirt XL', 'css004'], ['Cheese', 'touch']]
   *   All the rows should be a consistent length and match the structure of existing data.
   *
   * @return
   *   The data range for inspection or manipulation.
   */
  insertData(sheetName, arrayOfArrays) {
    let doc = SpreadsheetApp.getActiveSpreadsheet();
    let targetSheet = doc.getSheetByName(sheetName);

    let sheetRows = targetSheet.getMaxRows();
    let sheetCols = targetSheet.getMaxColumns();

    let dataRows = arrayOfArrays.length;
    let dataCols = arrayOfArrays[0].length;

    if (dataCols > sheetCols) {
      throw Error("The target sheet does not have enough columns.");
    }
    if (dataRows < 1) {
      // Not an error but nothing to do.
      return;
    }

    targetSheet.insertRowsAfter(1, dataRows);

    // Paste in the data, efficient.
    let dataRange = targetSheet.getRange(1, 1, dataRows, dataCols);
    dataRange.setValues(arrayOfArrays);

    return dataRange;
  }

  /**
   * Remove duplicates and empty rows.
   * 
   * This works well with scripts which are adding a lot of data
   * using insertData(), as it reapplies data consistency.
   */
  cleanUpSheet(sheetName, primaryKeyColumn = 1) {
    let doc = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = doc.getSheetByName(sheetName);

    // Using internal removeDuplicates() (as if through standard menu UI) is fastest.
    if (typeof primaryKeyColumn === 'number' && primaryKeyColumn > 0) {
      sheet.getDataRange().removeDuplicates([primaryKeyColumn]);
    }
    else if (Array.isArray(primaryKeyColumn)) {
      sheet.getDataRange().removeDuplicates(primaryKeyColumn);
    }

    // Clean up any remaining empty rows for good measure.
    deleteEmptyRows(sheetName, primaryKeyColumn = 1);
    SpreadsheetApp.flush();
  }

  /**
   * Runs does the sheet and removes any rows which are empty.
   * 
   * Manually manipulating a spreadsheet like this can be slow but
   * in normal contexts of these scripts it is just checking for errant
   * rows.
   */
  deleteEmptyRows(sheetName, primaryKeyColumn = 1) {
    let ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);

    // Fast way to wipe empty rows from the end of a sheet.
    let filled = sheet.getLastRow();
    let total = sheet.getMaxRows();
    if (total > filled) {
      sheet.deleteRows(filled + 1, total - filled);
    }

    let primaryKeyValues = sheet
      .getRange(1, 1, sheet.getLastRow(), 1)
      .getValues();

    // Slow way to mop up orphans.
    for (let i = primaryKeyValues.length-1; i >= 0; i--) {
      if (!primaryKeyValues[i][primaryKeyColumn-1]) {
        sheet.deleteRow(i+1);
      }
    }
  }

  /**
   * Target a sheet with a known structure and get a lookup list.
   *
   * @param sheetName string
   *   The name of a sheet in the current document.
   * @param keyColumn int
   *   The column, assumably unique, that will serve for keys.
   * @param valueColumns object
   *   Each property, and the column that will populate it.
   * @param cacheMinutes
   *   Will use the local sheet storage if the length of the cached data is less than 100kb.
   */
  getKeyedColumnsFromSheet(sheetName, keyColumn = 0, valueColumns = {'someValue': 1}, cacheMinutes = 60) {
    let data = {};
    let cacheName = 'props-' + sheetName;
    let cache = CacheService.getScriptCache();
    let cached = cache.get(cacheName);
    if (cacheMinutes > 0 && cached != null) {
      console.log('Loading ' + cacheName + ' from cache.');
      return JSON.parse(cached);
    }

    let ss = SpreadsheetApp.getActiveSpreadsheet();
    let targetSheet = ss.getSheetByName(sheetName);
    let sheetValues = targetSheet.getDataRange().getValues();
    for (let i = 1; i < sheetValues.length; i++) {
      let item = {};
      for (let keyName in valueColumns) {
        item[keyName] = sheetValues[i][valueColumns[keyName]];
      }
      data[sheetValues[i][keyColumn]] = item;
    }

    let toCache = JSON.stringify(data);
    if (toCache.length > 100000) {
      console.log(cacheName + ' is too large to cache, so your fancy solution has probably outgrown a spreadsheet.')
    }
    else {
      console.log('Caching ' + cacheName + ' of length ' + toCache.length)
      cache.put(cacheName, toCache, cacheMinutes * 10);
    }

    return data;
  }

}