
(function () {
  var sq = (document.documentElement.lang || "").indexOf("sq") === 0;
  var T = sq
    ? { saved: "Pamje paraprake: ndryshimet nuk ruhen këtu.", missing: "Kjo faqe nuk përfshihet në pamjen paraprake.", day: "Në faqen e vërtetë, kjo ngarkon oraret e lira të asaj dite." }
    : { saved: "Preview only: changes aren't saved here.", missing: "This page isn't part of the preview.", day: "On the live site this loads that day's free times." };
  var toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.setAttribute("role", "status");
      toastEl.style.cssText = "position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:9999;background:#382a35;color:#fff;font:500 14px/1.4 var(--font-sans,system-ui);padding:10px 16px;border-radius:999px;box-shadow:0 6px 24px rgba(56,42,53,.25);max-width:calc(100% - 32px);text-align:center";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.style.opacity = "1";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.style.opacity = "0"; }, 2600);
  }
  function swap(el, off, on, state) {
    off.split(" ").forEach(function (c) { if (c) el.classList.toggle(c, !state); });
    on.split(" ").forEach(function (c) { if (c) el.classList.toggle(c, state); });
  }

  document.addEventListener("click", function (e) {
    var go = e.target.closest("[data-preview-href]");
    if (go) { e.preventDefault(); e.stopPropagation(); location.href = go.getAttribute("data-preview-href"); return; }
    var miss = e.target.closest("[data-preview-missing]");
    if (miss) { e.preventDefault(); toast(T.missing); return; }

    var menuBtn = e.target.closest('[aria-controls="mobile-menu"]');
    if (menuBtn) {
      var menu = document.getElementById("mobile-menu");
      var open = menuBtn.getAttribute("aria-expanded") !== "true";
      var hdr = document.querySelector("header.sticky");
      if (open && hdr) menu.style.top = hdr.getBoundingClientRect().bottom + "px";
      menuBtn.setAttribute("aria-expanded", String(open));
      menu.hidden = !open;
      document.body.style.overflow = open ? "hidden" : "";
      var bars = menuBtn.querySelectorAll("span span");
      if (bars[0]) swap(bars[0], "top-0", "top-1.5 rotate-45", open);
      if (bars[1]) swap(bars[1], "top-3 w-4", "top-1.5 w-6 -rotate-45", open);
      return;
    }

    var acc = e.target.closest("button[aria-controls][aria-expanded]");
    if (acc) {
      var root = acc.closest("div.border-t") || document;
      var wasOpen = acc.getAttribute("aria-expanded") === "true";
      root.querySelectorAll("button[aria-controls][aria-expanded]").forEach(function (b) {
        var panel = document.getElementById(b.getAttribute("aria-controls"));
        var on = b === acc ? !wasOpen : false;
        b.setAttribute("aria-expanded", String(on));
        if (panel) { swap(panel, "grid-rows-[0fr]", "grid-rows-[1fr]", on); if (on) panel.removeAttribute("inert"); else panel.setAttribute("inert", ""); }
        var vbar = b.querySelector("span[aria-hidden] span:last-child");
        if (vbar) vbar.classList.toggle("scale-y-0", on);
      });
      return;
    }

    var slot = e.target.closest("label:has(input[name=slot])");
    if (slot) {
      e.preventDefault();
      document.querySelectorAll("label:has(input[name=slot])").forEach(function (l) {
        swap(l, "border-line-strong bg-white text-plum hover:border-plum", "border-plum bg-plum text-white", l === slot);
      });
      return;
    }
    var day = e.target.closest('table[role=grid] button[aria-disabled="false"]');
    if (day) { toast(T.day); return; }
  }, true);

  document.addEventListener("submit", function (e) { e.preventDefault(); toast(T.saved); }, true);
  document.addEventListener("keydown", function (e) {
    var btn = document.querySelector('[aria-controls="mobile-menu"][aria-expanded="true"]');
    if (e.key === "Escape" && btn) { btn.click(); btn.focus(); }
  });

  // Transparent tooth animation: same technique as the site's HeroTooth component.
  (function hero() {
    var video = document.querySelector("video");
    var canvas = video && video.parentElement.querySelector("canvas");
    var poster = video && video.parentElement.querySelector("img");
    if (!video || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return;
    function sh(type, src) { var x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); return x; }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, "attribute vec2 p;varying vec2 v;void main(){v=vec2((p.x+1.0)*0.5,(1.0-p.y)*0.5);gl_Position=vec4(p,0.0,1.0);}"));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, "precision mediump float;varying vec2 v;uniform sampler2D t;void main(){vec3 c=texture2D(t,vec2(v.x,v.y*0.5)).rgb;float a=texture2D(t,vec2(v.x,0.5+v.y*0.5)).r;a=smoothstep(0.03,0.97,a);gl_FragColor=vec4(c*a,a);}"));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(function (k) { gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE); });
    [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(function (k) { gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR); });
    gl.clearColor(0, 0, 0, 0);
    video.muted = true;
    var shown = false;
    function draw() {
      if (video.readyState >= 2) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        if (!shown) {
          shown = true;
          swap(canvas, "opacity-0", "opacity-100", true);
          if (poster) swap(poster, "opacity-100", "opacity-0", true);
        }
      }
      requestAnimationFrame(draw);
    }
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) video.play().catch(function () {}); else video.pause();
    }, { threshold: 0.05 }).observe(canvas);
    requestAnimationFrame(draw);
  })();

  var header = document.querySelector("header.sticky");
  var sticky = document.querySelector("[data-preview-sticky]");
  function onScroll() {
    var y = window.scrollY;
    if (header) {
      swap(header, "border-transparent bg-ivory", "border-line bg-ivory/92 backdrop-blur-md", y > 12);
      var logo = header.querySelector("img");
      if (logo) logo.style.height = (y > 12 ? 34 : 40) + "px";
    }
    if (sticky) {
      swap(sticky, "translate-y-full", "translate-y-0", y > 520);
      if (y > 520) sticky.removeAttribute("inert"); else sticky.setAttribute("inert", "");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

"use strict";var GDI=(()=>{var x=Object.defineProperty;var H=Object.getOwnPropertyDescriptor;var q=Object.getOwnPropertyNames;var A=Object.prototype.hasOwnProperty;var S=(n,t)=>{for(var d in t)x(n,d,{get:t[d],enumerable:!0})},B=(n,t,d,g)=>{if(t&&typeof t=="object"||typeof t=="function")for(let l of q(t))!A.call(n,l)&&l!==d&&x(n,l,{get:()=>t[l],enumerable:!(g=H(t,l))||g.enumerable});return n};var C=n=>B(x({},"__esModule",{value:!0}),n);var I={};S(I,{initInteractions:()=>R});function R(n=document){let t=n.defaultView,d=t.matchMedia("(prefers-reduced-motion: reduce)").matches,g=t.matchMedia("(hover: hover) and (pointer: fine)").matches,l=[];if(!d&&"IntersectionObserver"in t){let e=new Set,o=r=>{r.classList.add("is-in"),e.delete(r),a.unobserve(r)},a=new IntersectionObserver(r=>{for(let c of r)c.isIntersecting&&o(c.target)},{rootMargin:"0px 0px -8% 0px",threshold:.08}),i=new WeakSet,u=()=>{let r=t.innerHeight,c=!n.documentElement.classList.contains("gd-reveal");n.querySelectorAll("[data-reveal]:not(.is-in)").forEach(v=>{if(i.has(v))return;i.add(v);let F=v.getBoundingClientRect();c&&F.top<r?v.classList.add("is-in"):(e.add(v),a.observe(v))})};u(),n.documentElement.classList.add("gd-reveal");let m=!1,h=()=>{m||(m=!0,t.requestAnimationFrame(()=>{m=!1;for(let r of e)r.getBoundingClientRect().top<0&&o(r)}))};t.addEventListener("scroll",h,{passive:!0});let s=!1,f=new MutationObserver(()=>{s||(s=!0,t.requestAnimationFrame(()=>{s=!1,u()}))});f.observe(n.body,{childList:!0,subtree:!0}),l.push(()=>{a.disconnect(),f.disconnect(),t.removeEventListener("scroll",h)})}if(d||!g)return()=>l.forEach(e=>e());let p=null,y=null,E=0,L=null,P=()=>{p&&(p.classList.remove("is-tilting"),p.style.setProperty("--rx","0deg"),p.style.setProperty("--ry","0deg"),p=null)},M=()=>{y&&(y.querySelectorAll("[data-depth]").forEach(e=>{e.style.setProperty("--px","0"),e.style.setProperty("--py","0")}),y=null)},T=()=>{var m,h;E=0;let e=L;if(!e)return;let o=e.target instanceof Element?e.target:null,a=o==null?void 0:o.closest("[data-spotlight]");if(a){let s=a.getBoundingClientRect();a.style.setProperty("--mx",`${e.clientX-s.left}px`),a.style.setProperty("--my",`${e.clientY-s.top}px`)}let i=(m=o==null?void 0:o.closest("[data-tilt]"))!=null?m:null;if(i!==p&&P(),i){p=i;let s=i.getBoundingClientRect(),f=(e.clientX-s.left)/s.width-.5,r=(e.clientY-s.top)/s.height-.5,c=Number(i.dataset.tilt)||6;i.classList.add("is-tilting"),i.style.setProperty("--rx",`${(-r*c).toFixed(2)}deg`),i.style.setProperty("--ry",`${(f*c).toFixed(2)}deg`)}let u=(h=o==null?void 0:o.closest("[data-parallax]"))!=null?h:null;if(u!==y&&M(),u){y=u;let s=u.getBoundingClientRect(),f=((e.clientX-s.left)/s.width-.5)*2,r=((e.clientY-s.top)/s.height-.5)*2;u.querySelectorAll("[data-depth]").forEach(c=>{c.style.setProperty("--px",f.toFixed(3)),c.style.setProperty("--py",r.toFixed(3))})}},b=e=>{e.pointerType==="mouse"&&(L=e,E||(E=t.requestAnimationFrame(T)))},w=()=>{P(),M()};return n.addEventListener("pointermove",b,{passive:!0}),n.documentElement.addEventListener("pointerleave",w),l.push(()=>{n.removeEventListener("pointermove",b),n.documentElement.removeEventListener("pointerleave",w),E&&t.cancelAnimationFrame(E)}),()=>l.forEach(e=>e())}return C(I);})();

// Static-preview versions of the gallery components (the live site uses React).
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var sq = (document.documentElement.lang || "").indexOf("sq") === 0 || !!document.querySelector('[lang="sq-AL"]');
  var L = sq
    ? { before: "Para", after: "Pas", hint: "Tërhiqni për të krahasuar", close: "Mbyll", prev: "I mëparshmi", next: "I radhës", of: "nga", viewer: "Shikuesi i fotografive", compare: "Krahasim para dhe pas: ", full: "Shikoni në ekran të plotë", results: "rezultate" }
    : { before: "Before", after: "After", hint: "Drag to compare", close: "Close", prev: "Previous", next: "Next", of: "of", viewer: "Photo viewer", compare: "Before and after comparison: ", full: "View full screen", results: "results" };

  function svg(d, cls) {
    return '<svg viewBox="0 0 24 24" class="' + (cls || "h-5 w-5") + '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>';
  }
  function esc(s) {
    return String(s || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function toggle_fn(el, off, on, state) { return toggle(el, off, on, state); }
  function toggle(el, off, on, state) {
    off.split(" ").forEach(function (c) { if (c) el.classList.toggle(c, !state); });
    on.split(" ").forEach(function (c) { if (c) el.classList.toggle(c, state); });
  }
  function restart(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }
  var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  // ── Drag-to-compare ──────────────────────────────────────
  function setupCompare(wrap, opts) {
    var cmp = wrap && wrap.querySelector(".compare");
    if (!cmp || wrap._gd) return wrap && wrap._gd;
    var input = wrap.querySelector("input[type=range]");
    var bl = cmp.querySelector("span.left-3"), al = cmp.querySelector("span.right-3");
    var hint = cmp.querySelector(".compare-hint");
    var pos = 50, dragging = false, anim = 0, interacted = false;
    function set(p) {
      pos = Math.max(0, Math.min(100, p));
      cmp.style.setProperty("--pos", pos + "%");
      if (bl) toggle(bl, "opacity-100", "opacity-0", pos < 14);
      if (al) toggle(al, "opacity-100", "opacity-0", pos > 86);
      if (input) input.value = String(Math.round(pos));
    }
    function stop() {
      interacted = true;
      if (anim) cancelAnimationFrame(anim);
      anim = 0;
      if (hint && hint.parentElement) hint.parentElement.remove();
    }
    function fromX(x) {
      var r = wrap.getBoundingClientRect();
      if (r.width) set(((x - r.left) / r.width) * 100);
    }
    wrap.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      stop();
      dragging = true;
      cmp.classList.add("is-dragging");
      try { wrap.setPointerCapture(e.pointerId); } catch (_) {}
      if (e.pointerType === "mouse") fromX(e.clientX);
    });
    wrap.addEventListener("pointermove", function (e) {
      if (dragging || (opts.follow && e.pointerType === "mouse")) {
        if (!dragging) stop();
        fromX(e.clientX);
      }
    });
    function end() { dragging = false; cmp.classList.remove("is-dragging"); }
    wrap.addEventListener("pointerup", end);
    wrap.addEventListener("pointercancel", end);
    wrap.addEventListener("lostpointercapture", end);
    if (input) {
      input.addEventListener("focus", stop);
      input.addEventListener("input", function () { stop(); set(Number(input.value)); });
    }
    function intro() {
      if (reduce || interacted) return;
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        io.disconnect();
        if (interacted) return;
        var keys = [50, 18, 82, 50], seg = 700, start = performance.now() + 250;
        function step(now) {
          if (interacted) return;
          var t = Math.max(0, now - start);
          var i = Math.min(keys.length - 2, Math.floor(t / seg));
          var local = Math.min(1, (t - i * seg) / seg);
          set(keys[i] + (keys[i + 1] - keys[i]) * ease(local));
          if (t < seg * (keys.length - 1)) anim = requestAnimationFrame(step); else anim = 0;
        }
        anim = requestAnimationFrame(step);
      }, { threshold: 0.6 });
      io.observe(wrap);
    }
    if (opts.intro) intro();
    wrap._gd = {
      set: set,
      load: function (s) {
        var imgs = cmp.querySelectorAll("img");
        imgs[0].src = s.after; imgs[0].alt = s.title + " · " + L.after;
        imgs[1].src = s.before; imgs[1].alt = s.title + " · " + L.before;
        imgs[0].onload = function () { if (imgs[0].naturalWidth) cmp.style.aspectRatio = imgs[0].naturalWidth + " / " + imgs[0].naturalHeight; };
        if (input) input.setAttribute("aria-label", L.compare + s.title);
        set(50);
      },
    };
    return wrap._gd;
  }

  function compareHTML(s) {
    var img = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover';
    return (
      '<div class="group/compare relative cursor-ew-resize rounded-[var(--radius-md)]">' +
      '<div class="compare bg-plum-night relative w-full overflow-hidden rounded-[var(--radius-md)]" style="aspect-ratio:' + (s.ratio || "16 / 9") + ';--pos:50%">' +
      '<img src="' + s.after + '" alt="' + esc(s.title + " · " + L.after) + '" draggable="false" style="' + img + '">' +
      '<div class="compare-before absolute inset-0"><img src="' + s.before + '" alt="' + esc(s.title + " · " + L.before) + '" draggable="false" style="' + img + '"></div>' +
      '<div aria-hidden="true" class="compare-line pointer-events-none absolute inset-y-0 w-0"><span class="absolute inset-y-0 -left-px w-0.5 bg-white/90 shadow-[0_0_12px_rgb(0_0_0/0.35)]"></span>' +
      '<span class="compare-knob bg-plum/85 absolute top-1/2 left-0 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white text-white shadow-lg backdrop-blur-sm">' + svg("m9 6-5 6 5 6M15 6l5 6-5 6") + "</span></div>" +
      '<span aria-hidden="true" class="bg-plum-deep/80 absolute top-3 left-3 rounded-full px-3 py-1 text-xs tracking-wide text-white backdrop-blur-sm transition-opacity duration-300 opacity-100">' + L.before + "</span>" +
      '<span aria-hidden="true" class="bg-champagne text-plum-deep absolute top-3 right-3 rounded-full px-3 py-1 text-xs tracking-wide transition-opacity duration-300 opacity-100">' + L.after + "</span>" +
      "</div>" +
      '<input type="range" min="0" max="100" step="2" value="50" class="sr-only" aria-label="' + esc(L.compare + s.title) + '"></div>'
    );
  }

  // ── Full-screen viewer (native <dialog>) ─────────────────
  var dlg = null, slides = [], idx = 0, dir = 1;
  function ensureDialog() {
    if (dlg) return dlg;
    dlg = document.querySelector("dialog.viewer");
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.className = "viewer on-dark";
      document.body.appendChild(dlg);
    }
    dlg.setAttribute("aria-label", L.viewer);
    dlg.addEventListener("cancel", function (e) { e.preventDefault(); closeViewer(); });
    dlg.addEventListener("keydown", function (e) {
      if (e.target instanceof HTMLInputElement && e.target.type === "range") return;
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    });
    dlg.addEventListener("click", function (e) {
      var b = e.target.closest("[data-v]");
      if (!b) return;
      var v = b.getAttribute("data-v");
      if (v === "close") closeViewer();
      else if (v === "prev") go(-1);
      else if (v === "next") go(1);
      else { var n = Number(v); dir = n > idx ? 1 : -1; idx = n; render(); }
    });
    return dlg;
  }
  function go(d) { dir = d; idx = (idx + d + slides.length) % slides.length; render(); }
  function closeViewer() {
    if (dlg && dlg.open) dlg.close();
    document.documentElement.style.overflow = "";
  }
  function openViewer(list, i) {
    if (!list.length) return;
    slides = list; idx = i; dir = 1;
    ensureDialog();
    render();
    if (!dlg.open) dlg.showModal();
    document.documentElement.style.overflow = "hidden";
    var c = dlg.querySelector('[data-v="close"]');
    if (c) c.focus();
  }
  function render() {
    var s = slides[idx];
    var ratio = s.w && s.h ? s.w / s.h : 1.6;
    var body = s.kind === "compare" ? compareHTML(s) :
      '<div class="relative w-full overflow-hidden rounded-[var(--radius-md)]" style="aspect-ratio:' + (s.w ? s.w + " / " + s.h : "4 / 3") + '"><img src="' + s.src + '" alt="' + esc(s.alt) + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain"></div>';
    var navBtn = function (v, d, cls) { return '<button type="button" data-v="' + v + '" aria-label="' + (v === "prev" ? L.prev : L.next) + '" class="' + cls + '">' + svg(d) + "</button>"; };
    var thumbs = slides.length > 1 ? '<div class="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">' + slides.map(function (t, n) {
      return '<button type="button" data-v="' + n + '" aria-label="' + esc(t.title) + '"' + (n === idx ? ' aria-current="true"' : "") + ' class="relative h-14 w-20 shrink-0 overflow-hidden rounded-[var(--radius-sm)] transition-all duration-300 ' + (n === idx ? "ring-champagne opacity-100 ring-2" : "opacity-50 hover:opacity-90") + '"><img src="' + (t.after || t.src) + '" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></button>';
    }).join("") + "</div>" : "";
    var side = "absolute top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/20 backdrop-blur transition-colors hover:bg-white/15 sm:grid";
    dlg.innerHTML =
      '<div class="flex h-full flex-col">' +
      '<div class="flex items-center justify-between gap-4 px-4 pt-4 sm:px-6"><p class="text-mauve-light text-sm tabular-nums" aria-live="polite">' + (idx + 1) + " " + L.of + " " + slides.length + "</p>" +
      '<button type="button" data-v="close" aria-label="' + L.close + '" class="grid h-11 w-11 place-items-center rounded-full border border-white/25 transition-colors hover:bg-white/10">' + svg("M6 6l12 12M18 6 6 18") + "</button></div>" +
      '<div class="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20">' +
      '<div class="viewer-slide w-full" style="--dir:' + dir + ";width:min(100%, calc((100dvh - 15rem) * " + ratio + '))">' + body + "</div>" +
      (slides.length > 1 ? navBtn("prev", "m15 6-6 6 6 6", side + " left-2") + navBtn("next", "m9 6 6 6-6 6", side + " right-2") : "") +
      "</div>" +
      '<div class="px-4 pt-4 pb-4 sm:px-6"><div class="flex items-start justify-between gap-4"><div class="min-w-0"><p class="font-display text-xl text-white sm:text-2xl">' + esc(s.title) + "</p>" +
      (s.desc ? '<p class="text-mauve-light mt-1 text-xs sm:text-sm">' + esc(s.desc) + "</p>" : "") + "</div>" +
      (slides.length > 1 ? '<div class="flex shrink-0 gap-2 sm:hidden">' + navBtn("prev", "m15 6-6 6 6 6", "grid h-11 w-11 place-items-center rounded-full border border-white/25") + navBtn("next", "m9 6 6 6-6 6", "grid h-11 w-11 place-items-center rounded-full border border-white/25") + "</div>" : "") +
      "</div>" + thumbs + "</div></div>";
    var slideEl = dlg.querySelector(".viewer-slide");
    if (s.kind === "compare") {
      var w = slideEl.firstElementChild;
      setupCompare(w, { follow: true });
      var im = w.querySelector(".compare img");
      var fix = function () { if (im.naturalWidth) { w.querySelector(".compare").style.aspectRatio = im.naturalWidth + " / " + im.naturalHeight; slideEl.style.width = "min(100%, calc((100dvh - 15rem) * " + im.naturalWidth / im.naturalHeight + "))"; } };
      if (im.complete) fix(); else im.onload = fix;
    } else {
      var start = null;
      slideEl.addEventListener("pointerdown", function (e) { start = { x: e.clientX, y: e.clientY }; });
      slideEl.addEventListener("pointerup", function (e) {
        if (!start) return;
        var dx = e.clientX - start.x;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - start.y)) go(dx < 0 ? 1 : -1);
        start = null;
      });
    }
    var cur = dlg.querySelector('[aria-current="true"]');
    if (cur) cur.scrollIntoView({ block: "nearest", inline: "center" });
  }

  function caseFromThumb(b) {
    var imgs = b.querySelectorAll("img");
    return { kind: "compare", title: b.getAttribute("aria-label"), concern: b.getAttribute("data-concern"), after: imgs[0].getAttribute("src"), before: imgs[1].getAttribute("src") };
  }
  function chipLabel(chip) { return (chip.childNodes[0] && chip.childNodes[0].textContent || "").trim(); }

  // ── Homepage showcase ────────────────────────────────────
  (function showcase() {
    var root = document.getElementById("results");
    if (!root) return;
    var main = root.querySelector(".compare");
    if (!main) return;
    var ctl = setupCompare(main.parentElement, { intro: true });
    var thumbs = Array.prototype.slice.call(root.querySelectorAll("button[data-concern]"));
    var all = thumbs.map(caseFromThumb);
    var chips = Array.prototype.slice.call(root.querySelectorAll('[role=group] button[aria-pressed]'));
    var concernName = {};
    var filter = "all", active = 0;
    // Chips are rendered in order of each concern's first appearance.
    var order = [];
    all.forEach(function (c) { if (c.concern && order.indexOf(c.concern) < 0) order.push(c.concern); });
    chips.forEach(function (c, i) { c._concern = i === 0 ? "all" : order[i - 1]; if (i) concernName[order[i - 1]] = chipLabel(c); });
    var title = root.querySelector("h3");
    var concernP = title && title.parentElement.querySelector("p");
    var big = root.querySelector(".font-display.text-2xl.text-white");
    var mobileCount = root.querySelector("span.lg\\:hidden");
    function list() { return all.filter(function (c) { return filter === "all" || c.concern === filter; }); }
    function show(n, animate) {
      var l = list();
      active = (n + l.length) % l.length;
      var c = l[active];
      ctl.load(c);
      if (title) title.textContent = c.title;
      if (concernP) concernP.textContent = concernName[c.concern] || "";
      if (big) { big.textContent = String(active + 1).padStart(2, "0"); if (big.nextSibling) big.nextSibling.textContent = " / " + String(l.length).padStart(2, "0"); }
      if (mobileCount) mobileCount.textContent = active + 1 + " / " + l.length;
      thumbs.forEach(function (b, i) {
        var c2 = all[i];
        var vis = filter === "all" || c2.concern === filter;
        b.parentElement.style.display = vis ? "" : "none";
        var on = c2 === c;
        toggle(b, "opacity-60 hover:opacity-100", "ring-champagne ring-2 ring-offset-2 ring-offset-[var(--gd-plum-deep)]", on);
        if (on) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
      });
      if (animate) restart(main.parentElement.parentElement, "viewer-slide");
    }
    thumbs.forEach(function (b, i) {
      b.addEventListener("click", function () { var l = list(); show(l.indexOf(all[i]), true); });
    });
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        filter = c._concern;
        chips.forEach(function (x) {
          var on = x === c;
          x.setAttribute("aria-pressed", String(on));
          toggle(x, "text-mauve-light border-white/25 hover:border-white/60 hover:text-white", "bg-champagne border-champagne text-plum-deep", on);
        });
        show(0, true);
      });
    });
    root.querySelectorAll("button[aria-label]").forEach(function (b) {
      var a = b.getAttribute("aria-label");
      if (a === L.prev) b.addEventListener("click", function () { show(active - 1, true); });
      if (a === L.next) b.addEventListener("click", function () { show(active + 1, true); });
      if (a.indexOf(L.full) === 0) b.addEventListener("click", function () { openViewer(all, all.indexOf(list()[active])); });
    });
  })();

  // ── Results page ─────────────────────────────────────────
  (function resultsPage() {
    var items = Array.prototype.slice.call(document.querySelectorAll("main li[data-concern]"));
    if (!items.length) return;
    var cases = items.map(function (li) {
      var cmp = li.querySelector(".compare");
      var imgs = cmp.querySelectorAll("img");
      var h = li.querySelector("h3");
      setupCompare(cmp.parentElement, { follow: true });
      return { kind: "compare", li: li, concern: li.getAttribute("data-concern"), title: h ? h.textContent.trim() : "", after: imgs[0].getAttribute("src"), before: imgs[1].getAttribute("src") };
    });
    var photos = [];
    var smilesSec = document.getElementById("smiles-title");
    if (smilesSec) smilesSec.closest("section").querySelectorAll("figure").forEach(function (f) {
      var img = f.querySelector("img"), cap = f.querySelector("figcaption");
      photos.push({ kind: "photo", btn: f.querySelector("button"), src: img.getAttribute("src"), alt: img.getAttribute("alt"), title: cap ? cap.textContent.trim() : "" });
    });
    var gemsSec = document.getElementById("gems-title");
    if (gemsSec) gemsSec.closest("section").querySelectorAll("figure").forEach(function (f) {
      var b = f.querySelector("button"), img = f.querySelector("img"), cap = f.querySelector("figcaption span");
      photos.push({ kind: "photo", btn: b, gem: true, src: img.getAttribute("src"), alt: b.getAttribute("aria-label"), title: cap ? cap.textContent.trim() : "" });
    });
    var filter = "all";
    function slidesNow() {
      return cases.filter(function (c) { return filter === "all" || c.concern === filter; }).concat(photos);
    }
    photos.forEach(function (p) {
      var im = new Image();
      im.onload = function () { p.w = im.naturalWidth; p.h = im.naturalHeight; };
      im.src = p.src;
      p.btn.addEventListener("click", function () { var s = slidesNow(); openViewer(s, s.indexOf(p)); });
    });
    cases.forEach(function (c) {
      c.li.querySelectorAll("button").forEach(function (b) {
        b.addEventListener("click", function () { var s = slidesNow(); openViewer(s, s.indexOf(c)); });
      });
    });
    var chips = Array.prototype.slice.call(document.querySelectorAll("main [role=group] button[aria-pressed]"));
    var order = [];
    cases.forEach(function (c) { if (c.concern && order.indexOf(c.concern) < 0) order.push(c.concern); });
    var live = document.querySelector("main [role=group] [aria-live]");
    chips.forEach(function (c, i) {
      c._concern = i === 0 ? "all" : order[i - 1];
      c.addEventListener("click", function () {
        filter = c._concern;
        chips.forEach(function (x) {
          var on = x === c;
          x.setAttribute("aria-pressed", String(on));
          toggle(x, "text-plum border-line-strong hover:border-plum bg-white", "bg-plum border-plum text-white", on);
        });
        var n = 0;
        cases.forEach(function (k) { var vis = filter === "all" || k.concern === filter; k.li.style.display = vis ? "" : "none"; if (vis) n++; });
        if (live) live.textContent = live.textContent.replace(/\d+/, String(n));
      });
    });

    // Tooth-gem loupe
    document.querySelectorAll("main .loupe").forEach(function (lens) {
      var btn = lens.parentElement;
      var Z = 2.6;
      btn.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        var r = btn.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, size = lens.offsetWidth;
        lens.style.left = x + "px";
        lens.style.top = y + "px";
        lens.style.backgroundSize = r.width * Z + "px " + r.height * Z + "px";
        lens.style.backgroundPosition = -(x * Z - size / 2) + "px " + -(y * Z - size / 2) + "px";
        lens.classList.add("is-on");
      });
      btn.addEventListener("pointerleave", function () { lens.classList.remove("is-on"); });
    });
  })();


  // ── Clinic tour ──────────────────────────────────────────
  document.querySelectorAll("section[data-tour]").forEach(function (sec) {
    var slides = Array.prototype.slice.call(sec.querySelectorAll("img.tour-slide"));
    var thumbs = Array.prototype.slice.call(sec.querySelectorAll("[data-tour-thumb]"));
    if (!slides.length) return;
    var counter = sec.querySelector("[data-tour-counter]"), caption = sec.querySelector("[data-tour-caption]");
    var toggle = sec.querySelector("[data-tour-toggle]");
    var progress = sec.querySelector(".tour-progress");
    var items = thumbs.map(function (t, i) {
      return { kind: "photo", src: slides[i].getAttribute("src"), alt: t.getAttribute("aria-label"), title: t.getAttribute("aria-label") };
    });
    items.forEach(function (p) { var im = new Image(); im.onload = function () { p.w = im.naturalWidth; p.h = im.naturalHeight; }; im.src = p.src; });
    var active = 0, inView = false, hover = false, stopped = false, timer = 0;
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    function playing() { return inView && !hover && !stopped && !reduce && !(dlg && dlg.open); }
    function schedule() {
      clearTimeout(timer);
      sec.setAttribute("data-playing", playing() ? "true" : "false");
      if (progress) { var c = progress.cloneNode(true); progress.replaceWith(c); progress = c; }
      if (playing()) timer = setTimeout(function () { show(active + 1); }, 6000);
    }
    function show(n) {
      active = (n + slides.length) % slides.length;
      slides.forEach(function (im, i) { im.setAttribute("data-active", i === active ? "true" : "false"); });
      thumbs.forEach(function (t, i) {
        var on = i === active;
        toggle_(t, "opacity-70 hover:opacity-100", "ring-plum ring-2 ring-offset-2 ring-offset-[var(--gd-cream)]", on);
        if (on) { t.setAttribute("aria-current", "true"); if (progress) t.appendChild(progress); } else t.removeAttribute("aria-current");
      });
      if (counter) counter.textContent = pad(active + 1) + " / " + pad(slides.length);
      if (caption) { caption.textContent = items[active].title; restart(caption, "tour-caption"); }
      schedule();
    }
    var toggle_ = toggle_fn;
    thumbs.forEach(function (t, i) { t.addEventListener("click", function () { show(i); }); });
    var prev = sec.querySelector("[data-tour-prev]"), next = sec.querySelector("[data-tour-next]");
    if (prev) prev.addEventListener("click", function () { show(active - 1); });
    if (next) next.addEventListener("click", function () { show(active + 1); });
    if (toggle) {
      if (reduce) toggle.classList.add("hidden");
      toggle.addEventListener("click", function () {
        stopped = !stopped;
        toggle.setAttribute("aria-pressed", String(!stopped));
        toggle.innerHTML = stopped ? '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' : '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
        schedule();
      });
    }
    var stageBtn = sec.querySelector(".tour-stage > button");
    if (stageBtn) stageBtn.addEventListener("click", function () { openViewer(items, active); });
    var area = slides[0].closest(".grid");
    area.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") { hover = true; schedule(); } });
    area.addEventListener("pointerleave", function () { hover = false; schedule(); });
    new IntersectionObserver(function (en) { inView = en[0].isIntersecting; schedule(); }, { threshold: 0.35 }).observe(sec);
    show(0);
  });

  if (window.GDI) window.GDI.initInteractions(document);
})();
