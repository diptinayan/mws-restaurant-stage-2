import registerServiceWorker from './js1.js';
import DBHelper from './dbhelper.js';

/**DBHelper instance  */
let dbHelper;


registerServiceWorker();


window.initMap = () => {
  if (typeof google === "undefined") {
    console.warn('google is undefined!');
    return;
  }
  const loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
 
  self.map.addListener('tilesloaded', () => {
    const mapFrame = document.querySelector('#map iframe');
    mapFrame.setAttribute('title', 'Google map with restaurant locations');
  }
  );
  addMarkersToMap();
}



let setUpImgIntersectionObserver = () => {
  //make an Array of images
  var lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));
  if ( !window.IntersectionObserver) return;

  if(self.lazyImageObserver) self.lazyImageObserver.disconnect();
  else {
    self.lazyImageObserver = new IntersectionObserver( entries => {
      entries.forEach( entry => {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.srcset = lazyImage.dataset.srcset;
          lazyImage.classList.remove("lazy");
          self.lazyImageObserver.unobserve(lazyImage);
        }
      });
    });
  }

  lazyImages.forEach(lazyImage => self.lazyImageObserver.observe(lazyImage));
}


window.addEventListener('load', () => {
  dbHelper = new DBHelper();
  dbHelper.initData()
    .then(() => {
      fetchNeighborhoods();
      fetchCuisines();
      self.updateRestaurants();
    });
});


window.updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  dbHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
    .then((restaurants) => {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
      setUpImgIntersectionObserver();
    });
}



let fetchNeighborhoods = () => {
  dbHelper.fetchNeighborhoods()
    .then(neighborhoods => {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    })
    .catch(error => console.error(error));
}


let fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
let fetchCuisines = () => {
  dbHelper.fetchCuisines()
    .then(cuisines => {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    })
    .catch(error => console.error(error));
}


let fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}


/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
let resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(m => m.setMap(null));
  }
  self.markers = [];
  self.restaurants = restaurants;
}


let fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}


let createRestaurantImageDomElement = (restaurant) => {
  const image = document.createElement('img');
  image.className = 'restaurant-img';

  const defaultRestImageUrl = DBHelper.imageUrlForRestaurant(restaurant);
  if (defaultRestImageUrl) {
    const imageUrlWithoutExtention = defaultRestImageUrl.replace(/\.[^/.]+$/, "");
    image.sizes = "28vw";
    image.dataset.src = `${imageUrlWithoutExtention}_250.webp`;
    image.dataset.srcset = `${imageUrlWithoutExtention}_250.webp 250w, ${imageUrlWithoutExtention}_150.webp 150w`;
    image.classList.add('lazy');
  } else {
    image.src = `img/image_not_available.png`;
  }
  image.alt = `${restaurant.name} restaurant`;
  return image;
}


let createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  li.append(createRestaurantImageDomElement(restaurant));

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
}


let addMarkersToMap = (restaurants = self.restaurants) => {
  if (typeof google === "undefined") {
    console.info('no google maps defined yet!');
    return;
  }

  if (!restaurants) return;

  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}