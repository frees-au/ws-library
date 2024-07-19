// Globally accessible factory method.
function createStreamtime(apiKey, debug = false) {
  return new Streamtime(apiKey, debug);
}

/**
 * Streamtime helper class.
 *
 * Useful methods are generally useful for most cases. Described in this example.
 *
 *   const token = "abcdefg...";
 *   let st = new Streamtime(token);
 *   let activeJobs = st.fetchActiveJobs();
 */
class Streamtime {

  constructor(apiKey, debug = FALSE) {
    this.apiKey = apiKey;
    this.debug = debug;
  }

  getFlags() {
    return Streamtime.Flag;
  }

  /**
   * Object full of endpoints.
   */
  static get Flag() {
    return {
      'JobsActive': 1,
      'JobsAll': 2,
      'JobsArchived': 4,
    }
  }

  /**
   * Object full of endpoints.
   */
  static get EndPoint() {
    return {
      'Jobs': 'https://api.streamtime.net/v1/jobs/search',
      'JobItems': 'https://api.streamtime.net/v1/job_items/search',
      'Companies': 'https://api.streamtime.net/v1/companies/search',
      'Users': 'https://api.streamtime.net/v1/users',
      'Expenses': 'https://api.streamtime.net/v1/logged_expenses/search',
      'Invoices': 'https://api.streamtime.net/v1/invoices/search',
      'InvoiceLines': 'https://api.streamtime.net/v1/invoice_line_items/search',
      'Quotes': 'https://api.streamtime.net/v1/quotes/search',
      'Time': 'https://api.streamtime.net/v1/logged_times/search',
    }
  }

