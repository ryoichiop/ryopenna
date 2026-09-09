/* ryopenna.com
   Uma substância (partículas), organizações diferentes por página.
   Cores lidas dos tokens CSS: o mesmo motor serve os temas claro e escuro. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var doc = document.documentElement;

  /* ---------- menu mobile: construído a partir da própria nav ---------- */
  (function () {
    var inner = document.querySelector('.nav-inner');
    if (!inner) return;
    var links = Array.prototype.filter.call(
      inner.querySelectorAll('.nav-side a:not(.cta)'),
      function (a) { return !a.closest('.lang'); }
    );
    if (!links.length) return;
    var langLink = inner.querySelector('.lang-menu a');
    var cta = inner.querySelector('.nav-side .cta');
    var btn = document.createElement('button');
    btn.className = 'nav-burger';
    btn.setAttribute('aria-label', 'Menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span></span><span></span><span></span>';
    var panel = document.createElement('div');
    panel.className = 'mnav';
    var list = document.createElement('nav');
    list.className = 'mnav-links';
    links.forEach(function (a, i) {
      var c = a.cloneNode(true);
      c.style.setProperty('--mi', i);
      list.appendChild(c);
    });
    if (langLink) {
      var l = langLink.cloneNode(true);
      l.className = 'mnav-lang';
      l.style.setProperty('--mi', links.length);
      list.appendChild(l);
    }
    if (cta) {
      var k = cta.cloneNode(true);
      k.className = 'cta mnav-cta';
      k.style.setProperty('--mi', links.length + 1);
      list.appendChild(k);
    }
    panel.appendChild(list);
    inner.appendChild(btn);
    document.body.appendChild(panel);
    btn.addEventListener('click', function () {
      var open = doc.classList.toggle('mnav-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        doc.classList.remove('mnav-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  })();

  function splitWords(el, cls) {
    var count = 0;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span');
            s.className = cls;
            s.textContent = part;
            s.style.setProperty('--wi', count++);
            frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) walk(child);
      });
    }
    walk(el);
    return count;
  }

  if (reduce) return;

  doc.classList.add('js');

  var speech = document.querySelector('[data-speech]');
  if (speech) {
    speech.classList.add('speech');
    var n = splitWords(speech, 'wd');
    var scope = speech.closest('.inner') || speech.closest('.hero-copy') || speech.parentNode;
    scope.style.setProperty('--speech-end', ((n * 70 + 850) / 1000) + 's');
  }

  /* índice por filho: o CSS usa --i para escalonar as revelações */
  document.querySelectorAll('.rv-stagger').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--i', i); });
  });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
    document.querySelectorAll('.rv, .rv-stagger').forEach(function (el) { io.observe(el); });
    window.addEventListener('load', function () {
      document.querySelectorAll('.rv, .rv-stagger').forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in');
      });
    });
  }

  if (finePointer) {
    document.querySelectorAll('.cta').forEach(function (btn) {
      btn.addEventListener('pointerenter', function (e) {
        var r = btn.getBoundingClientRect();
        btn.style.setProperty('--x', ((e.clientX - r.left) / r.width * 100) + '%');
        btn.style.setProperty('--y', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });

    /* flowing menu: a faixa entra pela borda em que o cursor entrou e sai pela que ele saiu */
    document.querySelectorAll('.fm-item').forEach(function (item) {
      var mq = item.querySelector('.fm-marquee');
      if (!mq) return;
      function edgeY(e) {
        var r = item.getBoundingClientRect();
        return (e.clientY - r.top) < r.height / 2 ? -101 : 101;
      }
      item.addEventListener('pointerenter', function (e) {
        mq.style.transition = 'none';
        mq.style.transform = 'translateY(' + edgeY(e) + '%)';
        void mq.offsetHeight;
        mq.style.transition = 'transform .5s cubic-bezier(.23,1,.32,1)';
        mq.style.transform = 'translateY(0)';
      });
      item.addEventListener('pointerleave', function (e) {
        mq.style.transform = 'translateY(' + edgeY(e) + '%)';
      });
    });
  }

  /* cores dos padrões vindas dos tokens do tema */
  function tokenRGB(name, fallback) {
    var v = getComputedStyle(doc).getPropertyValue(name).trim();
    var m = v.match(/^#([0-9a-f]{6})$/i);
    if (m) {
      var h = m[1];
      return parseInt(h.slice(0, 2), 16) + ',' + parseInt(h.slice(2, 4), 16) + ',' + parseInt(h.slice(4, 6), 16);
    }
    var r = v.match(/rgba?\(([^)]+)\)/);
    if (r) return r[1].split(',').slice(0, 3).map(function (s) { return s.trim(); }).join(',');
    return fallback;
  }
  var ACC = tokenRGB('--teal', '45,212,191');
  var INKTXT = tokenRGB('--bone', '242,240,236');

  /* ---------- os padrões ---------- */
  /* sprite de luz: um radial pré-renderizado, desenhado em composição aditiva */
  var spriteCache = {};
  function glowSprite(rgb) {
    if (spriteCache[rgb]) return spriteCache[rgb];
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(' + rgb + ',1)');
    grad.addColorStop(0.25, 'rgba(' + rgb + ',.55)');
    grad.addColorStop(0.6, 'rgba(' + rgb + ',.12)');
    grad.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    spriteCache[rgb] = c;
    return c;
  }
  function ease01(x) { return x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x); }
  function outCubic(x) { return 1 - Math.pow(1 - x, 3); }

  function fractal(canvas) {
    var kind = canvas.getAttribute('data-kind');
    var isStatic = canvas.hasAttribute('data-static');
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(devicePixelRatio || 1, 1.5);
    var W, H, t = Math.random() * 100, running = true, hot = 0;
    if (kind === 'braid' || kind === 'tree' || kind === 'dialog') t = 0;

    function size() {
      var r = canvas.getBoundingClientRect();
      W = canvas.width = r.width * dpr;
      H = canvas.height = r.height * dpr;
    }
    size();
    window.addEventListener('resize', size);

    var spA = glowSprite(ACC), spB = glowSprite(INKTXT);

    /* rede de pares (home): posições orgânicas fixas, ninguém no centro */
    var nodes = [], edges = [];
    if (kind === 'radial') {
      var seeds = [
        [0.16, 0.30], [0.38, 0.18], [0.66, 0.22], [0.86, 0.34],
        [0.24, 0.62], [0.48, 0.50], [0.72, 0.60],
        [0.36, 0.84], [0.62, 0.82]
      ];
      seeds.forEach(function (s) { nodes.push({ x: s[0], y: s[1] }); });
      nodes.forEach(function (a, i) {
        var ds = nodes.map(function (b, j) {
          if (i === j) return null;
          var dx = a.x - b.x, dy = a.y - b.y;
          return { j: j, d: dx * dx + dy * dy };
        }).filter(Boolean).sort(function (p, q) { return p.d - q.d; });
        [ds[0].j, ds[1].j].forEach(function (j) {
          var key = i < j ? i + '-' + j : j + '-' + i;
          if (!edges.some(function (e) { return e.key === key; })) {
            edges.push({ key: key, a: i, b: j, ph: Math.random() * Math.PI * 2 });
          }
        });
      });
    }

    /* a corrente: vozes em redemoinhos próprios que passam a fluir num curso só */
    var flock = [], EDD = [[0.20, 0.26], [0.78, 0.20], [0.24, 0.74], [0.76, 0.78], [0.50, 0.48]];
    if (kind === 'braid') {
      for (var fi = 0; fi < 110; fi++) {
        flock.push({
          ed: fi % 5,
          u: (fi * 0.6180339887) % 1,
          lane: ((fi * 7) % 11 - 5) / 5,
          oa: Math.random() * 6.2832,
          os: (0.5 + Math.random() * 0.7) * (fi % 2 ? 1 : -1),
          orad: 0.045 + Math.random() * 0.075,
          spd: 0.05 + Math.random() * 0.035,
          ph: Math.random() * 6.2832,
          sz: (fi % 3 === 0 ? 5.5 : 3.2) + Math.random() * 1.6
        });
      }
    }

    /* a ondulação: um ponto acende e o crescimento atravessa o círculo de pessoas */
    var cnodes = [], corigins = [], ccycle = 9, cseedIx = 0;
    if (kind === 'tree') {
      var rings = [[0.15, 6], [0.28, 9], [0.41, 12]];
      rings.forEach(function (rg, ri) {
        for (var k = 0; k < rg[1]; k++) {
          var a = (k / rg[1]) * 6.2832 + ri * 0.6 + Math.sin(ri * 9 + k * 17) * 0.12;
          var rr = rg[0] * (1 + Math.sin(k * 23.7 + ri) * 0.09);
          cnodes.push({ x: 0.5 + Math.cos(a) * rr, y: 0.5 + Math.sin(a) * rr * 0.96, ph: Math.random() * 6.2832, dist: 0 });
        }
      });
      corigins = [2, 14, 8, 21];
      function setOrigin(ix) {
        var o = cnodes[ix];
        cnodes.forEach(function (n) {
          n.dist = Math.sqrt((n.x - o.x) * (n.x - o.x) + (n.y - o.y) * (n.y - o.y));
        });
        canvas._omax = Math.max.apply(null, cnodes.map(function (n) { return n.dist; }));
        canvas._ox = o.x; canvas._oy = o.y;
      }
      canvas._setOrigin = setOrigin;
      setOrigin(corigins[0]);
    }

    /* a troca: escuta que vai e volta, e o entendimento acumula */
    var TH = 60;
    function packet(tt) {
      var c = tt % 7;
      if (c < 2.2) return { dir: 1, p: outCubic(c / 2.2), amp: 1, on: true, arriving: c > 1.9 ? (c - 1.9) / 0.3 : 0 };
      if (c < 3.0) return { dir: 1, p: 1, amp: 0, on: false, bloom: (c - 2.2) / 0.8 };
      if (c < 5.4) return { dir: -1, p: outCubic((c - 3.0) / 2.4), amp: 0.8, on: true, arriving: c > 5.1 ? (c - 5.1) / 0.3 : 0 };
      if (c < 6.2) return { dir: -1, p: 1, amp: 0, on: false, bloom: (c - 5.4) / 0.8 };
      return { dir: -1, p: 1, amp: 0, on: false };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var amp = 1 + hot * 0.9;
      if (kind === 'grid') {
        var cols = 14, rows = 8;
        var gxx = W / (cols + 1), gyy = H / (rows + 1);
        for (var c = 1; c <= cols; c++) {
          var h = (Math.sin(c * 1.7 + t * 0.8) + Math.sin(c * 0.6 + t * 0.35)) / 2;
          var lit = Math.round((h * 0.5 + 0.5) * rows * amp);
          for (var r = 1; r <= rows; r++) {
            var on = (rows - r) < lit;
            ctx.beginPath();
            ctx.arc(c * gxx, r * gyy, (on ? 2.1 : 1.1) * dpr, 0, 6.2832);
            ctx.fillStyle = on ? 'rgba(' + ACC + ',' + (0.35 + 0.5 * (1 - r / rows)) + ')' : 'rgba(' + INKTXT + ',.14)';
            ctx.fill();
          }
        }
      } else if (kind === 'flow') {
        for (var l = 0; l < 3; l++) {
          var yBase = H * (0.36 + l * 0.14);
          var count = 60;
          for (var i2 = 0; i2 <= count; i2++) {
            var x = (i2 / count) * W;
            var y = yBase +
              Math.sin(i2 * 0.28 + t * (1.1 + l * 0.25)) * H * 0.09 * amp +
              Math.sin(i2 * 0.11 - t * 0.7) * H * 0.05 * amp;
            ctx.beginPath();
            ctx.arc(x, y, (l === 1 ? 1.9 : 1.2) * dpr, 0, 6.2832);
            ctx.fillStyle = l === 1 ? 'rgba(' + ACC + ',.75)' : 'rgba(' + INKTXT + ',.3)';
            ctx.fill();
          }
        }
      } else if (kind === 'braid') {
        /* redemoinhos separados que passam a correr num curso só, e voltam */
        var P = ease01(0.5 + 0.85 * Math.sin(t * 0.30));
        ctx.globalCompositeOperation = 'lighter';
        function streamXY(u, lane) {
          var x = (0.04 + u * 0.92) * W;
          var env = Math.sin(u * 3.1416);
          var y = (0.5 + Math.sin(u * 5.2 + t * 1.6) * 0.11 * env) * H + lane * 9 * dpr * env;
          return [x, y];
        }
        /* leito do rio: linha guia quase invisível */
        ctx.beginPath();
        for (var g5 = 0; g5 <= 40; g5++) {
          var gu = g5 / 40;
          var gp2 = streamXY(gu, 0);
          if (g5 === 0) ctx.moveTo(gp2[0], gp2[1]); else ctx.lineTo(gp2[0], gp2[1]);
        }
        ctx.strokeStyle = 'rgba(' + ACC + ',' + (0.10 * P) + ')';
        ctx.lineWidth = 1 * dpr;
        ctx.stroke();
        for (var i = 0; i < flock.length; i++) {
          var p = flock[i];
          var ec = EDD[p.ed];
          var ang = p.oa + t * p.os;
          var wob2 = 1 + 0.18 * Math.sin(t * 0.9 + p.ed * 2.2);
          var fx = (ec[0] + Math.sin(t * 0.22 + p.ed) * 0.015) * W + Math.cos(ang) * p.orad * wob2 * W;
          var fy = (ec[1] + Math.cos(t * 0.19 + p.ed * 1.7) * 0.015) * H + Math.sin(ang) * p.orad * wob2 * H;
          var su = (p.u + t * p.spd) % 1;
          var sp2 = streamXY(su, p.lane);
          var e = ease01(P * 1.4 - su * 0.4);
          var x4 = fx + (sp2[0] - fx) * e;
          var y4 = fy + (sp2[1] - fy) * e;
          /* rastro: um passo atrás no próprio caminho */
          var suB = (p.u + (t - 0.09) * p.spd) % 1;
          var angB = p.oa + (t - 0.09) * p.os;
          var fxB = (ec[0] + Math.sin((t - 0.09) * 0.22 + p.ed) * 0.015) * W + Math.cos(angB) * p.orad * wob2 * W;
          var fyB = (ec[1] + Math.cos((t - 0.09) * 0.19 + p.ed * 1.7) * 0.015) * H + Math.sin(angB) * p.orad * wob2 * H;
          var spB2 = streamXY(suB, p.lane);
          var xB = fxB + (spB2[0] - fxB) * e, yB = fyB + (spB2[1] - fyB) * e;
          var lead = e > 0.6;
          ctx.strokeStyle = 'rgba(' + (lead ? ACC : INKTXT) + ',' + (0.10 + 0.3 * e) + ')';
          ctx.lineWidth = 1.1 * dpr;
          ctx.beginPath(); ctx.moveTo(xB, yB); ctx.lineTo(x4, y4); ctx.stroke();
          var sz = p.sz * dpr * (0.85 + e * 0.5) * (1 + hot * 0.25);
          ctx.globalAlpha = 0.20 + 0.45 * e + 0.10 * Math.sin(t * 3 + p.ph);
          ctx.drawImage(lead ? spA : spB, x4 - sz, y4 - sz, sz * 2, sz * 2);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      } else if (kind === 'tree') {
        /* uma pessoa acende e a frente de luz atravessa o círculo */
        var cyc = t % ccycle;
        if (cyc < 0.05 && t > 1 && !canvas._reseeded) {
          canvas._reseeded = true;
          cseedIx = (cseedIx + 1) % corigins.length;
          canvas._setOrigin(corigins[cseedIx]);
        }
        if (cyc > 1) canvas._reseeded = false;
        var fadeAll = cyc > ccycle - 1.3 ? ease01((ccycle - cyc) / 1.3) : 1;
        var front = outCubic(Math.min(1, Math.max(0, (cyc - 0.5) / 5.5))) * (canvas._omax + 0.06);
        ctx.globalCompositeOperation = 'lighter';
        /* a própria frente de onda, partindo de quem começou */
        if (cyc > 0.5 && front < canvas._omax + 0.05) {
          ctx.strokeStyle = 'rgba(' + ACC + ',' + (0.22 * fadeAll) + ')';
          ctx.lineWidth = 1.2 * dpr;
          ctx.beginPath();
          ctx.arc(canvas._ox * W, canvas._oy * H, front * Math.min(W, H), 0, 6.2832);
          ctx.stroke();
        }
        cnodes.forEach(function (n, ni2) {
          var x = n.x * W, y = n.y * H;
          var breath = 1 + 0.10 * Math.sin(t * 1.4 + n.ph);
          var lit = ease01((front - n.dist) / 0.05);
          var base = 3.2 * dpr;
          ctx.globalAlpha = 0.30 * fadeAll;
          ctx.drawImage(spB, x - base * 2, y - base * 2, base * 4, base * 4);
          if (lit > 0) {
            var justLit = lit < 1;
            var bloom = justLit ? 0.6 + outCubic(lit) * 1.3 : 1.25;
            var sz = 8 * dpr * bloom * breath * (1 + hot * 0.3);
            ctx.globalAlpha = (0.4 + 0.5 * lit) * fadeAll;
            ctx.drawImage(spA, x - sz, y - sz, sz * 2, sz * 2);
            if (justLit) {
              ctx.strokeStyle = 'rgba(' + ACC + ',' + ((1 - lit) * 0.5 * fadeAll) + ')';
              ctx.lineWidth = 1.1 * dpr;
              ctx.beginPath(); ctx.arc(x, y, (6 + lit * 22) * dpr, 0, 6.2832); ctx.stroke();
            }
          }
        });
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      } else if (kind === 'dialog') {
        /* dois pontos próximos: a mensagem vai, floresce, volta, e o entendimento acumula */
        var ax = W * 0.24, bx = W * 0.76, cy = H * 0.5;
        var pk = packet(t);
        var cycN = Math.floor(t / 7) % 3 + 1;
        var ctr = pk.dir === 1 ? pk.p : 1 - pk.p;
        ctx.globalCompositeOperation = 'lighter';
        function threadY(u) {
          return cy + Math.sin(u * 3.1416) * H * 0.045 + Math.sin(u * 6.28 + t * 0.8) * H * 0.006;
        }
        ctx.beginPath();
        for (var s5 = 0; s5 <= TH; s5++) {
          var u = s5 / TH;
          var x5 = ax + (bx - ax) * u;
          var g = Math.exp(-Math.pow((u - ctr) / 0.11, 2));
          var y5 = threadY(u) + (pk.on ? Math.sin((u - ctr) * 9 - t * 3.2 * pk.dir) * g * H * 0.14 * pk.amp : 0);
          if (s5 === 0) ctx.moveTo(x5, y5); else ctx.lineTo(x5, y5);
        }
        ctx.strokeStyle = 'rgba(' + INKTXT + ',.22)';
        ctx.lineWidth = 1 * dpr;
        ctx.stroke();
        if (pk.on) {
          for (var tr = 0; tr < 10; tr++) {
            var uu = ctr - pk.dir * tr * 0.022;
            if (uu < 0 || uu > 1) continue;
            var xt = ax + (bx - ax) * uu;
            var gt = Math.exp(-Math.pow((uu - ctr) / 0.11, 2));
            var yt = threadY(uu) + Math.sin((uu - ctr) * 9 - t * 3.2 * pk.dir) * gt * H * 0.14 * pk.amp;
            var szt = (10 - tr) * 1.6 * dpr * (1 + hot * 0.3);
            ctx.globalAlpha = (1 - tr / 10) * 0.9;
            ctx.drawImage(spA, xt - szt, yt - szt, szt * 2, szt * 2);
          }
          ctx.globalAlpha = 1;
        }
        [[ax, -1], [bx, 1]].forEach(function (nd, ix) {
          var breath = 1 + 0.09 * Math.sin(t * 0.85 + ix * 3.1);
          var isReceiver = (pk.dir === 1 && ix === 1) || (pk.dir === -1 && ix === 0);
          var bloom = 1;
          if (pk.bloom !== undefined && isReceiver) bloom = 1 + Math.sin(Math.min(1, pk.bloom) * 3.1416) * 0.8;
          if (pk.arriving && isReceiver) bloom = 1 + pk.arriving * 0.4;
          var sz = 15 * dpr * breath * bloom * (1 + hot * 0.25);
          ctx.globalAlpha = 0.95;
          ctx.drawImage(isReceiver && bloom > 1.15 ? spA : spB, nd[0] - sz, cy - sz, sz * 2, sz * 2);
          /* memória da conversa: cada ciclo deixa um anel de entendimento */
          for (var m = 0; m < cycN; m++) {
            var mr = (26 + m * 10) * dpr * (1 + 0.02 * Math.sin(t * 1.2 + m));
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(' + ACC + ',' + (0.10 + 0.05 * Math.sin(t * 1.5 + m * 2)) + ')';
            ctx.lineWidth = 1 * dpr;
            ctx.beginPath(); ctx.arc(nd[0], cy, mr, 0, 6.2832); ctx.stroke();
          }
          /* aura: três satélites em órbita lenta */
          for (var sa = 0; sa < 3; sa++) {
            var oa2 = t * (0.5 + sa * 0.13) * (ix ? -1 : 1) + sa * 2.1 + ix * 1.4;
            var orx = (24 + sa * 8) * dpr, ory = (17 + sa * 6) * dpr;
            var sx2 = nd[0] + Math.cos(oa2) * orx, sy2 = cy + Math.sin(oa2) * ory;
            var ss = (2.4 - sa * 0.5) * dpr;
            ctx.globalAlpha = 0.4 - sa * 0.09;
            ctx.drawImage(spB, sx2 - ss, sy2 - ss, ss * 2, ss * 2);
          }
          if (pk.bloom !== undefined && isReceiver && pk.bloom < 1) {
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(' + ACC + ',' + ((1 - pk.bloom) * 0.55) + ')';
            ctx.lineWidth = 1.3 * dpr;
            ctx.beginPath(); ctx.arc(nd[0], cy, (14 + pk.bloom * 52) * dpr, 0, 6.2832); ctx.stroke();
          }
        });
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      } else {
        var pos = nodes.map(function (nd, idx) {
          return {
            x: (nd.x + Math.sin(t * 0.5 + idx * 2.1) * 0.012) * W,
            y: (nd.y + Math.cos(t * 0.45 + idx * 1.7) * 0.012) * H
          };
        });
        edges.forEach(function (e) {
          var pulse = (Math.sin(t * 1.1 + e.ph) + 1) / 2;
          ctx.beginPath();
          ctx.moveTo(pos[e.a].x, pos[e.a].y);
          ctx.lineTo(pos[e.b].x, pos[e.b].y);
          ctx.strokeStyle = 'rgba(' + ACC + ',' + (0.06 + pulse * 0.3 * amp) + ')';
          ctx.lineWidth = (0.8 + pulse * 0.8) * dpr;
          ctx.stroke();
        });
        pos.forEach(function (p) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4.6 * dpr, 0, 6.2832);
          ctx.fillStyle = 'rgba(' + INKTXT + ',.75)';
          ctx.fill();
        });
      }
    }

    if (isStatic) { t = 2.4; draw(); return; }

    function frame() {
      if (!running) return;
      t += 0.016;
      hot += ((canvas.matches(':hover') ? 1 : 0) - hot) * 0.06;
      draw();
      requestAnimationFrame(frame);
    }
    var vis = new IntersectionObserver(function (en) {
      var was = running;
      running = en[0].isIntersecting;
      if (running && !was) requestAnimationFrame(frame);
    });
    vis.observe(canvas);
    requestAnimationFrame(frame);
  }
  document.querySelectorAll('canvas.fractal').forEach(fractal);
})();

