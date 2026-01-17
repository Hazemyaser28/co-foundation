import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, Warehouse, PlusCircle, TrendingUp, AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from './supabase';

const InventorySystem = () => {
  const [language, setLanguage] = useState('en');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [storeCart, setStoreCart] = useState([]);
  const [warehouseCart, setWarehouseCart] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    name_ar: '',
    quantity: '',
    purchase_price: '',
    additional_costs: '',
    selling_price: ''
  });

  const translations = {
    en: {
      dashboard: 'Dashboard',
      store: 'Store',
      warehouse: 'Warehouse',
      addStock: 'Add Stock',
      totalRevenue: 'Total Revenue',
      storeRevenue: 'Store Revenue',
      warehouseRevenue: 'Warehouse Revenue',
      itemsSold: 'Items Sold',
      lowStock: 'Low Stock Items',
      sellToCustomer: 'Sell to Customer',
      cart: 'Cart',
      total: 'Total',
      checkout: 'Checkout',
      addToCart: 'Add to Cart',
      quantity: 'Quantity',
      price: 'Price',
      transferToStore: 'Transfer to Store',
      sellToSupplier: 'Sell to Supplier',
      purchasePrice: 'Purchase Price',
      additionalCosts: 'Additional Costs',
      addToWarehouse: 'Add to Warehouse',
      salesHistory: 'Sales History',
      remove: 'Remove',
      empty: 'Empty',
      warning: 'Warning',
      stockWarning: 'items have low stock (less than 5)',
      productName: 'Product Name (English)',
      productNameAr: 'Product Name (Arabic)',
      sellingPrice: 'Selling Price',
      addProduct: 'Add Product',
      success: 'Success',
      error: 'Error',
    },
    ar: {
      dashboard: 'لوحة التحكم',
      store: 'المتجر',
      warehouse: 'المخزن',
      addStock: 'إضافة مخزون',
      totalRevenue: 'إجمالي الإيرادات',
      storeRevenue: 'إيرادات المتجر',
      warehouseRevenue: 'إيرادات المخزن',
      itemsSold: 'العناصر المباعة',
      lowStock: 'عناصر منخفضة المخزون',
      sellToCustomer: 'بيع للعميل',
      cart: 'السلة',
      total: 'المجموع',
      checkout: 'إتمام الشراء',
      addToCart: 'إضافة للسلة',
      quantity: 'الكمية',
      price: 'السعر',
      transferToStore: 'نقل للمتجر',
      sellToSupplier: 'بيع للمورد',
      purchasePrice: 'سعر الشراء',
      additionalCosts: 'تكاليف إضافية',
      addToWarehouse: 'إضافة للمخزن',
      salesHistory: 'سجل المبيعات',
      remove: 'إزالة',
      empty: 'فارغ',
      warning: 'تحذير',
      stockWarning: 'منتجات بمخزون منخفض (أقل من 5)',
      productName: 'اسم المنتج (إنجليزي)',
      productNameAr: 'اسم المنتج (عربي)',
      sellingPrice: 'سعر البيع',
      addProduct: 'إضافة منتج',
      success: 'نجح',
      error: 'خطأ',
    }
  };

  const t = translations[language];

  // Fetch products from Supabase
  useEffect(() => {
    fetchProducts();
    fetchSalesHistory();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesHistory = async () => {
    try {
      // Fetch store sales
      const { data: storeSales, error: storeError } = await supabase
        .from('store_sales')
        .select(`
          id,
          created_at,
          total_amount,
          items:store_sales_items(
            quantity,
            price,
            product:products(name, name_ar)
          )
        `)
        .order('created_at', { ascending: false });

      // Fetch warehouse sales
      const { data: warehouseSales, error: warehouseError } = await supabase
        .from('warehouse_sales')
        .select(`
          id,
          created_at,
          total_amount,
          items:warehouse_sales_items(
            quantity,
            price,
            product:products(name, name_ar)
          )
        `)
        .order('created_at', { ascending: false });

      if (storeError) throw storeError;
      if (warehouseError) throw warehouseError;

      // Format sales history
      const formattedStoreSales = (storeSales || []).map(sale => ({
        id: sale.id,
        type: 'store',
        date: new Date(sale.created_at).toLocaleString(),
        items: sale.items.map(item => ({
          name: item.product.name,
          name_ar: item.product.name_ar,
          quantity: item.quantity,
          price: item.price
        })),
        total: sale.total_amount
      }));

      const formattedWarehouseSales = (warehouseSales || []).map(sale => ({
        id: sale.id,
        type: 'warehouse',
        date: new Date(sale.created_at).toLocaleString(),
        items: sale.items.map(item => ({
          name: item.product.name,
          name_ar: item.product.name_ar,
          quantity: item.quantity,
          price: item.price
        })),
        total: sale.total_amount
      }));

      setSalesHistory([...formattedStoreSales, ...formattedWarehouseSales].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      ));
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const lowStockItems = products.filter(p => p.warehouse_stock < 5 || p.store_stock < 5);

  const storeTotal = salesHistory
    .filter(s => s.type === 'store')
    .reduce((sum, s) => sum + s.total, 0);
  
  const warehouseTotal = salesHistory
    .filter(s => s.type === 'warehouse')
    .reduce((sum, s) => sum + s.total, 0);

  const addToStoreCart = (product) => {
    const existing = storeCart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity < product.store_stock) {
        setStoreCart(storeCart.map(item => 
          item.id === product.id ? {...item, quantity: item.quantity + 1} : item
        ));
      }
    } else {
      setStoreCart([...storeCart, {...product, quantity: 1}]);
    }
  };

  const removeFromStoreCart = (productId) => {
    setStoreCart(storeCart.filter(item => item.id !== productId));
  };

  const updateStoreCartQuantity = (productId, change) => {
    setStoreCart(storeCart.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + change;
        const product = products.find(p => p.id === productId);
        if (newQty > 0 && newQty <= product.store_stock) {
          return {...item, quantity: newQty};
        }
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const storeCheckout = async () => {
    try {
      const total = storeCart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
      
      // Insert sale
      const { data: sale, error: saleError } = await supabase
        .from('store_sales')
        .insert({ total_amount: total })
        .select()
        .single();

      if (saleError) throw saleError;

      // Insert sale items
      const saleItems = storeCart.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.selling_price
      }));

      const { error: itemsError } = await supabase
        .from('store_sales_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update stock
      for (const item of storeCart) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ store_stock: item.store_stock - item.quantity })
          .eq('id', item.id);
        
        if (stockError) throw stockError;
      }

      alert(t.success + '!');
      setStoreCart([]);
      fetchProducts();
      fetchSalesHistory();
    } catch (error) {
      console.error('Error processing sale:', error);
      alert(t.error + ': ' + error.message);
    }
  };

  const addToWarehouseCart = (product) => {
    const existing = warehouseCart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity < product.warehouse_stock) {
        setWarehouseCart(warehouseCart.map(item => 
          item.id === product.id ? {...item, quantity: item.quantity + 1} : item
        ));
      }
    } else {
      setWarehouseCart([...warehouseCart, {...product, quantity: 1}]);
    }
  };

  const removeFromWarehouseCart = (productId) => {
    setWarehouseCart(warehouseCart.filter(item => item.id !== productId));
  };

  const updateWarehouseCartQuantity = (productId, change) => {
    setWarehouseCart(warehouseCart.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + change;
        const product = products.find(p => p.id === productId);
        if (newQty > 0 && newQty <= product.warehouse_stock) {
          return {...item, quantity: newQty};
        }
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const warehouseCheckout = async () => {
    try {
      const total = warehouseCart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
      
      const { data: sale, error: saleError } = await supabase
        .from('warehouse_sales')
        .insert({ total_amount: total })
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItems = warehouseCart.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.selling_price
      }));

      const { error: itemsError } = await supabase
        .from('warehouse_sales_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      for (const item of warehouseCart) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ warehouse_stock: item.warehouse_stock - item.quantity })
          .eq('id', item.id);
        
        if (stockError) throw stockError;
      }

      alert(t.success + '!');
      setWarehouseCart([]);
      fetchProducts();
      fetchSalesHistory();
    } catch (error) {
      console.error('Error processing sale:', error);
      alert(t.error + ': ' + error.message);
    }
  };

  const transferToStore = async (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const quantityStr = prompt(`Transfer to Store - ${product.name}\nAvailable: ${product.warehouse_stock}\n\nEnter quantity:`);
    const quantity = parseInt(quantityStr);
    
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }
    
    if (quantity > product.warehouse_stock) {
      alert(`Not enough stock! Available: ${product.warehouse_stock}`);
      return;
    }

    try {
      // Insert transfer record
      const { error: transferError } = await supabase
        .from('transfers')
        .insert({
          product_id: productId,
          quantity: quantity
        });

      if (transferError) throw transferError;

      // Update stocks
      const { error: updateError } = await supabase
        .from('products')
        .update({
          warehouse_stock: product.warehouse_stock - quantity,
          store_stock: product.store_stock + quantity
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      alert(`Transferred ${quantity} units to store successfully!`);
      fetchProducts();
    } catch (error) {
      console.error('Error transferring:', error);
      alert(t.error + ': ' + error.message);
    }
  };

  const addProductToWarehouse = async (e) => {
    e.preventDefault();
    
    if (!newProduct.name || !newProduct.quantity || !newProduct.purchase_price || !newProduct.selling_price) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const totalCost = (parseFloat(newProduct.purchase_price) + parseFloat(newProduct.additional_costs || 0)) * parseInt(newProduct.quantity);
      
      // Check if product exists
      const { data: existing } = await supabase
        .from('products')
        .select('*')
        .eq('name', newProduct.name)
        .single();

      if (existing) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update({
            warehouse_stock: existing.warehouse_stock + parseInt(newProduct.quantity)
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;

        // Add purchase record
        const { error: purchaseError } = await supabase
          .from('warehouse_purchases')
          .insert({
            product_id: existing.id,
            quantity: parseInt(newProduct.quantity),
            purchase_price: parseFloat(newProduct.purchase_price),
            additional_costs: parseFloat(newProduct.additional_costs || 0),
            total_cost: totalCost
          });

        if (purchaseError) throw purchaseError;
      } else {
        // Create new product
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert({
            name: newProduct.name,
            name_ar: newProduct.name_ar || newProduct.name,
            warehouse_stock: parseInt(newProduct.quantity),
            store_stock: 0,
            purchase_price: parseFloat(newProduct.purchase_price),
            selling_price: parseFloat(newProduct.selling_price)
          })
          .select()
          .single();

        if (productError) throw productError;

        // Add purchase record
        const { error: purchaseError } = await supabase
          .from('warehouse_purchases')
          .insert({
            product_id: product.id,
            quantity: parseInt(newProduct.quantity),
            purchase_price: parseFloat(newProduct.purchase_price),
            additional_costs: parseFloat(newProduct.additional_costs || 0),
            total_cost: totalCost
          });

        if (purchaseError) throw purchaseError;
      }

      alert(t.success + '!');
      setNewProduct({
        name: '',
        name_ar: '',
        quantity: '',
        purchase_price: '',
        additional_costs: '',
        selling_price: ''
      });
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      alert(t.error + ': ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-4xl font-bold text-indigo-900">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" style={{fontFamily: language === 'ar' ? 'Arial' : 'system-ui'}} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold text-indigo-900">
              {language === 'ar' ? 'نظام إدارة المخزون' : 'Inventory Management'}
            </h1>
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold text-xl hover:bg-indigo-700"
            >
              {language === 'en' ? 'عربي' : 'English'}
            </button>
          </div>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={32} />
            <div>
              <p className="text-xl font-bold text-red-800">{t.warning}</p>
              <p className="text-lg text-red-700">{lowStockItems.length} {t.stockWarning}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-4 gap-4">
          {[
            { key: 'dashboard', icon: TrendingUp, label: t.dashboard },
            { key: 'store', icon: ShoppingCart, label: t.store },
            { key: 'warehouse', icon: Warehouse, label: t.warehouse },
            { key: 'addStock', icon: PlusCircle, label: t.addStock },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`p-6 rounded-xl font-bold text-2xl flex items-center justify-center gap-3 transition-all ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white shadow-xl scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={32} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl p-8 text-white shadow-xl">
                <h3 className="text-2xl font-bold mb-2">{t.totalRevenue}</h3>
                <p className="text-5xl font-bold">${(storeTotal + warehouseTotal).toFixed(2)}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-8 text-white shadow-xl">
                <h3 className="text-2xl font-bold mb-2">{t.storeRevenue}</h3>
                <p className="text-5xl font-bold">${storeTotal.toFixed(2)}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl p-8 text-white shadow-xl">
                <h3 className="text-2xl font-bold mb-2">{t.warehouseRevenue}</h3>
                <p className="text-5xl font-bold">${warehouseTotal.toFixed(2)}</p>
              </div>
            </div>

            {lowStockItems.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-2xl font-bold text-red-600 mb-4 flex items-center gap-2">
                  <AlertTriangle size={28} />
                  {t.lowStock}
                </h3>
                <div className="space-y-2">
                  {lowStockItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                      <span className="text-xl font-bold">{language === 'ar' ? item.name_ar : item.name}</span>
                      <div className="flex gap-4">
                        <span className="text-lg">Store: <span className={item.store_stock < 5 ? 'text-red-600 font-bold' : ''}>{item.store_stock}</span></span>
                        <span className="text-lg">Warehouse: <span className={item.warehouse_stock < 5 ? 'text-red-600 font-bold' : ''}>{item.warehouse_stock}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'store' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-2xl font-bold mb-4">{t.sellToCustomer}</h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {products.map(product => (
                  <div key={product.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xl font-bold">{language === 'ar' ? product.name_ar : product.name}</p>
                      <p className="text-lg text-gray-600">Stock: {product.store_stock} | ${product.selling_price}</p>
                    </div>
                    <button
                      onClick={() => addToStoreCart(product)}
                      disabled={product.store_stock === 0}
                      className={`px-6 py-3 rounded-lg font-bold text-xl ${
                        product.store_stock === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {t.addToCart}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-2xl font-bold mb-4">{t.cart}</h3>
                {storeCart.length === 0 ? (
                  <p className="text-xl text-gray-500 text-center py-8">{t.empty}</p>
                ) : (
                  <div className="space-y-3">
                    {storeCart.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-xl font-bold">{language === 'ar' ? item.name_ar : item.name}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={() => updateStoreCartQuantity(item.id, -1)}
                              className="w-10 h-10 bg-red-500 text-white rounded-lg font-bold text-xl"
                            >
                              -
                            </button>
                            <span className="text-xl font-bold w-12 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateStoreCartQuantity(item.id, 1)}
                              className="w-10 h-10 bg-green-500 text-white rounded-lg font-bold text-xl"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-xl font-bold">${(item.selling_price * item.quantity).toFixed(2)}</p>
                          <button
                            onClick={() => removeFromStoreCart(item.id)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="border-t-2 pt-4">
                      <p className="text-2xl font-bold">{t.total}: ${storeCart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0).toFixed(2)}</p>
                      <button
                        onClick={storeCheckout}
                        className="w-full mt-4 px-6 py-4 bg-green-600 text-white rounded-lg font-bold text-2xl hover:bg-green-700"
                      >
                        {t.checkout}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg max-h-96 overflow-y-auto">
                <h3 className="text-2xl font-bold mb-4">{t.salesHistory}</h3>
                {salesHistory.filter(s => s.type === 'store').length === 0 ? (
                  <p className="text-xl text-gray-500 text-center py-8">{t.empty}</p>
                ) : (
                  <div className="space-y-3">
                    {salesHistory.filter(s => s.type === 'store').map(sale => (
                      <div key={sale.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600">{sale.date}</span>
                          <span className="text-xl font-bold text-green-600">${sale.total.toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-gray-700">
                          {sale.items.map((item, i) => (
                            <div key={i}>{language === 'ar' ? item.name_ar : item.name} x{item.quantity}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'warehouse' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-2xl font-bold mb-4">{t.warehouse}</h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {products.map(product => (
                  <div key={product.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between mb-3">
                      <div>
                        <p className="text-xl font-bold">{language === 'ar' ? product.name_ar : product.name}</p>
                        <p className="text-lg text-gray-600">Stock: {product.warehouse_stock}</p>
                      </div>
                      <button
                        onClick={() => addToWarehouseCart(product)}
                        disabled={product.warehouse_stock === 0}
                        className={`px-6 py-3 rounded-lg font-bold text-xl ${
                          product.warehouse_stock === 0
                            ? 'bg-gray-300 text-gray-500'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        {t.sellToSupplier}
                      </button>
                    </div>
                    <button
                      onClick={() => transferToStore(product.id)}
                      disabled={product.warehouse_stock === 0}
                      className={`w-full px-6 py-3 rounded-lg font-bold text-xl ${
                        product.warehouse_stock === 0
                          ? 'bg-gray-300 text-gray-500'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {t.transferToStore}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-2xl font-bold mb-4">{t.cart}</h3>
                {warehouseCart.length === 0 ? (
                  <p className="text-xl text-gray-500 text-center py-8">{t.empty}</p>
                ) : (
                  <div className="space-y-3">
                    {warehouseCart.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-xl font-bold">{language === 'ar' ? item.name_ar : item.name}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={() => updateWarehouseCartQuantity(item.id, -1)}
                              className="w-10 h-10 bg-red-500 text-white rounded-lg font-bold text-xl"
                            >
                              -
                            </button>
                            <span className="text-xl font-bold w-12 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateWarehouseCartQuantity(item.id, 1)}
                              className="w-10 h-10 bg-green-500 text-white rounded-lg font-bold text-xl"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-xl font-bold">${(item.selling_price * item.quantity).toFixed(2)}</p>
                          <button
                            onClick={() => removeFromWarehouseCart(item.id)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="border-t-2 pt-4">
                      <p className="text-2xl font-bold">{t.total}: ${warehouseCart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0).toFixed(2)}</p>
                      <button
                        onClick={warehouseCheckout}
                        className="w-full mt-4 px-6 py-4 bg-purple-600 text-white rounded-lg font-bold text-2xl hover:bg-purple-700"
                      >
                        {t.checkout}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg max-h-96 overflow-y-auto">
                <h3 className="text-2xl font-bold mb-4">{t.salesHistory}</h3>
                {salesHistory.filter(s => s.type === 'warehouse').length === 0 ? (
                  <p className="text-xl text-gray-500 text-center py-8">{t.empty}</p>
                ) : (
                  <div className="space-y-3">
                    {salesHistory.filter(s => s.type === 'warehouse').map(sale => (
                      <div key={sale.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600">{sale.date}</span>
                          <span className="text-xl font-bold text-purple-600">${sale.total.toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-gray-700">
                          {sale.items.map((item, i) => (
                            <div key={i}>{language === 'ar' ? item.name_ar : item.name} x{item.quantity}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'addStock' && (
          <div className="bg-white rounded-xl p-6 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-6">{t.addStock}</h3>
            <form onSubmit={addProductToWarehouse} className="space-y-4">
              <input
                type="text"
                placeholder={t.productName}
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                className="w-full p-4 text-xl border-2 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder={t.productNameAr}
                value={newProduct.name_ar}
                onChange={(e) => setNewProduct({...newProduct, name_ar: e.target.value})}
                className="w-full p-4 text-xl border-2 rounded-lg"
              />
              <input
                type="number"
                placeholder={t.quantity}
                value={newProduct.quantity}
                onChange={(e) => setNewProduct({...newProduct, quantity: e.target.value})}
                className="w-full p-4 text-xl border-2 rounded-lg"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder={t.purchasePrice}
                value={newProduct.purchase_price}
                onChange={(e) => setNewProduct({...newProduct, purchase_price: e.target.value})}
                className="w-full p-4 text-xl border-2 rounded-lg"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder={t.additionalCosts}
                value={newProduct.additional_costs}
                onChange={(e) => setNewProduct({...newProduct, additional_costs: e.target.value})}
                className="w-full p-4 text-xl border-2 rounded-lg"
              />
              <input
                type="number"
                step="0.01"
                placeholder={t.sellingPrice}
                value={newProduct.selling_price}
                onChange={(e) => setNewProduct({...newProduct, selling_price: e.target.value})}
                className="w-full p-4 text-xl border-2 rounded-lg"
                required
              />
              <button
                type="submit"
                className="w-full px-6 py-4 bg-indigo-600 text-white rounded-lg font-bold text-2xl hover:bg-indigo-700"
              >
                {t.addToWarehouse}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventorySystem;