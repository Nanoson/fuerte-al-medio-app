const crypto = require('crypto');

// Generate a UUID v4-like string
function generateId() {
  return crypto.randomUUID();
}

module.exports = {
  generateId
};