/* vídeo: fachada leve, iframe só ao tocar (usado onde houver .video-facade) */
(function () {
  document.querySelectorAll('.video-slot').forEach(function (slot) {
    var btn = slot.querySelector('.video-facade');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + slot.getAttribute('data-video') + '?autoplay=1&rel=0';
      iframe.title = slot.getAttribute('data-title') || 'Video';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      btn.replaceWith(iframe);
    });
  });
})();

/* depoimentos: spotlight + inclinação 3D seguindo o cursor */
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.qcard').forEach(function (card) {
    var rx = 0, ry = 0, tx = 0, ty = 0, raf = null;
    function loop() {
      rx += (tx - rx) * 0.12;
      ry += (ty - ry) * 0.12;
      card.style.transform = 'perspective(900px) rotateX(' + ry.toFixed(3) + 'deg) rotateY(' + rx.toFixed(3) + 'deg)' + (Math.abs(tx) + Math.abs(ty) > 0.01 ? ' translateY(-4px)' : '');
      if (Math.abs(tx - rx) + Math.abs(ty - ry) > 0.01 || Math.abs(tx) + Math.abs(ty) > 0.01) {
        raf = requestAnimationFrame(loop);
      } else {
        card.style.transform = '';
        card.style.transition = '';
        raf = null;
      }
    }
    card.addEventListener('pointermove', function (e) {
      card.style.transition = 'border-color .3s ease, box-shadow .3s ease';
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--gx', (px * 100) + '%');
      card.style.setProperty('--gy', (py * 100) + '%');
      tx = (px - 0.5) * 7;
      ty = -(py - 0.5) * 6;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    card.addEventListener('pointerleave', function () {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    });
  });
})();

/* hero: o vídeo de fundo é exclusivo do desktop.
   No mobile ele nem é baixado, o que poupa 13MB de dados. */
(function () {
  var v = document.querySelector('video.hero-bg');
  if (!v) return;
  var wide = window.matchMedia('(min-width: 861px)').matches;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!wide || still) {
    v.removeAttribute('poster');
    v.remove();
    document.documentElement.classList.add('hero-still');
    return;
  }
  var src = v.querySelector('source[data-src]');
  if (src) {
    src.src = src.getAttribute('data-src');
    v.load();
  }
})();
