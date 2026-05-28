const roleMiddleware = require('./roleMiddleware');
const { ROLES } = require('../constants/roles');

module.exports = roleMiddleware(ROLES.ADMIN);
