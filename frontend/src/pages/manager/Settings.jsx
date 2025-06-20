import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSettings as useLocalSettings } from '../../context/SettingsContext';
import './Settings.css';

const Settings = () => {
  const { user_id, username } = useLocalSettings();
  const [settings, setSettings] = useState({
    currency: 'ILS',
    vat_rate: 17,
    site_name: '',
    site_description: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    maintenance_mode: false,
    allow_registration: true,
    allow_guest_checkout: true,
    min_order_amount: 0,
    max_order_amount: 10000,
    order_notification_email: '',
    smtp_host: '',
    smtp_port: '',
    smtp_user: '',
    smtp_password: '',
    smtp_secure: true,
    google_analytics_id: '',
    facebook_pixel_id: '',
    recaptcha_site_key: '',
    recaptcha_secret_key: '',
    stripe_public_key: '',
    stripe_secret_key: '',
    paypal_client_id: '',
    paypal_secret: '',
    shipping_methods: [],
    payment_methods: [],
    tax_rates: [],
    discount_codes: [],
    return_policy: '',
    privacy_policy: '',
    terms_conditions: '',
    shipping_policy: '',
    refund_policy: '',
    cookie_policy: '',
    about_us: '',
    faq: '',
    support_email: '',
    support_phone: '',
    support_hours: '',
    social_media_links: {},
    seo_meta_title: '',
    seo_meta_description: '',
    seo_meta_keywords: '',
    seo_og_title: '',
    seo_og_description: '',
    seo_og_image: '',
    seo_twitter_card: '',
    seo_twitter_title: '',
    seo_twitter_description: '',
    seo_twitter_image: '',
    seo_robots_txt: '',
    seo_sitemap_xml: '',
    seo_canonical_url: '',
    seo_alternate_languages: {},
    seo_schema_markup: '',
    seo_structured_data: {},
    seo_meta_tags: {},
    seo_meta_properties: {},
    seo_meta_names: {},
    seo_meta_http_equiv: {},
    seo_meta_charset: '',
    seo_meta_viewport: '',
    seo_meta_theme_color: '',
    seo_meta_msapplication_TileColor: '',
    seo_meta_msapplication_TileImage: '',
    seo_meta_msapplication_config: '',
    seo_meta_apple_mobile_web_app_capable: '',
    seo_meta_apple_mobile_web_app_status_bar_style: '',
    seo_meta_apple_mobile_web_app_title: '',
    seo_meta_apple_touch_icon: '',
    seo_meta_apple_touch_icon_72x72: '',
    seo_meta_apple_touch_icon_114x114: '',
    seo_meta_apple_touch_icon_144x144: '',
    seo_meta_apple_touch_icon_152x152: '',
    seo_meta_apple_touch_icon_180x180: '',
    seo_meta_apple_touch_icon_192x192: '',
    seo_meta_apple_touch_icon_512x512: '',
    seo_meta_apple_touch_startup_image: '',
    seo_meta_apple_touch_startup_image_640x1136: '',
    seo_meta_apple_touch_startup_image_750x1334: '',
    seo_meta_apple_touch_startup_image_1242x2208: '',
    seo_meta_apple_touch_startup_image_1125x2436: '',
    seo_meta_apple_touch_startup_image_1536x2048: '',
    seo_meta_apple_touch_startup_image_1668x2224: '',
    seo_meta_apple_touch_startup_image_2048x2732: '',
    seo_meta_apple_touch_startup_image_2208x1242: '',
    seo_meta_apple_touch_startup_image_2436x1125: '',
    seo_meta_apple_touch_startup_image_2732x2048: '',
    seo_meta_apple_touch_startup_image_2224x1668: '',
    seo_meta_apple_touch_startup_image_2048x1536: ''
  });
  const [currencies, setCurrencies] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, currenciesRes] = await Promise.all([
          axios.get('/api/settings'),
          axios.get('/api/currencies')
        ]);
        const fetchedSettings = Array.isArray(settingsRes.data) ? settingsRes.data[0] : settingsRes.data;
        setSettings(prev => ({...prev, ...fetchedSettings}));
        setCurrencies(currenciesRes.data);
      } catch (err) {
        setMessage('Error loading settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { currency, vat_rate, site_name, contact_email, contact_phone, facebook_url, instagram_url, twitter_url } = settings;
      await axios.put('/api/settings', { currency, vat_rate, site_name, contact_email, contact_phone, facebook_url, instagram_url, twitter_url }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Settings updated successfully');
    } catch (err) {
      setMessage('Error updating settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const TABS = ['general', 'currency', 'contact'];

  if (loading) {
    return <div className="settings-container"><div>Loading settings...</div></div>;
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your store settings and preferences</p>
      </div>

      {message && <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}

      <select className="settings-tab-select" value={activeTab} onChange={(e) => setActiveTab(e.target.value)}>
        {TABS.map((tab) => (
          <option key={tab} value={tab}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </option>
        ))}
      </select>
      
      <form onSubmit={handleSubmit}>
        {activeTab === 'general' && (
          <div className="settings-form-section">
            <div className="form-group">
              <label>Site Name</label>
              <input type="text" name="site_name" value={settings.site_name || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>VAT Rate (%)</label>
              <input type="number" name="vat_rate" value={settings.vat_rate || ''} onChange={handleChange} />
            </div>
          </div>
        )}

        {activeTab === 'currency' && (
          <div className="settings-form-section">
            <div className="form-group">
              <label>Store Currency</label>
              <select name="currency" value={settings.currency || 'ILS'} onChange={handleChange}>
                {Object.keys(currencies).map(code => (
                  <option key={code} value={code}>{currencies[code].name} ({currencies[code].symbol})</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="settings-form-section">
            <div className="form-group">
              <label>Contact Email</label>
              <input type="email" name="contact_email" value={settings.contact_email || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Contact Phone</label>
              <input type="tel" name="contact_phone" value={settings.contact_phone || ''} onChange={handleChange} />
            </div>
          </div>
        )}
        
        <button type="submit" className="settings-save-button" disabled={loading}>
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default Settings;