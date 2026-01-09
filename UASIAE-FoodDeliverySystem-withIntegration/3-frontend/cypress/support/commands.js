// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

/**
 * Custom command to login user
 * @param {string} email - User email
 * @param {string} password - User password
 */
Cypress.Commands.add('login', (email, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_BASE_URL')}/users/auth/login`,
    body: {
      email,
      password,
    },
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.have.property('status');
    expect(response.body.status).to.eq('success');
    expect(response.body.data).to.have.property('token');
    
    // Store token in localStorage
    const token = response.body.data.token;
    window.localStorage.setItem('token', token);
    
    // Decode token to get user info (including role)
    try {
      const tokenParts = token.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      
      // Store user data with role from token
      const userData = {
        id: payload.id,
        email: payload.email || email,
        name: payload.name || email.split('@')[0],
        role: payload.role || 'CUSTOMER',
      };
      window.localStorage.setItem('user', JSON.stringify(userData));
    } catch (e) {
      // Fallback: store minimal user data
      const userData = {
        email: email,
        role: 'CUSTOMER',
      };
      window.localStorage.setItem('user', JSON.stringify(userData));
    }
  });
});

/**
 * Custom command to register user
 * @param {object} userData - User data (name, email, password, phone)
 */
Cypress.Commands.add('register', (userData) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_BASE_URL')}/users/auth/register`,
    body: userData,
  }).then((response) => {
    expect(response.status).to.eq(201);
    expect(response.body).to.have.property('status');
    
    // Register might return token in data or directly
    if (response.body.data && response.body.data.token) {
      window.localStorage.setItem('token', response.body.data.token);
    } else if (response.body.token) {
      window.localStorage.setItem('token', response.body.token);
    }
    
    // Store user data
    if (response.body.data) {
      window.localStorage.setItem('user', JSON.stringify(response.body.data));
    } else if (response.body.user) {
      window.localStorage.setItem('user', JSON.stringify(response.body.user));
    }
  });
});

/**
 * Custom command to clear authentication
 */
Cypress.Commands.add('clearAuth', () => {
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('user');
});

/**
 * Custom command to wait for API response
 * @param {string} alias - Alias of the intercepted request
 */
Cypress.Commands.add('waitForAPI', (alias) => {
  cy.wait(alias, { timeout: 10000 });
});

/**
 * Custom command to check if element is visible and clickable
 * @param {string} selector - CSS selector
 */
Cypress.Commands.add('checkVisibleAndClickable', (selector) => {
  cy.get(selector).should('be.visible').should('not.be.disabled');
});

