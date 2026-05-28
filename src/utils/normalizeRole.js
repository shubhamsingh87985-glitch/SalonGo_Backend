const { ROLES } = require('../constants/roles');

const ROLE_ALIASES = {
  customer: ROLES.CUSTOMER,
  CUSTOMER: ROLES.CUSTOMER,
  user: ROLES.CUSTOMER,
  owner: ROLES.SALON_OWNER,
  OWNER: ROLES.SALON_OWNER,
  salon_owner: ROLES.SALON_OWNER,
  SALON_OWNER: ROLES.SALON_OWNER,
  salonOwner: ROLES.SALON_OWNER,
  admin: ROLES.ADMIN,
  ADMIN: ROLES.ADMIN
};

function normalizeRole(role, fallback = ROLES.CUSTOMER) {
  if (!role) return fallback;
  return ROLE_ALIASES[role] || ROLE_ALIASES[String(role).trim()] || role;
}

function allowedRoleInputs() {
  return Object.keys(ROLE_ALIASES);
}

module.exports = {
  normalizeRole,
  allowedRoleInputs
};
