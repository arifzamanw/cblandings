/**
 * CertificationsBay Landing Page Application Script
 * Handles lead forms (Hero, Footer, Modal), WhatsApp popup, HubSpot CRM integration,
 * Google Ads conversion events, and Searchable Country Picker Component.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const leadForm = document.getElementById('leadForm');
  const formStatus = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');
  const entityTypeSelect = document.getElementById('entityType');

  // Hero Lead Form
  const heroLeadForm = document.getElementById('heroLeadForm');
  const heroFormStatus = document.getElementById('heroFormStatus');
  const heroSubmitBtn = document.getElementById('heroSubmitBtn');

  // Footer Lead Form
  const footerLeadForm = document.getElementById('footerLeadForm');
  const footerFormStatus = document.getElementById('footerFormStatus');
  const footerSubmitBtn = document.getElementById('footerSubmitBtn');

  // WhatsApp Elements
  const whatsappPopup = document.getElementById('whatsappPopup');
  const closeWhatsappPopup = document.getElementById('closeWhatsappPopup');

  // Dedicated Contact Page Redirect Handler
  document.querySelectorAll('.open-modal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (btn.tagName === 'A' && btn.getAttribute('href') && btn.getAttribute('href').startsWith('tel:')) {
        return;
      }
      e.preventDefault();
      const targetEntity = btn.getAttribute('data-entity') || 'General Quote';
      const isLMPCPage = window.location.pathname.includes('lmpc') || targetEntity.toLowerCase().includes('lmpc') || targetEntity.toLowerCase().includes('metrology') || targetEntity.toLowerCase().includes('packaged');
      const isEPRPage = window.location.pathname.includes('epr') || targetEntity.toLowerCase().includes('epr') || targetEntity.toLowerCase().includes('waste') || targetEntity.toLowerCase().includes('plastic') || targetEntity.toLowerCase().includes('battery') || targetEntity.toLowerCase().includes('tyre') || targetEntity.toLowerCase().includes('oil');
      
      let targetPage = 'contact.html';
      if (isLMPCPage) {
        targetPage = 'lmpc-contact.html';
      } else if (isEPRPage) {
        targetPage = 'epr-contact.html';
      }

      let serviceParam = '';
      if (targetEntity.includes('Liaison')) {
        serviceParam = '?service=Liaison+Office';
      } else if (targetEntity.includes('Subsidiary')) {
        serviceParam = '?service=Wholly+Owned+Subsidiary';
      } else if (targetEntity.includes('Branch')) {
        serviceParam = '?service=Branch+Office';
      } else if (targetEntity.includes('Plastic')) {
        serviceParam = '?service=Plastic+Packaging';
      } else if (targetEntity.includes('E-Waste')) {
        serviceParam = '?service=E-Waste';
      } else if (targetEntity.includes('Battery')) {
        serviceParam = '?service=Battery';
      } else if (targetEntity.includes('Tyre')) {
        serviceParam = '?service=Waste+Tyre';
      } else if (targetEntity.includes('Oil')) {
        serviceParam = '?service=Used+Oil';
      } else if (targetEntity.includes('Importer')) {
        serviceParam = '?service=Importer';
      } else if (targetEntity.includes('Manufacturer')) {
        serviceParam = '?service=Manufacturer';
      } else if (targetEntity.includes('Packer')) {
        serviceParam = '?service=Packer';
      }

      window.location.href = targetPage + serviceParam;
    });
  });

  // Modal Close Handlers
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      modalBackdrop.classList.remove('active');
    });
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        modalBackdrop.classList.remove('active');
      }
    });
  }

  // ==========================================================================
  // Searchable Country Picker Component Initialization
  // Displays: FULL COUNTRY NAME + DIAL CODE inside open dropdown list
  // Displays: ONLY FLAG + DIAL CODE when selected in input box
  // Includes: Real-time search filter input
  // ==========================================================================
  const WORLD_COUNTRIES = [
    { name: 'India', code: '+91', flag: '🇮🇳' },
    { name: 'United States', code: '+1', flag: '🇺🇸' },
    { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
    { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪' },
    { name: 'Canada', code: '+1', flag: '🇨🇦' },
    { name: 'Australia', code: '+61', flag: '🇦🇺' },
    { name: 'Germany', code: '+49', flag: '🇩🇪' },
    { name: 'Singapore', code: '+65', flag: '🇸🇬' },
    { name: 'France', code: '+33', flag: '🇫🇷' },
    { name: 'Japan', code: '+81', flag: '🇯🇵' },
    { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
    { name: 'Qatar', code: '+974', flag: '🇶🇦' },
    { name: 'Kuwait', code: '+965', flag: '🇰🇼' },
    { name: 'Oman', code: '+968', flag: '🇴🇲' },
    { name: 'Bahrain', code: '+973', flag: '🇧🇭' },
    { name: 'Netherlands', code: '+31', flag: '🇳🇱' },
    { name: 'Switzerland', code: '+41', flag: '🇨🇭' },
    { name: 'Sweden', code: '+46', flag: '🇸🇪' },
    { name: 'Spain', code: '+34', flag: '🇪🇸' },
    { name: 'Italy', code: '+39', flag: '🇮🇹' },
    { name: 'Brazil', code: '+55', flag: '🇧🇷' },
    { name: 'Mexico', code: '+52', flag: '🇲🇽' },
    { name: 'South Africa', code: '+27', flag: '🇿🇦' },
    { name: 'Hong Kong', code: '+852', flag: '🇭🇰' },
    { name: 'Malaysia', code: '+60', flag: '🇲🇾' },
    { name: 'Indonesia', code: '+62', flag: '🇮🇩' },
    { name: 'Thailand', code: '+66', flag: '🇹🇭' },
    { name: 'Vietnam', code: '+84', flag: '🇻🇳' },
    { name: 'Philippines', code: '+63', flag: '🇵🇭' },
    { name: 'Pakistan', code: '+92', flag: '🇵🇰' },
    { name: 'Bangladesh', code: '+880', flag: '🇧🇩' },
    { name: 'Sri Lanka', code: '+94', flag: '🇱🇰' },
    { name: 'Nepal', code: '+977', flag: '🇳🇵' },
    { name: 'Turkey', code: '+90', flag: '🇹🇷' },
    { name: 'Israel', code: '+972', flag: '🇮🇱' },
    { name: 'Egypt', code: '+20', flag: '🇪🇬' },
    { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
    { name: 'Kenya', code: '+254', flag: '🇰🇪' },
    { name: 'Argentina', code: '+54', flag: '🇦🇷' },
    { name: 'Chile', code: '+56', flag: '🇨🇱' },
    { name: 'Colombia', code: '+57', flag: '🇨🇴' },
    { name: 'Peru', code: '+51', flag: '🇵🇪' },
    { name: 'New Zealand', code: '+64', flag: '🇳🇿' },
    { name: 'Ireland', code: '+353', flag: '🇮🇪' },
    { name: 'South Korea', code: '+82', flag: '🇰🇷' },
    { name: 'Taiwan', code: '+886', flag: '🇹🇼' },
    { name: 'Poland', code: '+48', flag: '🇵🇱' },
    { name: 'Austria', code: '+43', flag: '🇦🇹' },
    { name: 'Belgium', code: '+32', flag: '🇧🇪' },
    { name: 'Denmark', code: '+45', flag: '🇩🇰' },
    { name: 'Finland', code: '+358', flag: '🇫🇮' },
    { name: 'Norway', code: '+47', flag: '🇳🇴' },
    { name: 'Portugal', code: '+351', flag: '🇵🇹' },
    { name: 'Greece', code: '+30', flag: '🇬🇷' },
    { name: 'Czech Republic', code: '+420', flag: '🇨🇿' },
    { name: 'Hungary', code: '+36', flag: '🇭🇺' },
    { name: 'Romania', code: '+40', flag: '🇷🇴' },
    { name: 'Ukraine', code: '+380', flag: '🇺🇦' },
    { name: 'Russia', code: '+7', flag: '🇷🇺' }
  ];

  function initSearchableCountryPickers() {
    document.querySelectorAll('.country-picker-wrapper').forEach(wrapper => {
      const btn = wrapper.querySelector('.country-picker-btn');
      const dropdown = wrapper.querySelector('.country-picker-dropdown');
      const searchInput = wrapper.querySelector('.country-search-input');
      const listContainer = wrapper.querySelector('.country-list');
      const hiddenInput = wrapper.querySelector('.country-code-input');
      const selectedFlag = wrapper.querySelector('.selected-flag');
      const selectedCode = wrapper.querySelector('.selected-code');

      if (!btn || !dropdown || !listContainer || !hiddenInput) return;

      // Render Country Options List (Shows FULL COUNTRY NAME + DIAL CODE)
      function renderList(filterTerm = '') {
        listContainer.innerHTML = '';
        const term = filterTerm.toLowerCase().trim();

        const filtered = WORLD_COUNTRIES.filter(c => 
          c.name.toLowerCase().includes(term) || c.code.includes(term)
        );

        if (filtered.length === 0) {
          listContainer.innerHTML = '<div class="text-xs text-gray-400 p-2 text-center">No countries found</div>';
          return;
        }

        filtered.forEach(c => {
          const optBtn = document.createElement('button');
          optBtn.type = 'button';
          optBtn.className = 'w-full px-2.5 py-1.5 text-left text-xs hover:bg-emerald-50 hover:text-emerald-900 rounded-lg flex items-center justify-between gap-2 font-medium cursor-pointer transition-colors';
          optBtn.innerHTML = `
            <span class="flex items-center gap-1.5 truncate">
              <span>${c.flag}</span>
              <span class="truncate">${c.name}</span>
            </span>
            <span class="font-bold opacity-75 shrink-0">${c.code}</span>
          `;

          optBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Update Selected Button Display (ONLY Flag + Code!)
            if (selectedFlag) selectedFlag.textContent = c.flag;
            if (selectedCode) selectedCode.textContent = c.code;
            hiddenInput.value = c.code;

            // Close Dropdown
            dropdown.classList.add('hidden');
            dropdown.classList.remove('flex');
          });

          listContainer.appendChild(optBtn);
        });
      }

      renderList();

      // Toggle Dropdown
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.country-picker-dropdown').forEach(d => {
          if (d !== dropdown) {
            d.classList.add('hidden');
            d.classList.remove('flex');
          }
        });

        const isHidden = dropdown.classList.contains('hidden');
        if (isHidden) {
          dropdown.classList.remove('hidden');
          dropdown.classList.add('flex');
          if (searchInput) {
            searchInput.value = '';
            renderList();
            setTimeout(() => searchInput.focus(), 50);
          }
        } else {
          dropdown.classList.add('hidden');
          dropdown.classList.remove('flex');
        }
      });

      // Filter search input
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          renderList(e.target.value);
        });
        searchInput.addEventListener('click', (e) => e.stopPropagation());
      }
    });

    // Close dropdowns on outside click
    document.addEventListener('click', () => {
      document.querySelectorAll('.country-picker-dropdown').forEach(d => {
        d.classList.add('hidden');
        d.classList.remove('flex');
      });
    });
  }

  initSearchableCountryPickers();

  // Handle Hero Form Submission
  if (heroLeadForm) {
    heroLeadForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const eprCategoryEl = document.getElementById('heroEntityType') || document.getElementById('eprCategory');
      const eprProductEl = document.getElementById('heroProductActivity') || document.getElementById('eprProductActivity');
      const heroIsImportingEl = document.getElementById('heroIsImporting');

      let messageVal = eprProductEl ? eprProductEl.value.trim() : '';
      if (heroIsImportingEl) {
        messageVal = `Importing to India: ${heroIsImportingEl.value}${messageVal ? ' | Product: ' + messageVal : ''}`;
      }

      const payload = {
        fullName: (document.getElementById('heroFullName') || document.getElementById('eprFullName')).value.trim(),
        email: (document.getElementById('heroEmail') || document.getElementById('eprEmail')).value.trim(),
        countryCode: (document.getElementById('heroCountryCode') || document.getElementById('eprCountryCode')) ? (document.getElementById('heroCountryCode') || document.getElementById('eprCountryCode')).value : '+91',
        phone: (document.getElementById('heroPhone') || document.getElementById('eprPhone')).value.trim(),
        entityType: eprCategoryEl ? eprCategoryEl.value : 'Consultation',
        message: messageVal,
        source: 'Hero Contact Form'
      };

      await handleLeadSubmission(payload, heroSubmitBtn || document.getElementById('eprSubmitBtn'), heroFormStatus || document.getElementById('eprFormStatus'), () => {
        heroLeadForm.reset();
      });
    });
  }

  // Handle Main Lead Form Submission
  if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const productEl = document.getElementById('productActivity') || document.getElementById('eprProductActivity');
      const companyEl = document.getElementById('company');
      const isImportingEl = document.getElementById('isImporting');

      let messageVal = productEl ? productEl.value.trim() : '';
      if (isImportingEl) {
        messageVal = `Importing to India: ${isImportingEl.value}${messageVal ? ' | Details: ' + messageVal : ''}`;
      }

      const payload = {
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        countryCode: document.getElementById('countryCode') ? document.getElementById('countryCode').value : '+91',
        phone: document.getElementById('phone').value.trim(),
        company: companyEl ? companyEl.value.trim() : '',
        entityType: entityTypeSelect ? entityTypeSelect.value : 'General Consultation',
        message: messageVal,
        source: 'Main Consultation Form'
      };

      await handleLeadSubmission(payload, submitBtn, formStatus, () => {
        leadForm.reset();
      });
    });
  }

  // Handle Popup Modal Lead Form Submission
  const leadFormModal = document.getElementById('leadFormModal');
  if (leadFormModal) {
    leadFormModal.addEventListener('submit', async (e) => {
      e.preventDefault();
      const modalSubmitBtn = leadFormModal.querySelector('button[type="submit"]');
      const modalFullName = document.getElementById('modalFullName') ? document.getElementById('modalFullName').value.trim() : '';
      const modalEmail = document.getElementById('modalEmail') ? document.getElementById('modalEmail').value.trim() : '';
      const modalPhone = document.getElementById('modalPhone') ? document.getElementById('modalPhone').value.trim() : '';
      const modalCountryCode = document.getElementById('modalCountryCode') ? document.getElementById('modalCountryCode').value : '+91';
      const modalProductEl = document.getElementById('modalProductActivity');

      let modalStatus = leadFormModal.querySelector('.modal-form-status');
      if (!modalStatus) {
        modalStatus = document.createElement('div');
        modalStatus.className = 'modal-form-status text-center text-xs font-bold mt-2';
        leadFormModal.appendChild(modalStatus);
      }

      const payload = {
        fullName: modalFullName,
        email: modalEmail,
        countryCode: modalCountryCode,
        phone: modalPhone,
        entityType: 'Popup Modal Consultation',
        message: modalProductEl ? modalProductEl.value.trim() : '',
        source: 'Popup Modal Form'
      };

      await handleLeadSubmission(payload, modalSubmitBtn, modalStatus, () => {
        leadFormModal.reset();
        setTimeout(() => {
          if (modalBackdrop) modalBackdrop.classList.remove('active');
          modalStatus.classList.add('hidden');
        }, 2000);
      });
    });
  }

  // Handle Footer Lead Form Submission
  if (footerLeadForm) {
    footerLeadForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const payload = {
        fullName: document.getElementById('footerFullName').value.trim(),
        email: document.getElementById('footerEmail').value.trim(),
        countryCode: document.getElementById('footerCountryCode') ? document.getElementById('footerCountryCode').value : '+91',
        phone: document.getElementById('footerPhone').value.trim(),
        company: document.getElementById('footerCompany').value.trim(),
        entityType: document.getElementById('footerEntityType').value,
        source: 'Footer Consultation Form'
      };

      await handleLeadSubmission(payload, footerSubmitBtn, footerFormStatus, () => {
        footerLeadForm.reset();
      });
    });
  }

  /**
   * Unified Lead Submission Function
   * Strictly submits data to api/submit.php and displays authentic success/error feedback
   */
  async function handleLeadSubmission(data, buttonEl, statusEl, onSuccess) {
    buttonEl.disabled = true;
    const originalText = buttonEl.innerText;
    buttonEl.innerText = 'SUBMITTING...';
    
    statusEl.className = 'text-center text-xs font-bold mt-2 block text-gray-600';
    statusEl.innerText = 'Submitting consultation request...';

    try {
      const response = await fetch('api/submit.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const textResp = await response.text().catch(() => '');
        throw new Error(`Server returned non-JSON response (HTTP ${response.status}): ${textResp.substring(0, 120) || 'Unknown server response'}`);
      }

      if (response.ok && result && result.success) {
        statusEl.className = 'text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs font-medium mt-3 block text-center';
        statusEl.innerText = result.message || '✓ Thank you! An incorporation expert will contact you within 2 hours.';
        
        // Trigger Google Ads Conversion Event
        if (typeof gtag === 'function') {
          gtag('event', 'conversion', {
            'send_to': 'AW-XXXXXXXXX/conversion_label',
            'value': 1.0,
            'currency': 'USD'
          });
        }

        if (onSuccess) onSuccess();
      } else {
        const errorMsg = (result && result.message) || (result && result.errors ? result.errors.join(' | ') : `Submission failed (HTTP ${response.status})`);
        throw new Error(errorMsg);
      }
    } catch (err) {
      statusEl.className = 'text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl text-xs font-medium mt-3 block text-center';
      if (err.name === 'TypeError' || err.message.includes('Failed to fetch')) {
        statusEl.innerText = '❌ Backend connection failed (PHP server required). Please upload to your live Hostinger hosting or run a PHP server to submit.';
      } else {
        statusEl.innerText = '❌ ' + (err.message || 'Error: Failed to submit form. Please check network connection.');
      }
    } finally {
      buttonEl.disabled = false;
      buttonEl.innerText = originalText;
    }
  }

  // ==========================================================================
  // WhatsApp Notification Popup Controller
  // ==========================================================================
  let whatsappShown = false;

  function triggerWhatsappPopup() {
    if (whatsappShown || !whatsappPopup) return;
    whatsappShown = true;
    
    whatsappPopup.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
    whatsappPopup.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
  }

  if (closeWhatsappPopup && whatsappPopup) {
    closeWhatsappPopup.addEventListener('click', (e) => {
      e.stopPropagation();
      whatsappPopup.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
      whatsappPopup.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
    });
  }

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      triggerWhatsappPopup();
    }
  }, { passive: true });

  setTimeout(() => {
    triggerWhatsappPopup();
  }, 2500);

});
