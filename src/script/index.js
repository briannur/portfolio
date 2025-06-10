var pckry;

let typingSpeed = 200;
let countdown = 2000;
let timer;
let isPaused = false;

function adjustGridItemSizes() {
    $('.grid-item').each(function() {
        const $item = $(this);
        const $label = $item.find('label');
        if ($label.length === 0) return;

        let $measureTarget = $label;

        if (!$item.is(':visible')) {
            $measureTarget = $label.clone()
                .css({
                    visibility: 'hidden',
                    position: 'absolute',
                    display: 'block',
                    left: '-9999px',
                    top: '-9999px',
                    pointerEvents: 'none',
                    opacity: 0,
                    zIndex: -9999,
                })
                .attr('aria-hidden', 'true')
                .appendTo('body');
        }

        const rect = $measureTarget[0].getBoundingClientRect();

        $item.css({
            width: rect.width + 'px',
            height: rect.height + 'px',
        });

        if ($measureTarget !== $label) {
            $measureTarget.remove();
        }
    });
}

// function removeOverflowingItems() {
    // var gridRect = $('#grid')[0].getBoundingClientRect();

    // $('.grid-item').each(function() {
        // var itemRect = this.getBoundingClientRect();
        // if (
            // itemRect.bottom > gridRect.bottom ||
            // itemRect.right > gridRect.right
        // ) {
            // $(this).hide();
        // }
    // });
// }

function doPackeryLayout() {
    if (pckry) {
        adjustGridItemSizes();
        pckry.layout();
        // removeOverflowingItems();
    } else {
        console.warn('Packery instance not initialized yet');
    }
}

function typeText($label, text, doneCallback) {
    let index = 0;
    $label.removeClass('blinking-cursor').text('');

    function type() {
        if (index <= text.length) {
            $label.text(text.substring(0, index));
            index++;
            setTimeout(type, typingSpeed);
        } else {
            $label.addClass('blinking-cursor');
            if (doneCallback) doneCallback();
        }
    }
    type();
}

function rotateGridItem() {
    if (isPaused) return;
    clearTimeout(timer);

    $('.grid-item label')
        .removeClass('blinking-cursor')
        .each(function() {
            const fullText = $(this).data('original-text');
            if (fullText) $(this).text(fullText);
        });

    const $visibleItems = $('.grid-item:visible');
    const $hiddenItems = $('.grid-item:hidden');

    if ($visibleItems.length === 0 || $hiddenItems.length === 0) {
        timer = setTimeout(rotateGridItem, countdown);
        return;
    }

    const $itemToHide = $visibleItems.eq(Math.floor(Math.random() * $visibleItems.length));

    $itemToHide.animate({
        opacity: 0
    }, 500, 'swing', function() {
        $itemToHide.addClass('hidden').css('opacity', '');
        pckry.layout();
    });

    const $itemToShow = $hiddenItems.eq(Math.floor(Math.random() * $hiddenItems.length));
    const $label = $itemToShow.find('label');

    if (!$label.data('original-text')) {
        $label.data('original-text', $label.text());
    }
    const textToType = $label.data('original-text');

    $itemToShow.removeClass('hidden').css('opacity', 0).appendTo('#grid');

    pckry.layout();

    $label.css('opacity', 0);
    $label.text('');
    $label.css('opacity', 1);

    $itemToShow.animate({
        opacity: 1
    }, 500, 'swing', function() {
        typeText($label, textToType, () => {
            timer = setTimeout(rotateGridItem, countdown);
        });
    });
}

function stopRotation() {
    if (!isPaused) {
        isPaused = true;
        clearTimeout(timer);
        timer = null;
    }
}

function resumeRotation() {
    if (isPaused) {
        isPaused = false;
        if (!timer) {
            timer = setTimeout(rotateGridItem, countdown);
        }
    }
}

function map(val, minA, maxA, minB, maxB) {
    return minB + ((val - minA) * (maxB - minB)) / (maxA - minA);
}

function Card3D($card, ev) {
    let $img = $card.find('img');
    let imgRect = $card[0].getBoundingClientRect();
    let width = imgRect.width;
    let height = imgRect.height;
    let offset = $card.offset();
    let mouseX = ev.pageX - offset.left;
    let mouseY = ev.pageY - offset.top;
    let rotateY = map(mouseX, 0, width, -25, 25);
    let rotateX = map(mouseY, 0, height, 25, -25);
    let brightness = map(mouseY, 0, height, 1.5, 0.5);

    $img.css({
        transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        filter: `brightness(${brightness})`
    });
}

