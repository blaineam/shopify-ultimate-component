(function() {
  function asyncLoad() {
  // Begin and End comments are used by script to replace identifier
  var smileUIUrl = /* begin */ 'js.smile.io' /* end */
  var smileShopifyJsUrl = 'https:\/\/'+smileUIUrl+'\/v1\/smile-shopify.js'
  var urls = [smileShopifyJsUrl+"?shop="+Shopify.shop];
  for (var i = 0; i < urls.length; i++) {
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.src = urls[i];
    var x = document.getElementsByTagName('script')[0];
    x.parentNode.insertBefore(s, x);
    }
  };
  if(window.attachEvent) {
    window.attachEvent('onload', asyncLoad);
  } else {
    window.addEventListener('load', asyncLoad, false);
  }
  // for stores that might migrate, without uninstalling smile. Having the init code duplicated does not throws any error, this is here just for cleanliness
  var smileShopifyInitElement = document.getElementsByClassName('smile-shopify-init');
  if(smileShopifyInitElement.length == 2){ 
  smileShopifyInitElement[0].parentNode.removeChild( smileShopifyInitElement[0] );
  }
})();