  /**
   * Collection of methods that return valid Streamtime filters.
   *
   * conditionMatchTypeId
   *   https://documenter.getpostman.com/view/802974/RWgtSwbn#ec55ed64-1abf-4c14-8038-8d9bed3c8ced
   * filterGroupTypeId
   *   https://documenter.getpostman.com/view/802974/RWgtSwbn#df1419db-a9be-4c87-b6ba-715f863e3e81
   * valueMatchTypeId
   *   https://documenter.getpostman.com/view/802974/RWgtSwbn#91411465-9a15-4e35-a7ca-1058d8b4fc83
   */
  static get Condition() {
    return {
      JobStatus: (flagJobStatus = Streamtime.Flag.JobsActive) => {
        if (flagJobStatus == Streamtime.Flag.JobsActive) {
          return {
            "conditionMatchTypeId":2,
            "filterGroupTypeId":3,
          };
        }
        else if (flagJobStatus == Streamtime.Flag.JobsAll) {
          return {
            "conditionMatchTypeId":2,
            "filterGroupTypeId":3,
            "filters":[
              {"valueMatchTypeId":"1","value":2}, // Done
              {"valueMatchTypeId":"1","value":1}, // In play
              {"valueMatchTypeId":"1","value":5}, // Paused
              {"valueMatchTypeId":"1","value":4}, // Archived
            ]
          };
        }
        else if (flagJobStatus == Streamtime.Flags.JobsArchived) {
          return {
            "conditionMatchTypeId":2,
            "filterGroupTypeId":3,
            "filters":[
              {"valueMatchTypeId":"1","value":2}, // Done
              {"valueMatchTypeId":"1","value":1}, // In play
              {"valueMatchTypeId":"1","value":5}, // Paused
            ]
          };
        }
      },
      JobArchivedFromDate: (daysAgo = 30) => {
        let dateParam = Streamtime._getParamDateOffset(daysAgo * -1);
        return {
          "conditionMatchTypeId":1,
          "filterGroupTypeId":134,
          "filters": [
            {
              "valueMatchTypeId": "5",
              "value": dateParam,
              "isRelativeDateValueMatchType": "false"
            }
          ]
        };
      },
      InvoiceStatus: () => {
        return {
          "conditionMatchTypeId":2,
          "filterGroupTypeId":26,
          "filters":[
            // {"valueMatchTypeId":"1","value":1}, // Draft
            {"valueMatchTypeId":"1","value":2}, // Awaiting payment
            {"valueMatchTypeId":"1","value":3}, // Paid
            // {"valueMatchTypeId":"1","value":5}, // Voided
            {"valueMatchTypeId":"1","value":7}, // Can't remember why
            // {"valueMatchTypeId":"1","value":8}, // Credit note
          ]
        };
      },
      InvoiceStatusUnpaid: () => {
        return {
          "conditionMatchTypeId":2,
          "filterGroupTypeId":26,
          "filters":[
            {"valueMatchTypeId":"1","value":2}, // Awaiting payment
          ]
        };
      },
      InvoiceFromDate: (daysAgo = 30) => {
        let dateParam = Streamtime._getParamDateOffset(daysAgo * -1);
        return {
          "conditionMatchTypeId":1,
          "filterGroupTypeId":35,
          "filters": [
            {
              "valueMatchTypeId": "5",
              "value": dateParam,
              "isRelativeDateValueMatchType": "false"
            }
          ]
        };
      },
      QuoteStatus: () => {
        return {
          "conditionMatchTypeId":2,
          "filterGroupTypeId":36,
          "filters":[
            {"valueMatchTypeId":"1","value":1},
            {"valueMatchTypeId":"1","value":2},
            {"valueMatchTypeId":"1","value":5},
          ]
        };
      },
      TimeFromDate: (fromDate) => {
        return {
          "conditionMatchTypeId": 1,
          "filterGroupTypeId": 5,
          "filters": [
            {
              "valueMatchTypeId": "5",
              "value": fromDate,
              "isRelativeDateValueMatchType": "false"
            }
          ]
        };
      },
      TimeToDate: (toDate) => {
        return {
          "conditionMatchTypeId": 1,
          "filterGroupTypeId": 5,
          "filters": [
            {
              "valueMatchTypeId": "6",
              "value": toDate,
              "isRelativeDateValueMatchType": "false"
            }
          ]
        };
      },
      TimeFromDaysAgo: (daysAgo = 5) => {
        let dateParam = Streamtime._getParamDateOffset(daysAgo * -1);
        return {
          "conditionMatchTypeId": 1,
          "filterGroupTypeId": 5,
          "filters": [
            {
              "valueMatchTypeId": "5",
              "value": dateParam,
              "isRelativeDateValueMatchType": "false"
            }
          ]
        };
      },
      TimeToNow: () => {
        let dateParam = Streamtime._getParamDateOffset(0);
        return {
          "conditionMatchTypeId": 1,
          "filterGroupTypeId": 5,
          "filters": [
            {
              "valueMatchTypeId": "6",
              "value": dateParam,
              "isRelativeDateValueMatchType": "false"
            }
          ]
        };
      },
    };
  }

  /**
   * Get jobs that are not archived.
   */
  fetchAllUsers() {
    this._log('Fetching users');
    return this._fetchGetResults(Streamtime.EndPoint.Users);
  }

  /**
   * Get jobs that are not archived.
   */
  fetchAllCompanies() {
    this._log('Fetching companies');
    return this._fetchAllResults(Streamtime.EndPoint.Companies, []);
  }

  /**
   * Get time.
   *
   * Note that dates are not inclusive - streamtime offers greater/less than.
   *
   * @param fromDate
   *   in YYYY-MM-DD, eg Utilities.formatDate(dateStart, "GMT", "yyyy-MM-dd");
   * @param toDate
   *   in YYYY-MM-DD
   */
  fetchTimeDateRangeDEP(fromDate, toDate, flagJobStatus) {
    return this._fetchAllResults(Streamtime.EndPoint.Time, [
      Streamtime.Condition.JobStatusAll(),
      Streamtime.Condition.TimeFromDate(fromDate),
      Streamtime.Condition.TimeToDate(toDate),
    ]);
  }

  /**
   * Get time from days ago.
   */
  fetchTimeSinceDEP(daysAgo = 5, ) {

    return this._fetchAllResults(Streamtime.EndPoint.Time, [
      Streamtime.Condition.JobStatusAll(),
      Streamtime.Condition.TimeFromDaysAgo(daysAgo),
    ]);
  }

