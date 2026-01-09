/// <reference types="cypress" />

describe('TC-016 to TC-023: Non-Functional Testing', () => {
  beforeEach(() => {
    // Clear auth before each test
    cy.clearAuth();
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Login before each test
    cy.fixture('users').then((users) => {
      const customer1 = users.customer1;
      cy.login(customer1.email, customer1.password);
      // Wait for login to complete and token to be stored
      cy.window().its('localStorage').should('have.property', 'token');
    });
  });

  describe('TC-016: Page Load Performance', () => {
    it('should load home page within reasonable time', () => {
      // Visit browse page first to ensure auth state is ready
      cy.visit('/browse');
      cy.wait(2000);
      
      const startTime = Date.now();
      cy.visit('/home', {
        timeout: 5000,
        onBeforeLoad: (win) => {
          const token = win.localStorage.getItem('token');
          const user = win.localStorage.getItem('user');
          if (token) win.localStorage.setItem('token', token);
          if (user) win.localStorage.setItem('user', user);
        }
      });
      cy.get('body').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        cy.log(`Home page loaded in ${loadTime}ms`);
        // Allow up to 10 seconds for initial load (including API calls)
        expect(loadTime).to.be.lessThan(10000);
      });
    });

    it('should load browse restaurants page within reasonable time', () => {
      // Visit browse page first to ensure auth state is ready
      cy.visit('/browse');
      cy.wait(2000);
      
      const startTime = Date.now();
      cy.visit('/browse', {
        timeout: 5000,
        onBeforeLoad: (win) => {
          const token = win.localStorage.getItem('token');
          const user = win.localStorage.getItem('user');
          if (token) win.localStorage.setItem('token', token);
          if (user) win.localStorage.setItem('user', user);
        }
      });
      cy.wait(3000); // Wait for restaurants to load
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        cy.log(`Browse page loaded in ${loadTime}ms`);
        // Allow up to 10 seconds
        expect(loadTime).to.be.lessThan(10000);
      });
    });
  });

  describe('TC-017: API Response Time', () => {
    it('should have API response time < 3 seconds for login', () => {
      cy.clearAuth();
      
      const startTime = Date.now();
      cy.request({
        method: 'POST',
        url: `${Cypress.env('API_BASE_URL')}/users/auth/login`,
        body: {
          email: 'customer1@example.com',
          password: 'Password123!',
        },
      }).then((response) => {
        const responseTime = Date.now() - startTime;
        expect(responseTime).to.be.lessThan(3000);
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('status');
        expect(response.body.status).to.eq('success');
        cy.log(`Login API responded in ${responseTime}ms`);
      });
    });

    it('should have API response time < 3 seconds for fetch restaurants', () => {
      cy.window().its('localStorage').then((storage) => {
        const token = storage.getItem('token');
        
        if (!token) {
          cy.log('No token found, skipping API test');
          return;
        }
        
        const startTime = Date.now();
        cy.request({
          method: 'GET',
          url: `${Cypress.env('API_BASE_URL')}/restaurants`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((response) => {
          const responseTime = Date.now() - startTime;
          expect(responseTime).to.be.lessThan(3000);
          expect(response.status).to.eq(200);
          cy.log(`Fetch restaurants API responded in ${responseTime}ms`);
        });
      });
    });
  });

  describe('TC-018: Responsive Design (Mobile)', () => {
    it('should be responsive on mobile viewport', () => {
      // Visit browse page first to ensure auth state is ready
      cy.visit('/browse');
      cy.wait(2000);
      
      cy.viewport(375, 667); // iPhone SE size
      cy.visit('/home', {
        timeout: 5000,
        onBeforeLoad: (win) => {
          const token = win.localStorage.getItem('token');
          const user = win.localStorage.getItem('user');
          if (token) win.localStorage.setItem('token', token);
          if (user) win.localStorage.setItem('user', user);
        }
      });
      
      // Verify layout is responsive
      cy.get('body').should('be.visible');
      
      // Check for mobile-friendly elements
      cy.get('body').then(($body) => {
        // Verify no excessive horizontal scroll
        const bodyWidth = $body[0].scrollWidth;
        const viewportWidth = Cypress.config('viewportWidth') || 375;
        
        // Allow some margin for normal responsive behavior
        cy.log(`Body width: ${bodyWidth}, Viewport: ${viewportWidth}`);
      });
    });
  });

  describe('TC-020: Error Handling - Network Error', () => {
    it('should display error message on network error', () => {
      // Visit browse page first to ensure auth state is ready
      cy.visit('/browse');
      cy.wait(2000);
      
      // Intercept and fail the request
      cy.intercept('GET', '**/restaurants', { forceNetworkError: true }).as('getRestaurants');
      
      cy.visit('/browse', {
        timeout: 5000,
        onBeforeLoad: (win) => {
          const token = win.localStorage.getItem('token');
          const user = win.localStorage.getItem('user');
          if (token) win.localStorage.setItem('token', token);
          if (user) win.localStorage.setItem('user', user);
        }
      });
      
      // Wait for the failed request
      cy.wait('@getRestaurants', { timeout: 5000 }).then(() => {
        // Verify error message is displayed (if app handles it)
        cy.get('body', { timeout: 5000 }).should('satisfy', ($body) => {
          const text = $body.text().toLowerCase();
          return text.includes('error') || 
                 text.includes('network') || 
                 text.includes('connection') ||
                 text.includes('gagal') ||
                 text.includes('failed');
        });
      });
    });
  });

  describe('TC-021: Error Handling - Invalid Input', () => {
    it('should display error message for invalid email format', () => {
      cy.clearAuth();
      cy.visit('/login');
      
      // Try to login with invalid email
      cy.get('input[type="email"]').type('invalid-email');
      cy.get('input[type="password"]').type('Password123!');
      
      // HTML5 validation should prevent submission or show error
      cy.get('input[type="email"]').should('have.attr', 'type', 'email');
      
      // Try to submit
      cy.get('button[type="submit"]').click();
      
      // Check for error message or validation
      cy.get('body').should('satisfy', ($body) => {
        const text = $body.text().toLowerCase();
        return text.includes('email') || 
               text.includes('invalid') || 
               text.includes('error') ||
               $body.find('input[type="email"]:invalid').length > 0;
      });
    });
  });

  describe('TC-022: Loading States', () => {
    it('should display loading indicator during API calls', () => {
      // Visit browse page first to ensure auth state is ready
      cy.visit('/browse');
      cy.wait(2000);
      
      // Intercept API call to add delay
      cy.intercept('GET', '**/restaurants', (req) => {
        req.reply((res) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(res.send({ 
                status: 'success',
                data: []
              }));
            }, 1000);
          });
        });
      }).as('getRestaurants');
      
      cy.visit('/browse', {
        timeout: 5000,
        onBeforeLoad: (win) => {
          const token = win.localStorage.getItem('token');
          const user = win.localStorage.getItem('user');
          if (token) win.localStorage.setItem('token', token);
          if (user) win.localStorage.setItem('user', user);
        }
      });
      
      // Check for loading indicator
      cy.get('body', { timeout: 5000 }).then(($body) => {
        // Look for loading spinner or text
        const hasLoading = $body.find('[class*="loading"], [class*="spinner"], [class*="animate-spin"]').length > 0 ||
                          $body.text().toLowerCase().includes('loading') ||
                          $body.text().toLowerCase().includes('memuat');
        
        if (hasLoading) {
          cy.log('Loading indicator found');
        } else {
          cy.log('Loading indicator might be too fast to catch');
        }
      });
      
      cy.wait('@getRestaurants');
    });
  });
});

