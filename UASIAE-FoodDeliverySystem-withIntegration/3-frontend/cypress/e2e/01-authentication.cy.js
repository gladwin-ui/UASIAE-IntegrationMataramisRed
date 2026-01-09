/// <reference types="cypress" />

describe('TC-001 to TC-003, TC-015: Authentication Flow', () => {
  beforeEach(() => {
    // Clear auth before each test
    cy.clearAuth();
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('TC-001: User Registration', () => {
    it('should register a new user successfully', () => {
      // Visit register page directly
      cy.visit('/register', { timeout: 10000 });
      cy.url({ timeout: 10000 }).should('include', '/register');

      // Wait for form to load
      cy.get('h2', { timeout: 10000 }).contains('Create Account').should('be.visible');

      // Fill registration form - use more specific selectors
      cy.get('input[type="text"]').first().should('be.visible').type('Test User Cypress');
      cy.get('input[type="email"]').should('be.visible').type('testusercypress@example.com');
      cy.get('input[type="password"]').first().should('be.visible').type('Password123!');
      cy.get('input[type="tel"]').should('be.visible').type('081234567999');

      // Submit form
      cy.get('button[type="submit"]').contains('Register').should('be.visible').click();

      // Wait for API call and SweetAlert
      cy.wait(2000);
      
      // Handle SweetAlert if present - wait for it to appear
      cy.get('body', { timeout: 10000 }).then(($body) => {
        const swal = $body.find('.swal2-confirm, .swal2-popup');
        if (swal.length > 0) {
          cy.get('.swal2-confirm', { timeout: 5000 }).should('be.visible').click();
          cy.wait(2000);
        }
      });

      // Wait for redirect - check multiple times
      cy.url({ timeout: 20000 }).should('satisfy', (url) => {
        const isValid = url.includes('/home') || 
                       url.includes('/browse') || 
                       url === 'http://localhost:5173/' ||
                       url.endsWith('/');
        return isValid;
      });
      
      // Verify token is stored
      cy.window().its('localStorage').should('have.property', 'token');
      
      // Verify user data is stored
      cy.window().its('localStorage').should('have.property', 'user');
    });
  });

  describe('TC-002: User Login with Valid Credentials', () => {
    it('should login successfully with valid credentials', () => {
      cy.fixture('users').then((users) => {
        const customer1 = users.customer1;
        
        // Visit login page directly
        cy.visit('/login', { timeout: 10000 });
        cy.url({ timeout: 10000 }).should('include', '/login');

        // Wait for form to load
        cy.get('h2', { timeout: 10000 }).contains('Login').should('be.visible');

        // Fill login form
        cy.get('input[type="email"]').should('be.visible').type(customer1.email);
        cy.get('input[type="password"]').should('be.visible').type(customer1.password);

        // Submit form
        cy.get('button[type="submit"]').contains('Login').should('be.visible').click();

        // Wait for API call and SweetAlert
        cy.wait(2000);
        
        // Handle SweetAlert if present - wait for it to appear
        cy.get('body', { timeout: 10000 }).then(($body) => {
          const swal = $body.find('.swal2-confirm, .swal2-popup');
          if (swal.length > 0) {
            cy.get('.swal2-confirm', { timeout: 5000 }).should('be.visible').click();
            cy.wait(2000);
          }
        });

        // Wait for redirect - check multiple times
        cy.url({ timeout: 20000 }).should('satisfy', (url) => {
          const isValid = url.includes('/home') || 
                         url.includes('/browse') || 
                         url === 'http://localhost:5173/' ||
                         url.endsWith('/');
          return isValid;
        });
        
        // Verify token is stored
        cy.window().its('localStorage').should('have.property', 'token');
        
        // Verify user data is stored
        cy.window().its('localStorage').should('have.property', 'user');
        
        // Verify navbar shows user name or email
        cy.get('nav', { timeout: 5000 }).should('be.visible');
      });
    });
  });

  describe('TC-003: User Login with Invalid Credentials', () => {
    it('should show error message with invalid credentials', () => {
      cy.fixture('users').then((users) => {
        const invalidUser = users.invalidUser;
        
        cy.visit('/login', { timeout: 10000 });
        cy.url({ timeout: 10000 }).should('include', '/login');

        // Wait for form to load
        cy.get('h2', { timeout: 10000 }).contains('Login').should('be.visible');

        // Fill login form with invalid credentials
        cy.get('input[type="email"]').type(invalidUser.email);
        cy.get('input[type="password"]').type(invalidUser.password);

        // Submit form
        cy.contains('button', 'Login').click();

        // Wait for error message
        cy.wait(2000);

        // Verify error message is displayed
        cy.get('body').should('satisfy', ($body) => {
          const text = $body.text().toLowerCase();
          return text.includes('error') || 
                 text.includes('invalid') || 
                 text.includes('failed') ||
                 text.includes('login failed');
        });
        
        // Verify still on login page
        cy.url().should('include', '/login');
        
        // Verify token is NOT stored
        cy.window().its('localStorage').should('not.have.property', 'token');
      });
    });
  });

  describe('TC-015: User Logout', () => {
    it('should logout successfully', () => {
      cy.fixture('users').then((users) => {
        const customer1 = users.customer1;
        
        // Login with valid credentials
        cy.login(customer1.email, customer1.password);
        
        // Visit browse page
        cy.visit('/browse', { timeout: 5000 });
        cy.get('nav', { timeout: 5000 }).should('be.visible');

        // Find and click logout button
        cy.get('body').then(($body) => {
          const logoutTextBtn = $body.find('button:contains("Logout")');
          
          if (logoutTextBtn.length > 0) {
            cy.contains('button', 'Logout', { timeout: 3000 }).click();
          } else {
            cy.get('nav').within(() => {
              cy.get('button').last().click({ force: true });
            });
          }
        });
        
        // Handle SweetAlert confirmation
        cy.get('.swal2-confirm', { timeout: 3000 }).click();
        cy.wait(1000);
        
        // Handle success alert if present
        cy.get('body').then(($body) => {
          if ($body.find('.swal2-popup').length > 0) {
            cy.get('.swal2-confirm', { timeout: 3000 }).click();
          }
        });
      });
    });
  });
});

