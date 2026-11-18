(function () {
  'use strict';

  var STORAGE_KEY = 'htw_orders_v1';

  function safeGetOrders() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function safeSaveOrder(orderObj) {
    try {
      var list = safeGetOrders();
      list.unshift(orderObj);
      if (list.length > 30) list = list.slice(0, 30);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function getWalletAddress(chain) {
    try {
      var cfg = window.SITE_PAY_CONFIG;
      if (cfg && typeof cfg[chain] === 'string' && cfg[chain].trim()) {
        return cfg[chain].trim();
      }
    } catch (e) {}
    return '';
  }

  function showToast(msg) {
    var el = document.getElementById('htw-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  // 1. Mobile Navigation Drawer
  var burger = document.getElementById('htw-burger');
  var mobileMenu = document.getElementById('htw-mobile-menu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      mobileMenu.classList.toggle('open');
    });
    mobileMenu.querySelectorAll('a, button').forEach(function (item) {
      item.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
      });
    });
  }

  // 2. After-sales footer smooth scroll + open
  document.querySelectorAll('[data-open-aftersales]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var target = document.getElementById('after-sales');
      if (target) {
        target.open = true;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  // 3. Homepage Category & Attribute Filter
  var activeCat = '全部产品';
  var activeAttr = '全部属性';
  var cards = document.querySelectorAll('.htw-card[data-cat]');

  function applyFilters() {
    if (!cards.length) return;
    cards.forEach(function (c) {
      var cCat = c.getAttribute('data-cat') || '';
      var cKyc = c.getAttribute('data-kyc') || '';
      var cOver = c.getAttribute('data-overseas') || '';
      var cOld = c.getAttribute('data-old') || '';
      var catOk = (activeCat === '全部产品') || (cCat === activeCat);
      var attrOk = true;
      if (activeAttr === '已实名') attrOk = (cKyc === '1');
      else if (activeAttr === '未实名') attrOk = (cKyc === '0');
      else if (activeAttr === '海外节点') attrOk = (cOver === '1');
      else if (activeAttr === '一年以上老号') attrOk = (cOld === '1');
      if (catOk && attrOk) c.classList.remove('hidden');
      else c.classList.add('hidden');
    });
  }

  document.querySelectorAll('.htw-cat-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.htw-cat-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeCat = btn.getAttribute('data-cat') || '全部产品';
      applyFilters();
    });
  });

  document.querySelectorAll('.htw-attr-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.htw-attr-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeAttr = btn.getAttribute('data-attr') || '全部属性';
      applyFilters();
    });
  });

  // 4. Order Query + Ticket Modal
  var queryModal = document.getElementById('htw-query-modal');
  function openQueryModal(defaultTab) {
    if (!queryModal) return;
    queryModal.classList.add('open');
    switchModalTab(defaultTab || 'query');
  }
  function closeQueryModal() {
    if (queryModal) queryModal.classList.remove('open');
  }
  function switchModalTab(tabName) {
    document.querySelectorAll('.htw-tab-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabName);
    });
    document.querySelectorAll('.htw-tab-panel').forEach(function (pnl) {
      pnl.classList.toggle('active', pnl.getAttribute('data-panel') === tabName);
    });
  }

  document.querySelectorAll('[data-open-query]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      openQueryModal('query');
    });
  });
  document.querySelectorAll('.htw-tab-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      switchModalTab(b.getAttribute('data-tab'));
    });
  });
  var qClose = document.getElementById('htw-query-close');
  if (qClose) qClose.addEventListener('click', closeQueryModal);
  if (queryModal) {
    queryModal.addEventListener('click', function (e) {
      if (e.target === queryModal) closeQueryModal();
    });
  }

  var qBtn = document.getElementById('htw-do-query');
  if (qBtn) {
    qBtn.addEventListener('click', function () {
      var kw = (document.getElementById('htw-query-input').value || '').trim().toLowerCase();
      var resBox = document.getElementById('htw-query-results');
      if (!resBox) return;
      resBox.innerHTML = '';
      if (!kw) {
        resBox.innerHTML = '<div class="htw-ord-box">请输入订单编号或下单时填写的接收邮箱。</div>';
        return;
      }
      var orders = safeGetOrders().filter(function (o) {
        return (o.id && o.id.toLowerCase().indexOf(kw) >= 0) ||
               (o.email && o.email.toLowerCase().indexOf(kw) >= 0);
      });
      if (!orders.length) {
        resBox.innerHTML = '<div class="htw-ord-box">未检索到匹配的订单记录，请核对订单编号或邮箱拼写。</div>';
        return;
      }
      orders.slice(0, 5).forEach(function (o) {
        var card = document.createElement('div');
        card.className = 'htw-ord-box';
        card.innerHTML =
          '<div class="htw-ord-row"><span>订单编号</span><strong>' + o.id + '</strong></div>' +
          '<div class="htw-ord-row"><span>商品名称</span><strong>' + o.title + '</strong></div>' +
          '<div class="htw-ord-row"><span>购买数量</span><strong>' + o.qty + ' ' + o.unit + '</strong></div>' +
          '<div class="htw-ord-row"><span>应付总额</span><strong>' + o.total + ' USD</strong></div>' +
          '<div class="htw-ord-row"><span>支付网络</span><strong>' + o.chain + '</strong></div>' +
          '<div class="htw-ord-row"><span>当前状态</span><strong>' + o.status + '</strong></div>';
        resBox.appendChild(card);
      });
    });
  }

  var tBtn = document.getElementById('htw-submit-ticket');
  if (tBtn) {
    tBtn.addEventListener('click', function () {
      var tType = document.getElementById('htw-ticket-type').value;
      var tOrd = (document.getElementById('htw-ticket-ord').value || '').trim();
      var tMail = (document.getElementById('htw-ticket-email').value || '').trim();
      var tDesc = (document.getElementById('htw-ticket-desc').value || '').trim();
      var tFb = document.getElementById('htw-ticket-feedback');
      var mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tMail);
      if (!tOrd || !mailOk || tDesc.length < 6) {
        tFb.style.color = '#B91C1C';
        tFb.textContent = '请完整填写关联订单号、有效联系邮箱及不少于6字的问题描述。';
        return;
      }
      var tkCode = 'TK-HTW-' + String(Math.floor(100000 + Math.random() * 900000));
      tFb.style.color = '#059669';
      tFb.textContent = '工单号 ' + tkCode + '（' + tType + '）：自助工单已登记，系统核验结果与处理进度将直接发送至您的联系邮箱。';
      document.getElementById('htw-ticket-desc').value = '';
    });
  }

  // 5. Detail Page Purchase Card & 3-Step Checkout Flow
  var buyForm = document.getElementById('htw-buy-card');
  if (!buyForm) return;

  var unitPrice = parseFloat(buyForm.getAttribute('data-price') || '0');
  var unitLabel = buyForm.getAttribute('data-unit') || '个';
  var prodTitle = buyForm.getAttribute('data-title') || '';
  var maxQty = parseInt(buyForm.getAttribute('data-max') || '50', 10);

  var qtyInput = document.getElementById('htw-qty-val');
  var qtyMinus = document.getElementById('htw-qty-minus');
  var qtyPlus = document.getElementById('htw-qty-plus');
  var totalEl = document.getElementById('htw-total-val');
  var emailInput = document.getElementById('htw-buy-email');
  var emailErr = document.getElementById('htw-email-err');
  var buyBtn = document.getElementById('htw-buy-btn');

  var selectedChain = 'USDT-TRC20';
  document.querySelectorAll('.htw-chain-opt').forEach(function (lbl) {
    lbl.addEventListener('click', function () {
      document.querySelectorAll('.htw-chain-opt').forEach(function (x) { x.classList.remove('active'); });
      lbl.classList.add('active');
      var inp = lbl.querySelector('input');
      if (inp) {
        inp.checked = true;
        selectedChain = inp.value;
      }
    });
  });

  function updateTotal() {
    var q = parseInt(qtyInput.value || '1', 10);
    if (isNaN(q) || q < 1) q = 1;
    if (q > maxQty) q = maxQty;
    qtyInput.value = q;
    if (totalEl) totalEl.textContent = (unitPrice * q).toFixed(2) + ' USD';
  }

  if (qtyMinus) qtyMinus.addEventListener('click', function () { qtyInput.value = Math.max(1, parseInt(qtyInput.value || '1', 10) - 1); updateTotal(); });
  if (qtyPlus) qtyPlus.addEventListener('click', function () { qtyInput.value = Math.min(maxQty, parseInt(qtyInput.value || '1', 10) + 1); updateTotal(); });
  if (qtyInput) qtyInput.addEventListener('change', updateTotal);

  var payModal = document.getElementById('htw-pay-modal');
  var payClose = document.getElementById('htw-pay-close');
  var timerId = null;

  function closePayModal() {
    if (payModal) payModal.classList.remove('open');
    if (timerId) { clearInterval(timerId); timerId = null; }
  }
  if (payClose) payClose.addEventListener('click', closePayModal);
  if (payModal) {
    payModal.addEventListener('click', function (e) {
      if (e.target === payModal) closePayModal();
    });
  }

  function startCountdown() {
    if (timerId) clearInterval(timerId);
    var sec = 15 * 60;
    var clockEl = document.getElementById('htw-timer-clock');
    function tick() {
      var m = Math.floor(sec / 60);
      var s = sec % 60;
      if (clockEl) clockEl.textContent = (m < 10 ? '0' + m : m) + ' : ' + (s < 10 ? '0' + s : s);
      if (sec <= 0) { clearInterval(timerId); timerId = null; }
      sec--;
    }
    tick();
    timerId = setInterval(tick, 1000);
  }

  var copyBtn = document.getElementById('htw-copy-addr');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var addr = document.getElementById('htw-pay-addr').textContent || '';
      if (!addr) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(addr).catch(function () {});
      } else {
        var ta = document.createElement('textarea');
        ta.value = addr;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
      }
      copyBtn.textContent = '✓ 已复制';
      setTimeout(function () { copyBtn.textContent = '复制'; }, 2000);
    });
  }

  if (buyBtn) {
    buyBtn.addEventListener('click', function () {
      if (buyBtn.disabled) return;
      var email = (emailInput.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailErr.textContent = '请输入正确的接收卡密邮箱地址，例如 name@domain.com';
        emailInput.focus();
        return;
      }
      emailErr.textContent = '';

      var q = parseInt(qtyInput.value || '1', 10);
      var totalStr = (unitPrice * q).toFixed(2);
      var now = new Date();
      var dStr = String(now.getFullYear()) +
                 String(now.getMonth() + 1).padStart(2, '0') +
                 String(now.getDate()).padStart(2, '0');
      var ordId = 'HTW-' + dStr + '-' + String(Math.floor(1000 + Math.random() * 9000));

      // Step 1: 1.2s loading
      var origHtml = buyBtn.innerHTML;
      buyBtn.disabled = true;
      buyBtn.innerHTML = '<span class="htw-spinner"></span> 正在锁定库存并创建订单...';

      setTimeout(function () {
        // Step 2: 0.8s toast
        showToast('✓ 订单已创建，订单编号：' + ordId);
        var orderRec = {
          id: ordId,
          title: prodTitle,
          qty: q,
          unit: unitLabel,
          total: totalStr,
          email: email,
          chain: selectedChain,
          time: now.toISOString(),
          status: '待链上确认'
        };
        safeSaveOrder(orderRec);

        setTimeout(function () {
          buyBtn.disabled = false;
          buyBtn.innerHTML = origHtml;

          // Step 3: Checkout Modal
          var addr = getWalletAddress(selectedChain);
          document.getElementById('htw-co-id').textContent = ordId;
          document.getElementById('htw-co-title').textContent = prodTitle;
          document.getElementById('htw-co-qty').textContent = q + ' ' + unitLabel;
          document.getElementById('htw-co-email').textContent = email;
          document.getElementById('htw-co-chain').textContent = selectedChain;
          document.getElementById('htw-co-total').textContent = totalStr + ' USD';
          document.getElementById('htw-pay-addr').textContent = addr;
          document.getElementById('htw-qr-note').textContent = '请使用支持 ' + selectedChain + ' 的钱包扫码支付';

          var canvas = document.getElementById('htw-qr-canvas');
          if (typeof window.renderPayQrCanvas === 'function' && canvas) {
            window.renderPayQrCanvas(canvas, addr, selectedChain, '#B91C1C');
          }
          startCountdown();
          if (payModal) payModal.classList.add('open');
        }, 800);
      }, 1200);
    });
  }
})();
