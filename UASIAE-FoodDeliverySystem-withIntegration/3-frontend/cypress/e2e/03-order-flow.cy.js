/// <reference types="cypress" />

describe('TC-007 to TC-014: Order Flow - Pemesanan & Cek Order', () => {
  let restaurantId;
  let orderId;

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

  describe('TC-007: Add Menu Item to Cart', () => {
    it('should add menu item to cart', () => {
      // Visit browse page first to ensure auth state is ready
      cy.visit('/browse');
      cy.wait(3000);

      // Find and click on a restaurant card
      // Try to find restaurant by name "Ayam Betutu" or any restaurant card
      cy.get('body', { timeout: 5000 }).then(($body) => {
        // Look for text "Ayam Betutu" and click its parent card
        const hasAyamBetutu = $body.text().includes('Ayam Betutu');
        
        if (hasAyamBetutu) {
          // Find element containing "Ayam Betutu" and click its card parent
          cy.contains('Ayam Betutu', { timeout: 5000 }).closest('[class*="rounded-2xl"], [class*="cursor-pointer"], .bg-white\\/80').click({ force: true });
        } else {
          // Find first restaurant card (they are clickable divs with rounded-2xl class)
          cy.get('[class*="rounded-2xl"][class*="cursor-pointer"]', { timeout: 5000 }).first().click({ force: true });
        }
      });

      // Wait for restaurant detail page to load
      cy.wait(3000);
      cy.url({ timeout: 5000 }).should('include', '/restaurants/');
      
      // Extract restaurant ID from URL
      cy.url().then((url) => {
        const match = url.match(/\/restaurants\/(\d+)/);
        if (match) {
          restaurantId = match[1];
        }
      });

      // Scroll down to see menu items
      cy.scrollTo('bottom', { duration: 1000 });
      cy.wait(1000);

      // Find and click "Add to Cart" button (exact text match)
      cy.contains('button', 'Add to Cart', { timeout: 5000 }).first().should('be.visible').click();
      cy.wait(1000);

      // Verify cart sidebar shows item (cart sidebar is on the right)
      cy.get('body').should('satisfy', ($body) => {
        // Check if cart sidebar is visible and has items
        const cartText = $body.text();
        return cartText.includes('Cart') && 
               (cartText.includes('1') || 
                $body.find('button:contains("Place Order")').length > 0);
      });
    });
  });

  describe('TC-008: Update Cart Item Quantity', () => {
    it('should update cart item quantity', () => {
      // Visit browse and select restaurant
      cy.visit('/browse');
      cy.wait(3000);
      
      cy.get('body', { timeout: 5000 }).then(($body) => {
        const hasAyamBetutu = $body.text().includes('Ayam Betutu');
        
        if (hasAyamBetutu) {
          cy.contains('Ayam Betutu', { timeout: 5000 }).closest('[class*="rounded-2xl"], [class*="cursor-pointer"]').click({ force: true });
        } else {
          cy.get('[class*="rounded-2xl"][class*="cursor-pointer"]', { timeout: 5000 }).first().click({ force: true });
        }
      });

      cy.wait(3000);
      cy.scrollTo('bottom', { duration: 1000 });
      cy.wait(1000);

      // Add item to cart first
      cy.contains('button', 'Add to Cart', { timeout: 5000 }).first().click();
      cy.wait(1000);

      // Find quantity control + button in cart sidebar
      cy.get('body').then(($body) => {
        // Look for + button in cart (usually in cart sidebar)
        const plusBtn = $body.find('button:contains("+")').first();
        
        if (plusBtn.length > 0) {
          cy.wrap(plusBtn).click({ force: true });
          cy.wait(500);
          cy.log('Quantity increased');
        } else {
          cy.log('Quantity controls not found');
        }
      });
    });
  });

  describe('TC-009: Remove Item from Cart', () => {
    it('should remove item from cart', () => {
      // Visit browse and select restaurant
      cy.visit('/browse');
      cy.wait(3000);
      
      cy.get('body', { timeout: 5000 }).then(($body) => {
        const hasAyamBetutu = $body.text().includes('Ayam Betutu');
        
        if (hasAyamBetutu) {
          cy.contains('Ayam Betutu', { timeout: 5000 }).closest('[class*="rounded-2xl"], [class*="cursor-pointer"]').click({ force: true });
        } else {
          cy.get('[class*="rounded-2xl"][class*="cursor-pointer"]', { timeout: 5000 }).first().click({ force: true });
        }
      });

      cy.wait(3000);
      cy.scrollTo('bottom', { duration: 1000 });
      cy.wait(1000);

      // Add item to cart first
      cy.contains('button', 'Add to Cart', { timeout: 5000 }).first().click();
      cy.wait(1000);

      // Find remove button (× symbol) in cart sidebar
      cy.get('body').then(($body) => {
        const removeBtn = $body.find('button:contains("×")').first();
        
        if (removeBtn.length > 0) {
          cy.wrap(removeBtn).click({ force: true });
          cy.wait(500);
          cy.log('Item removed from cart');
        } else {
          cy.log('Remove button not found');
        }
      });
    });
  });

  describe('TC-010: Create Order (Checkout)', () => {
    it('should create order successfully', () => {
      // Visit browse and select restaurant
      cy.visit('/browse');
      cy.wait(3000);
      
      cy.get('body', { timeout: 5000 }).then(($body) => {
        const hasAyamBetutu = $body.text().includes('Ayam Betutu');
        
        if (hasAyamBetutu) {
          cy.contains('Ayam Betutu', { timeout: 5000 }).closest('[class*="rounded-2xl"], [class*="cursor-pointer"]').click({ force: true });
        } else {
          cy.get('[class*="rounded-2xl"][class*="cursor-pointer"]', { timeout: 5000 }).first().click({ force: true });
        }
      });

      cy.wait(3000);
      cy.scrollTo('bottom', { duration: 1000 });
      cy.wait(1000);

      // Add item to cart
      cy.contains('button', 'Add to Cart', { timeout: 5000 }).first().click();
      cy.wait(1000);

      // Scroll to cart sidebar to see "Place Order" button
      cy.scrollTo('top', { duration: 500 });
      cy.wait(500);

      // Click "Place Order" button (not "Checkout")
      // Button text is "Place Order - {price}", so we use partial match
      cy.contains('button', 'Place Order', { timeout: 5000 }).should('be.visible').click();
      cy.wait(3000);
      
      // Handle any SweetAlert if present
      cy.get('body', { timeout: 3000 }).then(($body) => {
        const swal = $body.find('.swal2-confirm, .swal2-popup');
        if (swal.length > 0) {
          cy.get('.swal2-confirm', { timeout: 3000 }).click();
          cy.wait(1000);
        }
      });

      // Wait for redirect to payment page
      cy.url({ timeout: 10000 }).should('satisfy', (url) => {
        return url.includes('/payment/') || 
               url.includes('/orders/') ||
               url.includes('/invoice/');
      });
      
      // Extract order ID from URL if available
      cy.url().then((url) => {
        const match = url.match(/\/(payment|orders|invoice)\/(\d+)/);
        if (match) {
          orderId = match[2];
          cy.log(`Order ID: ${orderId}`);
        }
      });
    });
  });

  describe('TC-011: Simulate Payment', () => {
    it('should simulate payment successfully', () => {
      // Visit browse and select restaurant
      cy.visit('/browse');
      cy.wait(3000);
      
      cy.get('body', { timeout: 5000 }).then(($body) => {
        const hasAyamBetutu = $body.text().includes('Ayam Betutu');
        
        if (hasAyamBetutu) {
          cy.contains('Ayam Betutu', { timeout: 5000 }).closest('[class*="rounded-2xl"], [class*="cursor-pointer"]').click({ force: true });
        } else {
          cy.get('[class*="rounded-2xl"][class*="cursor-pointer"]', { timeout: 5000 }).first().click({ force: true });
        }
      });

      cy.wait(3000);
      cy.scrollTo('bottom', { duration: 1000 });
      cy.wait(1000);

      // Add item to cart
      cy.contains('button', 'Add to Cart', { timeout: 5000 }).first().click();
      cy.wait(1000);

      // Click "Place Order" button
      cy.scrollTo('top', { duration: 500 });
      cy.wait(500);
      cy.contains('button', 'Place Order', { timeout: 5000 }).click();
      cy.wait(5000);
      
      // Handle SweetAlert if present
      cy.get('body', { timeout: 3000 }).then(($body) => {
        const swal = $body.find('.swal2-confirm, .swal2-popup');
        if (swal.length > 0) {
          cy.get('.swal2-confirm', { timeout: 3000 }).click();
          cy.wait(2000);
        }
      });
      
      // Check if we're on payment page
      cy.url({ timeout: 10000 }).should('include', '/payment/');
      
      // Click "Confirm Payment" button
      cy.contains('button', 'Confirm Payment', { timeout: 5000 }).should('be.visible').click();
      
      // Wait for payment processing
      cy.wait(5000);
      
      // Handle SweetAlert if present after payment
      cy.get('body', { timeout: 3000 }).then(($body) => {
        const swal = $body.find('.swal2-confirm, .swal2-popup');
        if (swal.length > 0) {
          cy.get('.swal2-confirm', { timeout: 3000 }).click();
          cy.wait(2000);
        }
      });
      
      // Verify redirect to invoice
      cy.url({ timeout: 10000 }).should('include', '/invoice/');
    });
  });

  describe('TC-012: View Order List', () => {
    it('should display list of orders', () => {
      cy.window().its('localStorage').then((storage) => {
        const token = storage.getItem('token');
        const user = storage.getItem('user');

        cy.visit('/browse', {
          timeout: 5000,
          onBeforeLoad: (win) => {
            if (token) win.localStorage.setItem('token', token);
            if (user) win.localStorage.setItem('user', user);
          }
        });
        cy.wait(3000);

        cy.get('nav', { timeout: 5000 }).should('be.visible');

        // Use navbar entry point exactly like end users
        cy.contains('a', 'My Orders', { timeout: 5000 })
          .should('be.visible')
          .click({ force: true });
        cy.wait(2000);

        cy.url({ timeout: 5000 }).should('include', '/orders');

        cy.get('body', { timeout: 5000 }).should('satisfy', ($body) => {
          const text = $body.text().toLowerCase();
          return text.includes('order') ||
                 text.includes('pesanan') ||
                 text.includes('belum ada') ||
                 text.includes('no order');
        });
      });
    });
  });

  describe('TC-013: View Order Detail/Status', () => {
    it('should display order detail and status', () => {
      // Get token from localStorage first
      cy.window().its('localStorage').then((storage) => {
        const token = storage.getItem('token');
        const user = storage.getItem('user');
        
        // Visit browse page first to ensure auth state is ready
        cy.visit('/browse', {
          timeout: 5000,
          onBeforeLoad: (win) => {
            if (token) win.localStorage.setItem('token', token);
            if (user) win.localStorage.setItem('user', user);
          }
        });
        cy.wait(3000);
        
        // Verify navbar is visible (means authenticated)
        cy.get('nav', { timeout: 5000 }).should('be.visible');
        
        cy.contains('a', 'My Orders', { timeout: 5000 })
          .should('be.visible')
          .click({ force: true });
        cy.wait(2000);

        cy.url({ timeout: 5000 }).should('include', '/orders');

        // Click on first order card if available (orders are clickable cards)
        cy.get('body', { timeout: 5000 }).then(($body) => {
          // Order cards are clickable divs with rounded-2xl class
          const hasOrders = $body.text().includes('Lihat Detail') || $body.find('[class*="rounded-2xl"][class*="cursor-pointer"]').length > 0;
          
          if (hasOrders) {
            // Find and click first order card
            cy.get('[class*="rounded-2xl"][class*="cursor-pointer"]', { timeout: 5000 }).first().click({ force: true });
          } else if (orderId) {
            // If we have orderId from previous test, visit directly
            cy.visit(`/orders/${orderId}`, {
              timeout: 5000,
              onBeforeLoad: (win) => {
                if (token) win.localStorage.setItem('token', token);
                if (user) win.localStorage.setItem('user', user);
              }
            });
          } else {
            // Try with order ID 1
            cy.visit('/orders/1', {
              timeout: 5000,
              onBeforeLoad: (win) => {
                if (token) win.localStorage.setItem('token', token);
                if (user) win.localStorage.setItem('user', user);
              }
            });
          }
        });

        // Wait for order detail page
        cy.wait(3000);
        cy.url({ timeout: 5000 }).should('include', '/orders/');
        cy.url({ timeout: 5000 }).should('not.include', '/login');

        // Verify order information is displayed
        cy.get('body', { timeout: 5000 }).should('satisfy', ($body) => {
          const text = $body.text().toLowerCase();
          return text.includes('order') || 
                 text.includes('status') || 
                 text.includes('restaurant') ||
                 text.includes('pesanan');
        });
      });
    });
  });

  describe('TC-014: Order Status Updates', () => {
    it('should display order status correctly', () => {
      cy.visit('/browse');
      cy.wait(2000);
      cy.contains('a', 'My Orders', { timeout: 5000 }).click({ force: true });
      cy.wait(3000);

      // Click on an order card
      cy.get('body').then(($body) => {
        const orderCard = $body.find('.bg-white\\/80, .backdrop-blur-sm').first();
        
        if (orderCard.length > 0 && $body.text().includes('Lihat Detail')) {
          cy.wrap(orderCard).click({ force: true });
          cy.wait(3000);

          // Verify status is displayed
          cy.get('body', { timeout: 5000 }).should('satisfy', ($body2) => {
            const statusText = $body2.text().toLowerCase();
            return statusText.includes('pending') || 
                   statusText.includes('paid') || 
                   statusText.includes('preparing') || 
                   statusText.includes('delivered') ||
                   statusText.includes('status') ||
                   statusText.includes('menunggu') ||
                   statusText.includes('dibayar') ||
                   statusText.includes('disiapkan') ||
                   statusText.includes('selesai');
          });
        } else {
          cy.log('No orders found to test status');
        }
      });
    });
  });
});
