// Globally accessible factory method.
function createAirtable(apiKey, base, verbose = true) {
  return new Airtable(apiKey, base, verbose);
} 

/**
 * Airtable helper class.
 * 
 * This class encapsulates logic for working with an Airtable Base.
 */
class Airtable {

  constructor(apiKey, base, verbose = true) {
    this.apiKey = apiKey;
    this.base = base;
    this.verbose = verbose;
    this.endpoint = 'https://api.airtable.com/v0/';
  }

  /** 
   * Build a lookup object from a table.
   * 
   * @param table
   *   Table identifier like 'tbl...')
   * @param key
   *   Field identifier to use for the key, can be 'fld...' (or null for the internal record ID).)
   * @param properties
   *   Object of string. The desired property keys and the field that makes the value.
   *   If you pass a string it will assume you want a simpler key->value lookup.
   * @param cacheSeconds
   *   Cache by default to avoid hitting API and UrlFetch limits, defaults to 12 hours.
   * @param cachId
   *   If you are calling the same table for multiple lookups you can set a different cache id.
   */
  getLookupList(table, key, properties, cacheSeconds = 43200, cacheId = '') {
    const cache = CacheService.getScriptCache();
    let cacheName = cacheId;
    if (cacheName == '') { 
      cacheName = `airtable-lookup-${this.base}-${table}`;
    }

    const cached = cache.get(cacheName);
    if (cacheSeconds > 0 && cached != null) {
      console.log('Loading ' + cacheName + ' from cache.');
      return JSON.parse(cached);
    }    

    let lookup = {};
    const meta = this.fieldsMeta(table);
    const records = this.getRecords(table);

    for (let i = 0; i < records.length; i++) {
      let lookupKey;
      if (key == null) {
        lookupKey = records[i].id;
      }
      else {
        lookupKey = records[i].fields[meta[key].name];
      }
      lookup[lookupKey] = {};
      if (typeof lookupKey != 'string') {
        // console.log(records[i].id + ' appears to be empty.')
      }
      else if (typeof properties == 'string') {
        lookup[lookupKey] = records[i].fields[meta[properties].name];
      }
      else {
        for (const [propName, propKey] of Object.entries(properties)) {
          lookup[lookupKey][propName] = records[i].fields[meta[propKey].name];
        }
      }
    }

    // Always cache to at least replace an old cache.
    let toCache = JSON.stringify(lookup);
    if (toCache.length > 100000) {
      console.log(cacheName + ' is too large to cache, so it is being loaded every time.')
    }
    else {
      console.log('Caching ' + cacheName + ' of length ' + toCache.length)
      cache.put(cacheName, toCache, cacheSeconds + 1);
    }

    return lookup;
  }

  /** 
   * Get a lookup of the meta of a base tabe, fields and their IDs.
   */
  fieldsMeta(table) {
    let fieldsLookup = {};
    let baseEndpoint = this.endpoint + 'meta/bases/' + this.base + '/tables';
    // console.log(baseEndpoint);
    let meta = JSON.parse(this._fetchResponse(baseEndpoint).getContentText());
    for (let i = 0, len = meta.tables.length; i < len; i++) {
      if (meta.tables[i].id === table) {
        let fields = meta.tables[i].fields;
        for (let i = 0, len = fields.length; i < len; i++) {
          // fieldsLookupDebug[fields[i].id] = fields[i].name;
          fieldsLookup[fields[i].id] = fields[i];
        }
      }
    }
    return fieldsLookup;
    // console.log(fieldsLookupDebug);
  }

  /**
   * Create a record.
   * 
   * Airtable does allow up to 10 records to be written at once. This isn't that.
   */
  createRecord(table, record) {
    let endpoint = this.endpoint + this.base + '/' + table;
    let httpOptions = {
      "method": "GET",
      "headers": {
        'Authorization': 'Bearer ' + this.apiKey,
        'Content-Type': 'application/json'
      },
    };    

    let payload = {"records": [record]}
    httpOptions['payload'] = JSON.stringify(payload);
    // console.log(httpOptions);
    let response = UrlFetchApp.fetch(endpoint, httpOptions);
  }

  /**
   * Update an existing record.
   */
  updateRecord(table, recordId, record) {
    let endpoint = this.endpoint + this.base + '/' + table + '/' + recordId;
    let httpOptions = {
      "method": "PATCH",
      "headers": {
        'Authorization': 'Bearer ' + this.apiKey,
        'Content-Type': 'application/json'
      },
    };

    let payload = record;
    httpOptions['payload'] = JSON.stringify(payload);
    // console.log(httpOptions);
    let response = UrlFetchApp.fetch(endpoint, httpOptions);
  }

  /**
   * Retrieve all records from a table.
   */
  getRecords(table) {
    const records = this.fetchAllResults(this.endpoint + this.base + '/' + table);
    return records;
  }

  /**
   * Loops until all pages are received. Returns an array of results.
   * 
   * @param endPoint
   *   One of this.ENDPOINTS, usually a table.
   * @param conditions
   *   TBA
   */
  fetchAllResults(endPoint, conditions = []) {
    let results = [];
    let offset = false;
    let response = this._fetchResponse(endPoint, offset, conditions);
    let responseJson = JSON.parse(response.getContentText());
    for (const [key, value] of Object.entries(responseJson.records)) {
      results.push(value);
    }

    let loadMore = ('offset' in responseJson);
    while (loadMore) {
      response = this._fetchResponse(endPoint, responseJson.offset, conditions);
      responseJson = JSON.parse(response.getContentText());
      for (const [key, value] of Object.entries(responseJson.records)) {
        results.push(value);
      }
      loadMore = ('offset' in responseJson);
    }

    console.log(`Fetched ${results.length} records from ${endPoint}.`);
    return results;    
  }

  /**
   * Make a single call to Airtable.
   * 
   * @param endPoint
   *   A streamtime endpoint @see Streamtime.Endpoint
   * @param offset
   *   Start at this number of records.
   * @param paramsNotYetSupported
   *   An array of conditions @see Streamtime.Condition
   */
  _fetchResponse(endPoint, offset = false, paramsNotYetSupported = []) {
    let httpOptions = {
      "method": "GET",
      "headers": {
        'Authorization': 'Bearer ' + this.apiKey,
        'Content-Type': 'application/json'
      },
    };

    let urlParams = {};
    if (offset) {
      urlParams['offset'] = offset; 
    }

    let callUrl = endPoint;
    if (Object.keys(urlParams).length > 0) {
      // Generate the param string and a full URL.
      let paramString = Object.keys(urlParams).map(function(key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(urlParams[key]);
      }).join('&');
      callUrl = callUrl + (callUrl.indexOf('?') >= 0 ? '&' : '?') + paramString;
    }

    let response = UrlFetchApp.fetch(callUrl, httpOptions);
    return response;
  }

  /**
   * Simple logger yo.
   */
  _log(message) {
    if (this.verbose) {
      console.log(message);
    }
  }

}
