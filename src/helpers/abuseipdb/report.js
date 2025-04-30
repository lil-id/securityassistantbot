const axios = require('axios');
const { classifyAlertToAbuseCategoryByRule } = require('./categoryMapper');
const logger = require('../logger');

/**
 * Mengecek sisa kuota AbuseIPDB API
 * @param {string} apiKey
 * @returns {Promise<boolean>} - true jika kuota masih tersedia
 */
async function checkQuotaAbuseIPDB(apiKey) {
    try {
      const res = await axios.get('https://api.abuseipdb.com/api/v2/check', {
        headers: {
          Key: apiKey,
          Accept: 'application/json',
        },
        params: { ipAddress: '127.0.0.1' }, // safe dummy IP
      });

      if (res?.status === 429 || parseInt(remaining) <= 0) {
        console.warn(`[Monsta] 🚫 AbuseIPDB quota exceeded (429). Remaining: ${remaining}`);
        return false;
      }      
  
      const remaining = res?.headers['x-ratelimit-remaining'];
      if (parseInt(remaining) <= 0) {
        console.warn(`[Monsta] ⚠️ Kuota AbuseIPDB habis!`);
        return false;
      }
  
      return true;
    } catch (err) {
      console.error(`[Monsta] ⚠️ Gagal cek kuota AbuseIPDB`, err?.response?.data || err.message);
      return false;
    }
}  

/**
 * Fungsi kirim report IP ke AbuseIPDB berdasarkan alert Wazuh.
 * 
 * @param {string} ip - IP address yang akan direport
 * @param {Object} alert - Object alert dari Wazuh
 * @param {string} apiKey - AbuseIPDB API Key
 * @returns {Promise<Object|null>}
 */
async function reportToAbuseIPDB(ip, alert, apiKey) {
  if (!ip || !apiKey || !alert?.rule) {
    logger.warn(`[Monsta] ⚠️ reportToAbuseIPDB: Data tidak lengkap`);
    return null;
  }

  const categories = classifyAlertToAbuseCategoryByRule(alert);
  const comment = `Auto-report from Monsta - Rule ID ${alert.rule.id}: ${alert.rule.description || 'No description'}`;

  try {
    const response = await axios.post(
      'https://api.abuseipdb.com/api/v2/report',
      new URLSearchParams({
        ip,
        categories: categories.join(','),
        comment,
      }),
      {
        headers: {
          Key: apiKey,
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    logger.log(`[Monsta] ✅ Report sukses ke AbuseIPDB: IP ${ip} | Kategori: ${categories.join(', ')}`);
    return response.data;
  } catch (error) {
    logger.error(`[Monsta] ❌ Gagal report IP ${ip}`, error?.response?.data || error.message);
    return null;
  }
}

module.exports = { reportToAbuseIPDB, checkQuotaAbuseIPDB };
