/*=====================================================
Template Name   : Constux
Description     : Construction HTML5 Template
Author          : Themesland
Version         : 1.0
=======================================================*/


(function ($) {
    

    // wow init
    new WOW().init();

    // scroll to top

    
    // navbar fixed top
    $(window).scroll(function () {
        if ($(this).scrollTop() > 50) {
            $('.navbar').addClass("fixed-top");
        } else {
            $('.navbar').removeClass("fixed-top");
        }
    });

 

})(jQuery);










