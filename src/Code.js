function myFunction() {
  Logger.log('Hi MOSAIC Report Analystics Automation');
}

function testLocalEnvironment() {
  const environment = getLocalTestValue();
  console.log("Environment:", environment);
  return environment;
}

function getLocalTestValue() {
  return PropertiesService
    .getScriptProperties()
    .getProperty("TEST_VALUE");
}
