$('.shownews').mouseenter(function () {
    var $this = $(this);
    if (!$this.hasClass('panel-collapsed')) {
        $this.parents('.hidenMargin').find('#list-drop').slideDown(200);
        $this.addClass('panel-collapsed');

    } else {
        $this.parents('.hidenMargin').find('#list-drop').slideUp(200);
        $this.removeClass('panel-collapsed');
    }
})


$(function () {

    //click show dropdown search...
    $("#btnSearch").on("click", function () {
        $(".searchDrop").toggle(100);
    });
    //kích thức > 768 thì hide search...
    $(window).resize(function () {
        if ($(window).width() > 768) {
            $('.searchDrop').hide();
        }
        else {
            $('searchDrop').show();
        };
    });
});