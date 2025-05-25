import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./CompanyConfig.css";

// Mock API functions (in a real app, these would connect to your backend)
const api = {
  fetchCompanyData: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          products: [
            { 
              id: 1, 
              name: "Product 1", 
              description: "Description for product 1", 
              price: "99.99",
              image: null,
              createdAt: new Date().toISOString()
            }
          ],
          services: [
            { 
              id: 1, 
              name: "Service 1", 
              description: "Description for service 1", 
              price: "49.99",
              image: null,
              createdAt: new Date().toISOString()
            }
          ],
          faqs: [
            { 
              id: 1, 
              question: "How do I reset my password?", 
              answer: "You can reset your password from the login page.",
              createdAt: new Date().toISOString()
            }
          ],
          policies: [
            { 
              id: 1, 
              title: "Return Policy", 
              content: "Items can be returned within 30 days of purchase.",
              createdAt: new Date().toISOString()
            }
          ]
        });
      }, 500);
    });
  },
  addItem: (type, item) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Math.floor(Math.random() * 10000),
          ...item,
          createdAt: new Date().toISOString()
        });
      }, 500);
    });
  },
  updateItem: (type, item) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...item,
          updatedAt: new Date().toISOString()
        });
      }, 500);
    });
  },
  deleteItem: (type, id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 500);
    });
  }
};

// Confirmation dialog component
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  
  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-dialog-buttons">
          <button onClick={onCancel} className="cancel-btn">Cancel</button>
          <button onClick={onConfirm} className="confirm-btn">Confirm</button>
        </div>
      </div>
    </div>
  );
};

// Image preview component
const ImagePreview = ({ src, alt, onRemove }) => {
  if (!src) return null;
  
  return (
    <div className="image-preview">
      <img src={src} alt={alt} />
      <button onClick={onRemove} className="remove-image-btn">Remove</button>
    </div>
  );
};

// Pagination component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  
  return (
    <div className="pagination">
      <button 
        onClick={() => onPageChange(currentPage - 1)} 
        disabled={currentPage === 1}
        className="pagination-btn"
      >
        Previous
      </button>
      <span className="pagination-info">Page {currentPage} of {totalPages}</span>
      <button 
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={currentPage === totalPages}
        className="pagination-btn"
      >
        Next
      </button>
    </div>
  );
};

