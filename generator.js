/* Wapkiz All-in-One Generator v2
 * Namespaced functions avoid collisions between Movie and Theme forms.
 * Browser-side TMDB key is visible to visitors. Replace/restrict it before production.
 */
(function (global) {
  "use strict";

  var WKG = global.WapkizGenerator = global.WapkizGenerator || {};
  WKG.config = {
    tmdbApiKey: "241f3ce228196a68cc8d338aedcdc094",
    tmdbImageBase: "https://image.tmdb.org/t/p/w500"
  };

  WKG.escapeHTML = function (value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  WKG.get = function (root, selector) {
    return (root || document).querySelector(selector);
  };

  WKG.value = function (root, selector) {
    var el = WKG.get(root, selector);
    return el ? String(el.value || "").trim() : "";
  };

  WKG.selectedText = function (select) {
    return select && select.selectedIndex >= 0 && select.options[select.selectedIndex]
      ? String(select.options[select.selectedIndex].text || "").trim() : "";
  };

  WKG.setSelectValue = function (select, value) {
    if (!select || !value) return;
    var wanted = String(value).trim().toLowerCase();
    for (var i = 0; i < select.options.length; i++) {
      if (String(select.options[i].text).trim().toLowerCase() === wanted ||
          String(select.options[i].value).trim().toLowerCase() === wanted) {
        select.selectedIndex = i;
        return;
      }
    }
    var option = document.createElement("option");
    option.text = value;
    option.value = value;
    select.add(option);
    select.value = value;
  };

  WKG.formatDuration = function (minutes) {
    minutes = parseInt(minutes || 0, 10);
    if (!minutes) return "";
    var h = Math.floor(minutes / 60), m = minutes % 60;
    return h && m ? h + "h " + m + "m" : (h ? h + "h" : m + "m");
  };

  WKG.languages = {
    hi:"Hindi", en:"English", bn:"Bengali", ta:"Tamil", te:"Telugu",
    ml:"Malayalam", kn:"Kannada", pa:"Punjabi", mr:"Marathi", gu:"Gujarati",
    or:"Odia", ne:"Nepali", zh:"Chinese", ja:"Japanese", ko:"Korean",
    es:"Spanish", fr:"French", de:"German", it:"Italian", ru:"Russian",
    ar:"Arabic", pt:"Portuguese", tr:"Turkish", th:"Thai", vi:"Vietnamese", id:"Indonesian"
  };

  WKG.tmdbSearch = function (opts) {
    opts = opts || {};
    var query = String(opts.query || "").trim();
    var type = opts.type === "tv" ? "tv" : "movie";
    if (!query) return Promise.reject(new Error("Movie / Series name likhiye."));
    if (!WKG.config.tmdbApiKey || WKG.config.tmdbApiKey === "REPLACE_WITH_TMDB_API_KEY") {
      return Promise.reject(new Error("generator.js mein TMDB API key set kijiye."));
    }
    var url = "https://api.themoviedb.org/3/search/" + type +
      "?api_key=" + encodeURIComponent(WKG.config.tmdbApiKey) +
      "&language=en-US&include_adult=false&query=" + encodeURIComponent(query);
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("TMDB HTTP " + r.status);
      return r.json();
    }).then(function (data) { return (data.results || []).slice(0, 8); });
  };

  WKG.tmdbDetails = function (id, type) {
    type = type === "tv" ? "tv" : "movie";
    var url = "https://api.themoviedb.org/3/" + type + "/" + encodeURIComponent(id) +
      "?api_key=" + encodeURIComponent(WKG.config.tmdbApiKey) +
      "&language=en-US&append_to_response=credits";
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("TMDB HTTP " + r.status);
      return r.json();
    });
  };

  WKG.fillMovieForm = function (form, data, type) {
    type = type === "tv" ? "tv" : "movie";
    var get = function (name) { return form.querySelector('[name="' + name + '"], #' + name); };
    var put = function (name, value) { var el = get(name); if (el && value != null) el.value = value; };
    var release = data.release_date || data.first_air_date || "";
    put("poster", data.poster_path ? WKG.config.tmdbImageBase + data.poster_path : "");
    put("date", release);
    put("des", data.overview || "");
    var cast = data.credits && data.credits.cast ? data.credits.cast.slice(0, 12).map(function (x) { return x.name; }).filter(Boolean).join(", ") : "";
    put("strcast", cast);
    var runtime = type === "movie" ? data.runtime : ((data.episode_run_time || [])[0] || 0);
    put("dur", WKG.formatDuration(runtime));
    var language = WKG.languages[data.original_language] || String(data.original_language || "").toUpperCase();
    WKG.setSelectValue(get("lng"), language);
    if (data.genres && data.genres.length) WKG.setSelectValue(get("genre"), data.genres.map(function (g) { return g.name; }).join(", "));
    var title = data.title || data.name || "";
    var year = release ? release.slice(0, 4) : "";
    var category = WKG.selectedText(get("blog_cat"));
    var quality = WKG.selectedText(get("qlt"));
    var lang = WKG.selectedText(get("lng"));
    var parts = [title, year, category, quality].filter(Boolean);
    parts.push(type === "tv" ? "Full Web Series Download" : "Full Movie Download");
    put("blog_title", parts.join(" "));
    form.dataset.tmdbOriginalTitle = title;
    form.dataset.tmdbYear = year;
    form.dataset.tmdbType = type;
  };

  WKG.addDownloadRow = function (container, kind) {
    if (!container) return;
    var row = document.createElement("div");
    row.className = "downloadRow";
    row.style.marginTop = "8px";
    var index = container.querySelectorAll(".downloadRow").length + 1;
    row.innerHTML = '<b class="row_title">Link ' + index + '</b><br>' +
      '<input type="url" class="extraDownloadLink" placeholder="URL" style="max-width:65%">' +
      '<input type="text" class="extraDownloadSize" placeholder="Size" style="width:80px">' +
      '<button type="button" class="removeRow">×</button>';
    row.querySelector(".removeRow").addEventListener("click", function () {
      row.remove();
      WKG.renumberRows(container);
    });
    container.appendChild(row);
  };

  WKG.renumberRows = function (container) {
    if (!container) return;
    Array.prototype.forEach.call(container.querySelectorAll(".downloadRow"), function (row, i) {
      var label = row.querySelector(".row_title");
      if (label) label.textContent = "Link " + (i + 1);
    });
  };

  WKG.movieDownloadHTML = function (form) {
    var container = form.querySelector(".downloadLinks");
    if (!container) container = document.getElementById("downloadLinks");
    if (!container) return "";
    var rows = container.querySelectorAll(".downloadRow"), out = "";
    var style = "display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#20B2AA;color:#fff!important;font-size:15px;font-weight:700;padding:10px 24px;border:1px solid #17A2B8;border-radius:8px;text-decoration:none!important;margin:6px 0";
    Array.prototype.forEach.call(rows, function (row, i) {
      var link = row.querySelector('input[name="link"]') || row.querySelector(".mainDownloadLink") || row.querySelector(".extraDownloadLink");
      var size = row.querySelector('input[name="size"]') || row.querySelector(".mainDownloadSize") || row.querySelector(".extraDownloadSize");
      var url = link ? link.value.trim() : "";
      if (!url) return;
      var sizeText = size && size.value.trim() ? " (" + WKG.escapeHTML(size.value.trim()) + ")" : "";
      out += '<div style="text-align:center;margin:4px 0"><a href="' + WKG.escapeHTML(url) +
        '" target="_blank" rel="noopener noreferrer" style="' + style + '"><i class="fa-solid fa-cloud-arrow-down"></i> Free Download Link ' +
        (i + 1) + sizeText + '</a></div>';
    });
    return out;
  };

  WKG.buildMoviePost = function (form) {
    var v = function (name) { return WKG.value(form, '[name="' + name + '"], #' + name); };
    var catEl = WKG.get(form, '[name="blog_cat"], #blog_cat');
    var category = WKG.selectedText(catEl);
    var title = v("blog_title"), poster = v("poster");
    var q = '"';
    var out = poster ? '<p class="showimage"><img class="absmiddle" src="' + WKG.escapeHTML(poster) +
      '" height="260" width="220" alt="' + WKG.escapeHTML(title) + '"/></p>' : "";
    out += '<h2 class="header"><i class="fa-solid fa-bars-staggered"></i> Movie Information</h2><div class="description1">' +
      '<div class="catlist"><b>Movie Name:</b> <font color="#D2691E">' + WKG.escapeHTML(title) + '</font></div>' +
      '<div class="catlist"><b>Genre:</b> <font color="#311DD6">' + WKG.escapeHTML(v("genre")) + '</font></div>' +
      '<div class="catlist"><b>Category:</b> <font color="red">' + WKG.escapeHTML(category) + '</font></div></div>' +
      '<div class="catlist"><b>Starcast:</b> <font color="green">' + WKG.escapeHTML(v("strcast")) + '</font></div>' +
      '<div class="catlist"><b>Release Date:</b> ' + WKG.escapeHTML(v("date")) + '</div>' +
      '<div class="catlist"><b>Duration:</b> ' + WKG.escapeHTML(v("dur")) + '</div>' +
      '<div class="catlist"><b>Quality:</b> ' + WKG.escapeHTML(v("qlt")) + '</div>' +
      '<div class="catlist"><b>Language:</b> ' + WKG.escapeHTML(v("lng")) + '</div>' +
      '<div class="catlist"><b>Description:</b> ' + WKG.escapeHTML(v("des")).replace(/\r?\n/g, "<br>") + '</div>' +
      '<h2 class="header">' + WKG.escapeHTML(title) + '</h2>' + WKG.movieDownloadHTML(form);
    var textField = WKG.get(form, '[name="text"], #text');
    if (textField) textField.value = out;
    return out;
  };

  WKG.toggleThemeLicense = function (form) {
    var license = WKG.value(form, '[name="license_type"], #license_type');
    var premium = license === "Premium";
    var priceBox = WKG.get(form, "#price_box");
    if (priceBox) priceBox.style.display = premium ? "block" : "none";
    var label = WKG.get(form, "#links_label");
    if (label) label.textContent = premium ? "Buy Links & Platforms (Premium):" : "Download Links (Free):";
    Array.prototype.forEach.call(form.querySelectorAll(".free_field"), function (x) { x.style.display = premium ? "none" : "inline"; });
    Array.prototype.forEach.call(form.querySelectorAll(".buy_field"), function (x) { x.style.display = premium ? "inline" : "none"; });
  };

  WKG.buildThemePost = function (form) {
    var v = function (name) { return WKG.value(form, '[name="' + name + '"], #' + name); };
    var title = v("blog_title"), poster = v("poster"), desc = v("des");
    var category = WKG.selectedText(WKG.get(form, '[name="blog_cat"], #blog_cat'));
    var type = v("file_type"), license = v("license_type"), price = v("price");
    if (!title || !poster) throw new Error("Title aur Poster URL zaroori hain.");
    if (license === "Premium" && !price) throw new Error("Premium item ke liye Price bhariye.");
    var out = poster ? '<p class="showimage"><img class="absmiddle" src="' + WKG.escapeHTML(poster) + '" height="260" width="220" alt="' + WKG.escapeHTML(title) + '"/></p>' : "";
    out += '<h2 class="header"><i class="fa-solid fa-circle-info"></i> Template / Script Information</h2><div class="description1">' +
      '<div class="catlist"><b>Name:</b> <font color="#D2691E">' + WKG.escapeHTML(title) + '</font></div>' +
      '<div class="catlist"><b>Category:</b> <font color="red">' + WKG.escapeHTML(category) + '</font></div>' +
      '<div class="catlist"><b>File Type:</b> ' + WKG.escapeHTML(type) + '</div>' +
      '<div class="catlist"><b>License / Price:</b> ' + WKG.escapeHTML(license) + ' (' + WKG.escapeHTML(license === "Premium" ? price : "FREE") + ')</div></div>';
    var features = form.querySelectorAll(".feat_item:checked");
    if (features.length) {
      out += '<div class="catlist"><b>Key Features:</b><ul>';
      Array.prototype.forEach.call(features, function (f) { out += '<li>' + WKG.escapeHTML(f.value) + '</li>'; });
      out += '</ul></div>';
    }
    if (desc) out += '<div class="catlist" style="width:100%;word-break:break-word"><b>Description:</b><br>' + WKG.escapeHTML(desc).replace(/\r?\n/g, "<br>") + '</div>';
    var demo = v("demo_url");
    if (demo) out += '<div style="text-align:center;margin:4px"><a href="' + WKG.escapeHTML(demo) + '" target="_blank" rel="noopener noreferrer">Live Demo</a></div>';
    var links = form.querySelectorAll(".downloadRow");
    if (links.length) {
      out += '<h2 class="header">' + (license === "Premium" ? "Purchase Options" : "Free Download Options") + '</h2>';
      Array.prototype.forEach.call(links, function (row, i) {
        var input = row.querySelector('[name="link"], .mainDownloadLink, .extraDownloadLink');
        var url = input ? input.value.trim() : "";
        if (!url) return;
        var size = row.querySelector('[name="size"], .mainDownloadSize, .extraDownloadSize');
        var label = license === "Premium" ? (row.querySelector("select") ? row.querySelector("select").value : "Buy Now") :
          ("Free Download Link " + (i + 1) + (size && size.value.trim() ? " (" + size.value.trim() + ")" : ""));
        out += '<div style="text-align:center;margin:4px"><a href="' + WKG.escapeHTML(url) + '" target="_blank" rel="noopener noreferrer">' + WKG.escapeHTML(label) + '</a></div>';
      });
    }
    var textField = WKG.get(form, '[name="text"], #text');
    if (textField) textField.value = out;
    return out;
  };

  WKG.initTMDBWidget = function (form) {
    var searchInput = form.querySelector("#tmdbSearch");
    var typeInput = form.querySelector("#tmdbType");
    var results = form.querySelector("#tmdbResults");
    var status = form.querySelector("#tmdbStatus");
    var button = form.querySelector("[data-tmdb-search]");
    if (!searchInput || !typeInput || !results || !status || !button) return;
    function search() {
      results.innerHTML = "";
      status.textContent = "Searching TMDB…";
      WKG.tmdbSearch({query: searchInput.value, type: typeInput.value}).then(function (items) {
        status.textContent = items.length ? "Select a result:" : "No result found.";
        items.forEach(function (item) {
          var type = typeInput.value === "tv" ? "tv" : "movie";
          var title = item.title || item.name || "Unknown";
          var date = item.release_date || item.first_air_date || "";
          var row = document.createElement("button");
          row.type = "button";
          row.className = "tmdbResult";
          row.textContent = title + (date ? " (" + date.slice(0,4) + ")" : "");
          row.addEventListener("click", function () {
            status.textContent = "Fetching details…";
            WKG.tmdbDetails(item.id, type).then(function (data) {
              WKG.fillMovieForm(form, data, type);
              results.innerHTML = "";
              status.textContent = "Auto-fill complete ✓";
            }).catch(function (err) { status.textContent = err.message; });
          });
          results.appendChild(row);
        });
      }).catch(function (err) { status.textContent = err.message; });
    }
    button.addEventListener("click", search);
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); search(); }
    });
  };

  WKG.init = function () {
    document.querySelectorAll("form[data-wkg-movie]").forEach(function (form) {
      WKG.initTMDBWidget(form);
      var add = form.querySelector("[data-add-download]");
      if (add) add.addEventListener("click", function () {
        WKG.addDownloadRow(form.querySelector(".downloadLinks"), "movie");
      });
      form.addEventListener("submit", function (e) {
        try { WKG.buildMoviePost(form); }
        catch (err) { e.preventDefault(); alert(err.message); }
      });
    });
    document.querySelectorAll("form[data-wkg-theme]").forEach(function (form) {
      var license = form.querySelector("#license_type");
      if (license) {
        WKG.toggleThemeLicense(form);
        license.addEventListener("change", function () { WKG.toggleThemeLicense(form); });
      }
      var add = form.querySelector("[data-add-download]");
      if (add) add.addEventListener("click", function () {
        WKG.addDownloadRow(form.querySelector(".downloadLinks"), "theme");
      });
      form.addEventListener("submit", function (e) {
        try { WKG.buildThemePost(form); }
        catch (err) { e.preventDefault(); alert(err.message); }
      });
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", WKG.init);
  else WKG.init();
})(window);
