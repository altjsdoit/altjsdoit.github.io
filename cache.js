window.applicationCache.addEventListener('updateready', function(ev) {
  if (window.applicationCache.status === window.applicationCache.UPDATEREADY) {
    window.applicationCache.swapCache();
    return alert('A new version of this site is available. Please save project and reload.');
  }
});
