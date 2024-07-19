# Free Sauce Google Workspace scripts

These are helper/utility scripts for doing simple solutions with Google Workspace with
helper libraries for Sheets, Airtable and Streamtime (PRs welcome for other cloud
solutions).

These are great for building quick solutions and proof-of-concept applications which
can operate within free cost tiers. All the methods assume that you are not trying 
to build massive applications.

For example, it will cache a lookup list in the Sheet container. Nice. Howevee, you can't
cache more then 100kb of data this way. So if the script starts complaining that it can't
cache a lookup list, then your application prototype has probably outgrown these scripts.

Another example of scale/complexity limitations is populating a Sheet with raw data. You can use
a Google Sheet as data source for Pivot Tables or Looker Studio. Great! Works pretty well up to a
point (and it can be free). However, at some level of complexity, a spreadsheet becomes a pretty
crappy way to store data cubes for BI purposes. For example, your automation starts timing out and
failing.

# Services

Files are organised by service but they do very limited things around building
quick data and reporting tools (described in brackets).

* Google Sheets (using a sheet for data storage)
* Airtable (using for lookup lists)
* Streamtime (pulling data for reporting)
* Google Drive (to come)
* Google Mail (to come)

# Example

At the moment I'm just capturing the scripts on Github and you can copy it how you like. A quick example
of creating a lookup list from Airtable which shows the method of instantiating a class.

```
  # Airtable IDs can be found by looking at URLs in the web app.
  const atAccessToken = "SecretSecretDontShareItMyGuy"
  const atBase = "appAbcdefghijklmn";
  const atTable = "tblAbcdefghijklmn";
  const atKeyColumn = "fldAbcdefghijklmn";
  const atValueColumns = {"coolProperty": "fldBcdefghijklmno"};

  # Assumes you have added the code as a Library called "FreeSauceHelpers".
  const at = FreeSauceHelpers.createAirtable(atAccessToken, atBase);
  const lookupList = at.getLookupList(atTable, atKeyColumn, atValueColumns);
```

License: GPL V2
Copyright: Simon Hobbs 2024