  /**
   * Get time from days ago.
   */
  fetchTimeSinceUntilNowDEP(daysAgo = 5) {
    return this._fetchAllResults(Streamtime.EndPoint.Time, [
      Streamtime.Condition.JobStatusAll(),
      Streamtime.Condition.TimeFromDaysAgo(daysAgo),
      Streamtime.Condition.TimeToNow(),
    ]);
  }

  /**
   * Get time from days ago.
   */
  fetchTimeFutureDEP(daysAgo = 5) {
    return this._fetchAllResults(Streamtime.EndPoint.Time, [
      Streamtime.Condition.JobStatusAll(),
      Streamtime.Condition.TimeFromDaysAgo(0),
    ]);
  }

  /**
   * Get jobs that are not archived.
   */
  fetchJobs(flagJobStatus = Streamtime.Flag.JobsActive) {
    this._log('Fetching jobs');
    return this._fetchAllResults(Streamtime.EndPoint.Jobs, [
      Streamtime.Condition.JobStatus(flagJobStatus),
    ]);
  }

  /**
   * Get jobs that are not archived.
   */
  fetchAllJobs() {
    this._log('Fetching all jobs');
    return this._fetchAllResults(Streamtime.EndPoint.Jobs, [
      Streamtime.Condition.JobStatusAll(),
    ]);
  }

  /**
   * Get jobs that are not archived.
   */
  fetchActiveJobs() {
    this._log('Fetching active jobs');
    return this._fetchAllResults(Streamtime.EndPoint.Jobs, [
      Streamtime.Condition.JobStatusActive(),
    ]);
  }

  /**
   * Get jobs that are archived limited to a number of days.
   *
   * @param sinceDaysAgo
   *   You probably don't want all jobs since forever.
   */
  fetchArchivedJobs(sinceDaysAgo = 5) {
    this._log('Fetching archived jobs updated within ' + sinceDaysAgo + ' days');
    return this._fetchAllResults(Streamtime.EndPoint.Jobs, [
      Streamtime.Condition.JobStatusArchived(),
      Streamtime.Condition.JobArchivedFromDate(sinceDaysAgo),
    ]);
  }

  /**
   * Get jobs that are not archived.
   */
  fetchAllJobItems() {
    this._log('Fetching all job items');
    return this._fetchAllResults(Streamtime.EndPoint.JobItems, [
      Streamtime.Condition.JobStatusAll(),
    ]);
  }

  /**
   * Get jobs that are not archived.
   */
  fetchActiveJobItems() {
    this._log('Fetching active jobs');
    return this._fetchAllResults(Streamtime.EndPoint.JobItems, [
      Streamtime.Condition.JobStatusActive(),
    ]);
  }

  /**
   * Get jobs that are archived limited to a number of days.
   *
   * @param sinceDaysAgo
   *   You probably don't want all jobs since forever.
   */
  fetchArchivedJobItems(sinceDaysAgo = 5) {
    this._log('Fetching archived jobs updated within ' + sinceDaysAgo + ' days');
    return this._fetchAllResults(Streamtime.EndPoint.JobItems, [
      Streamtime.Condition.JobStatusArchived(),
      Streamtime.Condition.JobArchivedFromDate(sinceDaysAgo),
    ]);
  }

  /**
   * Get jobs that are not archived.
   */
  fetchAllExpenses() {
    this._log('Fetching all expenses');
    return this._fetchAllResults(Streamtime.EndPoint.Expenses, [
      Streamtime.Condition.JobStatusAll(),
    ]);
  }

  /**
   * Get expenses of active jobs.
   */
  fetchExpensesOfActiveJobs() {
    this._log('Fetching all expenses from non-archived jobs');
    return this._fetchAllResults(Streamtime.EndPoint.Expenses, [
      Streamtime.Condition.JobStatusActive(),
    ]);
  }

