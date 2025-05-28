var pckry;

let typingSpeed = 200;
let countdown = 2000;
let timer;
let isPaused = false;

function adjustGridItemSizes() {
  $('.grid-item').each(function () {
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

function removeOverflowingItems() {
  var gridRect = $('#grid')[0].getBoundingClientRect();

  $('.grid-item').each(function () {
    var itemRect = this.getBoundingClientRect();
    if (
      itemRect.bottom > gridRect.bottom ||
      itemRect.right > gridRect.right
    ) {
      $(this).hide();
    }
  });
}

function doPackeryLayout() {
  if (pckry) {
    adjustGridItemSizes();
    pckry.layout();
	removeOverflowingItems();
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
		.each(function () {
			const fullText = $(this).data('original-text');
			if (fullText) $(this).text(fullText);
		});

	const $visibleItems = $('.grid-item:visible');
	const $hiddenItems = $('.grid-item:hidden');

	if ($visibleItems.length === 0 || $hiddenItems.length === 0) {
		// Avoid doing anything if either list is empty
		timer = setTimeout(rotateGridItem, countdown);
		return;
	}

	// Pick one visible item to hide
	const $itemToHide = $visibleItems.eq(Math.floor(Math.random() * $visibleItems.length));

	$itemToHide.animate({ opacity: 0 }, 500, 'swing', function () {
	  $itemToHide.addClass('hidden').css('opacity', '');
	});

	// Pick one hidden item to show and animate
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

	$itemToShow.animate({ opacity: 1 }, 500, 'swing', function () {
	  typeText($label, textToType, () => {
		timer = setTimeout(rotateGridItem, countdown);
	  });
	});
}


function stopRotation() {
	if (isPaused) return;
  clearTimeout(timer);
  isPaused = true;
  console.log('paused');
}

function resumeRotation() {
  if (!isPaused) return;
  isPaused = false;
  timer = setTimeout(rotateGridItem, countdown);
  console.log('resumed');
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

$(document).ready(function () {

  // Navbar
  const menuBtn = $('button[aria-controls="mobile-menu"]');
  const mobileMenu = $('#mobile-menu');
  const icons = menuBtn.find('svg');

  menuBtn.on('click', function () {
    mobileMenu.toggleClass('hidden');
    icons.toggleClass('hidden');
  });

  mobileMenu.addClass('hidden');

  // Grid setup
  adjustGridItemSizes();

  var $grid = $('#grid');
  pckry = new Packery($grid[0], {
    itemSelector: '.grid-item',
    gutter: 0,
    percentPosition: true,
    originLeft: false
  });

	pckry.once('layoutComplete', function () {
	  $grid.css('opacity', '1');
	});
  
  removeOverflowingItems();
  
  timer = setTimeout(rotateGridItem, countdown);

	$(window).on('resize', function () {
		stopRotation();
		doPackeryLayout();
		resumeRotation();
	})
  
  $(window).on('scroll resize', function () {
	  const scrollTop = $(window).scrollTop();
	  const headerOffset = $('header').offset().top;
	  const headerHeight = $('header').outerHeight();
	  const windowHeight = $(window).height();

	  if (scrollTop - windowHeight > 0) {
		stopRotation();
	  } else {
		resumeRotation();
	  }
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
  $('.card3d').on('mousemove', function (ev) {
	  Card3D($(this), ev);
	});

	$('.card3d').on('mouseleave', function () {
	  let $img = $(this).find('img');
	  $img.css({
		transform: 'rotateX(0deg) rotateY(0deg)',
		filter: 'brightness(1)'
	  });
	});

	// My Project
	
	// Footer modal
	$("#licensing-modal-trigger").click(function (e) {
      e.preventDefault();
      $("#licensing-modal").removeClass("hidden").addClass("flex");
    });

    $("#close-modal").click(function () {
      $("#licensing-modal").addClass("hidden").removeClass("flex");
    });

    $(window).click(function (e) {
      if ($(e.target).is("#licensing-modal")) {
        $("#licensing-modal").addClass("hidden").removeClass("flex");
      }
    });
});
