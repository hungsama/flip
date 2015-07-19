$(document).ready(function() {
  var width = window.innerWidth || document.documentElement.clientWidth;
  // alert('hihi');
    //hover item 
    // jQuery( ".hidenMargin" )
    // .mouseenter(function() {
    //     alert('ok');
    //     jQuery(this).find(".list-news").slideDown(200);
    // })
    // .mouseleave(function() {
    //     alert('nanvai');
    //     jQuery(this).find(".list-news").slideUp(200);
    // });

    //click show dropdown search...
    jQuery("#btnSearch").on("click", function () {
        jQuery(".searchDrop").toggle(100);
    });
    // 

    jQuery(".has-notification > a").on("click", function () {
        jQuery(".setting-wrap").removeClass("active");
        jQuery(this).next().toggleClass("active");
        return false;
    });
    jQuery(".settings_menu.test > a.avatarmr").on("click", function () {
        // alert('hiihi');
        jQuery(".notification").removeClass("active");
        jQuery(this).next().toggleClass("active");
        return false;
    });
    // jQuery("body").on("click", function () {
    //     jQuery(".notification").removeClass("active");
    // });
    // $('#comments-container').comments({
    //     profilePictureURL: 'https://app.viima.com/static/media/user_profiles/user-icon.png',
    //     roundProfilePictures: true,
    //     textareaRows: 1,
    //     getComments: function(success, error) {
    //         setTimeout(function() {
    //             success(commentsArray);
    //         }, 500);
    //     },
    //     putComment: function(data, success, error) {
    //       setTimeout(function() {
    //         success(data);
    //       }, 200)
    //     },
    //     deleteComment: function(data, success, error) {
    //       setTimeout(function() {
    //         success();
    //       }, 200)
    //     },
    //     upvoteComment: function(data, success, error) {
    //       setTimeout(function() {
    //         success(data);
    //       }, 200)
    //     }
    // });
    //kích thức > 768 thì hide search...
    $(window).resize(function () {
        if (jQuery(window).width() > 768) {
            jQuery('.searchDrop').hide();
        }
        else {
            jQuery('searchDrop').show();
        };
    });
});



