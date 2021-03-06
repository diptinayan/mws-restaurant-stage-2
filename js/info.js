import registerServiceWorker from './js1.js';
import DBHelper from './dbhelper.js';


let dbHelper;


registerServiceWorker();


window.initMap = () => {
  if (typeof google === "undefined") {
    console.warn('google is not defined!');
    return;
  }
  if (typeof self.restaurant === "undefined") return;
  if (self.map) {
    console.log("Map is already initialized");
  }

  const restaurant = self.restaurant;
  
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: restaurant.latlng,
    scrollwheel: false
  });
  
  self.map.addListener('tilesloaded', () => {
    const mapFrame = document.querySelector('#map iframe');
    mapFrame.setAttribute('title', `Google map with ${restaurant.name} restaurant location`);
  });
  DBHelper.mapMarkerForRestaurant(restaurant, self.map);
}


window.addEventListener('load', () => {
  dbHelper = new DBHelper();
  dbHelper.initData()
    .then(() => {
      fetchRestaurantFromURL()
        .then( restaurant => {
          self.restaurant = restaurant;
          if (!restaurant) {
            console.error('No restaurant found');
            return;
          }
          fillRestaurantHTML();
          fillBreadcrumb();
          window.initMap();
        })
        .catch(error => console.error(error));
    });
});


let fetchRestaurantFromURL = () => {
  if (self.restaurant) { // restaurant already fetched!
    return self.restaurant;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    throw Error('No restaurant id in URL');
  } else {
    return dbHelper.fetchRestaurantById(id);
  }
}


let fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  //image.className = 'restaurant-img';

  const defaultRestImageUrl = DBHelper.imageUrlForRestaurant(restaurant);
  if (defaultRestImageUrl) {
    const imageUrlWithoutExtention = defaultRestImageUrl.replace(/\.[^/.]+$/, "");
    image.src = `${imageUrlWithoutExtention}_550.webp`;
    image.srcset = `${imageUrlWithoutExtention}_800.webp 800w, ${imageUrlWithoutExtention}_550.webp 550w, ${imageUrlWithoutExtention}_250.webp 250w`;
  } else {
    image.className = 'restaurant-img-none';
  }
  image.alt = `${restaurant.name} restaurant`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}


let fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}


let fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}


let createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement('p');
  let i = review.rating;
  let ratingStars = (i == 0) ? 'Not rated' : '';
  while (i-- > 0) {
    ratingStars += '★';
  }
  rating.innerHTML = `Rating: <span class="stars">${ratingStars}</span>`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}


let fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', 'page'); /*optional*/
  breadcrumb.appendChild(li);
}


let getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}