
/**
 * Get a secret from the property service.
 */
function getSecret(name) {
  let token = PropertiesService.getScriptProperties().getProperty(name);
  return token;
}

/**
 * Set a secret which just means it can avoid version control.
 */
function setSecret(name, secret) {
  let currentSecret = PropertiesService.getScriptProperties().getProperty(name);
  console.log('Old secret: ' + currentSecret);  
  PropertiesService.getScriptProperties().setProperty(name, secret);
  console.log('New secret has been set for ' + name);
}

/**
 * Testing.
 */
function testSecrets() {
  console.log(PropertiesService.getScriptProperties().getProperties());
}
