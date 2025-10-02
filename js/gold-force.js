// ==========================================
// GOLD FORCE - JavaScript CSS Override
// Thực thi ngay khi trang load để override màu xanh
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 Gold Force script activated!');
    
    // Force override tất cả màu xanh thành vàng
    function forceGoldTheme() {
        // Override navbar
        const navbar = document.querySelector('.navbar, .bookstore-navbar');
        if (navbar) {
            navbar.style.background = 'linear-gradient(135deg, #FFF8DC, #FFD700, #F4D03F) !important';
            navbar.style.backgroundColor = '#FFD700';
            navbar.style.color = '#2c3e50';
            navbar.setAttribute('data-force-gold', 'true');
        }
        
        // Override hero section
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            heroSection.style.background = 'linear-gradient(135deg, #FFFACD, #FFD700) !important';
            heroSection.style.backgroundColor = '#FFD700';
            heroSection.style.color = '#2c3e50';
            heroSection.setAttribute('data-force-gold', 'true');
        }
        
        // Override buttons
        document.querySelectorAll('.btn-primary, .btn-search').forEach(btn => {
            btn.style.background = 'linear-gradient(135deg, #FFD700, #DAA520) !important';
            btn.style.backgroundColor = '#FFD700';
            btn.style.borderColor = '#B8860B';
            btn.style.color = '#2c3e50';
            btn.setAttribute('data-force-gold', 'true');
        });
        
        // Override badges
        document.querySelectorAll('.badge, .cart-badge').forEach(badge => {
            badge.style.background = 'linear-gradient(135deg, #FFD700, #DAA520) !important';
            badge.style.backgroundColor = '#FFD700';
            badge.style.color = '#2c3e50';
            badge.style.borderColor = '#B8860B';
            badge.setAttribute('data-force-gold', 'true');
        });
        
        // Override text
        document.querySelectorAll('.text-primary').forEach(text => {
            text.style.color = '#DAA520 !important';
            text.setAttribute('data-force-gold', 'true');
        });
        
        // Override cards
        document.querySelectorAll('.card, .book-card').forEach(card => {
            card.style.borderColor = '#FFD700';
            card.style.backgroundColor = 'linear-gradient(145deg, #ffffff, #FFF8DC)';
            card.setAttribute('data-force-gold', 'true');
        });
        
        console.log('✅ Gold theme force applied to all elements!');
    }
    
    // Apply immediately
    forceGoldTheme();
    
    // Monitor for dynamically loaded content and reapply
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        // Check if new elements need gold override
                        const newButtons = node.querySelectorAll ? node.querySelectorAll('.btn-primary, .btn-search') : [];
                        const newBadges = node.querySelectorAll ? node.querySelectorAll('.badge') : [];
                        
                        [...newButtons, ...newBadges].forEach(el => {
                            if (!el.getAttribute('data-force-gold')) {
                                forceGoldTheme();
                            }
                        });
                    }
                });
            }
        });
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Reapply every 2 seconds to catch any missed elements
    setInterval(forceGoldTheme, 2000);
});

// ==========================================
// REMOVE REDUNDANT SECTIONS
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🧹 Removing redundant sections...');
    
    // Get current view
    function getCurrentView() {
        const hash = window.location.hash;
        console.log('Current view:', hash);
        
        // Remove unnecessary sections if on home page
        if (hash === '#!/home' || hash === '' || hash === '#/') {
            // Hide hero section
            const heroSection = document.querySelector('.hero-section');
            if (heroSection) {
                heroSection.style.display = 'none';
                console.log('✅ Hero section removed');
            }
            
            // Hide features section  
            const featuresSection = document.querySelector('.features-section');
            if (featuresSection) {
                featuresSection.style.display = 'none';
                console.log('✅ Features section removed');
            }
            
            // Hide stats section
            const statsSection = document.querySelector('.stats-section');
            if (statsSection) {
                statsSection.style.display = 'none';
                console.log('✅ Stats section removed');
            }
            
            // Hide CTA section
            const ctaSection = document.querySelector('.cta-section');
            if (ctaSection) {
                ctaSection.style.display = 'none';
                console.log('✅ CTA section removed');
            }
            
            // Focus on books content only
            const bestSellersSection = document.querySelector('.bestsellers-section');
            if (bestSellersSection) {
                bestSellersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }
    
    // Apply on load
    setTimeout(getCurrentView, 500);
    
    // Apply on hash change
    window.addEventListener('hashchange', function() {
        setTimeout(getCurrentView, 500);
    });
});
