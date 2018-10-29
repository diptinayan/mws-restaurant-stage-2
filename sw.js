var staticCacheName = 'mws-restaurant-static-v1';
var dynamicCacheName = 'mws-restaurant-dynamic-v1';
var contentImgsCache = 'mws-restaurant-imgs';

var allCaches = [
  staticCacheName,
  contentImgsCache,
  dynamicCacheName
];


self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        'favicon.ico',
        'manifest.webmanifest',

        'js/restaurant_info.js',
        'js/main.js',

        'css/main6.css',        
        'css/css1.css',
        'css/main1.css',
        'css/main2.css',
        'css/main3.css',
        'css/main4.css',
        'css/main5.css',
        'css/details.css',
        'css/details2.css',
        'css/css2.css';

        'img/image_not_available.png',
        
        

        'index.html',
        'restaurant.html',
        'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxK.woff2',
        'https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmEU9fBBc4.woff2'
      ]);
    })
  );
});

//delete old caches if any
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('mws-restaurant-') &&
                 !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('/index.html'));
      return;
    }

    if (requestUrl.pathname.startsWith('/restaurant.html')) {
      event.respondWith(caches.match('/restaurant.html'));
      return;
    }

    if (requestUrl.pathname.startsWith('/photos/')) {
      event.respondWith(servePhoto(event.request));
      return;
    }    
  }
  //default - get from cache then fetch and cache if not found
  event.respondWith(
    caches.match(event.request).then(function(cacheResponse) {
      return cacheResponse || 
        fetch(event.request).then(function(networkResponse) {
          return caches.open(dynamicCacheName).then(function(cache) {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
    })
  );
});

async function servePhoto(request) {
  //cut off the _<number> prefix
  var storageUrl = request.url.replace(/_\d+\.webp$/, '');

  const cache = await caches.open(contentImgsCache);

  const cachedImage =  await cache.match(request);

  if (cachedImage) return cachedImage;

  const cachedAnySizeImagePromise = cache.match(storageUrl);
  const networkImagePromise = fetch(request);

  const cachedAnySizeImage = await cachedAnySizeImagePromise;

  let toReturn = cachedAnySizeImage;
  let errorToThrow = null;
  try {
    const networkImage = await networkImagePromise;
    
   
    if(!cachedAnySizeImage) {
      cache.put(storageUrl, networkImage.clone());
    }
    //store the requested image in cache
    cache.put(request, networkImage.clone());
    toReturn = networkImage;
  } catch (error) {
    console.log('Fetch operation is not defined: ', error.message);
    errorToThrow = error;
  }

  if (toReturn) return toReturn;

  throw errorToThrow;
}
