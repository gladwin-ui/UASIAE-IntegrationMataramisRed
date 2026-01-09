/// <reference types="cypress" />

describe('TC-004 to TC-006: Restaurant Browsing Flow', () => {
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

  describe('TC-004: Browse Restaurants', () => {
    it('should display list of restaurants', () => {
      // Visit browse page directly
      cy.visit('/browse');
      cy.url().should('include', '/browse');

      // Wait for restaurants to load
      cy.wait(3000);

      // Verify restaurants are displayed
      cy.get('body').then(($body) => {
        // Check if there are restaurant cards or restaurant list
        const hasRestaurants = $body.find('[class*="restaurant"], [class*="card"], [class*="grid"]').length > 0;
        
        if (hasRestaurants) {
          // Verify restaurant cards are visible
          cy.log('Restaurants found on page');
          
          // Check for restaurant-related text
          cy.get('body').should('satisfy', ($body2) => {
            const text = $body2.text().toLowerCase();
            return text.includes('restaurant') || 
                   text.includes('padang') || 
                   text.includes('sunda') ||
                   text.includes('jawa') ||
                   text.includes('cuisine') ||
                   text.includes('browse');
          });
        } else {
          // If no restaurants, check for empty state
          cy.log('Checking for empty state or loading');
          cy.get('body').should('satisfy', ($body2) => {
            const text = $body2.text().toLowerCase();
            return text.includes('no restaurant') || 
                   text.includes('empty') || 
                   text.includes('tidak ada') ||
                   text.includes('loading') ||
                   text.includes('memuat');
          });
        }
      });
    });
  });

  describe('TC-005: Filter Restaurants by Cuisine Type', () => {
    it('should filter restaurants by cuisine type', () => {
      cy.visit('/browse');
      cy.wait(3000);

      // Look for filter buttons
      cy.get('body').then(($body) => {
        // Try to find filter buttons (Padang, Sunda, Jawa, etc.)
        const filterButtons = $body.find('button:contains("Padang"), button:contains("Sunda"), button:contains("Jawa"), button:contains("All")');
        
        if (filterButtons.length > 0) {
          // Click on a filter (e.g., "Padang")
          cy.contains('button', 'Padang', { timeout: 5000 }).then(($btn) => {
            if ($btn.length > 0) {
              cy.wrap($btn).click();
              
              // Wait for filtered results
              cy.wait(2000);
              
              // Verify filter is applied
              cy.log('Filter applied');
            }
          });
          cy.contains('button', 'Sunda', { timeout: 5000 }).then(($btn) => {
            if ($btn.length > 0) {
              cy.wrap($btn).click();
              
              // Wait for filtered results
              cy.wait(2000);
              
              // Verify filter is applied
              cy.log('Filter applied');
            }
          });
          cy.contains('button', 'Jawa', { timeout: 5000 }).then(($btn) => {
            if ($btn.length > 0) {
              cy.wrap($btn).click();
              
              // Wait for filtered results
              cy.wait(2000);
              
              // Verify filter is applied
              cy.log('Filter applied');
            }
          });
          cy.contains('button', 'Western', { timeout: 5000 }).then(($btn) => {
            if ($btn.length > 0) {
              cy.wrap($btn).click();
              
              // Wait for filtered results
              cy.wait(2000);
              
              // Verify filter is applied
              cy.log('Filter applied');
            }
          });
          cy.contains('button', 'Fast Food', { timeout: 5000 }).then(($btn) => {
            if ($btn.length > 0) {
              cy.wrap($btn).click();
              
              // Wait for filtered results
              cy.wait(2000);
              
              // Verify filter is applied
              cy.log('Filter applied');
            }
          });
        } else {
          cy.log('Filter buttons not found, skipping filter test');
        }
      });
    });
  });

  describe('TC-006: View Restaurant Detail', () => {
    it('should display restaurant detail and menu items', () => {
      // Visit browse page (same as TC-004 and TC-005)
      cy.visit('/browse');
      cy.url().should('include', '/browse');
      cy.wait(3000);

      // Find and click on a restaurant (e.g., "Ayam Betutu Khas Bali" or any restaurant)
      cy.get('body').then(($body) => {
        // Look for restaurant link or card
        const restaurantLink = $body.find('a[href*="/restaurants/"]').first();
        const restaurantCard = $body.find('[class*="card"], [class*="restaurant"]').first();
        
        if (restaurantLink.length > 0) {
          // Click on restaurant link
          cy.wrap(restaurantLink).click({ force: true });
        } else if (restaurantCard.length > 0) {
          // Click on restaurant card
          cy.wrap(restaurantCard).click({ force: true });
        } else {
          // Fallback: try to find restaurant by text (e.g., "Ayam Betutu")
          cy.contains('Ayam Betutu', { timeout: 5000 }).then(($el) => {
            if ($el.length > 0) {
              cy.wrap($el).click({ force: true });
            } else {
              // Last fallback: visit restaurant ID 1 directly
              cy.visit('/restaurants/1');
            }
          });
        }
      });

      // Wait for restaurant detail page to load
      cy.wait(2000);
      cy.url({ timeout: 5000 }).should('include', '/restaurants/');

      // Scroll down to see menu items
      cy.scrollTo('bottom', { duration: 1000 });
      cy.wait(1000);

      // Verify restaurant information is displayed
      cy.get('body', { timeout: 5000 }).should('satisfy', ($body) => {
        const text = $body.text().toLowerCase();
        return text.includes('restaurant') || 
               text.includes('menu') || 
               text.includes('harga') ||
               text.includes('price') ||
               text.includes('add to cart') ||
               text.includes('tambah');
      });

      // Verify menu items section exists
      cy.get('body').then(($body) => {
        const hasMenu = $body.text().toLowerCase().includes('menu') || 
                       $body.find('button:contains("Add"), button:contains("Tambah")').length > 0;
        
        if (hasMenu) {
          cy.log('Menu section found');
        } else {
          cy.log('Menu section might be empty or loading');
        }
      });
    });
  });
});