  /**
   * Get expenses of recently archived jobs.
   */
  fetchExpensesOfRecentArchivedJobs(sinceDaysAgo = 5) {
    this._log('Fetching expenses from archived jobs updated within ' + sinceDaysAgo + ' days');
    return this._fetchAllResults(Streamtime.EndPoint.Expenses, [
      Streamtime.Condition.JobStatusArchived(),
      Streamtime.Condition.JobArchivedFromDate(sinceDaysAgo),
    ]);
  }

  /**
   * Get invoices.
   */
  fetchAllInvoices() {
    this._log('Fetching all invoices');
    return this._fetchAllResults(Streamtime.EndPoint.Invoices, [
      Streamtime.Condition.JobStatusAll(),
      Streamtime.Condition.InvoiceStatus(),
    ]);
  }

  /**
   * Get invoices of active jobs.
   */
  fetchInvoicesOfActiveJobs() {
    this._log('Fetching all invoices from non-archived jobs');
    return this._fetchAllResults(Streamtime.EndPoint.Invoices, [
      Streamtime.Condition.JobStatusActive(),
      Streamtime.Condition.InvoiceStatus(),
    ]);
  }

  /**
   * Get invoices of recently archived jobs.
   */
  fetchInvoicesOfRecentArchivedJobs(sinceDaysAgo = 5) {
    this._log('Fetching invoices from archived jobs updated within ' + sinceDaysAgo + ' days');
    return this._fetchAllResults(Streamtime.EndPoint.Invoices, [
      Streamtime.Condition.JobStatusArchived(),
      Streamtime.Condition.JobArchivedFromDate(sinceDaysAgo),
      Streamtime.Condition.InvoiceStatus(),
    ]);
  }

  /**
   * Get invoice lines.
   */
  fetchAllInvoiceLines() {
    this._log('Fetching all invoice lines');
    return this._fetchAllResults(Streamtime.EndPoint.InvoiceLines, [
      Streamtime.Condition.InvoiceFromDate(1500), // Can't use job status here, seems like date filter forces archived job responses.
      Streamtime.Condition.InvoiceStatus(),
    ]);
  }

  /**
   * Get invoice lines of active jobs.
   */
  fetchInvoiceLinesUnpaid() {
    this._log('Fetching all invoice lines from non-archived jobs');
    return this._fetchAllResults(Streamtime.EndPoint.InvoiceLines, [
      Streamtime.Condition.InvoiceFromDate(1500), // Can't use job status here, seems like date filter forces archived job responses.
      Streamtime.Condition.InvoiceStatusUnpaid(),
    ]);
  }

  /**
   * Get invoice lines of recently archived jobs.
   */
  fetchInvoiceLinesRecent(sinceDaysAgo = 5) {
    this._log('Fetching invoice lines ' + sinceDaysAgo + ' days');
    return this._fetchAllResults(Streamtime.EndPoint.InvoiceLines, [
      Streamtime.Condition.InvoiceFromDate(sinceDaysAgo), // Can't use job status here, seems like date filter forces archived job responses.
      Streamtime.Condition.InvoiceStatus(),
    ]);
  }

  /**
   * Get quotes.
   */
  fetchAllQuotes() {
    this._log('Fetching all invoices');
    return this._fetchAllResults(Streamtime.EndPoint.Quotes, [
      Streamtime.Condition.JobStatusAll(),
      Streamtime.Condition.QuoteStatus(),
    ]);
  }

  /**
   * Get quotes of active jobs.
   */
  fetchQuotesOfActiveJobs() {
    this._log('Fetching all invoices from non-archived jobs');
    return this._fetchAllResults(Streamtime.EndPoint.Quotes, [
      Streamtime.Condition.JobStatusActive(),
      Streamtime.Condition.QuoteStatus(),
    ]);
  }

  /**
   * Get quotes of recently archived jobs.
   */
  fetchQuotesOfRecentArchivedJobs(sinceDaysAgo = 30) {
    this._log('Fetching invoices from archived jobs updated within ' + sinceDaysAgo + ' days');
    return this._fetchAllResults(Streamtime.EndPoint.Quotes, [
      Streamtime.Condition.JobStatusArchived(),
      Streamtime.Condition.JobArchivedFromDate(sinceDaysAgo),
      Streamtime.Condition.QuoteStatus(),
    ]);
  }

