import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate
} from "react-router-dom";
import CompanyRegister from "./CompanyRegister";
import UserRegister from "./UserRegister";
import Login from "./Login";
import CompanyConfig from "./CompanyConfig";
// KnowledgeBase component is not available
// import KnowledgeBase from "./KnowledgeBase";
import Chatbot from "./Chatbot";
import './App.css'

// Enhanced Dashboard component with e-commerce features
const Dashboard = () => {
  const [activeTab, setActiveTab] = React.useState('products');
  const userRole = localStorage.getItem("role") || "user";
  console.log("Current user role:", userRole);
  const [products, setProducts] = React.useState([]);
  const [services, setServices] = React.useState([]);
  const [policies, setPolicies] = React.useState([]);
  const [faqs, setFaqs] = React.useState([]);
  const [cartItems, setCartItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const token = localStorage.getItem("accessToken");
  
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("tokenType");
    localStorage.removeItem("role");
    localStorage.removeItem("company_id");
    window.location.href = "/login";
  };

  // Function to fetch data from the backend
  // Get API URL from environment variables
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  
  const fetchData = async (endpoint) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data from ${endpoint}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error(`Error fetching data from ${endpoint}:`, err);
      setError(err.message);
      return [];
    }
  };

  // Function to add item to cart
  const addToCart = async (productId, serviceId = null) => {
    try {
      console.log(`Adding to cart: product_id=${productId}, service_id=${serviceId}`);
      console.log(`Using token: ${token}`);
      
      const requestBody = {
        product_id: productId,
        service_id: serviceId,
        quantity: 1
      };
      console.log('Request body:', requestBody);
      
      const response = await fetch(`${API_URL}/cart/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to add item to cart: ${response.status} ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log('Response data:', responseData);
      
      // Refresh cart items after adding
      fetchCartItems();
      alert('Item added to cart successfully!');
    } catch (err) {
      console.error('Error adding item to cart:', err);
      alert(`Error adding item to cart: ${err.message}`);
    }
  };

  // Function to remove item from cart
  const removeFromCart = async (itemId) => {
    try {
      const response = await fetch(`${API_URL}/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove item from cart');
      }
      
      // Refresh cart items after removing
      fetchCartItems();
      alert('Item removed from cart successfully!');
    } catch (err) {
      console.error('Error removing item from cart:', err);
      alert(`Error removing item from cart: ${err.message}`);
    }
  };

  // Function to checkout
  const checkout = async () => {
    try {
      console.log('Checking out...');
      const response = await fetch(`${API_URL}/cart/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to checkout');
      }
      
      // Refresh cart items after checkout
      fetchCartItems();
      alert('Checkout successful! Your order has been placed.');
    } catch (err) {
      console.error('Error during checkout:', err);
      alert(`Error during checkout: ${err.message}`);
    }
  };

  // Function to fetch cart items
  const fetchCartItems = async () => {
    console.log('Fetching cart items...');
    try {
      const items = await fetchData('/cart/items');
      console.log('Cart items received:', items);
      setCartItems(items || []);
    } catch (err) {
      console.error('Error fetching cart items:', err);
      setCartItems([]);
    }
  };

  // Function to add a new product (admin only)
  const addProduct = async (productData) => {
    try {
      console.log('Adding new product:', productData);
      
      // Add company_id to the product data
      const company_id = localStorage.getItem("company_id") || 1;
      productData.company_id = parseInt(company_id);
      
      console.log('Product data with company_id:', productData);
      
      const response = await fetch(`${API_URL}/products/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to add product: ${response.status} ${errorText}`);
      }
      
      // Refresh products list
      const updatedProducts = await fetchData('/products');
      console.log('Updated products:', updatedProducts);
      setProducts(updatedProducts || []);
      alert('Product added successfully!');
    } catch (err) {
      console.error('Error adding product:', err);
      alert(`Error adding product: ${err.message}`);
    }
  };

  // Function to add a new service (admin only)
  const addService = async (serviceData) => {
    try {
      console.log('Adding new service:', serviceData);
      
      // Add company_id to the service data
      const company_id = localStorage.getItem("company_id") || 1;
      serviceData.company_id = parseInt(company_id);
      
      console.log('Service data with company_id:', serviceData);
      
      const response = await fetch(`${API_URL}/services/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(serviceData)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to add service: ${response.status} ${errorText}`);
      }
      
      // Refresh services list
      const updatedServices = await fetchData('/services');
      console.log('Updated services:', updatedServices);
      setServices(updatedServices || []);
      alert('Service added successfully!');
    } catch (err) {
      console.error('Error adding service:', err);
      alert(`Error adding service: ${err.message}`);
    }
  };

  // Fetch data on component mount
  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [productsData, servicesData, policiesData, faqsData, cartData] = await Promise.all([
          fetchData('/products'),
          fetchData('/services'),
          fetchData('/policies'),
          fetchData('/faqs'),
          fetchData('/cart/items')
        ]);
        
        setProducts(productsData || []);
        setServices(servicesData || []);
        setPolicies(policiesData || []);
        setFaqs(faqsData || []);
        setCartItems(cartData || []);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Fallback data if API fails
  const fallbackProducts = [
    { id: 1, name: "SuperWidget", price: 99.99, image: "https://via.placeholder.com/150", description: "Our flagship product with amazing features A and B." },
    { id: 2, name: "MegaGadget", price: 199.99, image: "https://via.placeholder.com/150", description: "Ultra fast with long battery life and AI-powered capabilities." },
    { id: 3, name: "TechPro X1", price: 149.99, image: "https://via.placeholder.com/150", description: "Professional-grade tool for serious users." },
    { id: 4, name: "SmartHome Hub", price: 129.99, image: "https://via.placeholder.com/150", description: "Control all your smart devices from one central location." }
  ];

  const fallbackServices = [
    { id: 1, name: "Premium Support", price: 19.99, period: "monthly", description: "24/7 priority support with 1-hour response time." },
    { id: 2, name: "Installation Service", price: 49.99, period: "one-time", description: "Professional installation of your products by certified technicians." },
    { id: 3, name: "Extended Warranty", price: 29.99, period: "yearly", description: "Extend your product warranty by an additional 2 years." },
    { id: 4, name: "Training Session", price: 79.99, period: "one-time", description: "One-on-one training session to get the most out of your products." }
  ];

  const fallbackPolicies = [
    { id: 1, title: "Return Policy", content: "Products can be returned within 30 days of purchase for a full refund, provided they are in original condition. Opened software is non-refundable." },
    { id: 2, title: "Shipping Policy", content: "Standard shipping takes 3-5 business days. Express shipping (2-day delivery) is available for an additional fee." },
    { id: 3, title: "Privacy Policy", content: "We respect your privacy and are committed to protecting your personal data. We will only use your information to administer your account and provide the products and services you requested from us." },
    { id: 4, title: "Terms of Service", content: "By using our website and services, you agree to these terms. We reserve the right to change these terms at any time, so please check them regularly." }
  ];

  const fallbackFaqs = [
    { id: 1, question: "How do I reset my password?", answer: "You can reset your password by clicking the 'Forgot Password' link on the login page. You will receive an email with instructions to reset your password." },
    { id: 2, question: "What payment methods do you accept?", answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for orders over $500." },
    { id: 3, question: "How can I track my order?", answer: "Once your order ships, you'll receive a tracking number via email. You can also view your order status in your account dashboard." },
    { id: 4, question: "Do you ship internationally?", answer: "Yes, we ship to most countries worldwide. International shipping rates and delivery times vary by location." },
    { id: 5, question: "How do I contact customer support?", answer: "You can contact our support team via email at support@example.com, by phone at 1-800-EXAMPLE, or through the chat feature on our website." }
  ];

  // Use fallback data if API fails
  const displayProducts = products.length > 0 ? products : fallbackProducts;
  const displayServices = services.length > 0 ? services : fallbackServices;
  const displayPolicies = policies.length > 0 ? policies : fallbackPolicies;
  const displayFaqs = faqs.length > 0 ? faqs : fallbackFaqs;

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Add Chatbot component for all users */}
      <Chatbot />
      
      <div className="dashboard-header">
        <h2>Customer Support Dashboard</h2>
        <div className="user-info">
          <span>Role: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>
      
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
        <button 
          className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          Services
        </button>
        <button 
          className={`tab-btn ${activeTab === 'policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          Policies
        </button>
        <button 
          className={`tab-btn ${activeTab === 'faqs' ? 'active' : ''}`}
          onClick={() => setActiveTab('faqs')}
        >
          FAQs
        </button>
        {(userRole === 'Agent' || userRole === 'agent') && (
          <button 
            className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            Support Tickets
          </button>
        )}
        {(userRole === 'Customer' || userRole === 'user') && (
          <button 
            className={`tab-btn ${activeTab === 'cart' ? 'active' : ''}`}
            onClick={() => setActiveTab('cart')}
          >
            Cart ({cartItems.length})
          </button>
        )}
      </div>
      
      <div className="dashboard-content">
        {activeTab === 'products' && (
          <div className="products-grid">
            {(userRole === 'Admin' || userRole === 'admin') && (
              <div className="admin-controls">
                <button 
                  className="add-new-btn"
                  onClick={() => {
                    const name = prompt("Enter product name:");
                    if (!name) return;
                    const description = prompt("Enter product description:");
                    const price = prompt("Enter product price (in dollars):");
                    if (!price) return;
                    
                    // Convert price to cents
                    const priceInCents = Math.round(parseFloat(price) * 100);
                    
                    addProduct({
                      name,
                      description,
                      price: priceInCents
                    });
                  }}
                >
                  Add New Product
                </button>
              </div>
            )}
            
            {displayProducts.map(product => (
              <div key={product.id} className="product-card">
                <img src={product.image || "https://via.placeholder.com/150"} alt={product.name} className="product-image" />
                <h3>{product.name}</h3>
                <p className="product-price">${typeof product.price === 'number' ? (product.price / 100).toFixed(2) : '99.99'}</p>
                <p className="product-description">{product.description}</p>
                {(userRole === 'Customer' || userRole === 'user') ? (
                  <button 
                    className="add-to-cart-btn"
                    onClick={() => addToCart(product.id)}
                  >
                    Add to Cart
                  </button>
                ) : (userRole === 'Admin' || userRole === 'admin') ? (
                  <div className="admin-actions">
                    <button className="edit-btn" onClick={() => {
                      const name = prompt("Enter new product name:", product.name);
                      if (!name) return;
                      const description = prompt("Enter new product description:", product.description);
                      const price = prompt("Enter new product price (in dollars):", (product.price / 100).toFixed(2));
                      if (!price) return;
                      
                      // Convert price to cents
                      const priceInCents = Math.round(parseFloat(price) * 100);
                      
                      // Update product
                      fetch(`${API_URL}/products/${product.id}`, {
                        method: 'PUT',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          name,
                          description,
                          price: priceInCents
                        })
                      })
                      .then(response => {
                        if (!response.ok) throw new Error('Failed to update product');
                        return fetchData('/products');
                      })
                      .then(updatedProducts => {
                        setProducts(updatedProducts || []);
                        alert('Product updated successfully!');
                      })
                      .catch(err => {
                        console.error('Error updating product:', err);
                        alert(`Error updating product: ${err.message}`);
                      });
                    }}>Edit</button>
                    <button className="delete-btn" onClick={() => {
                      if (confirm(`Are you sure you want to delete ${product.name}?`)) {
                        fetch(`${API_URL}/products/${product.id}`, {
                          method: 'DELETE',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          }
                        })
                        .then(response => {
                          if (!response.ok) throw new Error('Failed to delete product');
                          return fetchData('/products');
                        })
                        .then(updatedProducts => {
                          setProducts(updatedProducts || []);
                          alert('Product deleted successfully!');
                        })
                        .catch(err => {
                          console.error('Error deleting product:', err);
                          alert(`Error deleting product: ${err.message}`);
                        });
                      }
                    }}>Delete</button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'services' && (
          <div className="services-list">
            {(userRole === 'Admin' || userRole === 'admin') && (
              <div className="admin-controls">
                <button 
                  className="add-new-btn"
                  onClick={() => {
                    const name = prompt("Enter service name:");
                    if (!name) return;
                    const description = prompt("Enter service description:");
                    const price = prompt("Enter service price (in dollars):");
                    if (!price) return;
                    const period = prompt("Enter billing period (monthly, yearly, one-time):");
                    if (!period) return;
                    
                    // Convert price to cents
                    const priceInCents = Math.round(parseFloat(price) * 100);
                    
                    addService({
                      name,
                      description,
                      price: priceInCents,
                      period
                    });
                  }}
                >
                  Add New Service
                </button>
              </div>
            )}
            
            {displayServices.map(service => (
              <div key={service.id} className="service-card">
                <h3>{service.name}</h3>
                <p className="service-price">
                  ${typeof service.price === 'number' ? (service.price / 100).toFixed(2) : '19.99'} 
                  <span className="service-period">/{service.period || 'monthly'}</span>
                </p>
                <p className="service-description">{service.description}</p>
                {(userRole === 'Customer' || userRole === 'user') ? (
                  <button 
                    className="subscribe-btn"
                    onClick={() => addToCart(null, service.id)}
                  >
                    Subscribe
                  </button>
                ) : (userRole === 'Admin' || userRole === 'admin') ? (
                  <div className="admin-actions">
                    <button className="edit-btn" onClick={() => {
                      const name = prompt("Enter new service name:", service.name);
                      if (!name) return;
                      const description = prompt("Enter new service description:", service.description);
                      const price = prompt("Enter new service price (in dollars):", (service.price / 100).toFixed(2));
                      if (!price) return;
                      const period = prompt("Enter new billing period (monthly, yearly, one-time):", service.period);
                      if (!period) return;
                      
                      // Convert price to cents
                      const priceInCents = Math.round(parseFloat(price) * 100);
                      
                      // Update service
                      fetch(`${API_URL}/services/${service.id}`, {
                        method: 'PUT',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          name,
                          description,
                          price: priceInCents,
                          period
                        })
                      })
                      .then(response => {
                        if (!response.ok) throw new Error('Failed to update service');
                        return fetchData('/services');
                      })
                      .then(updatedServices => {
                        setServices(updatedServices || []);
                        alert('Service updated successfully!');
                      })
                      .catch(err => {
                        console.error('Error updating service:', err);
                        alert(`Error updating service: ${err.message}`);
                      });
                    }}>Edit</button>
                    <button className="delete-btn" onClick={() => {
                      if (confirm(`Are you sure you want to delete ${service.name}?`)) {
                        fetch(`${API_URL}/services/${service.id}`, {
                          method: 'DELETE',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          }
                        })
                        .then(response => {
                          if (!response.ok) throw new Error('Failed to delete service');
                          return fetchData('/services');
                        })
                        .then(updatedServices => {
                          setServices(updatedServices || []);
                          alert('Service deleted successfully!');
                        })
                        .catch(err => {
                          console.error('Error deleting service:', err);
                          alert(`Error deleting service: ${err.message}`);
                        });
                      }
                    }}>Delete</button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'policies' && (
          <div className="policies-list">
            {(userRole === 'Admin' || userRole === 'admin') && (
              <div className="admin-controls">
                <button 
                  className="add-new-btn"
                  onClick={async () => {
                    const title = prompt("Enter policy title:");
                    if (!title) return;
                    const content = prompt("Enter policy content:");
                    if (!content) return;
                    
                    // Add policy
                    const company_id = localStorage.getItem("company_id") || 1;
                    const policyData = {
                      title,
                      content,
                      company_id: parseInt(company_id)
                    };
                    
                    try {
                      const response = await fetch('http://localhost:8000/policies/', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(policyData)
                      });
                      
                      if (!response.ok) {
                        throw new Error('Failed to add policy');
                      }
                      
                      // Refresh policies list
                      const updatedPolicies = await fetchData('/policies');
                      setPolicies(updatedPolicies || []);
                      alert('Policy added successfully!');
                    } catch (err) {
                      console.error('Error adding policy:', err);
                      alert(`Error adding policy: ${err.message}`);
                    }
                  }}
                >
                  Add New Policy
                </button>
              </div>
            )}
            
            {displayPolicies.map(policy => (
              <div key={policy.id} className="policy-card">
                <h3>{policy.title}</h3>
                <p>{policy.content}</p>
                {(userRole === 'Admin' || userRole === 'admin') && (
                  <div className="admin-actions">
                    <button className="edit-btn" onClick={() => {
                      const title = prompt("Enter new policy title:", policy.title);
                      if (!title) return;
                      const content = prompt("Enter new policy content:", policy.content);
                      if (!content) return;
                      
                      // Update policy
                      fetch(`http://localhost:8000/policies/${policy.id}`, {
                        method: 'PUT',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          title,
                          content
                        })
                      })
                      .then(response => {
                        if (!response.ok) throw new Error('Failed to update policy');
                        return fetchData('/policies');
                      })
                      .then(updatedPolicies => {
                        setPolicies(updatedPolicies || []);
                        alert('Policy updated successfully!');
                      })
                      .catch(err => {
                        console.error('Error updating policy:', err);
                        alert(`Error updating policy: ${err.message}`);
                      });
                    }}>Edit</button>
                    <button className="delete-btn" onClick={() => {
                      if (confirm(`Are you sure you want to delete ${policy.title}?`)) {
                        fetch(`http://localhost:8000/policies/${policy.id}`, {
                          method: 'DELETE',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          }
                        })
                        .then(response => {
                          if (!response.ok) throw new Error('Failed to delete policy');
                          return fetchData('/policies');
                        })
                        .then(updatedPolicies => {
                          setPolicies(updatedPolicies || []);
                          alert('Policy deleted successfully!');
                        })
                        .catch(err => {
                          console.error('Error deleting policy:', err);
                          alert(`Error deleting policy: ${err.message}`);
                        });
                      }
                    }}>Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'faqs' && (
          <div className="faqs-list">
            {(userRole === 'Admin' || userRole === 'admin') && (
              <div className="admin-controls">
                <button 
                  className="add-new-btn"
                  onClick={async () => {
                    const question = prompt("Enter FAQ question:");
                    if (!question) return;
                    const answer = prompt("Enter FAQ answer:");
                    if (!answer) return;
                    
                    // Add FAQ
                    const company_id = localStorage.getItem("company_id") || 1;
                    const faqData = {
                      question,
                      answer,
                      company_id: parseInt(company_id)
                    };
                    
                    try {
                      const response = await fetch('http://localhost:8000/faqs/', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(faqData)
                      });
                      
                      if (!response.ok) {
                        throw new Error('Failed to add FAQ');
                      }
                      
                      // Refresh FAQs list
                      const updatedFaqs = await fetchData('/faqs');
                      setFaqs(updatedFaqs || []);
                      alert('FAQ added successfully!');
                    } catch (err) {
                      console.error('Error adding FAQ:', err);
                      alert(`Error adding FAQ: ${err.message}`);
                    }
                  }}
                >
                  Add New FAQ
                </button>
              </div>
            )}
            
            {displayFaqs.map(faq => (
              <div key={faq.id} className="faq-card">
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
                {(userRole === 'Admin' || userRole === 'admin') && (
                  <div className="admin-actions">
                    <button className="edit-btn" onClick={() => {
                      const question = prompt("Enter new FAQ question:", faq.question);
                      if (!question) return;
                      const answer = prompt("Enter new FAQ answer:", faq.answer);
                      if (!answer) return;
                      
                      // Update FAQ
                      fetch(`http://localhost:8000/faqs/${faq.id}`, {
                        method: 'PUT',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          question,
                          answer
                        })
                      })
                      .then(response => {
                        if (!response.ok) throw new Error('Failed to update FAQ');
                        return fetchData('/faqs');
                      })
                      .then(updatedFaqs => {
                        setFaqs(updatedFaqs || []);
                        alert('FAQ updated successfully!');
                      })
                      .catch(err => {
                        console.error('Error updating FAQ:', err);
                        alert(`Error updating FAQ: ${err.message}`);
                      });
                    }}>Edit</button>
                    <button className="delete-btn" onClick={() => {
                      if (confirm(`Are you sure you want to delete this FAQ?`)) {
                        fetch(`http://localhost:8000/faqs/${faq.id}`, {
                          method: 'DELETE',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          }
                        })
                        .then(response => {
                          if (!response.ok) throw new Error('Failed to delete FAQ');
                          return fetchData('/faqs');
                        })
                        .then(updatedFaqs => {
                          setFaqs(updatedFaqs || []);
                          alert('FAQ deleted successfully!');
                        })
                        .catch(err => {
                          console.error('Error deleting FAQ:', err);
                          alert(`Error deleting FAQ: ${err.message}`);
                        });
                      }
                    }}>Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'tickets' && (
          <div className="tickets-list">
            <h3>Support Tickets</h3>
            <p>No tickets available at this time.</p>
          </div>
        )}
        
        {activeTab === 'cart' && (
          <div className="cart-container">
            <h3>Your Cart</h3>
            {cartItems.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <>
                <div className="cart-items">
                  {cartItems.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-details">
                        <h4>{item.product_name || item.service_name || "Item"}</h4>
                        <p>Quantity: {item.quantity}</p>
                      </div>
                      <button 
                        className="remove-btn"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  className="checkout-btn"
                  onClick={checkout}
                >
                  Checkout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Main App component
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register-company" element={<CompanyRegister />} />
        <Route path="/register-user" element={<UserRegister />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/company-config" element={<CompanyConfig />} />
        {/* <Route path="/knowledge-base" element={<KnowledgeBase />} /> */}
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;