export default function CompanyConfig() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("products");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Company data state
  const [companyData, setCompanyData] = useState({
    products: [],
    services: [],
    faqs: [],
    policies: []
  });
  
  // Form data for new/edit items
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: "", image: null });
  const [newService, setNewService] = useState({ name: "", description: "", price: "", image: null });
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [newPolicy, setNewPolicy] = useState({ title: "", content: "" });
  
  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editItemId, setEditItemId] = useState(null);
  
  // Search state
  const [searchTerms, setSearchTerms] = useState({
    products: "",
    services: "",
    faqs: "",
    policies: ""
  });
  
  // Sort state
  const [sortConfig, setSortConfig] = useState({
    products: { key: "createdAt", direction: "desc" },
    services: { key: "createdAt", direction: "desc" },
    faqs: { key: "createdAt", direction: "desc" },
    policies: { key: "createdAt", direction: "desc" }
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    products: { currentPage: 1, itemsPerPage: 6 },
    services: { currentPage: 1, itemsPerPage: 6 },
    faqs: { currentPage: 1, itemsPerPage: 6 },
    policies: { currentPage: 1, itemsPerPage: 6 }
  });
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null
  });
  
  // File input refs
  const productImageRef = useRef(null);
  const serviceImageRef = useRef(null);
  
  // Image preview state
  const [imagePreview, setImagePreview] = useState({
    product: null,
    service: null
  });

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role");
    
    console.log("CompanyConfig - Token:", token);
    console.log("CompanyConfig - Role:", role);
    
    if (!token) {
      console.log("No token found, redirecting to login");
      navigate("/login");
    } else if (role && role.toLowerCase() !== "admin") {
      console.log("User is not admin, redirecting to dashboard");
      navigate("/dashboard");
    } else {
      console.log("User is admin, fetching company data");
      // Fetch company data
      fetchCompanyData();
    }
  }, [navigate]);
  
  // Fetch company data from API
  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      const data = await api.fetchCompanyData();
      setCompanyData(data);
    } catch (err) {
      setError("Failed to load company data. Please try again.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("tokenType");
    localStorage.removeItem("role");
    navigate("/login");
  };
  
  // Handle search input change
  const handleSearchChange = (type, value) => {
    setSearchTerms({
      ...searchTerms,
      [type]: value
    });
    // Reset to first page when searching
    setPagination({
      ...pagination,
      [type]: { ...pagination[type], currentPage: 1 }
    });
  };
  
  // Handle sort change
  const handleSortChange = (type, key) => {
    const direction = 
      sortConfig[type].key === key && sortConfig[type].direction === "asc" 
        ? "desc" 
        : "asc";
    
    setSortConfig({
      ...sortConfig,
      [type]: { key, direction }
    });
  };
  
  // Handle page change
  const handlePageChange = (type, page) => {
    setPagination({
      ...pagination,
      [type]: { ...pagination[type], currentPage: page }
    });
  };
  
  // Filter items based on search term
  const filterItems = (items, type) => {
    const searchTerm = searchTerms[type].toLowerCase();
    if (!searchTerm) return items;
    
    return items.filter(item => {
      if (type === 'products' || type === 'services') {
        return (
          item.name.toLowerCase().includes(searchTerm) ||
          item.description.toLowerCase().includes(searchTerm) ||
          item.price.toString().includes(searchTerm)
        );
      } else if (type === 'faqs') {
        return (
          item.question.toLowerCase().includes(searchTerm) ||
          item.answer.toLowerCase().includes(searchTerm)
        );
      } else if (type === 'policies') {
        return (
          item.title.toLowerCase().includes(searchTerm) ||
          item.content.toLowerCase().includes(searchTerm)
        );
      }
      return false;
    });
  };
  
  // Sort items based on sort config
  const sortItems = (items, type) => {
    const { key, direction } = sortConfig[type];
    
    return [...items].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === 'asc' ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };
  
  // Paginate items
  const paginateItems = (items, type) => {
    const { currentPage, itemsPerPage } = pagination[type];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };
  
  // Get processed items (filtered, sorted, paginated)
  const getProcessedItems = (type) => {
    const filtered = filterItems(companyData[type], type);
    const sorted = sortItems(filtered, type);
    const paginated = paginateItems(sorted, type);
    
    return {
      items: paginated,
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / pagination[type].itemsPerPage)
    };
  };
  
  // Handle image upload
  const handleImageChange = (type, e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        if (type === 'product') {
          setNewProduct({ ...newProduct, image: file });
          setImagePreview({ ...imagePreview, product: reader.result });
        } else if (type === 'service') {
          setNewService({ ...newService, image: file });
          setImagePreview({ ...imagePreview, service: reader.result });
        }
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  // Remove image preview
  const handleRemoveImage = (type) => {
    if (type === 'product') {
      setNewProduct({ ...newProduct, image: null });
      setImagePreview({ ...imagePreview, product: null });
      if (productImageRef.current) {
        productImageRef.current.value = "";
      }
    } else if (type === 'service') {
      setNewService({ ...newService, image: null });
      setImagePreview({ ...imagePreview, service: null });
      if (serviceImageRef.current) {
        serviceImageRef.current.value = "";
      }
    }
  };
  
  // Reset form
  const resetForm = (type) => {
    if (type === 'products') {
      setNewProduct({ name: "", description: "", price: "", image: null });
      setImagePreview({ ...imagePreview, product: null });
      if (productImageRef.current) {
        productImageRef.current.value = "";
      }
    } else if (type === 'services') {
      setNewService({ name: "", description: "", price: "", image: null });
      setImagePreview({ ...imagePreview, service: null });
      if (serviceImageRef.current) {
        serviceImageRef.current.value = "";
      }
    } else if (type === 'faqs') {
      setNewFaq({ question: "", answer: "" });
    } else if (type === 'policies') {
      setNewPolicy({ title: "", content: "" });
    }
    
    setEditMode(false);
    setEditItemId(null);
  };
  
  // Set up edit mode
  const handleEdit = (type, item) => {
    setEditMode(true);
    setEditItemId(item.id);
    
    if (type === 'products') {
      setNewProduct({
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image
      });
      setImagePreview({ ...imagePreview, product: item.image });
    } else if (type === 'services') {
      setNewService({
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image
      });
      setImagePreview({ ...imagePreview, service: item.image });
    } else if (type === 'faqs') {
      setNewFaq({
        question: item.question,
        answer: item.answer
      });
    } else if (type === 'policies') {
      setNewPolicy({
        title: item.title,
        content: item.content
      });
    }
  };
  
  // Handle form submissions
  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    // Validate price format
    const priceRegex = /^\d+(\.\d{1,2})?$/;
    if (!priceRegex.test(newProduct.price)) {
      setError("Price must be a valid number with up to 2 decimal places");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    setLoading(true);
    
    try {
      if (editMode) {
        // Update existing product
        const updatedProduct = await api.updateItem('products', {
          id: editItemId,
          ...newProduct
        });
        
        setCompanyData({
          ...companyData,
          products: companyData.products.map(item => 
            item.id === editItemId ? updatedProduct : item
          )
        });
        
        setSuccess("Product updated successfully!");
      } else {
        // Add new product
        const addedProduct = await api.addItem('products', newProduct);
        
        setCompanyData({
          ...companyData,
          products: [...companyData.products, addedProduct]
        });
        
        setSuccess("Product added successfully!");
      }
      
      resetForm('products');
    } catch (err) {
      setError("Failed to save product. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    
    // Validate price format
    const priceRegex = /^\d+(\.\d{1,2})?$/;
    if (!priceRegex.test(newService.price)) {
      setError("Price must be a valid number with up to 2 decimal places");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    setLoading(true);
    
    try {
      if (editMode) {
        // Update existing service
        const updatedService = await api.updateItem('services', {
          id: editItemId,
          ...newService
        });
        
        setCompanyData({
          ...companyData,
          services: companyData.services.map(item => 
            item.id === editItemId ? updatedService : item
          )
        });
        
        setSuccess("Service updated successfully!");
      } else {
        // Add new service
        const addedService = await api.addItem('services', newService);
        
        setCompanyData({
          ...companyData,
          services: [...companyData.services, addedService]
        });
        
        setSuccess("Service added successfully!");
      }
      
      resetForm('services');
    } catch (err) {
      setError("Failed to save service. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const handleAddFaq = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editMode) {
        // Update existing FAQ
        const updatedFaq = await api.updateItem('faqs', {
          id: editItemId,
          ...newFaq
        });
        
        setCompanyData({
          ...companyData,
          faqs: companyData.faqs.map(item => 
            item.id === editItemId ? updatedFaq : item
          )
        });
        
        setSuccess("FAQ updated successfully!");
      } else {
        // Add new FAQ
        const addedFaq = await api.addItem('faqs', newFaq);
        
        setCompanyData({
          ...companyData,
          faqs: [...companyData.faqs, addedFaq]
        });
        
        setSuccess("FAQ added successfully!");
      }
      
      resetForm('faqs');
    } catch (err) {
      setError("Failed to save FAQ. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const handleAddPolicy = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editMode) {
        // Update existing policy
        const updatedPolicy = await api.updateItem('policies', {
          id: editItemId,
          ...newPolicy
        });
        
        setCompanyData({
          ...companyData,
          policies: companyData.policies.map(item => 
            item.id === editItemId ? updatedPolicy : item
          )
        });
        
        setSuccess("Policy updated successfully!");
      } else {
        // Add new policy
        const addedPolicy = await api.addItem('policies', newPolicy);
        
        setCompanyData({
          ...companyData,
          policies: [...companyData.policies, addedPolicy]
        });
        
        setSuccess("Policy added successfully!");
      }
      
      resetForm('policies');
    } catch (err) {
      setError("Failed to save policy. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  // Handle item deletion with confirmation
  const confirmDelete = (type, id) => {
    setConfirmDialog({
      isOpen: true,
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this item? This action cannot be undone.",
      onConfirm: () => handleDelete(type, id)
    });
  };
  
  const handleDelete = async (type, id) => {
    setLoading(true);
    
    try {
      await api.deleteItem(type, id);
      
      setCompanyData({
        ...companyData,
        [type]: companyData[type].filter(item => item.id !== id)
      });
      
      setSuccess(`Item deleted successfully!`);
    } catch (err) {
      setError("Failed to delete item. Please try again.");
    } finally {
      setLoading(false);
      setConfirmDialog({ ...confirmDialog, isOpen: false });
      setTimeout(() => setSuccess(""), 3000);
    }
  };
  
  // Cancel edit mode
  const handleCancelEdit = (type) => {
    resetForm(type);
  };

  // Get processed items for each tab
  const processedProducts = getProcessedItems('products');
  const processedServices = getProcessedItems('services');
  const processedFaqs = getProcessedItems('faqs');
  const processedPolicies = getProcessedItems('policies');

  return (
    <div className="company-config-container">
      <header className="config-header">
        <h1>Company Configuration</h1>
        <div className="header-actions">
          <button 
            onClick={() => navigate('/knowledge-base')} 
            className="kb-btn"
          >
            Manage Knowledge Base
          </button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading-indicator">Processing...</div>}

      <div className="config-tabs">
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
          className={`tab-btn ${activeTab === 'faqs' ? 'active' : ''}`}
          onClick={() => setActiveTab('faqs')}
        >
          FAQs
        </button>
        <button 
          className={`tab-btn ${activeTab === 'policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          Policies
        </button>
      </div>

      <div className="tab-content">
        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <h2>{editMode ? "Edit Product" : "Add New Product"}</h2>
            <form onSubmit={handleAddProduct} className="config-form">
              <div className="form-group">
                <label>Name:</label>
                <input 
                  type="text" 
                  value={newProduct.name} 
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  required
                  placeholder="Enter product name"
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea 
                  value={newProduct.description} 
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  required
                  placeholder="Enter product description"
                />
              </div>
              <div className="form-group">
                <label>Price:</label>
                <input 
                  type="text" 
                  value={newProduct.price} 
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  required
                  placeholder="99.99"
                  pattern="^\d+(\.\d{1,2})?$"
                  title="Enter a valid price (e.g., 99.99)"
                />
              </div>
              <div className="form-group">
                <label>Product Image:</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleImageChange('product', e)}
                  ref={productImageRef}
                  className="file-input"
                />
                <ImagePreview 
                  src={imagePreview.product} 
                  alt="Product preview" 
                  onRemove={() => handleRemoveImage('product')}
                />
              </div>
              <div className="form-buttons">
                {editMode && (
                  <button 
                    type="button" 
                    onClick={() => handleCancelEdit('products')} 
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                )}
                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? "Saving..." : editMode ? "Update Product" : "Add Product"}
                </button>
              </div>
            </form>

            <div className="list-controls">
              <div className="search-box">
                <input 
                  type="text"
                  placeholder="Search products..."
                  value={searchTerms.products}
                  onChange={(e) => handleSearchChange('products', e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="sort-controls">
                <span>Sort by:</span>
                <button 
                  className={`sort-btn ${sortConfig.products.key === 'name' ? 'active' : ''}`}
                  onClick={() => handleSortChange('products', 'name')}
                >
                  Name {sortConfig.products.key === 'name' && (
                    sortConfig.products.direction === 'asc' ? '↑' : '↓'
                  )}
                </button>
                <button 
                  className={`sort-btn ${sortConfig.products.key === 'price' ? 'active' : ''}`}
                  onClick={() => handleSortChange('products', 'price')}
                >
                  Price {sortConfig.products.key === 'price' && (
                    sortConfig.products.direction === 'asc' ? '↑' : '↓'
                  )}
                </button>
                <button 
                  className={`sort-btn ${sortConfig.products.key === 'createdAt' ? 'active' : ''}`}
                  onClick={() => handleSortChange('products', 'createdAt')}
                >
                  Date {sortConfig.products.key === 'createdAt' && (
                    sortConfig.products.direction === 'asc' ? '↑' : '↓'
                  )}
                </button>
              </div>
            </div>

            {processedProducts.totalItems === 0 ? (
              <div className="empty-state">
                <p>No products found. {searchTerms.products && "Try a different search term."}</p>
              </div>
            ) : (
              <>
                <div className="items-list">
                  {processedProducts.items.map(product => (
                    <div key={product.id} className="item-card">
                      {product.image && (
                        <div className="item-image">
                          <img src={product.image} alt={product.name} />
                        </div>
                      )}
                      <h3>{product.name}</h3>
                      <p className="item-description">{product.description}</p>
                      <p className="item-price"><strong>Price:</strong> ${product.price}</p>
                      <div className="item-actions">
                        <button 
                          onClick={() => handleEdit('products', product)}
                          className="edit-btn"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => confirmDelete('products', product.id)}
                          className="delete-btn"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination 
                  currentPage={pagination.products.currentPage}
                  totalPages={processedProducts.totalPages}
                  onPageChange={(page) => handlePageChange('products', page)}
                />
              </>
            )}
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div>
            <h2>{editMode ? "Edit Service" : "Add New Service"}</h2>
            <form onSubmit={handleAddService} className="config-form">
              <div className="form-group">
                <label>Name:</label>
                <input 
                  type="text" 
                  value={newService.name} 
                  onChange={(e) => setNewService({...newService, name: e.target.value})}
                  required
                  placeholder="Enter service name"
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea 
                  value={newService.description} 
                  onChange={(e) => setNewService({...newService, description: e.target.value})}
                  required
                  placeholder="Enter service description"
                />
              </div>
              <div className="form-group">
                <label>Price:</label>
                <input 
                  type="text" 
                  value={newService.price} 
                  onChange={(e) => setNewService({...newService, price: e.target.value})}
                  required
                  placeholder="49.99"
                  pattern="^\d+(\.\d{1,2})?$"
                  title="Enter a valid price (e.g., 49.99)"
                />
              </div>
              <div className="form-group">
                <label>Service Image:</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleImageChange('service', e)}
                  ref={serviceImageRef}
                  className="file-input"
                />
                <ImagePreview 
                  src={imagePreview.service} 
                  alt="Service preview" 
                  onRemove={() => handleRemoveImage('service')}
                />
              </div>
              <div className="form-buttons">
                {editMode && (
                  <button 
                    type="button" 
                    onClick={() => handleCancelEdit('services')} 
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                )}
                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? "Saving..." : editMode ? "Update Service" : "Add Service"}
                </button>
              </div>
            </form>

            <div className="list-controls">
              <div className="search-box">
                <input 
                  type="text"
                  placeholder="Search services..."
                  value={searchTerms.services}
                  onChange={(e) => handleSearchChange('services', e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="sort-controls">
                <span>Sort by:</span>
                <button 
                  className={`sort-btn ${sortConfig.services.key === 'name' ? 'active' : ''}`}
                  onClick={() => handleSortChange('services', 'name')}
                >
                  Name {sortConfig.services.key === 'name' && (
                    sortConfig.services.direction === 'asc' ? '↑' : '↓'
                  )}
                </button>
                <button 
                  className={`sort-btn ${sortConfig.services.key === 'price' ? 'active' : ''}`}
                  onClick={() => handleSortChange('services', 'price')}
                >
                  Price {sortConfig.services.key === 'price' && (
                    sortConfig.services.direction === 'asc' ? '↑' : '↓'
                  )}
                </button>
                <button 
                  className={`sort-btn ${sortConfig.services.key === 'createdAt' ? 'active' : ''}`}
                  onClick={() => handleSortChange('services', 'createdAt')}
                >
                  Date {sortConfig.services.key === 'createdAt' && (
                    sortConfig.services.direction === 'asc' ? '↑' : '↓'
                  )}
                </button>
              </div>
            </div>

            {processedServices.totalItems === 0 ? (
              <div className="empty-state">
                <p>No services found. {searchTerms.services && "Try a different search term."}</p>
              </div>
            ) : (
              <>
                <div className="items-list">
                  {processedServices.items.map(service => (
                    <div key={service.id} className="item-card">
                      {service.image && (
                        <div className="item-image">
                          <img src={service.image} alt={service.name} />
                        </div>
                      )}
                      <h3>{service.name}</h3>
                      <p className="item-description">{service.description}</p>
                      <p className="item-price"><strong>Price:</strong> ${service.price}</p>
                      <div className="item-actions">
                        <button 
                          onClick={() => handleEdit('services', service)}
                          className="edit-btn"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => confirmDelete('services', service.id)}
                          className="delete-btn"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination 
                  currentPage={pagination.services.currentPage}
                  totalPages={processedServices.totalPages}
                  onPageChange={(page) => handlePageChange('services', page)}
                />
              </>
            )}
          </div>
        )}

        {/* FAQs Tab */}
        {activeTab === 'faqs' && (
          <div>
            <h2>{editMode ? "Edit FAQ" : "Add New FAQ"}</h2>
            <form onSubmit={handleAddFaq} className="config-form">
              <div className="form-group">
                <label>Question:</label>
                <input 
                  type="text" 
                  value={newFaq.question} 
                  onChange={(e) => setNewFaq({...newFaq, question: e.target.value})}
                  required
                  placeholder="Enter frequently asked question"
                />
              </div>
              <div className="form-group">
                <label>Answer:</label>
                <textarea 
                  value={newFaq.answer} 
                  onChange={(e) => setNewFaq({...newFaq, answer: e.target.value})}
                  required
                  placeholder="Enter the answer to this question"
                  rows={5}
                />
              </div>
              <div className="form-buttons">
                {editMode && (
                  <button 
                    type="button" 
                    onClick={() => handleCancelEdit('faqs')} 
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                )}
                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? "Saving..." : editMode ? "Update FAQ" : "Add FAQ"}
                </button>
              </div>
            </form>

            <div className="list-controls">
              <div className="search-box">
                <input 
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchTerms.faqs}
                  onChange={(e) => handleSearchChange('faqs', e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="sort-controls">
                <span>Sort by:</span>
                <button 
                  className={`sort-btn ${sortConfig.faqs.key === 'question' ? 'active' : ''}`}
                  onClick={() => handleSortChange('faqs', 'question')}
                >
                  Question {sortConfig.faqs.key === 'question' && (
                    sortConfig.faqs.direction === 'asc' ? '↑' : '↓'
                  )}
                </button>
                <button 
                  className={`sort-btn ${sortConfig.faqs.key === 'createdAt' ? 'active' : ''}`}
                  onClick={() => handleSortChange('faqs', 'createdAt')}
                >
                  Date {sortConfig.faqs.key === 'createdAt' && (
                    sortConfig.faqs.direction === 'asc' ? '↑' : '↓'
                  )}
                </button>
              </div>
            </div>

            {processedFaqs.totalItems === 0 ? (
              <div className="empty-state">
                <p>No FAQs found. {searchTerms.faqs && "Try a different search term."}</p>
              </div>
            ) : (
              <>
                <div className="items-list faq-list">
                  {processedFaqs.items.map(faq => (
                    <div key={faq.id} className="item-card faq-card">
                      <h3>{faq.question}</h3>
                      <p>{faq.answer}</p>
                      <div className="item-actions">
                        <button 
                          onClick={() => handleEdit('faqs', faq)}
                          className="edit-btn"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => confirmDelete('faqs', faq.id)}
                          className="delete-btn"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination 
                  currentPage={pagination.faqs.currentPage}
                  totalPages={processedFaqs.totalPages}
                  onPageChange={(page) => handlePageChange('faqs', page)}
                />
              </>
            )}
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div>
            <h2>{editMode ? "Edit Policy" : "Add New Policy"}</h2>
            <form onSubmit={handleAddPolicy} className="config-form">
              <div className="form-group">
                <label>Title:</label>
                <input 
                  type="text" 
                  value={newPolicy.title} 
                  onChange={(e) => setNewPolicy({...newPolicy, title: e.target.value})}
                  required
                  placeholder="Enter policy title"
                />
              </div>
              <div className="form-group">
                <label>Content:</label>
                <textarea 
                  value={newPolicy.content} 
                  onChange={(e) => setNewPolicy({...newPolicy, content: e.target.value})}
                  required
                  placeholder="Enter policy content"
                  rows={8}
                />
              </div>
              <div className="form-buttons">
                {editMode && (
                  <button 
                    type="button" 
                    onClick={() => handleCancelEdit('policies')} 
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                )}
                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? "Saving..." : editMode ? "Update Policy" : "Add Policy"}
                </button>
              </div>
            </form>

            <div className="list-controls">
              <div className="search-box">
                <input 
                  type="text"
                  placeholder="Search policies..."
                  value={searchTerms.policies}
                  onChange={(e) => handleSearchChange('policies', e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="sort-controls">
                <span>Sort by:</span>
                <button 
                  className={`sort-btn ${sortConfig.policies.key === 'title' ? 'active' : ''}`}
                  onClick={() => handleSortChange('policies', 'title')}
                >
                  Title {sortConfig.policies.key === 'title' && (
                    sortConfig.policies.direction === 'asc' ? '↑' : '↓'
                  )}
                </button>
                <button 
                  className={`sort-btn ${sortConfig.policies.key === 'createdAt' ? 'active' : ''}`}
                  onClick={() => handleSortChange('policies', 'createdAt')}
                >
                  Date {sortConfig.policies.key === 'createdAt' && (
                    sortConfig.policies.direction === 'asc' ? '↑' : '↓'
                  )}
                </button>
              </div>
            </div>

            {processedPolicies.totalItems === 0 ? (
              <div className="empty-state">
                <p>No policies found. {searchTerms.policies && "Try a different search term."}</p>
              </div>
            ) : (
              <>
                <div className="items-list policy-list">
                  {processedPolicies.items.map(policy => (
                    <div key={policy.id} className="item-card policy-card">
                      <h3>{policy.title}</h3>
                      <p>{policy.content}</p>
                      <div className="item-actions">
                        <button 
                          onClick={() => handleEdit('policies', policy)}
                          className="edit-btn"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => confirmDelete('policies', policy.id)}
                          className="delete-btn"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination 
                  currentPage={pagination.policies.currentPage}
                  totalPages={processedPolicies.totalPages}
                  onPageChange={(page) => handlePageChange('policies', page)}
                />
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => confirmDialog.onConfirm && confirmDialog.onConfirm()}
        onCancel={() => setConfirmDialog({...confirmDialog, isOpen: false})}
      />
    </div>
  );
}