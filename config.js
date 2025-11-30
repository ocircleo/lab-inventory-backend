const PROD_MODE = false;
const WEB_URLS = [
  "lab-inventory-frontend-orpin.vercel.app",
  "192.168.0.100",
  "192.168.0.120",
  "localhost"
];
const FRONT_END_DOMAIN = PROD_MODE ? WEB_URLS[0] : WEB_URLS[1];
const ALLOWED_CORS_LIST = [
  "http://localhost:3000",
  "http://192.168.0.101:3000",
  "http://192.168.0.100:3000",
  "http://192.168.0.120:3000",
  "https://lab-inventory-frontend-orpin.vercel.app",
];
module.exports = { PROD_MODE, FRONT_END_DOMAIN, ALLOWED_CORS_LIST };