  /**
   * Loops until all pages are received. Returns an array of results.
   *
   * @param endPoint
   *   A streamtime endpoint @see Streamtime.Endpoint
   * @param conditions
   *   An array of conditions @see Streamtime.Condition
   * @param perPage
   *   Streamtime doesn't like you to get more than 500 records.
   */
  _fetchAllResults(endPoint, conditions, perPage = 300) {
    let loadMore = true;
    let page = 0;
    let results = [];
    while (loadMore) {
      let offset = page * perPage;
      let response = this._fetchResponse(endPoint, conditions, offset, perPage);
      let responseJson = JSON.parse(response.getContentText());
      let arrayResults = [];
      if (Array.isArray(responseJson.searchResults)) {
        arrayResults = responseJson.searchResults;
      }
      else {
        arrayResults = Object.values(responseJson.searchResults);
      }
      if (arrayResults.length > 0) {
        results = results.concat(arrayResults);
        loadMore = true;
        this._log("Fetched " + arrayResults.length);
      }
      else {
        loadMore = false;
      }
      page++;
    }
    console.log('Fetched total: ' + results.length);
    return results;
  }

  /**
   * Some calls require GET.
   */
  _fetchGetResults(endPoint) {
    let response = this._fetchResponse(endPoint, [], 0, 0, 'GET');
    let responseJson = JSON.parse(response.getContentText());
    return responseJson;
  }

  /**
   * Make a single call to Streamtime.
   *
   * @param endPoint
   *   A streamtime endpoint @see Streamtime.Endpoint
   * @param conditions
   *   An array of conditions @see Streamtime.Condition
   * @param offset
   *   Start at this number of records.
   * @param records
   *   Total number of records.
   */
  _fetchResponse(endPoint, conditions, offset = 0, records = 300, method = 'POST') {
    let httpOptions = {
      "method": method,
      "followRedirects": true,
      "muteHttpExceptions": false,
      "headers": {
        "Accept-Encoding": "json",
        "Connection": "keep-alive",
        'Authorization': 'Bearer ' + this.apiKey,
        'Content-Type': 'text/plain',
      }
    };

    if (method == 'POST') {
      let requestBody = {
        'conditionMatchTypeId': 1, // and
        'filterGroups': [],
        'wildcardSearch': '',
        'sortAscending': true,
        'maxResults': records,
      };

      // Simple and-ing of additional conditions.
      if (conditions.length > 0) {
        for (let i = 0; i < conditions.length; i++) {
          requestBody.filterGroups.push(conditions[i]);
        }
      }
      requestBody['offset'] = offset;
      httpOptions['payload'] = JSON.stringify(requestBody);
    }

    let response = UrlFetchApp.fetch(endPoint, httpOptions);
    return response;
  }

  /**
   * Get a Streamtime data parameter offset by days.
   *
   * @param daysOffset
   *   Forward or backwards using positive or negative.
   */
  static _getParamDateOffset(daysOffset = 0) {
    const milliSecondsInDay = 86400000;
    const startTime = new Date().getTime();
    let offsetUnixTime = startTime + (milliSecondsInDay * daysOffset);
    let offsetDate = new Date(offsetUnixTime);
    return Utilities.formatDate(offsetDate, "GMT", "yyyy-MM-dd");
  }

  /**
   * Same formats as Utilities.formatDate which is https://docs.oracle.com/javase/7/docs/api/java/text/SimpleDateFormat.html
   *
   * @param stDateString
   *   A date string in the format of YYYY-MM-DD (streamtime standard).
   */
  static formatDate(stDateString, format) {
    let dateObject = Utilities.parseDate(stDateString, "GMT", "yyyy-MM-dd");
    return Utilities.formatDate(dateObject, 'GMT', format);
  }

  /**
   * Simple logger yo.
   */
  _log(message) {
    if (this.debug) {
      console.log(message);
    }
  }

}