$(document).ready(function() {
    // Navbar
    const menuBtn = $('button[aria-controls="mobile-menu"]');
    const mobileMenu = $('#mobile-menu');
    const icons = menuBtn.find('svg');

    menuBtn.on('click', function() {
        mobileMenu.toggleClass('hidden');
        icons.toggleClass('hidden');
    });

    mobileMenu.addClass('hidden');

    $('.nav-menu').on('click', function (e) {
      e.preventDefault();
      const target = $($(this).attr('href'));
      if (target.length) {
        $('html, body').animate({
          scrollTop: target.offset().top
        }, 600);
      }
    });

    // Grid setup
    adjustGridItemSizes();

    var $grid = $('#grid');
    pckry = new Packery($grid[0], {
        itemSelector: '.grid-item',
        gutter: 0,
        percentPosition: true,
        originLeft: false
    });

    pckry.once('layoutComplete', function() {
        $grid.css('opacity', '1');
        $('body').removeClass('loading');
        resumeRotation();

        $(function() {
            anime({
                targets: '#head-profile-container',
                opacity: [0, 1],
                translateY: [50, 0],
                duration: 450,
                easing: 'easeInOutQuad',
            });
        });
    });

    // removeOverflowingItems();
    timer = setTimeout(rotateGridItem, countdown);
    stopRotation();

    $(window).on('resize', function() {
        stopRotation();
        doPackeryLayout();
        resumeRotation();
    })

    $(window).on('scroll resize', function() {
        const scrollTop = $(window).scrollTop();
        const windowHeight = $(window).height();

        // Existing logic
        if (!isPaused && scrollTop - windowHeight > 0) {
            stopRotation();
        } else {
            resumeRotation();
        }

        // Nav section highlighting
        $('main > section').each(function() {
            const top = $(this).offset().top - 100;
            const bottom = top + $(this).outerHeight();
            const id = $(this).attr('id');

            if (scrollTop >= top && scrollTop < bottom) {
                $('.nav-menu').removeClass('bg-gray-900 text-white')
                            .addClass('text-gray-300 hover:bg-gray-700 hover:text-white');

                $(`.nav-menu[href="#${id}"]`)
                    .addClass('bg-gray-900 text-white')
                    .removeClass('text-gray-300 hover:bg-gray-700 hover:text-white');
            }
        });

    }).trigger('scroll');

    $('#typograph-anim-toggle').on('click', function() {
        const $this = $(this);
        const current = $this.attr('data-animation');

        if (current === 'play') {
            $this.attr('data-animation', 'pause');
            stopRotation();
        } else {
            $this.attr('data-animation', 'play');
            resumeRotation();
        }
    });


    // About me
    $('.card3d').on('mousemove', function(ev) {
        Card3D($(this), ev);
    });

    $('.card3d').on('mouseleave', function() {
        let $img = $(this).find('img');
        $img.css({
            transform: 'rotateX(0deg) rotateY(0deg)',
            filter: 'brightness(1)'
        });
    });

    // My Project
    $(".project").each(function() {
        const $project = $(this);
        const $head = $project.find(".project-head");
        const $content = $project.find(".project-content");
        const $items = $content.find(".project-item");
        const $icon = $project.find(".project-toggle-icon");

        $head.css("position", "relative").css("cursor", "pointer");

        $head.attr("data-open", "false");

        const showFolderContentAnimation = anime.timeline({
            easing: "easeOutCubic",
            autoplay: false,
            duration: 300
        });

        showFolderContentAnimation
            .add({
                targets: $content.get(0),
                height: [0, $content.get(0).scrollHeight]
            })
            .add({
                targets: $items.get(),
                translateY: [20, 0],
                opacity: [0, 1],
                delay: (el, i) => i * 120
            }, "-=275");

        $head.on("click", function() {
            const isOpen = $(this).attr("data-open") === "true";

            if (isOpen) {
                if (!showFolderContentAnimation.reversed) showFolderContentAnimation.reverse();
                showFolderContentAnimation.play();
                showFolderContentAnimation.finished.then(() => {
                    $icon.removeClass("rotate-180");
                });
                $(this).attr("data-open", "false");
            } else {
                if (showFolderContentAnimation.reversed) showFolderContentAnimation.reverse();
                showFolderContentAnimation.play();
                $icon.addClass("rotate-180");
                $(this).attr("data-open", "true");
            }
        });

        showFolderContentAnimation.finished.then(() => {
            if (showFolderContentAnimation.reversed) {
                showFolderContentAnimation.reverse();
            }
        });
    });

    // Footer modal
    $("#licensing-modal-trigger").click(function(e) {
        e.preventDefault();
        $("#licensing-modal").removeClass("hidden").addClass("flex");
    });

    $("#close-modal").click(function() {
        $("#licensing-modal").addClass("hidden").removeClass("flex");
    });

    $(window).click(function(e) {
        if ($(e.target).is("#licensing-modal")) {
            $("#licensing-modal").addClass("hidden").removeClass("flex");
        }
    });
});