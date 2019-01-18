;(function() {

  this.unveil = function(threshold, callback){
    var w = window,
        th = threshold || 0,
        images = [].slice.call(document.querySelectorAll("img.unveil"));
        
    if ("IntersectionObserver" in window && "IntersectionObserverEntry" in window && "intersectionRatio" in window.IntersectionObserverEntry.prototype) {
      document.addEventListener("DOMContentLoaded", function() {
        let options = {
          rootMargin: `${threshold}px 0px`
        }
        let lazyImageObserver = new IntersectionObserver(unveil, options);

        images.forEach(function(img) {
          lazyImageObserver.observe(img);
        });
      });
    
      function unveil(changes, observer) {
        changes.forEach(function(change) {
          if (change.isIntersecting) {
            let img = change.target;
            img.src = img.dataset.src;
            img.srcset = img.dataset.srcset;
            img.classList.remove("unveil");
            observer.unobserve(img);
            if (typeof callback === "function") callback.call(img);
          }
        });
      }
      
    } else {

      console.log('Intersection API not supported!');
      // Fallback to vanilla-js rewrite of 'unveil.js' http://luis-almeida.github.io/unveil/

      // test for browser support of `once` option for events
      // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Safely_detecting_option_support
      var onceSupported = false;
      try {
        var options = {
          get once() {
            onceSupported = true;
          }
        };
        w.addEventListener("test", options, options);
        w.removeEventListener("test", options, options);
      } catch(err) {
        onceSupported = false;
      }

      images.forEach(function(image){
        image.addEventListener('unveil', function(){ 
          var img = this;
          var source = img.getAttribute("data-src");
          var sourceset = img.getAttribute("data-srcset")
          img.setAttribute("src", source);
          if (sourceset) {
            img.setAttribute("srcset", sourceset);
          };
          img.classList.remove("unveil");
          if (typeof callback === "function") callback.call(img);
        }, onceSupported ? { once: true } : false);
      });

      var debouncedUnveil = debounce(unveil, 100);

      function unveil() {
        // create an array of images that are in view
        // by filtering the intial array
        var inview = images.filter(function(img) {
          // if the image is set to display: none
          if (img.style.display === "none") return;

          var rect = img.getBoundingClientRect(), 
              wt = window.scrollY, // window vertical scroll distance
              wb = wt + w.innerHeight, // last point of document visible in browser window
              et = wt + rect.top, // distance from document top to top of element
              eb = wt + rect.bottom; // distance from top of document to bottom of element

          // the bottom of the element is below the top of the browser (- threshold)
          // && the top of the element is above the bottom of the browser (+ threshold)
          return eb >= wt - th && et <= wb + th;
        });

        if (w.CustomEvent) {
          var unveilEvent = new CustomEvent('unveil');
        } else {
          var unveilEvent = document.createEvent('CustomEvent');
          unveilEvent.initCustomEvent('unveil', true, true);
        }

        inview.forEach(function(inviewImage){
          inviewImage.dispatchEvent(unveilEvent);
        });
        // alternative -- two arrays: https://stackoverflow.com/questions/11731072/dividing-an-array-by-filter-function
        // another possibility -- use getElementsByClassName which returns _live_ HTML Collection
        // https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByClassName
        images = [].slice.call(document.querySelectorAll("img.unveil"));
      }

      // https://davidwalsh.name/javascript-debounce-function
      // from underscore.js
      function debounce(func, wait, immediate) {
        var timeout;
        return function() {
          var context = this, 
              args = arguments;
          var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
          };
          var callNow = immediate && !timeout;
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
          if (callNow) func.apply(context, args);
        };
      };

      w.addEventListener('scroll', debouncedUnveil);
      w.addEventListener('resize', debouncedUnveil);

      unveil();
    }

  }
}());


