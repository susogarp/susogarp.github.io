(function () {
    
    // Boolean that determines if clone navbar is currently visible
    var appended = false;

    // Original navbar element selection
    var navbarEl = document.getElementsByClassName('nav')[0];

    // Clone of the original navbar element
    var navbarClone = navbarEl.cloneNode(true);

    // HeightLimit = original navbar height
    var heightLimit = document.getElementsByClassName('nav')[0].offsetHeight;

    window.addEventListener('scroll', function () {
        var windowYPos = window.scrollY;

        // IF the Window Y pos is > than the height of
        // the navbar and appended = false
        if (windowYPos > heightLimit && appended === false) {
            // Add navbar clone element to the beginning of the body
            // Add the class 'nav-sticky' to the clone navbar element.
            // then set append = true.
            document.body.prepend(navbarClone);
            navbarClone.classList.add('nav-sticky');
            appended = true;
        }
        
        if (windowYPos - 50 < heightLimit && appended) {
            // If position window Y position is less than t
            // the height of navbar - 50,
            // remove clone navbar (navbarClone)
            // and set appended = false
            document.body.removeChild(navbarClone);
            appended = false;
        }
    }, false);
}());