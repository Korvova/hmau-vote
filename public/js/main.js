document.addEventListener('DOMContentLoaded', function () {


    //  JS slide
    let slideUp = (target, duration = 500) => {
        target.style.transitionProperty = 'height, margin, padding';
        target.style.transitionDuration = duration + 'ms';
        target.style.boxSizing = 'border-box';
        target.style.height = target.offsetHeight + 'px';
        target.offsetHeight;
        target.style.overflow = 'hidden';
        target.style.height = 0;
        target.style.paddingTop = 0;
        target.style.paddingBottom = 0;
        target.style.marginTop = 0;
        target.style.marginBottom = 0;
        window.setTimeout(() => {
            target.style.display = 'none';
            target.style.removeProperty('height');
            target.style.removeProperty('padding-top');
            target.style.removeProperty('padding-bottom');
            target.style.removeProperty('margin-top');
            target.style.removeProperty('margin-bottom');
            target.style.removeProperty('overflow');
            target.style.removeProperty('transition-duration');
            target.style.removeProperty('transition-property');
            //alert("!");
        }, duration);
    }

    let slideDown = (target, duration = 500) => {
        target.style.removeProperty('display');
        let display = window.getComputedStyle(target).display;

        if (display === 'none')
            display = 'block';

        target.style.display = display;
        let height = target.offsetHeight;
        target.style.overflow = 'hidden';
        target.style.height = 0;
        target.style.paddingTop = 0;
        target.style.paddingBottom = 0;
        target.style.marginTop = 0;
        target.style.marginBottom = 0;
        target.offsetHeight;
        target.style.boxSizing = 'border-box';
        target.style.transitionProperty = "height, margin, padding";
        target.style.transitionDuration = duration + 'ms';
        target.style.height = height + 'px';
        target.style.removeProperty('padding-top');
        target.style.removeProperty('padding-bottom');
        target.style.removeProperty('margin-top');
        target.style.removeProperty('margin-bottom');
        window.setTimeout(() => {
            target.style.removeProperty('height');
            target.style.removeProperty('overflow');
            target.style.removeProperty('transition-duration');
            target.style.removeProperty('transition-property');
        }, duration);
    }
    var slideToggle = (target, duration = 500) => {
        if (window.getComputedStyle(target).display === 'none') {
            return slideDown(target, duration);
        } else {
            return slideUp(target, duration);
        }
    }

    // header__menu
    const menuChildren = document.querySelectorAll('.header__menu .menu-children');

    menuChildren.forEach(function (item) {
        const link = item.querySelector('.menu-children > a');
        const subMenu = item.querySelector('.sub-menu');

        link.addEventListener('click', function (e) {
            e.preventDefault();
            slideToggle(subMenu, 200);
        });
    });

    // context menu for three-dots (delegated to document for SPA navigation)
    const closeAllUserMenus = () => {
        document.querySelectorAll('.user__nav .user__button.active').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.user__nav .nav__links').forEach(ul => {
            if (window.getComputedStyle(ul).display !== 'none') {
                slideUp(ul, 200);
            }
        });
    };

    document.addEventListener('click', function (e) {
        const button = e.target.closest('.user__nav .user__button');

        // click on three-dots button
        if (button) {
            e.stopPropagation();
            const currentList = button.nextElementSibling;
            const isActive = button.classList.contains('active');

            // close others
            document.querySelectorAll('.user__nav .user__button').forEach(b => {
                if (b !== button) b.classList.remove('active');
            });
            document.querySelectorAll('.user__nav .nav__links').forEach(ul => {
                if (ul !== currentList && window.getComputedStyle(ul).display !== 'none') {
                    slideUp(ul, 200);
                }
            });

            if (!isActive) {
                button.classList.add('active');
                slideDown(currentList, 200);
            } else {
                button.classList.remove('active');
                slideUp(currentList, 200);
            }
            return;
        }

        // click outside any open menu
        if (!e.target.closest('.user__nav .nav__links')) {
            closeAllUserMenus();
        }
    });

    // close on ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeAllUserMenus();
        }
    });

    // custom date/time
    flatpickr(".datetime", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        locale: "ru",
        defaultDate: new Date() 
    });

});