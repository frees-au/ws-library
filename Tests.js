/**
 * Rudimentary tests.
 * 
 * Nothing is in CI/CD at this point, so this is mostly exploratory.
 */
function _runFreeSauceTests() {
  if (Session.getActiveUser().getEmail() != 'simon@hobbs.id.au') {
    console.log('This library is free (as in sauce) to use as-is, but if you want to go deeper please create your own copy.')
    return;
  }

  // Update these if you want to fix secrets.
  const secrets = {};
  secrets['airtableToken'] = '';

  for (const [name, secret] of Object.entries(secrets)) {
    if (secret === '') {
      console.log('Leaving ' + name + ' as is');
    }
    else {
      console.log('Updating ' + name);
      PropertiesService.getUserProperties().setProperty(name, secret);
    }
  }

  // The name of the token we'll have stored in script properties.
  const testSettings = {   
    airtable: {
      readOnlyTestToken: PropertiesService.getUserProperties().getProperty('airtableToken'),
      lookup : {
        base: 'appVlR8qys1QCNt3H',
        table: 'tblWPSxJhJdRgBstS',
        first : {
          key: null,
          properties: {
            key: 'fldQRiDzR0S0GpqqJ',
          }
        },
        second: {
          key: 'fldQRiDzR0S0GpqqJ',
          properties: {
            note: 'fld1kVewzVNs3K1PX',
          }
        }
      }
    },
  }

  const lu = testSettings.airtable.lookup;
  const at = createAirtable(testSettings.airtable.readOnlyTestToken, lu.base);
  const lookups1 = at.getLookupList(lu.table, lu.first.key, lu.first.properties, 0);
  const lookups2 = at.getLookupList(lu.table, lu.second.key, lu.second.properties, 0);
  const lookups3 = at.getLookupList(lu.table, lu.first.key, lu.first.properties.key, 0);

  console.log(lookups1);
  console.log(lookups2);
  console.log(lookups3);

}

