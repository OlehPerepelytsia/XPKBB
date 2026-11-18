/**
 * ХРКВВ — Основний скрипт сайту
 * Функціонал: бургер-меню, випадаючий список послуг, маска телефону +380,
 * відправка заявок на сервер (api/send), слайдер відгуків, FAQ, лайтбокс, cookie-банер.
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ------------------------------------------------------------------------
     1. Мобільне бургер-меню та випадаючий список послуг
     ------------------------------------------------------------------------ */
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.nav');
  const dropdownTriggers = document.querySelectorAll('.nav__item--has-dropdown > .nav__link');

  if (burger && nav) {
    burger.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', isOpen);
    });
  }

  dropdownTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      if (window.innerWidth < 1024) {
        e.preventDefault();
        trigger.parentElement.classList.toggle('is-open');
      }
    });
  });

  /* ------------------------------------------------------------------------
     2. Маска введення українського телефону (+380 XX XXX XX XX)
     ------------------------------------------------------------------------ */
  const phoneInputs = document.querySelectorAll('input[type="tel"]');

  const formatPhone = (value) => {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('380')) {
      digits = digits.slice(3);
    } else if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    digits = digits.slice(0, 9);

    let formatted = '+380';
    if (digits.length > 0) formatted += ' (' + digits.slice(0, 2);
    if (digits.length >= 2) formatted += ') ' + digits.slice(2, 5);
    if (digits.length >= 5) formatted += '-' + digits.slice(5, 7);
    if (digits.length >= 7) formatted += '-' + digits.slice(7, 9);
    return formatted;
  };

  phoneInputs.forEach(input => {
    input.addEventListener('focus', () => {
      if (!input.value) input.value = '+380 (';
    });

    input.addEventListener('input', (e) => {
      e.target.value = formatPhone(e.target.value);
    });

    input.addEventListener('blur', () => {
      if (input.value === '+380 (' || input.value === '+380') {
        input.value = '';
      }
    });
  });

  /* ------------------------------------------------------------------------
     3. Валідація форм та відправка на серверний ендпоінт /api/send
     ------------------------------------------------------------------------ */
  const forms = document.querySelectorAll('.js-lead-form');

  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let isValid = true;

      const nameInput = form.querySelector('input[name="name"]');
      const phoneInput = form.querySelector('input[name="phone"]');
      const messageInput = form.querySelector('textarea[name="message"]');
      const statusBox = form.querySelector('.form-status');

      // Очищення попередніх помилок
      form.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));
      if (statusBox) {
        statusBox.className = 'form-status';
        statusBox.style.display = 'none';
      }

      // Перевірка імені
      if (nameInput && nameInput.value.trim().length < 2) {
        nameInput.closest('.form-group').classList.add('has-error');
        isValid = false;
      }

      // Перевірка телефону (12 цифр включно з 380)
      const rawDigits = phoneInput ? phoneInput.value.replace(/\D/g, '') : '';
      if (rawDigits.length !== 12) {
        phoneInput.closest('.form-group').classList.add('has-error');
        isValid = false;
      }

      if (!isValid) return;

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Відправка...';

      // Визначаємо заголовок сторінки та назву форми для зручності у Telegram
      const pageTitle = document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : document.title;
      const formHeading = form.closest('.callback-card, .sidebar-box, section')?.querySelector('h2, h3')?.textContent.trim() || 'Заявка з сайту';

      try {
        const response = await fetch('/api/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: nameInput.value.trim(),
            phone: phoneInput.value.trim(),
            message: messageInput ? messageInput.value.trim() : '',
            formHeading: formHeading,
            pageTitle: pageTitle
          })
        });

        const result = await response.json();

        if (response.ok && result.ok) {
          form.reset();
          if (typeof gtag === 'function') {
            gtag('event', 'generate_lead', {
              event_category: 'Form',
              event_label: formHeading
            });
          }
          if (statusBox) {
            statusBox.textContent = 'Дякуємо! Заявку прийнято. Диспетчер ХРКВВ зателефонує вам протягом 5 хвилин.';
            statusBox.classList.add('is-success');
            statusBox.style.display = 'block';
          }
        } else {
          throw new Error(result.error || 'Помилка відправки');
        }
      } catch (error) {
        console.error('Помилка відправки:', error);
        if (statusBox) {
          statusBox.textContent = 'Не вдалося відправити заявку. Будь ласка, зателефонуйте нам напряму за номером у шапці сайту.';
          statusBox.style.display = 'block';
          statusBox.style.backgroundColor = '#FDECEA';
          statusBox.style.color = '#D93025';
          statusBox.style.border = '1px solid #D93025';
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  });

  /* ------------------------------------------------------------------------
     4. Акордеон FAQ
     ------------------------------------------------------------------------ */
  const faqQuestions = document.querySelectorAll('.faq-item__question');

  faqQuestions.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      item.classList.toggle('is-open');
    });
  });

  /* ------------------------------------------------------------------------
     5. Слайдер відгуків
     ------------------------------------------------------------------------ */
  const track = document.querySelector('.slider__track');
  const slides = document.querySelectorAll('.slider__slide');
  const prevBtn = document.querySelector('.js-slider-prev');
  const nextBtn = document.querySelector('.js-slider-next');

  if (track && slides.length > 0 && prevBtn && nextBtn) {
    let currentIndex = 0;

    const getVisibleSlides = () => {
      if (window.innerWidth >= 1024) return 3;
      if (window.innerWidth >= 768) return 2;
      return 1;
    };

    const updateSlider = () => {
      const visible = getVisibleSlides();
      const maxIndex = Math.max(0, slides.length - visible);
      if (currentIndex > maxIndex) currentIndex = maxIndex;
      const offset = currentIndex * (100 / visible);
      track.style.transform = `translateX(-${offset}%)`;
    };

    nextBtn.addEventListener('click', () => {
      const visible = getVisibleSlides();
      const maxIndex = Math.max(0, slides.length - visible);
      currentIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
      updateSlider();
    });

    prevBtn.addEventListener('click', () => {
      const visible = getVisibleSlides();
      const maxIndex = Math.max(0, slides.length - visible);
      currentIndex = currentIndex <= 0 ? maxIndex : currentIndex - 1;
      updateSlider();
    });

    window.addEventListener('resize', updateSlider);
  }

  /* ------------------------------------------------------------------------
     6. Лайтбокс для фотогалереї (виправлено для роботи з тегами <img>)
     ------------------------------------------------------------------------ */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxDesc = document.getElementById('lightbox-desc');
  const lightboxClose = document.querySelector('.lightbox__close');

  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      const title = item.getAttribute('data-title') || '';
      const desc = item.getAttribute('data-desc') || '';
      const imgTag = item.querySelector('img');

      if (lightboxTitle) lightboxTitle.textContent = title;
      if (lightboxDesc) lightboxDesc.textContent = desc;

      if (imgTag && lightboxImg) {
        lightboxImg.src = imgTag.getAttribute('src');
        lightboxImg.style.display = 'block';
      } else if (lightboxImg) {
        lightboxImg.src = '';
        lightboxImg.style.display = 'none'; // Якщо це заглушка-іконка без картинки
      }

      if (lightbox) {
        lightbox.classList.add('active');
      }
    });
  });

  // Закриття лайтбокса при кліку на хрестик
  if (lightboxClose && lightbox) {
    lightboxClose.addEventListener('click', () => {
      lightbox.classList.remove('active');
    });
  }

  // Закриття лайтбокса при кліку поза контентом
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove('active');
      }
    });
  }

  /* ------------------------------------------------------------------------
     7. Плавна поява блоків при скролі
     ------------------------------------------------------------------------ */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    reveals.forEach(el => observer.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  /* ------------------------------------------------------------------------
     8. Мінімальний Cookie-банер
     ------------------------------------------------------------------------ */
  const cookieBanner = document.getElementById('cookie-banner');
  const cookieAccept = document.getElementById('cookie-accept');

  if (cookieBanner && cookieAccept && !localStorage.getItem('hrkvv_cookies_ok')) {
    cookieBanner.classList.add('is-visible');
    cookieAccept.addEventListener('click', () => {
      localStorage.setItem('hrkvv_cookies_ok', '1');
      cookieBanner.classList.remove('is-visible');
    });
  }

  /* ------------------------------------------------------------------------
     9. Відстеження конверсій у Google Analytics 4 (кліки по телефону та форми)
     ------------------------------------------------------------------------ */
  document.querySelectorAll('a[href^="tel:"]').forEach(phoneLink => {
    phoneLink.addEventListener('click', () => {
      if (typeof gtag === 'function') {
        gtag('event', 'phone_click', {
          event_category: 'Contacts',
          event_label: phoneLink.getAttribute('href')
        });
      }
    });
  });
});