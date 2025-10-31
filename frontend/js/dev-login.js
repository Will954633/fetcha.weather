// Development Login JavaScript
// This provides a simple way to test authenticated pages without a backend

function setStatus(msg, isError, isSuccess) {
  const s = document.getElementById("devStatus");
  s.textContent = msg;
  s.className = isError ? "status error" : (isSuccess ? "status success" : "status");
  s.classList.remove("hidden");
  
  // Add subtle animation
  s.style.opacity = "0";
  s.style.transform = "translateY(-10px)";
  setTimeout(() => {
    s.style.transition = "all 0.3s ease";
    s.style.opacity = "1";
    s.style.transform = "translateY(0)";
  }, 10);
}

// Mock user data for different test scenarios
const mockUsers = {
  john: {
    id: "dev_user_1",
    name: "John Doe",
    email: "john@example.com",
    created_at: "2024-01-15",
    stats: {
      total_requests: 127,
      active_projects: 3,
      monthly_requests: 45
    },
    projects: [
      {
        id: "proj_1",
        name: "E-commerce Product Scraper",
        description: "Scraping product data from online stores",
        url: "https://example-store.com/products",
        api_key: "ck_dev_1234567890abcdef",
        created_at: "2024-01-20",
        last_used: "2024-08-10",
        requests_count: 89,
        status: "active"
      },
      {
        id: "proj_2", 
        name: "News Article Extractor",
        description: "Extracting article content and metadata",
        url: "https://news-site.com/articles",
        api_key: "ck_dev_abcdef1234567890",
        created_at: "2024-02-05",
        last_used: "2024-08-12",
        requests_count: 23,
        status: "active"
      },
      {
        id: "proj_3",
        name: "Real Estate Listings",
        description: "Property data extraction from listings",
        url: "https://realestate.com/listings",
        api_key: "ck_dev_fedcba0987654321",
        created_at: "2024-03-10",
        last_used: "2024-08-08",
        requests_count: 15,
        status: "active"
      }
    ]
  },
  sarah: {
    id: "dev_user_2",
    name: "Sarah Wilson",
    email: "sarah@example.com",
    created_at: "2024-07-20",
    stats: {
      total_requests: 45,
      active_projects: 1,
      monthly_requests: 45
    },
    projects: [
      {
        id: "proj_4",
        name: "Job Listings Scraper",
        description: "Extracting job postings and requirements",
        url: "https://jobboard.com/jobs",
        api_key: "ck_dev_sarah123456789",
        created_at: "2024-07-25",
        last_used: "2024-08-13",
        requests_count: 45,
        status: "active"
      }
    ]
  },
  mike: {
    id: "dev_user_3",
    name: "Mike Chen",
    email: "mike@example.com",
    created_at: "2023-11-10",
    stats: {
      total_requests: 289,
      active_projects: 5,
      monthly_requests: 67
    },
    projects: [
      {
        id: "proj_5",
        name: "Social Media Posts",
        description: "Extracting social media content",
        url: "https://social.com/posts",
        api_key: "ck_dev_mike111222333",
        created_at: "2023-11-15",
        last_used: "2024-08-14",
        requests_count: 156,
        status: "active"
      },
      {
        id: "proj_6",
        name: "Restaurant Reviews",
        description: "Scraping restaurant reviews and ratings",
        url: "https://reviews.com/restaurants",
        api_key: "ck_dev_mike444555666",
        created_at: "2023-12-01",
        last_used: "2024-08-11",
        requests_count: 78,
        status: "active"
      },
      {
        id: "proj_7",
        name: "Stock Market Data",
        description: "Financial data extraction",
        url: "https://finance.com/stocks",
        api_key: "ck_dev_mike777888999",
        created_at: "2024-01-05",
        last_used: "2024-08-09",
        requests_count: 34,
        status: "active"
      },
      {
        id: "proj_8",
        name: "Weather Data Collector",
        description: "Weather information scraping",
        url: "https://weather.com/forecast",
        api_key: "ck_dev_mike000111222",
        created_at: "2024-02-20",
        last_used: "2024-08-07",
        requests_count: 12,
        status: "active"
      },
      {
        id: "proj_9",
        name: "Academic Papers",
        description: "Research paper metadata extraction",
        url: "https://academic.com/papers",
        api_key: "ck_dev_mike333444555",
        created_at: "2024-03-15",
        last_used: "2024-08-06",
        requests_count: 9,
        status: "active"
      }
    ]
  },
  new: {
    id: "dev_user_4",
    name: "New User",
    email: "newuser@example.com",
    created_at: "2024-08-14",
    stats: {
      total_requests: 0,
      active_projects: 0,
      monthly_requests: 0
    },
    projects: []
  }
};

function loginAsUser(userId, name, email) {
  const userData = mockUsers[userId];
  
  if (!userData) {
    setStatus("User data not found", true);
    return;
  }

  // Create mock authentication token
  const mockToken = `dev_token_${userId}_${Date.now()}`;
  
  // Store authentication data
  localStorage.setItem('camoufox_token', mockToken);
  localStorage.setItem('camoufox_user', JSON.stringify(userData));
  localStorage.setItem('camoufox_dev_mode', 'true');
  
  // Store projects data
  localStorage.setItem('camoufox_projects', JSON.stringify(userData.projects));
  
  setStatus(`Logged in as ${name}! Redirecting to dashboard...`, false, true);
  
  // Redirect to dashboard after short delay
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 1500);
}

function clearDevData() {
  // Clear all development data
  localStorage.removeItem('camoufox_token');
  localStorage.removeItem('camoufox_user');
  localStorage.removeItem('camoufox_dev_mode');
  localStorage.removeItem('camoufox_projects');
  localStorage.removeItem('camoufox_pending_project');
  localStorage.removeItem('camoufox_demo_url');
  localStorage.removeItem('camoufox_demo_data');
  localStorage.removeItem('camoufox_demo_parser');
  localStorage.removeItem('camoufox_demo_html');
  
  setStatus("All development data cleared!", false, true);
  
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Add some visual feedback for the user cards
document.addEventListener('DOMContentLoaded', () => {
  const userCards = document.querySelectorAll('.dev-user-card');
  
  userCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    });
  });
});
