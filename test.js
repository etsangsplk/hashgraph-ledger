// TODO: use real testing framework

Ledger.init(/* {privateKey: privateKey }*/)
.then(function(ledger) {
  return ledger.storeValue('some_idetnt', 'some_val');
})
.catch(function(err) {
  console.error(err.stack);
})